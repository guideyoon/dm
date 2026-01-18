import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder, StandardMaterial, Color3, Mesh, AbstractMesh, FreeCamera, Ray, AbstractMesh as BJSAbstractMesh, HighlightLayer } from '@babylonjs/core'
import '@babylonjs/loaders'
import { MapManager } from './core/MapManager'
import { MapData } from './types/MapData'

// 에디터 상태
let currentTool: 'select' | 'place' | 'move' | 'rotate' | 'scale' | 'copy' | 'delete' = 'select'
let selectedObject: Mesh | null = null
let gridVisible = true
let snapEnabled = true
let snapSize = 1.0
let isDragging = false
let dragStartPosition: Vector3 | null = null
let cameraMode: 'free' | 'top' = 'free'

// HighlightLayer
let highlightLayer: HighlightLayer | null = null
// 예상 위치 실루엣용 메시 (Ghost mesh)
let previewMesh: Mesh | null = null
let previewChildMeshes: Mesh[] = []

// 맵 관리자
const mapManager = new MapManager()

// 게임 초기화
function initEditor() {
  // Canvas 요소 가져오기
  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement | null
  if (!canvas) {
    console.error('Canvas를 찾을 수 없습니다!')
    return
  }

  // Babylon.js 엔진 생성
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true
  })

  // 씬 생성
  const scene = new Scene(engine)

  // 카메라 생성
  let camera = new ArcRotateCamera(
    'camera',
    -Math.PI / 2,
    Math.PI / 3,
    15,
    Vector3.Zero(),
    scene
  ) as ArcRotateCamera | FreeCamera

  camera.attachControl(canvas, true)
  if (camera instanceof ArcRotateCamera) {
    camera.lowerRadiusLimit = 5
    camera.upperRadiusLimit = 50
  }

  // 조명 추가
  const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene)
  light.intensity = 0.7

  // 지면 생성
  const ground = MeshBuilder.CreateGround('ground', { width: 50, height: 50 }, scene)
  const groundMaterial = new StandardMaterial('groundMaterial', scene)
  groundMaterial.diffuseColor = new Color3(0.3, 0.6, 0.3)
  ground.material = groundMaterial
  ground.isPickable = false // 바닥은 선택 불가

  // 그리드 시스템 초기화
  const gridSystem = createGridSystem(scene, ground)

  // HighlightLayer 초기화
  highlightLayer = new HighlightLayer('highlight', scene)

  // 오브젝트 목록 (현재 씬의 오브젝트들)
  const placedObjects: Map<string, Mesh> = new Map()
  mapManager.setPlacedObjects(placedObjects)

  // 새 맵 생성
  mapManager.createNewMap('새 맵')

  // UI 이벤트 리스너 설정
  setupUIEvents(scene, camera, canvas, placedObjects, gridSystem)

  // 렌더링 루프
  engine.runRenderLoop(() => {
    scene.render()
  })

  // 리사이즈 이벤트
  window.addEventListener('resize', () => {
    engine.resize()
  })

  console.log('맵 에디터가 시작되었습니다!')
}

// 그리드 시스템 생성
function createGridSystem(scene: Scene, ground: Mesh) {
  const gridLines: Mesh[] = []
  const gridSize = 50
  const gridSpacing = 1.0

  // 그리드 라인 생성 함수
  const createGridLines = () => {
    // 기존 그리드 라인 제거
    gridLines.forEach(line => {
      if (line && !line.isDisposed()) {
        line.dispose()
      }
    })
    gridLines.length = 0

    if (!gridVisible) return

    const lineMaterial = new StandardMaterial('gridLineMaterial', scene)
    lineMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5)
    lineMaterial.emissiveColor = new Color3(0.2, 0.2, 0.2)

    // X축 라인 (Z 방향)
    for (let i = -gridSize / 2; i <= gridSize / 2; i += gridSpacing) {
      const line = MeshBuilder.CreateLines(`gridLineX_${i}`, {
        points: [
          new Vector3(i, 0.01, -gridSize / 2),
          new Vector3(i, 0.01, gridSize / 2)
        ]
      }, scene)
      line.color = new Color3(0.3, 0.3, 0.3)
      gridLines.push(line)
    }

    // Z축 라인 (X 방향)
    for (let i = -gridSize / 2; i <= gridSize / 2; i += gridSpacing) {
      const line = MeshBuilder.CreateLines(`gridLineZ_${i}`, {
        points: [
          new Vector3(-gridSize / 2, 0.01, i),
          new Vector3(gridSize / 2, 0.01, i)
        ]
      }, scene)
      line.color = new Color3(0.3, 0.3, 0.3)
      gridLines.push(line)
    }
  }

  createGridLines()

  return {
    toggle: () => {
      gridVisible = !gridVisible
      createGridLines()
      updateStatusBar()
    },
    show: (visible: boolean) => {
      gridVisible = visible
      createGridLines()
      updateStatusBar()
    }
  }
}

