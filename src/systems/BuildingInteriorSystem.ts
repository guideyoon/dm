import { Scene, Mesh, Vector3, MeshBuilder, StandardMaterial, Color3, Camera, ArcRotateCamera, HemisphericLight, DirectionalLight } from '@babylonjs/core'
import { DecorationSystem } from './DecorationSystem'

export interface Wallpaper {
  id: string
  name: string
  color: Color3
  price?: number
}

export interface Flooring {
  id: string
  name: string
  color: Color3
  price?: number
}

export interface InteriorRoom {
  id: string
  buildingId: string
  name: string
  size: { width: number; height: number; depth: number }
  walls: Mesh[]
  floor: Mesh
  ceiling: Mesh
  furniture: any[] // DecorationSystem의 Furniture 참조
  wallpaperId: string
  flooringId: string
}

export class BuildingInteriorSystem {
  private scene: Scene
  private exteriorScene: Scene // 외부 씬 (원래 게임 씬)
  private interiorScene: Scene | null = null // 내부 씬
  private currentInterior: InteriorRoom | null = null
  private decorationSystem: DecorationSystem | null = null
  private camera: ArcRotateCamera | null = null
  private isInside: boolean = false
  
  // 벽지/바닥재 옵션
  private wallpapers: Map<string, Wallpaper> = new Map()
  private floorings: Map<string, Flooring> = new Map()
  
  constructor(scene: Scene) {
    this.scene = scene
    this.exteriorScene = scene
    this.initializeWallpapersAndFloorings()
  }
  
  // 벽지/바닥재 초기화
  private initializeWallpapersAndFloorings() {
    // 벽지 옵션
    const wallpaperList: Wallpaper[] = [
      { id: 'wall_white', name: '흰 벽지', color: new Color3(0.95, 0.95, 0.9), price: 0 },
      { id: 'wall_beige', name: '베이지 벽지', color: new Color3(0.9, 0.85, 0.8), price: 500 },
      { id: 'wall_blue', name: '파란 벽지', color: new Color3(0.7, 0.8, 0.9), price: 800 },
      { id: 'wall_pink', name: '분홍 벽지', color: new Color3(0.95, 0.85, 0.9), price: 800 },
      { id: 'wall_green', name: '초록 벽지', color: new Color3(0.8, 0.9, 0.8), price: 800 },
      { id: 'wall_purple', name: '보라 벽지', color: new Color3(0.85, 0.8, 0.9), price: 1000 },
      { id: 'wall_gold', name: '골드 벽지', color: new Color3(0.95, 0.85, 0.6), price: 2000 }
    ]
    
    wallpaperList.forEach(wp => {
      this.wallpapers.set(wp.id, wp)
    })
    
    // 바닥재 옵션
    const flooringList: Flooring[] = [
      { id: 'floor_wood', name: '나무 바닥', color: new Color3(0.8, 0.7, 0.6), price: 0 },
      { id: 'floor_dark_wood', name: '어두운 나무 바닥', color: new Color3(0.5, 0.4, 0.3), price: 800 },
      { id: 'floor_tile', name: '타일 바닥', color: new Color3(0.85, 0.85, 0.85), price: 1000 },
      { id: 'floor_carpet_red', name: '빨간 카펫', color: new Color3(0.8, 0.3, 0.3), price: 1200 },
      { id: 'floor_carpet_blue', name: '파란 카펫', color: new Color3(0.3, 0.4, 0.7), price: 1200 },
      { id: 'floor_marble', name: '대리석 바닥', color: new Color3(0.9, 0.9, 0.9), price: 2500 },
      { id: 'floor_gold', name: '골드 바닥', color: new Color3(0.95, 0.85, 0.6), price: 5000 }
    ]
    
    flooringList.forEach(fl => {
      this.floorings.set(fl.id, fl)
    })
  }
  
  // 벽지 목록 가져오기
  public getWallpapers(): Wallpaper[] {
    return Array.from(this.wallpapers.values())
  }
  
  // 바닥재 목록 가져오기
  public getFloorings(): Flooring[] {
    return Array.from(this.floorings.values())
  }
  
  public setDecorationSystem(decorationSystem: DecorationSystem) {
    this.decorationSystem = decorationSystem
  }
  
  // 건물 입장
  public enterBuilding(buildingId: string, buildingType: string): boolean {
    if (this.isInside) {
      console.warn('이미 건물 내부에 있습니다.')
      return false
    }
    
    // 내부 씬 생성 (또는 재사용)
    if (!this.interiorScene) {
      this.createInteriorScene()
    }
    
    // 내부 방 생성
    const room = this.createRoom(buildingId, buildingType)
    this.currentInterior = room
    
    // 카메라를 내부 씬으로 전환
    this.switchToInteriorCamera()
    
    this.isInside = true
    console.log(`건물 입장: ${buildingType} (${buildingId})`)
    return true
  }
  
