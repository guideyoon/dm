export class AccessibilityManager {
  private fontSize: number = 16
  private highContrast: boolean = false
  private keyboardOnly: boolean = false

  constructor() {
    this.setupKeyboardNavigation()
    this.setupColorBlindSupport()
  }

  /**
   * 키보드만으로 플레이 가능하도록 설정
   */
  private setupKeyboardNavigation(): void {
    // Tab 키로 포커스 가능한 요소들에 접근
    document.addEventListener('keydown', (e) => {
      // ESC 키로 모든 모달/패널 닫기
      if (e.key === 'Escape') {
        const modals = document.querySelectorAll('[role="dialog"]')
        modals.forEach(modal => {
          if (modal instanceof HTMLElement) {
            modal.style.display = 'none'
          }
        })
      }

      // Enter/Space로 버튼 활성화
      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement) {
        const activeElement = document.activeElement as HTMLElement
        if (activeElement.tagName === 'BUTTON' || activeElement.getAttribute('role') === 'button') {
          activeElement.click()
        }
      }
    })

    // 모든 버튼에 키보드 접근성 추가
    this.makeButtonsKeyboardAccessible()
  }

  /**
   * 버튼 키보드 접근성 개선
   */
  private makeButtonsKeyboardAccessible(): void {
    const style = document.createElement('style')
    style.textContent = `
      button:focus,
      [role="button"]:focus {
        outline: 3px solid #4A90E2;
        outline-offset: 2px;
      }
      
      button:focus-visible,
      [role="button"]:focus-visible {
        outline: 3px solid #4A90E2;
        outline-offset: 2px;
      }
    `
    document.head.appendChild(style)
  }

  /**
   * 색맹 사용자 지원 (색상 외 구분)
   */
  private setupColorBlindSupport(): void {
    // 아이콘과 텍스트로 색상 정보 대체
    // 이미 구현된 UI에서 색상 외 아이콘/텍스트 사용
  }

  /**
   * 텍스트 크기 조절
   */
  public setFontSize(size: number): void {
    this.fontSize = Math.max(12, Math.min(24, size))
    document.documentElement.style.setProperty('--base-font-size', `${this.fontSize}px`)
    
    // 모든 텍스트 요소에 적용
    const style = document.createElement('style')
    style.id = 'accessibility-font-size'
    style.textContent = `
      body {
        font-size: ${this.fontSize}px !important;
      }
      
      button, input, select, textarea {
        font-size: ${this.fontSize}px !important;
      }
    `
    
    // 기존 스타일 제거 후 추가
    const existing = document.getElementById('accessibility-font-size')
    if (existing) {
      existing.remove()
    }
    document.head.appendChild(style)
  }

  /**
   * 고대비 모드
   */
  public setHighContrast(enabled: boolean): void {
    this.highContrast = enabled
    
    const style = document.createElement('style')
    style.id = 'accessibility-high-contrast'
    
    if (enabled) {
      style.textContent = `
        body {
          background: #000000 !important;
          color: #FFFFFF !important;
        }
        
        button {
          background: #FFFFFF !important;
          color: #000000 !important;
          border: 2px solid #FFFFFF !important;
        }
        
        .context-panel {
          background: #000000 !important;
          color: #FFFFFF !important;
          border: 2px solid #FFFFFF !important;
        }
      `
    } else {
      style.textContent = ''
    }
    
    const existing = document.getElementById('accessibility-high-contrast')
    if (existing) {
      existing.remove()
    }
    document.head.appendChild(style)
  }

  /**
   * 자막/설명 텍스트 표시
   */
  public showCaption(text: string, duration: number = 3000): void {
    const caption = document.createElement('div')
    caption.id = 'accessibility-caption'
    
    Object.assign(caption.style, {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: `${this.fontSize}px`,
      zIndex: '10005',
      maxWidth: '80%',
      textAlign: 'center'
    })
    
    caption.textContent = text
    document.body.appendChild(caption)
    
    setTimeout(() => {
      caption.remove()
    }, duration)
  }

  /**
   * 접근성 설정 UI 표시
   */
  public showAccessibilitySettings(): void {
    const panel = document.createElement('div')
    panel.id = 'accessibility-settings'
    
    Object.assign(panel.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'white',
      padding: '30px',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
      zIndex: '10006',
      minWidth: '400px',
      fontFamily: 'sans-serif'
    })
    
    panel.innerHTML = `
      <h2 style="margin: 0 0 20px 0; font-size: 24px;">접근성 설정</h2>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 600;">
          텍스트 크기: <span id="font-size-value">${this.fontSize}px</span>
        </label>
        <input type="range" id="font-size-slider" min="12" max="24" value="${this.fontSize}" 
               style="width: 100%;" />
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
          <input type="checkbox" id="high-contrast-toggle" ${this.highContrast ? 'checked' : ''} />
          <span>고대비 모드</span>
        </label>
      </div>
      
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="accessibility-close" style="
          padding: 10px 20px;
          border: none;
          background: #4A90E2;
          color: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        ">닫기</button>
      </div>
    `
    
    document.body.appendChild(panel)
    
    const fontSizeSlider = panel.querySelector('#font-size-slider') as HTMLInputElement
    const fontSizeValue = panel.querySelector('#font-size-value') as HTMLElement
    const highContrastToggle = panel.querySelector('#high-contrast-toggle') as HTMLInputElement
    const closeBtn = panel.querySelector('#accessibility-close') as HTMLButtonElement
    
    fontSizeSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value)
      this.setFontSize(value)
      if (fontSizeValue) {
        fontSizeValue.textContent = `${value}px`
      }
    })
    
    highContrastToggle.addEventListener('change', (e) => {
      this.setHighContrast((e.target as HTMLInputElement).checked)
    })
    
    closeBtn.addEventListener('click', () => {
      panel.remove()
    })
    
    // ESC 키로 닫기
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        panel.remove()
        document.removeEventListener('keydown', handleEsc)
      }
    }
    document.addEventListener('keydown', handleEsc)
  }
}
