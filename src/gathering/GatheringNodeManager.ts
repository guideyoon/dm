import { GatheringNode, NodeState, DropEntry } from './GatheringNode'

export class GatheringNodeManager {
    private nodes: Map<string, GatheringNode> = new Map()
    private nodeStates: Map<string, NodeState> = new Map()
    private dailyResetHour: number = 5

    constructor() {
        this.initializeMasterNodes()
    }

    private initializeMasterNodes() {
        // ga.md의 마스터 데이터 샘플 노드 템플릿 구현
        const masterNodes: GatheringNode[] = [
            {
                nodeId: 'node_tree_small_branch',
                category: 'wood',
                zone: 'forest',
                requiredToolType: 'hand',
                interactTimeSec: 1.0,
                respawnType: 'time',
                respawnMinutes: 6,
                durabilityCost: 0,
                xpReward: 2,
                baseDrops: [
                    { itemId: '나뭇가지', min: 2, max: 3, chancePct: 100 } // 밸런스 조정: 최소 드롭량 증가
                ],
                bonusDrops: [
                    { itemId: '작은 수액', min: 1, max: 1, chancePct: 5, conditions: { weather: 'sunny' } },
                    { itemId: '레시피 힌트 종이', min: 1, max: 1, chancePct: 1, conditions: { townLevel: 2 } }
                ]
            },
            {
                nodeId: 'node_tree_tap_sap',
                category: 'wood',
                zone: 'forest',
                requiredToolType: 'axe',
                interactTimeSec: 1.6,
                respawnType: 'time',
                respawnMinutes: 12,
                durabilityCost: 1,
                xpReward: 4,
                baseDrops: [
                    { itemId: '작은 수액', min: 1, max: 1, chancePct: 100 }
                ],
                bonusDrops: [
                    { itemId: '희귀 수액', min: 1, max: 1, chancePct: 2, conditions: { season: 'spring' } },
                    { itemId: '곤충 유인제', min: 1, max: 1, chancePct: 3, conditions: { event: 'none' } }
                ]
            },
            {
                nodeId: 'node_tree_log',
                category: 'wood',
                zone: 'forest',
                requiredToolType: 'axe',
                interactTimeSec: 1.8,
                respawnType: 'time',
                respawnMinutes: 20,
                durabilityCost: 2,
                xpReward: 6,
                baseDrops: [
                    { itemId: '나무 통나무', min: 1, max: 1, chancePct: 100 }
                ],
                bonusDrops: [
                    { itemId: '단단한 나무', min: 1, max: 1, chancePct: 6, conditions: { toolGrade: 2 } },
                    { itemId: '장식 토큰', min: 1, max: 1, chancePct: 1, conditions: { townLevel: 1 } }
                ],
                hasBonusGame: true
            },
            {
                nodeId: 'node_rock_stone',
                category: 'mineral',
                zone: 'hill',
                requiredToolType: 'hand', // 일단 hand로 변경 (나중에 도구 시스템 구현 시 pickaxe로 변경 가능)
                interactTimeSec: 1.6,
                respawnType: 'time',
                respawnMinutes: 10,
                durabilityCost: 1,
                xpReward: 4,
                baseDrops: [
                    { itemId: '돌', min: 2, max: 4, chancePct: 100 } // 밸런스 조정: 최소 드롭량 증가
                ],
                bonusDrops: [
                    { itemId: '점토', min: 1, max: 2, chancePct: 10 },
                    { itemId: '철광석', min: 1, max: 1, chancePct: 6 },
                    { itemId: '보석 조각', min: 1, max: 1, chancePct: 1, conditions: { bonusSuccess: true } }
                ],
                hasBonusGame: true
            },
            {
                nodeId: 'node_rock_iron',
                category: 'mineral',
                zone: 'hill',
                requiredToolType: 'pickaxe',
                interactTimeSec: 1.8,
                respawnType: 'time',
                respawnMinutes: 18,
                durabilityCost: 2,
                xpReward: 7,
                baseDrops: [
                    { itemId: '철광석', min: 1, max: 2, chancePct: 100 }
                ],
                bonusDrops: [
                    { itemId: '은 광석', min: 1, max: 1, chancePct: 4, conditions: { townLevel: 3 } },
                    { itemId: '보석 조각', min: 1, max: 1, chancePct: 2, conditions: { bonusSuccess: true } },
                    { itemId: '박물관 조각', min: 1, max: 1, chancePct: 1, conditions: { firstDaily: true } }
                ],
                hasBonusGame: true
            },
            {
                nodeId: 'node_flower_patch',
                category: 'plant',
                zone: 'meadow',
                requiredToolType: 'hand',
                interactTimeSec: 1.2,
                respawnType: 'time',
                respawnMinutes: 8,
                durabilityCost: 0,
                xpReward: 3,
                baseDrops: [
                    { itemId: '일반 꽃', min: 1, max: 2, chancePct: 100 }
                ],
                bonusDrops: [
                    { itemId: '희귀 꽃', min: 1, max: 1, chancePct: 5, conditions: { season: 'summer' } },
                    { itemId: '무작위 씨앗', min: 1, max: 1, chancePct: 6 }
                ]
            },
            {
                nodeId: 'node_herb_cluster',
                category: 'plant',
                zone: 'forest',
                requiredToolType: 'hand',
                interactTimeSec: 1.2,
                respawnType: 'time',
                respawnMinutes: 8,
                durabilityCost: 0,
                xpReward: 3,
                baseDrops: [
                    { itemId: '녹색 허브', min: 1, max: 2, chancePct: 100 }
                ],
                bonusDrops: [
                    { itemId: '파란 허브', min: 1, max: 1, chancePct: 3, conditions: { weather: 'rainy' } },
                    { itemId: '기본 물약 레시피', min: 1, max: 1, chancePct: 1, conditions: { skillLevel: 5 } }
                ]
            },
            {
                nodeId: 'node_beach_shell_line',
                category: 'beach',
                zone: 'beach',
                requiredToolType: 'hand',
                interactTimeSec: 0.9,
                respawnType: 'time',
                respawnMinutes: 5,
                durabilityCost: 0,
                xpReward: 2,
                baseDrops: [
                    { itemId: '일반 조개', min: 1, max: 2, chancePct: 100 }
                ],
                bonusDrops: [
                    { itemId: '해초', min: 1, max: 1, chancePct: 12 },
                    { itemId: '병 속 메시지', min: 1, max: 1, chancePct: 2, conditions: { firstDaily: true } }
                ]
            },
            {
                nodeId: 'node_mushroom_spot_daily',
                category: 'plant',
                zone: 'forest',
                requiredToolType: 'hand',
                interactTimeSec: 1.4,
                respawnType: 'daily',
                dailyResetAt: 5,
                durabilityCost: 0,
                xpReward: 8,
                baseDrops: [
                    { itemId: '일반 버섯', min: 1, max: 2, chancePct: 100 }
                ],
                bonusDrops: [
                    { itemId: '희귀 버섯', min: 1, max: 1, chancePct: 15, conditions: { season: 'autumn' } },
                    { itemId: '숲 테마 아이템', min: 1, max: 1, chancePct: 2, conditions: { museumComplete: 10 } }
                ]
            },
            {
                nodeId: 'node_fossil_dig_daily',
                category: 'special',
                zone: 'residential',
                requiredToolType: 'shovel',
                interactTimeSec: 1.9,
                respawnType: 'daily',
                dailyResetAt: 5,
                durabilityCost: 1,
                xpReward: 10,
                baseDrops: [
                    { itemId: '화석', min: 1, max: 1, chancePct: 100 }
                ],
                bonusDrops: [
                    { itemId: '완전한 화석', min: 1, max: 1, chancePct: 8, conditions: { skillLevel: 8 } },
                    { itemId: '고대 조각', min: 1, max: 1, chancePct: 4, conditions: { weather: 'cloudy' } },
                    { itemId: '장식 토큰', min: 1, max: 1, chancePct: 2, conditions: { firstDaily: true } }
                ]
            },
            {
                nodeId: 'node_berry_bush',
                category: 'plant',
                zone: 'forest',
                requiredToolType: 'hand',
                interactTimeSec: 1.0,
                respawnType: 'time',
                respawnMinutes: 8,
                durabilityCost: 0,
                xpReward: 3,
                baseDrops: [
                    { itemId: '열매', min: 2, max: 4, chancePct: 100 } // 밸런스 조정: 최소 드롭량 증가
                ],
                bonusDrops: [
                    { itemId: '무작위 씨앗', min: 1, max: 1, chancePct: 8 }
                ]
            },
            {
                nodeId: 'node_herb_patch',
                category: 'plant',
                zone: 'meadow',
                requiredToolType: 'hand',
                interactTimeSec: 1.2,
                respawnType: 'time',
                respawnMinutes: 6,
                durabilityCost: 0,
                xpReward: 2,
                baseDrops: [
                    { itemId: '녹색 허브', min: 1, max: 2, chancePct: 100 }
                ],
                bonusDrops: [
                    { itemId: '파란 허브', min: 1, max: 1, chancePct: 5, conditions: { weather: 'rainy' } }
                ]
            },
            {
                nodeId: 'node_fruit_tree',
                category: 'plant',
                zone: 'forest',
                requiredToolType: 'hand',
                interactTimeSec: 1.0,
                respawnType: 'time',
                respawnMinutes: 15,
                durabilityCost: 0,
                xpReward: 4,
                baseDrops: [
                    { itemId: '사과', min: 1, max: 2, chancePct: 100 }
                ],
                bonusDrops: [
                    { itemId: '황금 열매', min: 1, max: 1, chancePct: 3, conditions: { season: 'autumn' } }
                ]
            },
            {
                nodeId: 'node_mushroom_patch',
                category: 'plant',
                zone: 'forest',
                requiredToolType: 'hand',
                interactTimeSec: 1.4,
                respawnType: 'time',
                respawnMinutes: 12,
                durabilityCost: 0,
                xpReward: 5,
                baseDrops: [
                    { itemId: '버섯', min: 1, max: 2, chancePct: 100 }
                ],
                bonusDrops: [
                    { itemId: '희귀 버섯', min: 1, max: 1, chancePct: 10, conditions: { season: 'autumn' } }
                ]
            },
            {
                nodeId: 'node_flower_single',
                category: 'plant',
                zone: 'meadow',
                requiredToolType: 'hand',
                interactTimeSec: 0.8,
                respawnType: 'time',
                respawnMinutes: 5,
                durabilityCost: 0,
                xpReward: 2,
                baseDrops: [
                    { itemId: '꽃', min: 1, max: 1, chancePct: 100 }
                ],
                bonusDrops: [
                    { itemId: '희귀 꽃', min: 1, max: 1, chancePct: 3, conditions: { season: 'summer' } }
                ]
            },
            {
                nodeId: 'node_shell_spot',
                category: 'beach',
                zone: 'beach',
                requiredToolType: 'hand',
                interactTimeSec: 0.9,
                respawnType: 'time',
                respawnMinutes: 10,
                durabilityCost: 0,
                xpReward: 3,
                baseDrops: [
                    { itemId: '일반 조개', min: 1, max: 2, chancePct: 100 }
                ],
                bonusDrops: [
                    { itemId: '희귀 조개', min: 1, max: 1, chancePct: 5 }
                ]
            },
            {
                nodeId: 'node_tree_stump',
                category: 'wood',
                zone: 'forest',
                requiredToolType: 'hand',
                interactTimeSec: 1.5,
                respawnType: 'time',
                respawnMinutes: 20,
                durabilityCost: 0,
                xpReward: 4,
                baseDrops: [
                    { itemId: '나무', min: 2, max: 3, chancePct: 100 } // 밸런스 조정: 최소 드롭량 증가
                ],
                bonusDrops: [
                    { itemId: '단단한 나무', min: 1, max: 1, chancePct: 8 }
                ]
            }
        ]

        masterNodes.forEach(node => {
            this.nodes.set(node.nodeId, node)
            this.nodeStates.set(node.nodeId, {
                nodeId: node.nodeId,
                lastHarvested: 0,
                available: true,
                dailyClaimed: false,
                harvestCount: 0 // 채집 횟수 초기화
            })
        })
    }

