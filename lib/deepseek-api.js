// DeepSeek API 통신 모듈
class DeepSeekAPI {
    constructor(apiKey, endpoint = 'https://api.deepseek.com/v1') {
      this.apiKey = apiKey;
      this.endpoint = endpoint;
    }
  
    /**
     * HTML에서 데이터 추출 요청을 보냅니다.
     * @param {string} html - 전체 또는 부분 HTML
     * @param {string} query - 사용자 요구사항
     * @param {Object} selectedInfo - 선택 영역 정보 (XPath, CSS 선택자 등)
     * @param {string} url - 웹페이지 URL
     * @returns {Promise<Object>} - API 응답 결과
     */
    async extractData(html, query, selectedInfo = null, url = '') {
      try {
        const payload = {
          html: html,
          query: query,
          url: url,
          options: {
            languagePreference: await this.getLanguagePreference()
          }
        };
  
        if (selectedInfo) {
          payload.selectedInfo = selectedInfo;
        }
  
        const response = await fetch(`${this.endpoint}/extract`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(payload)
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `API 오류 (${response.status})`);
        }
  
        return await response.json();
      } catch (error) {
        console.error('DeepSeek API 오류:', error);
        throw error;
      }
    }
  
    /**
     * 사용자 설정에서 언어 환경설정을 가져옵니다.
     * @returns {Promise<string>} - 선호 언어 (기본값: 'python')
     */
    async getLanguagePreference() {
      return new Promise((resolve) => {
        chrome.storage.sync.get(['defaultLanguage'], (result) => {
          resolve(result.defaultLanguage || 'python');
        });
      });
    }
  
    /**
     * API 키를 업데이트합니다.
     * @param {string} newApiKey - 새 API 키
     */
    updateApiKey(newApiKey) {
      this.apiKey = newApiKey;
    }
  
    /**
     * API 엔드포인트를 업데이트합니다.
     * @param {string} newEndpoint - 새 엔드포인트 URL
     */
    updateEndpoint(newEndpoint) {
      this.endpoint = newEndpoint;
    }
  }
  
  // 모듈로 내보내기
  export default DeepSeekAPI;