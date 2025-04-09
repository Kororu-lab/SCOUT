// 캡처한 HTML 및 선택 정보 저장
let capturedData = {
  html: "",
  selectedElement: null,
  selectedHtml: "",
  xpath: "",
  cssSelector: ""
};

// 초기화 함수 - 콘텐츠 스크립트가 로드되었는지 확인
function initializeContentScript() {
  console.log("SCOUT Content Script Initialized");
  
  // 확장 프로그램이 로드되었음을 백그라운드 스크립트에 알림
  chrome.runtime.sendMessage({ action: "contentScriptLoaded" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Error notifying background script:", chrome.runtime.lastError);
    } else if (response) {
      console.log("Background script acknowledged content script:", response);
    }
  });
}

// 페이지 로드 시 초기화 실행
document.addEventListener('DOMContentLoaded', initializeContentScript);

// 콘텐츠 스크립트가 이미 로드된 페이지에 주입될 경우를 위한 즉시 초기화
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initializeContentScript();
}

// 선택한 요소의 XPath 생성
function getElementXPath(element) {
  if (!element || element.nodeType !== 1) return "";
  
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }
  
  if (element === document.body) {
    return '/html/body';
  }
  
  let siblings = Array.from(element.parentNode.children).filter(
    sibling => sibling.tagName === element.tagName
  );
  
  let index = siblings.indexOf(element) + 1;
  
  return `${getElementXPath(element.parentNode)}/${element.tagName.toLowerCase()}[${index}]`;
}

// 선택한 요소의 CSS 선택자 생성
function getElementCssSelector(element) {
  if (!element || element.nodeType !== 1) return "";
  
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element === document.body) {
    return 'body';
  }
  
  // 클래스를 활용한 선택자 생성
  if (element.className) {
    const classes = element.className.split(/\s+/)
      .filter(cls => cls)
      .map(cls => `.${cls}`)
      .join('');
    
    if (classes && document.querySelectorAll(classes).length === 1) {
      return classes;
    }
  }
  
  // 부모 요소로부터의 경로 생성
  const parentSelector = getElementCssSelector(element.parentNode);
  return `${parentSelector} > ${element.tagName.toLowerCase()}`;
}