    public getNode(nodeId: string): GatheringNode | undefined {
        return this.nodes.get(nodeId)
    }

    public getAllNodes(): GatheringNode[] {
        return Array.from(this.nodes.values())
    }

    public getNodesByCategory(category: string): GatheringNode[] {
        return this.getAllNodes().filter(n => n.category === category)
    }

    public getNodeState(nodeId: string): NodeState | undefined {
        return this.nodeStates.get(nodeId)
    }

    public isNodeAvailable(nodeId: string): boolean {
        const node = this.getNode(nodeId)
        const state = this.getNodeState(nodeId)
        if (!node || !state) return false

        if (!state.available) return false

        // 일일 리셋 노드 체크
        if (node.respawnType === 'daily') {
            if (state.dailyClaimed) return false
            return this.checkDailyReset(node)
        }

        // 시간 재생 노드 체크
        if (node.respawnType === 'time') {
            const now = Date.now()
            const respawnTime = state.lastHarvested + (node.respawnMinutes! * 60 * 1000)
            return now >= respawnTime
        }

        return true
    }

    private checkDailyReset(node: GatheringNode): boolean {
        const now = new Date()
        const resetHour = node.dailyResetAt || this.dailyResetHour
        
        // 오늘 05시 이후인지 확인
        const todayReset = new Date(now.getFullYear(), now.getMonth(), now.getDate(), resetHour, 0, 0)
        return now >= todayReset
    }

