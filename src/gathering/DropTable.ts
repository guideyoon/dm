import { DropEntry, GatheringNode } from './GatheringNode'
import { ItemRarityManager } from '../utils/ItemRarity'

export interface GatherResult {
    items: { itemId: string; count: number }[]
    xpGained: number
    bonusSuccess: boolean
    depleted?: boolean // 오브젝트가 완전히 소진되었는지 (3회 채집 완료)
    harvestCount?: number // 현재 채집 횟수
}

export interface GatherContext {
    weather?: string
    season?: string
    townLevel?: number
    skillLevels?: { [category: string]: number }
    toolGrade?: number
    isFirstDaily?: boolean
    bonusSuccess?: boolean
    event?: string
    museumComplete?: number
}

export class DropTable {
    static calculateDrops(
        node: GatheringNode,
        context: GatherContext = {}
    ): GatherResult {
        const items: { itemId: string; count: number }[] = []
        
        // 기본 드랍 처리 (확정 지급)
        node.baseDrops.forEach(drop => {
            if (this.checkConditions(drop, context)) {
                const count = this.calculateDropCount(drop, context)
                if (count > 0) {
                    items.push({ itemId: drop.itemId, count })
                }
            }
        })

        // 보너스 드랍 처리 (확률 지급)
        node.bonusDrops.forEach(drop => {
            if (this.checkConditions(drop, context)) {
                const chance = drop.chancePct
                // 보너스 성공 시 확률 증가
                if (drop.conditions?.bonusSuccess && context.bonusSuccess) {
                    const adjustedChance = Math.min(chance * 1.5, 100)
                    if (Math.random() * 100 < adjustedChance) {
                        const count = this.calculateDropCount(drop, context)
                        if (count > 0) {
                            items.push({ itemId: drop.itemId, count })
                        }
                    }
                } else if (Math.random() * 100 < chance) {
                    const count = this.calculateDropCount(drop, context)
                    if (count > 0) {
                        items.push({ itemId: drop.itemId, count })
                    }
                }
            }
        })

        // 금 색 아이템 (전설 아이템) 더블 수확 처리
        const processedItems: { itemId: string; count: number }[] = []
        items.forEach(item => {
            if (ItemRarityManager.isGoldenItem(item.itemId)) {
                // 금 색 아이템은 2배 수확
                processedItems.push({ itemId: item.itemId, count: item.count * 2 })
            } else {
                processedItems.push(item)
            }
        })
        
        // 시간대별 특수 아이템 추가 (새벽 5시)
        if (context.weather) { // weather 대신 hour를 전달해야 하지만, 임시로 이렇게 처리
            // 시간대별 특수 아이템은 GatheringSystem에서 처리
        }

        // XP 계산
        let xpGained = node.xpReward
        // 숙련도 보너스 적용 (최대 20% 증가)
        if (context.skillLevels) {
            const skillLevel = context.skillLevels[node.category] || 0
            const xpBonus = Math.min(skillLevel * 0.01, 0.2) // 최대 20%
            xpGained = Math.floor(xpGained * (1 + xpBonus))
        }

        return {
            items: processedItems,
            xpGained,
            bonusSuccess: context.bonusSuccess || false
        }
    }

    private static checkConditions(drop: DropEntry, context: GatherContext): boolean {
        if (!drop.conditions) return true

        const conditions = drop.conditions

        if (conditions.weather && context.weather !== conditions.weather) return false
        if (conditions.season && context.season !== conditions.season) return false
        if (conditions.townLevel && (context.townLevel || 0) < conditions.townLevel) return false
        if (conditions.skillLevel && (context.skillLevels?.[conditions.skillLevel.toString()] || 0) < conditions.skillLevel) return false
        if (conditions.toolGrade && (context.toolGrade || 0) < conditions.toolGrade) return false
        if (conditions.firstDaily && !context.isFirstDaily) return false
        if (conditions.bonusSuccess !== undefined && (context.bonusSuccess || false) !== conditions.bonusSuccess) return false
        if (conditions.event && context.event !== conditions.event) return false
        if (conditions.museumComplete && (context.museumComplete || 0) < conditions.museumComplete) return false

        return true
    }

    private static calculateDropCount(drop: DropEntry, context: GatherContext): number {
        // 숙련도 보너스 드랍 확률 증가는 이미 calculateDrops에서 처리
        // 여기서는 수량 계산만
        return Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min
    }
}