// 스냅 함수
function snapToGrid(value: number): number {
  if (!snapEnabled) return value
  return Math.round(value / snapSize) * snapSize
}

// 오브젝트 배치 함수
async function placeObject(scene: Scene, type: string, position: Vector3, placedObjects: Map<string, Mesh>): Promise<Mesh | null> {
  const snappedX = snapToGrid(position.x)
  const snappedZ = snapToGrid(position.z)
  const snappedPosition = new Vector3(snappedX, 0, snappedZ)

  let mesh: Mesh | null = null
  const id = mapManager.generateObjectId()

  switch (type) {
    case 'tree':
      // 기본 나무 모델 (원통 + 구)
      const trunk = MeshBuilder.CreateCylinder(`trunk_${id}`, { height: 2, diameter: 0.3 }, scene)
      trunk.position = snappedPosition.clone()
      trunk.position.y = 1
      const trunkMat = new StandardMaterial(`trunkMat_${id}`, scene)
      trunkMat.diffuseColor = new Color3(0.4, 0.2, 0.1)
      trunk.material = trunkMat

      const leaves = MeshBuilder.CreateSphere(`leaves_${id}`, { diameter: 1.5 }, scene)
      leaves.position = snappedPosition.clone()
      leaves.position.y = 2.5
      const leavesMat = new StandardMaterial(`leavesMat_${id}`, scene)
      leavesMat.diffuseColor = new Color3(0.2, 0.6, 0.2)
      leaves.material = leavesMat

      mesh = trunk
      mesh.metadata = { id, type: 'tree', leaves: leaves }
      break

    case 'rock':
      mesh = MeshBuilder.CreateBox(`rock_${id}`, { width: 0.8, height: 0.4, depth: 0.8 }, scene)
      mesh.position = snappedPosition.clone()
      mesh.position.y = 0.2
      const rockMat = new StandardMaterial(`rockMat_${id}`, scene)
      rockMat.diffuseColor = new Color3(0.5, 0.5, 0.5)
      mesh.material = rockMat
      mesh.metadata = { id, type: 'rock' }
      break

    case 'flower':
      mesh = MeshBuilder.CreateBox(`flower_${id}`, { width: 0.2, height: 0.3, depth: 0.2 }, scene)
      mesh.position = snappedPosition.clone()
      mesh.position.y = 0.15
      const flowerMat = new StandardMaterial(`flowerMat_${id}`, scene)
      flowerMat.diffuseColor = new Color3(1, 0.4, 0.8)
      mesh.material = flowerMat
      mesh.metadata = { id, type: 'flower' }
      break

    case 'house':
      mesh = MeshBuilder.CreateBox(`house_${id}`, { width: 2, height: 2, depth: 2 }, scene)
      mesh.position = snappedPosition.clone()
      mesh.position.y = 1
      const houseMat = new StandardMaterial(`houseMat_${id}`, scene)
      houseMat.diffuseColor = new Color3(0.8, 0.6, 0.4)
      mesh.material = houseMat
      mesh.metadata = { id, type: 'house' }
      break

    case 'shop':
      mesh = MeshBuilder.CreateBox(`shop_${id}`, { width: 2.5, height: 2, depth: 2.5 }, scene)
      mesh.position = snappedPosition.clone()
      mesh.position.y = 1
      const shopMat = new StandardMaterial(`shopMat_${id}`, scene)
      shopMat.diffuseColor = new Color3(0.9, 0.7, 0.5)
      mesh.material = shopMat
      mesh.metadata = { id, type: 'shop' }
      break

    default:
      console.warn(`알 수 없는 오브젝트 타입: ${type}`)
      return null
  }

  if (mesh) {
    mesh.isPickable = true
    placedObjects.set(id, mesh)
    return mesh
  }

  return null
}

// 맵 로드 함수
async function loadMapToScene(scene: Scene, mapData: MapData, placedObjects: Map<string, Mesh>) {
  // 기존 오브젝트 제거
  placedObjects.forEach((mesh) => {
    if (mesh.metadata?.leaves) {
      mesh.metadata.leaves.dispose()
    }
    if (mesh.metadata?.childMeshes) {
      mesh.metadata.childMeshes.forEach((child: Mesh) => child.dispose())
    }
    mesh.dispose()
  })
  placedObjects.clear()

  // 오브젝트 배치 (비동기 처리)
  const loadPromises = mapData.objects.map(async (objData) => {
    const position = new Vector3(objData.position.x, objData.position.y, objData.position.z)
    const mesh = await placeObject(scene, objData.type, position, placedObjects)
    if (mesh && objData.id) {
      // ID 업데이트
      const oldId = mesh.metadata?.id
      if (oldId) {
        placedObjects.delete(oldId)
      }
      mesh.metadata.id = objData.id
      placedObjects.set(objData.id, mesh)

      // 회전 적용
      if (objData.rotation) {
        if (objData.rotation.x !== undefined) mesh.rotation.x = objData.rotation.x
        if (objData.rotation.y !== undefined) mesh.rotation.y = objData.rotation.y
        if (objData.rotation.z !== undefined) mesh.rotation.z = objData.rotation.z
      }

      // 스케일 적용
      if (objData.scale) {
        if (objData.scale.x !== undefined) mesh.scaling.x = objData.scale.x
        if (objData.scale.y !== undefined) mesh.scaling.y = objData.scale.y
        if (objData.scale.z !== undefined) mesh.scaling.z = objData.scale.z
      }

      // 속성 적용
      if (objData.properties) {
        mesh.metadata.properties = objData.properties
      }
    }
  })
  
  await Promise.all(loadPromises)
}