    public markNodeHarvested(nodeId: string): boolean {
        const state = this.nodeStates.get(nodeId)
        const node = this.getNode(nodeId)
        if (!state || !node) return false

        state.lastHarvested = Date.now()
        state.harvestCount = (state.harvestCount || 0) + 1
        
        // 채집 횟수가 3에 도달하면 완전히 소진된 것으로 표시
        if (state.harvestCount >= 3) {
            state.available = false
            return true // 완전히 소진되었음을 반환
        }
        
        if (node.respawnType === 'daily') {
            state.dailyClaimed = true
            // 다음 날 리셋 체크는 별도 로직에서 처리
        } else {
            state.available = false
            // 시간 재생은 isNodeAvailable에서 체크
        }
        
        return false // 아직 소진되지 않음
    }
    
    public getHarvestCount(nodeId: string): number {
        const state = this.nodeStates.get(nodeId)
        return state?.harvestCount || 0
    }

    public resetDailyNodes() {
        this.nodeStates.forEach((state, nodeId) => {
            const node = this.getNode(nodeId)
            if (node && node.respawnType === 'daily') {
                if (this.checkDailyReset(node)) {
                    state.dailyClaimed = false
                    state.available = true
                }
            }
        })
    }

    public updateNodeAvailability() {
        this.nodeStates.forEach((state, nodeId) => {
            const node = this.getNode(nodeId)
            if (!node) return

            if (node.respawnType === 'time') {
                const now = Date.now()
                const respawnTime = state.lastHarvested + (node.respawnMinutes! * 60 * 1000)
                if (now >= respawnTime) {
                    state.available = true
                }
            }
        })
    }
}
