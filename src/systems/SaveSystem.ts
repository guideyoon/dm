import { InventoryManager } from '../InventoryManager'
import { TimeSystem, GameTime } from './TimeSystem'
import { supabase, isSupabaseEnabled } from '../config/supabase'

export interface SaveData {
  version: string
  timestamp: number
  player: {
    position: { x: number; y: number; z: number }
    coins: number
    tokens: number
  }
  inventory: Array<{ name: string; count: number }>
  gameTime: GameTime
  progress: {
    codexEntries: string[] // 발견한 도감 항목 ID
    museumDonations: string[] // 기증한 아이템 ID
    completedMissions: string[] // 완료한 미션 ID
    buildingPlaced: Array<{ id: string; type: string; position: { x: number; y: number; z: number }; rotation: number }>
    furniturePlaced?: Array<{ id: string; type: string; position: { x: number; y: number; z: number }; rotation: number; theme: string; themeScore: number }> // 가구 배치 데이터
    farmPlots?: Array<{ id: string; position: { x: number; y: number; z: number }; crop: { id: string; type: string; stage: string; plantedDate: number; watered: boolean; growthProgress: number; position: { x: number; y: number; z: number } } | null }> // 농장 밭 데이터
    customization?: { equippedOutfit: { top?: string; bottom?: string; dress?: string; shoes?: string; hat?: string; hair?: string } } // 캐릭터 커스터마이징 데이터
    pets?: any[] // 펫 데이터
    petHouses?: any[] // 펫집 데이터
    tutorialProgress?: {
      completedSteps: string[]
      currentStep: string | null
      skipped: boolean
    } // 튜토리얼 진행 상황
  }
  settings: {
    timeScale: number
    soundVolume: number
    musicVolume: number
  }
}

export class SaveSystem {
  private saveKey: string = 'animal_life_game_save'
  private currentVersion: string = '1.0.0'
  private useSupabase: boolean = false
  
  constructor() {
    // 버전 업그레이드 체크
    this.checkVersionUpgrade()
    // Supabase 사용 가능 여부 확인
    this.useSupabase = isSupabaseEnabled()
  }
  
