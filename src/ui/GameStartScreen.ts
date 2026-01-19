import { AuthSystem, AuthUser } from '../systems/AuthSystem'
import { AuthPanel } from './AuthPanel'

export class GameStartScreen {
  private element: HTMLDivElement
  private authSystem: AuthSystem
  private authPanel: AuthPanel
  private onGameStart?: (user: AuthUser, isNewGame: boolean) => void
  private currentUser: AuthUser | null = null

  constructor(authSystem: AuthSystem) {
    this.authSystem = authSystem
    this.authPanel = new AuthPanel()
    this.element = document.createElement('div')
    this.element.id = 'game-start-screen'
    this.setupStyles()
    this.setupHTML()
    this.setupEventListeners()
    document.body.appendChild(this.element)
    
    // 인증 상태 확인
    this.checkAuthState()
  }

  private setupStyles() {
    Object.assign(this.element.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '9999',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: 'white'
    })
  }

  private setupHTML() {
    this.element.innerHTML = `
      <div style="text-align: center; max-width: 600px; padding: 40px;">
        <h1 style="font-size: 48px; margin: 0 0 20px 0; font-weight: 700; text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);">
          🌳 동물의 숲 게임
        </h1>
        <p style="font-size: 20px; margin: 0 0 40px 0; opacity: 0.9;">
          나만의 마을을 꾸며보세요!
        </p>
        
        <!-- 사용자 정보 (로그인 후) -->
        <div id="user-info" style="display: none; margin-bottom: 30px; padding: 20px; background: rgba(255, 255, 255, 0.1); border-radius: 12px;">
          <p style="margin: 0 0 10px 0; font-size: 16px;">
            환영합니다, <span id="user-name" style="font-weight: 600;"></span>님!
          </p>
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">
            <span id="user-email"></span>
          </p>
        </div>

        <!-- 버튼 영역 -->
        <div style="display: flex; flex-direction: column; gap: 15px; width: 100%; max-width: 300px; margin: 0 auto;">
          <button id="btn-new-game" style="
            width: 100%;
            padding: 16px;
            border: none;
            border-radius: 12px;
            background: white;
            color: #667eea;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          ">새 게임 시작</button>
          
          <button id="btn-continue" style="
            width: 100%;
            padding: 16px;
            border: 2px solid white;
            border-radius: 12px;
            background: transparent;
            color: white;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: none;
          ">이어하기</button>
          
          <button id="btn-login" style="
            width: 100%;
            padding: 16px;
            border: 2px solid white;
            border-radius: 12px;
            background: transparent;
            color: white;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          ">로그인 / 회원가입</button>
          
          <button id="btn-logout" style="
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s;
            display: none;
          ">로그아웃</button>
        </div>

        <!-- 게임 정보 -->
        <div style="margin-top: 40px; padding: 20px; background: rgba(255, 255, 255, 0.1); border-radius: 12px;">
          <h3 style="margin: 0 0 15px 0; font-size: 18px;">게임 특징</h3>
          <ul style="list-style: none; padding: 0; margin: 0; text-align: left; font-size: 14px; opacity: 0.9;">
            <li style="margin-bottom: 8px;">🌱 농작물 재배 및 수확</li>
            <li style="margin-bottom: 8px;">🏠 건물 건설 및 인테리어</li>
            <li style="margin-bottom: 8px;">🐾 펫 키우기</li>
            <li style="margin-bottom: 8px;">🎣 낚시 및 곤충 채집</li>
            <li style="margin-bottom: 8px;">👥 NPC와의 친밀도 시스템</li>
            <li style="margin-bottom: 8px;">🎨 캐릭터 커스터마이징</li>
          </ul>
        </div>
      </div>
    `
  }

  private setupEventListeners() {
    // 새 게임 시작
    const newGameBtn = this.element.querySelector('#btn-new-game') as HTMLButtonElement
    newGameBtn.addEventListener('click', () => {
      if (this.currentUser && this.onGameStart) {
        this.onGameStart(this.currentUser, true) // 새 게임 플래그
      } else {
        // 로그인하지 않은 경우 게스트로 시작
        this.startAsGuest(true) // 새 게임 플래그
      }
    })

    // 이어하기
    const continueBtn = this.element.querySelector('#btn-continue') as HTMLButtonElement
    continueBtn.addEventListener('click', () => {
      if (this.currentUser && this.onGameStart) {
        this.onGameStart(this.currentUser, false) // 이어하기 플래그
      }
    })

    // 로그인/회원가입
    const loginBtn = this.element.querySelector('#btn-login') as HTMLButtonElement
    loginBtn.addEventListener('click', () => {
      this.showAuthPanel()
    })

    // 로그아웃
    const logoutBtn = this.element.querySelector('#btn-logout') as HTMLButtonElement
    logoutBtn.addEventListener('click', async () => {
      await this.authSystem.signOut()
      this.updateUI()
    })

    // AuthPanel 이벤트 연결
    this.authPanel.setOnSignIn(async (email, password) => {
      const result = await this.authSystem.signIn(email, password)
      if (result.success && result.user) {
        this.authPanel.showSuccess('로그인 성공!')
        setTimeout(() => {
          this.authPanel.hide()
          this.updateUI()
        }, 1000)
      } else {
        this.authPanel.showError(result.error?.message || '로그인에 실패했습니다.')
      }
    })

    this.authPanel.setOnSignUp(async (email, password, displayName) => {
      const result = await this.authSystem.signUp(email, password, displayName)
      if (result.success && result.user) {
        this.authPanel.showSuccess('회원가입 성공! 이메일 인증을 확인해주세요.')
        setTimeout(() => {
          this.authPanel.hide()
          this.updateUI()
        }, 2000)
      } else {
        this.authPanel.showError(result.error?.message || '회원가입에 실패했습니다.')
      }
    })

    this.authPanel.setOnSignInAnonymously(async () => {
      const result = await this.authSystem.signInAnonymously()
      if (result.success && result.user) {
        this.authPanel.hide()
        this.currentUser = result.user
        this.updateUI()
        if (this.onGameStart) {
          this.onGameStart(result.user, true) // 새 게임 플래그
        }
      } else {
        this.authPanel.showError(result.error?.message || '게스트 로그인에 실패했습니다.')
      }
    })

    // 인증 상태 변경 리스너
    this.authSystem.onAuthStateChange((user) => {
      this.currentUser = user
      this.updateUI()
    })
  }

  private async checkAuthState() {
    const user = this.authSystem.getCurrentUser()
    if (user) {
      this.currentUser = user
    }
    this.updateUI()
  }

  private updateUI() {
    const userInfo = this.element.querySelector('#user-info') as HTMLDivElement
    const userName = this.element.querySelector('#user-name') as HTMLSpanElement
    const userEmail = this.element.querySelector('#user-email') as HTMLSpanElement
    const continueBtn = this.element.querySelector('#btn-continue') as HTMLButtonElement
    const loginBtn = this.element.querySelector('#btn-login') as HTMLButtonElement
    const logoutBtn = this.element.querySelector('#btn-logout') as HTMLButtonElement

    if (this.currentUser) {
      // 로그인 상태
      userInfo.style.display = 'block'
      userName.textContent = this.currentUser.user_metadata?.name || this.currentUser.email || '게스트'
      userEmail.textContent = this.currentUser.email || '게스트 계정'
      continueBtn.style.display = 'block'
      loginBtn.style.display = 'none'
      logoutBtn.style.display = 'block'
    } else {
      // 비로그인 상태
      userInfo.style.display = 'none'
      continueBtn.style.display = 'none'
      loginBtn.style.display = 'block'
      logoutBtn.style.display = 'none'
    }
  }

  private showAuthPanel() {
    this.authPanel.show()
  }

  private async startAsGuest(isNewGame: boolean = false) {
    const result = await this.authSystem.signInAnonymously()
    if (result.success && result.user) {
      this.currentUser = result.user
      this.updateUI()
      if (this.onGameStart) {
        this.onGameStart(result.user, isNewGame)
      }
    }
  }

  public show() {
    this.element.style.display = 'flex'
  }

  public hide() {
    this.element.style.display = 'none'
  }

  public setOnGameStart(callback: (user: AuthUser, isNewGame: boolean) => void) {
    this.onGameStart = callback
  }
}
