import { Scene, PointerEventTypes, PickingInfo, KeyboardEventTypes } from '@babylonjs/core'

export class InputManager {
    private scene: Scene
    public onLeftClick: (pickInfo: PickingInfo) => void = () => { }
    public onRightClick: () => void = () => { }

    // 키보드 상태 맵
    private keys: { [key: string]: boolean } = {}

    constructor(scene: Scene) {
        this.scene = scene
        this.setupPointerInputs()
        this.setupKeyboardInputs()
    }

    private setupPointerInputs() {
        this.scene.onPointerObservable.add((pointerInfo) => {
            // 우클릭 이벤트를 먼저 차단 (컨텍스트 메뉴 방지)
            if (pointerInfo.event) {
                const mouseEvent = pointerInfo.event as MouseEvent
                if (mouseEvent.button === 2) {
                    // 우클릭 - 즉시 차단
                    mouseEvent.preventDefault()
                    mouseEvent.stopPropagation()
                    mouseEvent.stopImmediatePropagation()
                    // onRightClick은 호출하지 않음 (컨텍스트 메뉴만 차단)
                    return
                }
            }
            
            // 일반 포인터 이벤트 처리
            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERDOWN:
                    if (pointerInfo.event.button === 0) {
                        // 좌클릭
                        this.onLeftClick(pointerInfo.pickInfo!)
                    } else if (pointerInfo.event.button === 2) {
                        // 우클릭 - 추가 보호
                        if (pointerInfo.event) {
                            pointerInfo.event.preventDefault()
                            pointerInfo.event.stopPropagation()
                            pointerInfo.event.stopImmediatePropagation()
                        }
                    }
                    break
                case PointerEventTypes.POINTERUP:
                    // 우클릭 업 이벤트에서도 컨텍스트 메뉴 차단
                    if (pointerInfo.event && pointerInfo.event.button === 2) {
                        pointerInfo.event.preventDefault()
                        pointerInfo.event.stopPropagation()
                        pointerInfo.event.stopImmediatePropagation()
                    }
                    break
            }
        })
    }

    private setupKeyboardInputs() {
        this.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    this.keys[kbInfo.event.key.toLowerCase()] = true
                    break
                case KeyboardEventTypes.KEYUP:
                    this.keys[kbInfo.event.key.toLowerCase()] = false
                    break
            }
        })
    }

    public isKeyDown(key: string): boolean {
        return !!this.keys[key.toLowerCase()]
    }
}
