import { GatheringNodeManager } from './GatheringNodeManager'
import { DropTable, GatherResult, GatherContext } from './DropTable'
import { SkillSystem } from './SkillSystem'
import { BonusGame } from './BonusGame'
import { GatheringNode, NodeCategory } from './GatheringNode'
import { InventoryManager } from '../InventoryManager'

export class GatheringSystem {
    private nodeManager: GatheringNodeManager
    private skillSystem: SkillSystem
    private bonusGame: BonusGame
    private inventoryManager: InventoryManager
    private timeSystem: any = null // TimeSystem
    private weatherSystem: any = null // WeatherSystem
    private museumSystem: any = null // MuseumSystem
    
    // 일일 첫 채집 추적
    private dailyFirstGather: Map<string, number> = new Map() // 노드 ID -> 날짜 (day number)

    // 메시 이름과 노드 ID 매핑
    private meshToNodeMap: Map<string, string> = new Map()

    constructor(inventoryManager: InventoryManager) {
        this.nodeManager = new GatheringNodeManager()
        this.skillSystem = new SkillSystem()
        this.bonusGame = new BonusGame()
        this.inventoryManager = inventoryManager

        this.initializeMeshMapping()
        
        // 노드 가용성 업데이트 (주기적으로 체크)
        setInterval(() => {
            this.nodeManager.updateNodeAvailability()
            this.nodeManager.resetDailyNodes()
        }, 60000) // 1분마다 체크
    }

    private initializeMeshMapping() {
        // 기존 메시 이름을 노드 ID에 매핑
        // 나무 = node_tree_small_branch 또는 node_tree_log
        // 바위 = node_rock_stone 또는 node_rock_iron
        this.meshToNodeMap.set('trunk', 'node_tree_small_branch')
        this.meshToNodeMap.set('leaves', 'node_tree_small_branch')
        this.meshToNodeMap.set('rock', 'node_rock_stone')
        this.meshToNodeMap.set('rockPile', 'node_rock_stone')
        
        // 새로운 채집 가능한 오브젝트들
        this.meshToNodeMap.set('berryBush', 'node_berry_bush')
        this.meshToNodeMap.set('herb', 'node_herb_patch')
        this.meshToNodeMap.set('fruitTree', 'node_fruit_tree')
        this.meshToNodeMap.set('mushroomCap', 'node_mushroom_patch')
        this.meshToNodeMap.set('petal', 'node_flower_single')
        this.meshToNodeMap.set('flowerCenter', 'node_flower_single')
        this.meshToNodeMap.set('shell', 'node_shell_spot')
        this.meshToNodeMap.set('stump', 'node_tree_stump')
    }

    public getNodeIdFromMesh(meshName: string): string | null {
        // 메시 이름에서 노드 ID 찾기
        for (const [key, nodeId] of this.meshToNodeMap) {
            if (meshName.includes(key)) {
                return nodeId
            }
        }
        return null
    }

