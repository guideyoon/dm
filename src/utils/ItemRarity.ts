export type ItemRarity = 'common' | 'rare' | 'ultra_rare' | 'legendary'

export interface ItemRarityData {
  rarity: ItemRarity
  name: string
  color: string
  glowColor?: string
  doubleHarvest?: boolean // 더블 수확 (금 색 아이템)
}

export class ItemRarityManager {
  private static itemRarityMap: Map<string, ItemRarityData> = new Map([
    // 일반 아이템
    ['나무', { rarity: 'common', name: '일반', color: '#CCCCCC' }],
    ['돌', { rarity: 'common', name: '일반', color: '#CCCCCC' }],
    ['열매', { rarity: 'common', name: '일반', color: '#CCCCCC' }],
    ['버섯', { rarity: 'common', name: '일반', color: '#CCCCCC' }],
    ['꽃', { rarity: 'common', name: '일반', color: '#CCCCCC' }],
    
    // 희귀 아이템
    ['철광석', { rarity: 'rare', name: '희귀', color: '#4CAF50', glowColor: '#81C784' }],
    ['단단한 나무', { rarity: 'rare', name: '희귀', color: '#4CAF50', glowColor: '#81C784' }],
    ['희귀 버섯', { rarity: 'rare', name: '희귀', color: '#4CAF50', glowColor: '#81C784' }],
    ['희귀 조개', { rarity: 'rare', name: '희귀', color: '#4CAF50', glowColor: '#81C784' }],
    ['희귀 꽃', { rarity: 'rare', name: '희귀', color: '#4CAF50', glowColor: '#81C784' }],
    
    // 초희귀 아이템
    ['보석 조각', { rarity: 'ultra_rare', name: '초희귀', color: '#2196F3', glowColor: '#64B5F6' }],
    ['희귀 수액', { rarity: 'ultra_rare', name: '초희귀', color: '#2196F3', glowColor: '#64B5F6' }],
    
    // 전설 아이템 (금 색 - 더블 수확)
    ['나무_golden', { rarity: 'legendary', name: '전설', color: '#FFD700', glowColor: '#FFEB3B', doubleHarvest: true }],
    ['돌_golden', { rarity: 'legendary', name: '전설', color: '#FFD700', glowColor: '#FFEB3B', doubleHarvest: true }],
    ['열매_golden', { rarity: 'legendary', name: '전설', color: '#FFD700', glowColor: '#FFEB3B', doubleHarvest: true }]
  ])
  
  public static getRarity(itemId: string): ItemRarityData {
    return this.itemRarityMap.get(itemId) || {
      rarity: 'common',
      name: '일반',
      color: '#CCCCCC'
    }
  }
  
  public static isGoldenItem(itemId: string): boolean {
    const data = this.itemRarityMap.get(itemId)
    return data?.doubleHarvest === true || itemId.includes('_golden')
  }
  
  public static getRarityColor(rarity: ItemRarity): string {
    const colors: { [key in ItemRarity]: string } = {
      common: '#CCCCCC',
      rare: '#4CAF50',
      ultra_rare: '#2196F3',
      legendary: '#FFD700'
    }
    return colors[rarity]
  }
  
  public static getRarityName(rarity: ItemRarity): string {
    const names: { [key in ItemRarity]: string } = {
      common: '일반',
      rare: '희귀',
      ultra_rare: '초희귀',
      legendary: '전설'
    }
    return names[rarity]
  }
  
  // 시간대별 특수 아이템 (새벽 5시만 등장)
  public static getTimeBasedRareItem(hour: number): string | null {
    if (hour === 5) {
      // 새벽 5시 특수 아이템
      const dawnItems = ['새벽 수정', '새벽 꽃', '새벽 돌']
      return dawnItems[Math.floor(Math.random() * dawnItems.length)]
    }
    return null
  }
}
