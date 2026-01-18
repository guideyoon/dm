import { CodexSystem } from './CodexSystem'
import { MuseumSystem } from './MuseumSystem'
import { TimeSystem } from './TimeSystem'
import { CurrencySystem } from './CurrencySystem'
import { InventoryManager } from '../InventoryManager'
import { Vector3 } from '@babylonjs/core'

export type AchievementType = 'collection' | 'attendance' | 'milestone' | 'daily'

export interface Achievement {
  id: string
  type: AchievementType
  name: string
  description: string
  progress: number
  target: number
  completed: boolean
  claimed: boolean
  reward: {
    coins?: number
    tokens?: number
    mileage?: number
    items?: Array<{ id: string; count: number }>
  }
  icon?: string
}

export class AchievementSystem {
  private codexSystem: CodexSystem | null = null
  private museumSystem: MuseumSystem | null = null
  private timeSystem: TimeSystem | null = null
  private currencySystem: CurrencySystem | null = null
  private inventoryManager: InventoryManager | null = null
  
  private achievements: Map<string, Achievement> = new Map()
  private consecutiveDays: number = 0 // 연속 출석 일수
  private lastLoginDay: number = 0 // 마지막 로그인 일자
  private mileagePoints: number = 0 // 마일리지 포인트
  
  constructor() {
    this.initializeAchievements()
  }
  
  public setCodexSystem(codexSystem: CodexSystem) {
    this.codexSystem = codexSystem
  }
  
  public setMuseumSystem(museumSystem: MuseumSystem) {
    this.museumSystem = museumSystem
  }
  
  public setTimeSystem(timeSystem: TimeSystem) {
    this.timeSystem = timeSystem
    this.checkAttendance()
  }
  
  public setCurrencySystem(currencySystem: CurrencySystem) {
    this.currencySystem = currencySystem
  }
  
  public setInventoryManager(inventoryManager: InventoryManager) {
    this.inventoryManager = inventoryManager
  }
  
  private initializeAchievements() {
    // 도감 완성도 성취
    const collectionAchievements: Achievement[] = [
      {
        id: 'ach_codex_25',
        type: 'collection',
        name: '도감 초보자',
        description: '도감을 25% 완성하세요.',
        progress: 0,
        target: 25,
        completed: false,
        claimed: false,
        reward: { coins: 100, mileage: 50 }
      },
      {
        id: 'ach_codex_50',
        type: 'collection',
        name: '도감 수집가',
        description: '도감을 50% 완성하세요.',
        progress: 0,
        target: 50,
        completed: false,
        claimed: false,
        reward: { coins: 300, mileage: 150 }
      },
      {
        id: 'ach_codex_75',
        type: 'collection',
        name: '도감 마스터',
        description: '도감을 75% 완성하세요.',
        progress: 0,
        target: 75,
        completed: false,
        claimed: false,
        reward: { coins: 500, mileage: 300 }
      },
      {
        id: 'ach_codex_100',
        type: 'collection',
        name: '도감 완성자',
        description: '도감을 100% 완성하세요.',
        progress: 0,
        target: 100,
        completed: false,
        claimed: false,
        reward: { coins: 1000, tokens: 50, mileage: 500 }
      },
      {
        id: 'ach_museum_25',
        type: 'collection',
        name: '박물관 기증자',
        description: '박물관에 25% 기증하세요.',
        progress: 0,
        target: 25,
        completed: false,
        claimed: false,
        reward: { coins: 200, mileage: 100 }
      },
      {
        id: 'ach_museum_100',
        type: 'collection',
        name: '박물관 완성자',
        description: '박물관에 100% 기증하세요.',
        progress: 0,
        target: 100,
        completed: false,
        claimed: false,
        reward: { coins: 2000, tokens: 100, mileage: 1000 }
      }
    ]
    
    // 연속 출석 성취
    const attendanceAchievements: Achievement[] = [
      {
        id: 'ach_attendance_3',
        type: 'attendance',
        name: '3일 연속 출석',
        description: '3일 연속으로 로그인하세요.',
        progress: 0,
        target: 3,
        completed: false,
        claimed: false,
        reward: { coins: 50, mileage: 25 }
      },
      {
        id: 'ach_attendance_7',
        type: 'attendance',
        name: '7일 연속 출석',
        description: '7일 연속으로 로그인하세요.',
        progress: 0,
        target: 7,
        completed: false,
        claimed: false,
        reward: { coins: 150, mileage: 75 }
      },
      {
        id: 'ach_attendance_30',
        type: 'attendance',
        name: '30일 연속 출석',
        description: '30일 연속으로 로그인하세요.',
        progress: 0,
        target: 30,
        completed: false,
        claimed: false,
        reward: { coins: 1000, tokens: 20, mileage: 500 }
      }
    ]
    
    // 마일스톤 성취
    const milestoneAchievements: Achievement[] = [
      {
        id: 'ach_coins_10000',
        type: 'milestone',
        name: '부자 되기',
        description: '코인을 10,000개 모으세요.',
        progress: 0,
        target: 10000,
        completed: false,
        claimed: false,
        reward: { coins: 500, mileage: 200 }
      },
      {
        id: 'ach_items_100',
        type: 'milestone',
        name: '아이템 수집가',
        description: '아이템을 100개 모으세요.',
        progress: 0,
        target: 100,
        completed: false,
        claimed: false,
        reward: { coins: 200, mileage: 100 }
      }
    ]
    
    // 모든 성취를 맵에 추가
    const allAchievements: Achievement[] = [...collectionAchievements, ...attendanceAchievements, ...milestoneAchievements]
    allAchievements.forEach(ach => {
      this.achievements.set(ach.id, ach)
    })
  }
  