  public save(
    inventoryManager: InventoryManager,
    timeSystem: TimeSystem,
    playerPosition: { x: number; y: number; z: number },
    coins: number = 0,
    tokens: number = 0,
    codexSystem?: any,
    museumSystem?: any,
    missionSystem?: any,
    buildingSystem?: any,
    petSystem?: any,
    tutorialSystem?: any,
    decorationSystem?: any,
    farmingSystem?: any,
    customizationSystem?: any
  ): boolean {
    try {
      // 도감 시스템 데이터 수집
      let codexEntries: string[] = []
      if (codexSystem && typeof codexSystem.getDiscoveredEntries === 'function') {
        const discovered = codexSystem.getDiscoveredEntries()
        codexEntries = discovered.map((entry: any) => entry.id)
      }
      
      // 박물관 시스템 데이터 수집
      let museumDonations: string[] = []
      if (museumSystem && typeof museumSystem.getDonatedExhibits === 'function') {
        const donated = museumSystem.getDonatedExhibits()
        museumDonations = donated.map((exhibit: any) => exhibit.id)
      }
      
      // 미션 시스템 데이터 수집
      let completedMissions: string[] = []
      if (missionSystem && typeof missionSystem.getMissions === 'function') {
        const missions = missionSystem.getMissions()
        completedMissions = missions
          .filter((mission: any) => mission.status === 'completed' || mission.status === 'claimed')
          .map((mission: any) => mission.id)
      }
      
      // 건물 시스템 데이터 수집
      let buildingPlaced: Array<{ id: string; type: string; position: { x: number; y: number; z: number }; rotation: number }> = []
      if (buildingSystem && typeof buildingSystem.getBuildings === 'function') {
        const buildings = buildingSystem.getBuildings()
        buildingPlaced = buildings.map((building: any) => ({
          id: building.id,
          type: building.type,
          position: building.position,
          rotation: building.rotation || 0
        }))
      }
      
      // 튜토리얼 시스템 데이터 수집
      let tutorialProgress: any = null
      if (tutorialSystem && typeof tutorialSystem.getTutorialProgress === 'function') {
        tutorialProgress = tutorialSystem.getTutorialProgress()
      }
      
      // 가구 시스템 데이터 수집
      let furniturePlaced: Array<{ id: string; type: string; position: { x: number; y: number; z: number }; rotation: number; theme: string; themeScore: number }> = []
      if (decorationSystem && typeof decorationSystem.getFurniture === 'function') {
        const furniture = decorationSystem.getFurniture()
        furniturePlaced = furniture.map((f: any) => ({
          id: f.id,
          type: f.type,
          position: f.position,
          rotation: f.rotation || 0,
          theme: f.theme,
          themeScore: f.themeScore
        }))
      }
      
      // 농장 시스템 데이터 수집
      let farmPlots: Array<{ id: string; position: { x: number; y: number; z: number }; crop: any | null }> = []
      if (farmingSystem && typeof farmingSystem.getFarmPlots === 'function') {
        const plots = farmingSystem.getFarmPlots()
        farmPlots = plots.map((plot: any) => ({
          id: plot.id,
          position: plot.position,
          crop: plot.crop ? {
            id: plot.crop.id,
            type: plot.crop.type,
            stage: plot.crop.stage,
            plantedDate: plot.crop.plantedDate,
            watered: plot.crop.watered,
            growthProgress: plot.crop.growthProgress,
            position: plot.crop.position
          } : null
        }))
      }
      
      // 캐릭터 커스터마이징 시스템 데이터 수집
      let customization: any = null
      if (customizationSystem && typeof customizationSystem.getEquippedOutfit === 'function') {
        const outfit = customizationSystem.getEquippedOutfit()
        customization = {
          equippedOutfit: {
            top: outfit.top,
            bottom: outfit.bottom,
            dress: outfit.dress,
            shoes: outfit.shoes,
            hat: outfit.hat,
            hair: outfit.hair
          }
        }
      }
      
      // 펫 시스템 데이터 수집
      let pets: any[] = []
      let petHouses: any[] = []
      if (petSystem) {
        if (typeof petSystem.getAllPets === 'function') {
          pets = petSystem.getAllPets().map((pet: any) => ({
            id: pet.id,
            name: pet.name,
            type: pet.type,
            category: pet.category,
            personality: pet.personality,
            level: pet.level,
            experience: pet.experience,
            health: pet.health,
            happiness: pet.happiness,
            intimacy: pet.intimacy,
            hunger: pet.hunger,
            energy: pet.energy,
            abilities: pet.abilities,
            stats: pet.stats,
            appearance: {
              color: pet.appearance?.color ? {
                r: pet.appearance.color.r,
                g: pet.appearance.color.g,
                b: pet.appearance.color.b
              } : undefined,
              size: pet.appearance?.size,
              accessories: pet.appearance?.accessories || []
            },
            obtainedDate: pet.obtainedDate,
            lastInteractionDate: pet.lastInteractionDate,
            favoriteFood: pet.favoriteFood,
            favoriteToy: pet.favoriteToy,
            position: pet.position ? { x: pet.position.x, y: pet.position.y, z: pet.position.z } : undefined,
            isFollowing: pet.isFollowing,
            isAtHome: pet.isAtHome
          }))
        }
        if (typeof petSystem.getAllPetHouses === 'function') {
          petHouses = petSystem.getAllPetHouses().map((house: any) => ({
            id: house.id,
            capacity: house.capacity,
            level: house.level,
            position: house.position ? { x: house.position.x, y: house.position.y, z: house.position.z } : undefined,
            decorations: house.decorations || []
          }))
        }
      }
      
      const saveData: SaveData = {
        version: this.currentVersion,
        timestamp: Date.now(),
        player: {
          position: playerPosition,
          coins: coins,
          tokens: tokens
        },
        inventory: inventoryManager.list(),
        gameTime: timeSystem.getTime(),
        progress: {
          codexEntries: codexEntries,
          museumDonations: museumDonations,
          completedMissions: completedMissions,
          buildingPlaced: buildingPlaced,
          furniturePlaced: furniturePlaced,
          farmPlots: farmPlots,
          customization: customization,
          pets: pets,
          petHouses: petHouses,
          tutorialProgress: tutorialProgress
        },
        settings: {
          timeScale: 60, // 기본값
          soundVolume: 1.0,
          musicVolume: 0.7
        }
      }
      
      const jsonString = JSON.stringify(saveData)
      
      // localStorage에 저장 (항상 - 오프라인 백업용)
      try {
        localStorage.setItem(this.saveKey, jsonString)
      } catch (error: any) {
        // 저장 공간 부족 등 에러 처리
        if ((window as any).errorHandler) {
          ;(window as any).errorHandler.handleSaveError(error, async () => {
            // 재시도: 저장 공간 정리 후 다시 시도
            try {
              const keys = Object.keys(localStorage)
              for (let i = 0; i < Math.min(5, keys.length); i++) {
                if (keys[i] !== this.saveKey) {
                  localStorage.removeItem(keys[i])
                }
              }
              localStorage.setItem(this.saveKey, jsonString)
            } catch (retryError) {
              throw retryError
            }
          })
        }
        throw error
      }
      
      // Supabase에 저장 (사용 가능한 경우)
      if (this.useSupabase && supabase) {
        this.saveToSupabase(saveData).catch((error) => {
          console.warn('Supabase 저장 실패 (localStorage는 저장됨):', error)
        })
      }
      
      console.log('게임 저장 완료:', saveData)
      return true
    } catch (error) {
      console.error('게임 저장 실패:', error)
      return false
    }
  }
  
