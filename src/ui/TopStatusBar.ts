import { GameTime } from '../systems/TimeSystem'

export class TopStatusBar {
    private element: HTMLDivElement
    private timeElement!: HTMLDivElement
    private dateElement!: HTMLDivElement
    private weatherElement!: HTMLDivElement
    private coinElement!: HTMLDivElement
    private tokenElement!: HTMLDivElement
    private goalElement!: HTMLDivElement
    private autoHarvestButton!: HTMLButtonElement

    private coins: number = 0
    private tokens: number = 0
    private previousCoins: number = 0
    private coinAnimationTimeout: number | null = null
    private onAutoHarvestToggle: (() => boolean) | null = null
    private gameTime: GameTime | null = null

    constructor() {
        this.element = document.createElement('div')
        this.element.id = 'top-status-bar'
        this.setupStyles()
        this.createElements()
        document.body.appendChild(this.element)
    }

    private setupStyles() {
        Object.assign(this.element.style, {
            position: 'fixed',
            top: '0',
            left: '72px',
            right: '0',
            height: '44px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            zIndex: '1000',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#ffffff',
            fontSize: '14px',
            gap: '20px'
        })
    }

    private createElements() {
        // 왼쪽: 시간과 날씨
        const leftSection = document.createElement('div')
        leftSection.style.display = 'flex'
        leftSection.style.alignItems = 'center'
        leftSection.style.gap = '15px'

        this.timeElement = document.createElement('div')
        this.timeElement.style.fontWeight = '600'
        this.timeElement.textContent = '08:00'
        leftSection.appendChild(this.timeElement)

        this.dateElement = document.createElement('div')
        this.dateElement.style.fontSize = '12px'
        this.dateElement.style.color = 'rgba(255, 255, 255, 0.7)'
        this.dateElement.textContent = '봄 1일'
        leftSection.appendChild(this.dateElement)

        this.weatherElement = document.createElement('div')
        this.weatherElement.textContent = '☀️ 맑음'
        this.weatherElement.style.fontSize = '16px'
        leftSection.appendChild(this.weatherElement)

        // 중앙: 코인과 토큰
        const centerSection = document.createElement('div')
        centerSection.style.display = 'flex'
        centerSection.style.alignItems = 'center'
        centerSection.style.gap = '20px'

        this.coinElement = document.createElement('div')
        this.coinElement.style.display = 'flex'
        this.coinElement.style.alignItems = 'center'
        this.coinElement.style.gap = '5px'
        this.coinElement.innerHTML = '💰 <span>0</span>'
        this.coinElement.style.fontWeight = '600'
        centerSection.appendChild(this.coinElement)

        this.tokenElement = document.createElement('div')
        this.tokenElement.style.display = 'flex'
        this.tokenElement.style.alignItems = 'center'
        this.tokenElement.style.gap = '5px'
        this.tokenElement.innerHTML = '✨ <span>0</span>'
        this.tokenElement.style.fontWeight = '600'
        centerSection.appendChild(this.tokenElement)

        // 오른쪽: 자동 채집 버튼과 다음 목표
        const rightSection = document.createElement('div')
        rightSection.style.display = 'flex'
        rightSection.style.alignItems = 'center'
        rightSection.style.gap = '15px'

        this.autoHarvestButton = document.createElement('button')
        this.autoHarvestButton.textContent = '⚡ 자동 채집 OFF'
        this.autoHarvestButton.style.padding = '6px 12px'
        this.autoHarvestButton.style.borderRadius = '6px'
        this.autoHarvestButton.style.border = '1px solid rgba(255, 255, 255, 0.3)'
        this.autoHarvestButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
        this.autoHarvestButton.style.color = '#fff'
        this.autoHarvestButton.style.cursor = 'pointer'
        this.autoHarvestButton.style.fontSize = '12px'
        this.autoHarvestButton.onclick = () => {
            if (this.onAutoHarvestToggle) {
                const isEnabled = this.onAutoHarvestToggle()
                this.updateAutoHarvestButton(isEnabled)
            }
        }
        rightSection.appendChild(this.autoHarvestButton)

        this.goalElement = document.createElement('div')
        this.goalElement.textContent = '다음 목표: 나무 채집하기'
        this.goalElement.style.fontSize = '12px'
        this.goalElement.style.color = 'rgba(255, 255, 255, 0.7)'
        this.goalElement.style.cursor = 'pointer'
        rightSection.appendChild(this.goalElement)

        this.element.appendChild(leftSection)
        this.element.appendChild(centerSection)
        this.element.appendChild(rightSection)
    }