// UI 생성 함수
function createCrawlingUI(mode) {
  console.log("Creating crawling UI for mode:", mode);

  // 이미 존재하는 UI가 있다면 제거
  const existingUI = document.getElementById('crawling-assistant-ui');
  if (existingUI) {
    document.body.removeChild(existingUI);
    console.log("Removed existing UI");
  }
  
  // UI 컨테이너 생성
  const uiContainer = document.createElement('div');
  uiContainer.id = 'crawling-assistant-ui';
  uiContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 350px;
    background: white;
    border: 2px solid #4285f4;
    border-radius: 8px;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
    z-index: 2147483647;
    font-family: Arial, sans-serif;
    padding: 20px;
    transition: all 0.3s ease;
  `;
  
  // 헤더 생성
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
  `;
  
  const title = document.createElement('h3');
  title.textContent = mode === 'full' ? '전체 페이지 크롤링' : '선택 영역 크롤링';
  title.style.margin = '0';
  title.style.color = '#4285f4';
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'X';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    color: #666;
  `;
  closeBtn.onclick = () => document.body.removeChild(uiContainer);
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  uiContainer.appendChild(header);
  
  // 요구사항 입력 필드
  const queryLabel = document.createElement('label');
  queryLabel.textContent = '추가 요구사항 (어떤 데이터를 추출하고 싶으신가요?)';
  queryLabel.style.display = 'block';
  queryLabel.style.marginBottom = '5px';
  
  const queryInput = document.createElement('textarea');
  queryInput.style.cssText = `
    width: 100%;
    height: 80px;
    margin-bottom: 15px;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box;
    font-family: inherit;
  `;
  
  // 예시 요구사항 제공
  queryInput.placeholder = mode === 'full' 
    ? '예: 이 페이지의 모든 제품 이름, 가격, 평점을 CSV 파일로 저장해주세요.' 
    : '예: 선택한 테이블에서 모든 행의 데이터를 추출해 DataFrame으로 만들어주세요.';
  
  uiContainer.appendChild(queryLabel);
  uiContainer.appendChild(queryInput);
  
  // 선택 정보 표시 (선택 모드일 경우)
  if (mode === 'selection' && capturedData.selectedElement) {
    const selectionInfo = document.createElement('div');
    selectionInfo.style.marginBottom = '15px';
    
    const xpathDisplay = document.createElement('div');
    xpathDisplay.innerHTML = `<strong>XPath:</strong> <code>${capturedData.xpath}</code>`;
    xpathDisplay.style.marginBottom = '5px';
    xpathDisplay.style.wordBreak = 'break-all';
    xpathDisplay.style.fontSize = '12px';
    
    const cssDisplay = document.createElement('div');
    cssDisplay.innerHTML = `<strong>CSS 선택자:</strong> <code>${capturedData.cssSelector}</code>`;
    cssDisplay.style.wordBreak = 'break-all';
    cssDisplay.style.fontSize = '12px';
    
    selectionInfo.appendChild(xpathDisplay);
    selectionInfo.appendChild(cssDisplay);
    uiContainer.appendChild(selectionInfo);
  }
  
  // 제출 버튼
  const submitBtn = document.createElement('button');
  submitBtn.textContent = '크롤링 코드 생성';
  submitBtn.style.cssText = `
    background: #4285f4;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    width: 100%;
  `;
  
  submitBtn.onclick = () => {
    const additionalQuery = queryInput.value;
    submitBtn.textContent = '생성 중...';
    submitBtn.disabled = true;
    
    // API 요청 준비
    const requestData = {
      action: "processHtml",
      html: mode === 'full' ? document.documentElement.outerHTML : capturedData.selectedHtml,
      query: additionalQuery,
      selectedText: mode === 'selection' ? {
        xpath: capturedData.xpath,
        cssSelector: capturedData.cssSelector
      } : null,
      mode: mode
    };
    
    // 백그라운드 스크립트로 메시지 전송
    chrome.runtime.sendMessage(requestData, (response) => {
      if (response && response.success) {
        displayResult(response.data);
      } else {
        displayError(response ? response.error : '알 수 없는 오류가 발생했습니다.');
      }
      submitBtn.textContent = '크롤링 코드 생성';
      submitBtn.disabled = false;
    });
  };
  
  uiContainer.appendChild(submitBtn);
  
  // API 키 상태 확인 알림
  chrome.storage.sync.get(['apiKey'], (result) => {
    if (!result.apiKey || result.apiKey.trim() === '') {
      const apiKeyWarning = document.createElement('div');
      apiKeyWarning.style.cssText = `
        margin-top: 15px;
        padding: 10px;
        background: #fff3cd;
        color: #856404;
        border-radius: 4px;
        font-size: 12px;
      `;
      apiKeyWarning.innerHTML = '<strong>⚠️ 주의:</strong> DeepSeek API 키가 설정되지 않았습니다. ' +
        '확장 프로그램 아이콘을 클릭한 후 설정 버튼을 눌러 API 키를 입력해주세요.';
      uiContainer.appendChild(apiKeyWarning);
    }
  });
  
  // UI를 document에 추가
  try {
    document.body.appendChild(uiContainer);
    console.log("UI successfully added to document body");
    
    // 알림 표시 (잠시 후 사라짐)
    const notification = document.createElement('div');
    notification.textContent = mode === 'full' 
      ? '전체 페이지 크롤링 준비가 완료되었습니다.' 
      : '선택 영역 크롤링 준비가 완료되었습니다.';
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #4285f4;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      z-index: 2147483647;
      font-family: Arial, sans-serif;
    `;
    document.body.appendChild(notification);
    
    // 3초 후 알림 제거
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3000);
    
    // UI가 화면 밖으로 나가지 않도록 위치 조정
    const rect = uiContainer.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      uiContainer.style.right = 'auto';
      uiContainer.style.left = '20px';
    }
    if (rect.bottom > window.innerHeight) {
      uiContainer.style.top = 'auto';
      uiContainer.style.bottom = '20px';
    }
  } catch (error) {
    console.error("Failed to add UI to document:", error);
    // Fallback: 알림으로 오류 표시
    alert('UI 생성 중 오류가 발생했습니다. 페이지를 새로고침하고 다시 시도해주세요.');
  }
}