// UI 이벤트 설정
function setupUIEvents(
  scene: Scene,
  camera: ArcRotateCamera | FreeCamera,
  canvas: HTMLCanvasElement,
  placedObjects: Map<string, Mesh>,
  gridSystem: { toggle: () => void; show: (visible: boolean) => void }
) {
  // 새 맵 버튼
  const btnNew = document.getElementById('btn-new')
  if (btnNew) {
    btnNew.addEventListener('click', () => {
      if (confirm('새 맵을 생성하시겠습니까? 현재 맵은 저장되지 않습니다.')) {
        // 기존 오브젝트 제거
        placedObjects.forEach((mesh) => {
          if (mesh.metadata?.leaves) {
            mesh.metadata.leaves.dispose()
          }
          mesh.dispose()
        })
        placedObjects.clear()
        
        // 새 맵 생성
        mapManager.createNewMap('새 맵')
        selectObject(null, scene)
      }
    })
  }

  // 저장 버튼
  const btnSave = document.getElementById('btn-save')
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      try {
        mapManager.downloadMap()
        alert('맵이 저장되었습니다!')
      } catch (error) {
        alert(`저장 실패: ${error}`)
      }
    })
  }

  // 열기 버튼
  const btnOpen = document.getElementById('btn-open')
  if (btnOpen) {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = '.json'
    fileInput.style.display = 'none'
    document.body.appendChild(fileInput)

    btnOpen.addEventListener('click', () => {
      fileInput.click()
    })

    fileInput.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const mapData = await mapManager.loadMapFromFile(file)
          await loadMapToScene(scene, mapData, placedObjects)
          alert('맵이 로드되었습니다!')
        } catch (error) {
          alert(`로드 실패: ${error}`)
        }
      }
    })
  }

  // 도구 버튼 이벤트
  const toolButtons = ['select', 'place', 'move', 'rotate', 'scale', 'copy', 'delete']
  toolButtons.forEach(tool => {
    const btn = document.getElementById(`btn-${tool}`)
    if (btn) {
      btn.addEventListener('click', () => {
        // 모든 도구 버튼 비활성화
        toolButtons.forEach(t => {
          const b = document.getElementById(`btn-${t}`)
          if (b) b.classList.remove('active')
        })
        // 현재 도구 활성화
        btn.classList.add('active')
        currentTool = tool as typeof currentTool
        updateStatusBar()
        
        // 팔레트 선택 해제 (선택 도구일 때)
        if (tool === 'select') {
          document.querySelectorAll('.palette-item').forEach(i => i.classList.remove('selected'))
        }
      })
    }
  })

  // 복사 버튼
  const btnCopy = document.getElementById('btn-copy')
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      if (selectedObject) {
        copyObject(scene, selectedObject, placedObjects)
      }
    })
  }

  // 그리드 토글
  const btnGridToggle = document.getElementById('btn-grid-toggle')
  if (btnGridToggle) {
    btnGridToggle.addEventListener('click', () => {
      gridSystem.toggle()
      btnGridToggle.classList.toggle('active')
    })
  }

  // 카메라 모드 전환
  const btnCameraTop = document.getElementById('btn-camera-top')
  const btnCameraFree = document.getElementById('btn-camera-free')
  
  if (btnCameraTop) {
    btnCameraTop.addEventListener('click', () => {
      if (camera instanceof ArcRotateCamera) {
        camera.alpha = -Math.PI / 2
        camera.beta = Math.PI / 2
        camera.radius = 20
      }
      cameraMode = 'top'
      updateStatusBar()
      btnCameraTop.classList.add('active')
      btnCameraFree?.classList.remove('active')
    })
  }

  if (btnCameraFree) {
    btnCameraFree.addEventListener('click', () => {
      cameraMode = 'free'
      updateStatusBar()
      btnCameraFree.classList.add('active')
      btnCameraTop?.classList.remove('active')
    })
  }

  // 팔레트 아이템 클릭
  document.querySelectorAll('.palette-item').forEach(item => {
    item.addEventListener('click', () => {
      // 모든 팔레트 아이템 선택 해제
      document.querySelectorAll('.palette-item').forEach(i => i.classList.remove('selected'))
      // 현재 아이템 선택
      item.classList.add('selected')
      // 배치 모드로 전환
      const type = (item as HTMLElement).dataset.type
      if (type) {
        const btnPlace = document.getElementById('btn-place')
        if (btnPlace) btnPlace.click()
      }
    })
  })

  // 캔버스 클릭 이벤트
  canvas.addEventListener('click', (e) => {
    if (isDragging) return // 드래그 중이면 무시

    const pickResult = scene.pick(e.offsetX, e.offsetY)
    
    if (currentTool === 'place') {
      // 배치 모드
      const selectedPaletteItem = document.querySelector('.palette-item.selected')
      if (selectedPaletteItem && pickResult?.pickedPoint) {
        const type = (selectedPaletteItem as HTMLElement).dataset.type
        if (type) {
          placeObject(scene, type, pickResult.pickedPoint, placedObjects).then(mesh => {
            if (mesh) {
              selectObject(mesh, scene)
            }
          })
        }
      }
    } else if (currentTool === 'select') {
      // 선택 모드
      if (pickResult?.hit && pickResult.pickedMesh instanceof Mesh && pickResult.pickedMesh.name !== 'ground') {
        selectObject(pickResult.pickedMesh, scene)
      } else {
        selectObject(null, scene)
      }
    } else if (currentTool === 'delete') {
      // 삭제 모드
      if (pickResult?.hit && pickResult.pickedMesh instanceof Mesh && pickResult.pickedMesh.name !== 'ground') {
        deleteObject(pickResult.pickedMesh, placedObjects)
      }
        } else if (currentTool === 'move') {
      // 이동 모드: 오브젝트 선택 또는 위치로 이동
      if (pickResult?.hit && pickResult.pickedMesh instanceof Mesh && pickResult.pickedMesh.name !== 'ground') {
        // GLB 오브젝트의 경우: 클릭한 메시가 자식 메시인지 확인하고 메인 메시 찾기
        let clickedMesh: Mesh | null = pickResult.pickedMesh
        
        // GLB 오브젝트 찾기: 클릭한 메시가 어떤 GLB 오브젝트의 자식인지 확인
        let glbMainMesh: Mesh | null = null
        placedObjects.forEach((mesh, id) => {
          if (mesh.metadata?.childMeshes) {
            const childMeshes = mesh.metadata.childMeshes as Mesh[]
            if (childMeshes.includes(clickedMesh!)) {
              glbMainMesh = mesh
            }
          }
          // 메인 메시 자체를 클릭한 경우
          if (mesh === clickedMesh) {
            glbMainMesh = mesh
          }
        })
        
        // GLB 메인 메시를 찾았으면 그것을 사용
        if (glbMainMesh) {
          clickedMesh = glbMainMesh
          console.log('GLB 오브젝트 클릭:', 'clickedMesh:', pickResult.pickedMesh.name, 'mainMesh:', glbMainMesh.name)
        }
        
        // 오브젝트를 클릭하면 선택
        if (selectedObject !== clickedMesh) {
          selectObject(clickedMesh, scene)
        }
        // 오브젝트를 선택한 상태에서 다른 위치를 클릭하면 이동
        else if (selectedObject && pickResult?.pickedPoint) {
          const targetX = snapToGrid(pickResult.pickedPoint.x)
          const targetZ = snapToGrid(pickResult.pickedPoint.z)
          const targetY = Math.max(0, pickResult.pickedPoint.y)
          
          // 자식 메시의 상대 위치를 먼저 계산 (오브젝트 위치 변경 전)
          const childOffsets: Vector3[] = []
          if (selectedObject.metadata?.childMeshes) {
            selectedObject.metadata.childMeshes.forEach((child: Mesh) => {
              childOffsets.push(child.position.subtract(selectedObject!.position))
            })
          }
          
          // 오브젝트 이동
          selectedObject.position.x = targetX
          selectedObject.position.z = targetZ
          selectedObject.position.y = targetY
          
          // 자식 메시도 함께 이동
          if (selectedObject.metadata?.leaves) {
            selectedObject.metadata.leaves.position.x = targetX
            selectedObject.metadata.leaves.position.z = targetZ
            selectedObject.metadata.leaves.position.y = targetY + 1.5
          }
          if (selectedObject.metadata?.childMeshes) {
            selectedObject.metadata.childMeshes.forEach((child: Mesh, index: number) => {
              const offset = childOffsets[index]
              child.position = new Vector3(targetX, targetY, targetZ).add(offset)
            })
          }
          
          updatePropertyPanel(selectedObject)
          hidePreviewMesh(scene)
        }
      } else if (selectedObject && pickResult?.pickedPoint) {
        // 빈 공간 클릭 시 선택된 오브젝트를 해당 위치로 이동
        const targetX = snapToGrid(pickResult.pickedPoint.x)
        const targetZ = snapToGrid(pickResult.pickedPoint.z)
        const targetY = Math.max(0, pickResult.pickedPoint.y)
        
        // 자식 메시의 상대 위치를 먼저 계산 (오브젝트 위치 변경 전)
        const childOffsets: Vector3[] = []
        if (selectedObject.metadata?.childMeshes) {
          selectedObject.metadata.childMeshes.forEach((child: Mesh) => {
            childOffsets.push(child.position.subtract(selectedObject!.position))
          })
        }
        
        selectedObject.position.x = targetX
        selectedObject.position.z = targetZ
        selectedObject.position.y = targetY
        
        // 자식 메시도 함께 이동
        if (selectedObject.metadata?.leaves) {
          selectedObject.metadata.leaves.position.x = targetX
          selectedObject.metadata.leaves.position.z = targetZ
          selectedObject.metadata.leaves.position.y = targetY + 1.5
        }
        if (selectedObject.metadata?.childMeshes) {
          selectedObject.metadata.childMeshes.forEach((child: Mesh, index: number) => {
            const offset = childOffsets[index]
            child.position = new Vector3(targetX, targetY, targetZ).add(offset)
          })
        }
        
        updatePropertyPanel(selectedObject)
        hidePreviewMesh(scene)
      }
    } else if (currentTool === 'rotate' || currentTool === 'scale') {
      // 회전/크기 모드에서도 선택 가능
      if (pickResult?.hit && pickResult.pickedMesh instanceof Mesh && pickResult.pickedMesh.name !== 'ground') {
        selectObject(pickResult.pickedMesh, scene)
      }
    }
  })

  // 드래그 이벤트 (이동/회전)
  let isMouseDown = false
  canvas.addEventListener('mousedown', (e) => {
    if (currentTool === 'move' || currentTool === 'rotate') {
      const pickResult = scene.pick(e.offsetX, e.offsetY)
      // GLB 오브젝트의 경우: 자식 메시 클릭 시에도 메인 메시 찾기
      let clickedMesh: Mesh | null = null
      if (pickResult?.hit && pickResult.pickedMesh instanceof Mesh) {
        clickedMesh = pickResult.pickedMesh
        
        // GLB 오브젝트 찾기: 클릭한 메시가 어떤 GLB 오브젝트의 자식인지 확인
        let glbMainMesh: Mesh | null = null
        placedObjects.forEach((mesh) => {
          if (mesh.metadata?.childMeshes) {
            const childMeshes = mesh.metadata.childMeshes as Mesh[]
            if (childMeshes.includes(clickedMesh!)) {
              glbMainMesh = mesh
            }
          }
          // 메인 메시 자체를 클릭한 경우
          if (mesh === clickedMesh) {
            glbMainMesh = mesh
          }
        })
        
        // GLB 메인 메시를 찾았으면 그것을 사용
        if (glbMainMesh) {
          clickedMesh = glbMainMesh
        }
      }
      
      if (clickedMesh && selectedObject === clickedMesh) {
        console.log('드래그 시작:', clickedMesh.name, '위치:', pickResult?.pickedPoint)
        isMouseDown = true
        isDragging = true
        dragStartPosition = pickResult.pickedPoint || null
      } else {
        console.log('드래그 실패:', 'clickedMesh:', clickedMesh?.name, 'selectedObject:', selectedObject?.name)
      }
    }
  })
  
  canvas.addEventListener('mouseup', (e) => {
    if (isMouseDown) {
      console.log('드래그 종료')
    }
    isMouseDown = false
    isDragging = false
  })

  canvas.addEventListener('mousemove', (e) => {
    const pickResult = scene.pick(e.offsetX, e.offsetY)
    
    // 디버그: 선택 상태 확인 (필요시 주석 해제)
    // if (selectedObject) {
    //   console.log('mousemove:', 'selectedObject:', selectedObject.name, 'currentTool:', currentTool, 'isMouseDown:', isMouseDown, 'pickResult:', !!pickResult?.pickedPoint)
    // }
    
    // 선택된 오브젝트가 있고 이동 모드일 때
    if (selectedObject && currentTool === 'move') {
      if (isMouseDown && dragStartPosition) {
        // 드래그 중 - 그리드에 맞춰진 위치로 실루엣 표시
        if (pickResult?.pickedPoint) {
          // 마우스 위치를 그리드에 맞춰진 위치로 계산
          const targetX = snapToGrid(pickResult.pickedPoint.x)
          const targetZ = snapToGrid(pickResult.pickedPoint.z)
          const targetY = Math.max(0, pickResult.pickedPoint.y)
          
          // 예상 위치 업데이트 (그리드에 맞춰진 위치)
          showPreviewMesh(scene, selectedObject, new Vector3(targetX, targetY, targetZ))

          // 자식 메시의 상대 위치를 먼저 계산 (오브젝트 위치 변경 전)
          const childOffsets: Vector3[] = []
          if (selectedObject.metadata?.childMeshes) {
            selectedObject.metadata.childMeshes.forEach((child: Mesh) => {
              childOffsets.push(child.position.subtract(selectedObject!.position))
            })
          }

          // 메인 오브젝트 이동
          selectedObject.position.x = targetX
          selectedObject.position.z = targetZ
          selectedObject.position.y = targetY

          // leaves 등 자식 오브젝트도 함께 이동
          if (selectedObject.metadata?.leaves) {
            selectedObject.metadata.leaves.position.x = targetX
            selectedObject.metadata.leaves.position.z = targetZ
            selectedObject.metadata.leaves.position.y = targetY + 1.5
          }
          // childMeshes 이동 (계산된 오프셋 사용)
          if (selectedObject.metadata?.childMeshes) {
            selectedObject.metadata.childMeshes.forEach((child: Mesh, index: number) => {
              const offset = childOffsets[index]
              child.position = new Vector3(targetX, targetY, targetZ).add(offset)
            })
          }

          updatePropertyPanel(selectedObject)
          dragStartPosition = pickResult.pickedPoint
        }
      } else {
        // 드래그 전 - 마우스 위치에 따라 예상 위치 표시 (그리드에 맞춰진 위치)
        if (pickResult?.pickedPoint) {
          const targetX = snapToGrid(pickResult.pickedPoint.x)
          const targetZ = snapToGrid(pickResult.pickedPoint.z)
          const targetY = Math.max(0, pickResult.pickedPoint.y)
          const targetPos = new Vector3(targetX, targetY, targetZ)
          showPreviewMesh(scene, selectedObject, targetPos)
        } else if (pickResult?.pickedPoint) {
          // 지면 위가 아닐 때도 그리드에 맞춰진 위치 표시
          const targetX = snapToGrid(pickResult.pickedPoint.x)
          const targetZ = snapToGrid(pickResult.pickedPoint.z)
          const targetY = Math.max(0, pickResult.pickedPoint.y)
          const targetPos = new Vector3(targetX, targetY, targetZ)
          showPreviewMesh(scene, selectedObject, targetPos)
        } else {
          // 지면 위가 아니고 pickPoint도 없을 때는 현재 오브젝트 위치 기준으로 표시 (그리드에 맞춰진 위치)
          const currentX = snapToGrid(selectedObject.position.x)
          const currentZ = snapToGrid(selectedObject.position.z)
          const currentY = selectedObject.position.y
          showPreviewMesh(scene, selectedObject, new Vector3(currentX, currentY, currentZ))
        }
      }
    } else if (selectedObject && currentTool === 'rotate' && isMouseDown && pickResult?.pickedPoint) {
      // 회전 모드
      const center = selectedObject.getAbsolutePosition()
      const mouseWorldPos = pickResult.pickedPoint
      const direction = mouseWorldPos.subtract(center)
      const angle = Math.atan2(direction.x, direction.z)
      selectedObject.rotation.y = angle
      updatePropertyPanel(selectedObject)
    } else {
      // 다른 모드일 때 예상 위치 숨김
      hidePreviewMesh(scene)
    }
  })

  canvas.addEventListener('mouseup', () => {
    if (isMouseDown && selectedObject) {
      // 이동 완료 시 예상 위치 메시 제거
      hidePreviewMesh(scene)
    }
    isMouseDown = false
    isDragging = false
    dragStartPosition = null
  })

  canvas.addEventListener('mouseleave', () => {
    hidePreviewMesh(scene)
    isMouseDown = false
    isDragging = false
    dragStartPosition = null
  })

  // 속성 패널 이벤트
  setupPropertyPanel(placedObjects)
}

