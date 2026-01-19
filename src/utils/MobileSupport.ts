export class MobileSupport {
  private isMobile: boolean = false
  private isTouchDevice: boolean = false
  private virtualJoystick: HTMLDivElement | null = null

  constructor() {
    this.detectDevice()
    this.setupTouchSupport()
  }

  /**
   * 디바이스 감지
   */
  private detectDevice(): void {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }

  /**
   * 모바일 디바이스 여부
   */
  public isMobileDevice(): boolean {
    return this.isMobile
  }

  /**
   * 터치 디바이스 여부
   */
  public isTouchDeviceMethod(): boolean {
    return this.isTouchDevice
  }

  /**
   * 터치 지원 설정
   */
  private setupTouchSupport(): void {
    if (!this.isTouchDevice) {
      return
    }

    // 터치 이벤트 최적화
    document.addEventListener('touchstart', (e) => {
      // 기본 동작 방지 (스크롤, 줌 등)
      if (e.touches.length > 1) {
        e.preventDefault() // 멀티터치 방지 (핀치 줌 등)
      }
    }, { passive: false })

    document.addEventListener('touchmove', (e) => {
      // 스크롤은 허용하되, 게임 영역에서는 제한
      const target = e.target as HTMLElement
      if (target.id === 'renderCanvas' || target.closest('#renderCanvas')) {
        e.preventDefault()
      }
    }, { passive: false })

    // 가상 조이스틱 (선택적)
    // this.createVirtualJoystick()
  }

  /**
   * 가상 조이스틱 생성 (선택적)
   */
  public createVirtualJoystick(): void {
    if (this.virtualJoystick) {
      return
    }

    this.virtualJoystick = document.createElement('div')
    this.virtualJoystick.id = 'virtual-joystick'
    
    Object.assign(this.virtualJoystick.style, {
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      background: 'rgba(0, 0, 0, 0.5)',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      display: this.isMobile ? 'block' : 'none',
      zIndex: '1000',
      touchAction: 'none'
    })

    const stick = document.createElement('div')
    Object.assign(stick.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: '50px',
      height: '50px',
      marginTop: '-25px',
      marginLeft: '-25px',
      borderRadius: '50%',
      background: 'rgba(255, 255, 255, 0.8)',
      transition: 'transform 0.1s'
    })

    this.virtualJoystick.appendChild(stick)
    document.body.appendChild(this.virtualJoystick)

    // 터치 이벤트 처리
    let isDragging = false
    const centerX = 60
    const centerY = 60
    const maxDistance = 35

    this.virtualJoystick.addEventListener('touchstart', (e) => {
      isDragging = true
      e.preventDefault()
    })

    this.virtualJoystick.addEventListener('touchmove', (e) => {
      if (!isDragging) return
      e.preventDefault()

      const touch = e.touches[0]
      const rect = this.virtualJoystick!.getBoundingClientRect()
      const x = touch.clientX - rect.left - centerX
      const y = touch.clientY - rect.top - centerY
      const distance = Math.sqrt(x * x + y * y)

      if (distance > maxDistance) {
        const angle = Math.atan2(y, x)
        const limitedX = Math.cos(angle) * maxDistance
        const limitedY = Math.sin(angle) * maxDistance
        stick.style.transform = `translate(${limitedX}px, ${limitedY}px)`
        
        // 이동 방향 전역 이벤트 발생
        const direction = {
          x: limitedX / maxDistance,
          y: limitedY / maxDistance
        }
        ;(window as any).virtualJoystickDirection = direction
      } else {
        stick.style.transform = `translate(${x}px, ${y}px)`
        
        const direction = {
          x: x / maxDistance,
          y: y / maxDistance
        }
        ;(window as any).virtualJoystickDirection = direction
      }
    })

    this.virtualJoystick.addEventListener('touchend', () => {
      isDragging = false
      stick.style.transform = 'translate(0, 0)'
      ;(window as any).virtualJoystickDirection = { x: 0, y: 0 }
    })
  }

  /**
   * 반응형 UI 조정
   */
  public adjustUIForMobile(): void {
    if (!this.isMobile) {
      return
    }

    // UI 요소 크기 조정
    const style = document.createElement('style')
    style.textContent = `
      @media (max-width: 768px) {
        #left-menu-bar {
          width: 60px !important;
        }
        
        #top-status-bar {
          font-size: 12px !important;
          padding: 8px !important;
        }
        
        .context-panel {
          max-width: 90% !important;
          max-height: 80vh !important;
        }
        
        button {
          min-height: 44px !important; /* 터치하기 쉬운 크기 */
          min-width: 44px !important;
        }
      }
    `
    document.head.appendChild(style)
  }

  /**
   * 화면 회전 처리
   */
  public handleOrientationChange(): void {
    window.addEventListener('orientationchange', () => {
      // 화면 회전 시 리사이즈
      setTimeout(() => {
        if ((window as any).engine) {
          ;(window as any).engine.resize()
        }
      }, 100)
    })
  }

  /**
   * 배터리 최적화 모드
   */
  public enableBatterySavingMode(): void {
    // FPS 제한
    if ((window as any).engine) {
      // Babylon.js 엔진의 FPS 제한은 별도 설정 필요
      console.log('배터리 절약 모드 활성화')
    }

    // 파티클 효과 감소
    if ((window as any).particleEffects) {
      // 파티클 효과 비활성화 또는 감소
    }
  }
}
