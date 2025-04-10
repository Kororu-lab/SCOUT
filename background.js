// 확장 프로그램 설치 시 초기화
chrome.runtime.onInstalled.addListener(() => {
  // 컨텍스트 메뉴 생성
  createContextMenus();

  // 기본 설정값 저장
  chrome.storage.sync.get(["apiKey", "apiEndpoint", "defaultLanguage"], (config) => {
    // 기존 설정이 없는 경우에만 기본값 설정
    const newSettings = {
      apiKey: config.apiKey || "",
      apiEndpoint: config.apiEndpoint || "https://api.deepseek.com/v1/chat/completions",
      defaultLanguage: config.defaultLanguage || "python"
    };

    chrome.storage.sync.set(newSettings, () => {
      console.log("기본 설정 저장 완료:", newSettings);
    });
  });
});

// 확장 프로그램 시작 시 컨텍스트 메뉴 생성
chrome.runtime.onStartup.addListener(() => {
  createContextMenus();
});

// 컨텍스트 메뉴 생성 함수
function createContextMenus() {
  // 기존 메뉴 제거
  chrome.contextMenus.removeAll(() => {
    // 전체 페이지 크롤링 메뉴 추가
    chrome.contextMenus.create({
      id: "crawlFullPage",
      title: "전체 페이지 크롤링 코드 생성",
      contexts: ["page"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("전체 페이지 크롤링 메뉴 생성 오류:", chrome.runtime.lastError);
      }
    });

    // 선택 영역 크롤링 메뉴 추가
    chrome.contextMenus.create({
      id: "crawlSelection",
      title: "선택한 부분 크롤링 코드 생성",
      contexts: ["selection"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("선택 영역 크롤링 메뉴 생성 오류:", chrome.runtime.lastError);
      }
    });
  });
}

// 컨텍스트 메뉴 클릭 처리
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log("Context menu clicked:", info.menuItemId);
  
  // 특정 페이지에서는 작동하지 않도록 체크 (chrome:// 페이지 등)
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) {
    console.error("Cannot run on this page type:", tab.url);
    chrome.tabs.create({ url: "options/cannot_run.html" });
    return;
  }
  
  if (info.menuItemId === "crawlFullPage") {
    console.log("Sending captureFullPage message to tab:", tab.id);
    
    // 먼저 메시지 직접 전송 시도
    chrome.tabs.sendMessage(tab.id, {
      action: "captureFullPage"
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError);
        
        // 실패 시 content script 주입 후 재시도
        injectAndSendMessage(tab.id, "captureFullPage");
      } else if (response) {
        console.log("Received response:", response);
      }
    });
  } else if (info.menuItemId === "crawlSelection") {
    console.log("Sending captureSelection message to tab:", tab.id);
    
    // 먼저 메시지 직접 전송 시도
    chrome.tabs.sendMessage(tab.id, {
      action: "captureSelection"
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError);
        
        // 실패 시 content script 주입 후 재시도
        injectAndSendMessage(tab.id, "captureSelection");
      } else if (response) {
        console.log("Received response:", response);
      }
    });
  }
});

// Content script 주입 후 메시지 전송 함수
function injectAndSendMessage(tabId, action) {
  console.log("Injecting content script to tab:", tabId);
  
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ["content.js"]
  })
  .then(() => {
    console.log("Content script injected, sending message again");
    // 잠시 지연 후 메시지 재전송
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, {
        action: action
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error sending message after injection:", chrome.runtime.lastError);
        } else if (response) {
          console.log("Received response after injection:", response);
        }
      });
    }, 500); // 스크립트 초기화를 위한 지연
  })
  .catch(err => {
    console.error("Failed to inject content script:", err);
  });
}

