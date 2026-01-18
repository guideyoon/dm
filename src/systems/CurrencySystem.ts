export interface CurrencyData {
    coins: number
    tokens: number
}

export class CurrencySystem {
    private coins: number = 0
    private tokens: number = 0
    private previousCoins: number = 0
    private previousTokens: number = 0
    
    private onCoinsChangeCallbacks: ((coins: number, previousCoins: number) => void)[] = []
    private onTokensChangeCallbacks: ((tokens: number, previousTokens: number) => void)[] = []

    constructor(initialCoins: number = 0, initialTokens: number = 0) {
        this.coins = initialCoins
        this.tokens = initialTokens
    }

    /**
     * 코인 추가
     */
    public addCoins(amount: number): boolean {
        if (amount < 0) return false
        this.previousCoins = this.coins
        this.coins += amount
        this.notifyCoinsChange()
        return true
    }

    /**
     * 코인 차감
     */
    public spendCoins(amount: number): boolean {
        if (amount < 0 || this.coins < amount) return false
        this.previousCoins = this.coins
        this.coins -= amount
        this.notifyCoinsChange()
        return true
    }

    /**
     * 코인 확인 (차감 가능 여부)
     */
    public hasCoins(amount: number): boolean {
        return this.coins >= amount
    }

    /**
     * 코인 가져오기
     */
    public getCoins(): number {
        return this.coins
    }

    /**
     * 토큰 추가
     */
    public addTokens(amount: number): boolean {
        if (amount < 0) return false
        this.previousTokens = this.tokens
        this.tokens += amount
        this.notifyTokensChange()
        return true
    }

    /**
     * 토큰 차감
     */
    public spendTokens(amount: number): boolean {
        if (amount < 0 || this.tokens < amount) return false
        this.previousTokens = this.tokens
        this.tokens -= amount
        this.notifyTokensChange()
        return true
    }

    /**
     * 토큰 확인 (차감 가능 여부)
     */
    public hasTokens(amount: number): boolean {
        return this.tokens >= amount
    }

    /**
     * 토큰 가져오기
     */
    public getTokens(): number {
        return this.tokens
    }

    /**
     * 코인 변경 콜백 등록
     */
    public onCoinsChange(callback: (coins: number, previousCoins: number) => void): void {
        this.onCoinsChangeCallbacks.push(callback)
    }

    /**
     * 토큰 변경 콜백 등록
     */
    public onTokensChange(callback: (tokens: number, previousTokens: number) => void): void {
        this.onTokensChangeCallbacks.push(callback)
    }

    /**
     * 코인 변경 알림
     */
    private notifyCoinsChange(): void {
        this.onCoinsChangeCallbacks.forEach(callback => callback(this.coins, this.previousCoins))
    }

    /**
     * 토큰 변경 알림
     */
    private notifyTokensChange(): void {
        this.onTokensChangeCallbacks.forEach(callback => callback(this.tokens, this.previousTokens))
    }

    /**
     * 데이터 가져오기 (저장용)
     */
    public getData(): CurrencyData {
        return {
            coins: this.coins,
            tokens: this.tokens
        }
    }

    /**
     * 데이터 로드
     */
    public loadData(data: CurrencyData): void {
        this.coins = data.coins || 0
        this.tokens = data.tokens || 0
        this.notifyCoinsChange()
        this.notifyTokensChange()
    }

    /**
     * 리셋
     */
    public reset(): void {
        this.coins = 0
        this.tokens = 0
        this.notifyCoinsChange()
        this.notifyTokensChange()
    }
}
