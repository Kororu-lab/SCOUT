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
      apiEndpoint: "https://api.deepseek.com/v1",
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
      chrome.storage.sync.get(["apiKey", "apiEndpoint"], async (config) => {
        try {
          const response = await fetch(`${config.apiEndpoint}/extract`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
              html: request.html,
              query: request.query,
              selectedText: request.selectedText || "",
              url: sender.tab.url
            })
          });
          
          const result = await response.json();
          sendResponse({ success: true, data: result });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        return true; // 비동기 응답을 위해 true 반환
      });
      return true; // 비동기 응답을 위해 true 반환
    }
  });