import { TutorialSystem, TutorialStep } from '../systems/TutorialSystem'

export class TutorialPanel {
  private element: HTMLDivElement
  private tutorialSystem: TutorialSystem
  private onNext?: () => void
  private onPrevious?: () => void
  private onSkip?: () => void
  private onClose?: () => void

  constructor(tutorialSystem: TutorialSystem) {
    this.tutorialSystem = tutorialSystem
    this.element = document.createElement('div')
    this.element.id = 'tutorial-panel'
    this.setupStyles()
    this.setupHTML()
    document.body.appendChild(this.element)
    this.hide()

    // 튜토리얼 시스템 이벤트 리스너
    this.tutorialSystem.onStepComplete((stepId) => {
      this.updateUI()
    })

    this.tutorialSystem.onTutorialComplete(() => {
      this.hide()
    })
  }

  private setupStyles() {
    Object.assign(this.element.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '10001',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      pointerEvents: 'auto'
    })
  }

  private setupHTML() {
    this.element.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        max-width: 500px;
        width: 90%;
        color: white;
        position: relative;
      ">
        <!-- 진행률 표시 -->
        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; opacity: 0.9;">
            <span id="tutorial-progress-text">1 / 10</span>
            <span id="tutorial-progress-percent">10%</span>
          </div>
          <div style="
            width: 100%;
            height: 6px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            overflow: hidden;
          ">
            <div id="tutorial-progress-bar" style="
              width: 10%;
              height: 100%;
              background: white;
              transition: width 0.3s ease;
            "></div>
          </div>
        </div>

        <!-- 제목 -->
        <h2 id="tutorial-title" style="
          margin: 0 0 15px 0;
          font-size: 24px;
          font-weight: 600;
        ">튜토리얼 제목</h2>

        <!-- 설명 -->
        <p id="tutorial-description" style="
          margin: 0 0 30px 0;
          font-size: 16px;
          line-height: 1.6;
          opacity: 0.9;
        ">튜토리얼 설명</p>

        <!-- 버튼 영역 -->
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button id="tutorial-previous" style="
            padding: 12px 24px;
            border: 2px solid white;
            border-radius: 8px;
            background: transparent;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: none;
          ">이전</button>
          <button id="tutorial-skip" style="
            padding: 12px 24px;
            border: 2px solid white;
            border-radius: 8px;
            background: transparent;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          ">건너뛰기</button>
          <button id="tutorial-next" style="
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            background: white;
            color: #667eea;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          ">다음</button>
        </div>

        <!-- 닫기 버튼 -->
        <button id="tutorial-close" style="
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
    const nextBtn = this.element.querySelector('#tutorial-next') as HTMLButtonElement
    const previousBtn = this.element.querySelector('#tutorial-previous') as HTMLButtonElement
    const skipBtn = this.element.querySelector('#tutorial-skip') as HTMLButtonElement
    const closeBtn = this.element.querySelector('#tutorial-close') as HTMLButtonElement

    nextBtn.addEventListener('click', () => {
      if (this.onNext) {
        this.onNext()
      }
    })

    previousBtn.addEventListener('click', () => {
      if (this.onPrevious) {
        this.onPrevious()
      }
    })

    skipBtn.addEventListener('click', () => {
      if (this.onSkip) {
        this.onSkip()
      }
    })

    closeBtn.addEventListener('click', () => {
      if (this.onClose) {
        this.onClose()
      }
    })

    // 호버 효과
    const buttons = [nextBtn, previousBtn, skipBtn, closeBtn]
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

  public show() {
    this.element.style.display = 'flex'
    this.updateUI()
  }

  public hide() {
    this.element.style.display = 'none'
  }

  public updateUI() {
    const currentStep = this.tutorialSystem.getCurrentStep()
    if (!currentStep) {
      this.hide()
      return
    }

    const title = this.element.querySelector('#tutorial-title') as HTMLElement
    const description = this.element.querySelector('#tutorial-description') as HTMLElement
    const progressText = this.element.querySelector('#tutorial-progress-text') as HTMLElement
    const progressPercent = this.element.querySelector('#tutorial-progress-percent') as HTMLElement
    const progressBar = this.element.querySelector('#tutorial-progress-bar') as HTMLElement
    const previousBtn = this.element.querySelector('#tutorial-previous') as HTMLButtonElement
    const skipBtn = this.element.querySelector('#tutorial-skip') as HTMLButtonElement
    const nextBtn = this.element.querySelector('#tutorial-next') as HTMLButtonElement

    // 내용 업데이트
    title.textContent = currentStep.title
    description.textContent = currentStep.description

    // 진행률 업데이트
    const allSteps = this.tutorialSystem.getAllSteps()
    const currentIndex = allSteps.findIndex(s => s.id === currentStep.id)
    const progress = this.tutorialSystem.getProgress()
    
    progressText.textContent = `${currentIndex + 1} / ${allSteps.length}`
    progressPercent.textContent = `${Math.round(progress)}%`
    progressBar.style.width = `${progress}%`

    // 버튼 표시/숨김
    previousBtn.style.display = currentIndex > 0 ? 'block' : 'none'
    skipBtn.style.display = currentStep.skipable !== false ? 'block' : 'none'
    
    // 마지막 단계인 경우
    if (currentIndex === allSteps.length - 1) {
      nextBtn.textContent = '완료'
    } else {
      nextBtn.textContent = '다음'
    }
  }

  public setOnNext(callback: () => void) {
    this.onNext = callback
  }

  public setOnPrevious(callback: () => void) {
    this.onPrevious = callback
  }

  public setOnSkip(callback: () => void) {
    this.onSkip = callback
  }

  public setOnClose(callback: () => void) {
    this.onClose = callback
  }
}
