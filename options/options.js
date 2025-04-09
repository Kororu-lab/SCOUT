document.addEventListener('DOMContentLoaded', function() {
    // 설정값 로드
    loadSettings();
    
    // 저장 버튼 클릭 핸들러
    document.getElementById('saveBtn').addEventListener('click', saveSettings);
    
    // 기본값으로 재설정 버튼 클릭 핸들러
    document.getElementById('resetBtn').addEventListener('click', resetSettings);
    
    // API 키 표시/숨김 토글 버튼 핸들러
    document.getElementById('toggleApiKey').addEventListener('click', toggleApiKeyVisibility);
  });
  
  // 설정값 로드
  function loadSettings() {
    chrome.storage.sync.get(
      {
        apiKey: '',
        apiEndpoint: 'https://api.deepseek.com/v1',
        defaultLanguage: 'python'
      },
      function(items) {
        document.getElementById('apiKey').value = items.apiKey;
        document.getElementById('apiEndpoint').value = items.apiEndpoint;
        document.getElementById('defaultLanguage').value = items.defaultLanguage;
      }
    );
  }
  
  // 설정값 저장
  function saveSettings() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const apiEndpoint = document.getElementById('apiEndpoint').value.trim();
    const defaultLanguage = document.getElementById('defaultLanguage').value;
    
    // 입력 검증
    if (apiEndpoint === '') {
      showStatusMessage('API 엔드포인트 URL을 입력해주세요.', 'error');
      return;
    }
    
    // API 엔드포인트 URL 형식 검증
    try {
      new URL(apiEndpoint);
    } catch (e) {
      showStatusMessage('유효한 API 엔드포인트 URL을 입력해주세요.', 'error');
      return;
    }
    
    // 설정 저장
    chrome.storage.sync.set(
      {
        apiKey: apiKey,
        apiEndpoint: apiEndpoint,
        defaultLanguage: defaultLanguage
      },
      function() {
        showStatusMessage('설정이 저장되었습니다.', 'success');
      }
    );
  }
  
  // 기본값으로 재설정
  function resetSettings() {
    if (confirm('모든 설정을 기본값으로 재설정하시겠습니까?')) {
      chrome.storage.sync.set(
        {
          apiKey: '',
          apiEndpoint: 'https://api.deepseek.com/v1',
          defaultLanguage: 'python'
        },
        function() {
          // 설정값 다시 로드
          loadSettings();
          showStatusMessage('설정이 기본값으로 재설정되었습니다.', 'success');
        }
      );
    }
  }
  
  // API 키 표시/숨김 토글
  function toggleApiKeyVisibility() {
    const apiKeyInput = document.getElementById('apiKey');
    const toggleBtn = document.getElementById('toggleApiKey');
    
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleBtn.textContent = '🔒';
    } else {
      apiKeyInput.type = 'password';
      toggleBtn.textContent = '👁️';
    }
  }
  
  // 상태 메시지 표시
  function showStatusMessage(message, type) {
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = message;
    statusElement.className = 'status-message ' + type;
    
    // 일정 시간 후 메시지 숨김
    setTimeout(function() {
      statusElement.className = 'status-message';
    }, 3000);
  }