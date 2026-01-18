import { InventoryManager } from '../InventoryManager'
import { TimeSystem } from '../systems/TimeSystem'
import { CodexSystem } from '../systems/CodexSystem'
import { MissionSystem } from '../systems/MissionSystem'
import { AchievementSystem } from '../systems/AchievementSystem'
import { BuildingSystem } from '../systems/BuildingSystem'
import { FarmingSystem } from '../systems/FarmingSystem'

export interface GameStatistics {
  playTime: number // 플레이 시간 (분)
  itemsCollected: number // 채집한 아이템 수
  itemsCrafted: number // 제작한 아이템 수
  itemsSold: number // 판매한 아이템 수
  missionsCompleted: number // 완료한 미션 수
  achievementsUnlocked: number // 달성한 성취 수
  buildingsBuilt: number // 건설한 건물 수
  cropsHarvested: number // 수확한 작물 수
  fishCaught: number // 잡은 물고기 수
  bugsCaught: number // 잡은 곤충 수
  codexEntries: number // 도감 항목 수
  museumDonations: number // 박물관 기증 수
  coinsEarned: number // 획득한 코인 수
  tokensEarned: number // 획득한 토큰 수
  daysPlayed: number // 플레이한 날 수
  lastPlayDate: number // 마지막 플레이 날짜 (타임스탬프)
}

export class StatisticsManager {
  private stats: GameStatistics
  private inventoryManager: InventoryManager | null = null
  private timeSystem: TimeSystem | null = null
  private codexSystem: CodexSystem | null = null
  private missionSystem: MissionSystem | null = null
  private achievementSystem: AchievementSystem | null = null
  private buildingSystem: BuildingSystem | null = null
  private farmingSystem: FarmingSystem | null = null
  private startTime: number = Date.now()
  private lastSaveTime: number = Date.now()
  
  constructor() {
    this.stats = {
      playTime: 0,
      itemsCollected: 0,
      itemsCrafted: 0,
      itemsSold: 0,
      missionsCompleted: 0,
      achievementsUnlocked: 0,
      buildingsBuilt: 0,
      cropsHarvested: 0,
      fishCaught: 0,
      bugsCaught: 0,
      codexEntries: 0,
      museumDonations: 0,
      coinsEarned: 0,
      tokensEarned: 0,
      daysPlayed: 1,
      lastPlayDate: Date.now()
    }
    this.loadStatistics()
  }
  
  public setInventoryManager(inventoryManager: InventoryManager) {
    this.inventoryManager = inventoryManager
  }
  
  public setTimeSystem(timeSystem: TimeSystem) {
    this.timeSystem = timeSystem
  }
  
  public setCodexSystem(codexSystem: CodexSystem) {
    this.codexSystem = codexSystem
  }
  
  public setMissionSystem(missionSystem: MissionSystem) {
    this.missionSystem = missionSystem
  }
  
  public setAchievementSystem(achievementSystem: AchievementSystem) {
    this.achievementSystem = achievementSystem
  }
  
  public setBuildingSystem(buildingSystem: BuildingSystem) {
    this.buildingSystem = buildingSystem
  }
  
  public setFarmingSystem(farmingSystem: FarmingSystem) {
    this.farmingSystem = farmingSystem
  }
  
  public recordItemCollected(count: number = 1) {
    this.stats.itemsCollected += count
    this.saveStatistics()
  }
  
  public recordItemCrafted(count: number = 1) {
    this.stats.itemsCrafted += count
    this.saveStatistics()
  }
  
  public recordItemSold(count: number = 1) {
    this.stats.itemsSold += count
    this.saveStatistics()
  }
  
  public recordMissionCompleted() {
    this.stats.missionsCompleted++
    this.saveStatistics()
  }
  
  public recordAchievementUnlocked() {
    this.stats.achievementsUnlocked++
    this.saveStatistics()
  }
  
  public recordBuildingBuilt() {
    this.stats.buildingsBuilt++
    this.saveStatistics()
  }
  
  public recordCropHarvested(count: number = 1) {
    this.stats.cropsHarvested += count
    this.saveStatistics()
  }
  
  public recordFishCaught(count: number = 1) {
    this.stats.fishCaught += count
    this.saveStatistics()
  }
  
  public recordBugCaught(count: number = 1) {
    this.stats.bugsCaught += count
    this.saveStatistics()
  }
  
  public recordMuseumDonation() {
    this.stats.museumDonations++
    this.saveStatistics()
  }
  
  public recordCoinsEarned(amount: number) {
    this.stats.coinsEarned += amount
    this.saveStatistics()
  }
  
  public recordTokensEarned(amount: number) {
    this.stats.tokensEarned += amount
    this.saveStatistics()
  }
  
  public updatePlayTime() {
    const now = Date.now()
    const elapsed = Math.floor((now - this.lastSaveTime) / 1000 / 60) // 분 단위
    this.stats.playTime += elapsed
    this.lastSaveTime = now
    this.saveStatistics()
  }
  
  public getStatistics(): GameStatistics {
    // 실시간 데이터 업데이트
    const stats = { ...this.stats }
    
    // 도감 항목 수
    if (this.codexSystem) {
      const allEntries = this.codexSystem.getAllEntries()
      stats.codexEntries = allEntries.filter(e => e.status !== 'undiscovered').length
    }
    
    // 플레이 시간 업데이트
    this.updatePlayTime()
    stats.playTime = this.stats.playTime
    
    return stats
  }
  
  public getFormattedPlayTime(): string {
    const hours = Math.floor(this.stats.playTime / 60)
    const minutes = this.stats.playTime % 60
    return `${hours}시간 ${minutes}분`
  }
  
  private loadStatistics() {
    try {
      const saved = localStorage.getItem('game_statistics')
      if (saved) {
        const parsed = JSON.parse(saved)
        this.stats = { ...this.stats, ...parsed }
        this.lastSaveTime = Date.now()
      }
    } catch (error) {
      console.error('통계 로드 오류:', error)
    }
  }
  
  private saveStatistics() {
    try {
      localStorage.setItem('game_statistics', JSON.stringify(this.stats))
    } catch (error) {
      console.error('통계 저장 오류:', error)
    }
  }
  
  public resetStatistics() {
    this.stats = {
      playTime: 0,
      itemsCollected: 0,
      itemsCrafted: 0,
      itemsSold: 0,
      missionsCompleted: 0,
      achievementsUnlocked: 0,
      buildingsBuilt: 0,
      cropsHarvested: 0,
      fishCaught: 0,
      bugsCaught: 0,
      codexEntries: 0,
      museumDonations: 0,
      coinsEarned: 0,
      tokensEarned: 0,
      daysPlayed: 1,
      lastPlayDate: Date.now()
    }
    this.saveStatistics()
  }
}
