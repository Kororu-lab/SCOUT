// 확장 프로그램 설치 시 초기화
chrome.runtime.onInstalled.addListener(() => {
  // 컨텍스트 메뉴 추가
  chrome.contextMenus.create({
    id: "crawlFullPage",
    title: "전체 페이지 크롤링 코드 생성",
    contexts: ["page"]
  });

  chrome.contextMenus.create({
    id: "crawlSelection",
    title: "선택한 부분 크롤링 코드 생성",
    contexts: ["selection"]
  });

  // 기본 설정값 저장
  chrome.storage.sync.set({
    apiKey: "",
    apiEndpoint: "https://api.deepseek.com/v1/chat/completions",
    defaultLanguage: "python"
  });
});

// 컨텍스트 메뉴 클릭 처리
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "crawlFullPage") {
    chrome.tabs.sendMessage(tab.id, {
      action: "captureFullPage"
    });
  } else if (info.menuItemId === "crawlSelection") {
    chrome.tabs.sendMessage(tab.id, {
      action: "captureSelection"
    });
  }
});

// 콘텐츠 스크립트로부터 메시지 수신
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "processHtml") {
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
        
        const prompt = `현재 웹페이지에 대한 크롤링 코드를 생성해주세요. 
코드 언어: ${codeLanguage}
페이지 URL: ${sender.tab.url}
크롤링 요구사항: ${userQuery}
${selectionInfo}

다음은 페이지의 HTML 구조입니다:
${htmlContent}

다음 형식으로 응답해주세요:
1. 요구사항에 맞는 ${codeLanguage} 크롤링 코드
2. 코드에 대한 간단한 설명`;

        // DeepSeek API 호출
        const response = await fetch(config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
          },
          body: JSON.stringify({
            model: "deepseek-coder",
            messages: [
              {
                "role": "user",
                "content": prompt
              }
            ],
            temperature: 0.3,
            max_tokens: 2000
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`API 오류: ${errorData.error?.message || response.statusText}`);
        }
        
        const result = await response.json();
        
        // API 응답에서 코드와 설명 추출
        const content = result.choices[0]?.message?.content || "API 응답 처리 오류";
        
        // 코드와 설명 분리
        let code = "";
        let explanation = "";
        
        // 코드 블록 추출 (```로 둘러싸인 부분)
        const codeMatch = content.match(/```(?:python|javascript|java|csharp)?\s*([\s\S]*?)```/);
        if (codeMatch && codeMatch[1]) {
          code = codeMatch[1].trim();
          explanation = content.replace(codeMatch[0], "").trim();
        } else {
          code = content;
        }
        
        sendResponse({ 
          success: true, 
          data: { 
            code: code,
            explanation: explanation
          }
        });
      } catch (error) {
        console.error("API 호출 오류:", error);
        sendResponse({ 
          success: false, 
          error: error.message || "API 호출 중 오류가 발생했습니다." 
        });
      }
    });
    
    return true; // 비동기 응답을 위해 true 반환
  }
});