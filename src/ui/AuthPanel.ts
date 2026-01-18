export class AuthPanel {
  private element: HTMLDivElement
  private onSignIn?: (email: string, password: string) => void
  private onSignUp?: (email: string, password: string, displayName?: string) => void
  private onSignInAnonymously?: () => void
  private onClose?: () => void

  constructor() {
    this.element = document.createElement('div')
    this.element.id = 'auth-panel'
    this.setupStyles()
    this.setupHTML()
    document.body.appendChild(this.element)
    this.hide()
  }

  private setupStyles() {
    Object.assign(this.element.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '10000',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    })
  }

  private setupHTML() {
    this.element.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        max-width: 400px;
        width: 90%;
        color: white;
      ">
        <h2 style="margin: 0 0 30px 0; text-align: center; font-size: 28px; font-weight: 600;">
          동물의 숲 게임
        </h2>
        
        <!-- 탭 버튼 -->
        <div style="display: flex; gap: 10px; margin-bottom: 30px;">
          <button id="auth-tab-login" style="
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          ">로그인</button>
          <button id="auth-tab-signup" style="
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          ">회원가입</button>
        </div>

        <!-- 로그인 폼 -->
        <div id="auth-form-login">
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500;">
              이메일
            </label>
            <input type="email" id="auth-email-login" placeholder="이메일을 입력하세요" style="
              width: 100%;
              padding: 12px;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              background: rgba(255, 255, 255, 0.9);
              color: #333;
              box-sizing: border-box;
            ">
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500;">
              비밀번호
            </label>
            <input type="password" id="auth-password-login" placeholder="비밀번호를 입력하세요" style="
              width: 100%;
              padding: 12px;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              background: rgba(255, 255, 255, 0.9);
              color: #333;
              box-sizing: border-box;
            ">
          </div>
          <button id="auth-submit-login" style="
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 8px;
            background: white;
            color: #667eea;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 15px;
            transition: all 0.3s;
          ">로그인</button>
          <button id="auth-reset-password" style="
            width: 100%;
            padding: 10px;
            border: none;
            border-radius: 8px;
            background: transparent;
            color: white;
            font-size: 14px;
            cursor: pointer;
            text-decoration: underline;
          ">비밀번호를 잊으셨나요?</button>
        </div>

        <!-- 회원가입 폼 -->
        <div id="auth-form-signup" style="display: none;">
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500;">
              닉네임
            </label>
            <input type="text" id="auth-displayname-signup" placeholder="닉네임을 입력하세요 (선택)" style="
              width: 100%;
              padding: 12px;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              background: rgba(255, 255, 255, 0.9);
              color: #333;
              box-sizing: border-box;
            ">
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500;">
              이메일
            </label>
            <input type="email" id="auth-email-signup" placeholder="이메일을 입력하세요" style="
              width: 100%;
              padding: 12px;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              background: rgba(255, 255, 255, 0.9);
              color: #333;
              box-sizing: border-box;
            ">
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-size: 14px; font-weight: 500;">
              비밀번호
            </label>
            <input type="password" id="auth-password-signup" placeholder="비밀번호를 입력하세요 (최소 6자)" style="
              width: 100%;
              padding: 12px;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              background: rgba(255, 255, 255, 0.9);
              color: #333;
              box-sizing: border-box;
            ">
          </div>
          <button id="auth-submit-signup" style="
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 8px;
            background: white;
            color: #667eea;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 15px;
            transition: all 0.3s;
          ">회원가입</button>
        </div>

        <!-- 에러 메시지 -->
        <div id="auth-error" style="
          display: none;
          padding: 12px;
          background: rgba(255, 0, 0, 0.2);
          border-radius: 8px;
          margin-bottom: 15px;
          color: #ffcccc;
          font-size: 14px;
          text-align: center;
        "></div>

        <!-- 성공 메시지 -->
        <div id="auth-success" style="
          display: none;
          padding: 12px;
          background: rgba(0, 255, 0, 0.2);
          border-radius: 8px;
          margin-bottom: 15px;
          color: #ccffcc;
          font-size: 14px;
          text-align: center;
        "></div>

        <!-- 게스트 로그인 -->
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.3);">
          <button id="auth-guest-login" style="
            width: 100%;
            padding: 12px;
            border: 2px solid white;
            border-radius: 8px;
            background: transparent;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          ">게스트로 시작하기</button>
        </div>
      </div>
    `

    this.setupEventListeners()
  }

  private setupEventListeners() {
    // 탭 전환
    const loginTab = this.element.querySelector('#auth-tab-login') as HTMLButtonElement
    const signupTab = this.element.querySelector('#auth-tab-signup') as HTMLButtonElement
    const loginForm = this.element.querySelector('#auth-form-login') as HTMLDivElement
    const signupForm = this.element.querySelector('#auth-form-signup') as HTMLDivElement

    loginTab.addEventListener('click', () => {
      loginTab.style.background = 'rgba(255, 255, 255, 0.2)'
      signupTab.style.background = 'rgba(255, 255, 255, 0.1)'
      loginForm.style.display = 'block'
      signupForm.style.display = 'none'
      this.hideError()
      this.hideSuccess()
    })

    signupTab.addEventListener('click', () => {
      signupTab.style.background = 'rgba(255, 255, 255, 0.2)'
      loginTab.style.background = 'rgba(255, 255, 255, 0.1)'
      signupForm.style.display = 'block'
      loginForm.style.display = 'none'
      this.hideError()
      this.hideSuccess()
    })

    // 로그인
    const loginButton = this.element.querySelector('#auth-submit-login') as HTMLButtonElement
    loginButton.addEventListener('click', () => {
      const email = (this.element.querySelector('#auth-email-login') as HTMLInputElement).value
      const password = (this.element.querySelector('#auth-password-login') as HTMLInputElement).value

      if (!email || !password) {
        this.showError('이메일과 비밀번호를 입력해주세요.')
        return
      }

      if (this.onSignIn) {
        this.onSignIn(email, password)
      }
    })

    // 회원가입
    const signupButton = this.element.querySelector('#auth-submit-signup') as HTMLButtonElement
    signupButton.addEventListener('click', () => {
      const displayName = (this.element.querySelector('#auth-displayname-signup') as HTMLInputElement).value
      const email = (this.element.querySelector('#auth-email-signup') as HTMLInputElement).value
      const password = (this.element.querySelector('#auth-password-signup') as HTMLInputElement).value

      if (!email || !password) {
        this.showError('이메일과 비밀번호를 입력해주세요.')
        return
      }

      if (password.length < 6) {
        this.showError('비밀번호는 최소 6자 이상이어야 합니다.')
        return
      }

      if (this.onSignUp) {
        this.onSignUp(email, password, displayName || undefined)
      }
    })

    // 게스트 로그인
    const guestButton = this.element.querySelector('#auth-guest-login') as HTMLButtonElement
    guestButton.addEventListener('click', () => {
      if (this.onSignInAnonymously) {
        this.onSignInAnonymously()
      }
    })

    // 비밀번호 재설정
    const resetPasswordButton = this.element.querySelector('#auth-reset-password') as HTMLButtonElement
    resetPasswordButton.addEventListener('click', () => {
      const email = (this.element.querySelector('#auth-email-login') as HTMLInputElement).value
      if (!email) {
        this.showError('이메일을 입력해주세요.')
        return
      }
      // 비밀번호 재설정은 AuthSystem에서 처리
      alert('비밀번호 재설정 기능은 곧 추가될 예정입니다.')
    })

    // Enter 키로 제출
    const inputs = this.element.querySelectorAll('input')
    inputs.forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          if (loginForm.style.display !== 'none') {
            loginButton.click()
          } else {
            signupButton.click()
          }
        }
      })
    })
  }

  public show() {
    this.element.style.display = 'flex'
  }

  public hide() {
    this.element.style.display = 'none'
  }

  public showError(message: string) {
    const errorDiv = this.element.querySelector('#auth-error') as HTMLDivElement
    errorDiv.textContent = message
    errorDiv.style.display = 'block'
    const successDiv = this.element.querySelector('#auth-success') as HTMLDivElement
    successDiv.style.display = 'none'
  }

  public hideError() {
    const errorDiv = this.element.querySelector('#auth-error') as HTMLDivElement
    errorDiv.style.display = 'none'
  }

  public showSuccess(message: string) {
    const successDiv = this.element.querySelector('#auth-success') as HTMLDivElement
    successDiv.textContent = message
    successDiv.style.display = 'block'
    const errorDiv = this.element.querySelector('#auth-error') as HTMLDivElement
    errorDiv.style.display = 'none'
  }

  public hideSuccess() {
    const successDiv = this.element.querySelector('#auth-success') as HTMLDivElement
    successDiv.style.display = 'none'
  }

  public setOnSignIn(callback: (email: string, password: string) => void) {
    this.onSignIn = callback
  }

  public setOnSignUp(callback: (email: string, password: string, displayName?: string) => void) {
    this.onSignUp = callback
  }

  public setOnSignInAnonymously(callback: () => void) {
    this.onSignInAnonymously = callback
  }

  public setOnClose(callback: () => void) {
    this.onClose = callback
  }
}