  public async load(): Promise<SaveData | null> {
    try {
      // Supabase에서 먼저 시도 (로그인된 경우)
      if (this.useSupabase && supabase) {
        const supabaseData = await this.loadFromSupabase()
        if (supabaseData) {
          // localStorage에도 동기화
          localStorage.setItem(this.saveKey, JSON.stringify(supabaseData))
          return supabaseData
        }
      }
      
      // localStorage에서 로드
      const jsonString = localStorage.getItem(this.saveKey)
      if (!jsonString) {
        return null
      }
      
      const saveData: SaveData = JSON.parse(jsonString)
      
      // 버전 호환성 체크 및 마이그레이션
      if (this.needsMigration(saveData.version)) {
        console.log('저장 데이터 버전 마이그레이션 중:', saveData.version, '->', this.currentVersion)
        const migratedData = this.migrateSaveData(saveData)
        if (migratedData) {
          // 마이그레이션된 데이터를 저장
          const jsonString = JSON.stringify(migratedData)
          localStorage.setItem(this.saveKey, jsonString)
          
          // Supabase에도 저장 (사용 가능한 경우)
          if (this.useSupabase && supabase) {
            this.saveToSupabase(migratedData).catch((error) => {
              console.warn('Supabase 마이그레이션 저장 실패:', error)
            })
          }
          
          console.log('저장 데이터 마이그레이션 완료:', migratedData.version)
          return migratedData
        } else {
          console.warn('마이그레이션 실패. 기존 데이터를 반환합니다.')
        }
      }
      
      return saveData
    } catch (error) {
      console.error('게임 로드 실패:', error)
      return null
    }
  }
  
  public hasSave(): boolean {
    return localStorage.getItem(this.saveKey) !== null
  }
  
  public deleteSave(): boolean {
    try {
      localStorage.removeItem(this.saveKey)
      return true
    } catch (error) {
      console.error('저장 데이터 삭제 실패:', error)
      return false
    }
  }
  
  public exportSave(): string | null {
    try {
      const jsonString = localStorage.getItem(this.saveKey)
      if (!jsonString) {
        return null
      }
      
      // Base64 인코딩하여 내보내기
      return btoa(jsonString)
    } catch (error) {
      console.error('저장 데이터 내보내기 실패:', error)
      return null
    }
  }
  