    public updateTime(gameTime: GameTime | null = null) {
        if (gameTime) {
            this.gameTime = gameTime
            const hour = Math.floor(gameTime.hour)
            const minute = Math.floor(gameTime.minute)
            const hourStr = hour.toString().padStart(2, '0')
            const minuteStr = minute.toString().padStart(2, '0')
            this.timeElement.textContent = `${hourStr}:${minuteStr}`
            
            const seasonNames = {
                spring: '봄',
                summer: '여름',
                autumn: '가을',
                winter: '겨울'
            }
            this.dateElement.textContent = `${seasonNames[gameTime.season]} ${gameTime.day}일`
        } else {
            // 폴백: 실제 시간 표시
            const now = new Date()
            const hours = now.getHours().toString().padStart(2, '0')
            const minutes = now.getMinutes().toString().padStart(2, '0')
            this.timeElement.textContent = `${hours}:${minutes}`
        }
    }

    public setCoins(amount: number, animate: boolean = true) {
        const previousAmount = this.coins
        this.coins = amount
        
        const span = this.coinElement.querySelector('span')
        if (!span) return
        
        if (animate && amount > previousAmount && previousAmount > 0) {
            // 카운트업 애니메이션
            const difference = amount - previousAmount
            const duration = Math.min(1000, difference * 10) // 최대 1초
            const startTime = Date.now()
            const startValue = previousAmount
            
            // 코인 요소에 애니메이션 효과 추가
            this.coinElement.style.transform = 'scale(1.2)'
            this.coinElement.style.transition = 'transform 0.2s ease'
            
            const animate = () => {
                const elapsed = Date.now() - startTime
                const progress = Math.min(elapsed / duration, 1)
                
                // 이징 함수 (ease-out)
                const easeOut = 1 - Math.pow(1 - progress, 3)
                const currentValue = Math.floor(startValue + difference * easeOut)
                
                span.textContent = currentValue.toLocaleString()
                
                if (progress < 1) {
                    this.coinAnimationTimeout = window.setTimeout(animate, 16) // ~60fps
                } else {
                    span.textContent = amount.toLocaleString()
                    // 애니메이션 완료 후 원래 크기로
                    setTimeout(() => {
                        this.coinElement.style.transform = 'scale(1)'
                    }, 200)
                }
            }
            
            animate()
        } else {
            // 애니메이션 없이 즉시 업데이트
            span.textContent = amount.toLocaleString()
        }
        
        this.previousCoins = amount
    }

    public setTokens(amount: number) {
        this.tokens = amount
        const span = this.tokenElement.querySelector('span')
        if (span) span.textContent = amount.toString()
    }

    public setWeather(weather: string, icon: string) {
        this.weatherElement.textContent = `${icon} ${weather}`
    }

    public setGoal(goal: string) {
        this.goalElement.textContent = `다음 목표: ${goal}`
    }

    public setAutoHarvestToggle(callback: () => boolean) {
        this.onAutoHarvestToggle = callback
    }

    public updateAutoHarvestButton(isEnabled: boolean) {
        this.autoHarvestButton.textContent = isEnabled ? '⚡ 자동 채집 ON' : '⚡ 자동 채집 OFF'
        this.autoHarvestButton.style.backgroundColor = isEnabled 
            ? 'rgba(100, 255, 100, 0.3)' 
            : 'rgba(255, 255, 255, 0.1)'
        this.autoHarvestButton.style.borderColor = isEnabled
            ? 'rgba(100, 255, 100, 0.5)'
            : 'rgba(255, 255, 255, 0.3)'
    }
}
