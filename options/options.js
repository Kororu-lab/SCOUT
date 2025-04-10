document.addEventListener('DOMContentLoaded', function() {
    // 설정값 로드
    loadSettings();
    
    // 저장 버튼 클릭 핸들러
    document.getElementById('saveBtn').addEventListener('click', saveSettings);
    
    // 기본값으로 재설정 버튼 클릭 핸들러
    document.getElementById('resetBtn').addEventListener('click', resetSettings);
    
    // API 키 표시/숨김 토글 버튼 핸들러
    document.getElementById('toggleApiKey').addEventListener('click', toggleApiKeyVisibility);
    
    // API 키 테스트 버튼 핸들러
    document.getElementById('testApiBtn').addEventListener('click', testApiKey);
  });
  
  // 설정값 로드
  function loadSettings() {
    chrome.storage.sync.get(
      {
        apiKey: '',
        apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
        defaultLanguage: 'python',
        modelType: 'deepseek-chat' // Add default model type
      },
      function(items) {
        document.getElementById('apiKey').value = items.apiKey;
        document.getElementById('apiEndpoint').value = items.apiEndpoint;
        document.getElementById('defaultLanguage').value = items.defaultLanguage;
        document.getElementById('modelType').value = items.modelType;
      }
    );
  }
  
  // 설정값 저장
  function saveSettings() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const apiEndpoint = document.getElementById('apiEndpoint').value.trim();
    const defaultLanguage = document.getElementById('defaultLanguage').value;
    const modelType = document.getElementById('modelType').value;
    
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
        defaultLanguage: defaultLanguage,
        modelType: modelType
      },
      function() {
        showStatusMessage('설정이 저장되었습니다.', 'success');
      }
    );
  }
  
  // API 키 테스트
  async function testApiKey() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const apiEndpoint = document.getElementById('apiEndpoint').value.trim();
    const modelType = document.getElementById('modelType').value;
    
    if (!apiKey) {
      showStatusMessage('API 키를 입력해주세요.', 'error');
      return;
    }
    
    const testBtn = document.getElementById('testApiBtn');
    const originalText = testBtn.textContent;
    testBtn.textContent = '테스트 중...';
    testBtn.disabled = true;
    
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelType,
          messages: [
            {
              "role": "system",
              "content": "You are a helpful assistant."
            },
            {
              "role": "user",
              "content": "Say hello"
            }
          ],
          temperature: 0.3,
          max_tokens: 50,
          stream: false
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        showStatusMessage(`API 오류: ${errorData.error?.message || '알 수 없는 오류'}`, 'error');
        console.error('API error:', errorData);
        return;
      }
      
      const data = await response.json();
      showStatusMessage('API 키가 정상적으로 작동합니다!', 'success');
      console.log('API response:', data);
      
    } catch (error) {
      showStatusMessage(`API 테스트 실패: ${error.message}`, 'error');
      console.error('API test error:', error);
    } finally {
      testBtn.textContent = originalText;
      testBtn.disabled = false;
    }
  }
  
  // 기본값으로 재설정
  function resetSettings() {
    if (confirm('모든 설정을 기본값으로 재설정하시겠습니까?')) {
      const defaultSettings = {
        apiKey: '',
        apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
        defaultLanguage: 'python',
        modelType: 'deepseek-chat'
      };

      chrome.storage.sync.set(defaultSettings, function() {
        // 설정값 다시 로드
        loadSettings();
        showStatusMessage('설정이 기본값으로 재설정되었습니다.', 'success');
      });

      // UI 업데이트
      document.getElementById('apiKey').value = defaultSettings.apiKey;
      document.getElementById('apiEndpoint').value = defaultSettings.apiEndpoint;
      document.getElementById('defaultLanguage').value = defaultSettings.defaultLanguage;
      document.getElementById('modelType').value = defaultSettings.modelType;
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