  // 건물 나가기
  public exitBuilding(): boolean {
    if (!this.isInside || !this.interiorScene) {
      return false
    }
    
    // 카메라를 외부 씬으로 복원
    this.switchToExteriorCamera()
    
    this.currentInterior = null
    this.isInside = false
    console.log('건물 나가기')
    return true
  }
  
  // 내부 씬 생성
  private createInteriorScene() {
    // 현재는 같은 씬을 재사용하지만, 나중에 별도 씬으로 분리 가능
    this.interiorScene = this.exteriorScene
  }
  
  // 방 생성
  private createRoom(buildingId: string, buildingType: string): InteriorRoom {
    const roomId = `room_${buildingId}_${Date.now()}`
    const size = this.getRoomSizeForBuildingType(buildingType)
    
    // 바닥 생성
    const floor = MeshBuilder.CreateGround(`floor_${roomId}`, {
      width: size.width,
      height: size.depth
    }, this.scene)
    floor.position = new Vector3(0, 0, 0)
    const floorMat = new StandardMaterial(`floorMat_${roomId}`, this.scene)
    floorMat.diffuseColor = new Color3(0.8, 0.7, 0.6) // 나무 바닥색
    floor.material = floorMat
    
    // 벽 생성 (간단히 4개 박스)
    const walls: Mesh[] = []
    const wallThickness = 0.1
    const wallHeight = size.height
    
    // 앞벽 (문이 있을 곳 - 건너뛰기)
    // 뒤벽
    const backWall = MeshBuilder.CreateBox(`backWall_${roomId}`, {
      width: size.width,
      height: wallHeight,
      depth: wallThickness
    }, this.scene)
    backWall.position = new Vector3(0, wallHeight / 2, -size.depth / 2)
    const wallMat = new StandardMaterial(`wallMat_${roomId}`, this.scene)
    wallMat.diffuseColor = new Color3(0.95, 0.95, 0.9) // 흰색 벽
    backWall.material = wallMat
    walls.push(backWall)
    
    // 왼쪽 벽
    const leftWall = MeshBuilder.CreateBox(`leftWall_${roomId}`, {
      width: wallThickness,
      height: wallHeight,
      depth: size.depth
    }, this.scene)
    leftWall.position = new Vector3(-size.width / 2, wallHeight / 2, 0)
    leftWall.material = wallMat
    walls.push(leftWall)
    
    // 오른쪽 벽
    const rightWall = MeshBuilder.CreateBox(`rightWall_${roomId}`, {
      width: wallThickness,
      height: wallHeight,
      depth: size.depth
    }, this.scene)
    rightWall.position = new Vector3(size.width / 2, wallHeight / 2, 0)
    rightWall.material = wallMat
    walls.push(rightWall)
    
    // 천장 생성
    const ceiling = MeshBuilder.CreateBox(`ceiling_${roomId}`, {
      width: size.width,
      height: 0.1,
      depth: size.depth
    }, this.scene)
    ceiling.position = new Vector3(0, wallHeight, 0)
    const ceilingMat = new StandardMaterial(`ceilingMat_${roomId}`, this.scene)
    ceilingMat.diffuseColor = new Color3(0.9, 0.9, 0.85)
    ceiling.material = ceilingMat
    
    const room: InteriorRoom = {
      id: roomId,
      buildingId: buildingId,
      name: `${buildingType} 내부`,
      size: size,
      walls: walls,
      floor: floor,
      ceiling: ceiling,
      furniture: [],
      wallpaperId: 'wall_white',
      flooringId: 'floor_wood'
    }
    
    return room
  }
  
  // 건물 타입별 방 크기
  private getRoomSizeForBuildingType(buildingType: string): { width: number; height: number; depth: number } {
    const sizes: { [key: string]: { width: number; height: number; depth: number } } = {
      'house': { width: 6, height: 3, depth: 6 },
      'shop': { width: 8, height: 3, depth: 8 },
      'museum': { width: 12, height: 4, depth: 12 },
      'workshop': { width: 6, height: 3, depth: 6 },
      'storage': { width: 4, height: 2.5, depth: 4 }
    }
    return sizes[buildingType] || { width: 6, height: 3, depth: 6 }
  }
  
