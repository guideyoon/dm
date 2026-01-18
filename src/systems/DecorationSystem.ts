import { Scene, Mesh, Vector3, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core'
import { InventoryManager } from '../InventoryManager'

export type FurnitureType = 'chair' | 'table' | 'bed' | 'lamp' | 'plant' | 'painting' | 'rug'

export interface Furniture {
  id: string
  type: FurnitureType
  name: string
  position: { x: number; y: number; z: number }
  rotation: number
  mesh: Mesh
  theme: 'modern' | 'rustic' | 'cute' | 'elegant'
  themeScore: number
}

export interface FurnitureData {
  type: FurnitureType
  name: string
  size: { width: number; height: number; depth: number }
  theme: 'modern' | 'rustic' | 'cute' | 'elegant'
  themeScore: number
  price: number
}

export class DecorationSystem {
  private scene: Scene
  private inventoryManager: InventoryManager
  private furniture: Map<string, Furniture> = new Map()
  
  private furnitureDatabase: { [key in FurnitureType]: FurnitureData } = {
    chair: {
      type: 'chair',
      name: '의자',
      size: { width: 0.8, height: 1, depth: 0.8 },
      theme: 'modern',
      themeScore: 5,
      price: 200
    },
    table: {
      type: 'table',
      name: '테이블',
      size: { width: 1.5, height: 0.8, depth: 1.5 },
      theme: 'modern',
      themeScore: 10,
      price: 500
    },
    bed: {
      type: 'bed',
      name: '침대',
      size: { width: 2, height: 0.5, depth: 1.5 },
      theme: 'cute',
      themeScore: 20,
      price: 1000
    },
    lamp: {
      type: 'lamp',
      name: '램프',
      size: { width: 0.3, height: 1.2, depth: 0.3 },
      theme: 'elegant',
      themeScore: 8,
      price: 300
    },
    plant: {
      type: 'plant',
      name: '화분',
      size: { width: 0.5, height: 0.8, depth: 0.5 },
      theme: 'cute',
      themeScore: 5,
      price: 150
    },
    painting: {
      type: 'painting',
      name: '그림',
      size: { width: 0.1, height: 1, depth: 1 },
      theme: 'elegant',
      themeScore: 15,
      price: 800
    },
    rug: {
      type: 'rug',
      name: '카펫',
      size: { width: 2, height: 0.1, depth: 2 },
      theme: 'rustic',
      themeScore: 12,
      price: 600
    }
  }
  
  constructor(scene: Scene, inventoryManager: InventoryManager) {
    this.scene = scene
    this.inventoryManager = inventoryManager
  }
  
  public getFurnitureData(type: FurnitureType): FurnitureData {
    return this.furnitureDatabase[type]
  }
  
  public getAllFurnitureTypes(): FurnitureType[] {
    return Object.keys(this.furnitureDatabase) as FurnitureType[]
  }
  
  public placeFurniture(type: FurnitureType, position: { x: number; y: number; z: number }, rotation: number = 0): { success: boolean; message: string; furniture?: Furniture } {
    const furnitureData = this.furnitureDatabase[type]
    
    // 가구 생성
    const furnitureId = `furniture_${type}_${Date.now()}`
    const furniture: Furniture = {
      id: furnitureId,
      type,
      name: furnitureData.name,
      position,
      rotation,
      mesh: this.createFurnitureMesh(furnitureData, position, rotation),
      theme: furnitureData.theme,
      themeScore: furnitureData.themeScore
    }
    
    this.furniture.set(furnitureId, furniture)
    
    return {
      success: true,
      message: `${furnitureData.name}을(를) 배치했습니다!`,
      furniture
    }
  }
  
  private createFurnitureMesh(furnitureData: FurnitureData, position: { x: number; y: number; z: number }, rotation: number): Mesh {
    const { width, height, depth } = furnitureData.size
    
    // 가구 메시 생성
    let furniture: Mesh
    
    if (furnitureData.type === 'lamp') {
      // 램프: 원통 + 구체
      const base = MeshBuilder.CreateCylinder(`furniture_base_${furnitureData.type}`, { height: 0.2, diameter: 0.2 }, this.scene)
      const pole = MeshBuilder.CreateCylinder(`furniture_pole_${furnitureData.type}`, { height: height - 0.2, diameter: 0.1 }, this.scene)
      pole.position.y = 0.1 + (height - 0.2) / 2
      const shade = MeshBuilder.CreateSphere(`furniture_shade_${furnitureData.type}`, { diameter: 0.3 }, this.scene)
      shade.position.y = height - 0.1
      
      furniture = MeshBuilder.CreateBox(`furniture_${furnitureData.type}`, { width: 0.1, height: 0.1, depth: 0.1 }, this.scene)
      base.parent = furniture
      pole.parent = furniture
      shade.parent = furniture
    } else if (furnitureData.type === 'plant') {
      // 화분: 원통 + 구체 (잎)
      const pot = MeshBuilder.CreateCylinder(`furniture_pot_${furnitureData.type}`, { height: 0.3, diameter: 0.4 }, this.scene)
      const leaves = MeshBuilder.CreateSphere(`furniture_leaves_${furnitureData.type}`, { diameter: 0.5 }, this.scene)
      leaves.position.y = 0.3
      
      furniture = MeshBuilder.CreateBox(`furniture_${furnitureData.type}`, { width: 0.1, height: 0.1, depth: 0.1 }, this.scene)
      pot.parent = furniture
      leaves.parent = furniture
    } else if (furnitureData.type === 'painting') {
      // 그림: 평면
      furniture = MeshBuilder.CreatePlane(`furniture_${furnitureData.type}`, { width: depth, height: height }, this.scene)
    } else {
      // 기본: 박스
      furniture = MeshBuilder.CreateBox(`furniture_${furnitureData.type}`, {
        width: width,
        height: height,
        depth: depth
      }, this.scene)
    }
    
    furniture.position = new Vector3(position.x, height / 2, position.z)
    furniture.rotation.y = rotation
    
    // 가구 재질
    const furnitureMat = new StandardMaterial(`furnitureMat_${furnitureData.type}`, this.scene)
    
    // 테마별 색상
    const themeColors: { [key: string]: Color3 } = {
      modern: new Color3(0.9, 0.9, 0.9),
      rustic: new Color3(0.6, 0.4, 0.2),
      cute: new Color3(1, 0.8, 0.9),
      elegant: new Color3(0.7, 0.7, 0.8)
    }
    
    furnitureMat.diffuseColor = themeColors[furnitureData.theme] || new Color3(0.8, 0.8, 0.8)
    furniture.material = furnitureMat
    
    furniture.isPickable = true
    furniture.metadata = { type: 'furniture', furnitureType: furnitureData.type }
    
    return furniture
  }
  
  public getFurniture(): Furniture[] {
    return Array.from(this.furniture.values())
  }
  
  public getFurnitureByTheme(theme: 'modern' | 'rustic' | 'cute' | 'elegant'): Furniture[] {
    return this.getFurniture().filter(f => f.theme === theme)
  }
  
  public getThemeScore(theme: 'modern' | 'rustic' | 'cute' | 'elegant'): number {
    return this.getFurnitureByTheme(theme).reduce((sum, f) => sum + f.themeScore, 0)
  }
  
  // 인테리어 평가 시스템
  public evaluateInterior(roomFurniture: Furniture[]): {
    totalScore: number
    themeScores: { [theme: string]: number }
    dominantTheme: string
    grade: 'C' | 'B' | 'A' | 'S'
    suggestions: string[]
  } {
    if (roomFurniture.length === 0) {
      return {
        totalScore: 0,
        themeScores: {},
        dominantTheme: 'none',
        grade: 'C',
        suggestions: ['가구를 배치해보세요!']
      }
    }
    
    // 테마별 점수 계산
    const themeScores: { [theme: string]: number } = {
      modern: 0,
      rustic: 0,
      cute: 0,
      elegant: 0
    }
    
    roomFurniture.forEach(furniture => {
      themeScores[furniture.theme] += furniture.themeScore
    })
    
    // 주요 테마 결정
    const dominantTheme = Object.keys(themeScores).reduce((a, b) => 
      themeScores[a] > themeScores[b] ? a : b
    )
    
    // 총 점수 계산
    const totalScore = Object.values(themeScores).reduce((sum, score) => sum + score, 0)
    
    // 등급 결정
    let grade: 'C' | 'B' | 'A' | 'S' = 'C'
    if (totalScore >= 100) grade = 'S'
    else if (totalScore >= 70) grade = 'A'
    else if (totalScore >= 40) grade = 'B'
    
    // 테마 일치도 계산 (주요 테마의 점수가 전체의 60% 이상이면 보너스)
    const themeConsistency = themeScores[dominantTheme] / totalScore
    if (themeConsistency >= 0.6 && totalScore >= 50) {
      if (grade === 'A') grade = 'S'
      else if (grade === 'B') grade = 'A'
    }
    
    // 제안사항 생성
    const suggestions: string[] = []
    if (totalScore < 40) {
      suggestions.push('더 많은 가구를 배치해보세요!')
    }
    if (themeConsistency < 0.5) {
      suggestions.push(`${dominantTheme} 테마의 가구를 더 추가하면 더 좋아 보일 거예요!`)
    }
    if (roomFurniture.length < 5) {
      suggestions.push('다양한 가구를 배치하면 더 풍부한 인테리어가 됩니다!')
    }
    if (suggestions.length === 0) {
      suggestions.push('완벽한 인테리어네요!')
    }
    
    return {
      totalScore,
      themeScores,
      dominantTheme,
      grade,
      suggestions
    }
  }
  
  public removeFurniture(id: string): boolean {
    const furniture = this.furniture.get(id)
    if (!furniture) return false
    
    furniture.mesh.dispose()
    this.furniture.delete(id)
    
    return true
  }
  
  // 가구 ID로 가구 찾기
  public getFurnitureById(id: string): Furniture | undefined {
    return this.furniture.get(id)
  }
  
  // 메시로 가구 찾기
  public getFurnitureByMesh(mesh: Mesh): Furniture | undefined {
    for (const furniture of this.furniture.values()) {
      if (furniture.mesh === mesh) {
        return furniture
      }
    }
    return undefined
  }
  
  // 가구 사용 가능 여부 확인
  public canUseFurniture(furniture: Furniture): boolean {
    // 침대와 의자는 사용 가능
    return furniture.type === 'bed' || furniture.type === 'chair'
  }
  
  // 가구 이동
  public moveFurniture(id: string, newPosition: { x: number; y: number; z: number }): boolean {
    const furniture = this.furniture.get(id)
    if (!furniture) return false
    
    const furnitureData = this.furnitureDatabase[furniture.type]
    const height = furnitureData.size.height
    
    // 메시 위치 업데이트
    furniture.mesh.position = new Vector3(newPosition.x, height / 2, newPosition.z)
    furniture.position = newPosition
    
    return true
  }
  
  // 가구 회전 (90도 단위)
  public rotateFurniture(id: string, rotation: number): boolean {
    const furniture = this.furniture.get(id)
    if (!furniture) return false
    
    // 회전 값을 0~360도 범위로 정규화
    let normalizedRotation = rotation % (Math.PI * 2)
    if (normalizedRotation < 0) {
      normalizedRotation += Math.PI * 2
    }
    
    // 90도 단위로 스냅 (0, 90, 180, 270도)
    const snapAngle = Math.PI / 2
    normalizedRotation = Math.round(normalizedRotation / snapAngle) * snapAngle
    
    // 메시 회전 업데이트
    furniture.mesh.rotation.y = normalizedRotation
    furniture.rotation = normalizedRotation
    
    return true
  }
  
  // 가구 90도 회전 (편의 메서드)
  public rotateFurniture90(id: string, clockwise: boolean = true): boolean {
    const furniture = this.furniture.get(id)
    if (!furniture) return false
    
    const currentRotation = furniture.rotation
    const rotationStep = Math.PI / 2 // 90도
    const newRotation = clockwise ? currentRotation + rotationStep : currentRotation - rotationStep
    
    return this.rotateFurniture(id, newRotation)
  }
}
