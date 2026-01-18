import { InventoryManager } from '../InventoryManager'
import { CodexSystem } from './CodexSystem'

export type MuseumCategory = 'fish' | 'bug' | 'fossil' | 'art' | 'crop'

export interface MuseumExhibit {
  id: string
  category: MuseumCategory
  name: string
  description: string
  donated: boolean
  donatedDate?: number
  displayPosition?: { x: number; y: number; z: number }
}

export interface MuseumDonation {
  success: boolean
  message: string
  reward?: {
    coins?: number
    tokens?: number
  }
}

export class MuseumSystem {
  private inventoryManager: InventoryManager
  private codexSystem: CodexSystem | null = null
  
  // 박물관 전시품 저장소
  private exhibits: Map<string, MuseumExhibit> = new Map()
  
  // 기증 가능한 아이템 목록
  private donatableItems: Set<string> = new Set([
    'fish_crucian',
    'fish_carp',
    'fish_catfish',
    'fish_salmon',
    'fish_tuna',
    'fish_sardine',
    'fish_goldfish'
  ])
  
  // 기증 보상
  private donationRewards: { [itemId: string]: { coins?: number; tokens?: number } } = {
    'fish_crucian': { coins: 20 },
    'fish_carp': { coins: 50 },
    'fish_catfish': { coins: 100 },
    'fish_salmon': { coins: 200 },
    'fish_tuna': { coins: 500 },
    'fish_sardine': { coins: 30 },
    'fish_goldfish': { coins: 300, tokens: 5 }
  }
  
  constructor(inventoryManager: InventoryManager) {
    this.inventoryManager = inventoryManager
    this.initializeExhibits()
  }
  
  public setCodexSystem(codexSystem: CodexSystem) {
    this.codexSystem = codexSystem
  }
  
  private initializeExhibits() {
    // 물고기 전시품 초기화
    const fishIds = [
      'fish_crucian',
      'fish_carp',
      'fish_catfish',
      'fish_salmon',
      'fish_tuna',
      'fish_sardine',
      'fish_goldfish'
    ]
    
    fishIds.forEach((fishId, index) => {
      this.exhibits.set(fishId, {
        id: fishId,
        category: 'fish',
        name: this.getFishName(fishId),
        description: `${this.getFishName(fishId)} 표본입니다.`,
        donated: false
      })
    })

    // 농장 작물 전시품 초기화
    const cropIds = [
      '순무',
      '당근',
      '감자',
      '토마토',
      '옥수수'
    ]

    cropIds.forEach((cropId) => {
      this.exhibits.set(cropId, {
        id: cropId,
        category: 'crop',
        name: cropId,
        description: `${cropId} 표본입니다.`,
        donated: false
      })
    })
  }
  
  private getFishName(fishId: string): string {
    const names: { [key: string]: string } = {
      'fish_crucian': '붕어',
      'fish_carp': '잉어',
      'fish_catfish': '메기',
      'fish_salmon': '연어',
      'fish_tuna': '참치',
      'fish_sardine': '정어리',
      'fish_goldfish': '금붕어'
    }
    return names[fishId] || fishId
  }
  
  public isDonatable(itemId: string): boolean {
    return this.donatableItems.has(itemId)
  }
  
  public isDonated(itemId: string): boolean {
    const exhibit = this.exhibits.get(itemId)
    return exhibit?.donated || false
  }
  
  public donateItem(itemId: string): MuseumDonation {
    // 기증 가능한 아이템인지 확인
    if (!this.isDonatable(itemId)) {
      return {
        success: false,
        message: '이 아이템은 기증할 수 없습니다.'
      }
    }
    
    // 이미 기증했는지 확인
    if (this.isDonated(itemId)) {
      return {
        success: false,
        message: '이미 기증한 아이템입니다.'
      }
    }
    
    // 인벤토리에 아이템이 있는지 확인
    const inventoryItem = this.inventoryManager.list().find(item => item.name === itemId)
    if (!inventoryItem || inventoryItem.count < 1) {
      return {
        success: false,
        message: '기증할 아이템이 없습니다.'
      }
    }
    
    // 아이템 제거
    this.inventoryManager.remove(itemId, 1)
    
    // 전시품 등록
    const exhibit = this.exhibits.get(itemId)!
    exhibit.donated = true
    exhibit.donatedDate = Date.now()
    
    // 도감 업데이트
    if (this.codexSystem) {
      this.codexSystem.donateEntry(itemId)
    }
    
    // 보상 지급
    const reward = this.donationRewards[itemId] || {}
    
    return {
      success: true,
      message: `${exhibit.name}을(를) 기증했습니다!`,
      reward: reward
    }
  }
  
  public getExhibits(category?: MuseumCategory): MuseumExhibit[] {
    const exhibits = Array.from(this.exhibits.values())
    if (category) {
      return exhibits.filter(exhibit => exhibit.category === category)
    }
    return exhibits
  }
  
  public getDonatedExhibits(category?: MuseumCategory): MuseumExhibit[] {
    return this.getExhibits(category).filter(exhibit => exhibit.donated)
  }
  
  public getDonationProgress(category?: MuseumCategory): number {
    const exhibits = this.getExhibits(category)
    if (exhibits.length === 0) return 0
    
    const donated = this.getDonatedExhibits(category).length
    return (donated / exhibits.length) * 100
  }
  
  public getTotalExhibits(): number {
    return this.exhibits.size
  }
  
  public getTotalDonated(): number {
    return this.getDonatedExhibits().length
  }
  
  public getDonationReward(itemId: string): { coins?: number; tokens?: number } {
    return this.donationRewards[itemId] || {}
  }
}