  public importSave(encodedData: string): boolean {
    try {
      // Base64 디코딩
      const jsonString = atob(encodedData)
      const saveData: SaveData = JSON.parse(jsonString)
      
      // 유효성 검사
      if (!this.validateSaveData(saveData)) {
        throw new Error('저장 데이터 형식이 올바르지 않습니다.')
      }
      
      // 저장
      localStorage.setItem(this.saveKey, jsonString)
      return true
    } catch (error) {
      console.error('저장 데이터 가져오기 실패:', error)
      return false
    }
  }
  
  private validateSaveData(data: any): data is SaveData {
    return (
      data &&
      typeof data.version === 'string' &&
      typeof data.timestamp === 'number' &&
      data.player &&
      typeof data.player.position === 'object' &&
      Array.isArray(data.inventory) &&
      data.gameTime &&
      data.progress
    )
  }
  
  private needsMigration(version: string): boolean {
    // 간단한 버전 비교 (실제로는 semver 라이브러리 사용 권장)
    return version !== this.currentVersion
  }
  
  private async checkVersionUpgrade() {
    const saveData = await this.load()
    if (saveData && this.needsMigration(saveData.version)) {
      console.log('저장 데이터 버전 업그레이드 필요:', saveData.version, '->', this.currentVersion)
      // 자동 마이그레이션 실행
      const migratedData = this.migrateSaveData(saveData)
      if (migratedData) {
        // 마이그레이션된 데이터를 저장
        const jsonString = JSON.stringify(migratedData)
        localStorage.setItem(this.saveKey, jsonString)
        
        // Supabase에도 저장 (사용 가능한 경우)
        if (this.useSupabase && supabase) {
          this.saveToSupabase(migratedData).catch((error) => {
            console.warn('Supabase 마이그레이션 저장 실패:', error)
          })
        }
        
        console.log('저장 데이터 마이그레이션 완료:', migratedData.version)
      }
    }
  }
  
  // 저장 데이터 마이그레이션
  private migrateSaveData(saveData: SaveData): SaveData | null {
    try {
      let migratedData: SaveData = { ...saveData }
      
      // 버전별 마이그레이션 스텝
      const versionSteps = ['0.1.0', '0.2.0', '0.3.0', '0.9.0', '1.0.0']
      const currentVersionIndex = versionSteps.indexOf(saveData.version)
      const targetVersionIndex = versionSteps.indexOf(this.currentVersion)
      
      if (currentVersionIndex === -1 || targetVersionIndex === -1) {
        console.warn('알 수 없는 버전입니다. 기본 마이그레이션을 시도합니다.')
        return this.migrateToLatest(migratedData)
      }
      
      // 단계별 마이그레이션
      for (let i = currentVersionIndex + 1; i <= targetVersionIndex; i++) {
        const targetVersion = versionSteps[i]
        migratedData = this.migrateToVersion(migratedData, targetVersion)
        if (!migratedData) {
          console.error(`마이그레이션 실패: ${versionSteps[i - 1]} -> ${targetVersion}`)
          return null
        }
      }
      
      return migratedData
    } catch (error) {
      console.error('마이그레이션 중 오류:', error)
      return null
    }
  }
  
