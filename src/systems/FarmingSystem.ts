import { Scene, Mesh, Vector3, MeshBuilder, StandardMaterial, Color3, PickingInfo } from '@babylonjs/core'
import { InventoryManager } from '../InventoryManager'
import { TimeSystem, Season } from './TimeSystem'

export type CropType = 'turnip' | 'carrot' | 'potato' | 'tomato' | 'corn'

export type CropStage = 'seed' | 'sprout' | 'growing' | 'mature' | 'withered'

export interface Crop {
  id: string
  type: CropType
  stage: CropStage
  plantedDate: number // 타임스탬프
  watered: boolean
  growthProgress: number // 0-1
  position: { x: number; y: number; z: number }
  mesh?: Mesh
}

export interface FarmPlot {
  id: string
  position: { x: number; y: number; z: number }
  crop: Crop | null
  mesh: Mesh
}

export interface CropData {
  type: CropType
  name: string
  seedId: string
  growthTime: number // 게임 시간 (시간 단위)
  stages: {
    seed: number // 성장 단계별 시간 비율
    sprout: number
    growing: number
    mature: number
  }
  harvestYield: { min: number; max: number }
  price: number
  season: Season[]
  waterRequired: boolean
}

export class FarmingSystem {
  private scene: Scene
  private inventoryManager: InventoryManager
  private timeSystem: TimeSystem | null = null
  private farmPlots: Map<string, FarmPlot> = new Map()
  
  private cropDatabase: { [key in CropType]: CropData } = {
    turnip: {
      type: 'turnip',
      name: '순무',
      seedId: 'seed_turnip',
      growthTime: 4, // 4시간
      stages: {
        seed: 0.1,
        sprout: 0.3,
        growing: 0.6,
        mature: 1.0
      },
      harvestYield: { min: 1, max: 3 },
      price: 50,
      season: ['spring', 'autumn'],
      waterRequired: true
    },
    carrot: {
      type: 'carrot',
      name: '당근',
      seedId: 'seed_carrot',
      growthTime: 3,
      stages: {
        seed: 0.1,
        sprout: 0.25,
        growing: 0.5,
        mature: 1.0
      },
      harvestYield: { min: 1, max: 2 },
      price: 40,
      season: ['spring', 'autumn'],
      waterRequired: true
    },
    potato: {
      type: 'potato',
      name: '감자',
      seedId: 'seed_potato',
      growthTime: 5,
      stages: {
        seed: 0.15,
        sprout: 0.35,
        growing: 0.7,
        mature: 1.0
      },
      harvestYield: { min: 2, max: 4 },
      price: 30,
      season: ['spring', 'summer'],
      waterRequired: true
    },
    tomato: {
      type: 'tomato',
      name: '토마토',
      seedId: 'seed_tomato',
      growthTime: 6,
      stages: {
        seed: 0.1,
        sprout: 0.3,
        growing: 0.6,
        mature: 1.0
      },
      harvestYield: { min: 2, max: 5 },
      price: 60,
      season: ['summer'],
      waterRequired: true
    },
    corn: {
      type: 'corn',
      name: '옥수수',
      seedId: 'seed_corn',
      growthTime: 8,
      stages: {
        seed: 0.1,
        sprout: 0.25,
        growing: 0.5,
        mature: 1.0
      },
      harvestYield: { min: 3, max: 6 },
      price: 80,
      season: ['summer'],
      waterRequired: true
    }
  }
  
  constructor(scene: Scene, inventoryManager: InventoryManager) {
    this.scene = scene
    this.inventoryManager = inventoryManager
    this.createFarmPlots()
  }
  
  public setTimeSystem(timeSystem: TimeSystem) {
    this.timeSystem = timeSystem
  }
  
  private createFarmPlots() {
    // 농장 영역 생성 (5x5 그리드)
    const farmSize = 5
    const spacing = 2
    const startX = -10
    const startZ = -10
    
    for (let x = 0; x < farmSize; x++) {
      for (let z = 0; z < farmSize; z++) {
        const plotX = startX + x * spacing
        const plotZ = startZ + z * spacing
        const plotId = `farm_plot_${x}_${z}`
        
        // 밭 타일 생성
        const plotMesh = MeshBuilder.CreateGround(plotId, { width: 1.5, height: 1.5 }, this.scene)
        plotMesh.position = new Vector3(plotX, 0.01, plotZ)
        
        const plotMat = new StandardMaterial(`plotMat_${x}_${z}`, this.scene)
        plotMat.diffuseColor = new Color3(0.6, 0.4, 0.2) // 갈색 흙
        plotMesh.material = plotMat
        plotMesh.isPickable = true
        plotMesh.metadata = { type: 'farmPlot', plotId: plotId }
        
        this.farmPlots.set(plotId, {
          id: plotId,
          position: { x: plotX, y: 0, z: plotZ },
          crop: null,
          mesh: plotMesh
        })
      }
    }
  }
  
  public isFarmPlot(mesh: Mesh | null): boolean {
    if (!mesh) return false
    return mesh.metadata?.type === 'farmPlot'
  }
  
