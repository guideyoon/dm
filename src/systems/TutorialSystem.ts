export interface TutorialStep {
  id: string
  title: string
  description: string
  type: 'info' | 'interactive' | 'hint'
  target?: string // 상호작용 대상 (예: 'inventory', 'gathering', 'building')
  condition?: () => boolean // 완료 조건
  skipable?: boolean
  position?: { x: number; y: number } // UI 표시 위치
}

export interface TutorialProgress {
  completedSteps: string[]
  currentStep: string | null
  skipped: boolean
}

export class TutorialSystem {
  private steps: TutorialStep[] = []
  private progress: TutorialProgress = {
    completedSteps: [],
    currentStep: null,
    skipped: false
  }
  private onStepCompleteCallbacks: Array<(stepId: string) => void> = []
  private onTutorialCompleteCallbacks: Array<() => void> = []

  constructor() {
    this.initializeTutorialSteps()
  }

  /**
   * 튜토리얼 단계 초기화
   */
  private initializeTutorialSteps() {
    this.steps = [
      {
        id: 'welcome',
        title: '환영합니다!',
        description: '동물의 숲 게임에 오신 것을 환영합니다. 이제 마을을 탐험하고 꾸며보세요!',
        type: 'info',
        skipable: true
      },
      {
        id: 'movement',
        title: '이동하기',
        description: 'WASD 키 또는 방향키로 캐릭터를 이동할 수 있습니다. Shift 키를 누르면 달릴 수 있어요!',
        type: 'info',
        skipable: true
      },
      {
        id: 'camera',
        title: '카메라 조작',
        description: '마우스를 드래그하여 카메라를 회전할 수 있습니다. 마우스 휠로 확대/축소도 가능해요!',
        type: 'info',
        skipable: true
      },
      {
        id: 'gathering',
        title: '채집하기',
        description: '나무나 돌 같은 오브젝트를 클릭하면 채집할 수 있습니다. 더블클릭하면 빠르게 채집할 수 있어요!',
        type: 'interactive',
        target: 'gathering',
        condition: () => {
          // 채집 성공 여부는 외부에서 확인
          return false
        },
        skipable: true
      },
      {
        id: 'inventory',
        title: '인벤토리',
        description: 'B 키를 누르거나 왼쪽 메뉴에서 가방 아이콘을 클릭하면 인벤토리를 열 수 있습니다.',
        type: 'interactive',
        target: 'inventory',
        condition: () => {
          // 인벤토리 열림 여부는 외부에서 확인
          return false
        },
        skipable: true
      },
      {
        id: 'crafting',
        title: '제작하기',
        description: '인벤토리에서 제작 탭을 열어 재료로 도구나 아이템을 만들 수 있습니다.',
        type: 'interactive',
        target: 'crafting',
        condition: () => {
          // 제작 패널 열림 여부는 외부에서 확인
          return false
        },
        skipable: true
      },
      {
        id: 'shop',
        title: '상점',
        description: '왼쪽 메뉴에서 상점 아이콘을 클릭하면 아이템을 구매하거나 판매할 수 있습니다.',
        type: 'interactive',
        target: 'shop',
        condition: () => {
          // 상점 패널 열림 여부는 외부에서 확인
          return false
        },
        skipable: true
      },
      {
        id: 'farming',
        title: '농사하기',
        description: '농장에 씨앗을 심고 물을 주면 작물을 키울 수 있습니다. 수확한 작물은 판매하거나 요리할 수 있어요!',
        type: 'info',
        skipable: true
      },
      {
        id: 'building',
        title: '건물 건설',
        description: '왼쪽 메뉴에서 건설 아이콘을 클릭하면 건물을 지을 수 있습니다. 재료를 모아서 마을을 꾸며보세요!',
        type: 'info',
        skipable: true
      },
      {
        id: 'complete',
        title: '튜토리얼 완료!',
        description: '기본 조작법을 모두 배웠습니다. 이제 자유롭게 게임을 즐기세요!',
        type: 'info',
        skipable: false
      }
    ]
  }

  /**
   * 튜토리얼 시작
   */
  startTutorial(): void {
    if (this.progress.skipped) {
      return
    }

    if (this.progress.completedSteps.length === 0) {
      // 첫 번째 단계로 시작
      this.progress.currentStep = this.steps[0].id
    } else {
      // 진행 중인 단계 찾기
      const currentIndex = this.steps.findIndex(step => 
        !this.progress.completedSteps.includes(step.id)
      )
      if (currentIndex >= 0) {
        this.progress.currentStep = this.steps[currentIndex].id
      }
    }
  }

