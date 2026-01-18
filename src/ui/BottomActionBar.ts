export interface ActionButton {
    label: string
    onClick: () => void
    primary?: boolean
}

export class BottomActionBar {
    private element: HTMLDivElement
    private targetNameElement!: HTMLDivElement
    private actionsContainer!: HTMLDivElement
    private isVisible: boolean = false

    constructor() {
        this.element = document.createElement('div')
        this.element.id = 'bottom-action-bar'
        this.setupStyles()
        this.createElements()
        document.body.appendChild(this.element)
        this.hide()
    }

    private setupStyles() {
        Object.assign(this.element.style, {
            position: 'fixed',
            bottom: '0',
            left: '72px',
            right: '0',
            height: '72px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            zIndex: '1000',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#ffffff',
            transform: 'translateY(100%)',
            transition: 'transform 0.3s ease'
        })
    }

    private createElements() {
        // 왼쪽: 대상 이름과 아이콘
        this.targetNameElement = document.createElement('div')
        this.targetNameElement.style.display = 'flex'
        this.targetNameElement.style.alignItems = 'center'
        this.targetNameElement.style.gap = '10px'
        this.targetNameElement.style.fontSize = '18px'
        this.targetNameElement.style.fontWeight = '600'

        // 중앙: 행동 버튼들
        this.actionsContainer = document.createElement('div')
        this.actionsContainer.style.display = 'flex'
        this.actionsContainer.style.gap = '10px'

        // 오른쪽: 취소 버튼
        const cancelButton = document.createElement('button')
        cancelButton.textContent = '취소'
        cancelButton.style.padding = '10px 20px'
        cancelButton.style.borderRadius = '8px'
        cancelButton.style.border = '1px solid rgba(255, 255, 255, 0.3)'
        cancelButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
        cancelButton.style.color = '#fff'
        cancelButton.style.cursor = 'pointer'
        cancelButton.style.fontSize = '14px'
        cancelButton.onclick = () => this.hide()

        this.element.appendChild(this.targetNameElement)
        this.element.appendChild(this.actionsContainer)
        this.element.appendChild(cancelButton)
    }

    public show(targetName: string, icon: string, actions: ActionButton[]) {
        this.isVisible = true
        this.targetNameElement.innerHTML = `${icon} ${targetName}`
        
        this.actionsContainer.innerHTML = ''
        actions.forEach(action => {
            const button = document.createElement('button')
            button.textContent = action.label
            button.style.padding = '10px 20px'
            button.style.borderRadius = '8px'
            button.style.border = 'none'
            button.style.backgroundColor = action.primary 
                ? 'rgba(100, 150, 255, 0.8)' 
                : 'rgba(255, 255, 255, 0.2)'
            button.style.color = '#fff'
            button.style.cursor = 'pointer'
            button.style.fontSize = '14px'
            button.style.fontWeight = action.primary ? '600' : '400'
            button.onclick = action.onClick

            this.actionsContainer.appendChild(button)
        })

        this.element.style.transform = 'translateY(0)'
    }

    public hide() {
        this.isVisible = false
        this.element.style.transform = 'translateY(100%)'
    }

    public isBarVisible(): boolean {
        return this.isVisible
    }
}