  public getFarmPlot(mesh: Mesh): FarmPlot | undefined {
    const plotId = mesh.metadata?.plotId
    if (!plotId) return undefined
    return this.farmPlots.get(plotId)
  }
  
  public plantSeed(plotId: string, seedId: string): boolean {
    const plot = this.farmPlots.get(plotId)
    if (!plot) {
      return false
    }
    
    // 이미 작물이 심어져 있는지 확인
    if (plot.crop) {
      return false
    }
    
    // 씨앗이 인벤토리에 있는지 확인
    const inventoryItem = this.inventoryManager.list().find(item => item.name === seedId)
    if (!inventoryItem || inventoryItem.count < 1) {
      return false
    }
    
    // 씨앗 타입 확인
    const cropType = this.getCropTypeFromSeed(seedId)
    if (!cropType) {
      return false
    }
    
    // 계절 확인
    if (this.timeSystem) {
      const season = this.timeSystem.getSeason()
      const cropData = this.cropDatabase[cropType]
      if (!cropData.season.includes(season)) {
        return false
      }
    }
    
    // 씨앗 제거
    this.inventoryManager.remove(seedId, 1)
    
    // 작물 생성
    const crop: Crop = {
      id: `crop_${plotId}_${Date.now()}`,
      type: cropType,
      stage: 'seed',
      plantedDate: this.timeSystem ? this.timeSystem.getTime().day * 24 + this.timeSystem.getTime().hour : Date.now(),
      watered: false,
      growthProgress: 0,
      position: plot.position
    }
    
    // 작물 메시 생성
    this.createCropMesh(crop, plot)
    
    plot.crop = crop
    
    return true
  }
  
  private getCropTypeFromSeed(seedId: string): CropType | null {
    const mapping: { [key: string]: CropType } = {
      'seed_turnip': 'turnip',
      'seed_carrot': 'carrot',
      'seed_potato': 'potato',
      'seed_tomato': 'tomato',
      'seed_corn': 'corn'
    }
    return mapping[seedId] || null
  }
  
  // 작물 타입을 아이템 ID로 변환 (한글 이름)
  private getCropItemId(cropType: CropType): string {
    const mapping: { [key in CropType]: string } = {
      'turnip': '순무',
      'carrot': '당근',
      'potato': '감자',
      'tomato': '토마토',
      'corn': '옥수수'
    }
    return mapping[cropType]
  }
  
  private createCropMesh(crop: Crop, plot: FarmPlot) {
    const cropData = this.cropDatabase[crop.type]
    const pos = plot.position
    
    // 작물 단계에 따른 메시 생성
    let cropMesh: Mesh
    
    if (crop.stage === 'seed') {
      // 씨앗: 작은 구체
      cropMesh = MeshBuilder.CreateSphere(`crop_${crop.id}`, { diameter: 0.1 }, this.scene)
      const seedMat = new StandardMaterial(`seedMat_${crop.id}`, this.scene)
      seedMat.diffuseColor = new Color3(0.3, 0.2, 0.1)
      cropMesh.material = seedMat
    } else if (crop.stage === 'sprout') {
      // 새싹: 작은 원통
      cropMesh = MeshBuilder.CreateCylinder(`crop_${crop.id}`, { height: 0.2, diameter: 0.1 }, this.scene)
      const sproutMat = new StandardMaterial(`sproutMat_${crop.id}`, this.scene)
      sproutMat.diffuseColor = new Color3(0.2, 0.6, 0.2)
      cropMesh.material = sproutMat
    } else if (crop.stage === 'growing') {
      // 성장 중: 중간 크기 원통
      cropMesh = MeshBuilder.CreateCylinder(`crop_${crop.id}`, { height: 0.4, diameter: 0.15 }, this.scene)
      const growingMat = new StandardMaterial(`growingMat_${crop.id}`, this.scene)
      growingMat.diffuseColor = new Color3(0.2, 0.7, 0.2)
      cropMesh.material = growingMat
    } else if (crop.stage === 'mature') {
      // 성숙: 큰 원통 + 잎사귀
      cropMesh = MeshBuilder.CreateCylinder(`crop_${crop.id}`, { height: 0.6, diameter: 0.2 }, this.scene)
      const matureMat = new StandardMaterial(`matureMat_${crop.id}`, this.scene)
      matureMat.diffuseColor = new Color3(0.3, 0.8, 0.3)
      cropMesh.material = matureMat
      
      // 잎사귀 추가
      const leaf1 = MeshBuilder.CreateSphere(`leaf1_${crop.id}`, { diameter: 0.3 }, this.scene)
      leaf1.position = new Vector3(0.2, 0.3, 0)
      const leafMat = new StandardMaterial(`leafMat_${crop.id}`, this.scene)
      leafMat.diffuseColor = new Color3(0.2, 0.7, 0.2)
      leaf1.material = leafMat
      leaf1.parent = cropMesh
      
      const leaf2 = MeshBuilder.CreateSphere(`leaf2_${crop.id}`, { diameter: 0.3 }, this.scene)
      leaf2.position = new Vector3(-0.2, 0.3, 0)
      leaf2.material = leafMat
      leaf2.parent = cropMesh
    } else {
      // 시들기: 갈색 원통 (낮고)
      cropMesh = MeshBuilder.CreateCylinder(`crop_${crop.id}`, { height: 0.3, diameter: 0.15 }, this.scene)
      const witheredMat = new StandardMaterial(`witheredMat_${crop.id}`, this.scene)
      witheredMat.diffuseColor = new Color3(0.4, 0.3, 0.2) // 갈색
      cropMesh.material = witheredMat
    }
    
    cropMesh.position = new Vector3(pos.x, pos.y + 0.1, pos.z)
    crop.mesh = cropMesh
  }
  
