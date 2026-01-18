import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder, StandardMaterial, Color3, Mesh, AbstractMesh, DirectionalLight, ShadowGenerator, CascadedShadowGenerator } from '@babylonjs/core'
import '@babylonjs/loaders'
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent'
import { InventoryManager } from './InventoryManager'
import { PlayerController } from './PlayerController'
import { InputManager } from './InputManager'
import { UIManagerNew } from './UIManagerNew'
import { CraftingSystem } from './CraftingSystem'
import { ObjectInteractionPopup } from './ui/ObjectInteractionPopup'
import { TimeSystem } from './systems/TimeSystem'
import { SaveSystem } from './systems/SaveSystem'
import { ShopSystem } from './systems/ShopSystem'
import { CodexSystem } from './systems/CodexSystem'
import { MissionSystem } from './systems/MissionSystem'
import { MuseumSystem } from './systems/MuseumSystem'
import { QuickSlotSystem } from './systems/QuickSlotSystem'
import { BuildingSystem } from './systems/BuildingSystem'
import { BuildingInteriorSystem } from './systems/BuildingInteriorSystem'
import { DecorationSystem } from './systems/DecorationSystem'
import { EventSystem } from './systems/EventSystem'
import { FishingSystem } from './systems/FishingSystem'
import { WeatherSystem } from './systems/WeatherSystem'
import { BugCatchingSystem } from './systems/BugCatchingSystem'
import { FarmingSystem } from './systems/FarmingSystem'
import { NPCSystem } from './systems/NPCSystem'
import { MiniMap } from './ui/MiniMap'
import { PhotoMode } from './systems/PhotoMode'
import { SoundSystem } from './systems/SoundSystem'
import { LODManager } from './utils/LODManager'
import { EnvironmentAnimation } from './utils/EnvironmentAnimation'
import { CurrencySystem } from './systems/CurrencySystem'
import { CharacterCustomizationSystem } from './systems/CharacterCustomizationSystem'
import { PetSystem } from './systems/PetSystem'
import { AchievementSystem } from './systems/AchievementSystem'
import { HiddenContentSystem } from './systems/HiddenContentSystem'
import { AuthSystem } from './systems/AuthSystem'
import { GameStartScreen } from './ui/GameStartScreen'
import { TutorialSystem } from './systems/TutorialSystem'
import { TutorialPanel } from './ui/TutorialPanel'
import { SettingsPanel, GameSettings } from './ui/SettingsPanel'
import { LoadingScreen } from './ui/LoadingScreen'
import { ParticleEffects } from './utils/ParticleEffects'
import { HighlightManager } from './utils/HighlightManager'
import { ErrorHandler } from './ui/ErrorHandler'
import { MobileSupport } from './utils/MobileSupport'
import { AccessibilityManager } from './utils/AccessibilityManager'
import { StatisticsManager } from './utils/StatisticsManager'

// 게임 초기화
function initGame() {
  // Canvas 요소 가져오기
  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement | null
  if (!canvas) {
    console.error('Canvas를 찾을 수 없습니다!')
    return
  }
  
  // 오른쪽 마우스 클릭 메뉴 비활성화 (여러 방법으로 확실히 차단)
  const disableContextMenu = (e: Event) => {
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
    return false
  }
  
  // 여러 단계에서 차단
  canvas.addEventListener('contextmenu', disableContextMenu, { capture: true, passive: false })
  canvas.addEventListener('contextmenu', disableContextMenu, { capture: false, passive: false })
  canvas.oncontextmenu = () => false
  
  // window, document에도 추가
  window.addEventListener('contextmenu', disableContextMenu, { capture: true, passive: false })
  document.addEventListener('contextmenu', disableContextMenu, { capture: true, passive: false })
  
  // body에도 추가
  document.body.addEventListener('contextmenu', disableContextMenu, { capture: true, passive: false })
  document.body.oncontextmenu = () => false

  // Babylon.js 엔진 생성
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true
  })

  // 씬 생성
  const scene = new Scene(engine)

  // 인증 시스템 초기화
  const authSystem = new AuthSystem()
  
  // 게임 시작 화면 생성
  const gameStartScreen = new GameStartScreen(authSystem)
  gameStartScreen.show()

  // 게임 시작 콜백 설정
  gameStartScreen.setOnGameStart(async (user) => {
    // 게임 시작 화면 숨기기
    gameStartScreen.hide()
    
    // 로딩 표시
    const loadingElement = document.getElementById('loading')
    if (loadingElement) {
      loadingElement.style.display = 'block'
      loadingElement.textContent = '게임을 로딩 중...'
    }
    
    // 게임 초기화 진행
    await initializeGameSystems(scene, engine, canvas, authSystem, user)
    
    // 로딩 숨기기
    if (loadingElement) {
      loadingElement.remove()
    }
  })

  // 게임이 시작되지 않은 상태에서는 렌더링 루프를 실행하지 않음
  return
}

