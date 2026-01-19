export class HarvestProgressBar {
    private element: HTMLDivElement
    private progressBar!: HTMLDivElement
    private labelText!: HTMLDivElement
    private isVisible: boolean = false

    constructor() {
        this.element = document.createElement('div')
        this.element.id = 'harvest-progress-bar'
        this.setupStyles()
        this.createElements()
        document.body.appendChild(this.element)
        this.hide()
    }

    private setupStyles() {
        Object.assign(this.element.style, {
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '300px',
            height: '50px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '10px',
            padding: '3px',
            display: 'none',
            zIndex: '2000',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        })
    }

    private createElements() {
        // '채집중' 텍스트 레이블
        this.labelText = document.createElement('div')
        this.labelText.textContent = '채집중'
        Object.assign(this.labelText.style, {
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '4px',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
            userSelect: 'none'
        })
        this.element.appendChild(this.labelText)

        // 진행 바 컨테이너
        const progressContainer = document.createElement('div')
        Object.assign(progressContainer.style, {
            width: '100%',
            height: '20px',
            position: 'relative'
        })

        this.progressBar = document.createElement('div')
        this.progressBar.id = 'harvest-progress-bar-inner'
        Object.assign(this.progressBar.style, {
            width: '0%',
            height: '100%',
            backgroundColor: 'linear-gradient(90deg, rgba(100, 200, 255, 0.9), rgba(100, 255, 200, 0.9))',
            background: 'linear-gradient(90deg, rgba(100, 200, 255, 0.9), rgba(100, 255, 200, 0.9))',
            borderRadius: '8px',
            transition: 'width 0.1s linear',
            boxShadow: '0 0 10px rgba(100, 255, 200, 0.5)'
        })
        progressContainer.appendChild(this.progressBar)
        this.element.appendChild(progressContainer)
    }

    public show() {
        this.isVisible = true
        this.element.style.display = 'block'
        this.updateProgress(0)
    }

    public hide() {
        this.isVisible = false
        this.element.style.display = 'none'
        this.updateProgress(0)
    }

    public updateProgress(progress: number) {
        // progress는 0~1 사이의 값
        const clampedProgress = Math.max(0, Math.min(1, progress))
        const percentage = clampedProgress * 100
        this.progressBar.style.width = `${percentage}%`
    }

    public isBarVisible(): boolean {
        return this.isVisible
    }
}