import { Scene, Vector3, Mesh, Matrix } from '@babylonjs/core'

export class SpeechBubble {
  private scene: Scene
  private npcMesh: Mesh | null = null
  private element: HTMLDivElement | null = null
  private isVisible: boolean = false
  private hideTimeout: number | null = null
  private updateObserver: any = null
  private onHideCallback: (() => void) | null = null

  constructor(scene: Scene) {
    this.scene = scene
  }

  public show(npcMesh: Mesh, dialogue: string, duration: number = 5000, onHide?: () => void) {
    this.onHideCallback = onHide || null
    // 기존 말풍선 제거
    this.hide()

    this.npcMesh = npcMesh
    this.isVisible = true

    // HTML 요소 생성
    this.element = document.createElement('div')
    this.element.id = 'speech-bubble'
    this.element.style.position = 'fixed'
    this.element.style.backgroundColor = '#2C3E50'
    this.element.style.color = '#FFFFFF'
    this.element.style.padding = '15px 20px'
    this.element.style.borderRadius = '15px'
    this.element.style.border = '2px solid #FFFFFF'
    this.element.style.fontSize = '16px'
    this.element.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    this.element.style.maxWidth = '400px'
    this.element.style.minWidth = '200px'
    this.element.style.textAlign = 'left'
    this.element.style.zIndex = '2000'
    this.element.style.pointerEvents = 'none'
    this.element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)'
    this.element.style.wordWrap = 'break-word'
    this.element.textContent = dialogue
    document.body.appendChild(this.element)

    // NPC 머리 위에 위치하도록 업데이트
    this.updatePosition()

    // 매 프레임 위치 업데이트
    this.updateObserver = this.scene.onBeforeRenderObservable.add(() => {
      if (this.isVisible && this.npcMesh && this.element) {
        this.updatePosition()
      }
    })

    // 자동 숨김
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout)
    }
    this.hideTimeout = window.setTimeout(() => {
      this.hide()
      if (this.onHideCallback) {
        this.onHideCallback()
        this.onHideCallback = null
      }
    }, duration)
  }

  private updatePosition() {
    if (!this.npcMesh || !this.element || !this.scene.activeCamera) return

    // NPC의 실제 head 위치 찾기 (rootMesh의 자식 중 head 찾기)
    let headMesh: Mesh | null = null
    if (this.npcMesh.name.includes('head')) {
      headMesh = this.npcMesh
    } else {
      // rootMesh인 경우 자식 중 head 찾기
      const childMeshes = this.npcMesh.getChildMeshes(true)
      headMesh = childMeshes.find((m: Mesh) => m.name.includes('head')) as Mesh || this.npcMesh
    }
    
    // NPC 머리 위 위치 계산 (headMesh의 절대 위치 사용)
    const headPosition = headMesh.getAbsolutePosition()
    const bubblePosition = new Vector3(
      headPosition.x,
      headPosition.y + 0.3, // 머리 위 약 0.3m
      headPosition.z
    )

    // 3D 위치를 2D 화면 좌표로 변환
    const transformMatrix = this.scene.getTransformMatrix()
    const viewport = this.scene.activeCamera.viewport.toGlobal(
      this.scene.getEngine().getRenderWidth(),
      this.scene.getEngine().getRenderHeight()
    )
    
    const screenPosition = Vector3.Project(
      bubblePosition,
      Matrix.Identity(), // 월드 매트릭스는 이미 월드 좌표이므로 Identity 사용
      transformMatrix,
      viewport
    )

    // 화면 좌표를 픽셀 좌표로 변환
    const screenWidth = this.scene.getEngine().getRenderWidth()
    const screenHeight = this.scene.getEngine().getRenderHeight()
    
    // 화면 밖이면 숨김
    if (screenPosition.x < 0 || screenPosition.x > screenWidth || 
        screenPosition.y < 0 || screenPosition.y > screenHeight ||
        screenPosition.z < 0 || screenPosition.z > 1) {
      this.element.style.display = 'none'
      return
    }
    
    this.element.style.display = 'block'
    
    // 중앙 정렬을 위해 조정 (말풍선 너비의 절반만큼 왼쪽으로)
    const bubbleWidth = 400 // 말풍선 최대 너비
    const left = screenPosition.x - (bubbleWidth / 2)
    const top = screenPosition.y - 60 // 머리 위로
    
    this.element.style.left = `${left}px`
    this.element.style.top = `${top}px`
  }

  public hide() {
    this.isVisible = false
    
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout)
      this.hideTimeout = null
    }

    if (this.updateObserver) {
      this.scene.onBeforeRenderObservable.remove(this.updateObserver)
      this.updateObserver = null
    }

    if (this.element) {
      this.element.remove()
      this.element = null
    }

    this.npcMesh = null
  }

  public isShowing(): boolean {
    return this.isVisible
  }
}
