document.addEventListener('DOMContentLoaded', function() {
    // 설정 버튼 클릭 핸들러
    document.getElementById('optionsBtn').addEventListener('click', function() {
      chrome.runtime.openOptionsPage();
    });
    
    // 도움말 버튼 클릭 핸들러
    document.getElementById('helpBtn').addEventListener('click', function() {
      chrome.tabs.create({ url: 'https://github.com/your-username/web-crawling-assistant/wiki' });
    });
    
    // API 키 상태 확인
    checkApiKeyStatus();
  });
  
  // API 키 상태 확인 및 UI 업데이트
  function checkApiKeyStatus() {
    const apiKeyStatusElement = document.getElementById('apiKeyStatus');
    
    chrome.storage.sync.get(['apiKey'], function(result) {
      if (result.apiKey && result.apiKey.trim() !== '') {
        apiKeyStatusElement.textContent = '설정됨';
        apiKeyStatusElement.className = 'set';
      } else {
        apiKeyStatusElement.textContent = '미설정 (설정 페이지에서 API 키를 입력하세요)';
        apiKeyStatusElement.className = 'not-set';
      }
    });
  }