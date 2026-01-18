// 맵 데이터 스키마 정의

export interface MapData {
  version: string
  metadata: {
    name: string
    description?: string
    author?: string
    createdAt: string
    updatedAt: string
    size: {
      width: number
      height: number
      tileSize: number
    }
  }
  terrain: {
    tiles: Array<{
      x: number
      z: number
      y?: number
      type: 'grass' | 'dirt' | 'water' | 'stone'
      variant?: number
    }>
  }
  objects: Array<{
    id: string
    type: 'tree' | 'rock' | 'flower' | 'house' | 'shop'
    position: {
      x: number
      y: number
      z: number
    }
    rotation?: {
      x?: number
      y?: number
      z?: number
    }
    scale?: {
      x?: number
      y?: number
      z?: number
    }
    properties?: {
      [key: string]: any
    }
  }>
  spawnPoints?: Array<{
    id: string
    position: { x: number; y: number; z: number }
    type: 'player' | 'npc'
  }>
}

export function createEmptyMap(name: string = '새 맵'): MapData {
  const now = new Date().toISOString()
  return {
    version: '1.0.0',
    metadata: {
      name,
      createdAt: now,
      updatedAt: now,
      size: {
        width: 50,
        height: 50,
        tileSize: 1.0
      }
    },
    terrain: {
      tiles: []
    },
    objects: [],
    spawnPoints: []
  }
}