// 예상 위치 메시 표시
function showPreviewMesh(scene: Scene, sourceMesh: Mesh, targetPosition: Vector3) {
  // 기존 예상 메시 제거
  hidePreviewMesh(scene)
  
  if (!sourceMesh || !scene) return
  
  try {
    // 메인 메시 복제 (반투명 실루엣)
    const cloneName = `preview_${Date.now()}`
    try {
      previewMesh = sourceMesh.clone(cloneName, false) as Mesh
      if (!previewMesh) {
        console.warn('예상 위치 메시 복제 실패', cloneName)
        return
      }
    } catch (error) {
      console.warn('메시 복제 중 오류:', error)
      return
    }
    
    
    // 반투명 재질 적용
    const previewMaterial = new StandardMaterial('previewMaterial', scene)
    previewMaterial.diffuseColor = new Color3(0, 1, 1) // 시안색
    previewMaterial.alpha = 0.3 // 반투명
    previewMaterial.emissiveColor = new Color3(0, 0.5, 0.5)
    previewMesh.material = previewMaterial
    previewMesh.position = targetPosition.clone()
    // 원본 메시의 회전 정보 복사
    previewMesh.rotation.x = sourceMesh.rotation.x
    previewMesh.rotation.y = sourceMesh.rotation.y
    previewMesh.rotation.z = sourceMesh.rotation.z
    previewMesh.isPickable = false
    
    // 자식 메시도 복제
    if (sourceMesh.metadata?.leaves) {
      const previewLeaves = sourceMesh.metadata.leaves.clone(`preview_leaves_${Date.now()}`) as Mesh
      if (previewLeaves) {
        const leavesMaterial = new StandardMaterial('previewLeavesMaterial', scene)
        leavesMaterial.diffuseColor = new Color3(0, 1, 1)
        leavesMaterial.alpha = 0.3
        leavesMaterial.emissiveColor = new Color3(0, 0.5, 0.5)
        previewLeaves.material = leavesMaterial
        previewLeaves.position = targetPosition.clone()
        previewLeaves.position.y += 1.5
        previewLeaves.isPickable = false
        previewChildMeshes.push(previewLeaves)
      }
    }
    
    if (sourceMesh.metadata?.childMeshes) {
      sourceMesh.metadata.childMeshes.forEach((child: Mesh, index: number) => {
        try {
          const previewChild = child.clone(`preview_child_${Date.now()}_${index}`, false) as Mesh
          if (previewChild) {
            const childMaterial = new StandardMaterial(`previewChildMaterial_${index}`, scene)
            childMaterial.diffuseColor = new Color3(0, 1, 1)
            childMaterial.alpha = 0.3
            childMaterial.emissiveColor = new Color3(0, 0.5, 0.5)
            previewChild.material = childMaterial
            // 상대 위치 계산
            const offset = child.position.subtract(sourceMesh.position)
            previewChild.position = targetPosition.clone().add(offset)
            // 회전 정보도 복사
            previewChild.rotation.x = child.rotation.x
            previewChild.rotation.y = child.rotation.y
            previewChild.rotation.z = child.rotation.z
            previewChild.isPickable = false
            previewChildMeshes.push(previewChild)
          }
        } catch (error) {
          console.warn('자식 메시 복제 실패:', error)
        }
      })
    }
  } catch (error) {
    console.warn('예상 위치 메시 생성 실패:', error)
    hidePreviewMesh(scene)
  }
}