  public update() {
    this.updateProgress()
    this.checkAttendance()
  }
  
  private updateProgress() {
    if (!this.codexSystem || !this.museumSystem || !this.currencySystem) return
    
    // 도감 완성도 업데이트
    const codexCompletion = Math.round(this.codexSystem.getCompletionRate())
    this.updateAchievementProgress('ach_codex_25', codexCompletion)
    this.updateAchievementProgress('ach_codex_50', codexCompletion)
    this.updateAchievementProgress('ach_codex_75', codexCompletion)
    this.updateAchievementProgress('ach_codex_100', codexCompletion)
    
    // 박물관 기증률 업데이트
    const museumCompletion = Math.round(this.museumSystem.getDonationProgress())
    this.updateAchievementProgress('ach_museum_25', museumCompletion)
    this.updateAchievementProgress('ach_museum_100', museumCompletion)
    
    // 코인 수 업데이트
    const coins = this.currencySystem.getCoins()
    this.updateAchievementProgress('ach_coins_10000', coins)
    
    // 아이템 수 업데이트
    if (this.inventoryManager) {
      const totalItems = this.inventoryManager.list().reduce((sum, item) => sum + item.count, 0)
      this.updateAchievementProgress('ach_items_100', totalItems)
    }
    
    // 연속 출석 일수 업데이트
    const attendanceAchievements = ['ach_attendance_3', 'ach_attendance_7', 'ach_attendance_30']
    attendanceAchievements.forEach(id => {
      this.updateAchievementProgress(id, this.consecutiveDays)
    })
  }
  
  private updateAchievementProgress(achievementId: string, progress: number) {
    const achievement = this.achievements.get(achievementId)
    if (!achievement || achievement.completed) return
    
    achievement.progress = progress
    
    if (progress >= achievement.target && !achievement.completed) {
      achievement.completed = true
      console.log(`성취 완료: ${achievement.name}`)
      
      // 성취 달성 파티클 효과
      if ((window as any).particleEffects) {
        const playerPosition = (window as any).playerPosition || { x: 0, y: 2, z: 0 }
        const effectPos = new Vector3(playerPosition.x, playerPosition.y, playerPosition.z)
        ;(window as any).particleEffects.createAchievementEffect(effectPos)
      }
    }
  }
  
  private checkAttendance() {
    if (!this.timeSystem) return
    
    const currentDay = this.timeSystem.getTime().day
    
    if (this.lastLoginDay === 0) {
      // 첫 로그인
      this.lastLoginDay = currentDay
      this.consecutiveDays = 1
      return
    }
    
    if (currentDay > this.lastLoginDay) {
      const daysDiff = currentDay - this.lastLoginDay
      
      if (daysDiff === 1) {
        // 연속 출석
        this.consecutiveDays++
      } else {
        // 연속 출석 끊김
        this.consecutiveDays = 1
      }
      
      this.lastLoginDay = currentDay
    }
  }
  
  public claimAchievement(achievementId: string): { success: boolean; message: string } {
    const achievement = this.achievements.get(achievementId)
    if (!achievement) {
      return { success: false, message: '성취를 찾을 수 없습니다.' }
    }
    
    if (!achievement.completed) {
      return { success: false, message: '아직 완료되지 않은 성취입니다.' }
    }
    
    if (achievement.claimed) {
      return { success: false, message: '이미 보상을 받았습니다.' }
    }
    
    // 보상 지급
    if (achievement.reward.coins && this.currencySystem) {
      this.currencySystem.addCoins(achievement.reward.coins)
    }
    
    if (achievement.reward.tokens && this.currencySystem) {
      this.currencySystem.addTokens(achievement.reward.tokens)
    }
    
    if (achievement.reward.mileage) {
      this.mileagePoints += achievement.reward.mileage
    }
    
    if (achievement.reward.items && this.inventoryManager) {
      achievement.reward.items.forEach(item => {
        this.inventoryManager!.add(item.id, item.count)
      })
    }
    
    achievement.claimed = true
    
    return {
      success: true,
      message: `${achievement.name} 보상을 받았습니다!`
    }
  }
  
  public getAchievements(): Achievement[] {
    return Array.from(this.achievements.values())
  }
  
  public getCompletedAchievements(): Achievement[] {
    return Array.from(this.achievements.values()).filter(ach => ach.completed)
  }
  
  public getClaimableAchievements(): Achievement[] {
    return Array.from(this.achievements.values()).filter(ach => ach.completed && !ach.claimed)
  }
  
  public getMileagePoints(): number {
    return this.mileagePoints
  }
  
  public addMileagePoints(points: number) {
    this.mileagePoints += points
  }
  
  public getConsecutiveDays(): number {
    return this.consecutiveDays
  }
}