// 실제 게임 시스템 초기화 함수
async function initializeGameSystems(scene: Scene, engine: Engine, canvas: HTMLCanvasElement, authSystem: AuthSystem, user: any) {
  // 로딩 화면 표시
  const loadingScreen = new LoadingScreen()
  loadingScreen.show()
  
  // 기존 로딩 요소 제거
  const oldLoading = document.getElementById('loading')
  if (oldLoading) {
    oldLoading.remove()
  }
  
  // 로딩 진행률 업데이트 함수
  const updateProgress = (percent: number, message?: string) => {
    loadingScreen.setProgress(percent)
    if (message) {
      loadingScreen.setAssetStatus(message, 'loading')
    }
  }
  
  updateProgress(5, '시스템 초기화 중...')
  
  // 에러 핸들러 초기화
  const errorHandler = new ErrorHandler()
  ;(window as any).errorHandler = errorHandler
  
  // 모바일 지원 초기화
  const mobileSupport = new MobileSupport()
  mobileSupport.adjustUIForMobile()
  mobileSupport.handleOrientationChange()
  ;(window as any).mobileSupport = mobileSupport
  
  // 접근성 관리자 초기화
  const accessibilityManager = new AccessibilityManager()
  ;(window as any).accessibilityManager = accessibilityManager
  
  // 입력 관리자 및 UI 관리자 생성
  const inputManager = new InputManager(scene);
  const inventoryManager = new InventoryManager();
  const currencySystem = new CurrencySystem(0, 0); // 초기 코인/토큰
  const craftingSystem = new CraftingSystem(inventoryManager);
  const shopSystem = new ShopSystem(inventoryManager);
  const codexSystem = new CodexSystem(inventoryManager);
  const missionSystem = new MissionSystem(inventoryManager);
  const museumSystem = new MuseumSystem(inventoryManager);
  const quickSlotSystem = new QuickSlotSystem(inventoryManager);
  const buildingSystem = new BuildingSystem(scene, inventoryManager);
  const decorationSystem = new DecorationSystem(scene, inventoryManager);
  const interiorSystem = new BuildingInteriorSystem(scene);
  interiorSystem.setDecorationSystem(decorationSystem);
  const eventSystem = new EventSystem();
  const achievementSystem = new AchievementSystem();
  const statisticsManager = new StatisticsManager();
  const hiddenContentSystem = new HiddenContentSystem(scene);
  const uiManager = new UIManagerNew();
  uiManager.setInventoryManager(inventoryManager);
  uiManager.setCraftingSystem(craftingSystem);
  uiManager.setShopSystem(shopSystem);
  uiManager.setCodexSystem(codexSystem);
  uiManager.setMissionSystem(missionSystem);
  uiManager.setMuseumSystem(museumSystem);
  uiManager.setBuildingSystem(buildingSystem);
  uiManager.setDecorationSystem(decorationSystem);
  uiManager.setInteriorSystem(interiorSystem);
  uiManager.setEventSystem(eventSystem);
  const camera = new ArcRotateCamera(
    'camera',
    -Math.PI / 2,
    Math.PI / 3,
    15,
    Vector3.Zero(),
    scene
  )

  camera.attachControl(canvas, true)
  if (camera.inputs && camera.inputs.attached.pointers) {
    // @ts-ignore
    camera.inputs.attached.pointers.buttons = [2]
    camera.panningSensibility = 0
    
    // 우클릭 컨텍스트 메뉴 차단 (Babylon.js 카메라 컨트롤 내부)
    const originalOnContextMenu = canvas.oncontextmenu
    canvas.oncontextmenu = function(e) {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
      }
      return false
    }
  }
  
  // Babylon.js 씬의 포인터 이벤트에서도 컨텍스트 메뉴 차단
  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.event) {
      const mouseEvent = pointerInfo.event as MouseEvent
      if (mouseEvent.button === 2) {
        mouseEvent.preventDefault()
        mouseEvent.stopPropagation()
        mouseEvent.stopImmediatePropagation()
      }
      // 컨텍스트 메뉴 이벤트도 차단
      if (pointerInfo.type === 4) { // POINTERMOVE나 다른 이벤트에서도
        mouseEvent.preventDefault()
      }
    }
  })
  
  // 추가로 모든 마우스 이벤트에서 우클릭 차단
  canvas.addEventListener('mousedown', (e: MouseEvent) => {
    if (e.button === 2) {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      return false
    }
  }, { capture: true, passive: false })
  
  canvas.addEventListener('mouseup', (e: MouseEvent) => {
    if (e.button === 2) {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      return false
    }
  }, { capture: true, passive: false })

  camera.upperBetaLimit = Math.PI / 2.2
  camera.lowerRadiusLimit = 8
  camera.upperRadiusLimit = 20

  // ObjectInteractionPopup 생성 및 설정 (카메라가 생성된 후)
  const objectInteractionPopup = new ObjectInteractionPopup(scene, camera)
  uiManager.setObjectInteractionPopup(objectInteractionPopup)
  
  // 미니맵 생성 및 설정
  const miniMap = new MiniMap(scene)
  uiManager.setMiniMap(miniMap)
  
  // PhotoMode 생성 (카메라 필요)
  const photoMode = new PhotoMode(scene, camera, engine)
  uiManager.setPhotoMode(photoMode)

  // 조명 추가 - 기본 환경 조명
  const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene)
  light.intensity = 0.7
  
  // 방향 조명 추가 (그림자용)
  const directionalLight = new DirectionalLight('directionalLight', new Vector3(-1, -1, -0.5), scene)
  directionalLight.intensity = 0.8
  directionalLight.position = new Vector3(20, 40, 20)
  
  // 그림자 생성기
  let shadowGenerator: ShadowGenerator | null = null
  try {
    shadowGenerator = new ShadowGenerator(2048, directionalLight)
    shadowGenerator.useBlurExponentialShadowMap = true
    shadowGenerator.blurKernel = 32
  } catch (e) {
    console.warn('그림자 생성 실패:', e)
  }
  
  // 시간 시스템 초기화
  const timeSystem = new TimeSystem(scene, light)
  uiManager.setTimeSystem(timeSystem)
  shopSystem.setTimeSystem(timeSystem)
  missionSystem.setTimeSystem(timeSystem)
  eventSystem.setTimeSystem(timeSystem)
  eventSystem.setCurrencySystem(currencySystem)
  eventSystem.setInventoryManager(inventoryManager)
  // AchievementSystem 연결
  achievementSystem.setCodexSystem(codexSystem)
  achievementSystem.setMuseumSystem(museumSystem)
  achievementSystem.setTimeSystem(timeSystem)
  achievementSystem.setCurrencySystem(currencySystem)
  achievementSystem.setInventoryManager(inventoryManager)
  
  // StatisticsManager 연결
  statisticsManager.setInventoryManager(inventoryManager)
  statisticsManager.setTimeSystem(timeSystem)
  statisticsManager.setCodexSystem(codexSystem)
  statisticsManager.setMissionSystem(missionSystem)
  statisticsManager.setAchievementSystem(achievementSystem)
  statisticsManager.setBuildingSystem(buildingSystem)
  
  // 날씨 시스템 초기화
  const weatherSystem = new WeatherSystem(scene)
  weatherSystem.setTimeSystem(timeSystem)
  
  // EventSystem에 WeatherSystem 연결 (별똥별 이벤트용)
  eventSystem.setWeatherSystem(weatherSystem)
  
  // 사운드 시스템 초기화
  const soundSystem = new SoundSystem(scene)
  uiManager.setSoundSystem(soundSystem)
  
  // 시간 변화 콜백
  timeSystem.onTimeChange((gameTime) => {
    uiManager.updateTime(gameTime)
    
    // 시간대별 BGM 재생 (시간이 바뀔 때만)
    if (soundSystem) {
      const hour = gameTime.hour
      if (hour >= 5 && hour < 12) {
        // 아침 (5-11시)
        soundSystem.loadBackgroundMusic('morning', undefined, 0.6, true)
      } else if (hour >= 12 && hour < 18) {
        // 오후 (12-17시)
        soundSystem.loadBackgroundMusic('afternoon', undefined, 0.6, true)
      } else if (hour >= 18 && hour < 22) {
        // 저녁 (18-21시)
        soundSystem.loadBackgroundMusic('evening', undefined, 0.5, true)
      } else {
        // 밤 (22-4시)
        soundSystem.loadBackgroundMusic('night', undefined, 0.4, true)
      }
    }
  })
  
  // 날씨 변화 콜백
  weatherSystem.onWeatherChange((weather) => {
    uiManager.updateWeather(weatherSystem.getWeatherIcon(), weatherSystem.getWeatherName())
  })
  
  // 초기 날씨 표시
  uiManager.updateWeather(weatherSystem.getWeatherIcon(), weatherSystem.getWeatherName())
  
  // 초기 BGM 재생 (현재 시간대에 맞게)
  if (soundSystem) {
    const initialTime = timeSystem.getTime()
    const hour = initialTime.hour
    if (hour >= 5 && hour < 12) {
      soundSystem.loadBackgroundMusic('morning', undefined, 0.6, true)
    } else if (hour >= 12 && hour < 18) {
      soundSystem.loadBackgroundMusic('afternoon', undefined, 0.6, true)
    } else if (hour >= 18 && hour < 22) {
      soundSystem.loadBackgroundMusic('evening', undefined, 0.5, true)
    } else {
      soundSystem.loadBackgroundMusic('night', undefined, 0.4, true)
    }
  }

  // 간단한 지면 생성 (맵 확장: 50x50 -> 100x100)
  const ground = MeshBuilder.CreateGround('ground', { width: 100, height: 100 }, scene)
  const groundMaterial = new StandardMaterial('groundMaterial', scene)
  groundMaterial.diffuseColor = new Color3(0.4, 0.8, 0.4)
  ground.material = groundMaterial
  ground.checkCollisions = true
  ground.receiveShadows = true // 그림자 받기
  
  // 물 (호수) 생성
  const water = MeshBuilder.CreateGround('water', { width: 20, height: 20, subdivisions: 32 }, scene)
  water.position = new Vector3(30, 0.1, 30) // 지면보다 약간 위에 배치
  const waterMaterial = new StandardMaterial('waterMaterial', scene)
  waterMaterial.diffuseColor = new Color3(0.2, 0.5, 0.8) // 파란색
  waterMaterial.alpha = 0.7 // 반투명
  waterMaterial.specularColor = new Color3(0.8, 0.9, 1.0) // 하이라이트
  water.material = waterMaterial
  water.receiveShadows = true
  water.metadata = { type: 'water', originalY: water.position.y }

  // 플레이어 생성
  const playerMesh = new Mesh("player", scene);
  playerMesh.position.y = 0.9;

  const skinMat = new StandardMaterial("skinMat", scene);
  skinMat.diffuseColor = new Color3(1, 0.8, 0.6);

  const clothesMat = new StandardMaterial("clothesMat", scene);
  clothesMat.diffuseColor = new Color3(0.2, 0.5, 0.9);

  const pantsMat = new StandardMaterial("pantsMat", scene);
  pantsMat.diffuseColor = new Color3(0.2, 0.2, 0.3);

  const head = MeshBuilder.CreateBox("head", { width: 0.4, height: 0.4, depth: 0.4 }, scene);
  head.position.y = 1.4;
  head.material = skinMat;
  head.parent = playerMesh;

  const faceMat = new StandardMaterial("faceMat", scene);
  faceMat.diffuseColor = new Color3(0.1, 0.1, 0.1);
  faceMat.backFaceCulling = false;
  const noseMat = new StandardMaterial("noseMat", scene);
  noseMat.diffuseColor = new Color3(0.8, 0.2, 0.2);
  const hairMat = new StandardMaterial("hairMat", scene);
  hairMat.diffuseColor = new Color3(0.3, 0.2, 0.1);

  const leftEye = MeshBuilder.CreatePlane("leftEye", { width: 0.06, height: 0.06 }, scene);
  leftEye.position = new Vector3(-0.08, 0.05, 0.205);
  leftEye.material = faceMat;
  leftEye.parent = head;

  const rightEye = MeshBuilder.CreatePlane("rightEye", { width: 0.06, height: 0.06 }, scene);
  rightEye.position = new Vector3(0.08, 0.05, 0.205);
  rightEye.material = faceMat;
  rightEye.parent = head;

  const nose = MeshBuilder.CreateBox("nose", { width: 0.06, height: 0.06, depth: 0.06 }, scene);
  nose.position = new Vector3(0, -0.05, 0.2);
  nose.material = noseMat;
  nose.parent = head;

  const mouth = MeshBuilder.CreatePlane("mouth", { width: 0.08, height: 0.03 }, scene);
  mouth.position = new Vector3(0, -0.15, 0.205);
  mouth.material = faceMat;
  mouth.parent = head;

  const hairTop = MeshBuilder.CreateBox("hairTop", { width: 0.44, height: 0.15, depth: 0.44 }, scene);
  hairTop.position.y = 0.15;
  hairTop.material = hairMat;
  hairTop.parent = head;

  const hairBack = MeshBuilder.CreateBox("hairBack", { width: 0.44, height: 0.3, depth: 0.1 }, scene);
  hairBack.position = new Vector3(0, -0.05, -0.18);
  hairBack.material = hairMat;
  hairBack.parent = head;

  const hairLeft = MeshBuilder.CreateBox("hairLeft", { width: 0.1, height: 0.3, depth: 0.35 }, scene);
  hairLeft.position = new Vector3(-0.18, -0.05, -0.05);
  hairLeft.material = hairMat;
  hairLeft.parent = head;

  const hairRight = MeshBuilder.CreateBox("hairRight", { width: 0.1, height: 0.3, depth: 0.35 }, scene);
  hairRight.position = new Vector3(0.18, -0.05, -0.05);
  hairRight.material = hairMat;
  hairRight.parent = head;

  const body = MeshBuilder.CreateBox("body", { width: 0.5, height: 0.6, depth: 0.3 }, scene);
  body.position.y = 0.9;
  body.material = clothesMat;
  body.parent = playerMesh;

  const leftLeg = MeshBuilder.CreateBox("leftLeg", { width: 0.2, height: 0.6, depth: 0.2 }, scene);
  leftLeg.position = new Vector3(-0.15, 0.3, 0);
  leftLeg.material = pantsMat;
  leftLeg.parent = playerMesh;

  const rightLeg = MeshBuilder.CreateBox("rightLeg", { width: 0.2, height: 0.6, depth: 0.2 }, scene);
  rightLeg.position = new Vector3(0.15, 0.3, 0);
  rightLeg.material = pantsMat;
  rightLeg.parent = playerMesh;

  const leftArm = MeshBuilder.CreateBox("leftArm", { width: 0.15, height: 0.5, depth: 0.15 }, scene);
  leftArm.position = new Vector3(-0.35, 0.85, 0);
  leftArm.material = skinMat;
  leftArm.parent = playerMesh;

  const rightArm = MeshBuilder.CreateBox("rightArm", { width: 0.15, height: 0.5, depth: 0.15 }, scene);
  rightArm.position = new Vector3(0.35, 0.85, 0);
  rightArm.material = skinMat;
  rightArm.parent = playerMesh;

  // 충돌용/이동용 캡슐
  const colliderMesh = MeshBuilder.CreateCapsule("collider", { radius: 0.4, height: 1.8 }, scene);
  colliderMesh.visibility = 0;
  colliderMesh.position.y = 0.9;
  colliderMesh.checkCollisions = true;
  colliderMesh.ellipsoid = new Vector3(0.4, 0.9, 0.4);
  colliderMesh.ellipsoidOffset = new Vector3(0, 0, 0);

  playerMesh.parent = colliderMesh;
  playerMesh.position.y = -0.9;

  scene.collisionsEnabled = true;

  const playerController = new PlayerController(scene, colliderMesh, inputManager, uiManager, inventoryManager);
  uiManager.setPlayerController(playerController);
  playerController.setSoundSystem(soundSystem); // PlayerController에 SoundSystem 연결
  playerController.setBuildingSystem(buildingSystem);
  playerController.setInteriorSystem(interiorSystem);
  playerController.setDecorationSystem(decorationSystem);
  // NPCSystem 연결 (생일 파티용) - playerController에서 npcSystem 가져오기
  const npcSystem = (playerController as any).npcSystem
  if (npcSystem) {
    eventSystem.setNPCSystem(npcSystem)
  }
  if ((playerController as any).farmingSystem) {
    statisticsManager.setFarmingSystem((playerController as any).farmingSystem)
  }
  camera.lockedTarget = colliderMesh;
  
  // 캐릭터 커스터마이징 시스템 초기화
  const customizationSystem = new CharacterCustomizationSystem(scene, playerMesh);
  uiManager.setCustomizationSystem(customizationSystem);
  
  // 펫 시스템 초기화
  const petSystem = new PetSystem(scene, colliderMesh)
  uiManager.setPetSystem(petSystem)
  
  // 펫 시스템에 필요한 시스템 참조 설정
  petSystem.setInventoryManager(inventoryManager)
  petSystem.setCurrencySystem(currencySystem)
  if (playerController && (playerController as any).gatheringSystem) {
    petSystem.setGatheringSystem((playerController as any).gatheringSystem)
  }
  if (playerController && (playerController as any).farmingSystem) {
    petSystem.setFarmingSystem((playerController as any).farmingSystem)
  }
  
  // 낚시 시스템 연동
  playerController.setTimeSystemForFishing(timeSystem)
  
  // 벌레 채집 시스템 연동
  playerController.setTimeSystemForBugCatching(timeSystem)
  
  // 농사 시스템 연동
  playerController.setTimeSystemForFarming(timeSystem)
  
  // NPC 시스템 연동
  playerController.setTimeSystemForNPC(timeSystem)
  playerController.setCurrencySystemForNPC(currencySystem)
  
  // NPCSystem에 WeatherSystem 연결 (날씨별 대화용)
  const npcSystemForWeather = (playerController as any).npcSystem
  if (npcSystemForWeather && typeof npcSystemForWeather.setWeatherSystem === 'function') {
    npcSystemForWeather.setWeatherSystem(weatherSystem)
  }
  
  // GatheringSystem 시스템 연동
  playerController.setTimeSystemForGathering(timeSystem)
  playerController.setWeatherSystemForGathering(weatherSystem)
  playerController.setMuseumSystemForGathering(museumSystem)
  
  // 도감 시스템 연동
  if (playerController['fishingSystem']) {
    codexSystem.setFishingSystem(playerController['fishingSystem'])
  }
  playerController.setCodexSystem(codexSystem)
  
  // 박물관 시스템 연동
  museumSystem.setCodexSystem(codexSystem)
  
  // 인벤토리 아이템으로 도감 업데이트
  codexSystem.checkInventoryForNewEntries()
  
  // 저장 시스템 초기화
  const saveSystem = new SaveSystem();
  
  // 튜토리얼 시스템 초기화
  const tutorialSystem = new TutorialSystem()
  const tutorialPanel = new TutorialPanel(tutorialSystem)
  
  // 튜토리얼 패널 이벤트 연결
  tutorialPanel.setOnNext(() => {
    tutorialSystem.nextStep()
    tutorialPanel.updateUI()
  })
  
  tutorialPanel.setOnPrevious(() => {
    tutorialSystem.previousStep()
    tutorialPanel.updateUI()
  })
  
  tutorialPanel.setOnSkip(() => {
    tutorialSystem.skipTutorial()
    tutorialPanel.hide()
  })
  
  tutorialPanel.setOnClose(() => {
    tutorialPanel.hide()
  })
  
  // UIManagerNew에 튜토리얼 시스템 연결
  uiManager.setTutorialSystem(tutorialSystem, tutorialPanel)
  playerController.setTutorialSystem(tutorialSystem); // PlayerController에 TutorialSystem 연결
  
  // 전역 함수로 튜토리얼 표시
  ;(window as any).showTutorial = () => {
    tutorialSystem.startTutorial()
    tutorialPanel.show()
  }
  
  // 설정 패널 초기화 (soundSystem 초기화 이후에 설정)
  // soundSystem이 초기화된 후에 설정 패널을 생성하도록 아래로 이동
  
  // 저장된 게임이 있으면 로드
  let saveData: any = null
  
  // 초기 로드는 localStorage에서 (빠른 로딩)
  const localSaveData = localStorage.getItem('animal_life_game_save')
  if (localSaveData) {
    try {
      saveData = JSON.parse(localSaveData)
    } catch (error) {
      console.error('로컬 저장 데이터 파싱 오류:', error)
    }
  }
  
  // Supabase에서 로드 시도 (비동기 - 나중에 동기화)
  saveSystem.load().then((loadedData) => {
    if (loadedData && (!saveData || loadedData.timestamp > saveData.timestamp)) {
      // Supabase 데이터가 더 최신인 경우
      saveData = loadedData
      loadGameData(loadedData)
      // localStorage에도 동기화
      localStorage.setItem('animal_life_game_save', JSON.stringify(loadedData))
    }
  }).catch((error) => {
    console.error('게임 로드 오류:', error)
  })
  
  // 로컬 데이터가 있으면 먼저 로드
  if (saveData) {
    loadGameData(saveData)
  }
  
  function loadGameData(saveData: any) {
    // 플레이어 위치 복원
    colliderMesh.position = new Vector3(
      saveData.player.position.x,
      saveData.player.position.y,
      saveData.player.position.z
    );
    
    // 인벤토리 복원
    saveData.inventory.forEach(item => {
      inventoryManager.add(item.name, item.count);
    });
    
    // 게임 시간 복원
    timeSystem.setTime(
      saveData.gameTime.hour,
      saveData.gameTime.minute,
      saveData.gameTime.day
    );
    
    // 코인/토큰 복원
    currencySystem.loadData({
      coins: saveData.player.coins || 0,
      tokens: saveData.player.tokens || 0
    });
    
    // 펫 시스템 데이터 복원 (펫 시스템은 나중에 초기화됨)
    // 펫 시스템 로드는 petSystem 초기화 후에 수행
    
    // 튜토리얼 진행 상황 복원
    if (saveData.progress && saveData.progress.tutorialProgress) {
      tutorialSystem.loadProgress(saveData.progress.tutorialProgress)
    } else {
      // 첫 게임 시작 시 튜토리얼 자동 시작
      setTimeout(() => {
        tutorialSystem.startTutorial()
        tutorialPanel.show()
      }, 2000) // 2초 후 시작
    }
    
    console.log('게임 로드 완료');
  }
  
  // 코인/토큰 변경 콜백 설정
  currencySystem.onCoinsChange((coins, previousCoins) => {
    uiManager.setCoins(coins);
    
    // 코인 증가 시 파티클 효과
    if (coins > previousCoins && (window as any).particleEffects && colliderMesh) {
      const effectPosition = colliderMesh.position.clone()
      effectPosition.y += 2
      ;(window as any).particleEffects.createCoinGetEffect(effectPosition)
    }
  });
  currencySystem.onTokensChange((tokens, previousTokens) => {
    uiManager.setTokens(tokens);
    
    // 토큰 증가 시 파티클 효과
    if (tokens > previousTokens && (window as any).particleEffects && colliderMesh) {
      const effectPosition = colliderMesh.position.clone()
      effectPosition.y += 2
      ;(window as any).particleEffects.createItemGetEffect(effectPosition, new Color3(0.5, 0, 1)) // 보라색
    }
  });

  // 초기 코인/토큰 표시
  uiManager.setCoins(currencySystem.getCoins());
  uiManager.setTokens(currencySystem.getTokens());

  // ShopSystem에 CurrencySystem 연결
  shopSystem.setCurrencySystem(currencySystem);
  
  // ShopSystem에 TimeSystem, WeatherSystem, EventSystem 연결
  shopSystem.setTimeSystem(timeSystem);
  shopSystem.setWeatherSystem(weatherSystem);
  shopSystem.setEventSystem(eventSystem);
  
  // ShopSystem에 PetSystem 연결
  shopSystem.setPetSystem(petSystem);
  
  // NPCSystem에 CurrencySystem 연결 (PlayerController를 통해)
  if (playerController && typeof (playerController as any).setCurrencySystem === 'function') {
    (playerController as any).setCurrencySystem(currencySystem);
  }
  
  // UIManagerNew에 CurrencySystem 연결
  uiManager.setCurrencySystem(currencySystem);

  // 자동 저장 (30초마다)
  setInterval(() => {
    const position = colliderMesh.position;
    const coins = currencySystem.getCoins();
    const tokens = currencySystem.getTokens();
    const success = saveSystem.save(inventoryManager, timeSystem, { x: position.x, y: position.y, z: position.z }, coins, tokens, codexSystem, museumSystem, missionSystem, buildingSystem, petSystem, tutorialSystem);
    if (success) {
      uiManager.showSaveNotification('자동 저장 완료');
    }
  }, 30000);
  
  // 페이지 종료 시 저장
  window.addEventListener('beforeunload', () => {
    const position = colliderMesh.position;
    const coins = currencySystem.getCoins();
    const tokens = currencySystem.getTokens();
    const success = saveSystem.save(inventoryManager, timeSystem, { x: position.x, y: position.y, z: position.z }, coins, tokens, codexSystem, museumSystem, missionSystem, buildingSystem, petSystem, tutorialSystem);
    // beforeunload에서는 알림 표시하지 않음 (페이지가 닫히므로)
  });

  // --- 환경 요소 ---
  const treeTrunkMat = new StandardMaterial("treeTrunkMat", scene);
  treeTrunkMat.diffuseColor = new Color3(0.4, 0.2, 0.1);
  const treeLeafMat = new StandardMaterial("treeLeafMat", scene);
  treeLeafMat.diffuseColor = new Color3(0.2, 0.6, 0.2);
  const rockMat = new StandardMaterial("rockMat", scene);
  rockMat.diffuseColor = new Color3(0.5, 0.5, 0.5);
  const flowerMat = new StandardMaterial("flowerMat", scene);
  flowerMat.diffuseColor = new Color3(1, 0.5, 0.8); // 분홍색 꽃
  const grassMat = new StandardMaterial("grassMat", scene);
  grassMat.diffuseColor = new Color3(0.2, 0.7, 0.2); // 녹색 잔디

  const createTree = (x: number, z: number) => {
    const trunk = MeshBuilder.CreateCylinder("trunk", { height: 1.5, diameter: 0.3 }, scene);
    trunk.position = new Vector3(x, 0.75, z);
    trunk.material = treeTrunkMat;
    trunk.checkCollisions = true;
    if (shadowGenerator) {
      trunk.receiveShadows = true;
      shadowGenerator.addShadowCaster(trunk);
    }

    const leaves = MeshBuilder.CreateSphere("leaves", { diameter: 1.8 }, scene);
    leaves.position = new Vector3(x, 2, z);
    leaves.material = treeLeafMat;
    leaves.checkCollisions = true;
    if (shadowGenerator) {
      leaves.receiveShadows = true;
      shadowGenerator.addShadowCaster(leaves);
    }
    // 환경 애니메이션에 추가 (나중에 초기화될 예정이므로 참조만 저장)
    if ((window as any).environmentAnimation) {
      (window as any).environmentAnimation.addLeavesAnimation(leaves);
    }
    leaves.metadata = { originalY: 2 }; // 원래 Y 위치 저장
  };

  const createRock = (x: number, z: number, scale: number = 1) => {
    const rock = MeshBuilder.CreatePolyhedron("rock", { type: 1, size: 0.5 * scale }, scene);
    rock.position = new Vector3(x, 0.25 * scale, z);
    rock.material = rockMat;
    rock.rotation = new Vector3(Math.random(), Math.random(), Math.random());
    rock.checkCollisions = true;
    rock.isPickable = true;
    rock.receiveShadows = true;
    shadowGenerator.addShadowCaster(rock);
    
    // 바위 충돌용 ellipsoid 설정 (충돌 감지 개선)
    rock.ellipsoid = new Vector3(0.3 * scale, 0.3 * scale, 0.3 * scale);
    rock.ellipsoidOffset = new Vector3(0, 0.3 * scale, 0);
  };

  const createFlower = (x: number, z: number, color: Color3 = new Color3(1, 0.5, 0.8)) => {
    // 꽃잎 (4개)
    const petal1 = MeshBuilder.CreateSphere("petal1", { diameter: 0.2 }, scene);
    petal1.position = new Vector3(x + 0.05, 0.15, z);
    const petalMat1 = flowerMat.clone(`petalMat1_${x}_${z}`);
    petalMat1.diffuseColor = color;
    petal1.material = petalMat1;
    petal1.checkCollisions = true;
    petal1.isPickable = true;

    const petal2 = MeshBuilder.CreateSphere("petal2", { diameter: 0.2 }, scene);
    petal2.position = new Vector3(x - 0.05, 0.15, z);
    petal2.material = petalMat1;
    petal2.checkCollisions = true;
    petal2.isPickable = true;

    const petal3 = MeshBuilder.CreateSphere("petal3", { diameter: 0.2 }, scene);
    petal3.position = new Vector3(x, 0.15, z + 0.05);
    petal3.material = petalMat1;
    petal3.checkCollisions = true;
    petal3.isPickable = true;

    const petal4 = MeshBuilder.CreateSphere("petal4", { diameter: 0.2 }, scene);
    petal4.position = new Vector3(x, 0.15, z - 0.05);
    petal4.material = petalMat1;
    petal4.checkCollisions = true;
    petal4.isPickable = true;

    // 꽃 중앙 (노란색)
    const center = MeshBuilder.CreateSphere("flowerCenter", { diameter: 0.1 }, scene);
    center.position = new Vector3(x, 0.15, z);
    const centerMat = new StandardMaterial(`flowerCenterMat_${x}_${z}`, scene);
    centerMat.diffuseColor = new Color3(1, 1, 0); // 노란색
    center.material = centerMat;
    center.checkCollisions = true;
    center.isPickable = true;

    // 꽃 줄기
    const stem = MeshBuilder.CreateCylinder("stem", { height: 0.2, diameter: 0.02 }, scene);
    stem.position = new Vector3(x, 0.1, z);
    const stemMat = new StandardMaterial(`stemMat_${x}_${z}`, scene);
    stemMat.diffuseColor = new Color3(0.2, 0.6, 0.2); // 녹색
    stem.material = stemMat;
  };

  const createGrass = (x: number, z: number) => {
    // 작은 잔디 (원통 3개)
    const grass1 = MeshBuilder.CreateCylinder("grass1", { height: 0.15, diameter: 0.05 }, scene);
    grass1.position = new Vector3(x + Math.random() * 0.3 - 0.15, 0.075, z + Math.random() * 0.3 - 0.15);
    grass1.rotation.z = (Math.random() - 0.5) * 0.3;
    const grassMat1 = grassMat.clone(`grassMat_${x}_${z}`);
    grass1.material = grassMat1;

    const grass2 = MeshBuilder.CreateCylinder("grass2", { height: 0.12, diameter: 0.04 }, scene);
    grass2.position = new Vector3(x + Math.random() * 0.3 - 0.15, 0.06, z + Math.random() * 0.3 - 0.15);
    grass2.rotation.z = (Math.random() - 0.5) * 0.3;
    grass2.material = grassMat1;

    const grass3 = MeshBuilder.CreateCylinder("grass3", { height: 0.1, diameter: 0.03 }, scene);
    grass3.position = new Vector3(x + Math.random() * 0.3 - 0.15, 0.05, z + Math.random() * 0.3 - 0.15);
    grass3.rotation.z = (Math.random() - 0.5) * 0.3;
    grass3.material = grassMat1;
  };

  // 새로운 오브젝트 타입: 버섯
  const mushroomMat = new StandardMaterial("mushroomMat", scene);
  mushroomMat.diffuseColor = new Color3(0.8, 0.2, 0.2); // 빨간색 버섯
  const mushroomStemMat = new StandardMaterial("mushroomStemMat", scene);
  mushroomStemMat.diffuseColor = new Color3(0.9, 0.9, 0.8); // 흰색 줄기

  const createMushroom = (x: number, z: number) => {
    // 버섯 갓
    const cap = MeshBuilder.CreateSphere("mushroomCap", { diameter: 0.3 }, scene);
    cap.position = new Vector3(x, 0.25, z);
    cap.scaling = new Vector3(1, 0.4, 1);
    const capMat = mushroomMat.clone(`mushroomCapMat_${x}_${z}`);
    cap.material = capMat;
    cap.checkCollisions = true;
    cap.isPickable = true;

    // 버섯 줄기
    const stem = MeshBuilder.CreateCylinder("mushroomStem", { height: 0.2, diameter: 0.08 }, scene);
    stem.position = new Vector3(x, 0.1, z);
    const stemMat = mushroomStemMat.clone(`mushroomStemMat_${x}_${z}`);
    stem.material = stemMat;

    // 버섯 점 (흰색)
    for (let i = 0; i < 5; i++) {
      const dot = MeshBuilder.CreateSphere("mushroomDot", { diameter: 0.05 }, scene);
      dot.position = new Vector3(
        x + (Math.random() - 0.5) * 0.25,
        0.25 + Math.random() * 0.1,
        z + (Math.random() - 0.5) * 0.25
      );
      const dotMat = new StandardMaterial(`mushroomDotMat_${x}_${z}_${i}`, scene);
      dotMat.diffuseColor = new Color3(1, 1, 1);
      dot.material = dotMat;
    }
  };

  // 새로운 오브젝트 타입: 나무 그루터기
  const stumpMat = new StandardMaterial("stumpMat", scene);
  stumpMat.diffuseColor = new Color3(0.3, 0.15, 0.1); // 어두운 갈색

  const createStump = (x: number, z: number) => {
    const stump = MeshBuilder.CreateCylinder("stump", { height: 0.3, diameter: 0.4 }, scene);
    stump.position = new Vector3(x, 0.15, z);
    stump.material = stumpMat;
    stump.checkCollisions = true;
    stump.isPickable = true;
    
    // 나이테 (원형 평면)
    const rings = MeshBuilder.CreateDisc("stumpRings", { radius: 0.2, tessellation: 32 }, scene);
    rings.position = new Vector3(x, 0.31, z);
    rings.rotation.x = Math.PI / 2;
    const ringsMat = new StandardMaterial(`stumpRingsMat_${x}_${z}`, scene);
    ringsMat.diffuseColor = new Color3(0.2, 0.1, 0.05);
    rings.material = ringsMat;
  };

  // 새로운 오브젝트 타입: 돌무더기
  const createRockPile = (x: number, z: number) => {
    // 여러 개의 작은 돌들을 모아서 돌무더기 만들기
    for (let i = 0; i < 4; i++) {
      const smallRock = MeshBuilder.CreatePolyhedron("rockPile", { type: 1, size: 0.2 }, scene);
      smallRock.position = new Vector3(
        x + (Math.random() - 0.5) * 0.4,
        0.1 + Math.random() * 0.1,
        z + (Math.random() - 0.5) * 0.4
      );
      smallRock.rotation = new Vector3(Math.random(), Math.random(), Math.random());
      smallRock.material = rockMat;
      smallRock.checkCollisions = true;
    }
  };

  // 새로운 오브젝트 타입: 베리 덤불
  const berryBushMat = new StandardMaterial("berryBushMat", scene);
  berryBushMat.diffuseColor = new Color3(0.2, 0.5, 0.2); // 녹색 덤불
  const berryMat = new StandardMaterial("berryMat", scene);
  berryMat.diffuseColor = new Color3(0.8, 0.2, 0.2); // 빨간 베리

  const createBerryBush = (x: number, z: number) => {
    // 덤불 본체 (구체)
    const bush = MeshBuilder.CreateSphere("berryBush", { diameter: 0.6 }, scene);
    bush.position = new Vector3(x, 0.3, z);
    bush.scaling = new Vector3(1, 0.6, 1);
    bush.material = berryBushMat;
    bush.checkCollisions = true;
    bush.isPickable = true;

    // 베리 열매들 (작은 구체들)
    for (let i = 0; i < 6; i++) {
      const berry = MeshBuilder.CreateSphere("berry", { diameter: 0.08 }, scene);
      berry.position = new Vector3(
        x + (Math.random() - 0.5) * 0.4,
        0.3 + Math.random() * 0.3,
        z + (Math.random() - 0.5) * 0.4
      );
      berry.material = berryMat;
      berry.parent = bush;
    }
  };

  // 새로운 오브젝트 타입: 허브
  const herbMat = new StandardMaterial("herbMat", scene);
  herbMat.diffuseColor = new Color3(0.3, 0.7, 0.3); // 밝은 녹색

  const createHerb = (x: number, z: number) => {
    // 허브 잎사귀들 (작은 원통들)
    for (let i = 0; i < 5; i++) {
      const leaf = MeshBuilder.CreateCylinder("herb", { height: 0.15, diameter: 0.05 }, scene);
      leaf.position = new Vector3(
        x + (Math.random() - 0.5) * 0.2,
        0.075 + Math.random() * 0.05,
        z + (Math.random() - 0.5) * 0.2
      );
      leaf.rotation.z = (Math.random() - 0.5) * 0.5;
      leaf.material = herbMat;
      leaf.checkCollisions = true;
      leaf.isPickable = true;
    }
  };

  // 새로운 오브젝트 타입: 열매 나무
  const fruitTreeTrunkMat = new StandardMaterial("fruitTreeTrunkMat", scene);
  fruitTreeTrunkMat.diffuseColor = new Color3(0.4, 0.2, 0.1);
  const fruitTreeLeafMat = new StandardMaterial("fruitTreeLeafMat", scene);
  fruitTreeLeafMat.diffuseColor = new Color3(0.2, 0.6, 0.2);
  const fruitMat = new StandardMaterial("fruitMat", scene);
  fruitMat.diffuseColor = new Color3(1, 0.5, 0); // 주황색 열매

  const createFruitTree = (x: number, z: number) => {
    // 나무 줄기
    const trunk = MeshBuilder.CreateCylinder("fruitTree", { height: 1.2, diameter: 0.25 }, scene);
    trunk.position = new Vector3(x, 0.6, z);
    trunk.material = fruitTreeTrunkMat;
    trunk.checkCollisions = true;

    // 나뭇잎
    const leaves = MeshBuilder.CreateSphere("fruitTreeLeaves", { diameter: 1.5 }, scene);
    leaves.position = new Vector3(x, 1.8, z);
    leaves.material = fruitTreeLeafMat;
    leaves.checkCollisions = true;
    leaves.isPickable = true;

    // 열매들 (작은 구체들)
    for (let i = 0; i < 4; i++) {
      const fruit = MeshBuilder.CreateSphere("fruit", { diameter: 0.12 }, scene);
      fruit.position = new Vector3(
        x + (Math.random() - 0.5) * 0.6,
        1.6 + Math.random() * 0.4,
        z + (Math.random() - 0.5) * 0.6
      );
      fruit.material = fruitMat;
      fruit.parent = leaves;
    }
  };

  // 새로운 오브젝트 타입: 조개
  const shellMat = new StandardMaterial("shellMat", scene);
  shellMat.diffuseColor = new Color3(0.9, 0.9, 0.8); // 흰색/베이지색

  const createShell = (x: number, z: number) => {
    // 조개 (구체를 눌러서 만든 형태)
    const shell = MeshBuilder.CreateSphere("shell", { diameter: 0.15 }, scene);
    shell.position = new Vector3(x, 0.075, z);
    shell.scaling = new Vector3(1, 0.4, 1);
    shell.rotation.z = Math.random() * Math.PI * 2;
    shell.material = shellMat;
    shell.checkCollisions = true;
    shell.isPickable = true;
  };

  // 나무 생성 (맵 곳곳에 배치)
  createTree(5, 5)
  createTree(-8, 12)
  createTree(15, -10)
  createTree(-12, -5)
  createTree(0, 18)
  createTree(20, 8)
  createTree(-18, -8)
  createTree(8, -15)
  createTree(-10, 20)
  createTree(22, -5)
  createTree(-20, 5)
  createTree(12, 18)
  createTree(-15, -18)
  createTree(18, 15)

  // 바위 생성 (맵 곳곳에 배치)
  createRock(3, -2, 1.2);
  createRock(-5, 0, 0.8);
  createRock(10, 8, 1.5);
  createRock(-15, -15, 2);
  createRock(7, 3, 1.0);
  createRock(-12, 8, 1.3);
  createRock(18, -12, 0.9);
  createRock(-18, 15, 1.4);
  createRock(14, 12, 1.1);
  createRock(-8, -10, 0.7);
  createRock(22, 0, 1.6);
  createRock(-22, -5, 1.2);
  // 확장된 영역에 추가 바위
  createRock(32, -8, 1.3);
  createRock(-28, 12, 1.1);
  createRock(38, 18, 1.4);
  createRock(-35, -22, 1.5);
  createRock(25, -25, 0.9);
  createRock(-30, 28, 1.2);
  createRock(42, -5, 1.6);
  createRock(-42, 8, 1.0);
  createRock(18, 32, 1.3);
  createRock(-20, -32, 1.4);
  createRock(30, 25, 1.1);
  createRock(-25, -28, 1.2);

  // 꽃 생성 (맵 곳곳에 배치, 다양한 색상)
  createFlower(2, 8, new Color3(1, 0.5, 0.8)); // 분홍
  createFlower(-6, 4, new Color3(1, 0.8, 0.2)); // 노랑
  createFlower(12, -3, new Color3(0.8, 0.2, 0.8)); // 보라
  createFlower(-10, 14, new Color3(1, 0.2, 0.2)); // 빨강
  createFlower(18, 6, new Color3(1, 0.5, 0.8)); // 분홍
  createFlower(-14, -8, new Color3(0.2, 0.8, 1)); // 파랑
  createFlower(9, 15, new Color3(1, 0.8, 0.2)); // 노랑
  createFlower(-20, 2, new Color3(1, 0.5, 0.8)); // 분홍
  createFlower(15, -8, new Color3(0.8, 0.2, 0.8)); // 보라
  createFlower(-5, -12, new Color3(1, 0.2, 0.2)); // 빨강
  createFlower(4, 20, new Color3(1, 0.5, 0.8)); // 분홍
  createFlower(-18, -15, new Color3(0.2, 0.8, 1)); // 파랑
  // 확장된 영역에 추가 꽃
  createFlower(28, 12, new Color3(1, 0.5, 0.8)); // 분홍
  createFlower(-32, -18, new Color3(1, 0.8, 0.2)); // 노랑
  createFlower(35, -10, new Color3(0.8, 0.2, 0.8)); // 보라
  createFlower(-25, 22, new Color3(1, 0.2, 0.2)); // 빨강
  createFlower(22, 28, new Color3(1, 0.5, 0.8)); // 분홍
  createFlower(-38, 5, new Color3(0.2, 0.8, 1)); // 파랑
  createFlower(40, 15, new Color3(1, 0.8, 0.2)); // 노랑
  createFlower(-15, -30, new Color3(1, 0.5, 0.8)); // 분홍
  createFlower(30, -22, new Color3(0.8, 0.2, 0.8)); // 보라
  createFlower(-28, 35, new Color3(1, 0.2, 0.2)); // 빨강

  // 잔디 생성 (맵 곳곳에 배치)
  createGrass(1, 2);
  createGrass(-4, 6);
  createGrass(11, -1);
  createGrass(-11, 11);
  createGrass(16, 4);
  createGrass(-16, -4);
  createGrass(6, 16);
  createGrass(-9, -14);
  createGrass(19, -9);
  createGrass(-21, 7);
  createGrass(13, 11);
  createGrass(-7, -6);
  createGrass(3, -11);
  createGrass(-13, 18);
  createGrass(21, 2);
  // 확장된 영역에 추가 잔디
  createGrass(26, 8);
  createGrass(-29, -12);
  createGrass(33, 20);
  createGrass(-36, 15);
  createGrass(24, -18);
  createGrass(-22, 28);
  createGrass(38, -8);
  createGrass(-40, 3);
  createGrass(17, 32);
  createGrass(-18, -28);
  createGrass(31, 24);
  createGrass(-27, -24);
  createGrass(42, 12);
  createGrass(-33, -20);
  createGrass(20, -32);
  createGrass(-12, 38);

  // 버섯 생성
  createMushroom(6, 10);
  createMushroom(-8, 16);
  createMushroom(14, -6);
  createMushroom(-16, -12);
  createMushroom(24, 14);
  createMushroom(-26, 8);
  createMushroom(32, -14);
  createMushroom(-34, 20);
  createMushroom(19, 26);
  createMushroom(-21, -24);
  createMushroom(36, 4);
  createMushroom(-38, -16);
  createMushroom(12, -28);
  createMushroom(-14, 32);
  createMushroom(28, -30);
  createMushroom(-30, -28);

  // 나무 그루터기 생성
  createStump(-3, 7);
  createStump(9, -4);
  createStump(-13, 19);
  createStump(17, 11);
  createStump(-23, -7);
  createStump(27, 21);
  createStump(-31, 13);
  createStump(35, -19);
  createStump(11, 29);
  createStump(-19, -29);
  createStump(39, 7);
  createStump(-37, -21);

  // 돌무더기 생성
  createRockPile(4, -7);
  createRockPile(-11, 3);
  createRockPile(16, 9);
  createRockPile(-19, -11);
  createRockPile(23, -13);
  createRockPile(-27, 17);
  createRockPile(31, 19);
  createRockPile(-39, 1);
  createRockPile(13, -26);
  createRockPile(-17, 36);
  createRockPile(37, -23);
  createRockPile(-29, -31);

  // 베리 덤불 생성
  createBerryBush(7, 12);
  createBerryBush(-9, 18);
  createBerryBush(16, -7);
  createBerryBush(-14, -9);
  createBerryBush(23, 16);
  createBerryBush(-27, 11);
  createBerryBush(31, -11);
  createBerryBush(-33, 19);
  createBerryBush(19, 28);
  createBerryBush(-21, -26);
  createBerryBush(37, 6);
  createBerryBush(-39, -14);
  createBerryBush(13, -24);
  createBerryBush(-11, 34);
  createBerryBush(26, -27);
  createBerryBush(-24, -30);

  // 허브 생성
  createHerb(3, 11);
  createHerb(-7, 5);
  createHerb(13, -2);
  createHerb(-15, 13);
  createHerb(21, 9);
  createHerb(-19, -6);
  createHerb(9, 19);
  createHerb(-25, 3);
  createHerb(29, -16);
  createHerb(-31, 16);
  createHerb(15, 23);
  createHerb(-17, -22);
  createHerb(34, 8);
  createHerb(-36, -18);
  createHerb(11, -29);
  createHerb(-13, 31);

  // 열매 나무 생성
  createFruitTree(6, 14);
  createFruitTree(-10, 20);
  createFruitTree(18, -8);
  createFruitTree(-16, -12);
  createFruitTree(24, 12);
  createFruitTree(-28, 6);
  createFruitTree(32, -18);
  createFruitTree(-34, 22);
  createFruitTree(20, 30);
  createFruitTree(-22, -28);
  createFruitTree(38, 2);
  createFruitTree(-40, -20);

  // 조개 생성
  createShell(5, -5);
  createShell(-8, 9);
  createShell(14, 7);
  createShell(-17, -13);
  createShell(25, -9);
  createShell(-26, 15);
  createShell(33, 13);
  createShell(-35, -7);
  createShell(17, 25);
  createShell(-19, -25);
  createShell(39, -3);
  createShell(-37, 11);
  createShell(10, -31);
  createShell(-12, 29);
  createShell(27, -22);
  createShell(-23, -33);

  // 환경 애니메이션 시스템 초기화 (전역 참조로 나중에 생성되는 나무에도 추가 가능하도록)
  const environmentAnimation = new EnvironmentAnimation(scene)
  ;(window as any).environmentAnimation = environmentAnimation
  
  // 파티클 효과 시스템 초기화
  const particleEffects = new ParticleEffects(scene)
  ;(window as any).particleEffects = particleEffects
  
  // 하이라이트 관리자 초기화
  const highlightManager = new HighlightManager(scene)
  ;(window as any).highlightManager = highlightManager
  
  // 플레이어 위치 전역 참조 (파티클 효과용)
  ;(window as any).playerPosition = { x: 0, y: 2, z: 0 }
  ;(window as any).BABYLON = { Vector3 }
  
  // 이미 생성된 나뭇잎들을 환경 애니메이션에 추가
  scene.meshes.forEach(mesh => {
    if ((mesh.name === 'leaves' || mesh.name === 'fruitTreeLeaves') && mesh.metadata?.originalY) {
      environmentAnimation.addLeavesAnimation(mesh as Mesh)
    } else if (mesh.name === 'leaves' || mesh.name === 'fruitTreeLeaves') {
      // originalY가 없으면 저장하고 추가
      if (!mesh.metadata) mesh.metadata = {}
      mesh.metadata.originalY = mesh.position.y
      environmentAnimation.addLeavesAnimation(mesh as Mesh)
    }
  })

  // 기존 로딩 요소 제거 (LoadingScreen이 처리)
  const loadingElement = document.getElementById('loading')
  if (loadingElement) {
    loadingElement.remove()
  }
  
  // 로딩 진행률 업데이트 (환경 설정 완료)
  if (loadingScreen) {
    loadingScreen.setProgress(95, '환경 설정 완료')
  }

  // 펫 시스템 초기화 (saveData 로드 이후에 설정)

  // 숨겨진 컨텐츠 시스템 연결
  hiddenContentSystem.setTimeSystem(timeSystem);
  hiddenContentSystem.setInventoryManager(inventoryManager);
  
  // 펫 시스템 업데이트를 위한 deltaTime 계산
  let lastFrameTime = Date.now()

  engine.runRenderLoop(() => {
    const currentTime = Date.now()
    const deltaTime = (currentTime - lastFrameTime) / 1000 // 초 단위
    lastFrameTime = currentTime

    // 시간 시스템 업데이트
    timeSystem.update()
    
    // 날씨 시스템 업데이트
    weatherSystem.update()
    
    // 상점 재고 갱신 체크
    shopSystem.updateStock()
    
    // 농사 시스템 업데이트
    if (playerController['farmingSystem']) {
      playerController['farmingSystem'].update()
    }
    
    // 펫 시스템 업데이트
    if (petSystem && colliderMesh) {
      petSystem.update(deltaTime, colliderMesh.position)
    }
    
    // NPC 시스템 업데이트 (이동, 취미 활동, 대화)
    const npcSystem = playerController['npcSystem']
    if (npcSystem && typeof npcSystem.update === 'function') {
      npcSystem.update(deltaTime)
      if (typeof npcSystem.updateNPCMovements === 'function') {
        npcSystem.updateNPCMovements(deltaTime)
      }
    }
    
    // 미니맵 업데이트
    if (miniMap && colliderMesh) {
      miniMap.setPlayerPosition(colliderMesh.position)
    }
    
    // 플레이어 위치 전역 업데이트 (파티클 효과용)
    if (colliderMesh) {
      ;(window as any).playerPosition = {
        x: colliderMesh.position.x,
        y: colliderMesh.position.y,
        z: colliderMesh.position.z
      }
    }
    
    // 이벤트 시스템 업데이트
    eventSystem.update()
    
    // 성취 시스템 업데이트
    achievementSystem.update()
    
    // 숨겨진 컨텐츠 시스템 업데이트
    hiddenContentSystem.update()
    
    // 환경 애니메이션 업데이트
    environmentAnimation.update(deltaTime)
    
    scene.render()
  })

  window.addEventListener('resize', () => {
    engine.resize()
  })

  console.log('게임이 시작되었습니다!')
  
  // 전역 객체에 등록 (UI 접근용)
  ;(window as any).achievementSystem = achievementSystem
  ;(window as any).statisticsManager = statisticsManager
  
  // 로딩 화면 숨기기
  if (loadingScreen) {
    loadingScreen.setProgress(100)
    loadingScreen.setAssetStatus('게임 시작', 'loaded')
    setTimeout(() => {
      loadingScreen.hide()
    }, 500) // 0.5초 후 숨기기
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame)
} else {
  initGame()
}