  // 내부 카메라로 전환
  private switchToInteriorCamera() {
    // 카메라는 외부 씬과 공유되므로, 위치만 조정
    // 실제로는 내부 씬용 별도 카메라를 생성할 수 있음
    const cameras = this.scene.cameras
    if (cameras.length > 0 && cameras[0] instanceof ArcRotateCamera) {
      const cam = cameras[0] as ArcRotateCamera
      // 카메라를 내부 중앙으로 이동
      cam.setTarget(Vector3.Zero())
      cam.radius = 8 // 내부에 맞게 거리 조정
      cam.alpha = Math.PI / 4 // 각도 조정
      cam.beta = Math.PI / 3
    }
  }
  
  // 외부 카메라로 복원
  private switchToExteriorCamera() {
    // 외부 카메라 위치로 복원 (플레이어 위치 기준)
    const cameras = this.scene.cameras
    if (cameras.length > 0 && cameras[0] instanceof ArcRotateCamera) {
      const cam = cameras[0] as ArcRotateCamera
      // 외부 씬 위치로 복원 (실제 플레이어 위치를 사용해야 함)
      // 이 부분은 main.ts에서 카메라를 참조하도록 수정 필요
    }
  }
  
  // 현재 내부에 있는지 확인
  public isInsideBuilding(): boolean {
    return this.isInside
  }
  
  // 현재 방 정보 가져오기
  public getCurrentRoom(): InteriorRoom | null {
    return this.currentInterior
  }
  
  // 인테리어 평가
  public evaluateInterior(): any {
    if (!this.currentInterior || !this.decorationSystem) {
      return null
    }
    
    // 방의 가구 가져오기
    const roomFurniture = this.currentInterior.furniture.map((furnitureId: string) => {
      return this.decorationSystem.getFurnitureById(furnitureId)
    }).filter((f: any) => f !== undefined)
    
    // 인테리어 평가 실행
    return this.decorationSystem.evaluateInterior(roomFurniture)
  }
  
  // 방의 가구 목록 업데이트 (가구 배치 시 호출)
  public addFurnitureToRoom(furnitureId: string) {
    if (!this.currentInterior) return
    
    if (!this.currentInterior.furniture.includes(furnitureId)) {
      this.currentInterior.furniture.push(furnitureId)
    }
  }
  
  // 방의 가구 제거
  public removeFurnitureFromRoom(furnitureId: string) {
    if (!this.currentInterior) return
    
    const index = this.currentInterior.furniture.indexOf(furnitureId)
    if (index > -1) {
      this.currentInterior.furniture.splice(index, 1)
    }
  }
  
  // 벽지 변경
  public changeWallpaper(roomId: string, wallpaperId: string): boolean {
    const room = this.currentInterior
    if (!room || room.id !== roomId) {
      console.warn('현재 방을 찾을 수 없습니다.')
      return false
    }
    
    const wallpaper = this.wallpapers.get(wallpaperId)
    if (!wallpaper) {
      console.warn(`벽지 '${wallpaperId}'를 찾을 수 없습니다.`)
      return false
    }
    
    // 모든 벽에 새 벽지 적용
    room.walls.forEach(wall => {
      const mat = wall.material as StandardMaterial
      if (mat) {
        mat.diffuseColor = wallpaper.color.clone()
      }
    })
    
    room.wallpaperId = wallpaperId
    console.log(`벽지 변경: ${wallpaper.name}`)
    return true
  }
  
  // 바닥재 변경
  public changeFlooring(roomId: string, flooringId: string): boolean {
    const room = this.currentInterior
    if (!room || room.id !== roomId) {
      console.warn('현재 방을 찾을 수 없습니다.')
      return false
    }
    
    const flooring = this.floorings.get(flooringId)
    if (!flooring) {
      console.warn(`바닥재 '${flooringId}'를 찾을 수 없습니다.`)
      return false
    }
    
    // 바닥에 새 바닥재 적용
    const mat = room.floor.material as StandardMaterial
    if (mat) {
      mat.diffuseColor = flooring.color.clone()
    }
    
    room.flooringId = flooringId
    console.log(`바닥재 변경: ${flooring.name}`)
    return true
  }
  
  // 현재 벽지 가져오기
  public getCurrentWallpaper(): Wallpaper | null {
    if (!this.currentInterior) return null
    return this.wallpapers.get(this.currentInterior.wallpaperId) || null
  }
  
  // 현재 바닥재 가져오기
  public getCurrentFlooring(): Flooring | null {
    if (!this.currentInterior) return null
    return this.floorings.get(this.currentInterior.flooringId) || null
  }
}
