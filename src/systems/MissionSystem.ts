import { InventoryManager } from '../InventoryManager'
import { TimeSystem, Season } from './TimeSystem'

export type MissionType = 'daily' | 'weekly' | 'seasonal'

export type MissionStatus = 'locked' | 'active' | 'completed' | 'claimed'

export interface Mission {
  id: string
  type: MissionType
  title: string
  description: string
  status: MissionStatus
  progress: number
  target: number
  rewards: {
    coins?: number
    tokens?: number
    items?: Array<{ id: string; count: number }>
  }
  unlockLevel?: number
  startDate?: number // 타임스탬프
  endDate?: number // 타임스탬프
}

export class MissionSystem {
  private inventoryManager: InventoryManager
  private timeSystem: TimeSystem | null = null
  private missions: Map<string, Mission> = new Map()
  private playerCoins: number = 0
  private playerTokens: number = 0
  
  constructor(inventoryManager: InventoryManager) {
    this.inventoryManager = inventoryManager
    this.initializeMissions()
  }
  
  public setTimeSystem(timeSystem: TimeSystem) {
    this.timeSystem = timeSystem
  }
  
  public setPlayerCoins(coins: number) {
    this.playerCoins = coins
  }
  
  public setPlayerTokens(tokens: number) {
    this.playerTokens = tokens
  }
  
  private initializeMissions() {
    // 일일 미션
    this.addMission({
      id: 'daily_harvest_tree',
      type: 'daily',
      title: '나무 채집하기',
      description: '나무를 5개 채집하세요',
      status: 'active',
      progress: 0,
      target: 5,
      rewards: {
        coins: 50
      }
    })
    
    this.addMission({
      id: 'daily_harvest_rock',
      type: 'daily',
      title: '돌 채집하기',
      description: '돌을 3개 채집하세요',
      status: 'active',
      progress: 0,
      target: 3,
      rewards: {
        coins: 30
      }
    })
    
    this.addMission({
      id: 'daily_fish',
      type: 'daily',
      title: '물고기 낚기',
      description: '물고기를 1마리 낚으세요',
      status: 'active',
      progress: 0,
      target: 1,
      rewards: {
        coins: 40
      }
    })
    
    // 주간 미션
    this.addMission({
      id: 'weekly_collect_100_items',
      type: 'weekly',
      title: '아이템 수집',
      description: '총 100개의 아이템을 수집하세요',
      status: 'active',
      progress: 0,
      target: 100,
      rewards: {
        coins: 500,
        tokens: 10
      }
    })
    
    this.addMission({
      id: 'weekly_craft_10_items',
      type: 'weekly',
      title: '제작 마스터',
      description: '아이템을 10개 제작하세요',
      status: 'active',
      progress: 0,
      target: 10,
      rewards: {
        coins: 300,
        tokens: 5
      }
    })
    
    // 시즌 미션
    this.addMission({
      id: 'seasonal_complete_codex',
      type: 'seasonal',
      title: '도감 완성',
      description: '도감을 50% 이상 완성하세요',
      status: 'active',
      progress: 0,
      target: 50,
      rewards: {
        coins: 1000,
        tokens: 50
      }
    })
  }
  
  private addMission(mission: Mission) {
    this.missions.set(mission.id, mission)
  }
  
  public getMissions(type?: MissionType): Mission[] {
    const missions = Array.from(this.missions.values())
    if (type) {
      return missions.filter(mission => mission.type === type)
    }
    return missions
  }
  
  public getMission(id: string): Mission | undefined {
    return this.missions.get(id)
  }
  
  public updateMissionProgress(missionId: string, progress: number) {
    const mission = this.missions.get(missionId)
    if (!mission || mission.status !== 'active') {
      return false
    }
    
    mission.progress = Math.min(progress, mission.target)
    
    // 목표 달성 체크
    if (mission.progress >= mission.target && mission.status === 'active') {
      mission.status = 'completed'
      return true
    }
    
    return false
  }
  
  public incrementMissionProgress(missionId: string, amount: number = 1) {
    const mission = this.missions.get(missionId)
    if (!mission || mission.status !== 'active') {
      return false
    }
    
    mission.progress = Math.min(mission.progress + amount, mission.target)
    
    // 목표 달성 체크
    if (mission.progress >= mission.target && mission.status === 'active') {
      mission.status = 'completed'
      return true
    }
    
    return false
  }
  
  public claimReward(missionId: string): boolean {
    const mission = this.missions.get(missionId)
    if (!mission || mission.status !== 'completed') {
      return false
    }
    
    // 보상 지급
    if (mission.rewards.coins) {
      this.playerCoins += mission.rewards.coins
    }
    
    if (mission.rewards.tokens) {
      this.playerTokens += mission.rewards.tokens
    }
    
    if (mission.rewards.items) {
      mission.rewards.items.forEach(item => {
        this.inventoryManager.add(item.id, item.count)
      })
    }
    
    mission.status = 'claimed'
    return true
  }
  
  public claimAllRewards(): number {
    let claimedCount = 0
    this.missions.forEach(mission => {
      if (mission.status === 'completed') {
        if (this.claimReward(mission.id)) {
          claimedCount++
        }
      }
    })
    return claimedCount
  }
  
  // 게임 이벤트에 따른 미션 진행도 업데이트
  public onItemCollected(itemId: string, count: number = 1) {
    // 일일 미션: 나무 채집
    if (itemId === 'Wood') {
      this.incrementMissionProgress('daily_harvest_tree', count)
    }
    
    // 일일 미션: 돌 채집
    if (itemId === 'Stone') {
      this.incrementMissionProgress('daily_harvest_rock', count)
    }
    
    // 주간 미션: 아이템 수집
    this.incrementMissionProgress('weekly_collect_100_items', count)
  }
  
  public onFishCaught() {
    this.incrementMissionProgress('daily_fish')
  }
  
  public onItemCrafted() {
    this.incrementMissionProgress('weekly_craft_10_items')
  }
  
  public onCodexProgress(completionRate: number) {
    this.updateMissionProgress('seasonal_complete_codex', completionRate)
  }
  
  public resetDailyMissions() {
    this.missions.forEach(mission => {
      if (mission.type === 'daily') {
        mission.status = 'active'
        mission.progress = 0
      }
    })
  }
  
  public resetWeeklyMissions() {
    this.missions.forEach(mission => {
      if (mission.type === 'weekly') {
        mission.status = 'active'
        mission.progress = 0
      }
    })
  }
  
  public resetSeasonalMissions() {
    this.missions.forEach(mission => {
      if (mission.type === 'seasonal') {
        mission.status = 'active'
        mission.progress = 0
      }
    })
  }
  
  public getCompletedMissionsCount(type?: MissionType): number {
    const missions = this.getMissions(type)
    return missions.filter(mission => mission.status === 'completed' || mission.status === 'claimed').length
  }
  
  public getActiveMissionsCount(type?: MissionType): number {
    const missions = this.getMissions(type)
    return missions.filter(mission => mission.status === 'active').length
  }
  
  public getClaimableMissionsCount(type?: MissionType): number {
    const missions = this.getMissions(type)
    return missions.filter(mission => mission.status === 'completed').length
  }
  
  public getPlayerCoins(): number {
    return this.playerCoins
  }
  
  public getPlayerTokens(): number {
    return this.playerTokens
  }
}
