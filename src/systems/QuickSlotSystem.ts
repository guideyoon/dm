import { InventoryManager } from '../InventoryManager'

export type ToolType = 'hand' | 'axe' | 'pickaxe' | 'shovel' | 'fishing_rod' | 'net' | 'watering_can'

export interface QuickSlot {
  slot: number // 1-9
  itemId: string | null
  toolType: ToolType | null
}

export class QuickSlotSystem {
  private inventoryManager: InventoryManager
  private quickSlots: Map<number, QuickSlot> = new Map()
  private currentSlot: number = 1
  
  constructor(inventoryManager: InventoryManager) {
    this.inventoryManager = inventoryManager
    this.initializeSlots()
  }
  
  private initializeSlots() {
    for (let i = 1; i <= 9; i++) {
      this.quickSlots.set(i, {
        slot: i,
        itemId: null,
        toolType: null
      })
    }
    
    // 기본 도구 설정
    this.setSlot(1, null, 'hand')
  }
  
  public setSlot(slot: number, itemId: string | null, toolType: ToolType | null) {
    if (slot < 1 || slot > 9) return false
    
    const quickSlot = this.quickSlots.get(slot)
    if (!quickSlot) return false
    
    quickSlot.itemId = itemId
    quickSlot.toolType = toolType
    
    return true
  }
  
  public getSlot(slot: number): QuickSlot | undefined {
    return this.quickSlots.get(slot)
  }
  
  public getCurrentSlot(): QuickSlot | undefined {
    return this.quickSlots.get(this.currentSlot)
  }
  
  public getCurrentTool(): ToolType {
    const slot = this.getCurrentSlot()
    return slot?.toolType || 'hand'
  }
  
  public setCurrentSlot(slot: number) {
    if (slot >= 1 && slot <= 9) {
      this.currentSlot = slot
    }
  }
  
  public getAllSlots(): QuickSlot[] {
    return Array.from(this.quickSlots.values())
  }
  
  public useItem(slot: number): { success: boolean; message?: string } {
    const quickSlot = this.quickSlots.get(slot)
    if (!quickSlot || !quickSlot.itemId) {
      return { success: false, message: '아이템이 없습니다.' }
    }
    
    // 인벤토리에 아이템이 있는지 확인
    const inventoryItem = this.inventoryManager.list().find(item => item.name === quickSlot.itemId)
    if (!inventoryItem || inventoryItem.count < 1) {
      return { success: false, message: '인벤토리에 아이템이 없습니다.' }
    }
    
    // 아이템 사용 로직
    // 소비 가능한 아이템 타입 (음식, 포션 등)
    const consumableItems: string[] = [
      'berry', 'fruit_apple', 'fruit_golden', 'herb_green', 'herb_blue',
      'mushroom_common', 'mushroom_rare',
      // 농장 작물
      '순무', '당근', '감자', '토마토', '옥수수',
      // 제작된 음식
      'consumable_berry_juice', 'consumable_herb_tea', 'consumable_mushroom_soup',
      'consumable_turnip_salad', 'consumable_carrot_cake', 'consumable_fried_potato',
      'consumable_tomato_juice', 'consumable_corn_soup', 'consumable_stir_fry',
      'consumable_tomato_pasta'
    ]
    
    const itemId = quickSlot.itemId
    
    // 소비 아이템인 경우
    if (consumableItems.includes(itemId)) {
      // 아이템 제거 (1개 소비)
      const removed = this.inventoryManager.remove(itemId, 1)
      if (removed) {
        return { 
          success: true, 
          message: `${itemId}을(를) 사용했습니다.` 
        }
      } else {
        return { success: false, message: '아이템 사용에 실패했습니다.' }
      }
    } else {
      // 사용 불가능한 아이템 (도구 등)
      return { 
        success: false, 
        message: '이 아이템은 사용할 수 없습니다.' 
      }
    }
  }
}
