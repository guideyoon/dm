export class SaveNotification {
    private element: HTMLDivElement
    private timeout: number | null = null
    
    constructor() {
        this.element = document.createElement('div')
        this.element.id = 'save-notification'
        this.setupStyles()
        document.body.appendChild(this.element)
        this.hide()
    }
    
    private setupStyles() {
        Object.assign(this.element.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: 'rgba(76, 175, 80, 0.9)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            zIndex: '10001',
            opacity: '0',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            transform: 'translateY(20px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            pointerEvents: 'none'
        })
    }
    
    public show(message: string = '저장 완료', duration: number = 2000) {
        this.element.innerHTML = `<span>💾</span><span>${message}</span>`
        this.element.style.display = 'flex'
        
        // 애니메이션 트리거를 위한 약간의 지연
        setTimeout(() => {
            this.element.style.opacity = '1'
            this.element.style.transform = 'translateY(0)'
        }, 10)
        
        // 기존 타임아웃 취소
        if (this.timeout) {
            clearTimeout(this.timeout)
        }
        
        // 일정 시간 후 숨김
        this.timeout = window.setTimeout(() => {
            this.hide()
        }, duration)
    }
    
    public hide() {
        this.element.style.opacity = '0'
        this.element.style.transform = 'translateY(20px)'
        
        // 애니메이션 완료 후 숨김
        setTimeout(() => {
            this.element.style.display = 'none'
        }, 300)
        
        if (this.timeout) {
            clearTimeout(this.timeout)
            this.timeout = null
        }
    }
}