// 콘텐츠 스크립트로부터 메시지 수신
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 콘텐츠 스크립트 로드 확인
  if (request.action === "contentScriptLoaded") {
    console.log("Content script loaded on tab:", sender.tab ? sender.tab.id : "unknown");
    sendResponse({ status: "acknowledged", tabId: sender.tab ? sender.tab.id : "unknown" });
    return true;
  }

  // 옵션 페이지 열기 처리
  if (request.action === "openOptionsPage") {
    chrome.runtime.openOptionsPage();
    return;
  }
  
  if (request.action === "processHtml") {
    console.log("Processing HTML request received");
    // DeepSeek API 호출 및 결과 처리
    chrome.storage.sync.get(["apiKey", "apiEndpoint", "defaultLanguage"], async (config) => {
      try {
        if (!config.apiKey) {
          sendResponse({ 
            success: false, 
            error: "API 키가 설정되지 않았습니다. 설정 페이지에서 DeepSeek API 키를 입력해주세요." 
          });
          return;
        }

        // HTML 내용 축약 (너무 큰 경우)
        let htmlContent = request.html;
        if (htmlContent.length > 50000) {
          htmlContent = htmlContent.substring(0, 50000) + "... (truncated)";
        }

        // 요청할 언어 설정
        const codeLanguage = config.defaultLanguage || "python";
        
        // 선택 영역 정보
        const selectionInfo = request.selectedText ? 
          `사용자가 선택한 요소의 XPath: ${request.selectedText.xpath}\nCSS 선택자: ${request.selectedText.cssSelector}` 
          : "전체 페이지를 크롤링합니다.";
        
        // 사용자 요구사항
        const userQuery = request.query || "페이지에서 중요한 정보를 추출해주세요.";
        
        const systemPrompt = "당신은 웹 크롤링 코드를 생성하는 전문가입니다. 사용자가 제공하는 HTML과 선택 요소를 분석하여 적절한 크롤링 코드를 생성해주세요.";
        
        const userPrompt = `현재 웹페이지에 대한 크롤링 코드를 생성해주세요. 
코드 언어: ${codeLanguage}
페이지 URL: ${sender.tab.url}
크롤링 요구사항: ${userQuery}
${selectionInfo}

다음은 페이지의 HTML 구조입니다:
${htmlContent}

다음 형식으로 응답해주세요:
1. 요구사항에 맞는 ${codeLanguage} 크롤링 코드
2. 코드에 대한 간단한 설명`;

        console.log("Sending request to DeepSeek API with language:", codeLanguage);
        
        // DeepSeek API 호출 - OpenAI와 호환되는 API 형식 사용
        // baseURL: https://api.deepseek.com/v1/chat/completions
        try {
          const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
              model: "deepseek-chat",  // Using the latest DeepSeek-V3 model
              messages: [
                {
                  "role": "system", 
                  "content": systemPrompt
                },
                {
                  "role": "user",
                  "content": userPrompt
                }
              ],
              temperature: 0.3,
              max_tokens: 4000,
              stream: false
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error("API error:", errorData);
            throw new Error(errorData.error?.message || response.statusText || "API 요청 실패");
          }

          // 응답 처리
          const responseData = await response.json();
          console.log("API Response:", responseData);
          
          // API 응답에서 코드와 설명 추출
          const content = responseData.choices?.[0]?.message?.content || "API 응답 처리 오류";
          
          // 코드와 설명 분리 및 마크다운 포맷팅
          let code = "";
          let explanation = "";
          
          // 코드 블록 추출 (```로 둘러싸인 부분)
          const codeMatch = content.match(/```(?:python|javascript|java|csharp)?\s*([\s\S]*?)```/);
          if (codeMatch && codeMatch[1]) {
            code = codeMatch[1].trim();
            // 설명 부분을 마크다운 형식으로 정리
            explanation = content
              .replace(codeMatch[0], "") // 코드 블록 제거
              .trim()
              // 헤더 정리
              .replace(/^(.*?)(?=\n|$)/gm, '### $1') // 첫 줄을 h3로
              .replace(/^설명:|^참고:|^주의:/gm, '### $&') // 주요 섹션을 h3로
              // 중요 포인트 강조
              .replace(/`([^`]+)`/g, '**`$1`**') // 인라인 코드를 볼드 처리
              .replace(/(참고|주의|중요):/g, '**$1:**') // 주요 키워드 볼드 처리
              // 리스트 포맷팅
              .replace(/^\d+\.\s/gm, '- ') // 숫자 리스트를 불릿으로 변환
              // 줄바꿈 보존
              .replace(/\n\n/g, '\n\n'); 
          } else {
            code = content;
            explanation = "코드에 대한 설명이 생성되지 않았습니다.";
          }
          
          console.log("Sending response back to content script");
          sendResponse({ 
            success: true, 
            data: { 
              code: code,
              explanation: explanation
            }
          });
          
        } catch (error) {
          console.error("API 요청 오류:", error);
          sendResponse({ 
            success: false, 
            error: error.message || "API 호출 중 오류가 발생했습니다." 
          });
        }
      } catch (outerError) {
        console.error("전체 처리 오류:", outerError);
        sendResponse({ 
          success: false, 
          error: outerError.message || "처리 중 오류가 발생했습니다." 
        });
      }
    });
    
    return true; // 비동기 응답을 위해 true 반환
  }
});