  // 특정 버전으로 마이그레이션
  private migrateToVersion(saveData: SaveData, targetVersion: string): SaveData {
    const migrated: SaveData = { ...saveData }
    
    // 기본 마이그레이션: 누락된 필드 추가
    if (!migrated.progress) {
      migrated.progress = {
        codexEntries: [],
        museumDonations: [],
        completedMissions: [],
        buildingPlaced: []
      }
    }
    
    // progress 필드 보완
    if (!migrated.progress.codexEntries) {
      migrated.progress.codexEntries = []
    }
    if (!migrated.progress.museumDonations) {
      migrated.progress.museumDonations = []
    }
    if (!migrated.progress.completedMissions) {
      migrated.progress.completedMissions = []
    }
    if (!migrated.progress.buildingPlaced) {
      migrated.progress.buildingPlaced = []
    }
    if (!migrated.progress.pets) {
      migrated.progress.pets = []
    }
    if (!migrated.progress.petHouses) {
      migrated.progress.petHouses = []
    }
    if (!migrated.progress.furniturePlaced) {
      migrated.progress.furniturePlaced = []
    }
    if (!migrated.progress.farmPlots) {
      migrated.progress.farmPlots = []
    }
    if (!migrated.progress.customization) {
      migrated.progress.customization = undefined
    }
    
    // player 필드 보완
    if (!migrated.player) {
      migrated.player = {
        position: { x: 0, y: 0, z: 0 },
        coins: 0,
        tokens: 0
      }
    } else {
      if (typeof migrated.player.coins !== 'number') {
        migrated.player.coins = 0
      }
      if (typeof migrated.player.tokens !== 'number') {
        migrated.player.tokens = 0
      }
      if (!migrated.player.position) {
        migrated.player.position = { x: 0, y: 0, z: 0 }
      }
    }
    
    // settings 필드 보완
    if (!migrated.settings) {
      migrated.settings = {
        timeScale: 60,
        soundVolume: 1.0,
        musicVolume: 0.7
      }
    } else {
      if (typeof migrated.settings.timeScale !== 'number') {
        migrated.settings.timeScale = 60
      }
      if (typeof migrated.settings.soundVolume !== 'number') {
        migrated.settings.soundVolume = 1.0
      }
      if (typeof migrated.settings.musicVolume !== 'number') {
        migrated.settings.musicVolume = 0.7
      }
    }
    
    // inventory 필드 보완
    if (!Array.isArray(migrated.inventory)) {
      migrated.inventory = []
    }
    
    // gameTime 필드 보완
    if (!migrated.gameTime) {
      migrated.gameTime = {
        hour: 8,
        minute: 0,
        day: 1,
        season: 'spring',
        timeOfDay: 'day'
      }
    }
    
    // 버전 업데이트
    migrated.version = targetVersion
    migrated.timestamp = Date.now()
    
    return migrated
  }
  
  // 최신 버전으로 마이그레이션 (폴백)
  private migrateToLatest(saveData: SaveData): SaveData {
    return this.migrateToVersion(saveData, this.currentVersion)
  }

  public async getSaveInfo(): Promise<{ exists: boolean; timestamp: number | null; version: string | null; source: 'supabase' | 'localStorage' | null }> {
    const saveData = await this.load()
    return {
      exists: saveData !== null,
      timestamp: saveData?.timestamp || null,
      version: saveData?.version || null,
      source: this.useSupabase && supabase ? 'supabase' : 'localStorage'
    }
  }

  // Supabase에 저장
  private async saveToSupabase(saveData: SaveData): Promise<boolean> {
    if (!supabase) return false

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // 로그인되지 않은 경우 저장하지 않음
        return false
      }

      const { error } = await supabase
        .from('game_saves')
        .upsert({
          user_id: user.id,
          save_data: saveData,
          version: this.currentVersion,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        // 네트워크 오류 처리
        if ((window as any).errorHandler) {
          ;(window as any).errorHandler.handleNetworkError(error, async () => {
            // 재시도
            return this.saveToSupabase(saveData)
          })
        }
        throw error
      }

      if (error) {
        console.error('Supabase 저장 오류:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Supabase 저장 실패:', error)
      return false
    }
  }

  // Supabase에서 로드
  private async loadFromSupabase(): Promise<SaveData | null> {
    if (!supabase) return null

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // 로그인되지 않은 경우
        return null
      }

      const { data, error } = await supabase
        .from('game_saves')
        .select('save_data, version')
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        // 저장 데이터가 없는 경우
        return null
      }

      return data.save_data as SaveData
    } catch (error) {
      console.error('Supabase 로드 실패:', error)
      return null
    }
  }
}