    public async gather(meshName: string, toolType: string = 'hand', skipAvailabilityCheck: boolean = false): Promise<GatherResult | null> {
        const nodeId = this.getNodeIdFromMesh(meshName)
        console.log('gather 호출:', meshName, '-> nodeId:', nodeId, 'skipAvailabilityCheck:', skipAvailabilityCheck)
        
        if (!nodeId) {
            console.warn('메시 이름에 해당하는 노드 ID를 찾을 수 없음:', meshName)
            return null
        }

        const node = this.nodeManager.getNode(nodeId)
        if (!node) {
            console.warn('노드를 찾을 수 없음:', nodeId)
            return null
        }

        // 노드 가용성 체크 (skipAvailabilityCheck가 false일 때만)
        if (!skipAvailabilityCheck) {
            const isAvailable = this.nodeManager.isNodeAvailable(nodeId)
            console.log('노드 가용성:', nodeId, '=', isAvailable)
            
            if (!isAvailable) {
                console.log('노드가 아직 재생 중:', nodeId)
                return null
            }
        } else {
            console.log('노드 가용성 체크 스킵 (메시별 채집 횟수로 관리)')
        }

        // 도구 타입 체크
        if (node.requiredToolType !== toolType) {
            console.log('도구 타입 불일치:', '필요:', node.requiredToolType, '현재:', toolType)
            // 도구가 맞지 않으면 null 반환 (UI에서 도구 교체 안내)
            return null
        }

        // 보너스 게임 체크 (선택형)
        let bonusSuccess = false
        if (node.hasBonusGame) {
            const bonusResult = this.bonusGame.calculateAutoBonus(0.3) // 30% 자동 성공 (실제로는 UI 필요)
            bonusSuccess = bonusResult.success
        }

        // 날씨 가져오기
        let weather = 'sunny'
        if (this.weatherSystem && typeof (this.weatherSystem as any).getWeatherType === 'function') {
            weather = (this.weatherSystem as any).getWeatherType() || 'sunny'
        }
        
        // 계절 가져오기
        let season = 'spring'
        if (this.timeSystem && typeof (this.timeSystem as any).getSeason === 'function') {
            season = (this.timeSystem as any).getSeason() || 'spring'
        }
        
        // 일일 첫 채집 체크
        const currentDay = this.timeSystem ? ((this.timeSystem as any).getTime ? (this.timeSystem as any).getTime().day : 1) : 1
        const lastGatherDay = this.dailyFirstGather.get(nodeId) || 0
        const isFirstDaily = currentDay > lastGatherDay
        
        if (isFirstDaily) {
            this.dailyFirstGather.set(nodeId, currentDay)
        }
        
        // 박물관 완성도 계산 (0-100)
        let museumComplete = 0
        if (this.museumSystem && typeof (this.museumSystem as any).getDonationProgress === 'function') {
            museumComplete = Math.floor((this.museumSystem as any).getDonationProgress() || 0)
        }

        // 수집 컨텍스트 생성
        const context: GatherContext = {
            weather: weather,
            season: season as any,
            townLevel: 1, // TODO: 마을 등급 시스템과 연동 (향후 구현)
            skillLevels: {
                plant: this.skillSystem.getLevel('plant'),
                wood: this.skillSystem.getLevel('wood'),
                mineral: this.skillSystem.getLevel('mineral'),
                beach: this.skillSystem.getLevel('beach'),
                special: this.skillSystem.getLevel('special')
            },
            toolGrade: 1, // TODO: 도구 등급 시스템과 연동 (향후 구현)
            isFirstDaily: isFirstDaily,
            bonusSuccess: bonusSuccess,
            event: 'none',
            museumComplete: museumComplete
        }

        // 드랍 계산 (DropTable은 정적 클래스)
        const result = DropTable.calculateDrops(node, context)

        // 인벤토리에 아이템 추가
        result.items.forEach(item => {
            const success = this.inventoryManager.add(item.itemId, item.count)
            if (!success) {
                console.warn('인벤토리에 아이템 추가 실패:', item.itemId, item.count)
            } else {
                console.log('인벤토리에 아이템 추가 성공:', item.itemId, item.count)
            }
        })

        // 숙련도 XP 추가
        const skillResult = this.skillSystem.addXP(node.category, result.xpGained)

        // 노드 상태 업데이트 (skipAvailabilityCheck일 때는 노드 가용성 업데이트 스킵)
        // 메시별 채집 횟수는 PlayerController에서 관리하므로, 노드 가용성은 업데이트하지 않음
        if (!skipAvailabilityCheck) {
            const isDepleted = this.nodeManager.markNodeHarvested(nodeId)
            result.depleted = isDepleted
            result.harvestCount = this.nodeManager.getHarvestCount(nodeId)
        } else {
            // 메시별 채집 횟수로 관리하므로, 노드 상태는 업데이트하지 않음
            result.depleted = false
            result.harvestCount = 0
        }

        // 레벨업 알림 (필요시)
        if (skillResult.leveledUp && skillResult.newLevel) {
            // UI에 레벨업 알림 표시 가능
        }

        return result
    }

    public getNode(meshName: string): GatheringNode | null {
        const nodeId = this.getNodeIdFromMesh(meshName)
        if (!nodeId) return null
        return this.nodeManager.getNode(nodeId) || null
    }

    public isNodeAvailable(meshName: string): boolean {
        const nodeId = this.getNodeIdFromMesh(meshName)
        if (!nodeId) return false
        return this.nodeManager.isNodeAvailable(nodeId)
    }

    public getNodeName(meshName: string): string {
        const node = this.getNode(meshName)
        if (!node) return meshName

        const nodeNames: { [key: string]: string } = {
            'node_tree_small_branch': '나무 가지',
            'node_tree_tap_sap': '나무 수액',
            'node_tree_log': '나무 통나무',
            'node_rock_stone': '돌',
            'node_rock_iron': '철광석',
            'node_flower_patch': '꽃밭',
            'node_flower_single': '꽃',
            'node_herb_cluster': '약초',
            'node_herb_patch': '약초',
            'node_beach_shell_line': '조개',
            'node_shell_spot': '조개',
            'node_mushroom_spot_daily': '버섯',
            'node_mushroom_patch': '버섯',
            'node_fossil_dig_daily': '화석',
            'node_berry_bush': '베리 덤불',
            'node_fruit_tree': '열매 나무',
            'node_tree_stump': '나무 그루터기'
        }

        return nodeNames[node.nodeId] || node.nodeId
    }

    public getSkillSystem(): SkillSystem {
        return this.skillSystem
    }

    public getNodeManager(): GatheringNodeManager {
        return this.nodeManager
    }
    
    public setTimeSystem(timeSystem: any) {
        this.timeSystem = timeSystem
    }
    
    public setWeatherSystem(weatherSystem: any) {
        this.weatherSystem = weatherSystem
    }
    
    public setMuseumSystem(museumSystem: any) {
        this.museumSystem = museumSystem
    }
}
