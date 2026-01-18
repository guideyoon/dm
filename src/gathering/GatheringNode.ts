export type NodeCategory = 'plant' | 'wood' | 'mineral' | 'beach' | 'special'
export type ToolType = 'hand' | 'axe' | 'pickaxe' | 'shovel' | 'watering_can'
export type RespawnType = 'time' | 'daily'

export interface DropEntry {
    itemId: string
    min: number
    max: number
    chancePct: number
    conditions?: {
        weather?: string
        season?: string
        townLevel?: number
        skillLevel?: number
        toolGrade?: number
        firstDaily?: boolean
        bonusSuccess?: boolean
        event?: string
        museumComplete?: number
    }
}

export interface GatheringNode {
    nodeId: string
    category: NodeCategory
    zone: string
    requiredToolType: ToolType
    interactTimeSec: number
    respawnType: RespawnType
    respawnMinutes?: number // time 타입일 때
    dailyResetAt?: number // daily 타입일 때 (시간 0-23)
    durabilityCost: number
    xpReward: number
    baseDrops: DropEntry[]
    bonusDrops: DropEntry[]
    hasBonusGame?: boolean // 선택형 보너스 미니게임 여부
}

export interface NodeState {
    nodeId: string
    lastHarvested: number // timestamp
    available: boolean
    dailyClaimed?: boolean // daily 타입일 때
    harvestCount: number // 채집 횟수 (최대 3회)
}
