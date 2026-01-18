import { InventoryManager } from '../InventoryManager'
import { FishingSystem, Fish } from './FishingSystem'

export type CodexCategory = 'fish' | 'bug' | 'item' | 'furniture' | 'clothing'

export type CodexStatus = 'undiscovered' | 'discovered' | 'obtained' | 'donated'

export interface CodexEntry {
  id: string
  category: CodexCategory
  name: string
  description: string
  status: CodexStatus
  image?: string
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic'
  location?: string
  season?: string[]
  timeOfDay?: string[]
  price?: number
}

export class CodexSystem {
  private inventoryManager: InventoryManager
  private fishingSystem: FishingSystem | null = null
  
  // 도감 엔트리 저장소
  private entries: Map<string, CodexEntry> = new Map()
  
  // 발견/획득/기증 상태 추적
  private discoveredIds: Set<string> = new Set()
  private obtainedIds: Set<string> = new Set()
  private donatedIds: Set<string> = new Set()
  
  constructor(inventoryManager: InventoryManager) {
    this.inventoryManager = inventoryManager
    this.initializeCodex()
  }
  
  public setFishingSystem(fishingSystem: FishingSystem) {
    this.fishingSystem = fishingSystem
    this.initializeFishCodex()
  }
  
  private initializeCodex() {
    // 기본 채집물 도감
    this.addEntry({
      id: 'item_wood',
      category: 'item',
      name: '나무',
      description: '기본 건축 재료로 사용됩니다.',
      status: 'undiscovered',
      rarity: 'common',
      price: 10
    })
    
    this.addEntry({
      id: 'item_stone',
      category: 'item',
      name: '돌',
      description: '기본 건축 재료로 사용됩니다.',
      status: 'undiscovered',
      rarity: 'common',
      price: 8
    })
    
    this.addEntry({
      id: 'item_berry',
      category: 'item',
      name: '열매',
      description: '먹을 수 있는 열매입니다.',
      status: 'undiscovered',
      rarity: 'common',
      price: 5
    })
    
    this.addEntry({
      id: 'item_mushroom',
      category: 'item',
      name: '버섯',
      description: '요리에 사용할 수 있는 버섯입니다.',
      status: 'undiscovered',
      rarity: 'uncommon',
      price: 12
    })
    
    this.addEntry({
      id: 'item_flower',
      category: 'item',
      name: '꽃',
      description: '장식용으로 사용할 수 있는 꽃입니다.',
      status: 'undiscovered',
      rarity: 'common',
      price: 15
    })
  }
  
  private initializeFishCodex() {
    if (!this.fishingSystem) return
    
    const allFish = this.fishingSystem.getAllFish()
    allFish.forEach(fish => {
      this.addEntry({
        id: fish.id,
        category: 'fish',
        name: fish.name,
        description: `${fish.size} 크기의 ${fish.rarity} 등급 물고기입니다.`,
        status: 'undiscovered',
        rarity: fish.rarity,
        price: fish.price,
        location: fish.spawnConditions.location
      })
    })
  }
  
  private addEntry(entry: CodexEntry) {
    this.entries.set(entry.id, entry)
  }
  
  public discoverEntry(id: string) {
    if (!this.entries.has(id)) {
      // 자동으로 엔트리 생성 (동적 발견)
      this.addEntry({
        id,
        category: 'item',
        name: id,
        description: '새로 발견한 아이템입니다.',
        status: 'discovered'
      })
    }
    
    const entry = this.entries.get(id)!
    if (entry.status === 'undiscovered') {
      entry.status = 'discovered'
      this.discoveredIds.add(id)
    }
  }
  
  public obtainEntry(id: string) {
    this.discoverEntry(id) // 발견도 함께 처리
    
    const entry = this.entries.get(id)!
    if (entry.status !== 'obtained' && entry.status !== 'donated') {
      entry.status = 'obtained'
      this.obtainedIds.add(id)
    }
  }
  
  public donateEntry(id: string) {
    this.obtainEntry(id) // 획득도 함께 처리
    
    const entry = this.entries.get(id)!
    entry.status = 'donated'
    this.donatedIds.add(id)
  }
  
  public getEntry(id: string): CodexEntry | undefined {
    return this.entries.get(id)
  }
  
  public getEntries(category?: CodexCategory): CodexEntry[] {
    const entries = Array.from(this.entries.values())
    if (category) {
      return entries.filter(entry => entry.category === category)
    }
    return entries
  }
  
  public getDiscoveredEntries(category?: CodexCategory): CodexEntry[] {
    return this.getEntries(category).filter(entry => 
      entry.status !== 'undiscovered'
    )
  }
  
  public getObtainedEntries(category?: CodexCategory): CodexEntry[] {
    return this.getEntries(category).filter(entry => 
      entry.status === 'obtained' || entry.status === 'donated'
    )
  }
  
  public getDonatedEntries(category?: CodexCategory): CodexEntry[] {
    return this.getEntries(category).filter(entry => 
      entry.status === 'donated'
    )
  }
  
  public getCompletionRate(category?: CodexCategory): number {
    const entries = this.getEntries(category)
    if (entries.length === 0) return 0
    
    const discovered = this.getDiscoveredEntries(category).length
    return (discovered / entries.length) * 100
  }
  
  public getDonationRate(category?: CodexCategory): number {
    const entries = this.getEntries(category)
    if (entries.length === 0) return 0
    
    const donated = this.getDonatedEntries(category).length
    return (donated / entries.length) * 100
  }
  
  // 인벤토리 아이템 추가 시 자동으로 도감 업데이트
  public checkInventoryForNewEntries() {
    if (!this.inventoryManager) return
    
    const inventoryItems = this.inventoryManager.list()
    inventoryItems.forEach(item => {
      // 아이템 ID로 도감 확인
      if (this.entries.has(item.name)) {
        this.obtainEntry(item.name)
      } else {
        // 새 아이템 발견
        this.discoverEntry(item.name)
        this.obtainEntry(item.name)
      }
    })
  }
  
  // 물고기 낚기 성공 시 자동으로 도감 업데이트
  public onFishCaught(fishId: string) {
    if (this.entries.has(fishId)) {
      this.obtainEntry(fishId)
    } else if (this.fishingSystem) {
      // 낚시 시스템에서 물고기 정보 가져오기
      const fish = this.fishingSystem.getFishById(fishId)
      if (fish) {
        this.addEntry({
          id: fish.id,
          category: 'fish',
          name: fish.name,
          description: `${fish.size} 크기의 ${fish.rarity} 등급 물고기입니다.`,
          status: 'obtained',
          rarity: fish.rarity,
          price: fish.price,
          location: fish.spawnConditions.location
        })
        this.obtainEntry(fishId)
      }
    }
  }
  
  public getEntryStatus(id: string): CodexStatus {
    const entry = this.entries.get(id)
    return entry?.status || 'undiscovered'
  }
  
  public getTotalEntries(): number {
    return this.entries.size
  }
  
  public getTotalDiscovered(): number {
    return this.discoveredIds.size
  }
  
  public getTotalObtained(): number {
    return this.obtainedIds.size
  }
  
  public getTotalDonated(): number {
    return this.donatedIds.size
  }
}
