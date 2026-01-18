import { Scene, Mesh, Vector3, Animation } from '@babylonjs/core'

export class EnvironmentAnimation {
    private scene: Scene
    private animatedLeaves: Mesh[] = []
    private animatedWater: Mesh[] = []
    private windSpeed: number = 0.5 // 바람 속도
    private time: number = 0
    
    constructor(scene: Scene) {
        this.scene = scene
    }
    
    // 나뭇잎 애니메이션 추가
    public addLeavesAnimation(leavesMesh: Mesh) {
        this.animatedLeaves.push(leavesMesh)
    }
    
    // 물 애니메이션 추가 (파도)
    public addWaterAnimation(waterMesh: Mesh) {
        this.animatedWater.push(waterMesh)
    }
    
    // 업데이트 (렌더 루프에서 호출)
    public update(deltaTime: number) {
        this.time += deltaTime
        
        // 나뭇잎 흔들림 애니메이션 (바람 효과)
        this.animatedLeaves.forEach(leaves => {
            if (leaves && !leaves.isDisposed()) {
                // 좌우로 약간 흔들림
                const windAmount = Math.sin(this.time * this.windSpeed) * 0.1
                leaves.rotation.z = windAmount
                // 위아래로 약간 흔들림
                const verticalSway = Math.sin(this.time * this.windSpeed * 0.8) * 0.05
                leaves.position.y += verticalSway * deltaTime
                
                // 원래 위치로 복원 (누적 방지)
                const originalY = leaves.metadata?.originalY || 2
                if (!leaves.metadata?.originalY) {
                    leaves.metadata = { originalY: leaves.position.y }
                }
                
                // 원래 위치 기준으로 흔들림
                leaves.position.y = originalY + Math.sin(this.time * this.windSpeed * 0.8) * 0.1
            }
        })
        
        // 물 파도 애니메이션
        this.animatedWater.forEach(water => {
            if (water && !water.isDisposed()) {
                // 물결 효과 (위치 이동)
                const waveAmount = Math.sin(this.time * 2) * 0.02
                const originalY = water.metadata?.originalY ?? water.position.y
                if (!water.metadata?.originalY) {
                    water.metadata = { originalY: water.position.y }
                }
                water.position.y = originalY + waveAmount
                
                // 회전으로 파도 효과
                water.rotation.x = Math.sin(this.time * 1.5) * 0.05
            }
        })
    }
    
    // 바람 속도 설정
    public setWindSpeed(speed: number) {
        this.windSpeed = speed
    }
    
    // 모든 애니메이션 정리
    public dispose() {
        this.animatedLeaves = []
        this.animatedWater = []
    }
}
