import { Vector3, Matrix } from '@babylonjs/core'

export interface ActionButton {
    label: string
    onClick: () => void
    primary?: boolean
}

export class ObjectInteractionPopup {
    private element: HTMLDivElement
    private actionsContainer!: HTMLDivElement
    private isVisible: boolean = false
    private worldPosition: Vector3 | null = null
    private scene: any = null
    private camera: any = null
    private screenPosition: { x: number; y: number } | null = null // 화면 좌표 저장
    private targetMesh: any = null // 타겟 메시 저장 (매 프레임 bounding box 재계산용)

    constructor(scene: any, camera: any) {
        this.scene = scene
        this.camera = camera
        this.element = document.createElement('div')
        this.element.id = 'object-interaction-popup'
        this.setupStyles()
        this.createElements()
        document.body.appendChild(this.element)
        this.hide()
        
        // 매 프레임 위치 업데이트 (카메라/플레이어 이동 시 오브젝트 하단에 고정)
        scene.onBeforeRenderObservable.add(() => {
            if (this.isVisible) {
                this.calculateScreenPosition()
                this.applyPosition()
            }
        })
    }

    private setupStyles() {
        Object.assign(this.element.style, {
            position: 'fixed',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            padding: '15px',
            display: 'none',
            flexDirection: 'column',
            gap: '10px',
            zIndex: '1500',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#ffffff',
            minWidth: '200px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'auto'
        })
    }

    private createElements() {
        // 제목 영역
        const titleElement = document.createElement('div')
        titleElement.id = 'popup-title'
        titleElement.style.fontSize = '16px'
        titleElement.style.fontWeight = '600'
        titleElement.style.marginBottom = '10px'
        titleElement.style.display = 'flex'
        titleElement.style.alignItems = 'center'
        titleElement.style.gap = '8px'

        // 작업 버튼 컨테이너
        this.actionsContainer = document.createElement('div')
        this.actionsContainer.style.display = 'flex'
        this.actionsContainer.style.flexDirection = 'column'
        this.actionsContainer.style.gap = '8px'

        // 닫기 버튼
        const closeButton = document.createElement('button')
        closeButton.textContent = '✕'
        closeButton.style.position = 'absolute'
        closeButton.style.top = '8px'
        closeButton.style.right = '8px'
        closeButton.style.width = '24px'
        closeButton.style.height = '24px'
        closeButton.style.padding = '0'
        closeButton.style.borderRadius = '50%'
        closeButton.style.border = 'none'
        closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
        closeButton.style.color = '#fff'
        closeButton.style.cursor = 'pointer'
        closeButton.style.fontSize = '14px'
        closeButton.style.display = 'flex'
        closeButton.style.alignItems = 'center'
        closeButton.style.justifyContent = 'center'
        closeButton.onclick = () => this.hide()

        this.element.appendChild(titleElement)
        this.element.appendChild(this.actionsContainer)
        this.element.appendChild(closeButton)
    }

    public show(targetName: string, icon: string, actions: ActionButton[], worldPosition: Vector3, targetMesh?: any) {
        this.isVisible = true
        this.worldPosition = worldPosition.clone()
        this.targetMesh = targetMesh || null // 타겟 메시 저장
        
        const titleElement = this.element.querySelector('#popup-title') as HTMLElement
        if (titleElement) {
            titleElement.innerHTML = `${icon} ${targetName}`
        } else {
            console.warn('제목 요소를 찾을 수 없습니다')
        }
        
        this.actionsContainer.innerHTML = ''
        actions.forEach(action => {
            const button = document.createElement('button')
            button.textContent = action.label
            button.style.padding = '10px 16px'
            button.style.borderRadius = '8px'
            button.style.border = 'none'
            button.style.backgroundColor = action.primary 
                ? 'rgba(100, 150, 255, 0.8)' 
                : 'rgba(255, 255, 255, 0.2)'
            button.style.color = '#fff'
            button.style.cursor = 'pointer'
            button.style.fontSize = '14px'
            button.style.fontWeight = action.primary ? '600' : '400'
            button.style.width = '100%'
            button.style.textAlign = 'left'
            button.onclick = () => {
                action.onClick()
                this.hide() // 작업 실행 후 닫기
            }

            this.actionsContainer.appendChild(button)
        })

        // 위치 계산 및 표시
        this.calculateScreenPosition()
        this.applyPosition()
        this.element.style.display = 'flex'
    }

    public hide() {
        this.isVisible = false
        this.worldPosition = null
        this.screenPosition = null
        this.targetMesh = null
        this.element.style.display = 'none'
    }

