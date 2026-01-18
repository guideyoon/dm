export class Tooltip {
    private element: HTMLDivElement
    private static instance: Tooltip | null = null
    
    private constructor() {
        this.element = document.createElement('div')
        this.element.id = 'game-tooltip'
        this.setupStyles()
        document.body.appendChild(this.element)
        this.hide()
    }
    
    public static getInstance(): Tooltip {
        if (!Tooltip.instance) {
            Tooltip.instance = new Tooltip()
        }
        return Tooltip.instance
    }
    
    private setupStyles() {
        Object.assign(this.element.style, {
            position: 'fixed',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: '#ffffff',
            padding: '10px 15px',
            borderRadius: '8px',
            fontSize: '13px',
            maxWidth: '300px',
            pointerEvents: 'none',
            zIndex: '10000',
            opacity: '0',
            transition: 'opacity 0.2s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            lineHeight: '1.5'
        })
    }
    
    public show(text: string, x: number, y: number) {
        this.element.textContent = text
        this.element.style.left = `${x + 10}px`
        this.element.style.top = `${y + 10}px`
        this.element.style.opacity = '1'
    }
    
    public hide() {
        this.element.style.opacity = '0'
    }
    
    public updatePosition(x: number, y: number) {
        this.element.style.left = `${x + 10}px`
        this.element.style.top = `${y + 10}px`
    }
}
