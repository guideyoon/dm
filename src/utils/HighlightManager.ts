import { Scene, Mesh, HighlightLayer, Color3 } from '@babylonjs/core'

export class HighlightManager {
  private scene: Scene
  private highlightLayer: HighlightLayer
  private highlightedMeshes: Set<Mesh> = new Set()

  constructor(scene: Scene) {
    this.scene = scene
    this.highlightLayer = new HighlightLayer('highlightLayer', scene)
  }

  /**
   * 메시 하이라이트
   */
  highlight(mesh: Mesh, color: Color3 = new Color3(0, 1, 1)): void {
    if (!mesh || this.highlightedMeshes.has(mesh)) {
      return
    }

    this.highlightLayer.addMesh(mesh, color)
    this.highlightedMeshes.add(mesh)
  }

  /**
   * 메시 하이라이트 제거
   */
  unhighlight(mesh: Mesh): void {
    if (!mesh || !this.highlightedMeshes.has(mesh)) {
      return
    }

    this.highlightLayer.removeMesh(mesh)
    this.highlightedMeshes.delete(mesh)
  }

  /**
   * 모든 하이라이트 제거
   */
  clearAll(): void {
    this.highlightedMeshes.forEach(mesh => {
      this.highlightLayer.removeMesh(mesh)
    })
    this.highlightedMeshes.clear()
  }

  /**
   * 상호작용 가능한 오브젝트 하이라이트 (채집 가능한 오브젝트 등)
   */
  highlightInteractable(mesh: Mesh): void {
    this.highlight(mesh, new Color3(0, 1, 0)) // 녹색
  }

  /**
   * 건물 하이라이트
   */
  highlightBuilding(mesh: Mesh): void {
    this.highlight(mesh, new Color3(0, 0.5, 1)) // 파란색
  }

  /**
   * NPC 하이라이트
   */
  highlightNPC(mesh: Mesh): void {
    this.highlight(mesh, new Color3(1, 0.5, 0)) // 주황색
  }

  /**
   * 펄스 효과 (깜빡이는 하이라이트)
   */
  pulse(mesh: Mesh, color: Color3 = new Color3(0, 1, 1), duration: number = 1000): void {
    this.highlight(mesh, color)
    
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / duration
      
      if (progress >= 1) {
        clearInterval(interval)
        this.unhighlight(mesh)
        return
      }
      
      // 펄스 효과 (0.5 ~ 1.0 사이 진동)
      const intensity = 0.5 + 0.5 * Math.sin(progress * Math.PI * 4)
      const pulseColor = new Color3(
        color.r * intensity,
        color.g * intensity,
        color.b * intensity
      )
      
      this.highlightLayer.removeMesh(mesh)
      this.highlightLayer.addMesh(mesh, pulseColor)
    }, 50)
  }
}