  /**
   * 현재 튜토리얼 단계 가져오기
   */
  getCurrentStep(): TutorialStep | null {
    if (!this.progress.currentStep) {
      return null
    }
    return this.steps.find(step => step.id === this.progress.currentStep) || null
  }

  /**
   * 다음 단계로 진행
   */
  nextStep(): void {
    if (!this.progress.currentStep) {
      return
    }

    const currentIndex = this.steps.findIndex(step => step.id === this.progress.currentStep)
    if (currentIndex < 0) {
      return
    }

    // 현재 단계 완료 처리
    if (!this.progress.completedSteps.includes(this.progress.currentStep)) {
      this.progress.completedSteps.push(this.progress.currentStep)
      this.onStepCompleteCallbacks.forEach(callback => {
        callback(this.progress.currentStep!)
      })
    }

    // 다음 단계로 이동
    if (currentIndex < this.steps.length - 1) {
      this.progress.currentStep = this.steps[currentIndex + 1].id
    } else {
      // 튜토리얼 완료
      this.progress.currentStep = null
      this.onTutorialCompleteCallbacks.forEach(callback => callback())
    }
  }

  /**
   * 이전 단계로 돌아가기
   */
  previousStep(): void {
    if (!this.progress.currentStep) {
      return
    }

    const currentIndex = this.steps.findIndex(step => step.id === this.progress.currentStep)
    if (currentIndex > 0) {
      this.progress.currentStep = this.steps[currentIndex - 1].id
    }
  }

  /**
   * 튜토리얼 건너뛰기
   */
  skipTutorial(): void {
    this.progress.skipped = true
    this.progress.currentStep = null
  }

  /**
   * 특정 단계 완료 처리
   */
  completeStep(stepId: string): void {
    if (this.progress.completedSteps.includes(stepId)) {
      return
    }

    this.progress.completedSteps.push(stepId)

    // 현재 단계가 완료된 경우 다음 단계로
    if (this.progress.currentStep === stepId) {
      this.nextStep()
    }

    this.onStepCompleteCallbacks.forEach(callback => {
      callback(stepId)
    })
  }

  /**
   * 조건 확인하여 자동 진행
   */
  checkCondition(stepId: string, conditionMet: boolean): void {
    const step = this.steps.find(s => s.id === stepId)
    if (!step || !step.condition) {
      return
    }

    if (conditionMet && this.progress.currentStep === stepId) {
      this.nextStep()
    }
  }

  /**
   * 튜토리얼 완료 여부 확인
   */
  isCompleted(): boolean {
    return this.progress.completedSteps.length === this.steps.length
  }

  /**
   * 튜토리얼 진행률 가져오기
   */
  getProgress(): number {
    if (this.steps.length === 0) {
      return 0
    }
    return (this.progress.completedSteps.length / this.steps.length) * 100
  }

  /**
   * 튜토리얼 진행 상황 가져오기
   */
  getTutorialProgress(): TutorialProgress {
    return { ...this.progress }
  }

  /**
   * 튜토리얼 진행 상황 로드
   */
  loadProgress(progress: TutorialProgress): void {
    this.progress = { ...progress }
  }

  /**
   * 단계 완료 콜백 등록
   */
  onStepComplete(callback: (stepId: string) => void): () => void {
    this.onStepCompleteCallbacks.push(callback)
    return () => {
      const index = this.onStepCompleteCallbacks.indexOf(callback)
      if (index > -1) {
        this.onStepCompleteCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * 튜토리얼 완료 콜백 등록
   */
  onTutorialComplete(callback: () => void): () => void {
    this.onTutorialCompleteCallbacks.push(callback)
    return () => {
      const index = this.onTutorialCompleteCallbacks.indexOf(callback)
      if (index > -1) {
        this.onTutorialCompleteCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * 특정 단계로 이동
   */
  goToStep(stepId: string): void {
    const step = this.steps.find(s => s.id === stepId)
    if (step) {
      this.progress.currentStep = stepId
    }
  }

  /**
   * 모든 단계 가져오기
   */
  getAllSteps(): TutorialStep[] {
    return [...this.steps]
  }
}
