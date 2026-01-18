export class LoadingScreen {
  private element: HTMLDivElement
  private progressBar: HTMLDivElement
  private progressText: HTMLSpanElement
  private tipText: HTMLDivElement
  private assetStatusText: HTMLDivElement
  private tips: string[] = [
    '나무를 3번 채집하면 사라집니다. 새로운 나무가 자라날 때까지 기다려주세요!',
    'Shift 키를 누르면 달릴 수 있습니다.',
    '더블클릭으로 빠르게 채집할 수 있어요!',
    'B 키를 누르면 인벤토리를 열 수 있습니다.',
    '농장에 씨앗을 심고 물을 주면 작물이 자라납니다.',
    'NPC에게 선물을 주면 친밀도가 올라갑니다.',
    '건물을 지으면 마을이 발전합니다.',
    '펫을 키우면 자동으로 아이템을 수집해줍니다.',
    '박물관에 아이템을 기증하면 보상을 받을 수 있어요!',
    '시간대별로 다른 배경음악이 재생됩니다.',
    '날씨에 따라 상점 가격이 변동될 수 있습니다.',
    '별똥별을 보면 소원을 빌 수 있어요!',
    '인테리어를 꾸미면 집 등급이 올라갑니다.',
    '연속으로 로그인하면 보너스를 받을 수 있습니다.'
  ]
  private currentTipIndex: number = 0
  private assetStatuses: Map<string, string> = new Map()

  constructor() {
    this.element = document.createElement('div')
    this.element.id = 'loading-screen'
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '10003',
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
        
        <!-- 로딩 진행률 -->
        <div style="margin: 40px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; opacity: 0.9;">
            <span>로딩 중...</span>
            <span id="loading-progress-text">0%</span>
          </div>
          <div style="
            width: 100%;
            height: 8px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            overflow: hidden;
          ">
            <div id="loading-progress-bar" style="
              width: 0%;
              height: 100%;
              background: white;
              transition: width 0.3s ease;
              box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
            "></div>
          </div>
        </div>

        <!-- 팁 표시 -->
        <div id="loading-tip" style="
          margin: 30px 0;
          padding: 20px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          font-size: 16px;
          line-height: 1.6;
          min-height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span>💡 게임 팁이 여기에 표시됩니다...</span>
        </div>

        <!-- 에셋 로딩 상태 -->
        <div id="loading-assets" style="
          margin-top: 20px;
          padding: 15px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          font-size: 14px;
          opacity: 0.8;
          max-height: 150px;
          overflow-y: auto;
        ">
          <div style="margin-bottom: 8px; font-weight: 600;">에셋 로딩 상태:</div>
          <div id="loading-asset-list" style="text-align: left;">
            <div>초기화 중...</div>
          </div>
        </div>
      </div>
    `

    this.progressBar = this.element.querySelector('#loading-progress-bar') as HTMLDivElement
    this.progressText = this.element.querySelector('#loading-progress-text') as HTMLSpanElement
    this.tipText = this.element.querySelector('#loading-tip') as HTMLDivElement
    this.assetStatusText = this.element.querySelector('#loading-asset-list') as HTMLDivElement

    // 팁 자동 변경
    this.startTipRotation()
  }

  private startTipRotation() {
    setInterval(() => {
      this.currentTipIndex = (this.currentTipIndex + 1) % this.tips.length
      this.updateTip()
    }, 5000) // 5초마다 변경
  }

  private updateTip() {
    if (this.tipText) {
      this.tipText.innerHTML = `<span>💡 ${this.tips[this.currentTipIndex]}</span>`
    }
  }

  public show() {
    this.element.style.display = 'flex'
    this.setProgress(0)
    this.updateTip()
  }

  public hide() {
    this.element.style.display = 'none'
  }

  public setProgress(percent: number) {
    const clampedPercent = Math.max(0, Math.min(100, percent))
    if (this.progressBar) {
      this.progressBar.style.width = `${clampedPercent}%`
    }
    if (this.progressText) {
      this.progressText.textContent = `${Math.round(clampedPercent)}%`
    }
  }

  public setAssetStatus(assetName: string, status: 'loading' | 'loaded' | 'error') {
    this.assetStatuses.set(assetName, status)
    this.updateAssetList()
  }

  private updateAssetList() {
    if (!this.assetStatusText) return

    const statusIcons: { [key: string]: string } = {
      loading: '⏳',
      loaded: '✅',
      error: '❌'
    }

    const statusTexts: { [key: string]: string } = {
      loading: '로딩 중...',
      loaded: '완료',
      error: '오류'
    }

    const list = Array.from(this.assetStatuses.entries())
      .map(([name, status]) => {
        const icon = statusIcons[status] || '⏳'
        const text = statusTexts[status] || '로딩 중...'
        return `<div style="margin: 4px 0; display: flex; justify-content: space-between;">
          <span>${icon} ${name}</span>
          <span style="opacity: 0.7;">${text}</span>
        </div>`
      })
      .join('')

    this.assetStatusText.innerHTML = list || '<div>에셋 없음</div>'
  }

  public setTip(tip: string) {
    if (this.tipText) {
      this.tipText.innerHTML = `<span>💡 ${tip}</span>`
    }
  }
}
