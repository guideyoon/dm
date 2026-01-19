import { Scene, Vector3, Mesh, StandardMaterial, Color3, MeshBuilder, PickingInfo } from '@babylonjs/core'
import { InputManager } from './InputManager'
import { UIManagerNew } from './UIManagerNew'
import { Item } from './Item'
import { InventoryManager } from './InventoryManager'
import { GatheringSystem } from './gathering/GatheringSystem'
import { FishingSystem } from './systems/FishingSystem'
import { BugCatchingSystem } from './systems/BugCatchingSystem'
import { FarmingSystem } from './systems/FarmingSystem'
import { NPCSystem } from './systems/NPCSystem'

export class PlayerController {
  private scene: Scene
  private mesh: Mesh
  private inputManager: InputManager
  private uiManager: UIManagerNew;
  private inventoryManager: InventoryManager
  private gatheringSystem: GatheringSystem | null = null
  private fishingSystem: FishingSystem | null = null
  private bugCatchingSystem: BugCatchingSystem | null = null
  private farmingSystem: FarmingSystem | null = null
  private npcSystem: NPCSystem | null = null
  private speed: number = 5
  private walkSpeed: number = 5
  private runSpeed: number = 8 // 달리기 속도
  private rotationSpeed: number = 4
  private isRunning: boolean = false // 달리기 상태

  // 이동 관련 변수
  private targetPosition: Vector3 | null = null
  private isMoving: boolean = false
  private moveMarker: Mesh | null = null
  
  // 채집 관련 변수
  private currentHarvestTarget: Mesh | null = null
  private isHarvesting: boolean = false
  private clickedObject: Mesh | null = null
  private harvestCountMap: Map<Mesh, number> = new Map() // 각 오브젝트별 채집 횟수 추적 (메시 인스턴스 기반)
  
  // 더블클릭 빠른 채집 관련 변수
  private lastClickTime: number = 0
  private lastClickedMesh: Mesh | null = null
  private doubleClickThreshold: number = 300 // 더블클릭 감지 시간 (밀리초)
  
  // 자동 채집 관련 변수
  private autoHarvestMode: boolean = false
  private autoHarvestCooldown: number = 3000 // 자동 채집 쿨타임 (3초)
  private lastAutoHarvestTime: number = 0 // 마지막 자동 채집 시간
  private consecutiveHarvestFailures: number = 0 // 연속 실패 횟수
  private maxConsecutiveFailures: number = 3 // 최대 연속 실패 횟수 (3회 실패 시 자동 채집 일시 중지)
  private lastHarvestedMesh: Mesh | null = null // 마지막으로 채집한 메시
  private lastHarvestedTime: number = 0 // 마지막 채집 시간
  private meshHarvestCooldown: number = 5000 // 같은 오브젝트 재채집 쿨타임 (5초)
  
  // 건물 배치 모드 관련 변수
  private buildingMode: boolean = false
  private buildingPreviewMesh: Mesh | null = null
  private buildingSystem: any = null
  
  // 꾸미기 배치 모드 관련 변수
  private decorationMode: boolean = false
  private decorationSystem: any = null
  private furnitureEditMode: boolean = false
  private selectedFurniture: any = null
  
  // 가구 사용 상태
  private isSitting: boolean = false
  private isSleeping: boolean = false
  private currentFurniture: any = null // 현재 사용 중인 가구
  
  // 건물 내부 시스템 참조
  private interiorSystem: any = null
  
  // 숨겨진 컨텐츠 시스템 참조
  private hiddenContentSystem: any = null
  
  // 사운드 시스템 참조
  private soundSystem: any = null
  
  // 튜토리얼 시스템 참조
  private tutorialSystem: any = null
  
  // 하이라이트 관련 변수
  private lastHoveredMesh: Mesh | null = null

  // 애니메이션 관련 변수
  private leftLeg: Mesh | null = null
  private rightLeg: Mesh | null = null
  private leftArm: Mesh | null = null
  private rightArm: Mesh | null = null
  private head: Mesh | null = null
  private leftEye: Mesh | null = null
  private rightEye: Mesh | null = null
  private mouth: Mesh | null = null
  private walkTime: number = 0
  
  // 감정 표현 관련 변수
  private currentEmotion: 'normal' | 'happy' | 'tired' | 'excited' | 'wave' | 'jump' | 'dance' | null = 'normal'
  private emotionTimer: number = 0
  private emotionAnimationTime: number = 0
  private isEmotionAnimating: boolean = false

