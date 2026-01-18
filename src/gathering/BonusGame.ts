export interface BonusGameResult {
    success: boolean
    bonusMultiplier: number
}

export class BonusGame {
    private timingWindow: number = 1000 // 1초 타이밍 윈도우
    private successZone: number = 200 // 성공 구간 (ms)

    /**
     * 선택형 보너스 미니게임 시작
     * 타이밍 기반 게임: 특정 시점에 버튼을 눌러야 함
     */
    public startBonusGame(): Promise<BonusGameResult> {
        return new Promise((resolve) => {
            // 간단한 타이밍 게임 구현
            // 실제로는 UI에 타이밍 바를 표시하고 사용자가 버튼을 누를 때까지 대기
            const randomDelay = 500 + Math.random() * 1000 // 0.5~1.5초 사이 랜덤
            const successTime = randomDelay + this.successZone / 2

            const startTime = Date.now()
            let clicked = false

            // 글로벌 클릭 핸들러 (임시)
            const handleClick = () => {
                if (clicked) return
                clicked = true
                
                const clickTime = Date.now() - startTime
                const timeDiff = Math.abs(clickTime - randomDelay)
                
                const success = timeDiff <= this.successZone / 2
                const multiplier = success ? 1.2 : 1.0 // 성공 시 20% 보너스

                document.removeEventListener('click', handleClick)
                clearTimeout(timeout)

                resolve({
                    success,
                    bonusMultiplier: multiplier
                })
            }

            const timeout = setTimeout(() => {
                if (!clicked) {
                    clicked = true
                    document.removeEventListener('click', handleClick)
                    resolve({
                        success: false,
                        bonusMultiplier: 1.0
                    })
                }
            }, this.timingWindow)

            // UI 표시 후 클릭 대기 (실제로는 UI 컴포넌트에서 처리)
            setTimeout(() => {
                document.addEventListener('click', handleClick, { once: true })
            }, randomDelay - 100) // 약간의 여유
        })
    }

    /**
     * 간단한 버전: 자동 계산 (실제 UI 없이)
     * 실제 게임에서는 UI를 통해 사용자가 직접 타이밍을 맞춰야 함
     */
    public calculateAutoBonus(chance: number = 0.3): BonusGameResult {
        // 30% 확률로 자동 성공 (실제로는 사용자 입력 필요)
        const success = Math.random() < chance
        return {
            success,
            bonusMultiplier: success ? 1.2 : 1.0
        }
    }
}
