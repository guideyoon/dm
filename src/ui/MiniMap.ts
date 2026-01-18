import { Scene, Vector3, Mesh } from '@babylonjs/core'

export class MiniMap {
    private element: HTMLDivElement
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    private scene: Scene
    private playerPosition: Vector3 = Vector3.Zero()
    private mapSize: number = 200
    private worldSize: number = 50 // 게임 월드 크기
    
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
            right: '20px',
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
        
        // 플레이어
        const playerX = (this.playerPosition.x * scale) + offsetX
        const playerZ = (this.playerPosition.z * scale) + offsetZ
        ctx.fillStyle = 'rgba(255, 255, 0, 1)'
        ctx.beginPath()
        ctx.arc(playerX, playerZ, 5, 0, Math.PI * 2)
        ctx.fill()
        
        // 플레이어 방향 표시
        ctx.strokeStyle = 'rgba(255, 255, 0, 1)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(playerX, playerZ)
        ctx.lineTo(playerX, playerZ - 8)
        ctx.stroke()
    }
    
    public show() {
        this.element.style.display = 'block'
    }
    
    public hide() {
        this.element.style.display = 'none'
    }
}