// 예상 위치 메시 숨김
function hidePreviewMesh(scene: Scene) {
  if (previewMesh) {
    previewMesh.dispose()
    previewMesh = null
  }
  previewChildMeshes.forEach(mesh => {
    if (mesh && !mesh.isDisposed()) {
      mesh.dispose()
    }
  })
  previewChildMeshes = []
}

// 오브젝트 선택
function selectObject(mesh: Mesh | null, scene?: Scene) {
  // 바닥은 선택 불가
  if (mesh && mesh.name === 'ground') {
    return
  }
  
  // 이전 선택 하이라이트 제거
  if (selectedObject && highlightLayer) {
    highlightLayer.removeMesh(selectedObject)
    // 자식 메시도 제거
    if (selectedObject.metadata?.leaves) {
      highlightLayer.removeMesh(selectedObject.metadata.leaves)
    }
    if (selectedObject.metadata?.childMeshes) {
      selectedObject.metadata.childMeshes.forEach((child: Mesh) => {
        highlightLayer?.removeMesh(child)
      })
    }
  }

  // 예상 위치 메시 제거
  if (scene) {
    hidePreviewMesh(scene)
  }

  selectedObject = mesh

  if (mesh && highlightLayer) {
    // HighlightLayer로 실루엣 표시 (시안색)
    const highlightColor = new Color3(0, 1, 1) // Cyan color
    highlightLayer.addMesh(mesh, highlightColor)
    
    // 자식 메시도 하이라이트
    if (mesh.metadata?.leaves) {
      highlightLayer.addMesh(mesh.metadata.leaves, highlightColor)
    }
    if (mesh.metadata?.childMeshes) {
      mesh.metadata.childMeshes.forEach((child: Mesh) => {
        highlightLayer?.addMesh(child, highlightColor)
      })
    }
    
    updatePropertyPanel(mesh)
  } else {
    clearPropertyPanel()
  }
}

