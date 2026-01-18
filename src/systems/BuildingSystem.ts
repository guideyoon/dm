import { Scene, Mesh, Vector3, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core'
import { InventoryManager } from '../InventoryManager'

export type BuildingType = 'house' | 'shop' | 'museum' | 'workshop' | 'storage' | 'farm' | 'barn' | 'greenhouse' | 'well' | 'fence'

export interface Building {
  id: string
  type: BuildingType
  name: string
  position: { x: number; y: number; z: number }
  rotation: number
  mesh: Mesh
  requirements: {
    materials: Array<{ id: string; count: number }>
    coins: number
  }
  built: boolean
}

export interface BuildingData {
  type: BuildingType
  name: string
  size: { width: number; height: number; depth: number }
  requirements: {
    materials: Array<{ id: string; count: number }>
    coins: number
  }
}

export class BuildingSystem {
  private scene: Scene
  private inventoryManager: InventoryManager
  private buildings: Map<string, Building> = new Map()
  
  private buildingDatabase: { [key in BuildingType]: BuildingData } = {
    house: {
      type: 'house',
      name: '집',
      size: { width: 4, height: 3, depth: 4 },
      requirements: {
        materials: [
          { id: '나무', count: 50 },
          { id: '돌', count: 30 }
        ],
        coins: 1000
      }
    },
    shop: {
      type: 'shop',
      name: '상점',
      size: { width: 5, height: 3, depth: 5 },
      requirements: {
        materials: [
          { id: '나무', count: 100 },
          { id: '돌', count: 50 }
        ],
        coins: 2000
      }
    },
    museum: {
      type: 'museum',
      name: '박물관',
      size: { width: 8, height: 4, depth: 8 },
      requirements: {
        materials: [
          { id: '나무', count: 200 },
          { id: '돌', count: 150 }
        ],
        coins: 5000
      }
    },
    workshop: {
      type: 'workshop',
      name: '작업실',
      size: { width: 4, height: 3, depth: 4 },
      requirements: {
        materials: [
          { id: '나무', count: 80 },
          { id: '돌', count: 40 }
        ],
        coins: 1500
      }
    },
    storage: {
      type: 'storage',
      name: '창고',
      size: { width: 3, height: 2, depth: 3 },
      requirements: {
        materials: [
          { id: '나무', count: 30 },
          { id: '돌', count: 20 }
        ],
        coins: 500
      }
    },
    farm: {
      type: 'farm',
      name: '농장',
      size: { width: 6, height: 2, depth: 6 },
      requirements: {
        materials: [
          { id: '나무', count: 60 },
          { id: '돌', count: 40 }
        ],
        coins: 800
      }
    },
    barn: {
      type: 'barn',
      name: '헛간',
      size: { width: 6, height: 4, depth: 8 },
      requirements: {
        materials: [
          { id: '나무', count: 150 },
          { id: '돌', count: 100 }
        ],
        coins: 3000
      }
    },
    greenhouse: {
      type: 'greenhouse',
      name: '온실',
      size: { width: 5, height: 3, depth: 5 },
      requirements: {
        materials: [
          { id: '나무', count: 120 },
          { id: '돌', count: 80 }
        ],
        coins: 4000
      }
    },
    well: {
      type: 'well',
      name: '우물',
      size: { width: 2, height: 2, depth: 2 },
      requirements: {
        materials: [
          { id: '돌', count: 50 }
        ],
        coins: 600
      }
    },
    fence: {
      type: 'fence',
      name: '울타리',
      size: { width: 2, height: 1, depth: 2 },
      requirements: {
        materials: [
          { id: '나무', count: 20 }
        ],
        coins: 200
      }
    }
  }
  
  constructor(scene: Scene, inventoryManager: InventoryManager) {
    this.scene = scene
    this.inventoryManager = inventoryManager
  }
  
  public getBuildingData(type: BuildingType): BuildingData {
    return this.buildingDatabase[type]
  }
  
  public getAllBuildingTypes(): BuildingType[] {
    return Object.keys(this.buildingDatabase) as BuildingType[]
  }
  
  public canBuild(type: BuildingType, playerCoins: number = 0): { canBuild: boolean; missingMaterials: Array<{ id: string; count: number }>; missingCoins: number } {
    const buildingData = this.buildingDatabase[type]
    const missingMaterials: Array<{ id: string; count: number }> = []
    
    // 재료 확인
    buildingData.requirements.materials.forEach(required => {
      const inventoryItem = this.inventoryManager.list().find(item => item.name === required.id)
      const available = inventoryItem?.count || 0
      if (available < required.count) {
        missingMaterials.push({
          id: required.id,
          count: required.count - available
        })
      }
    })
    
    // 코인 확인
    const missingCoins = Math.max(0, buildingData.requirements.coins - playerCoins)
    
    return {
      canBuild: missingMaterials.length === 0 && missingCoins === 0,
      missingMaterials,
      missingCoins
    }
  }
  
  public canPlaceBuilding(type: BuildingType, position: { x: number; y: number; z: number }, excludeId?: string): boolean {
    const buildingData = this.buildingDatabase[type]
    const newSize = buildingData.size
    
    // 기존 건물과 겹침 체크
    for (const [id, building] of this.buildings) {
      if (excludeId && id === excludeId) continue
      
      const existingSize = this.buildingDatabase[building.type].size
      const margin = 0.5 // 최소 간격
      
      // AABB (Axis-Aligned Bounding Box) 겹침 체크
      const newMinX = position.x - newSize.width / 2 - margin
      const newMaxX = position.x + newSize.width / 2 + margin
      const newMinZ = position.z - newSize.depth / 2 - margin
      const newMaxZ = position.z + newSize.depth / 2 + margin
      
      const existingMinX = building.position.x - existingSize.width / 2
      const existingMaxX = building.position.x + existingSize.width / 2
      const existingMinZ = building.position.z - existingSize.depth / 2
      const existingMaxZ = building.position.z + existingSize.depth / 2
      
      // 겹침 체크
      if (newMinX < existingMaxX && newMaxX > existingMinX &&
          newMinZ < existingMaxZ && newMaxZ > existingMinZ) {
        return false
      }
    }
    
    return true
  }
  
  public buildBuilding(type: BuildingType, position: { x: number; y: number; z: number }, rotation: number = 0, playerCoins: number = 0): { success: boolean; message: string; building?: Building } {
    const buildingData = this.buildingDatabase[type]
    
    // 위치 겹침 체크
    if (!this.canPlaceBuilding(type, position)) {
      return { success: false, message: '이 위치에는 다른 건물이 있어 건설할 수 없습니다.' }
    }
    
    // 건설 가능 여부 확인
    const canBuild = this.canBuild(type, playerCoins)
    if (!canBuild.canBuild) {
      let message = '건설 재료가 부족합니다.'
      if (canBuild.missingMaterials.length > 0) {
        message += ` 부족한 재료: ${canBuild.missingMaterials.map(m => `${m.id} x${m.count}`).join(', ')}`
      }
      if (canBuild.missingCoins > 0) {
        message += ` 부족한 코인: ${canBuild.missingCoins}`
      }
      return { success: false, message }
    }
    
    // 재료 소비
    buildingData.requirements.materials.forEach(required => {
      this.inventoryManager.remove(required.id, required.count)
    })
    
    // 건물 생성
    const buildingId = `building_${type}_${Date.now()}`
    const building: Building = {
      id: buildingId,
      type,
      name: buildingData.name,
      position,
      rotation,
      mesh: this.createBuildingMesh(buildingData, position, rotation),
      requirements: buildingData.requirements,
      built: true
    }
    
    this.buildings.set(buildingId, building)
    
    return {
      success: true,
      message: `${buildingData.name}을(를) 건설했습니다!`,
      building
    }
  }
  
  private createBuildingMesh(buildingData: BuildingData, position: { x: number; y: number; z: number }, rotation: number): Mesh {
    const { width, height, depth } = buildingData.size
    
    // 건물 메시 생성 (박스)
    const building = MeshBuilder.CreateBox(`building_${buildingData.type}`, {
      width: width,
      height: height,
      depth: depth
    }, this.scene)
    
    building.position = new Vector3(position.x, height / 2, position.z)
    building.rotation.y = rotation
    
    // 건물 재질
    const buildingMat = new StandardMaterial(`buildingMat_${buildingData.type}`, this.scene)
    
    // 건물 타입별 색상
    const colors: { [key in BuildingType]: Color3 } = {
      house: new Color3(0.8, 0.6, 0.4),
      shop: new Color3(0.6, 0.8, 0.6),
      museum: new Color3(0.7, 0.7, 0.9),
      workshop: new Color3(0.8, 0.7, 0.5),
      storage: new Color3(0.5, 0.5, 0.5),
      farm: new Color3(0.6, 0.9, 0.6),
      barn: new Color3(0.7, 0.5, 0.3),
      greenhouse: new Color3(0.5, 0.9, 0.5),
      well: new Color3(0.4, 0.4, 0.6),
      fence: new Color3(0.6, 0.4, 0.2)
    }
    
    buildingMat.diffuseColor = colors[buildingData.type]
    building.material = buildingMat
    
    building.isPickable = true
    building.metadata = { type: 'building', buildingType: buildingData.type }
    
    return building
  }
  
  public getBuildings(): Building[] {
    return Array.from(this.buildings.values())
  }
  
  public getBuilding(id: string): Building | undefined {
    return this.buildings.get(id)
  }
  
  public removeBuilding(id: string): boolean {
    const building = this.buildings.get(id)
    if (!building) return false
    
    building.mesh.dispose()
    this.buildings.delete(id)
    
    return true
  }

  // 건물 미리보기 메시 생성
  public createPreviewMesh(type: BuildingType, position: { x: number; y: number; z: number }, rotation: number = 0): Mesh {
    const buildingData = this.buildingDatabase[type]
    const { width, height, depth } = buildingData.size
    
    const preview = MeshBuilder.CreateBox(`preview_${type}`, {
      width: width,
      height: height,
      depth: depth
    }, this.scene)
    
    preview.position = new Vector3(position.x, height / 2, position.z)
    preview.rotation.y = rotation
    
    // 반투명 재질
    const previewMat = new StandardMaterial(`previewMat_${type}`, this.scene)
    previewMat.diffuseColor = new Color3(0, 1, 1) // 시안색
    previewMat.alpha = 0.3 // 반투명
    preview.material = previewMat
    
    // 선택 불가능하게 설정
    preview.isPickable = false
    
    return preview
  }

  // 건물 이동
  public moveBuilding(id: string, newPosition: { x: number; y: number; z: number }): { success: boolean; message: string } {
    const building = this.buildings.get(id)
    if (!building) {
      return { success: false, message: '건물을 찾을 수 없습니다.' }
    }
    
    // 새 위치에서 겹침 체크
    if (!this.canPlaceBuilding(building.type, newPosition, id)) {
      return { success: false, message: '이 위치에는 다른 건물이 있어 이동할 수 없습니다.' }
    }
    
    // 위치 업데이트
    const buildingData = this.buildingDatabase[building.type]
    building.position = newPosition
    building.mesh.position = new Vector3(newPosition.x, buildingData.size.height / 2, newPosition.z)
    
    return { success: true, message: `${building.name}을(를) 이동했습니다.` }
  }
}
