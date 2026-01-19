import { Scene, Vector3, Mesh } from '@babylonjs/core'

export class MiniMap {
    private element: HTMLDivElement
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    private scene: Scene
    private playerPosition: Vector3 = Vector3.Zero()
    private mapSize: number = 200
    private worldSize: number = 50 // 게임 월드 크기
    private rightOffset: number = 20
    
    constructor(scene: Scene) {
        this.scene = scene
        this.element = document.createElement('div')
        this.element.id = 'minimap'
        this.setupStyles()
        this.createCanvas()
        document.body.appendChild(this.element)
        
        // 주기적으로 업데이트
        setInterval(() => this.update(), 100)
    }
    
    private setupStyles() {
        Object.assign(this.element.style, {
            position: 'fixed',
            top: '60px',
            right: `${this.rightOffset}px`,
            width: `${this.mapSize}px`,
            height: `${this.mapSize}px`,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '10px',
            zIndex: '1000',
            overflow: 'hidden'
        })
    }
    
    private createCanvas() {
        this.canvas = document.createElement('canvas')
        this.canvas.width = this.mapSize
        this.canvas.height = this.mapSize
        this.ctx = this.canvas.getContext('2d')!
        this.element.appendChild(this.canvas)
    }
    
    public setPlayerPosition(position: Vector3) {
        this.playerPosition = position
    }
    
    public update() {
        const ctx = this.canvas.getContext('2d')
        if (!ctx) return
        
        // 캔버스 클리어
        ctx.clearRect(0, 0, this.mapSize, this.mapSize)
        
        // 배경
        ctx.fillStyle = 'rgba(50, 100, 50, 0.5)'
        ctx.fillRect(0, 0, this.mapSize, this.mapSize)
        
        // 그리드
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.lineWidth = 1
        const gridSize = 10
        for (let x = 0; x < this.mapSize; x += gridSize) {
            ctx.beginPath()
            ctx.moveTo(x, 0)
            ctx.lineTo(x, this.mapSize)
            ctx.stroke()
        }
        for (let y = 0; y < this.mapSize; y += gridSize) {
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.lineTo(this.mapSize, y)
            ctx.stroke()
        }
        
        // 오브젝트 표시
        const scale = this.mapSize / this.worldSize
        const offsetX = this.mapSize / 2
        const offsetZ = this.mapSize / 2
        
        // 나무
        ctx.fillStyle = 'rgba(100, 200, 100, 0.8)'
        this.scene.meshes.forEach(mesh => {
            if (mesh.name.includes('trunk') || mesh.name.includes('leaves')) {
                const x = (mesh.position.x * scale) + offsetX
                const z = (mesh.position.z * scale) + offsetZ
                ctx.beginPath()
                ctx.arc(x, z, 3, 0, Math.PI * 2)
                ctx.fill()
            }
        })
        
        // 바위
        ctx.fillStyle = 'rgba(150, 150, 150, 0.8)'
        this.scene.meshes.forEach(mesh => {
            if (mesh.name.includes('rock')) {
                const x = (mesh.position.x * scale) + offsetX
                const z = (mesh.position.z * scale) + offsetZ
                ctx.beginPath()
                ctx.arc(x, z, 2, 0, Math.PI * 2)
                ctx.fill()
            }
        })
        
        // NPC
        ctx.fillStyle = 'rgba(100, 150, 255, 0.8)'
        this.scene.meshes.forEach(mesh => {
            if (mesh.metadata?.type === 'npc') {
                const x = (mesh.position.x * scale) + offsetX
                const z = (mesh.position.z * scale) + offsetZ
                ctx.beginPath()
                ctx.arc(x, z, 4, 0, Math.PI * 2)
                ctx.fill()
            }
        })
        
        // 플레이어 (더 눈에 띄게 개선)
        const playerX = (this.playerPosition.x * scale) + offsetX
        const playerZ = (this.playerPosition.z * scale) + offsetZ
        
        // 펄스 효과를 위한 시간 기반 애니메이션
        const pulseTime = Date.now() / 500 // 0.5초 주기
        const pulseSize = 2 + Math.sin(pulseTime) * 1.5 // 2~3.5 크기 변화
        
        // 외곽 그림자 (더 잘 보이도록) - 빨간색
        ctx.shadowColor = '#FF0000'
        ctx.shadowBlur = 8
        
        // 외곽선 (검은색)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(playerX, playerZ, 8 + pulseSize, 0, Math.PI * 2)
        ctx.stroke()
        
        // 플레이어 표시 (밝은 빨간색) - 명확하게 빨간색으로
        ctx.fillStyle = '#FF0000' // 완전한 빨간색
        ctx.beginPath()
        ctx.arc(playerX, playerZ, 8 + pulseSize, 0, Math.PI * 2)
        ctx.fill()
        
        // 내부 하이라이트 (더 밝은 중심, 연한 빨간색)
        ctx.fillStyle = '#FFCCCC' // 연한 빨간색
        ctx.beginPath()
        ctx.arc(playerX, playerZ, 5, 0, Math.PI * 2)
        ctx.fill()
        
        // 그림자 효과 리셋
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        
        // 플레이어 방향 표시 (더 명확하게, 붉은 계열)
        ctx.strokeStyle = '#FF3333' // 밝은 빨간색
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(playerX, playerZ)
        ctx.lineTo(playerX, playerZ - 12)
        ctx.stroke()
        
        // 방향 표시 화살표 끝부분
        ctx.fillStyle = '#FF3333' // 밝은 빨간색
        ctx.beginPath()
        ctx.moveTo(playerX, playerZ - 12)
        ctx.lineTo(playerX - 3, playerZ - 8)
        ctx.lineTo(playerX + 3, playerZ - 8)
        ctx.closePath()
        ctx.fill()
    }
    
    public show() {
        this.element.style.display = 'block'
    }
    
    public hide() {
        this.element.style.display = 'none'
    }

    public setRightOffset(offset: number) {
        this.rightOffset = offset
        this.element.style.right = `${offset}px`
    }
}