// 오브젝트 복사
function copyObject(scene: Scene, sourceMesh: Mesh, placedObjects: Map<string, Mesh>) {
  const id = mapManager.generateObjectId()
  let newMesh: Mesh | null = null
  
  // 메인 메시 복제
  newMesh = sourceMesh.clone(`copy_${id}`) as Mesh
  if (!newMesh) return null
  
  // 위치를 약간 옆으로 이동 (스냅 적용)
  const offset = snapToGrid(1.0)
  newMesh.position.x = snapToGrid(sourceMesh.position.x + offset)
  newMesh.position.z = snapToGrid(sourceMesh.position.z)
  newMesh.position.y = sourceMesh.position.y
  
  // 메타데이터 복사
  newMesh.metadata = {
    ...sourceMesh.metadata,
    id: id,
    type: sourceMesh.metadata?.type || 'unknown'
  }
  
  // 자식 메시 복제
  if (sourceMesh.metadata?.leaves) {
    const newLeaves = sourceMesh.metadata.leaves.clone(`leaves_${id}`) as Mesh
    if (newLeaves) {
      newLeaves.position.x = newMesh.position.x
      newLeaves.position.y = newMesh.position.y + 1.5
      newLeaves.position.z = newMesh.position.z
      newMesh.metadata.leaves = newLeaves
    }
  }
  
  if (sourceMesh.metadata?.childMeshes) {
    const newChildMeshes: Mesh[] = []
    sourceMesh.metadata.childMeshes.forEach((child: Mesh, index: number) => {
      const newChild = child.clone(`child_${id}_${index}`) as Mesh
      if (newChild) {
        const offset = child.position.subtract(sourceMesh.position)
        newChild.position = newMesh!.position.add(offset)
        newChildMeshes.push(newChild)
      }
    })
    newMesh.metadata.childMeshes = newChildMeshes
  }
  
  newMesh.isPickable = true
  placedObjects.set(id, newMesh)
  
  // 복사한 오브젝트 선택
  selectObject(newMesh, scene)
  
  return newMesh
}