  constructor(scene: Scene, mesh: Mesh, inputManager: InputManager, uiManager: UIManagerNew, inventoryManager: InventoryManager) {
    this.scene = scene
    this.mesh = mesh
    this.inputManager = inputManager
    this.uiManager = uiManager;
    this.inventoryManager = inventoryManager
    this.gatheringSystem = new GatheringSystem(inventoryManager)
    this.fishingSystem = new FishingSystem(scene, inventoryManager)
    this.bugCatchingSystem = new BugCatchingSystem(scene, inventoryManager)
    this.farmingSystem = new FarmingSystem(scene, inventoryManager)
    this.npcSystem = new NPCSystem(scene, inventoryManager)

    // 신체 부위 찾기
    this.leftLeg = scene.getMeshByName("leftLeg") as Mesh
    this.rightLeg = scene.getMeshByName("rightLeg") as Mesh
    this.leftArm = scene.getMeshByName("leftArm") as Mesh
    this.rightArm = scene.getMeshByName("rightArm") as Mesh
    this.head = scene.getMeshByName("head") as Mesh
    
    // 다리와 팔의 회전 중심을 몸통과의 연결 부분으로 설정
    if (this.leftLeg) {
      // 다리 메시의 상단(몸통 연결부)을 회전 중심으로 설정
      this.leftLeg.setPivotPoint(new Vector3(0, 0.3, 0)) // 다리 높이의 절반(0.3)이 상단
    }
    if (this.rightLeg) {
      this.rightLeg.setPivotPoint(new Vector3(0, 0.3, 0))
    }
    if (this.leftArm) {
      // 팔 메시의 상단(어깨 연결부)을 회전 중심으로 설정
      // 팔 높이 0.5의 절반인 0.25가 상단
      this.leftArm.setPivotPoint(new Vector3(0, 0.25, 0))
    }
    if (this.rightArm) {
      // 팔 메시의 상단(어깨 연결부)을 회전 중심으로 설정
      this.rightArm.setPivotPoint(new Vector3(0, 0.25, 0))
    }
    this.leftEye = scene.getMeshByName("leftEye") as Mesh
    this.rightEye = scene.getMeshByName("rightEye") as Mesh
    this.mouth = scene.getMeshByName("mouth") as Mesh

    this.createMoveMarker()

    // InputManager를 통한 입력 처리
    this.inputManager.onLeftClick = (pickInfo: PickingInfo) => {
      this.handleInput(pickInfo)
    }

    // 마우스 오버 하이라이트 처리
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === 1) { // POINTERMOVE
        this.handlePointerMove(pointerInfo)
      }
    })

    // 매 프레임 업데이트
    this.scene.onBeforeRenderObservable.add(() => {
      this.update()
    })
  }

  private createMoveMarker() {
    this.moveMarker = MeshBuilder.CreateDisc("moveMarker", { radius: 0.3 }, this.scene)
    this.moveMarker.rotation.x = Math.PI / 2
    const mat = new StandardMaterial("moveMarkerMat", this.scene)
    mat.diffuseColor = Color3.Yellow()
    mat.alpha = 0.6
    this.moveMarker.material = mat
    this.moveMarker.isVisible = false
  }

  private handleInput(pickInfo: PickingInfo) {
    if (pickInfo.hit && pickInfo.pickedPoint && pickInfo.pickedMesh) {
      const pickedMesh = pickInfo.pickedMesh

      // 오브젝트 이름을 한글로 변환하는 함수
      const getObjectName = (meshName: string): string => {
        if (meshName === "ground") return "땅"
        if (meshName.includes("trunk")) return "나무"
        if (meshName.includes("leaves")) return "나무"
        if (meshName.includes("rock")) return "바위"
        if (meshName.includes("head")) return "머리"
        if (meshName.includes("body")) return "몸통"
        if (meshName.includes("leftLeg") || meshName.includes("rightLeg")) return "다리"
        if (meshName.includes("leftArm") || meshName.includes("rightArm")) return "팔"
        if (meshName.includes("leftEye") || meshName.includes("rightEye")) return "눈"
        if (meshName.includes("nose")) return "코"
        if (meshName.includes("mouth")) return "입"
        if (meshName.includes("hair")) return "머리카락"
        if (meshName.includes("_item")) {
          const itemType = meshName.includes("Wood") ? "나무 아이템" : "돌 아이템"
          return itemType
        }
        return meshName // 기본값으로 원본 이름 반환
      }

      const objectName = getObjectName(pickedMesh.name)

      // 낚시 포인트 클릭 체크
      if (this.fishingSystem && this.fishingSystem.isFishingSpot(pickedMesh)) {
        const location = this.fishingSystem.getFishingSpotLocation(pickedMesh)
        this.handleFishing(location)
        return
      }
      
      // 벌레 스폰 포인트 클릭 체크
      if (this.bugCatchingSystem && this.bugCatchingSystem.isBugSpawn(pickedMesh)) {
        const location = this.bugCatchingSystem.getBugSpawnLocation(pickedMesh)
        this.handleBugCatching(location)
        return
      }
      
      // 농장 밭 클릭 체크
      if (this.farmingSystem && this.farmingSystem.isFarmPlot(pickedMesh)) {
        const plot = this.farmingSystem.getFarmPlot(pickedMesh)
        if (plot) {
          this.handleFarmPlotClick(plot)
        }
        return
      }
      
      // NPC 클릭 체크
      if (this.npcSystem && this.npcSystem.isNPC(pickedMesh)) {
        const npc = this.npcSystem.getNPC(pickedMesh)
        if (npc) {
          this.handleNPCClick(npc)
        }
        return
      }

      // 건물 클릭 체크
      if (pickedMesh.metadata && pickedMesh.metadata.type === 'building') {
        const buildingId = this.findBuildingIdByMesh(pickedMesh)
        if (buildingId) {
          this.handleBuildingClick(buildingId)
          return
        }
      }
      
      // 가구 클릭 체크
      if (pickedMesh.metadata && pickedMesh.metadata.type === 'furniture' && this.decorationSystem) {
        const furniture = this.decorationSystem.getFurnitureByMesh(pickedMesh)
        if (furniture) {
          // 편집 모드에서 가구 클릭 시 이동
          if (this.furnitureEditMode && pickInfo.pickedPoint) {
            const newPosition = {
              x: pickInfo.pickedPoint.x,
              y: pickInfo.pickedPoint.y,
              z: pickInfo.pickedPoint.z
            }
            if (this.decorationSystem.moveFurniture(furniture.id, newPosition)) {
              this.uiManager.showMessage(`${furniture.name}을(를) 이동했습니다.`, false)
            }
            return
          }
          
          // 편집 모드 활성화 (UI 표시)
          if (!this.furnitureEditMode && this.uiManager && typeof (this.uiManager as any).showFurnitureEditPanel === 'function') {
            this.furnitureEditMode = true
            this.selectedFurniture = furniture
            ;(this.uiManager as any).showFurnitureEditPanel(furniture)
            return
          }
          
          // 사용 가능한 가구인 경우 사용
          if (this.decorationSystem.canUseFurniture(furniture)) {
            this.handleFurnitureClick(furniture)
            return
          }
        }
      }
      
      // 가구 사용 중이면 E키로 일어나기
      if (this.isSitting || this.isSleeping) {
        if (this.inputManager.isKeyDown('e')) {
          this.stopUsingFurniture()
          return
        }
        // 가구 사용 중에는 이동 불가
        return
      }
      
      // 땅을 클릭했는지, 아니면 상호작용 가능한 물체(나무, 바위)를 클릭했는지 판별
      if (pickedMesh.name === "ground") {
        // 건물 배치 모드인 경우 건물 배치 처리
        if (this.buildingMode && pickInfo.pickedPoint) {
          const position = {
            x: pickInfo.pickedPoint.x,
            y: pickInfo.pickedPoint.y,
            z: pickInfo.pickedPoint.z
          }
          
          if (this.uiManager && typeof (this.uiManager as any).handleBuildingPlacement === 'function') {
            const success = (this.uiManager as any).handleBuildingPlacement(position)
            if (success) {
              // 배치 성공 시 이동하지 않음
              return
            }
          }
        }
        
        // 꾸미기 배치 모드인 경우 가구 배치 처리
        if (this.decorationMode && pickInfo.pickedPoint) {
          const position = {
            x: pickInfo.pickedPoint.x,
            y: pickInfo.pickedPoint.y,
            z: pickInfo.pickedPoint.z
          }
          
          if (this.uiManager && typeof (this.uiManager as any).handleDecorationPlacement === 'function') {
            const success = (this.uiManager as any).handleDecorationPlacement(position)
            if (success) {
              // 배치 성공 시 이동하지 않음
              return
            }
          }
        }
        
        // 편집 모드 비활성화 (땅 클릭 시)
        if (this.furnitureEditMode) {
          this.furnitureEditMode = false
          this.selectedFurniture = null
          if (this.uiManager && typeof (this.uiManager as any).hideFurnitureEditPanel === 'function') {
            ;(this.uiManager as any).hideFurnitureEditPanel()
          }
        }
        
        this.targetPosition = pickInfo.pickedPoint.clone()
        this.isMoving = true
        // 땅 클릭 시 마커 표시 및 메시지/팝업 숨김
        if (this.moveMarker) {
          this.moveMarker.position = pickInfo.pickedPoint.clone()
          this.moveMarker.position.y += 0.05
          this.moveMarker.isVisible = true
        }
        this.uiManager.hideMessage()
        this.uiManager.hideObjectInteractionPopup()
        this.clickedObject = null
      } else if (pickedMesh.name.includes("trunk") || pickedMesh.name.includes("leaves") || pickedMesh.name.includes("rock") || 
                 pickedMesh.name.includes("stump") || pickedMesh.name.includes("berryBush") || pickedMesh.name.includes("herb") ||
                 pickedMesh.name.includes("fruitTree") || pickedMesh.name.includes("shell") || pickedMesh.name.includes("mushroomCap") ||
                 pickedMesh.name.includes("flowerCenter")) {
        // 더블클릭 빠른 채집 감지
        const currentTime = Date.now()
        const isDoubleClick = (currentTime - this.lastClickTime < this.doubleClickThreshold) && 
                              this.lastClickedMesh === pickedMesh
        
        if (isDoubleClick) {
          // 더블클릭: 바로 채집 시작
          const actionType = this.getActionTypeForMesh(pickedMesh as Mesh)
          if (actionType) {
            this.performHarvest(pickedMesh as Mesh, actionType)
            // 더블클릭 후 상태 초기화
            this.lastClickTime = 0
            this.lastClickedMesh = null
            return
          }
        }
        
        // 일반 클릭: 팝업 표시만 (이동 없음)
        this.lastClickTime = currentTime
        this.lastClickedMesh = pickedMesh as Mesh
        this.clickedObject = pickedMesh as Mesh
        this.showActionBar(pickedMesh as Mesh)
        // 이동하지 않음 - 상호작용만 가능
        // 오브젝트 클릭 시 마커 숨김
        if (this.moveMarker) this.moveMarker.isVisible = false
      } else {
        // 기타 오브젝트 클릭 시에도 이름 표시 (계속 표시)
        this.uiManager.showMessage(objectName, true)
        this.uiManager.hideObjectInteractionPopup()
        this.clickedObject = null
      }
    }
  }

  private handlePointerMove(pointerInfo: any) {
    const pickInfo = pointerInfo.pickInfo
    if (!pickInfo || !pickInfo.hit || !pickInfo.pickedMesh) {
      // 아무것도 가리키지 않으면 하이라이트 제거
      if (this.lastHoveredMesh && (window as any).highlightManager) {
        ;(window as any).highlightManager.unhighlight(this.lastHoveredMesh)
        this.lastHoveredMesh = null
      }
      return
    }

    const pickedMesh = pickInfo.pickedMesh as Mesh
    
    // 같은 메시를 가리키고 있으면 무시
    if (this.lastHoveredMesh === pickedMesh) {
      return
    }

    // 이전 하이라이트 제거
    if (this.lastHoveredMesh && (window as any).highlightManager) {
      ;(window as any).highlightManager.unhighlight(this.lastHoveredMesh)
    }

    // 상호작용 가능한 오브젝트인지 확인
    if (this.isInteractableMesh(pickedMesh)) {
      this.lastHoveredMesh = pickedMesh
      
      // 하이라이트 표시
      if ((window as any).highlightManager) {
        if (this.isGatherableMesh(pickedMesh)) {
          ;(window as any).highlightManager.highlightInteractable(pickedMesh)
        } else if (pickedMesh.metadata?.type === 'building') {
          ;(window as any).highlightManager.highlightBuilding(pickedMesh)
        } else if (this.npcSystem && this.npcSystem.isNPC(pickedMesh)) {
          ;(window as any).highlightManager.highlightNPC(pickedMesh)
        } else {
          ;(window as any).highlightManager.highlight(pickedMesh)
        }
      }
    } else {
      this.lastHoveredMesh = null
    }
  }

  private isInteractableMesh(mesh: Mesh): boolean {
    if (!mesh || mesh.name === 'ground') return false
    
    // 채집 가능한 오브젝트
    if (this.isGatherableMesh(mesh)) return true
    
    // 건물
    if (mesh.metadata?.type === 'building') return true
    
    // NPC
    if (this.npcSystem && this.npcSystem.isNPC(mesh)) return true
    
    // 가구
    if (mesh.metadata?.type === 'furniture') return true
    
    // 농장 밭
    if (this.farmingSystem && this.farmingSystem.isFarmPlot(mesh)) return true
    
    // 낚시 포인트
    if (this.fishingSystem && this.fishingSystem.isFishingSpot(mesh)) return true
    
    // 벌레 스폰
    if (this.bugCatchingSystem && this.bugCatchingSystem.isBugSpawn(mesh)) return true
    
    return false
  }

  private isGatherableMesh(mesh: Mesh): boolean {
    const name = mesh.name.toLowerCase()
    return name.includes('trunk') || 
           name.includes('leaves') || 
           name.includes('rock') || 
           name.includes('stump') ||
           name.includes('berrybush') ||
           name.includes('herb') ||
           name.includes('fruittree') ||
           name.includes('shell') ||
           name.includes('mushroomcap') ||
           name.includes('petal') ||
           name.includes('flowercenter')
  }

  private update() {
    const deltaTime = this.scene.getEngine().getDeltaTime() / 1000

    // ESC 키로 배치 모드/편집 모드 취소
    if (this.inputManager.isKeyDown('Escape')) {
      if (this.buildingMode) {
        this.buildingMode = false
        this.uiManager.showMessage('건물 배치 모드를 취소했습니다.', false)
      }
      if (this.decorationMode) {
        this.decorationMode = false
        if (this.uiManager && typeof (this.uiManager as any).clearPendingDecorationType === 'function') {
          ;(this.uiManager as any).clearPendingDecorationType()
        }
        this.uiManager.showMessage('가구 배치 모드를 취소했습니다.', false)
      }
      if (this.furnitureEditMode) {
        this.furnitureEditMode = false
        this.selectedFurniture = null
        if (this.uiManager && typeof (this.uiManager as any).hideFurnitureEditPanel === 'function') {
          ;(this.uiManager as any).hideFurnitureEditPanel()
        }
      }
    }
    
    // 가구 사용 중이면 E키로 일어나기 체크
    if (this.isSitting || this.isSleeping) {
      if (this.inputManager.isKeyDown('e')) {
        this.stopUsingFurniture()
      }
      // 가구 사용 중에는 이동 불가
      return
    }

    // 건설 모드일 때 미리보기 업데이트
    if (this.buildingMode) {
      this.updateBuildingPreview()
    }

    // 오브젝트와의 거리 확인 (걷기 애니메이션 제어용)
    const contactDistance = 2.0
    let isNearObject = false
    this.scene.meshes.forEach(m => {
      const meshName = m.name.toLowerCase()
      if (meshName.includes("trunk") || meshName.includes("leaves") || meshName.includes("rock")) {
        const distance = Vector3.Distance(m.position, this.mesh.position)
        if (distance < contactDistance) {
          isNearObject = true
        }
      }
    })

    // 클릭한 오브젝트가 있으면 팝업 위치만 업데이트 (카메라/플레이어 이동 시)
    if (this.clickedObject && !this.isHarvesting) {
      // 클릭한 오브젝트가 여전히 존재하는지 확인
      const stillExists = this.scene.meshes.some(m => m === this.clickedObject)
      if (stillExists) {
        // 팝업 위치만 업데이트 (showActionBar는 다시 호출하지 않음)
        const popupPosition = this.clickedObject.position.clone()
        // 위치 업데이트는 팝업 내부에서 자동으로 처리됨
      } else {
        // 오브젝트가 사라졌으면 팝업 숨김
        this.clickedObject = null
        this.uiManager.hideObjectInteractionPopup()
      }
    }

    if (this.isMoving && this.targetPosition) {
      // Shift 키로 달리기 모드 전환
      this.isRunning = this.inputManager.isKeyDown('Shift')
      this.speed = this.isRunning ? this.runSpeed : this.walkSpeed
      
      // 채집 중이 아니고 오브젝트에 닿지 않았을 때만 애니메이션 실행
      if (!this.isHarvesting && !isNearObject) {
        if (this.isRunning) {
          this.animateRun(deltaTime)
        } else {
          this.animateWalk(deltaTime)
        }
      } else if (!this.isHarvesting) {
        this.resetAnimation()
      }

      const direction = this.targetPosition.subtract(this.mesh.position)
      direction.y = 0

      if (direction.length() < 0.1) {
        this.isMoving = false
        if (this.moveMarker) this.moveMarker.isVisible = false
        if (!this.isHarvesting) {
          this.resetAnimation()
        }
        this.isRunning = false // 이동이 끝나면 달리기 상태도 초기화
        return
      }

      const moveVector = direction.normalize()
      this.mesh.moveWithCollisions(moveVector.scale(this.speed * deltaTime))

      const targetAngle = Math.atan2(moveVector.x, moveVector.z)
      const currentRotation = this.mesh.rotation.y

      let diff = targetAngle - currentRotation;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      this.mesh.rotation.y += diff * this.rotationSpeed * deltaTime;
    } else if (!this.isHarvesting) {
      // 채집 중이 아닐 때만 애니메이션 리셋
      this.resetAnimation();
      this.isRunning = false // 이동이 끝나면 달리기 상태도 초기화
    }
    
    // 감정 표현 타이머 및 애니메이션 업데이트
    if (this.currentEmotion && this.currentEmotion !== 'normal') {
      if (this.emotionTimer > 0 && Date.now() >= this.emotionTimer) {
        // 감정 표현 시간이 지나면 기본 상태로 복원
        this.setEmotion('normal', 0)
        this.isEmotionAnimating = false
        this.emotionAnimationTime = 0
      } else if (this.currentEmotion !== 'normal') {
        // 이모션 애니메이션 실행
        this.animateEmotion(deltaTime)
      }
    }
    // Check for nearby items to pick up
    const pickupRadius = 1.0;
    this.scene.meshes.forEach(m => {
      if (m.metadata && m.metadata.item && !m.metadata.picked) {
        const distance = Vector3.Distance(m.position, this.mesh.position);
        if (distance < pickupRadius) {
          const item: Item = m.metadata.item;
          const success = this.inventoryManager.add(item.name, 1);
          if (success) {
            m.metadata.picked = true;
            m.dispose();
            // 인벤토리 UI 업데이트 (재화가 누적되도록)
            this.uiManager.updateInventory();
          }
        }
      }
    });
    
    // 자동 채집 모드
    if (this.autoHarvestMode && !this.isHarvesting && !this.isMoving) {
      // 연속 실패가 너무 많으면 자동 채집 일시 중지
      if (this.consecutiveHarvestFailures >= this.maxConsecutiveFailures) {
        return
      }
      
      const now = Date.now()
      if (now - this.lastAutoHarvestTime >= this.autoHarvestCooldown) {
        const found = this.findAndHarvestNearbyObject()
        this.lastAutoHarvestTime = now
        
        // 채집 가능한 오브젝트를 찾지 못하면 실패 횟수 증가
        if (!found) {
          this.consecutiveHarvestFailures++
        } else {
          // 성공하면 실패 횟수 리셋
          this.consecutiveHarvestFailures = 0
        }
      }
    }
  }
  
  // 주변 오브젝트 찾아서 자동 채집
  // 반환값: 채집 가능한 오브젝트를 찾았는지 여부
  private findAndHarvestNearbyObject(): boolean {
    const searchRadius = 15.0 // 검색 반경을 15m로 확대
    const harvestableObjects: { mesh: Mesh; distance: number; actionType: 'wood' | 'mineral' | 'plant' }[] = []
    const now = Date.now()
    
    // 채집 가능한 오브젝트 찾기
    this.scene.meshes.forEach(m => {
      if (!(m instanceof Mesh)) return
      if (!m.isPickable) return // 채집 불가능한 오브젝트 제외
      
      // 방금 채집한 오브젝트는 쿨타임 동안 제외
      if (m === this.lastHarvestedMesh) {
        if (now - this.lastHarvestedTime < this.meshHarvestCooldown) {
          return
        }
      }
      
      const meshName = m.name.toLowerCase()
      let actionType: 'wood' | 'mineral' | 'plant' | null = null
      
      // 나무 관련
      if (meshName.includes('trunk') || meshName.includes('leaves') || meshName.includes('stump') || meshName.includes('fruittree')) {
        actionType = 'wood'
      } 
      // 광물 관련
      else if (meshName.includes('rock') || meshName.includes('rockpile')) {
        actionType = 'mineral'
      }
      // 식물 관련 (베리, 허브, 꽃, 버섯, 열매 나무, 조개)
      else if (meshName.includes('berry') || meshName.includes('herb') || 
               meshName.includes('petal') || meshName.includes('flowercenter') ||
               meshName.includes('mushroomcap') || meshName.includes('fruit') ||
               meshName.includes('shell')) {
        actionType = 'plant'
      }
      
      if (actionType) {
        // 이미 3회 채집한 오브젝트는 제외
        const harvestCount = this.harvestCountMap.get(m) || 0
        if (harvestCount >= 3) return
        
        const distance = Vector3.Distance(m.position, this.mesh.position)
        if (distance < searchRadius) {
          harvestableObjects.push({ mesh: m, distance, actionType })
        }
      }
    })
    
    // 가장 가까운 오브젝트 선택
    if (harvestableObjects.length > 0) {
      harvestableObjects.sort((a, b) => a.distance - b.distance)
      const nearestObject = harvestableObjects[0]
      
      // 자동 채집 실행
      this.performHarvest(nearestObject.mesh, nearestObject.actionType)
      // 마지막 채집한 오브젝트 기록
      this.lastHarvestedMesh = nearestObject.mesh
      this.lastHarvestedTime = now
      return true
    }
    
    return false
  }
  
  // 자동 채집 모드 토글
  public toggleAutoHarvest() {
    this.autoHarvestMode = !this.autoHarvestMode
    // 자동 채집 모드를 켤 때 실패 횟수 리셋
    if (this.autoHarvestMode) {
      this.consecutiveHarvestFailures = 0
    }
    console.log('자동 채집 모드:', this.autoHarvestMode ? 'ON' : 'OFF')
    return this.autoHarvestMode
  }
  
  // 자동 채집 모드 상태 확인
  public isAutoHarvestEnabled(): boolean {
    return this.autoHarvestMode
  }

  // 개선된 걷기 애니메이션 (부드러운 보행)
  private animateWalk(deltaTime: number) {
    const walkAnimationSpeed = 10
    this.walkTime += deltaTime * walkAnimationSpeed
    
    // 사인파를 사용한 자연스러운 걷기 동작
    // 회전 각도를 줄여서 몸통과의 분리감을 줄임
    const legSwing = Math.sin(this.walkTime) * 0.5 // 다리 스윙 각도 감소 (0.8 -> 0.5)
    const armSwing = Math.sin(this.walkTime + Math.PI) * 0.4 // 팔 스윙 감소 (0.6 -> 0.4)
    
    // 다리 애니메이션 (몸통과 자연스럽게 연결되도록)
    if (this.leftLeg) {
      // 회전 중심을 상단(몸통 연결부)으로 설정하기 위해 pivot 사용
      // pivot이 없으면 회전 중심을 상단으로 이동시키기 위해 위치 조정
      this.leftLeg.rotation.x = legSwing
      // 전후 움직임을 줄여서 분리감 감소
      this.leftLeg.rotation.z = Math.sin(this.walkTime * 0.5) * 0.05 // 0.1 -> 0.05
    }
    if (this.rightLeg) {
      this.rightLeg.rotation.x = -legSwing
      this.rightLeg.rotation.z = Math.sin(this.walkTime * 0.5 + Math.PI) * 0.05 // 0.1 -> 0.05
    }
    
    // 팔 애니메이션 (몸통과 자연스럽게 연결되도록)
    if (this.leftArm) {
      this.leftArm.rotation.x = armSwing
      // 회전을 줄여서 몸통과의 분리감 감소
      this.leftArm.rotation.z = Math.sin(this.walkTime * 0.8) * 0.08 // 0.15 -> 0.08
    }
    if (this.rightArm) {
      this.rightArm.rotation.x = -armSwing
      this.rightArm.rotation.z = Math.sin(this.walkTime * 0.8 + Math.PI) * 0.08 // 0.15 -> 0.08
    }
    
    // 몸통 약간의 상하 움직임 (걷는 리듬감)
    const body = this.getBodyMesh()
    if (body) {
      body.position.y = 0.9 + Math.abs(Math.sin(this.walkTime)) * 0.02
    }
  }
  
  // 달리기 애니메이션 (더 빠른 동작)
  private animateRun(deltaTime: number) {
    const runAnimationSpeed = 15 // 걷기보다 빠른 애니메이션 속도
    this.walkTime += deltaTime * runAnimationSpeed
    
    // 달리기는 더 큰 스윙 각도와 빠른 속도 (하지만 몸통과의 분리감을 줄이기 위해 조정)
    const legSwing = Math.sin(this.walkTime) * 0.8 // 다리 스윙 감소 (1.2 -> 0.8)
    const armSwing = Math.sin(this.walkTime + Math.PI) * 0.6 // 팔 스윙 감소 (0.9 -> 0.6)
    
    // 다리 애니메이션
    if (this.leftLeg) {
      this.leftLeg.rotation.x = legSwing
      this.leftLeg.rotation.z = Math.sin(this.walkTime) * 0.1 // 0.2 -> 0.1
    }
    if (this.rightLeg) {
      this.rightLeg.rotation.x = -legSwing
      this.rightLeg.rotation.z = Math.sin(this.walkTime + Math.PI) * 0.1 // 0.2 -> 0.1
    }
    
    // 팔 애니메이션 (달리기는 팔 움직임이 큼, 하지만 분리감 감소)
    if (this.leftArm) {
      this.leftArm.rotation.x = armSwing
      this.leftArm.rotation.z = Math.sin(this.walkTime * 1.2) * 0.12 // 0.25 -> 0.12
    }
    if (this.rightArm) {
      this.rightArm.rotation.x = -armSwing
      this.rightArm.rotation.z = Math.sin(this.walkTime * 1.2 + Math.PI) * 0.12 // 0.25 -> 0.12
    }
    
    // 몸통 상하 움직임 (달리기는 더 큼)
    const body = this.getBodyMesh()
    if (body) {
      body.position.y = 0.9 + Math.abs(Math.sin(this.walkTime)) * 0.03
    }
  }

  private resetAnimation() {
    if (this.leftLeg) {
      this.leftLeg.rotation.x = 0
      this.leftLeg.rotation.z = 0
    }
    if (this.rightLeg) {
      this.rightLeg.rotation.x = 0
      this.rightLeg.rotation.z = 0
    }
    if (this.leftArm) {
      this.leftArm.rotation.x = 0
      this.leftArm.rotation.y = 0
      this.leftArm.rotation.z = 0
    }
    if (this.rightArm) {
      this.rightArm.rotation.x = 0
      this.rightArm.rotation.y = 0
      this.rightArm.rotation.z = 0
    }
    // 몸통 위치 복원
    const body = this.getBodyMesh()
    if (body) {
      body.position.y = 0.9
    }
    this.walkTime = 0
  }

  private getBodyMesh(): Mesh | null {
    if (this.head?.parent && typeof (this.head.parent as any).getChildMeshes === 'function') {
      const meshes = (this.head.parent as any).getChildMeshes() as Mesh[]
      const bodyMesh = meshes.find((mesh) => mesh.name === 'body')
      if (bodyMesh) return bodyMesh
    }
    return this.scene.getMeshByName('body') as Mesh | null
  }
  
  // 감정 표현 애니메이션 (확장)
  public setEmotion(emotion: 'normal' | 'happy' | 'tired' | 'excited' | 'wave' | 'jump' | 'dance', duration: number = 2000) {
    this.currentEmotion = emotion
    this.emotionTimer = Date.now() + duration
    
    if (!this.head || !this.leftEye || !this.rightEye || !this.mouth) return
    
    // 감정에 따른 얼굴 표현
    switch (emotion) {
      case 'happy':
        // 기쁨: 눈을 반달 모양으로, 입을 웃는 모양으로
        if (this.leftEye && this.rightEye) {
          // 눈은 약간 닫힌 모양 (선으로 표현하려면 메시 변경 필요)
        }
        if (this.mouth) {
          // 입을 위로 올림 (웃는 모양)
          this.mouth.position.y = -0.12 // 기본 -0.15에서 위로
        }
        break
      
      case 'tired':
        // 피곤함: 눈을 반쯤 감고
        if (this.leftEye && this.rightEye) {
          this.leftEye.position.y = 0.03 // 기본 0.05에서 아래로
          this.rightEye.position.y = 0.03
        }
        if (this.mouth) {
          this.mouth.position.y = -0.17 // 아래로 내림
        }
        break
      
      case 'excited':
        // 신남: 눈을 크게 뜨고
        if (this.leftEye && this.rightEye) {
          this.leftEye.position.y = 0.06
          this.rightEye.position.y = 0.06
        }
        if (this.mouth) {
          this.mouth.position.y = -0.10 // 입을 크게 벌림
        }
        break
      
      case 'normal':
      default:
        // 기본 상태로 복원
        if (this.leftEye && this.rightEye) {
          this.leftEye.position.y = 0.05
          this.rightEye.position.y = 0.05
        }
        if (this.mouth) {
          this.mouth.position.y = -0.15
        }
        break
      
      case 'wave':
      case 'jump':
      case 'dance':
        // 이모션 애니메이션은 animateEmotion에서 처리
        this.isEmotionAnimating = true
        this.emotionAnimationTime = 0
        break
    }
  }
  
  // 이모션 애니메이션 실행
  private animateEmotion(deltaTime: number) {
    if (!this.isEmotionAnimating || !this.currentEmotion) return
    
    this.emotionAnimationTime += deltaTime
    
    switch (this.currentEmotion) {
      case 'wave':
        // 손 흔들기 애니메이션
        if (this.rightArm) {
          const waveAngle = Math.sin(this.emotionAnimationTime * 8) * Math.PI / 3 // 빠르게 흔들기
          this.rightArm.rotation.x = -Math.PI / 2 + waveAngle
          this.rightArm.rotation.z = waveAngle * 0.5
        }
        break
      
      case 'jump':
        // 점프 애니메이션
        if (this.mesh) {
          const jumpHeight = Math.abs(Math.sin(this.emotionAnimationTime * 6)) * 0.5 // 위아래로 움직임
          this.mesh.position.y = 0.9 + jumpHeight
        }
        // 팔을 위로 올리기
        if (this.leftArm && this.rightArm) {
          const armLift = Math.sin(this.emotionAnimationTime * 6) * 0.5
          this.leftArm.rotation.x = -Math.PI / 2 + armLift
          this.rightArm.rotation.x = -Math.PI / 2 + armLift
        }
        break
      
      case 'dance':
        // 춤추기 애니메이션 (좌우로 흔들기)
        if (this.mesh) {
          const swayAmount = Math.sin(this.emotionAnimationTime * 4) * 0.1
          this.mesh.rotation.z = swayAmount
        }
        // 팔과 다리를 번갈아 움직이기
        const dancePhase = Math.sin(this.emotionAnimationTime * 4)
        if (this.leftArm && this.rightArm) {
          this.leftArm.rotation.x = dancePhase * 0.5
          this.rightArm.rotation.x = -dancePhase * 0.5
        }
        if (this.leftLeg && this.rightLeg) {
          this.leftLeg.rotation.x = dancePhase * 0.3
          this.rightLeg.rotation.x = -dancePhase * 0.3
        }
        break
    }
  }
  
  // 이모션 트리거 (UI에서 호출)
  public triggerEmotion(emotion: 'happy' | 'wave' | 'jump' | 'dance' | 'excited') {
    const duration = emotion === 'jump' || emotion === 'dance' ? 3000 : 2000
    this.setEmotion(emotion, duration)
    
    // 이모션 효과음 재생 (선택적)
    if (this.soundSystem) {
      if (emotion === 'happy' || emotion === 'excited') {
        this.soundSystem.playSound('item_get') // 기쁨 효과음
      }
    }
  }

  private harvestCooldown: Map<string, number> = new Map()
  private readonly harvestInterval: number = 2000 // 2초마다 채집

  private showActionBar(objectMesh: Mesh) {
    if (!this.gatheringSystem) {
      console.warn('GatheringSystem이 없습니다')
      return
    }

    const objectName = objectMesh.name
    const node = this.gatheringSystem.getNode(objectName)
    
    if (!node) {
      console.warn('노드를 찾을 수 없습니다:', objectName)
      return
    }

    // 노드 타입에 따라 작업 목록 결정
    const actions: { label: string; onClick: () => void; primary?: boolean }[] = []
    
    const meshName = objectName.toLowerCase()
    
    if (meshName.includes("trunk") || meshName.includes("leaves")) {
      // 나무 작업
      actions.push({
        label: '나무 채집',
        onClick: () => this.performHarvest(objectMesh, 'wood'),
        primary: true
      })
    } else if (meshName.includes("rock")) {
      // 바위 작업
      actions.push({
        label: '돌 채집',
        onClick: () => this.performHarvest(objectMesh, 'mineral'),
        primary: true
      })
    }

    // 오브젝트 이름과 아이콘
    const nodeName = this.gatheringSystem.getNodeName(objectName)
    const icon = meshName.includes("trunk") || meshName.includes("leaves") ? '🌲' : '🪨'
    
    // 오브젝트의 bounding box를 사용하여 하단 중심 위치 계산
    const boundingInfo = objectMesh.getBoundingInfo()
    // bounding box를 월드 좌표로 업데이트
    boundingInfo.update(objectMesh.getWorldMatrix())
    const boundingBox = boundingInfo.boundingBox
    
    // bounding box의 하단 중심 위치 계산
    const popupPosition = new Vector3(
      (boundingBox.minimumWorld.x + boundingBox.maximumWorld.x) / 2, // X: 중심
      boundingBox.minimumWorld.y, // Y: 하단
      (boundingBox.minimumWorld.z + boundingBox.maximumWorld.z) / 2  // Z: 중심
    )
    
    this.clickedObject = objectMesh
    this.uiManager.showObjectInteractionPopup(nodeName, icon, actions, popupPosition, objectMesh)
  }

  private getActionTypeForMesh(mesh: Mesh): 'wood' | 'mineral' | 'plant' | null {
    const meshName = mesh.name.toLowerCase()
    if (meshName.includes("trunk") || meshName.includes("leaves") || meshName.includes("stump")) {
      return 'wood'
    } else if (meshName.includes("rock") || meshName.includes("stone")) {
      return 'mineral'
    } else if (meshName.includes("berrybush") || meshName.includes("herb") || 
               meshName.includes("fruittree") || meshName.includes("flowercenter") ||
               meshName.includes("shell") || meshName.includes("mushroomcap") || meshName.includes("petal")) {
      return 'plant'
    }
    return null
  }
  
  private async performHarvest(objectMesh: Mesh, actionType: 'wood' | 'mineral' | 'plant') {
    if (this.isHarvesting) return
    
    this.uiManager.hideObjectInteractionPopup()
    
    // 오브젝트 앞으로 이동 (채집 위치 설정)
    const objectPosition = objectMesh.position.clone()
    const playerPosition = this.mesh.position.clone()
    const direction = objectPosition.subtract(playerPosition)
    direction.y = 0 // Y는 고정
    const distance = direction.length()
    
    // 오브젝트 앞 1.5m 거리에 위치하도록 설정
    const targetDistance = 1.5
    if (distance > targetDistance) {
      const normalizedDirection = direction.normalize()
      const targetPosition = objectPosition.subtract(normalizedDirection.scale(targetDistance))
      targetPosition.y = playerPosition.y // Y는 플레이어 높이 유지
      
      // 목표 위치로 이동 (isHarvesting은 아직 false)
      this.targetPosition = targetPosition
      this.isMoving = true
      
      // 목표 위치에 도달할 때까지 대기 (이동 중에는 isHarvesting이 false이므로 걷기 애니메이션 작동)
      const maxWaitTime = 5000 // 최대 5초 대기
      const startWaitTime = Date.now()
      while (this.isMoving && Vector3.Distance(this.mesh.position, targetPosition) > 0.2) {
        if (Date.now() - startWaitTime > maxWaitTime) {
          // 타임아웃 시 강제로 이동 완료
          break
        }
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      // 이동 완료
      this.isMoving = false
      this.resetAnimation()
    }
    
    // 오브젝트를 향해 회전
    const finalDirection = objectMesh.position.subtract(this.mesh.position)
    finalDirection.y = 0
    const targetAngle = Math.atan2(finalDirection.x, finalDirection.z)
    this.mesh.rotation.y = targetAngle
    
    // 이동 완료 후 채집 시작
    this.isHarvesting = true
    this.uiManager.showHarvestProgress()

    const harvestDuration = 2000 // 2초
    const startTime = Date.now()
    
    // 진행 바 업데이트
    const updateProgress = () => {
      if (!this.isHarvesting) return
      
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / harvestDuration, 1)
      this.uiManager.updateHarvestProgress(progress)
      
      if (progress < 1) {
        requestAnimationFrame(updateProgress)
      }
    }
    updateProgress()

    // 채집 모션 애니메이션 (2초 동안 진행)
    if (actionType === 'wood') {
      // 나무 베기 효과음 재생
      if (this.soundSystem) {
        this.soundSystem.playSound('chop_wood')
      }
      await this.animateChop(harvestDuration / 1000) // 2초
    } else if (actionType === 'mineral') {
      // 돌 깨기 효과음 재생
      if (this.soundSystem) {
        this.soundSystem.playSound('mine_stone')
      }
      await this.animateMine(harvestDuration / 1000) // 2초
    } else if (actionType === 'plant') {
      // 식물 채집 효과음 재생
      if (this.soundSystem) {
        this.soundSystem.playSound('pick_flower')
      }
      // 식물 채집은 간단한 수집 모션 (팔을 앞으로 뻗는 동작)
      await this.animateGather(harvestDuration / 1000) // 2초
    }

    // 채집 실행
    await this.handleHarvest(objectMesh)
    
    // 채집 완료 후 팔을 원래 위치로 복귀
    this.resetAnimation()
    
    this.uiManager.hideHarvestProgress()
    this.isHarvesting = false
  }

  private animateChop(totalDuration: number = 2.0): Promise<void> {
    return new Promise((resolve) => {
      // 도끼를 든 채 오른쪽에서 왼쪽으로 내려찍는 모션 (2초 동안 반복)
      if (!this.leftArm || !this.rightArm) {
        resolve()
        return
      }
      
      const singleCycleDuration = 0.8 // 한 사이클 시간
      const startTime = Date.now()
      const startLeftX = this.leftArm.rotation.x || 0
      const startLeftZ = this.leftArm.rotation.z || 0
      const startRightX = this.rightArm.rotation.x || 0
      const startRightZ = this.rightArm.rotation.z || 0

      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000
        if (elapsed >= totalDuration) {
          this.resetAnimation()
          resolve()
          return
        }
        
        // 현재 사이클 내 진행도 (0~1) - 사이클이 반복됨
        const cycleProgress = (elapsed % singleCycleDuration) / singleCycleDuration
        const progress = cycleProgress
        
        {
          // 1단계: 도끼를 오른쪽 위로 올리기 (0 ~ 0.3)
          // 2단계: 왼쪽으로 휘둘러 내려찍기 (0.3 ~ 0.7)
          // 3단계: 원래 위치로 복귀 (0.7 ~ 1.0)
          
          if (progress < 0.3) {
            // 오른쪽 위로 올리기
            const liftProgress = progress / 0.3
            const liftAngle = Math.sin(liftProgress * Math.PI / 2) * 1.2 // 오른쪽 위로
            
            if (this.rightArm) {
              // 오른쪽 팔을 오른쪽 위로 올림 (도끼를 든 팔) - 각도를 크게
              this.rightArm.rotation.x = startRightX - liftAngle * 1.5 // 뒤로 올림
              this.rightArm.rotation.z = startRightZ + liftAngle * 1.2 // 오른쪽으로
            }
            if (this.leftArm) {
              // 왼쪽 팔은 약간 보조로 움직임
              this.leftArm.rotation.x = startLeftX - liftAngle * 0.3
              this.leftArm.rotation.z = startLeftZ - liftAngle * 0.2
            }
          } else if (progress < 0.7) {
            // 왼쪽으로 휘둘러 내려찍기
            const swingProgress = (progress - 0.3) / 0.4
            const swingAngle = Math.sin(swingProgress * Math.PI) * 1.8 // 큰 각도로 휘둘림
            
            if (this.rightArm) {
              // 오른쪽 팔을 왼쪽 아래로 휘둘러 내려찍기 - 각도를 크게
              this.rightArm.rotation.x = startRightX + swingAngle * 2.0 // 앞으로 내림
              this.rightArm.rotation.z = startRightZ - swingAngle * 2.0 // 왼쪽으로
            }
            if (this.leftArm) {
              // 왼쪽 팔은 약간 보조로 움직임
              this.leftArm.rotation.x = startLeftX + swingAngle * 0.4
              this.leftArm.rotation.z = startLeftZ + swingAngle * 0.3
            }
          } else {
            // 원래 위치로 복귀
            const returnProgress = (progress - 0.7) / 0.3
            const returnEase = 1 - Math.pow(1 - returnProgress, 3) // easeOut
            
            // 현재 위치에서 원래 위치로 부드럽게 복귀
            const currentRightX = this.rightArm ? this.rightArm.rotation.x : startRightX
            const currentRightZ = this.rightArm ? this.rightArm.rotation.z : startRightZ
            const currentLeftX = this.leftArm ? this.leftArm.rotation.x : startLeftX
            const currentLeftZ = this.leftArm ? this.leftArm.rotation.z : startLeftZ
            
            if (this.rightArm) {
              this.rightArm.rotation.x = currentRightX + (startRightX - currentRightX) * returnEase
              this.rightArm.rotation.z = currentRightZ + (startRightZ - currentRightZ) * returnEase
            }
            if (this.leftArm) {
              this.leftArm.rotation.x = currentLeftX + (startLeftX - currentLeftX) * returnEase
              this.leftArm.rotation.z = currentLeftZ + (startLeftZ - currentLeftZ) * returnEase
            }
          }
          
          // 전체 시간이 안 지났으면 계속 반복
          requestAnimationFrame(animate)
        }
      }

      animate()
    })
  }

  private animateMine(totalDuration: number = 2.0): Promise<void> {
    return new Promise((resolve) => {
      // 곡괭이로 내리치는 모션: 팔을 위로 올렸다가 아래로 내리는 동작 (2초 동안 반복)
      if (!this.leftArm || !this.rightArm) {
        resolve()
        return
      }
      
      const singleCycleDuration = 1.0 // 한 사이클 시간
      const startTime = Date.now()
      const startLeft = this.leftArm.rotation.x || 0
      const startRight = this.rightArm.rotation.x || 0

      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000
        if (elapsed >= totalDuration) {
          this.resetAnimation()
          resolve()
          return
        }
        
        // 현재 사이클 내 진행도 (0~1) - 사이클이 반복됨
        const cycleProgress = (elapsed % singleCycleDuration) / singleCycleDuration
        const progress = cycleProgress
        
        // 부드러운 움직임
        const easeProgress = 1 - Math.pow(1 - progress, 3)
        
        // 곡괭이 모션: 위로 올렸다가 아래로 강하게 내리침
        const upAngle = progress < 0.4 ? progress * 3 : 0 // 처음 40%는 올림
        const downAngle = progress > 0.4 ? (progress - 0.4) * 2.5 : 0 // 나머지는 내림
        
        if (this.leftArm) {
          this.leftArm.rotation.x = startLeft + upAngle - downAngle
          this.leftArm.rotation.y = Math.sin(progress * Math.PI) * 0.3
        }
        if (this.rightArm) {
          this.rightArm.rotation.x = startRight + upAngle - downAngle
          this.rightArm.rotation.y = Math.sin(progress * Math.PI) * 0.3
        }

        // 전체 시간이 안 지났으면 계속 반복
        requestAnimationFrame(animate)
      }

      animate()
    })
  }

  private animateGather(totalDuration: number = 2.0): Promise<void> {
    return new Promise((resolve) => {
      // 식물 채집 모션: 팔을 앞으로 뻗는 동작
      if (!this.leftArm || !this.rightArm) {
        resolve()
        return
      }
      
      const singleCycleDuration = 1.0 // 한 사이클 시간
      const startTime = Date.now()
      const startLeft = this.leftArm.rotation.x || 0
      const startRight = this.rightArm.rotation.x || 0

      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000
        if (elapsed >= totalDuration) {
          this.resetAnimation()
          resolve()
          return
        }
        
        const cycleProgress = (elapsed % singleCycleDuration) / singleCycleDuration
        
        // 팔을 앞으로 뻗는 모션
        if (cycleProgress < 0.5) {
          const extendProgress = cycleProgress / 0.5
          const extendAngle = Math.sin(extendProgress * Math.PI) * 0.8
          
          if (this.leftArm) {
            this.leftArm.rotation.x = startLeft + extendAngle
          }
          if (this.rightArm) {
            this.rightArm.rotation.x = startRight + extendAngle
          }
        } else {
          const retractProgress = (cycleProgress - 0.5) / 0.5
          const retractEase = 1 - Math.pow(1 - retractProgress, 3)
          
          const currentLeft = this.leftArm ? this.leftArm.rotation.x : startLeft
          const currentRight = this.rightArm ? this.rightArm.rotation.x : startRight
          
          if (this.leftArm) {
            this.leftArm.rotation.x = currentLeft + (startLeft - currentLeft) * retractEase
          }
          if (this.rightArm) {
            this.rightArm.rotation.x = currentRight + (startRight - currentRight) * retractEase
          }
        }
        
        requestAnimationFrame(animate)
      }

      animate()
    })
  }
  
  private animateWatering(totalDuration: number = 1.5): Promise<void> {
    return new Promise((resolve) => {
      // 물뿌리개 사용 애니메이션: 팔을 앞으로 뻗어서 물을 뿌리는 동작
      if (!this.leftArm || !this.rightArm) {
        resolve()
        return
      }
      
      const startTime = Date.now()
      const startLeft = this.leftArm.rotation.x || 0
      const startRight = this.rightArm.rotation.x || 0
      const startLeftY = this.leftArm.rotation.y || 0
      const startRightY = this.rightArm.rotation.y || 0
      
      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000
        if (elapsed >= totalDuration) {
          this.resetAnimation()
          resolve()
          return
        }
        
        const progress = elapsed / totalDuration
        
        // 1단계 (0-0.3): 팔을 앞으로 뻗기
        if (progress < 0.3) {
          const extendProgress = progress / 0.3
          const extendAngle = Math.sin(extendProgress * Math.PI / 2) * 1.0
          
          if (this.leftArm) {
            this.leftArm.rotation.x = startLeft + extendAngle
            this.leftArm.rotation.y = startLeftY - Math.sin(extendProgress * Math.PI) * 0.5
          }
          if (this.rightArm) {
            this.rightArm.rotation.x = startRight + extendAngle
            this.rightArm.rotation.y = startRightY + Math.sin(extendProgress * Math.PI) * 0.5
          }
        }
        // 2단계 (0.3-0.6): 팔을 위로 올리기 (물 뿌리기)
        else if (progress < 0.6) {
          const liftProgress = (progress - 0.3) / 0.3
          const liftAngle = Math.sin(liftProgress * Math.PI / 2) * 0.8
          
          if (this.leftArm) {
            this.leftArm.rotation.x = startLeft + 1.0 + liftAngle
            this.leftArm.rotation.y = startLeftY - 0.5
          }
          if (this.rightArm) {
            this.rightArm.rotation.x = startRight + 1.0 + liftAngle
            this.rightArm.rotation.y = startRightY + 0.5
          }
        }
        // 3단계 (0.6-1.0): 팔을 내려서 원래 위치로 복귀
        else {
          const retractProgress = (progress - 0.6) / 0.4
          const retractEase = 1 - Math.pow(1 - retractProgress, 3)
          
          if (this.leftArm) {
            const currentX = startLeft + 1.8
            const currentY = startLeftY - 0.5
            this.leftArm.rotation.x = currentX + (startLeft - currentX) * retractEase
            this.leftArm.rotation.y = currentY + (startLeftY - currentY) * retractEase
          }
          if (this.rightArm) {
            const currentX = startRight + 1.8
            const currentY = startRightY + 0.5
            this.rightArm.rotation.x = currentX + (startRight - currentX) * retractEase
            this.rightArm.rotation.y = currentY + (startRightY - currentY) * retractEase
          }
        }
        
        requestAnimationFrame(animate)
      }
      
      animate()
    })
  }

  private async handleHarvest(objectMesh: Mesh) {
    if (!this.gatheringSystem) {
      console.warn('GatheringSystem이 초기화되지 않았습니다')
      return
    }

    const objectName = objectMesh.name
    console.log('채집 시도:', objectName)
    
    const lastHarvest = this.harvestCooldown.get(objectName) || 0
    const now = Date.now()

    // 기본 채집 쿨타임 체크 (너무 빠른 연속 채집 방지)
    if (now - lastHarvest < 1000) { // 1초 최소 간격
      console.log('채집 쿨타임:', objectName)
      return
    }

    // 각 오브젝트별 채집 횟수 추적 (메시 인스턴스 기반)
    const currentCount = this.harvestCountMap.get(objectMesh) || 0
    
    // 3회 이미 채집했으면 더 이상 채집 불가
    if (currentCount >= 3) {
      console.log('이미 3회 채집 완료:', objectName)
      this.uiManager.showMessage('이미 완전히 소진된 오브젝트입니다.', false)
      return
    }

    // 새로운 채집 시스템 사용 (메시별 채집 횟수로 관리하므로 노드 가용성 체크 스킵)
    const result = await this.gatheringSystem.gather(objectName, 'hand', true) // skipAvailabilityCheck = true

    if (!result) {
      console.log('채집 결과 없음:', objectName)
      return
    }

    // 채집 횟수 증가
    const newCount = currentCount + 1
    this.harvestCountMap.set(objectMesh, newCount)
    
    console.log('채집 완료:', objectName, '메시:', objectMesh.uniqueId, '채집 횟수:', newCount, '/ 3', '아이템:', result.items)

    // 인벤토리 UI 업데이트 (재화가 누적되도록) - 3회 채집 시에도 실행되어야 함
    if (result.items.length > 0) {
      console.log('인벤토리에 아이템 추가:', result.items)
      
      // 아이템 획득 효과음 재생
      if (this.soundSystem) {
        this.soundSystem.playSound('item_get')
      }
      
      // 튜토리얼: 채집 완료
      if (this.tutorialSystem) {
        this.tutorialSystem.completeStep('gathering')
      }
      
      // 파티클 효과 (아이템 획득)
      if ((window as any).particleEffects && objectMesh) {
        const effectPosition = objectMesh.position.clone()
        effectPosition.y += 1 // 오브젝트 위쪽에 효과 표시
        ;(window as any).particleEffects.createItemGetEffect(effectPosition)
      }
      
      this.uiManager.updateInventory()
      
      // 미션 업데이트
      if (this.uiManager['missionSystem']) {
        result.items.forEach(item => {
          this.uiManager['missionSystem'].onItemCollected(item.itemId, item.count)
        })
      }
      
      // 도감 업데이트 (채집한 아이템을 도감에 등록)
      if (this.uiManager['codexSystem']) {
        result.items.forEach(item => {
          // 첫 번째 획득 시에만 도감 업데이트
          const inventoryItem = this.inventoryManager.list().find(inv => inv.name === item.itemId)
          if (inventoryItem && inventoryItem.count === item.count) {
            // 첫 획득이므로 도감에 등록
            this.uiManager['codexSystem'].obtainEntry(item.itemId)
          } else {
            // 이미 가지고 있던 아이템이지만 도감에 없을 수 있으므로 확인
            this.uiManager['codexSystem'].obtainEntry(item.itemId)
          }
        })
      }
      
      // 아이템 획득 시 기쁨 감정 표현
      this.setEmotion('happy', 1500)
    }

    // 채집 횟수가 3회에 도달하면 오브젝트 제거
    if (newCount >= 3) {
      console.log('오브젝트 소진 완료, 제거 시작:', objectName, '메시:', objectMesh.uniqueId, '채집 횟수:', newCount)
      
      // 메시와 관련된 모든 메시 제거
      if (objectMesh.metadata?.leaves) {
        objectMesh.metadata.leaves.dispose()
      }
      if (objectMesh.metadata?.childMeshes) {
        objectMesh.metadata.childMeshes.forEach((child: Mesh) => {
          child.dispose()
        })
      }
      
      // 나무의 경우 trunk와 leaves를 모두 찾아서 제거 (위치 기반)
      if (objectName.includes('trunk') || objectName.includes('leaves')) {
        const objectPosition = objectMesh.position.clone()
        const tolerance = 2.0 // 위치 허용 오차 (나무의 경우 높이가 다르므로 더 넓게)
        
        console.log('나무 제거 시도, 위치:', objectPosition, '허용 오차:', tolerance)
        
        const meshesToRemove: Mesh[] = []
        
        // 씬의 모든 메시를 검사하여 같은 위치의 trunk와 leaves 찾기
        this.scene.meshes.forEach((mesh) => {
          if (mesh instanceof Mesh && (mesh.name.includes('trunk') || mesh.name.includes('leaves'))) {
            const distance = Vector3.Distance(
              new Vector3(mesh.position.x, 0, mesh.position.z),
              new Vector3(objectPosition.x, 0, objectPosition.z)
            )
            if (distance < tolerance) {
              console.log('나무 메시 발견 및 제거:', mesh.name, '거리:', distance)
              meshesToRemove.push(mesh)
            }
          }
        })
        
        // 찾은 메시들 제거 (배열 복사 후 제거하여 반복 중 수정 문제 방지)
        const meshesToDispose = [...meshesToRemove]
        meshesToDispose.forEach(mesh => {
          // 채집 횟수 맵에서도 제거
          this.harvestCountMap.delete(mesh)
          this.harvestCooldown.delete(mesh.name)
          console.log('나무 메시 제거:', mesh.name, 'uniqueId:', mesh.uniqueId)
          if (mesh && !mesh.isDisposed()) {
            mesh.dispose()
            console.log('나무 메시 제거 완료:', mesh.name)
          } else {
            console.log('나무 메시 이미 제거됨:', mesh.name)
          }
        })
        
        console.log('나무 제거 완료, 제거된 메시 수:', meshesToDispose.length)
      } else {
        // 바위 등 다른 오브젝트는 직접 제거
        console.log('바위 제거:', objectName, 'uniqueId:', objectMesh.uniqueId)
        this.harvestCountMap.delete(objectMesh)
        this.harvestCooldown.delete(objectName)
        if (objectMesh && !objectMesh.isDisposed()) {
          objectMesh.dispose()
          console.log('바위 제거 완료:', objectName)
        } else {
          console.log('바위 이미 제거됨:', objectName)
        }
      }
      
      // 3회 채집 완료 메시지
      if (result.items.length > 0) {
        const nodeName = this.gatheringSystem.getNodeName(objectName)
        const itemList = result.items.map(item => `${item.itemId} x${item.count}`).join(', ')
        this.uiManager.showMessage(`${nodeName} 완전히 소진! (${itemList})`, false)
      }
      
      return
    }

    if (result.items.length > 0) {
      this.harvestCooldown.set(objectName, now)
      
      // 아이템 드롭 시각화 제거 (인벤토리에 직접 추가되므로 불필요)
      // 시각적 피드백은 UI 메시지로 대체

      // 채집 결과 팝업 표시
      const nodeName = this.gatheringSystem.getNodeName(objectName)
      this.uiManager.showHarvestResult(nodeName, result.items, result.bonusSuccess || false)

      // XP 획득 알림 (선택적)
      if (result.xpGained > 0) {
        // 숙련도 XP 획득은 자동 처리됨
      }
    } else {
      // 채집 불가 (쿨타임 또는 도구 부족)
      const node = this.gatheringSystem.getNode(objectName)
      if (node && !this.gatheringSystem.isNodeAvailable(objectName)) {
        this.uiManager.showMessage('아직 채집할 수 없습니다.', false)
      }
    }
  }

  public getGatheringSystem(): GatheringSystem | null {
    return this.gatheringSystem
  }
  
  public setTimeSystemForFishing(timeSystem: any) {
    if (this.fishingSystem) {
      this.fishingSystem.setTimeSystem(timeSystem)
    }
  }
  
  private async handleFishing(location: 'river' | 'ocean' | 'pond') {
    if (!this.fishingSystem) {
      this.uiManager.showMessage('낚시 시스템이 초기화되지 않았습니다.')
      return
    }
    
    this.uiManager.showMessage('낚시를 시작합니다...')
    
    try {
      const result = await this.fishingSystem.startFishing(location)
      
      if (result.success && result.fish) {
        this.uiManager.showMessage(result.message)
        this.uiManager.updateInventory()
        
        // 도감 업데이트
        if (this.uiManager['codexSystem']) {
          this.uiManager['codexSystem'].onFishCaught(result.fish.id)
        }
      } else {
        this.uiManager.showMessage(result.message)
      }
    } catch (error) {
      console.error('낚시 중 오류:', error)
      this.uiManager.showMessage('낚시 중 오류가 발생했습니다.')
    }
  }
  
  public setCodexSystem(codexSystem: any) {
    // 도감 시스템 참조 저장 (낚시 성공 시 업데이트용)
    if (this.uiManager) {
      this.uiManager['codexSystem'] = codexSystem
    }
  }
  
  public setTimeSystemForBugCatching(timeSystem: any) {
    if (this.bugCatchingSystem) {
      this.bugCatchingSystem.setTimeSystem(timeSystem)
    }
  }
  
  private async handleBugCatching(location: 'grass' | 'tree' | 'flower' | 'water' | 'ground') {
    if (!this.bugCatchingSystem) {
      this.uiManager.showMessage('벌레 채집 시스템이 초기화되지 않았습니다.')
      return
    }
    
    this.uiManager.showMessage('벌레를 찾는 중...')
    
    try {
      const result = await this.bugCatchingSystem.startBugCatching(location)
      
      if (result.success && result.bug) {
        this.uiManager.showMessage(result.message)
        this.uiManager.updateInventory()
        
        // 도감 업데이트
        if (this.uiManager['codexSystem']) {
          this.uiManager['codexSystem'].obtainEntry(result.bug.id)
        }
        
        // 미션 업데이트
        if (this.uiManager['missionSystem']) {
          this.uiManager['missionSystem'].onItemCollected(result.bug.id, 1)
        }
      } else {
        this.uiManager.showMessage(result.message)
      }
    } catch (error) {
      console.error('벌레 채집 중 오류:', error)
      this.uiManager.showMessage('벌레 채집 중 오류가 발생했습니다.')
    }
  }
  
  public setTimeSystemForFarming(timeSystem: any) {
    if (this.farmingSystem) {
      this.farmingSystem.setTimeSystem(timeSystem)
    }
  }
  
  private handleFarmPlotClick(plot: any) {
    if (!this.farmingSystem) return
    
    // 작물이 없으면 심기, 있으면 수확/물주기
    if (!plot.crop) {
      // 심기 UI 표시
      this.uiManager.showFarmPlantingPanel(plot.id, this.farmingSystem)
    } else if (plot.crop.stage === 'mature') {
      // 수확
      const result = this.farmingSystem.harvestCrop(plot.id)
      if (result.success) {
        this.uiManager.showMessage(`수확 완료! ${result.items.map(item => `${item.id} x${item.count}`).join(', ')}`, false)
        this.uiManager.updateInventory()
        
        // 미션 업데이트
        if (this.uiManager['missionSystem']) {
          result.items.forEach(item => {
            this.uiManager['missionSystem'].onItemCollected(item.id, item.count)
          })
        }
      }
    } else if (this.farmingSystem.getCropData(plot.crop.type).waterRequired && !plot.crop.watered) {
      // 물 주기 (애니메이션과 함께)
      this.animateWatering().then(() => {
        if (this.farmingSystem.waterCrop(plot.id)) {
          this.uiManager.showMessage('물을 주었습니다.', false)
          
          // 물 효과음 재생
          if (this.soundSystem) {
            this.soundSystem.playSound('ui_click')
          }
        }
      })
    }
  }
  
  public setTimeSystemForNPC(timeSystem: any) {
    if (this.npcSystem) {
      this.npcSystem.setTimeSystem(timeSystem)
    }
  }
  
  public setCurrencySystemForNPC(currencySystem: any) {
    if (this.npcSystem && typeof (this.npcSystem as any).setCurrencySystem === 'function') {
      (this.npcSystem as any).setCurrencySystem(currencySystem)
    }
  }
  
  public setTimeSystemForGathering(timeSystem: any) {
    if (this.gatheringSystem && typeof (this.gatheringSystem as any).setTimeSystem === 'function') {
      (this.gatheringSystem as any).setTimeSystem(timeSystem)
    }
  }
  
  public setWeatherSystemForGathering(weatherSystem: any) {
    if (this.gatheringSystem && typeof (this.gatheringSystem as any).setWeatherSystem === 'function') {
      (this.gatheringSystem as any).setWeatherSystem(weatherSystem)
    }
  }
  
  public setMuseumSystemForGathering(museumSystem: any) {
    if (this.gatheringSystem && typeof (this.gatheringSystem as any).setMuseumSystem === 'function') {
      (this.gatheringSystem as any).setMuseumSystem(museumSystem)
    }
  }
  
  public setBuildingMode(enabled: boolean) {
    this.buildingMode = enabled
    // 건설 모드 해제 시 미리보기 메시 제거
    if (!enabled && this.buildingPreviewMesh) {
      this.buildingPreviewMesh.dispose()
      this.buildingPreviewMesh = null
    }
  }
  
  public setBuildingSystem(buildingSystem: any) {
    this.buildingSystem = buildingSystem
  }
  
  public setSoundSystem(soundSystem: any) {
    this.soundSystem = soundSystem
  }

  public setTutorialSystem(tutorialSystem: any) {
    this.tutorialSystem = tutorialSystem
  }
  
  public setDecorationMode(enabled: boolean) {
    this.decorationMode = enabled
  }
  
  // 건물 미리보기 업데이트
  private updateBuildingPreview() {
    const pendingType = this.uiManager?.getPendingBuildingType()
    if (!pendingType || !this.buildingSystem) {
      if (this.buildingPreviewMesh) {
        this.buildingPreviewMesh.dispose()
        this.buildingPreviewMesh = null
      }
      return
    }
    
    // 마우스 위치에서 레이캐스트로 땅 위치 찾기
    const pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => mesh.name === 'ground')
    
    if (pickResult && pickResult.hit && pickResult.pickedPoint) {
      const position = {
        x: pickResult.pickedPoint.x,
        y: pickResult.pickedPoint.y,
        z: pickResult.pickedPoint.z
      }
      
      // 건설 가능 여부 확인
      const canPlace = this.buildingSystem.canPlaceBuilding(pendingType, position)
      
      // 미리보기 메시가 없으면 생성
      if (!this.buildingPreviewMesh) {
        this.buildingPreviewMesh = this.buildingSystem.createPreviewMesh(pendingType, position, 0)
      }
      
      // 위치 업데이트
      const buildingData = this.buildingSystem.getBuildingData(pendingType)
      this.buildingPreviewMesh.position = new Vector3(position.x, buildingData.size.height / 2, position.z)
      
      // 건설 가능 여부에 따라 색상 변경
      const previewMat = this.buildingPreviewMesh.material as StandardMaterial
      if (previewMat) {
        if (canPlace) {
          previewMat.diffuseColor = new Color3(0, 1, 1) // 시안색 (건설 가능)
        } else {
          previewMat.diffuseColor = new Color3(1, 0, 0) // 빨간색 (건설 불가)
        }
      }
    } else {
      // 땅을 가리키지 않으면 미리보기 숨김
      if (this.buildingPreviewMesh) {
        this.buildingPreviewMesh.dispose()
        this.buildingPreviewMesh = null
      }
    }
  }
  
  private handleNPCClick(npc: any) {
    if (!this.npcSystem) return
    
    // NPC 대화/상호작용 UI 표시
    this.uiManager.showNPCPanel(npc, this.npcSystem)
  }
  
  private findBuildingIdByMesh(mesh: Mesh): string | null {
    if (!this.buildingSystem) return null
    
    const buildings = this.buildingSystem.getBuildings()
    for (const building of buildings) {
      if (building.mesh === mesh || building.mesh.getChildMeshes().includes(mesh)) {
        return building.id
      }
    }
    return null
  }
  
  private handleBuildingClick(buildingId: string) {
    if (!this.buildingSystem || !this.interiorSystem) {
      // 건물 상호작용 UI 표시
      const building = this.buildingSystem.getBuilding(buildingId)
      if (building && this.uiManager) {
        (this.uiManager as any).showBuildingInteraction(building, this.buildingSystem)
      }
      return
    }
    
    // 건물 내부 시스템이 있으면 입장/나가기 옵션 제공
    const building = this.buildingSystem.getBuilding(buildingId)
    if (!building) return
    
    if (this.interiorSystem.isInsideBuilding()) {
      // 내부에 있으면 나가기 옵션만
      this.interiorSystem.exitBuilding()
      this.uiManager.showMessage('건물에서 나왔습니다.', false)
    } else {
      // 외부에 있으면 입장 옵션
      const success = this.interiorSystem.enterBuilding(buildingId, building.type)
      if (success) {
        this.uiManager.showMessage(`${building.name}에 입장했습니다.`, false)
      } else {
        // 입장 실패 시 일반 상호작용 UI 표시
        if (this.uiManager) {
          (this.uiManager as any).showBuildingInteraction(building, this.buildingSystem)
        }
      }
    }
  }
  
  public setInteriorSystem(interiorSystem: any) {
    this.interiorSystem = interiorSystem
  }
  
  public setHiddenContentSystem(hiddenContentSystem: any) {
    this.hiddenContentSystem = hiddenContentSystem
  }
  
  private handleTreasureChestClick(chest: any) {
    if (!this.hiddenContentSystem || !chest) return
    
    const result = this.hiddenContentSystem.openTreasureChest(chest.id)
    if (result.success) {
      this.uiManager.showMessage(result.message, false)
      if (result.loot) {
        this.uiManager.updateInventory()
        // 루트 획득 효과음
        if (this.soundSystem) {
          this.soundSystem.playSound('item_get')
        }
        // 기쁨 감정 표현
        this.setEmotion('excited', 2000)
      }
    } else {
      this.uiManager.showMessage(result.message, false)
    }
  }
  
  private handleBonusItemClick(bonus: any) {
    if (!this.hiddenContentSystem || !bonus) return
    
    const result = this.hiddenContentSystem.collectBonusItem(bonus.id)
    if (result.success) {
      this.uiManager.showMessage(result.message, false)
      this.uiManager.updateInventory()
      // 아이템 획득 효과음
      if (this.soundSystem) {
        this.soundSystem.playSound('item_get')
      }
      // 기쁨 감정 표현
      this.setEmotion('happy', 1500)
    } else {
      this.uiManager.showMessage(result.message, false)
    }
  }
  
  private handleFurnitureClick(furniture: any) {
    if (!furniture) return
    
    // 이미 사용 중인 가구가 있으면 해제
    if (this.isSitting || this.isSleeping) {
      this.stopUsingFurniture()
      return
    }
    
    // 가구 타입에 따라 다른 동작
    if (furniture.type === 'bed') {
      this.useBed(furniture)
    } else if (furniture.type === 'chair') {
      this.useChair(furniture)
    }
  }
  
  // 침대 사용 (잠자기)
  private useBed(furniture: any) {
    if (!furniture) return
    
    this.isSleeping = true
    this.currentFurniture = furniture
    
    // 플레이어를 침대 위치로 이동
    const bedPosition = furniture.position
    this.mesh.position.x = bedPosition.x
    this.mesh.position.z = bedPosition.z
    this.mesh.position.y = bedPosition.y + 0.5 // 침대 위
    
    // 잠자는 애니메이션 (몸체를 눕히기)
    const body = this.getBodyMesh()
    if (body) {
      body.rotation.x = Math.PI / 2 // 눕히기
    }
    
    // UI 메시지
    this.uiManager.showMessage('잠자기 시작... (E키로 일어나기)', true)
    
    // 효과음
    if (this.soundSystem) {
      this.soundSystem.playSound('ui_click')
    }
  }
  
  // 의자 사용 (앉기)
  private useChair(furniture: any) {
    if (!furniture) return
    
    this.isSitting = true
    this.currentFurniture = furniture
    
    // 플레이어를 의자 위치로 이동
    const chairPosition = furniture.position
    this.mesh.position.x = chairPosition.x
    this.mesh.position.z = chairPosition.z
    this.mesh.position.y = chairPosition.y + 0.5 // 의자 위
    
    // 앉는 애니메이션 (몸체를 약간 앞으로 기울이기)
    const body = this.getBodyMesh()
    if (body) {
      body.rotation.x = -Math.PI / 6 // 약간 앞으로 기울이기
    }
    if (this.leftLeg && this.rightLeg) {
      // 다리를 구부리기
      this.leftLeg.rotation.x = Math.PI / 3
      this.rightLeg.rotation.x = Math.PI / 3
    }
    
    // UI 메시지
    this.uiManager.showMessage('앉았습니다. (E키로 일어나기)', false)
    
    // 효과음
    if (this.soundSystem) {
      this.soundSystem.playSound('ui_click')
    }
  }
  
  // 가구 사용 중지
  private stopUsingFurniture() {
    if (!this.isSitting && !this.isSleeping) return
    
    // 애니메이션 복원
    const body = this.getBodyMesh()
    if (body) {
      body.rotation.x = 0
    }
    if (this.leftLeg && this.rightLeg) {
      this.leftLeg.rotation.x = 0
      this.rightLeg.rotation.x = 0
    }
    
    // 상태 초기화
    this.isSitting = false
    this.isSleeping = false
    this.currentFurniture = null
    
    // UI 메시지
    this.uiManager.showMessage('일어났습니다.', false)
    
    // 효과음
    if (this.soundSystem) {
      this.soundSystem.playSound('ui_click')
    }
  }
  
  // 가구 사용 중인지 확인
  public isUsingFurniture(): boolean {
    return this.isSitting || this.isSleeping
  }
  
  // DecorationSystem 설정
  public setDecorationSystem(decorationSystem: any) {
    this.decorationSystem = decorationSystem
  }
}
