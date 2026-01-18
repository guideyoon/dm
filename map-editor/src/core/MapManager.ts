// 맵 저장/로드 관리자

import { MapData, createEmptyMap } from '../types/MapData'
import { Mesh } from '@babylonjs/core'

export class MapManager {
  private currentMap: MapData | null = null
  private placedObjects: Map<string, Mesh> = new Map()

  // 새 맵 생성
  createNewMap(name: string = '새 맵'): MapData {
    this.currentMap = createEmptyMap(name)
    return this.currentMap
  }

  // 맵 데이터 설정
  setMapData(mapData: MapData) {
    this.currentMap = mapData
  }

  // 현재 맵 데이터 가져오기
  getMapData(): MapData | null {
    return this.currentMap
  }

  // 맵을 JSON 문자열로 저장
  saveToJSON(): string {
    if (!this.currentMap) {
      throw new Error('저장할 맵이 없습니다')
    }

    // 업데이트 시간 갱신
    this.currentMap.metadata.updatedAt = new Date().toISOString()

    // 오브젝트 정보 추출
    const objects: MapData['objects'] = []
    this.placedObjects.forEach((mesh, id) => {
      if (mesh.metadata?.type) {
        objects.push({
          id,
          type: mesh.metadata.type as any,
          position: {
            x: mesh.position.x,
            y: mesh.position.y,
            z: mesh.position.z
          },
          rotation: {
            x: mesh.rotation.x || undefined,
            y: mesh.rotation.y || undefined,
            z: mesh.rotation.z || undefined
          },
          scale: mesh.scaling ? {
            x: mesh.scaling.x !== 1 ? mesh.scaling.x : undefined,
            y: mesh.scaling.y !== 1 ? mesh.scaling.y : undefined,
            z: mesh.scaling.z !== 1 ? mesh.scaling.z : undefined
          } : undefined,
          properties: mesh.metadata.properties || {}
        })
      }
    })

    this.currentMap.objects = objects

    return JSON.stringify(this.currentMap, null, 2)
  }

  // JSON에서 맵 로드
  loadFromJSON(json: string): MapData {
    const mapData: MapData = JSON.parse(json)
    
    // 버전 검증
    if (!mapData.version || !mapData.metadata || !mapData.objects) {
      throw new Error('유효하지 않은 맵 파일입니다')
    }

    this.currentMap = mapData
    return mapData
  }

  // 파일 다운로드
  downloadMap(filename?: string) {
    if (!this.currentMap) {
      throw new Error('저장할 맵이 없습니다')
    }

    const json = this.saveToJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `${this.currentMap.metadata.name}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 파일 업로드
  async loadMapFromFile(file: File): Promise<MapData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const json = e.target?.result as string
          const mapData = this.loadFromJSON(json)
          resolve(mapData)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('파일 읽기 실패'))
      reader.readAsText(file)
    })
  }

  // 오브젝트 ID 관리
  setPlacedObjects(objects: Map<string, Mesh>) {
    this.placedObjects = objects
  }

  getPlacedObjects(): Map<string, Mesh> {
    return this.placedObjects
  }

  generateObjectId(): string {
    return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