  public waterCrop(plotId: string): boolean {
    const plot = this.farmPlots.get(plotId)
    if (!plot || !plot.crop) {
      return false
    }
    
    const crop = plot.crop
    crop.watered = true
    
    // 물을 주면 성장 속도가 20% 빨라지고 수확량이 30% 증가함
    // 이는 update()와 harvestCrop() 메서드에서 적용됨
    
    return true
  }
  
  public harvestCrop(plotId: string): { success: boolean; items: Array<{ id: string; count: number }> } {
    const plot = this.farmPlots.get(plotId)
    if (!plot || !plot.crop) {
      return { success: false, items: [] }
    }
    
    const crop = plot.crop
    
    // 성숙한 작물만 수확 가능 (시든 작물은 수확 불가)
    if (crop.stage !== 'mature') {
      return { success: false, items: [] }
    }
    
    const cropData = this.cropDatabase[crop.type]
    
    // 수확량 계산 (물을 주면 수확량 증가)
    let yieldMultiplier = 1.0
    if (crop.watered) {
      yieldMultiplier = 1.3 // 물을 주면 수확량 30% 증가
    }
    
    const baseYield = cropData.harvestYield.min + 
      Math.random() * (cropData.harvestYield.max - cropData.harvestYield.min)
    const yieldCount = Math.floor(baseYield * yieldMultiplier)
    
    // 작물 아이템 추가 (한글 이름으로 변환)
    const cropItemId = this.getCropItemId(crop.type)
    this.inventoryManager.add(cropItemId, yieldCount)
    
    // 작물 메시 제거
    if (crop.mesh) {
      crop.mesh.dispose()
    }
    
    // 작물 제거
    plot.crop = null
    
    return {
      success: true,
      items: [{ id: cropItemId, count: yieldCount }]
    }
  }
  
  public update() {
    if (!this.timeSystem) return
    
    const gameTime = this.timeSystem.getTime()
    const currentGameHour = gameTime.day * 24 + gameTime.hour
    
    this.farmPlots.forEach((plot, plotId) => {
      if (!plot.crop) return
      
      const crop = plot.crop
      const cropData = this.cropDatabase[crop.type]
      
      // 성장 시간 계산
      const hoursSincePlanted = currentGameHour - crop.plantedDate
      
      // 물을 주면 성장 속도 20% 증가
      const waterBonus = crop.watered ? 1.2 : 1.0
      const adjustedGrowthTime = cropData.growthTime / waterBonus
      
      const growthProgress = Math.min(1.0, hoursSincePlanted / adjustedGrowthTime)
      crop.growthProgress = growthProgress
      
      // 성장 단계 업데이트
      let newStage: CropStage = crop.stage
      
      if (growthProgress >= cropData.stages.mature) {
        newStage = 'mature'
      } else if (growthProgress >= cropData.stages.growing) {
        newStage = 'growing'
      } else if (growthProgress >= cropData.stages.sprout) {
        newStage = 'sprout'
      } else {
        newStage = 'seed'
      }
      
      // 단계가 변경되면 메시 업데이트
      if (newStage !== crop.stage && newStage !== 'withered') {
        if (crop.mesh) {
          crop.mesh.dispose()
        }
        crop.stage = newStage
        this.createCropMesh(crop, plot)
      }
      
      // 물이 필요한 작물은 물을 주지 않으면 시들 수 있음
      if (cropData.waterRequired && !crop.watered && growthProgress > 0.5) {
        // 24시간 동안 물을 주지 않으면 시들기 시작
        const hoursWithoutWater = hoursSincePlanted - 12 // 12시간 후부터 물 필요
        if (hoursWithoutWater > 24 && crop.stage !== 'withered') {
          // 시들기 단계로 변경
          if (crop.mesh) {
            crop.mesh.dispose()
          }
          crop.stage = 'withered'
          this.createCropMesh(crop, plot)
        }
      }
    })
  }
  
  public getFarmPlots(): FarmPlot[] {
    return Array.from(this.farmPlots.values())
  }
  
  public getCropData(type: CropType): CropData {
    return this.cropDatabase[type]
  }
  
  public getAllCropTypes(): CropType[] {
    return Object.keys(this.cropDatabase) as CropType[]
  }
}
