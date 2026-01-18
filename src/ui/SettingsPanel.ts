export interface GameSettings {
  soundVolume: number
  musicVolume: number
  masterVolume: number
  graphicsQuality: 'low' | 'medium' | 'high'
  shadowsEnabled: boolean
  showFPS: boolean
  language: 'ko' | 'en'
}

export class SettingsPanel {
  private element: HTMLDivElement
  private settings: GameSettings
  private onSettingsChange?: (settings: GameSettings) => void
  private onClose?: () => void

  constructor(initialSettings: GameSettings) {
    this.settings = { ...initialSettings }
    this.element = document.createElement('div')
    this.element.id = 'settings-panel'
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
      zIndex: '10002',
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
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        color: white;
        position: relative;
      ">
        <h2 style="margin: 0 0 30px 0; text-align: center; font-size: 28px; font-weight: 600;">
          설정
        </h2>

        <!-- 사운드 설정 -->
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">사운드</h3>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 8px; font-size: 14px;">
              마스터 볼륨
            </label>
            <div style="display: flex; align-items: center; gap: 15px;">
              <input type="range" id="master-volume" min="0" max="100" value="${this.settings.masterVolume * 100}" style="
                flex: 1;
                height: 6px;
                border-radius: 3px;
                background: rgba(255, 255, 255, 0.2);
                outline: none;
              ">
              <span id="master-volume-value" style="min-width: 40px; text-align: right; font-size: 14px;">
                ${Math.round(this.settings.masterVolume * 100)}%
              </span>
            </div>
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 8px; font-size: 14px;">
              배경음악 볼륨
            </label>
            <div style="display: flex; align-items: center; gap: 15px;">
              <input type="range" id="music-volume" min="0" max="100" value="${this.settings.musicVolume * 100}" style="
                flex: 1;
                height: 6px;
                border-radius: 3px;
                background: rgba(255, 255, 255, 0.2);
                outline: none;
              ">
              <span id="music-volume-value" style="min-width: 40px; text-align: right; font-size: 14px;">
                ${Math.round(this.settings.musicVolume * 100)}%
              </span>
            </div>
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 8px; font-size: 14px;">
              효과음 볼륨
            </label>
            <div style="display: flex; align-items: center; gap: 15px;">
              <input type="range" id="sound-volume" min="0" max="100" value="${this.settings.soundVolume * 100}" style="
                flex: 1;
                height: 6px;
                border-radius: 3px;
                background: rgba(255, 255, 255, 0.2);
                outline: none;
              ">
              <span id="sound-volume-value" style="min-width: 40px; text-align: right; font-size: 14px;">
                ${Math.round(this.settings.soundVolume * 100)}%
              </span>
            </div>
          </div>
        </div>

        <!-- 그래픽 설정 -->
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">그래픽</h3>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 8px; font-size: 14px;">
              그래픽 품질
            </label>
            <select id="graphics-quality" style="
              width: 100%;
              padding: 12px;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              background: rgba(255, 255, 255, 0.9);
              color: #333;
              cursor: pointer;
            ">
              <option value="low" ${this.settings.graphicsQuality === 'low' ? 'selected' : ''}>낮음</option>
              <option value="medium" ${this.settings.graphicsQuality === 'medium' ? 'selected' : ''}>보통</option>
              <option value="high" ${this.settings.graphicsQuality === 'high' ? 'selected' : ''}>높음</option>
            </select>
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: flex; align-items: center; gap: 10px; font-size: 14px; cursor: pointer;">
              <input type="checkbox" id="shadows-enabled" ${this.settings.shadowsEnabled ? 'checked' : ''} style="
                width: 20px;
                height: 20px;
                cursor: pointer;
              ">
              <span>그림자 활성화</span>
            </label>
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: flex; align-items: center; gap: 10px; font-size: 14px; cursor: pointer;">
              <input type="checkbox" id="show-fps" ${this.settings.showFPS ? 'checked' : ''} style="
                width: 20px;
                height: 20px;
                cursor: pointer;
              ">
              <span>FPS 표시</span>
            </label>
          </div>
        </div>

        <!-- 언어 설정 -->
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">언어</h3>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 8px; font-size: 14px;">
              언어 선택
            </label>
            <select id="language" style="
              width: 100%;
              padding: 12px;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              background: rgba(255, 255, 255, 0.9);
              color: #333;
              cursor: pointer;
            ">
              <option value="ko" ${this.settings.language === 'ko' ? 'selected' : ''}>한국어</option>
              <option value="en" ${this.settings.language === 'en' ? 'selected' : ''}>English</option>
            </select>
          </div>
        </div>

        <!-- 접근성 설정 -->
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">접근성</h3>
          
          <button id="accessibility-settings-btn" style="
            width: 100%;
            padding: 12px 24px;
            border: 2px solid white;
            border-radius: 8px;
            background: transparent;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          ">접근성 설정 열기</button>
        </div>

        <!-- 버튼 영역 -->
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button id="settings-reset" style="
            padding: 12px 24px;
            border: 2px solid white;
            border-radius: 8px;
            background: transparent;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          ">기본값으로</button>
          <button id="settings-close" style="
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            background: white;
            color: #667eea;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          ">닫기</button>
        </div>

        <!-- 닫기 버튼 -->
        <button id="settings-close-x" style="
          position: absolute;
          top: 15px;
          right: 15px;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        ">×</button>
      </div>
    `

    this.setupEventListeners()
  }

  private setupEventListeners() {
    // 볼륨 슬라이더
    const masterVolumeSlider = this.element.querySelector('#master-volume') as HTMLInputElement
    const masterVolumeValue = this.element.querySelector('#master-volume-value') as HTMLElement
    masterVolumeSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value)
      masterVolumeValue.textContent = `${value}%`
      this.settings.masterVolume = value / 100
      this.notifySettingsChange()
    })

    const musicVolumeSlider = this.element.querySelector('#music-volume') as HTMLInputElement
    const musicVolumeValue = this.element.querySelector('#music-volume-value') as HTMLElement
    musicVolumeSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value)
      musicVolumeValue.textContent = `${value}%`
      this.settings.musicVolume = value / 100
      this.notifySettingsChange()
    })

    const soundVolumeSlider = this.element.querySelector('#sound-volume') as HTMLInputElement
    const soundVolumeValue = this.element.querySelector('#sound-volume-value') as HTMLElement
    soundVolumeSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value)
      soundVolumeValue.textContent = `${value}%`
      this.settings.soundVolume = value / 100
      this.notifySettingsChange()
    })

    // 그래픽 설정
    const graphicsQualitySelect = this.element.querySelector('#graphics-quality') as HTMLSelectElement
    graphicsQualitySelect.addEventListener('change', (e) => {
      this.settings.graphicsQuality = (e.target as HTMLSelectElement).value as 'low' | 'medium' | 'high'
      this.notifySettingsChange()
    })

    const shadowsEnabledCheckbox = this.element.querySelector('#shadows-enabled') as HTMLInputElement
    shadowsEnabledCheckbox.addEventListener('change', (e) => {
      this.settings.shadowsEnabled = (e.target as HTMLInputElement).checked
      this.notifySettingsChange()
    })

    const showFPSCheckbox = this.element.querySelector('#show-fps') as HTMLInputElement
    showFPSCheckbox.addEventListener('change', (e) => {
      this.settings.showFPS = (e.target as HTMLInputElement).checked
      this.notifySettingsChange()
    })

    // 언어 설정
    const languageSelect = this.element.querySelector('#language') as HTMLSelectElement
    languageSelect.addEventListener('change', (e) => {
      this.settings.language = (e.target as HTMLSelectElement).value as 'ko' | 'en'
      this.notifySettingsChange()
    })

    // 버튼
    const resetBtn = this.element.querySelector('#settings-reset') as HTMLButtonElement
    resetBtn.addEventListener('click', () => {
      this.resetToDefaults()
    })

    const closeBtn = this.element.querySelector('#settings-close') as HTMLButtonElement
    closeBtn.addEventListener('click', () => {
      this.hide()
      if (this.onClose) {
        this.onClose()
      }
    })

    const closeXBtn = this.element.querySelector('#settings-close-x') as HTMLButtonElement
    closeXBtn.addEventListener('click', () => {
      this.hide()
      if (this.onClose) {
        this.onClose()
      }
    })

    // 접근성 설정 버튼
    const accessibilityBtn = this.element.querySelector('#accessibility-settings-btn') as HTMLButtonElement
    accessibilityBtn.addEventListener('click', () => {
      if ((window as any).accessibilityManager) {
        ;(window as any).accessibilityManager.showAccessibilitySettings()
      }
    })

    // 호버 효과
    const buttons = [resetBtn, closeBtn, closeXBtn]
    buttons.forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'scale(1.05)'
        btn.style.opacity = '0.9'
      })
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'scale(1)'
        btn.style.opacity = '1'
      })
    })
  }

  private notifySettingsChange() {
    if (this.onSettingsChange) {
      this.onSettingsChange({ ...this.settings })
    }
  }

  private resetToDefaults() {
    this.settings = {
      soundVolume: 1.0,
      musicVolume: 0.7,
      masterVolume: 1.0,
      graphicsQuality: 'medium',
      shadowsEnabled: true,
      showFPS: false,
      language: 'ko'
    }
    this.updateUI()
    this.notifySettingsChange()
  }

  private updateUI() {
    const masterVolumeSlider = this.element.querySelector('#master-volume') as HTMLInputElement
    const masterVolumeValue = this.element.querySelector('#master-volume-value') as HTMLElement
    masterVolumeSlider.value = String(this.settings.masterVolume * 100)
    masterVolumeValue.textContent = `${Math.round(this.settings.masterVolume * 100)}%`

    const musicVolumeSlider = this.element.querySelector('#music-volume') as HTMLInputElement
    const musicVolumeValue = this.element.querySelector('#music-volume-value') as HTMLElement
    musicVolumeSlider.value = String(this.settings.musicVolume * 100)
    musicVolumeValue.textContent = `${Math.round(this.settings.musicVolume * 100)}%`

    const soundVolumeSlider = this.element.querySelector('#sound-volume') as HTMLInputElement
    const soundVolumeValue = this.element.querySelector('#sound-volume-value') as HTMLElement
    soundVolumeSlider.value = String(this.settings.soundVolume * 100)
    soundVolumeValue.textContent = `${Math.round(this.settings.soundVolume * 100)}%`

    const graphicsQualitySelect = this.element.querySelector('#graphics-quality') as HTMLSelectElement
    graphicsQualitySelect.value = this.settings.graphicsQuality

    const shadowsEnabledCheckbox = this.element.querySelector('#shadows-enabled') as HTMLInputElement
    shadowsEnabledCheckbox.checked = this.settings.shadowsEnabled

    const showFPSCheckbox = this.element.querySelector('#show-fps') as HTMLInputElement
    showFPSCheckbox.checked = this.settings.showFPS

    const languageSelect = this.element.querySelector('#language') as HTMLSelectElement
    languageSelect.value = this.settings.language
  }

  public show() {
    this.element.style.display = 'flex'
    this.updateUI()
  }

  public hide() {
    this.element.style.display = 'none'
  }

  public getSettings(): GameSettings {
    return { ...this.settings }
  }

  public setSettings(settings: GameSettings) {
    this.settings = { ...settings }
    this.updateUI()
  }

  public setOnSettingsChange(callback: (settings: GameSettings) => void) {
    this.onSettingsChange = callback
  }

  public setOnClose(callback: () => void) {
    this.onClose = callback
  }
}