// 결과 표시 함수
function displayResult(data) {
  const uiContainer = document.getElementById('crawling-assistant-ui');
  if (!uiContainer) return;
  
  // 기존 컨텐츠 삭제
  while (uiContainer.firstChild) {
    uiContainer.removeChild(uiContainer.firstChild);
  }
  
  // 헤더 추가
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
  `;
  
  const title = document.createElement('h3');
  title.textContent = '크롤링 코드 생성 결과';
  title.style.margin = '0';
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'X';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
  `;
  closeBtn.onclick = () => document.body.removeChild(uiContainer);
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  uiContainer.appendChild(header);
  
  // 코드 표시
  const codeContainer = document.createElement('div');
  codeContainer.style.cssText = `
    margin-bottom: 15px;
    background: #f5f5f5;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
    max-height: 400px;
    overflow-y: auto;
  `;
  
  const code = document.createElement('pre');
  code.style.margin = '0';
  code.style.whiteSpace = 'pre-wrap';
  code.textContent = data.code || '코드가 생성되지 않았습니다.';
  
  codeContainer.appendChild(code);
  uiContainer.appendChild(codeContainer);
  
  // 복사 버튼
  const copyBtn = document.createElement('button');
  copyBtn.textContent = '코드 복사';
  copyBtn.style.cssText = `
    background: #4285f4;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    width: 100%;
    margin-bottom: 10px;
  `;
  
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(data.code || '')
      .then(() => {
        copyBtn.textContent = '복사됨!';
        setTimeout(() => {
          copyBtn.textContent = '코드 복사';
        }, 2000);
      })
      .catch(err => {
        console.error('복사 실패:', err);
        // 클립보드 API를 사용할 수 없는 경우 대체 방법
        const textArea = document.createElement('textarea');
        textArea.value = data.code || '';
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        copyBtn.textContent = '복사됨!';
        setTimeout(() => {
          copyBtn.textContent = '코드 복사';
        }, 2000);
      });
  };
  
  uiContainer.appendChild(copyBtn);
  
  // 돌아가기 버튼
  const backBtn = document.createElement('button');
  backBtn.textContent = '새로운 코드 생성';
  backBtn.style.cssText = `
    background: #f1f3f4;
    color: #202124;
    border: none;
    padding: 10px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    width: 100%;
    margin-bottom: 15px;
  `;
  
  backBtn.onclick = () => {
    document.body.removeChild(uiContainer);
    // 현재 DOM에서 선택된 부분이 있는지 확인
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      createCrawlingUI('selection');
    } else {
      createCrawlingUI('full');
    }
  };
  
  uiContainer.appendChild(backBtn);
  
  // 설명 추가
  if (data.explanation) {
    const explanationTitle = document.createElement('h4');
    explanationTitle.textContent = '코드 설명';
    explanationTitle.style.marginBottom = '5px';
    
    const explanation = document.createElement('div');
    explanation.style.marginBottom = '15px';
    explanation.style.fontSize = '14px';
    explanation.style.lineHeight = '1.5';
    explanation.textContent = data.explanation;
    
    uiContainer.appendChild(explanationTitle);
    uiContainer.appendChild(explanation);
  }
}

// 오류 표시 함수
function displayError(message) {
  const uiContainer = document.getElementById('crawling-assistant-ui');
  if (!uiContainer) return;
  
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    margin-top: 15px;
    padding: 10px;
    background: #ffebee;
    color: #c62828;
    border-radius: 4px;
  `;
  errorDiv.textContent = message;
  
  // 설정 페이지로 이동 버튼 (API 키 오류인 경우)
  if (message.includes('API 키')) {
    const settingsBtn = document.createElement('button');
    settingsBtn.textContent = '설정 페이지로 이동';
    settingsBtn.style.cssText = `
      background: #c62828;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
      font-size: 12px;
    `;
    
    settingsBtn.onclick = () => {
      chrome.runtime.sendMessage({ action: "openOptionsPage" });
    };
    
    errorDiv.appendChild(document.createElement('br'));
    errorDiv.appendChild(settingsBtn);
  }
  
  uiContainer.appendChild(errorDiv);
}

// 메시지 리스너 설정
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received message:", request);
  
  if (request.action === "captureFullPage") {
    // 전체 페이지 캡처
    capturedData.html = document.documentElement.outerHTML;
    console.log("Captured full page HTML");
    try {
      createCrawlingUI('full');
      console.log("Created crawling UI for full page");
      sendResponse({ success: true, message: "Full page UI created" });
    } catch (error) {
      console.error("Error creating UI:", error);
      sendResponse({ success: false, error: error.message });
    }
  } else if (request.action === "captureSelection") {
    // 선택한 텍스트 또는 요소 캡처
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedNode = range.commonAncestorContainer;
      
      // 텍스트 노드인 경우 부모 요소 사용
      capturedData.selectedElement = selectedNode.nodeType === 3 ? selectedNode.parentNode : selectedNode;
      capturedData.selectedHtml = capturedData.selectedElement.outerHTML;
      capturedData.xpath = getElementXPath(capturedData.selectedElement);
      capturedData.cssSelector = getElementCssSelector(capturedData.selectedElement);
      
      console.log("Captured selection:", {
        html: capturedData.selectedHtml.substring(0, 100) + "...",
        xpath: capturedData.xpath,
        cssSelector: capturedData.cssSelector
      });
      
      try {
        createCrawlingUI('selection');
        console.log("Created crawling UI for selection");
        sendResponse({ success: true, message: "Selection UI created" });
      } catch (error) {
        console.error("Error creating UI:", error);
        sendResponse({ success: false, error: error.message });
      }
    } else {
      console.warn("No selection found");
      alert('선택된 영역이 없습니다. 텍스트나 요소를 선택한 후 다시 시도해주세요.');
      sendResponse({ success: false, error: "No selection found" });
    }
  }
  
  return true; // 비동기 응답을 위해 true 반환
});