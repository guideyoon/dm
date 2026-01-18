export class ErrorHandler {
  private errorPanel: HTMLDivElement | null = null
  private retryCallbacks: Map<string, () => Promise<void>> = new Map()

  constructor() {
    this.setupGlobalErrorHandlers()
  }

  private setupGlobalErrorHandlers() {
    // 전역 에러 핸들러
    window.addEventListener('error', (event) => {
      this.handleError(event.error || event.message, 'JavaScript Error')
    })

    // Promise rejection 핸들러
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, 'Promise Rejection')
    })
  }

  /**
   * 에러 처리 및 사용자 안내
   */
  public handleError(error: any, context: string = 'Unknown'): void {
    console.error(`[${context}]`, error)

    const errorMessage = this.getFriendlyErrorMessage(error)
    this.showErrorPanel(errorMessage, context)
  }

  /**
   * 친화적인 에러 메시지 생성
   */
  private getFriendlyErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error
    }

    if (error?.message) {
      const message = error.message.toLowerCase()
      
      // 네트워크 관련 에러
      if (message.includes('network') || message.includes('fetch') || message.includes('failed')) {
        return '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.'
      }
      
      // 저장 관련 에러
      if (message.includes('storage') || message.includes('quota') || message.includes('save')) {
        return '저장 공간이 부족합니다. 브라우저 저장 공간을 확인해주세요.'
      }
      
      // 로드 관련 에러
      if (message.includes('load') || message.includes('parse')) {
        return '게임 데이터를 불러오는 중 오류가 발생했습니다.'
      }
      
      // WebGL 관련 에러
      if (message.includes('webgl') || message.includes('gpu') || message.includes('render')) {
        return '그래픽 렌더링에 문제가 있습니다. 브라우저를 업데이트하거나 다른 브라우저를 시도해주세요.'
      }
      
      return error.message
    }

    return '알 수 없는 오류가 발생했습니다.'
  }

  /**
   * 에러 패널 표시
   */
  private showErrorPanel(message: string, context: string): void {
    if (!this.errorPanel) {
      this.createErrorPanel()
    }

    if (!this.errorPanel) return

    const messageElement = this.errorPanel.querySelector('#error-message') as HTMLElement
    const contextElement = this.errorPanel.querySelector('#error-context') as HTMLElement

    if (messageElement) {
      messageElement.textContent = message
    }
    if (contextElement) {
      contextElement.textContent = `오류 유형: ${context}`
    }

    this.errorPanel.style.display = 'flex'
  }

  /**
   * 에러 패널 생성
   */
  private createErrorPanel(): void {
    this.errorPanel = document.createElement('div')
    this.errorPanel.id = 'error-panel'
    
    Object.assign(this.errorPanel.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'none',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '10004',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    })

    this.errorPanel.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        max-width: 500px;
        width: 90%;
        color: white;
        text-align: center;
      ">
        <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
        <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
          오류가 발생했습니다
        </h2>
        <p id="error-message" style="
          margin: 0 0 15px 0;
          font-size: 16px;
          line-height: 1.6;
          opacity: 0.9;
        "></p>
        <p id="error-context" style="
          margin: 0 0 30px 0;
          font-size: 14px;
          opacity: 0.7;
        "></p>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button id="error-retry" style="
            padding: 12px 24px;
            border: 2px solid white;
            border-radius: 8px;
            background: transparent;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          ">다시 시도</button>
          <button id="error-close" style="
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            background: white;
            color: #ff6b6b;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          ">닫기</button>
        </div>
      </div>
    `

    const retryBtn = this.errorPanel.querySelector('#error-retry') as HTMLButtonElement
    const closeBtn = this.errorPanel.querySelector('#error-close') as HTMLButtonElement

    retryBtn.addEventListener('click', () => {
      this.retryLastAction()
    })

    closeBtn.addEventListener('click', () => {
      this.hideErrorPanel()
    })

    document.body.appendChild(this.errorPanel)
  }

  /**
   * 에러 패널 숨기기
   */
  public hideErrorPanel(): void {
    if (this.errorPanel) {
      this.errorPanel.style.display = 'none'
    }
  }

  /**
   * 마지막 액션 재시도
   */
  private async retryLastAction(): void {
    // 재시도 콜백이 있으면 실행
    const lastRetryId = Array.from(this.retryCallbacks.keys()).pop()
    if (lastRetryId && this.retryCallbacks.has(lastRetryId)) {
      const retryCallback = this.retryCallbacks.get(lastRetryId)!
      try {
        await retryCallback()
        this.hideErrorPanel()
      } catch (error) {
        this.handleError(error, 'Retry Failed')
      }
    } else {
      // 페이지 새로고침
      window.location.reload()
    }
  }

  /**
   * 재시도 콜백 등록
   */
  public registerRetryCallback(id: string, callback: () => Promise<void>): void {
    this.retryCallbacks.set(id, callback)
  }

  /**
   * 저장 실패 처리
   */
  public handleSaveError(error: any, retryCallback?: () => Promise<void>): void {
    if (retryCallback) {
      this.registerRetryCallback('save', retryCallback)
    }
    this.handleError(error, 'Save Error')
  }

  /**
   * 네트워크 오류 처리
   */
  public handleNetworkError(error: any, retryCallback?: () => Promise<void>): void {
    if (retryCallback) {
      this.registerRetryCallback('network', retryCallback)
    }
    this.handleError(error, 'Network Error')
  }

  /**
   * 브라우저 호환성 체크
   */
  public checkBrowserCompatibility(): { compatible: boolean; issues: string[] } {
    const issues: string[] = []

    // WebGL 지원 확인
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) {
      issues.push('WebGL을 지원하지 않는 브라우저입니다.')
    }

    // localStorage 지원 확인
    try {
      localStorage.setItem('test', 'test')
      localStorage.removeItem('test')
    } catch (e) {
      issues.push('localStorage를 사용할 수 없습니다.')
    }

    // IndexedDB 지원 확인 (선택적)
    if (!window.indexedDB) {
      issues.push('IndexedDB를 지원하지 않습니다. (선택적 기능)')
    }

    return {
      compatible: issues.length === 0,
      issues
    }
  }
}