// 오브젝트 삭제
function deleteObject(mesh: Mesh, placedObjects: Map<string, Mesh>) {
  // 메타데이터에서 leaves 등 자식 오브젝트 제거
  if (mesh.metadata?.leaves) {
    mesh.metadata.leaves.dispose()
  }
  if (mesh.metadata?.childMeshes) {
    mesh.metadata.childMeshes.forEach((child: Mesh) => child.dispose())
  }

  // 맵에서 제거
  const id = mesh.metadata?.id
  if (id) {
    placedObjects.delete(id)
  }

  // 선택 해제
  if (selectedObject === mesh) {
    selectObject(null, scene)
  }

  mesh.dispose()
}

// 속성 패널 업데이트
function updatePropertyPanel(mesh: Mesh) {
  const propX = document.getElementById('prop-x') as HTMLInputElement
  const propY = document.getElementById('prop-y') as HTMLInputElement
  const propZ = document.getElementById('prop-z') as HTMLInputElement
  const propRotationY = document.getElementById('prop-rotation-y') as HTMLInputElement

  if (propX) propX.value = mesh.position.x.toFixed(2)
  if (propY) propY.value = mesh.position.y.toFixed(2)
  if (propZ) propZ.value = mesh.position.z.toFixed(2)
  if (propRotationY) propRotationY.value = ((mesh.rotation.y || 0) * 180 / Math.PI).toFixed(0)
}

