import { Scene, Camera, Engine, ArcRotateCamera, Vector3 } from '@babylonjs/core'

export class PhotoMode {
  private scene: Scene
  private camera: Camera
  private engine: Engine
  private isActive: boolean = false
  private originalCameraSettings: {
    radius?: number
    alpha?: number
    beta?: number
    target?: Vector3
    upperBetaLimit?: number
    lowerBetaLimit?: number
    lowerRadiusLimit?: number
    upperRadiusLimit?: number
    lockedTarget?: any
  } | null = null
  
  constructor(scene: Scene, camera: Camera, engine: Engine) {
    this.scene = scene
    this.camera = camera
    this.engine = engine
  }
  
  public activate() {
    if (this.isActive) return
    
    this.isActive = true
    
    // 카메라 설정 저장
    if (this.camera instanceof ArcRotateCamera) {
      const arcCamera = this.camera as ArcRotateCamera
      this.originalCameraSettings = {
        radius: arcCamera.radius,
        alpha: arcCamera.alpha,
        beta: arcCamera.beta,
        target: arcCamera.target.clone(),
        upperBetaLimit: arcCamera.upperBetaLimit,
        lowerBetaLimit: arcCamera.lowerBetaLimit,
        lowerRadiusLimit: arcCamera.lowerRadiusLimit,
        upperRadiusLimit: arcCamera.upperRadiusLimit,
        lockedTarget: arcCamera.lockedTarget
      }
    }
    
    // UI 표시
    this.showPhotoModeUI()
  }
  
  public deactivate() {
    if (!this.isActive) return
    
    this.isActive = false
    
    // 카메라 설정 복원
    if (this.originalCameraSettings && this.camera instanceof ArcRotateCamera) {
      const arcCamera = this.camera as ArcRotateCamera
      const settings = this.originalCameraSettings
      
      // 카메라 위치 및 타겟 복원
      if (settings.radius !== undefined) {
        arcCamera.radius = settings.radius
      }
      if (settings.alpha !== undefined) {
        arcCamera.alpha = settings.alpha
      }
      if (settings.beta !== undefined) {
        arcCamera.beta = settings.beta
      }
      if (settings.target) {
        arcCamera.setTarget(settings.target)
      }
      
      // 카메라 제한값 복원
      if (settings.upperBetaLimit !== undefined) {
        arcCamera.upperBetaLimit = settings.upperBetaLimit
      }
      if (settings.lowerBetaLimit !== undefined) {
        arcCamera.lowerBetaLimit = settings.lowerBetaLimit
      }
      if (settings.lowerRadiusLimit !== undefined) {
        arcCamera.lowerRadiusLimit = settings.lowerRadiusLimit
      }
      if (settings.upperRadiusLimit !== undefined) {
        arcCamera.upperRadiusLimit = settings.upperRadiusLimit
      }
      
      // 타겟 잠금 복원
      if (settings.lockedTarget !== undefined) {
        arcCamera.lockedTarget = settings.lockedTarget
      }
    }
    
    // UI 숨김
    this.hidePhotoModeUI()
  }
  
  public toggle() {
    if (this.isActive) {
      this.deactivate()
    } else {
      this.activate()
    }
  }
  
  public takePhoto(): string | null {
    if (!this.isActive) return null
    
    try {
      // 스크린샷 캡처
      const dataURL = this.engine.getRenderingCanvas()?.toDataURL('image/png')
      return dataURL || null
    } catch (error) {
      console.error('사진 촬영 실패:', error)
      return null
    }
  }
  
  private showPhotoModeUI() {
    // 사진 모드 UI 생성
    const ui = document.createElement('div')
    ui.id = 'photo-mode-ui'
    ui.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      padding: 20px;
      border-radius: 10px;
      z-index: 10000;
      text-align: center;
      color: #fff;
    `
    
    ui.innerHTML = `
      <div style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">📸 사진 모드</div>
      <div style="margin-bottom: 15px;">스페이스바: 사진 촬영</div>
      <div style="margin-bottom: 15px;">ESC: 사진 모드 종료</div>
      <button id="photo-mode-take" style="padding: 10px 20px; border-radius: 6px; border: none; background: #4CAF50; color: #fff; cursor: pointer; margin-right: 10px;">사진 촬영</button>
      <button id="photo-mode-exit" style="padding: 10px 20px; border-radius: 6px; border: none; background: #666; color: #fff; cursor: pointer;">종료</button>
    `
    
    document.body.appendChild(ui)
    
    // 버튼 이벤트
    const takeButton = document.getElementById('photo-mode-take')
    const exitButton = document.getElementById('photo-mode-exit')
    
    if (takeButton) {
      takeButton.onclick = () => {
        const photo = this.takePhoto()
        if (photo) {
          this.downloadPhoto(photo)
        }
      }
    }
    
    if (exitButton) {
      exitButton.onclick = () => {
        this.deactivate()
      }
    }
    
    // 키보드 이벤트
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        const photo = this.takePhoto()
        if (photo) {
          this.downloadPhoto(photo)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    ;(ui as any).keyHandler = handleKeyDown
  }
  
  private hidePhotoModeUI() {
    const ui = document.getElementById('photo-mode-ui')
    if (ui) {
      const keyHandler = (ui as any).keyHandler
      if (keyHandler) {
        window.removeEventListener('keydown', keyHandler)
      }
      document.body.removeChild(ui)
    }
  }
  
  private downloadPhoto(dataURL: string) {
    const link = document.createElement('a')
    link.download = `photo_${Date.now()}.png`
    link.href = dataURL
    link.click()
  }
  
  public isActiveMode(): boolean {
    return this.isActive
  }
}
