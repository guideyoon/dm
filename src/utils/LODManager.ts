import { Scene, Mesh, Vector3, Camera } from '@babylonjs/core'

export interface LODLevel {
    distance: number
    mesh: Mesh
}

export class LODManager {
    private scene: Scene
    private camera: Camera
    private lodGroups: Map<Mesh, LODLevel[]> = new Map()
    private updateInterval: number = 200 // LOD 업데이트 간격 (ms) - 성능 최적화: 100ms → 200ms
    private lastUpdateTime: number = 0

    constructor(scene: Scene, camera: Camera) {
        this.scene = scene
        this.camera = camera
    }

    /**
     * LOD 그룹 추가 (거리별로 다른 메시 사용)
     */
    public addLODGroup(baseMesh: Mesh, levels: LODLevel[]): void {
        if (levels.length === 0) return

        // 거리순으로 정렬
        levels.sort((a, b) => a.distance - b.distance)

        // 처음에는 가장 가까운 레벨부터 시작
        for (let i = 1; i < levels.length; i++) {
            levels[i].mesh.setEnabled(false)
        }

        this.lodGroups.set(baseMesh, levels)
    }

    /**
     * 단일 메시에 LOD 적용 (거리에 따라 비활성화)
     */
    public addSimpleLOD(mesh: Mesh, maxDistance: number): void {
        const levels: LODLevel[] = [
            { distance: maxDistance, mesh }
        ]
        this.lodGroups.set(mesh, levels)
    }

    /**
     * LOD 업데이트 (거리에 따라 메시 활성화/비활성화)
     */
    public update(currentTime: number): void {
        if (currentTime - this.lastUpdateTime < this.updateInterval) {
            return
        }
        this.lastUpdateTime = currentTime

        if (!this.camera) return

        const cameraPosition = this.camera.globalPosition

        this.lodGroups.forEach((levels, baseMesh) => {
            if (levels.length === 0) return

            const distance = Vector3.Distance(cameraPosition, baseMesh.position)

            // 레벨 찾기
            let activeIndex = levels.length - 1
            for (let i = 0; i < levels.length; i++) {
                if (distance <= levels[i].distance) {
                    activeIndex = i
                    break
                }
            }

            // 메시 활성화/비활성화
            for (let i = 0; i < levels.length; i++) {
                const isActive = i === activeIndex
                levels[i].mesh.setEnabled(isActive)
            }
        })
    }

    /**
     * LOD 제거
     */
    public removeLOD(baseMesh: Mesh): void {
        this.lodGroups.delete(baseMesh)
    }

    /**
     * 모든 LOD 정리
     */
    public dispose(): void {
        this.lodGroups.clear()
    }
}