    private calculateScreenPosition() {
        // 타겟 메시가 있으면 매 프레임 bounding box 재계산 (오브젝트가 움직일 수 있음)
        // 단, 월드 좌표는 업데이트하되 오브젝트 하단 중심 위치를 유지
        if (this.targetMesh) {
            try {
                const boundingInfo = this.targetMesh.getBoundingInfo()
                if (!boundingInfo) {
                    return
                }
                boundingInfo.update(this.targetMesh.getWorldMatrix())
                const boundingBox = boundingInfo.boundingBox
                
                // bounding box의 하단 중심 위치 계산 (매 프레임 업데이트)
                this.worldPosition = new Vector3(
                    (boundingBox.minimumWorld.x + boundingBox.maximumWorld.x) / 2, // X: 중심
                    boundingBox.minimumWorld.y, // Y: 하단 (지면 접촉점)
                    (boundingBox.minimumWorld.z + boundingBox.maximumWorld.z) / 2  // Z: 중심
                )
            } catch (error) {
                console.warn('Bounding box 계산 실패:', error)
                return
            }
        }
        
        if (!this.worldPosition || !this.scene || !this.camera) {
            return
        }

        try {
            // 3D 위치를 화면 좌표로 변환
            const engine = this.scene.getEngine()
            const width = engine.getRenderWidth()
            const height = engine.getRenderHeight()
            
            if (width === 0 || height === 0) {
                return // 엔진이 초기화되지 않음
            }
            
            const viewport = this.camera.viewport.toGlobal(width, height)

            // 카메라의 view-projection 매트릭스 사용
            const viewMatrix = this.camera.getViewMatrix()
            const projectionMatrix = this.camera.getProjectionMatrix()
            const transformMatrix = viewMatrix.multiply(projectionMatrix)

            // Vector3.Project를 사용하여 3D 월드 좌표를 2D 화면 좌표로 변환
            // 결과: vector.x, vector.y는 화면 픽셀 좌표, vector.z는 깊이 (0~1)
            const vector = Vector3.Project(
                this.worldPosition.clone(),
                Matrix.Identity(), // 월드 매트릭스는 이미 월드 좌표이므로 Identity 사용
                transformMatrix,
                viewport
            )

            // 화면 밖에 있는지 확인 (Z 좌표가 0~1 범위 안에 있어야 화면에 보임)
            const isOffScreen = vector.z < 0 || vector.z > 1
            const hasInvalidCoords = isNaN(vector.x) || isNaN(vector.y) || !isFinite(vector.x) || !isFinite(vector.y)
            
            if (isOffScreen || hasInvalidCoords) {
                this.screenPosition = null
                return
            }

            // 화면 좌표계에서 (0,0)은 왼쪽 상단
            // vector.y는 화면 상단에서부터의 거리 (픽셀 단위)
            // 오브젝트 하단에 팝업을 표시하려면 vector.y를 그대로 사용 (이미 하단 스크린 좌표)
            const offsetX = 0 // X는 오브젝트 중심 (중앙 정렬)
            const offsetY = 15 // Y는 오브젝트 하단 아래에 약간 여유를 두고 표시 (픽셀)

            const screenX = vector.x + offsetX
            const screenY = vector.y + offsetY // Y는 아래로 증가하므로 +offsetY는 더 아래

            // 화면 경계 체크 (화면 밖으로 나가지 않도록)
            const popupWidth = 220
            const popupHeight = 150
            const margin = 10
            const maxX = width - popupWidth - margin
            const maxY = height - popupHeight - 72 - margin // 하단 여백 고려

            // 화면 경계 내로 제한
            // X는 중앙 정렬 (팝업 너비의 절반을 왼쪽으로 이동)
            const finalX = Math.max(margin, Math.min(screenX - popupWidth / 2, maxX))
            // Y는 오브젝트 하단 아래에 표시 (팝업의 상단이 오브젝트 하단 아래에 위치)
            const finalY = Math.max(44 + margin, Math.min(screenY, maxY)) // 상단 상태바 높이 고려

            this.screenPosition = { x: finalX, y: finalY }
        } catch (error) {
            console.warn('팝업 위치 계산 실패:', error)
            this.screenPosition = null
        }
    }

    private applyPosition() {
        if (!this.screenPosition) {
            this.element.style.display = 'none'
            return
        }

        this.element.style.left = `${this.screenPosition.x}px`
        this.element.style.top = `${this.screenPosition.y}px`
        this.element.style.transform = 'none' // 왼쪽 정렬 (오른쪽에 붙여서 표시)
    }

    public isPopupVisible(): boolean {
        return this.isVisible
    }
}
