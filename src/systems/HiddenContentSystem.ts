import { Scene, Mesh, Vector3, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core'
import { TimeSystem } from './TimeSystem'
import { InventoryManager } from '../InventoryManager'

export interface TreasureChest {
  id: string
  position: { x: number; y: number; z: number }
  mesh: Mesh
  opened: boolean
  loot: Array<{ id: string; count: number }>
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface BonusItem {
  id: string
  position: { x: number; y: number; z: number }
  mesh: Mesh
  collected: boolean
  itemId: string
  count: number
  spawnDay: number // 게임 일자
}

export class HiddenContentSystem {
  private scene: Scene
  private timeSystem: TimeSystem | null = null
  private inventoryManager: InventoryManager | null = null
  
  private treasureChests: Map<string, TreasureChest> = new Map()
  private bonusItems: Map<string, BonusItem> = new Map()
  private lastBonusItemSpawnDay: number = 0
  
  constructor(scene: Scene) {
    this.scene = scene
    this.initializeTreasureChests()
  }
  
  public setTimeSystem(timeSystem: TimeSystem) {
    this.timeSystem = timeSystem
    this.spawnDailyBonusItem()
  }
  
  public setInventoryManager(inventoryManager: InventoryManager) {
    this.inventoryManager = inventoryManager
  }
  
  // 보물상자 초기화
  private initializeTreasureChests() {
    // 맵 곳곳에 보물상자 배치 (3개)
    const chestPositions = [
      { x: 20, z: 20 },
      { x: -25, z: -25 },
      { x: 30, z: -30 }
    ]
    
    chestPositions.forEach((pos, index) => {
      const chestId = `treasure_chest_${index}`
      const rarity: 'common' | 'rare' | 'epic' | 'legendary' = index === 0 ? 'common' : index === 1 ? 'rare' : 'epic'
      
      const chest = this.createTreasureChest(chestId, pos.x, pos.z, rarity)
      this.treasureChests.set(chestId, chest)
    })
  }
  
  // 보물상자 생성
  private createTreasureChest(chestId: string, x: number, z: number, rarity: 'common' | 'rare' | 'epic' | 'legendary'): TreasureChest {
    // 보물상자 메시 (간단한 박스)
    const chest = MeshBuilder.CreateBox(chestId, {
      width: 0.6,
      height: 0.4,
      depth: 0.6
    }, this.scene)
    
    chest.position = new Vector3(x, 0.2, z)
    
    const chestMat = new StandardMaterial(`chestMat_${chestId}`, this.scene)
    const rarityColors: { [key: string]: Color3 } = {
      common: new Color3(0.6, 0.4, 0.2), // 갈색
      rare: new Color3(0.2, 0.6, 0.8), // 파란색
      epic: new Color3(0.8, 0.2, 0.8), // 보라색
      legendary: new Color3(1, 0.84, 0) // 금색
    }
    chestMat.diffuseColor = rarityColors[rarity]
    chest.material = chestMat
    
    chest.checkCollisions = true
    chest.isPickable = true
    chest.metadata = { type: 'treasure_chest', chestId }
    
    // 보물상자 루트 결정
    const loot: Array<{ id: string; count: number }> = []
    switch (rarity) {
      case 'common':
        loot.push({ id: '나무', count: 10 }, { id: '돌', count: 5 }, { id: '열매', count: 3 })
        break
      case 'rare':
        loot.push({ id: '철광석', count: 5 }, { id: '나무', count: 20 }, { id: '열매', count: 10 })
        break
      case 'epic':
        loot.push({ id: '보석 조각', count: 3 }, { id: '철광석', count: 10 }, { id: '나무', count: 30 })
        break
      case 'legendary':
        loot.push({ id: '보석 조각', count: 10 }, { id: '철광석', count: 20 }, { id: '나무', count: 50 })
        break
    }
    
    return {
      id: chestId,
      position: { x, y: 0.2, z },
      mesh: chest,
      opened: false,
      loot,
      rarity
    }
  }
  
  // 보물상자 열기
  public openTreasureChest(chestId: string): { success: boolean; message: string; loot?: Array<{ id: string; count: number }> } {
    const chest = this.treasureChests.get(chestId)
    if (!chest) {
      return { success: false, message: '보물상자를 찾을 수 없습니다.' }
    }
    
    if (chest.opened) {
      return { success: false, message: '이미 열린 보물상자입니다.' }
    }
    
    if (!this.inventoryManager) {
      return { success: false, message: '인벤토리 시스템이 없습니다.' }
    }
    
    // 루트 지급
    chest.loot.forEach(item => {
      this.inventoryManager!.add(item.id, item.count)
    })
    
    chest.opened = true
    
    // 보물상자 메시 업데이트 (열린 모양으로)
    const chestMat = chest.mesh.material as StandardMaterial
    if (chestMat) {
      chestMat.alpha = 0.5 // 반투명하게
    }
    
    return {
      success: true,
      message: `${chest.rarity} 보물상자를 열었습니다!`,
      loot: chest.loot
    }
  }
  
  // 보물상자 찾기 (메시에서)
  public getTreasureChestByMesh(mesh: Mesh): TreasureChest | null {
    for (const chest of this.treasureChests.values()) {
      if (chest.mesh === mesh) {
        return chest
      }
    }
    return null
  }
  
  // 일일 보너스 아이템 스폰
  public update() {
    if (!this.timeSystem) return
    
    const currentDay = this.timeSystem.getTime().day
    if (currentDay !== this.lastBonusItemSpawnDay) {
      this.spawnDailyBonusItem()
      this.lastBonusItemSpawnDay = currentDay
    }
  }
  
  private spawnDailyBonusItem() {
    if (!this.timeSystem) return
    
    const currentDay = this.timeSystem.getTime().day
    
    // 이전 일일 보너스 아이템 제거
    this.bonusItems.forEach(bonus => {
      if (bonus.spawnDay !== currentDay && bonus.mesh && !bonus.mesh.isDisposed()) {
        bonus.mesh.dispose()
      }
    })
    this.bonusItems.clear()
    
    // 새로운 위치에 보너스 아이템 스폰 (랜덤 위치)
    const bonusPosition = this.getRandomBonusPosition()
    const bonusItem: BonusItem = {
      id: `bonus_item_${currentDay}_${Date.now()}`,
      position: bonusPosition,
      mesh: this.createBonusItemMesh(bonusPosition),
      collected: false,
      itemId: '열매', // 기본 보너스 아이템
      count: Math.floor(Math.random() * 5) + 3, // 3-7개
      spawnDay: currentDay
    }
    
    this.bonusItems.set(bonusItem.id, bonusItem)
    console.log(`일일 보너스 아이템 스폰: (${bonusPosition.x}, ${bonusPosition.z})`)
  }
  
  // 랜덤 보너스 아이템 위치 생성
  private getRandomPosition(): { x: number; z: number } {
    // 맵 크기 100x100에서 랜덤 위치 (-50 ~ 50)
    return {
      x: (Math.random() - 0.5) * 100,
      z: (Math.random() - 0.5) * 100
    }
  }
  
  private getRandomBonusPosition(): { x: number; y: number; z: number } {
    const pos = this.getRandomPosition()
    return {
      x: pos.x,
      y: 0.1,
      z: pos.z
    }
  }
  
  // 보너스 아이템 메시 생성
  private createBonusItemMesh(position: { x: number; y: number; z: number }): Mesh {
    const item = MeshBuilder.CreateSphere(`bonus_item_${position.x}_${position.z}`, {
      diameter: 0.2
    }, this.scene)
    
    item.position = new Vector3(position.x, position.y, position.z)
    
    const itemMat = new StandardMaterial(`bonusItemMat_${position.x}_${position.z}`, this.scene)
    itemMat.diffuseColor = new Color3(1, 1, 0) // 노란색 (보너스 표시)
    itemMat.emissiveColor = new Color3(0.5, 0.5, 0) // 발광 효과
    item.material = itemMat
    
    item.checkCollisions = true
    item.isPickable = true
    item.metadata = { type: 'bonus_item' }
    
    // 위아래로 떠있는 애니메이션 (간단한 회전)
    // 나중에 애니메이션 시스템으로 옮길 수 있음
    
    return item
  }
  
  // 보너스 아이템 수집
  public collectBonusItem(itemId: string): { success: boolean; message: string; item?: { id: string; count: number } } {
    const bonus = this.bonusItems.get(itemId)
    if (!bonus) {
      return { success: false, message: '보너스 아이템을 찾을 수 없습니다.' }
    }
    
    if (bonus.collected) {
      return { success: false, message: '이미 수집한 보너스 아이템입니다.' }
    }
    
    if (!this.inventoryManager) {
      return { success: false, message: '인벤토리 시스템이 없습니다.' }
    }
    
    // 아이템 추가
    this.inventoryManager.add(bonus.itemId, bonus.count)
    
    bonus.collected = true
    
    // 메시 제거
    if (bonus.mesh && !bonus.mesh.isDisposed()) {
      bonus.mesh.dispose()
    }
    
    return {
      success: true,
      message: `보너스 아이템을 수집했습니다! (${bonus.itemId} x${bonus.count})`,
      item: { id: bonus.itemId, count: bonus.count }
    }
  }
  
  // 보너스 아이템 찾기 (메시에서)
  public getBonusItemByMesh(mesh: Mesh): BonusItem | null {
    for (const bonus of this.bonusItems.values()) {
      if (bonus.mesh === mesh) {
        return bonus
      }
    }
    return null
  }
  
  // 모든 보물상자 가져오기
  public getAllTreasureChests(): TreasureChest[] {
    return Array.from(this.treasureChests.values())
  }
  
  // 모든 보너스 아이템 가져오기
  public getAllBonusItems(): BonusItem[] {
    return Array.from(this.bonusItems.values())
  }
}