// 속성 패널 초기화
function clearPropertyPanel() {
  const propX = document.getElementById('prop-x') as HTMLInputElement
  const propY = document.getElementById('prop-y') as HTMLInputElement
  const propZ = document.getElementById('prop-z') as HTMLInputElement
  const propRotationY = document.getElementById('prop-rotation-y') as HTMLInputElement

  if (propX) propX.value = ''
  if (propY) propY.value = ''
  if (propZ) propZ.value = ''
  if (propRotationY) propRotationY.value = ''
}

// 속성 패널 이벤트 설정
function setupPropertyPanel(placedObjects: Map<string, Mesh>) {
  const propX = document.getElementById('prop-x')
  const propY = document.getElementById('prop-y')
  const propZ = document.getElementById('prop-z')
  const propRotationY = document.getElementById('prop-rotation-y')

  const updateMeshPosition = () => {
    if (!selectedObject) return

    const x = parseFloat((propX as HTMLInputElement).value) || 0
    const y = parseFloat((propY as HTMLInputElement).value) || 0
    const z = parseFloat((propZ as HTMLInputElement).value) || 0

    const newX = snapToGrid(x)
    const newZ = snapToGrid(z)

    selectedObject.position.x = newX
    selectedObject.position.y = y
    selectedObject.position.z = newZ

    // leaves 등 자식 오브젝트도 함께 이동
    if (selectedObject.metadata?.leaves) {
      selectedObject.metadata.leaves.position.x = newX
      selectedObject.metadata.leaves.position.y = y + 1.5
      selectedObject.metadata.leaves.position.z = newZ
    }
    if (selectedObject.metadata?.childMeshes) {
      selectedObject.metadata.childMeshes.forEach((child: Mesh) => {
        const offset = child.position.subtract(selectedObject!.position)
        child.position = new Vector3(newX, y, newZ).add(offset)
      })
    }
  }

  const updateMeshRotation = () => {
    if (!selectedObject) return

    const rotationY = parseFloat((propRotationY as HTMLInputElement).value) || 0
    selectedObject.rotation.y = (rotationY * Math.PI) / 180
  }

  if (propX) propX.addEventListener('change', updateMeshPosition)
  if (propY) propY.addEventListener('change', updateMeshPosition)
  if (propZ) propZ.addEventListener('change', updateMeshPosition)
  if (propRotationY) propRotationY.addEventListener('change', updateMeshRotation)
}

// 상태 바 업데이트
function updateStatusBar() {
  const statusGrid = document.getElementById('status-grid')
  const statusSnap = document.getElementById('status-snap')
  const statusCamera = document.getElementById('status-camera')

  if (statusGrid) statusGrid.textContent = gridVisible ? 'ON' : 'OFF'
  if (statusSnap) statusSnap.textContent = snapEnabled ? snapSize.toFixed(1) : 'OFF'
  if (statusCamera) statusCamera.textContent = cameraMode === 'top' ? '탑뷰' : '프리뷰'
}

// 에디터 시작
console.log('맵 에디터 스크립트 로드 완료')
initEditor()
