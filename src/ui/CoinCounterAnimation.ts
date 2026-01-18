export class CoinCounterAnimation {
    private element: HTMLDivElement
    private currentValue: number = 0
    private targetValue: number = 0
    private animationFrame: number | null = null
    private isAnimating: boolean = false
    
    constructor(containerId: string = 'coin-counter-container') {
        this.element = document.createElement('div')
        this.element.id = 'coin-counter-animation'
        this.setupStyles()
        
        // 컨테이너 찾기 또는 생성
        let container = document.getElementById(containerId)
        if (!container) {
            container = document.createElement('div')
            container.id = containerId
            container.style.position = 'fixed'
            container.style.top = '44px'
            container.style.left = '20px'
            container.style.zIndex = '10000'
            document.body.appendChild(container)
        }
        
        container.appendChild(this.element)
        this.hide()
    }
    
    private setupStyles() {
        Object.assign(this.element.style, {
            position: 'relative',
            display: 'inline-block',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#FFD700',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            transition: 'transform 0.2s ease, opacity 0.3s ease',
            opacity: '0',
            transform: 'scale(0.8)'
        })
    }
    
    public animate(from: number, to: number, duration: number = 1000) {
        this.currentValue = from
        this.targetValue = to
        this.isAnimating = true
        
        // 표시
        this.element.style.display = 'inline-block'
        this.element.style.opacity = '1'
        this.element.style.transform = 'scale(1)'
        
        const startTime = Date.now()
        const startValue = from
        const difference = to - from
        
        const animate = () => {
            if (!this.isAnimating) return
            
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            
            // 이징 함수 (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3)
            this.currentValue = Math.floor(startValue + difference * easeOut)
            
            this.updateDisplay()
            
            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(animate)
            } else {
                this.currentValue = to
                this.updateDisplay()
                this.isAnimating = false
                
                // 애니메이션 완료 후 숨김
                setTimeout(() => {
                    this.hide()
                }, 500)
            }
        }
        
        this.animationFrame = requestAnimationFrame(animate)
    }
    
    private updateDisplay() {
        this.element.textContent = `💰 ${this.currentValue.toLocaleString()}`
    }
    
    public show(value: number) {
        this.currentValue = value
        this.targetValue = value
        this.updateDisplay()
        this.element.style.display = 'inline-block'
        this.element.style.opacity = '1'
        this.element.style.transform = 'scale(1)'
    }
    
    public hide() {
        this.element.style.opacity = '0'
        this.element.style.transform = 'scale(0.8)'
        setTimeout(() => {
            this.element.style.display = 'none'
        }, 300)
    }
    
    public stop() {
        this.isAnimating = false
        if (this.animationFrame !== null) {
            cancelAnimationFrame(this.animationFrame)
            this.animationFrame = null
        }
    }
}
