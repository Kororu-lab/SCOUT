/**
 * Web Crawling Assistant 유틸리티 함수 모음
 */

// 문자열 이스케이프 처리
function escapeHtml(html) {
    return html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  // XPath를 최적화하는 함수
  function optimizeXPath(xpath) {
    // ID 기반 간단한 XPath로 변환 시도
    if (xpath.includes('id=')) {
      const match = xpath.match(/id=['"]([^'"]+)['"]/);
      if (match) {
        return `//*[@id="${match[1]}"]`;
      }
    }
    
    // 불필요한 인덱스 정리
    return xpath.replace(/\[1\]/g, '');
  }
  
  // 코드 포맷팅 (들여쓰기 및 구문 강조)
  function formatCode(code, language) {
    // 실제 구현에서는 highlight.js 등의 라이브러리 사용 가능
    return code;
  }
  
  // 요소의 고유한 CSS 선택자 생성 함수
  function generateUniqueCssSelector(element) {
    if (!element) return "";
    
    // ID가 있으면 ID 선택자 사용
    if (element.id) {
      return `#${element.id}`;
    }
    
    // 특정 속성을 가진 경우 활용
    if (element.hasAttribute('data-testid')) {
      return `[data-testid="${element.getAttribute('data-testid')}"]`;
    }
    
    if (element.hasAttribute('data-id')) {
      return `[data-id="${element.getAttribute('data-id')}"]`;
    }
    
    // 클래스명 활용
    if (element.className) {
      const classes = element.className.split(/\s+/)
        .filter(cls => cls && !cls.includes(':'))
        .map(cls => `.${cls}`)
        .join('');
      
      if (classes && document.querySelectorAll(classes).length === 1) {
        return classes;
      }
    }
    
    // 태그 이름과 속성 조합
    const tagName = element.tagName.toLowerCase();
    let selector = tagName;
    
    // 부모 요소 기준으로 경로 생성
    const parent = element.parentNode;
    if (parent && parent.tagName) {
      const parentSelector = generateUniqueCssSelector(parent);
      const siblings = Array.from(parent.children).filter(el => el.tagName === element.tagName);
      
      if (siblings.length > 1) {
        const index = siblings.indexOf(element) + 1;
        return `${parentSelector} > ${tagName}:nth-child(${index})`;
      } else {
        return `${parentSelector} > ${tagName}`;
      }
    }
    
    return selector;
  }
  
  // 브라우저 로컬 스토리지 유틸리티
  const storageUtils = {
    async get(key, defaultValue = null) {
      return new Promise(resolve => {
        chrome.storage.sync.get({ [key]: defaultValue }, result => {
          resolve(result[key]);
        });
      });
    },
    
    async set(key, value) {
      return new Promise(resolve => {
        chrome.storage.sync.set({ [key]: value }, () => {
          resolve();
        });
      });
    },
    
    async remove(key) {
      return new Promise(resolve => {
        chrome.storage.sync.remove(key, () => {
          resolve();
        });
      });
    }
  };
  
  // URL 유효성 검사
  function isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  // 에러 메시지 형식화
  function formatErrorMessage(error) {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    }
    
    return '알 수 없는 오류가 발생했습니다.';
  }
  
  // 모듈로 내보내기
  export {
    escapeHtml,
    optimizeXPath,
    formatCode,
    generateUniqueCssSelector,
    storageUtils,
    isValidUrl,
    formatErrorMessage
  };