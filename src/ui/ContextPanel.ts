import { MenuType } from './LeftMenuBar'

export class ContextPanel {
    private element: HTMLDivElement
    private headerElement!: HTMLDivElement
    private contentElement!: HTMLDivElement
    private isOpen: boolean = false
    private currentMenu: MenuType | null = null
    private onToggle: ((isOpen: boolean) => void) | null = null

    constructor() {
        this.element = document.createElement('div')
        this.element.id = 'context-panel'
        this.setupStyles()
        this.createElements()
        document.body.appendChild(this.element)

        this.setupKeyboardControls()
    }

    private setupStyles() {
        Object.assign(this.element.style, {
            position: 'fixed',
            top: '44px',
            right: '-400px',
            width: '400px',
            height: 'calc(100vh - 44px)',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(10px)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: '999',
            transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
            opacity: '0',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#ffffff',
            boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.5)'
        })
    }

    private createElements() {
        // 헤더
        this.headerElement = document.createElement('div')
        this.headerElement.style.padding = '20px'
        this.headerElement.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)'
        this.headerElement.style.display = 'flex'
        this.headerElement.style.justifyContent = 'space-between'
        this.headerElement.style.alignItems = 'center'

        const titleElement = document.createElement('h2')
        titleElement.id = 'panel-title'
        titleElement.textContent = '제목'
        titleElement.style.margin = '0'
        titleElement.style.fontSize = '24px'

        const closeButton = document.createElement('button')
        closeButton.textContent = '✕'
        closeButton.style.background = 'none'
        closeButton.style.border = 'none'
        closeButton.style.color = '#fff'
        closeButton.style.fontSize = '24px'
        closeButton.style.cursor = 'pointer'
        closeButton.style.width = '32px'
        closeButton.style.height = '32px'
        closeButton.style.display = 'flex'
        closeButton.style.alignItems = 'center'
        closeButton.style.justifyContent = 'center'
        closeButton.onclick = () => this.close()

        this.headerElement.appendChild(titleElement)
        this.headerElement.appendChild(closeButton)

        // 콘텐츠 영역
        this.contentElement = document.createElement('div')
        this.contentElement.id = 'panel-content'
        this.contentElement.style.flex = '1'
        this.contentElement.style.overflow = 'auto'
        this.contentElement.style.padding = '20px'

        this.element.appendChild(this.headerElement)
        this.element.appendChild(this.contentElement)
    }

    private setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close()
            }
        })
    }

    public open(menu: MenuType, title: string, content: string | HTMLElement) {
        this.currentMenu = menu
        this.isOpen = true
        if (this.onToggle) {
            this.onToggle(true)
        }
        
        const titleElement = this.headerElement.querySelector('#panel-title') as HTMLElement
        if (titleElement) titleElement.textContent = title

        if (typeof content === 'string') {
            this.contentElement.innerHTML = content
        } else {
            this.contentElement.innerHTML = ''
            this.contentElement.appendChild(content)
        }

        // 애니메이션: 슬라이드 인 + 페이드 인
        this.element.style.right = '0'
        requestAnimationFrame(() => {
            this.element.style.opacity = '1'
        })
    }

    public close() {
        this.isOpen = false
        this.currentMenu = null
        if (this.onToggle) {
            this.onToggle(false)
        }
        
        // 애니메이션: 페이드 아웃 + 슬라이드 아웃
        this.element.style.opacity = '0'
        setTimeout(() => {
            this.element.style.right = '-400px'
        }, 150) // 페이드 아웃 후 슬라이드
    }

    public isPanelOpen(): boolean {
        return this.isOpen
    }

    public getCurrentMenu(): MenuType | null {
        return this.currentMenu
    }

    public setContent(content: string | HTMLElement) {
        if (typeof content === 'string') {
            this.contentElement.innerHTML = content
        } else {
            this.contentElement.innerHTML = ''
            this.contentElement.appendChild(content)
        }
    }

    public setOnToggle(callback: (isOpen: boolean) => void) {
        this.onToggle = callback
    }
}
