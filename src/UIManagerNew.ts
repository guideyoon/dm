import { InventoryManager, InventoryItem } from './InventoryManager'
import { ItemRarityManager } from './utils/ItemRarity'
import { CraftingSystem } from './CraftingSystem'
import { TopStatusBar } from './ui/TopStatusBar'
import { LeftMenuBar, MenuType } from './ui/LeftMenuBar'
import { ContextPanel } from './ui/ContextPanel'
import { BottomActionBar, ActionButton } from './ui/BottomActionBar'
import { ObjectInteractionPopup } from './ui/ObjectInteractionPopup'
import { HarvestProgressBar } from './ui/HarvestProgressBar'
import { QuickSlotBar } from './ui/QuickSlotBar'
import { MiniMap } from './ui/MiniMap'
import { SaveNotification } from './ui/SaveNotification'
import { Vector3 } from '@babylonjs/core'
import { TimeSystem, GameTime } from './systems/TimeSystem'

export class UIManagerNew {
    private messageElement: HTMLDivElement
    private topStatusBar: TopStatusBar
    private leftMenuBar: LeftMenuBar
    private contextPanel: ContextPanel
    private bottomActionBar: BottomActionBar
    private quickSlotBar: QuickSlotBar
    private objectInteractionPopup: ObjectInteractionPopup | null = null
    private harvestProgressBar: HarvestProgressBar
    private saveNotification: SaveNotification
    private inventoryManager: InventoryManager | null = null
    private craftingSystem: CraftingSystem | null = null
    private playerController: any = null // PlayerController 참조 (자동 채집 토글용)
    private timeSystem: TimeSystem | null = null
    private shopSystem: any = null
    private codexSystem: any = null
    private missionSystem: any = null
    private museumSystem: any = null
    private buildingSystem: any = null
    private currencySystem: any = null
    private customizationSystem: any = null
    private petSystem: any = null
    private soundSystem: any = null // SoundSystem 참조
    private interiorSystem: any = null // BuildingInteriorSystem 참조
    private tutorialSystem: any = null // TutorialSystem 참조
    private tutorialPanel: any = null // TutorialPanel 참조
    private pendingBuildingType: string | null = null // 건물 배치 모드: 배치할 건물 타입
    private pendingDecorationType: string | null = null // 꾸미기 배치 모드: 배치할 가구 타입
    
    // 필터 상태
    private codexFilter: string | null = null // 도감 필터 (카테고리)
    private missionFilter: string | null = null // 미션 필터 (타입)
    private museumFilter: string | null = null // 박물관 필터 (카테고리)
    private craftFilter: string | null = null // 제작 필터 (카테고리)
    private inventoryFilter: string | null = null // 인벤토리 필터 (카테고리)
    private inventorySort: 'name' | 'count' | 'type' = 'name' // 인벤토리 정렬 기준

    constructor() {
        // 토스트 메시지 요소 (기존 호환성 유지)
        this.messageElement = document.createElement('div')
        this.messageElement.id = 'interaction-ui'
        this.setupMessageStyles()
        document.body.appendChild(this.messageElement)

        // 새로운 UI 컴포넌트들
        this.topStatusBar = new TopStatusBar()
        this.leftMenuBar = new LeftMenuBar()
        this.contextPanel = new ContextPanel()
        this.bottomActionBar = new BottomActionBar()
        this.quickSlotBar = new QuickSlotBar()
        this.harvestProgressBar = new HarvestProgressBar()
        this.saveNotification = new SaveNotification()

        // 메뉴 클릭 핸들러 설정
        this.leftMenuBar.setOnMenuClick((menu) => {
            if (menu) {
                this.handleMenuClick(menu)
            } else {
                this.contextPanel.close()
            }
        })
    }

    private setupMessageStyles() {
        Object.assign(this.messageElement.style, {
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '15px 30px',
            borderRadius: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#ffffff',
            fontSize: '20px',
            fontWeight: '600',
            textAlign: 'center',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            display: 'none',
            transition: 'opacity 0.3s ease',
            zIndex: '2000',
            pointerEvents: 'none',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        })
    }

    private timeout: number | null = null

    public showMessage(text: string, persistent: boolean = false) {
        if (this.timeout) {
            clearTimeout(this.timeout)
            this.timeout = null
        }

        this.messageElement.innerText = text
        this.messageElement.style.display = 'block'
        this.messageElement.style.opacity = '1'

        if (!persistent) {
            this.timeout = window.setTimeout(() => {
                this.hideMessage()
            }, 2000)
        }
    }

    public showHarvestResult(nodeName: string, items: { itemId: string; count: number }[], bonusSuccess: boolean = false) {
        if (this.timeout) {
            clearTimeout(this.timeout)
            this.timeout = null
        }

        // 채집 결과 HTML 생성 (희귀도 표시 포함)
        let itemsHtml = items.map(item => {
            const displayName = this.getItemDisplayName(item.itemId)
            const rarityData = ItemRarityManager.getRarity(item.itemId)
            const color = rarityData.color
            const rarityBadge = rarityData.rarity !== 'common' ? ` <span style="color: ${color}; font-size: 10px;">[${rarityData.name}]</span>` : ''
            return `<span style="color: ${color};">${displayName} x${item.count}${rarityBadge}</span>`
        }).join(', ')

        const title = bonusSuccess ? `${nodeName} 채집 완료! (보너스!)` : `${nodeName} 채집 완료!`
        const message = `${title}\n${itemsHtml}`

        this.messageElement.innerHTML = message.replace(/\n/g, '<br>')
        this.messageElement.style.display = 'block'
        this.messageElement.style.opacity = '1'

        // 채집 결과는 3초간 표시
        this.timeout = window.setTimeout(() => {
            this.hideMessage()
        }, 3000)
    }

    public hideMessage() {
        if (this.timeout) {
            clearTimeout(this.timeout)
            this.timeout = null
        }

        this.messageElement.style.opacity = '0'
        setTimeout(() => {
            if (this.messageElement.style.opacity === '0') {
                this.messageElement.style.display = 'none'
            }
        }, 300)
    }

    public setInventoryManager(inventoryManager: InventoryManager) {
        this.inventoryManager = inventoryManager
    }

    public setCraftingSystem(craftingSystem: CraftingSystem) {
        this.craftingSystem = craftingSystem
    }

    public setPlayerController(playerController: any) {
        this.playerController = playerController
        // 자동 채집 토글 버튼 설정
        if (playerController) {
            this.topStatusBar.setAutoHarvestToggle(() => {
                const isEnabled = playerController.toggleAutoHarvest()
                return isEnabled
            })
        }
    }

    public updateInventory() {
        // 가방 패널이 열려있으면 인벤토리 업데이트
        if (this.contextPanel.isPanelOpen() && this.contextPanel.getCurrentMenu() === 'bag') {
            console.log('가방 패널 열려있음, 인벤토리 업데이트')
            this.showBagPanel()
        } else {
            console.log('가방 패널 닫혀있음, 인벤토리는 실제로 추가됨 (UI는 열 때 표시)')
        }
    }

    private handleMenuClick(menu: MenuType) {
        // 메뉴 클릭 효과음
        if (this.soundSystem) {
            this.soundSystem.playSound('ui_click')
        }
        
        switch (menu) {
            case 'home':
                this.showHomePanel()
                break
            case 'bag':
                this.showBagPanel()
                // 튜토리얼: 인벤토리 열기 완료
                if (this.tutorialSystem) {
                    this.tutorialSystem.completeStep('inventory')
                }
                break
            case 'craft':
                this.showCraftPanel()
                // 튜토리얼: 제작 패널 열기 완료
                if (this.tutorialSystem) {
                    this.tutorialSystem.completeStep('crafting')
                }
                break
            case 'map':
                this.contextPanel.open(menu, '지도', '지도 화면입니다.')
                break
            case 'codex':
                this.showCodexPanel()
                break
            case 'missions':
                this.showMissionPanel()
                break
            case 'shop':
                this.showShopPanel()
                // 튜토리얼: 상점 패널 열기 완료
                if (this.tutorialSystem) {
                    this.tutorialSystem.completeStep('shop')
                }
                break
            case 'customize':
                this.showCustomizationPanel()
                break
            case 'pets':
                this.showPetPanel()
                break
            case 'settings':
                this.showSettingsPanel()
                break
            case 'photo':
                this.showPhotoMode()
                break
            default:
                this.contextPanel.open(menu, menu, `${menu} 화면입니다.`)
                break
        }
    }

    private showHomePanel() {
        // 게임 통계 수집
        const codexCompletion = this.codexSystem ? Math.round(this.codexSystem.getCompletionRate()) : 0
        const museumDonation = this.codexSystem ? Math.round(this.codexSystem.getDonationRate()) : 0
        
        const dailyMissions = this.missionSystem ? this.missionSystem.getMissions('daily') : []
        const completedMissions = dailyMissions.filter(m => m.status === 'completed' || m.status === 'claimed')
        const activeMissions = dailyMissions.filter(m => m.status === 'active')
        const completedCount = completedMissions.length
        const totalCount = dailyMissions.length
        
        const achievementSystem = (window as any).achievementSystem
        const achievementStats = achievementSystem ? {
            total: achievementSystem.getAchievements().length,
            completed: achievementSystem.getAchievements().filter((a: any) => a.completed).length,
            mileage: achievementSystem.getMileagePoints ? achievementSystem.getMileagePoints() : 0
        } : { total: 0, completed: 0, mileage: 0 }
        
        const coins = this.currencySystem ? this.currencySystem.getCoins() : 0
        const tokens = this.currencySystem ? this.currencySystem.getTokens() : 0
        
        const inventoryCount = this.inventoryManager ? this.inventoryManager.list().length : 0
        const inventoryMax = this.inventoryManager ? this.inventoryManager.getMaxSlots() : 0
        
        // 오늘 할 일 목록 생성
        let todayTasksHtml = ''
        if (activeMissions.length > 0) {
            activeMissions.slice(0, 5).forEach(mission => {
                const progressPercent = Math.round((mission.progress / mission.target) * 100)
                todayTasksHtml += `
                    <li style="padding: 10px; margin: 5px 0; background: rgba(255,255,255,0.1); border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>${mission.title}</span>
                            <span style="font-size: 11px; color: #aaa;">${mission.progress}/${mission.target}</span>
                        </div>
                        <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 5px; overflow: hidden;">
                            <div style="width: ${progressPercent}%; height: 100%; background: #4CAF50; transition: width 0.3s;"></div>
                        </div>
                    </li>
                `
            })
        } else {
            todayTasksHtml = '<li style="padding: 10px; color: #999; text-align: center;">오늘 할 일이 없습니다.</li>'
        }
        
        const content = `
            <div style="padding: 20px;">
                <h2 style="margin: 0 0 20px 0; font-size: 24px;">대시보드</h2>
                
                <!-- 게임 통계 -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px;">
                    <div style="background: rgba(100, 150, 255, 0.2); border-radius: 12px; padding: 15px;">
                        <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">도감 완성률</div>
                        <div style="font-size: 28px; font-weight: bold; color: #64B5F6;">${codexCompletion}%</div>
                        <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; margin-top: 8px; overflow: hidden;">
                            <div style="width: ${codexCompletion}%; height: 100%; background: #64B5F6; transition: width 0.3s;"></div>
                        </div>
                    </div>
                    <div style="background: rgba(76, 175, 80, 0.2); border-radius: 12px; padding: 15px;">
                        <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">미술관 기증률</div>
                        <div style="font-size: 28px; font-weight: bold; color: #4CAF50;">${museumDonation}%</div>
                        <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; margin-top: 8px; overflow: hidden;">
                            <div style="width: ${museumDonation}%; height: 100%; background: #4CAF50; transition: width 0.3s;"></div>
                        </div>
                    </div>
                    <div style="background: rgba(255, 193, 7, 0.2); border-radius: 12px; padding: 15px;">
                        <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">일일 미션</div>
                        <div style="font-size: 28px; font-weight: bold; color: #FFC107;">${completedCount}/${totalCount}</div>
                        <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; margin-top: 8px; overflow: hidden;">
                            <div style="width: ${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%; height: 100%; background: #FFC107; transition: width 0.3s;"></div>
                        </div>
                    </div>
                    <div style="background: rgba(156, 39, 176, 0.2); border-radius: 12px; padding: 15px;">
                        <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">성취 달성</div>
                        <div style="font-size: 28px; font-weight: bold; color: #9C27B0;">${achievementStats.completed}/${achievementStats.total}</div>
                        <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; margin-top: 8px; overflow: hidden;">
                            <div style="width: ${achievementStats.total > 0 ? (achievementStats.completed / achievementStats.total) * 100 : 0}%; height: 100%; background: #9C27B0; transition: width 0.3s;"></div>
                        </div>
                    </div>
                </div>
                
                <!-- 자원 현황 -->
                <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; margin-bottom: 30px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 16px;">자원 현황</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                        <div style="text-align: center;">
                            <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">💰 코인</div>
                            <div style="font-size: 20px; font-weight: bold; color: #FFD700;">${coins}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">✨ 토큰</div>
                            <div style="font-size: 20px; font-weight: bold; color: #BA68C8;">${tokens}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">📦 인벤토리</div>
                            <div style="font-size: 20px; font-weight: bold; color: #4CAF50;">${inventoryCount}/${inventoryMax}</div>
                        </div>
                    </div>
                    ${achievementStats.mileage > 0 ? `
                        <div style="text-align: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);">
                            <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">🎁 마일리지</div>
                            <div style="font-size: 20px; font-weight: bold; color: #FF9800;">${achievementStats.mileage}</div>
                        </div>
                    ` : ''}
                </div>
                
                <h3>오늘 할 일</h3>
                <ul style="list-style: none; padding: 0; margin: 20px 0;">
                    ${todayTasksHtml}
                </ul>
                ${activeMissions.length > 5 ? `
                    <button onclick="window.handleMenuClick('missions')" style="padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: #fff; cursor: pointer; width: 100%; margin-top: 10px;">모든 미션 보기</button>
                ` : ''}
                
                <h3 style="margin-top: 30px;">빠른 이동</h3>
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button onclick="window.handleMenuClick('shop')" style="padding: 10px; background: rgba(100,150,255,0.3); border: none; border-radius: 8px; color: white; cursor: pointer; flex: 1;">상점</button>
                    <button onclick="window.handleMenuClick('craft')" style="padding: 10px; background: rgba(100,150,255,0.3); border: none; border-radius: 8px; color: white; cursor: pointer; flex: 1;">제작</button>
                    <button onclick="window.handleMenuClick('missions')" style="padding: 10px; background: rgba(100,150,255,0.3); border: none; border-radius: 8px; color: white; cursor: pointer; flex: 1;">미션</button>
                </div>
                <h3 style="margin-top: 30px;">튜토리얼</h3>
                <div style="margin-top: 10px;">
                    <button onclick="window.showTutorial && window.showTutorial()" style="
                        padding: 12px 24px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border: none;
                        border-radius: 8px;
                        color: white;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        width: 100%;
                        transition: all 0.3s;
                    ">튜토리얼 시작하기</button>
                </div>
                <h3 style="margin-top: 30px;">단축키 가이드</h3>
                <div style="margin-top: 10px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; font-size: 13px;">
                    <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <span>이동</span>
                        <span style="color: #FFD700;">WASD / 화살표 키</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <span>달리기</span>
                        <span style="color: #FFD700;">Shift + 이동</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <span>채집 (더블클릭)</span>
                        <span style="color: #FFD700;">오브젝트 더블클릭</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <span>퀵슬롯 사용</span>
                        <span style="color: #FFD700;">1-9 숫자 키</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <span>메뉴 닫기</span>
                        <span style="color: #FFD700;">ESC</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                        <span>카메라 회전</span>
                        <span style="color: #FFD700;">마우스 드래그</span>
                    </div>
                </div>
            </div>
        `
        this.contextPanel.open('home', '홈', content)
    }

    private showBagPanel() {
        if (!this.inventoryManager) {
            this.contextPanel.open('bag', '가방', '인벤토리가 없습니다.')
            return
        }

        let items = this.inventoryManager.list()
        
        // 필터 적용
        if (this.inventoryFilter) {
            // 아이템 타입별 필터링 (간단한 분류)
            const filterMap: { [key: string]: string[] } = {
                'material': ['나무', '돌', '철광석', '열매', '버섯', '꽃', '허브', '조개'],
                'consumable': ['순무', '당근', '토마토', '옥수수', '감자', '요리'],
                'tool': ['도끼', '곡괭이', '낚시대', '곤충채집망', '물뿌리개']
            }
            
            if (filterMap[this.inventoryFilter]) {
                items = items.filter(item => 
                    filterMap[this.inventoryFilter!].some(keyword => 
                        item.name.includes(keyword)
                    )
                )
            }
        }
        
        // 정렬 적용
        items = [...items].sort((a, b) => {
            if (this.inventorySort === 'name') {
                return this.getItemDisplayName(a.name).localeCompare(this.getItemDisplayName(b.name))
            } else if (this.inventorySort === 'count') {
                return b.count - a.count
            }
            return 0
        })

        let itemsHtml = `
            <div style="padding: 20px;">
                <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                    <div style="display: flex; gap: 5px;">
                        <button onclick="window.inventoryFilter('all')" style="padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: ${!this.inventoryFilter || this.inventoryFilter === 'all' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255,255,255,0.1)'}; color: #fff; cursor: pointer; font-size: 12px;">전체</button>
                        <button onclick="window.inventoryFilter('material')" style="padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: ${this.inventoryFilter === 'material' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255,255,255,0.1)'}; color: #fff; cursor: pointer; font-size: 12px;">재료</button>
                        <button onclick="window.inventoryFilter('consumable')" style="padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: ${this.inventoryFilter === 'consumable' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255,255,255,0.1)'}; color: #fff; cursor: pointer; font-size: 12px;">소비품</button>
                        <button onclick="window.inventoryFilter('tool')" style="padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: ${this.inventoryFilter === 'tool' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255,255,255,0.1)'}; color: #fff; cursor: pointer; font-size: 12px;">도구</button>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button onclick="window.inventorySort('name')" style="padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: ${this.inventorySort === 'name' ? 'rgba(100, 150, 255, 0.5)' : 'rgba(255,255,255,0.1)'}; color: #fff; cursor: pointer; font-size: 12px;">이름순</button>
                        <button onclick="window.inventorySort('count')" style="padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: ${this.inventorySort === 'count' ? 'rgba(100, 150, 255, 0.5)' : 'rgba(255,255,255,0.1)'}; color: #fff; cursor: pointer; font-size: 12px;">개수순</button>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
        `
        
        items.forEach(item => {
            itemsHtml += `
                <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 15px; text-align: center; transition: all 0.2s;" onmouseenter="this.style.background='rgba(255,255,255,0.2)'" onmouseleave="this.style.background='rgba(255,255,255,0.1)'">
                    <div style="font-size: 12px; margin-bottom: 5px;">${this.getItemDisplayName(item.name)}</div>
                    <div style="font-size: 18px; font-weight: bold;">${item.count}</div>
                </div>
            `
        })

        // 빈 슬롯 표시
        const emptySlots = this.inventoryManager.getMaxSlots() - items.length
        for (let i = 0; i < emptySlots; i++) {
            itemsHtml += `
                <div style="background: rgba(255,255,255,0.05); border: 1px dashed rgba(255,255,255,0.2); border-radius: 8px; padding: 15px; text-align: center;">
                    <div style="opacity: 0.3;">빈 슬롯</div>
                </div>
            `
        }

        itemsHtml += `
                </div>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 12px; color: #aaa;">
                    총 ${items.length}개 아이템 / 최대 ${this.inventoryManager.getMaxSlots()}개 슬롯
                </div>
            </div>
        `
        
        // 전역 함수 등록
        const self = this
        ;(window as any).inventoryFilter = (filter: string) => {
            self.inventoryFilter = filter === 'all' ? null : filter
            self.showBagPanel()
        }
        
        ;(window as any).inventorySort = (sort: 'name' | 'count') => {
            self.inventorySort = sort
            self.showBagPanel()
        }
        
        this.contextPanel.open('bag', '가방', itemsHtml)
    }

    private showCraftPanel() {
        if (!this.craftingSystem || !this.inventoryManager) {
            this.contextPanel.open('craft', '제작', '제작 시스템이 없습니다.')
            return
        }

        const recipes = this.craftingSystem.getAllRecipes()
        let recipesHtml = `
            <div style="padding: 20px;">
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <button onclick="window.craftFilter('all')" style="padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: #fff; cursor: pointer;">전체</button>
                    <button onclick="window.craftFilter('tool')" style="padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: #fff; cursor: pointer;">도구</button>
                    <button onclick="window.craftFilter('consumable')" style="padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: #fff; cursor: pointer;">요리</button>
                    <button onclick="window.craftFilter('furniture')" style="padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: #fff; cursor: pointer;">가구</button>
                    <button onclick="window.craftFilter('decoration')" style="padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: #fff; cursor: pointer;">장식</button>
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
        `

        // 필터 적용
        let filteredRecipes = recipes
        if (this.craftFilter) {
            filteredRecipes = recipes.filter(recipe => recipe.category === this.craftFilter)
        }

        if (filteredRecipes.length === 0) {
            recipesHtml += '<div style="text-align: center; color: #999;">제작 가능한 레시피가 없습니다.</div>'
        } else {
            filteredRecipes.forEach(recipe => {
                const canCraft = this.craftingSystem!.getRecipeManager().canCraft(
                    recipe.id,
                    this.inventoryManager!.list()
                )

                recipesHtml += `
                    <div style="padding: 15px; border: 2px solid ${canCraft ? 'rgba(100, 255, 100, 0.5)' : 'rgba(100, 100, 100, 0.3)'}; border-radius: 10px; background: ${canCraft ? 'rgba(100, 255, 100, 0.1)' : 'rgba(50, 50, 50, 0.5)'};">
                        <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">${recipe.name}</div>
                        <div style="font-size: 14px; color: #aaa; margin-bottom: 8px;">결과: ${this.getItemDisplayName(recipe.resultItem)} x${recipe.resultCount}</div>
                        ${recipe.ingredients.length > 0 ? `<div style="font-size: 12px; color: #ccc; margin-bottom: 10px;">재료: ${recipe.ingredients.map(ing => `${this.getItemDisplayName(ing.name)} x${ing.count}`).join(', ')}</div>` : ''}
                        <button onclick="window.craftItem('${recipe.id}')" style="padding: 8px 16px; border-radius: 6px; border: none; background: ${canCraft ? '#4CAF50' : '#666'}; color: #fff; cursor: ${canCraft ? 'pointer' : 'not-allowed'};" ${!canCraft ? 'disabled' : ''}>${canCraft ? '제작' : '재료 부족'}</button>
                    </div>
                `
            })
        }

        recipesHtml += '</div></div>'

        // 전역 함수로 제작 함수 등록
        const self = this
        ;(window as any).craftItem = (recipeId: string) => {
            // 제작 버튼 클릭 효과음
            if (self.soundSystem) {
                self.soundSystem.playSound('ui_click')
            }
            
            if (!self.craftingSystem) return
            const result = self.craftingSystem.craft(recipeId)
            if (result.success) {
                // 제작 성공 효과음 (아이템 획득)
                if (self.soundSystem) {
                    self.soundSystem.playSound('item_get')
                }
                self.showMessage(result.message, false)
                self.showBagPanel() // 가방 패널 새로고침
                self.showCraftPanel() // 제작 패널 새로고침
            } else {
                self.showMessage(result.message, false)
            }
        }
        
        ;(window as any).craftFilter = (category: string) => {
            self.craftFilter = category === 'all' ? null : category
            self.showCraftPanel()
        }

        this.contextPanel.open('craft', '제작', recipesHtml)
    }

    private getItemDisplayName(itemName: string): string {
        const displayNames: { [key: string]: string } = {
            'Wood': '나무',
            'Stone': '돌',
            'Berry': '열매',
            'Mushroom': '버섯',
            'Flower': '꽃'
        }
        return displayNames[itemName] || itemName
    }

    public showBottomActionBar(targetName: string, icon: string, actions: ActionButton[]) {
        this.bottomActionBar.show(targetName, icon, actions)
    }

    public hideBottomActionBar() {
        this.bottomActionBar.hide()
    }

    public setObjectInteractionPopup(popup: ObjectInteractionPopup) {
        this.objectInteractionPopup = popup
    }

    public showObjectInteractionPopup(targetName: string, icon: string, actions: ActionButton[], worldPosition: Vector3, targetMesh?: any) {
        if (this.objectInteractionPopup) {
            this.objectInteractionPopup.show(targetName, icon, actions, worldPosition, targetMesh)
        } else {
            console.warn('ObjectInteractionPopup이 설정되지 않았습니다')
        }
    }

    public hideObjectInteractionPopup() {
        if (this.objectInteractionPopup) {
            this.objectInteractionPopup.hide()
        }
    }

    public showHarvestProgress() {
        this.harvestProgressBar.show()
    }

    public hideHarvestProgress() {
        this.harvestProgressBar.hide()
    }

    public updateHarvestProgress(progress: number) {
        this.harvestProgressBar.updateProgress(progress)
    }

    public setCoins(amount: number) {
        this.topStatusBar.setCoins(amount)
    }

    public setTokens(amount: number) {
        this.topStatusBar.setTokens(amount)
    }
    
    public updateWeather(icon: string, name: string) {
        this.topStatusBar.setWeather(name, icon)
    }
    
    public setShopSystem(shopSystem: any) {
        this.shopSystem = shopSystem
    }
    
    public setSoundSystem(soundSystem: any) {
        this.soundSystem = soundSystem
    }
    
    private showShopPanel() {
        if (!this.shopSystem || !this.inventoryManager) {
            this.contextPanel.open('shop', '상점', '상점 시스템이 없습니다.')
            return
        }
        
        const shopItems = this.shopSystem.getShopItems()
        const playerCoins = this.shopSystem.getPlayerCoins()
        
        let content = `
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px; font-size: 18px; font-weight: bold;">
                    보유 코인: <span style="color: #FFD700;">${playerCoins}</span>
                </div>
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <button onclick="window.shopFilter('all')" style="padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: #fff; cursor: pointer;">전체</button>
                    <button onclick="window.shopFilter('tool')" style="padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: #fff; cursor: pointer;">도구</button>
                    <button onclick="window.shopFilter('material')" style="padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: #fff; cursor: pointer;">재료</button>
                    <button onclick="window.shopFilter('seed')" style="padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: #fff; cursor: pointer;">씨앗</button>
                </div>
                <div id="shop-items-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 500px; overflow-y: auto;">
        `
        
        shopItems.forEach(item => {
            const stockText = item.stock === -1 ? '무제한' : `재고: ${item.stock}`
            content += `
                <div style="padding: 15px; border: 2px solid rgba(255,255,255,0.2); border-radius: 10px; background: rgba(255,255,255,0.05);">
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">${item.name}</div>
                    <div style="font-size: 12px; color: #aaa; margin-bottom: 10px;">${item.description}</div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 14px;">구매: <span style="color: #4CAF50;">${item.buyPrice}</span> 코인</div>
                            <div style="font-size: 12px; color: #999;">${stockText}</div>
                        </div>
                        <button onclick="window.buyItem('${item.id}')" style="padding: 8px 16px; border-radius: 6px; border: none; background: #4CAF50; color: #fff; cursor: pointer;">구매</button>
                    </div>
                </div>
            `
        })
        
        content += `
                </div>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
                    <h3>판매</h3>
                    <div id="sell-items-list" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px;">
        `
        
        const inventoryItems = this.inventoryManager.list()
        inventoryItems.forEach(item => {
            const sellPrice = this.shopSystem.getSellPrice(item.name)
            content += `
                <div style="padding: 10px; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; background: rgba(255,255,255,0.05); text-align: center;">
                    <div style="font-size: 12px; margin-bottom: 5px;">${this.getItemDisplayName(item.name)}</div>
                    <div style="font-size: 11px; color: #999; margin-bottom: 5px;">보유: ${item.count}</div>
                    <div style="font-size: 11px; color: #FFD700; margin-bottom: 5px;">${sellPrice} 코인</div>
                    <button onclick="window.sellItem('${item.name}')" style="padding: 5px 10px; border-radius: 4px; border: none; background: #FF9800; color: #fff; cursor: pointer; font-size: 11px;">판매</button>
                </div>
            `
        })
        
        content += `
                    </div>
                </div>
            </div>
        `
        
        // 전역 함수 등록
        const self = this
        ;(window as any).buyItem = (itemId: string) => {
            // 구매 버튼 클릭 효과음
            if (self.soundSystem) {
                self.soundSystem.playSound('ui_click')
            }
            
            const result = self.shopSystem.buyItem(itemId, 1)
            if (result.success) {
                // 구매 성공 효과음 (아이템 획득)
                if (self.soundSystem) {
                    self.soundSystem.playSound('item_get')
                }
                self.showMessage(result.message, false)
                self.setCoins(self.shopSystem.getPlayerCoins())
                self.showShopPanel() // 상점 패널 새로고침
            } else {
                self.showMessage(result.message, false)
            }
        }
        
        ;(window as any).sellItem = (itemId: string) => {
            // 판매 버튼 클릭 효과음
            if (self.soundSystem) {
                self.soundSystem.playSound('ui_click')
            }
            
            const result = self.shopSystem.sellItem(itemId, 1)
            if (result.success) {
                // 판매 성공 효과음 (코인 획득)
                if (self.soundSystem) {
                    self.soundSystem.playSound('coin_get')
                }
                self.showMessage(result.message, false)
                self.setCoins(self.shopSystem.getPlayerCoins())
                self.updateInventory()
                self.showShopPanel() // 상점 패널 새로고침
            } else {
                self.showMessage(result.message, false)
            }
        }
        
        ;(window as any).shopFilter = (category: string) => {
            // TODO: 필터 기능 구현
            self.showShopPanel()
        }
        
        this.contextPanel.open('shop', '상점', content)
    }
    
    public setCodexSystem(codexSystem: any) {
        this.codexSystem = codexSystem
    }
    
    private showCodexPanel() {
        if (!this.codexSystem) {
            this.contextPanel.open('codex', '도감', '도감 시스템이 없습니다.')
            return
        }
        
        const categories = [
            { id: 'fish', name: '물고기' },
            { id: 'bug', name: '곤충' },
            { id: 'item', name: '채집물' },
            { id: 'furniture', name: '가구' },
            { id: 'clothing', name: '의상' }
        ]
        
        let content = `
            <div style="padding: 20px;">
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
        `
        
        categories.forEach(cat => {
            const entries = this.codexSystem.getEntries(cat.id)
            const discovered = this.codexSystem.getDiscoveredEntries(cat.id).length
            const completion = entries.length > 0 ? Math.round((discovered / entries.length) * 100) : 0
            
            content += `
                <button onclick="window.codexFilter('${cat.id}')" style="padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: #fff; cursor: pointer;">
                    ${cat.name} (${discovered}/${entries.length})
                </button>
            `
        })
        
        content += `
                </div>
                <div id="codex-entries" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; max-height: 500px; overflow-y: auto;">
        `
        
        // 필터 적용된 엔트리 가져오기
        const allEntries = this.codexFilter && this.codexFilter !== 'all' 
            ? this.codexSystem.getEntries(this.codexFilter)
            : this.codexSystem.getEntries()
        allEntries.forEach(entry => {
            const statusColors = {
                'undiscovered': 'rgba(100, 100, 100, 0.3)',
                'discovered': 'rgba(200, 200, 200, 0.3)',
                'obtained': 'rgba(100, 200, 100, 0.3)',
                'donated': 'rgba(100, 150, 255, 0.3)'
            }
            
            const statusIcons = {
                'undiscovered': '❓',
                'discovered': '👁️',
                'obtained': '✅',
                'donated': '🏛️'
            }
            
            const statusTexts = {
                'undiscovered': '미발견',
                'discovered': '발견',
                'obtained': '획득',
                'donated': '기증'
            }
            
            const canDonate = entry.status === 'obtained' && this.museumSystem && this.museumSystem.isDonatable(entry.id) && !this.museumSystem.isDonated(entry.id)
            
            // 아이템 아이콘 결정 (카테고리별)
            const itemIcons: { [category: string]: string } = {
                'fish': '🐟',
                'bug': '🐛',
                'item': '📦',
                'furniture': '🪑',
                'clothing': '👕'
            }
            const itemIcon = itemIcons[entry.category] || '📦'
            
            // 희귀도 색상
            const rarityColors: { [key: string]: string } = {
                'common': '#cccccc',
                'uncommon': '#4CAF50',
                'rare': '#2196F3',
                'epic': '#9C27B0',
                'legendary': '#FF9800'
            }
            const rarityColor = entry.rarity ? rarityColors[entry.rarity] || '#cccccc' : '#cccccc'
            
            content += `
                <div style="padding: 15px; border: 2px solid ${statusColors[entry.status]}; border-radius: 10px; background: ${statusColors[entry.status]}; text-align: center; opacity: ${entry.status === 'undiscovered' ? 0.5 : 1}; position: relative;">
                    <div style="font-size: 48px; margin-bottom: 8px; filter: ${entry.status === 'undiscovered' ? 'grayscale(100%) blur(2px)' : 'none'};">
                        ${entry.status === 'undiscovered' ? '❓' : itemIcon}
                    </div>
                    ${entry.rarity && entry.status !== 'undiscovered' ? `<div style="position: absolute; top: 5px; right: 5px; font-size: 12px; color: ${rarityColor};">${entry.rarity === 'common' ? '일반' : entry.rarity === 'uncommon' ? '언커먼' : entry.rarity === 'rare' ? '레어' : entry.rarity === 'epic' ? '에픽' : '레전더리'}</div>` : ''}
                    <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">${entry.status === 'undiscovered' ? '???' : entry.name}</div>
                    <div style="font-size: 11px; color: #aaa; margin-bottom: 5px;">${statusTexts[entry.status]}</div>
                    ${entry.status !== 'undiscovered' ? `<div style="font-size: 10px; color: #999; margin-top: 5px; line-height: 1.3;">${entry.description}</div>` : ''}
                    ${entry.price && entry.status !== 'undiscovered' ? `<div style="font-size: 10px; color: #FFD700; margin-top: 5px;">💰 ${entry.price} 코인</div>` : ''}
                    ${entry.location && entry.status !== 'undiscovered' ? `<div style="font-size: 9px; color: #999; margin-top: 3px;">📍 ${entry.location}</div>` : ''}
                    ${entry.season && entry.season.length > 0 && entry.status !== 'undiscovered' ? `<div style="font-size: 9px; color: #999; margin-top: 3px;">🍃 ${entry.season.join(', ')}</div>` : ''}
                    ${entry.timeOfDay && entry.timeOfDay.length > 0 && entry.status !== 'undiscovered' ? `<div style="font-size: 9px; color: #999; margin-top: 3px;">🕐 ${entry.timeOfDay.join(', ')}</div>` : ''}
                    ${canDonate ? `<button onclick="window.donateToMuseum('${entry.id}')" style="margin-top: 8px; padding: 5px 10px; border-radius: 4px; border: none; background: #4CAF50; color: #fff; cursor: pointer; font-size: 11px;">🏛️ 박물관 기증</button>` : ''}
                </div>
            `
        })
        
        content += `
                </div>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
                    <div style="display: flex; justify-content: space-between;">
                        <div>전체 발견률: ${Math.round(this.codexSystem.getCompletionRate())}%</div>
                        <div>기증률: ${Math.round(this.codexSystem.getDonationRate())}%</div>
                    </div>
                </div>
            </div>
        `
        
        // 전역 함수 등록
        const self = this
        ;(window as any).codexFilter = (category: string) => {
            self.codexFilter = category === 'all' ? null : category
            self.showCodexPanel()
        }
        
        ;(window as any).donateToMuseum = (itemId: string) => {
            if (!self.museumSystem) {
                self.showMessage('박물관 시스템이 없습니다.', false)
                return
            }
            
            const result = self.museumSystem.donateItem(itemId)
            if (result.success) {
                self.showMessage(result.message, false)
                if (result.reward) {
                    if (result.reward.coins) {
                        self.setCoins(self.shopSystem ? self.shopSystem.getPlayerCoins() + result.reward.coins : result.reward.coins)
                    }
                    if (result.reward.tokens) {
                        self.setTokens(result.reward.tokens)
                    }
                }
                self.updateInventory()
                self.showCodexPanel() // 도감 패널 새로고침
            } else {
                self.showMessage(result.message, false)
            }
        }
        
        this.contextPanel.open('codex', '도감', content)
    }
    
    public setMuseumSystem(museumSystem: any) {
        this.museumSystem = museumSystem
    }
    
    public setMissionSystem(missionSystem: any) {
        this.missionSystem = missionSystem
    }
    
    private showMissionPanel() {
        if (!this.missionSystem) {
            this.contextPanel.open('missions', '미션', '미션 시스템이 없습니다.')
            return
        }
        
        const dailyMissions = this.missionSystem.getMissions('daily')
        const weeklyMissions = this.missionSystem.getMissions('weekly')
        const seasonalMissions = this.missionSystem.getMissions('seasonal')
        
        let content = `
            <div style="padding: 20px;">
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <button onclick="window.missionFilter('daily')" style="padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: ${this.missionFilter === 'daily' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255,255,255,0.1)'}; color: #fff; cursor: pointer;">일일 (${this.missionSystem.getClaimableMissionsCount('daily')})</button>
                    <button onclick="window.missionFilter('weekly')" style="padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: ${this.missionFilter === 'weekly' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255,255,255,0.1)'}; color: #fff; cursor: pointer;">주간 (${this.missionSystem.getClaimableMissionsCount('weekly')})</button>
                    <button onclick="window.missionFilter('seasonal')" style="padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: ${this.missionFilter === 'seasonal' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255,255,255,0.1)'}; color: #fff; cursor: pointer;">시즌 (${this.missionSystem.getClaimableMissionsCount('seasonal')})</button>
                    <button onclick="window.missionFilter('all')" style="padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: ${!this.missionFilter || this.missionFilter === 'all' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255,255,255,0.1)'}; color: #fff; cursor: pointer;">전체</button>
                </div>
                <div id="mission-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 500px; overflow-y: auto;">
        `
        
        // 필터 적용된 미션 가져오기
        let allMissions = [...dailyMissions, ...weeklyMissions, ...seasonalMissions]
        if (this.missionFilter && this.missionFilter !== 'all') {
            allMissions = allMissions.filter(mission => mission.type === this.missionFilter)
        }
        allMissions.forEach(mission => {
            const progressPercent = (mission.progress / mission.target) * 100
            const statusColors = {
                'locked': 'rgba(100, 100, 100, 0.3)',
                'active': 'rgba(100, 150, 255, 0.3)',
                'completed': 'rgba(100, 255, 100, 0.3)',
                'claimed': 'rgba(150, 150, 150, 0.3)'
            }
            
            const statusTexts = {
                'locked': '잠김',
                'active': '진행 중',
                'completed': '완료',
                'claimed': '수령 완료'
            }
            
            let rewardText = ''
            if (mission.rewards.coins) {
                rewardText += `💰 ${mission.rewards.coins} 코인 `
            }
            if (mission.rewards.tokens) {
                rewardText += `✨ ${mission.rewards.tokens} 토큰 `
            }
            if (mission.rewards.items) {
                rewardText += mission.rewards.items.map(item => `${item.id} x${item.count}`).join(', ')
            }
            
            content += `
                <div style="padding: 15px; border: 2px solid ${statusColors[mission.status]}; border-radius: 10px; background: ${statusColors[mission.status]};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <div>
                            <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">${mission.title}</div>
                            <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">${mission.description}</div>
                            <div style="font-size: 11px; color: #999;">${statusTexts[mission.status]}</div>
                        </div>
                        ${mission.status === 'completed' ? `
                            <button onclick="window.claimMission('${mission.id}')" style="padding: 8px 16px; border-radius: 6px; border: none; background: #4CAF50; color: #fff; cursor: pointer;">보상 받기</button>
                        ` : ''}
                    </div>
                    <div style="margin-top: 10px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span style="font-size: 12px;">진행도</span>
                            <span style="font-size: 12px;">${mission.progress}/${mission.target}</span>
                        </div>
                        <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.2); border-radius: 4px; overflow: hidden;">
                            <div style="width: ${progressPercent}%; height: 100%; background: #4CAF50; transition: width 0.3s;"></div>
                        </div>
                    </div>
                    <div style="margin-top: 10px; font-size: 11px; color: #FFD700;">
                        보상: ${rewardText || '없음'}
                    </div>
                </div>
            `
        })
        
        content += `
                </div>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
                    <button onclick="window.claimAllMissions()" style="padding: 10px 20px; border-radius: 6px; border: none; background: #4CAF50; color: #fff; cursor: pointer; width: 100%;">모든 보상 받기</button>
                </div>
            </div>
        `
        
        // 전역 함수 등록
        const self = this
        ;(window as any).claimMission = (missionId: string) => {
            const success = self.missionSystem.claimReward(missionId)
            if (success) {
                self.showMessage('보상을 받았습니다!', false)
                self.setCoins(self.missionSystem.getPlayerCoins())
                self.setTokens(self.missionSystem.getPlayerTokens())
                self.showMissionPanel() // 미션 패널 새로고침
            } else {
                self.showMessage('보상을 받을 수 없습니다.', false)
            }
        }
        
        ;(window as any).claimAllMissions = () => {
            const count = self.missionSystem.claimAllRewards()
            if (count > 0) {
                self.showMessage(`${count}개의 보상을 받았습니다!`, false)
                self.setCoins(self.missionSystem.getPlayerCoins())
                self.setTokens(self.missionSystem.getPlayerTokens())
                self.showMissionPanel() // 미션 패널 새로고침
            } else {
                self.showMessage('받을 수 있는 보상이 없습니다.', false)
            }
        }
        
        ;(window as any).missionFilter = (type: string) => {
            self.missionFilter = type === 'all' ? null : type
            self.showMissionPanel()
        }
        
        this.contextPanel.open('missions', '미션', content)
    }
    
    public showFarmPlantingPanel(plotId: string, farmingSystem: any) {
        const cropTypes = farmingSystem.getAllCropTypes()
        const cropDataList = cropTypes.map(type => farmingSystem.getCropData(type))
        
        let content = `
            <div style="padding: 20px;">
                <h3>씨앗 선택</h3>
                <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
        `
        
        cropDataList.forEach(cropData => {
            const hasSeed = this.inventoryManager && this.inventoryManager.list().some(item => item.name === cropData.seedId && item.count > 0)
            const season = this.timeSystem ? this.timeSystem.getSeason() : 'spring'
            const canPlant = cropData.season.includes(season as any)
            
            content += `
                <div style="padding: 15px; border: 2px solid ${hasSeed && canPlant ? 'rgba(100, 255, 100, 0.5)' : 'rgba(100, 100, 100, 0.3)'}; border-radius: 10px; background: ${hasSeed && canPlant ? 'rgba(100, 255, 100, 0.1)' : 'rgba(50, 50, 50, 0.5)'};">
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">${cropData.name}</div>
                    <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">성장 시간: ${cropData.growthTime}시간</div>
                    <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">수확량: ${cropData.harvestYield.min}-${cropData.harvestYield.max}개</div>
                    <div style="font-size: 12px; color: #aaa; margin-bottom: 10px;">계절: ${cropData.season.join(', ')}</div>
                    ${!hasSeed ? '<div style="color: #ff6b6b; font-size: 11px;">씨앗이 없습니다.</div>' : ''}
                    ${!canPlant ? `<div style="color: #ff6b6b; font-size: 11px;">${season}에는 심을 수 없습니다.</div>` : ''}
                    <button onclick="window.plantSeed('${plotId}', '${cropData.seedId}')" style="padding: 8px 16px; border-radius: 6px; border: none; background: ${hasSeed && canPlant ? '#4CAF50' : '#666'}; color: #fff; cursor: ${hasSeed && canPlant ? 'pointer' : 'not-allowed'};" ${!hasSeed || !canPlant ? 'disabled' : ''}>심기</button>
                </div>
            `
        })
        
        content += `
                </div>
            </div>
        `
        
        // 전역 함수 등록
        const self = this
        ;(window as any).plantSeed = (plotId: string, seedId: string) => {
            const success = farmingSystem.plantSeed(plotId, seedId)
            if (success) {
                self.showMessage('씨앗을 심었습니다!', false)
                self.updateInventory()
                self.contextPanel.close()
            } else {
                self.showMessage('씨앗을 심을 수 없습니다.', false)
            }
        }
        
        this.contextPanel.open('farm', '농장', content)
    }
    
    public showNPCPanel(npc: any, npcSystem: any) {
        const quests = npcSystem.getActiveQuests(npc.id)
        const friendshipLevel = npcSystem.getFriendshipLevel(npc.id)
        
        // 새로운 대화 시스템 사용 (친밀도/시간대/날씨별 대화)
        const currentDialogue = npcSystem.getDialogue ? npcSystem.getDialogue(npc.id) : '안녕하세요!'
        
        // 친밀도 구간 이름
        let friendshipTierName = '초면'
        if (friendshipLevel <= 20) friendshipTierName = '초면'
        else if (friendshipLevel <= 50) friendshipTierName = '알음'
        else if (friendshipLevel <= 80) friendshipTierName = '친구'
        else friendshipTierName = '절친'
        
        let content = `
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <h2 style="margin: 0 0 10px 0;">${npc.name}</h2>
                    <div style="font-size: 14px; color: #aaa;">호감도: ${friendshipLevel}/100 (${friendshipTierName})</div>
                    <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.2); border-radius: 4px; margin-top: 5px; overflow: hidden;">
                        <div style="width: ${friendshipLevel}%; height: 100%; background: #4CAF50; transition: width 0.3s;"></div>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3>대화</h3>
                    <div style="padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px; margin-top: 10px;">
                        <div style="font-size: 14px; line-height: 1.6;">${currentDialogue}</div>
                    </div>
                    <button onclick="window.refreshNPCDialogue('${npc.id}')" style="padding: 8px 16px; border-radius: 6px; border: none; background: #4CAF50; color: #fff; cursor: pointer; margin-top: 10px; font-size: 12px;">다른 대화 듣기</button>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3>퀘스트</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
        `
        
        if (quests.length === 0) {
            content += '<div style="color: #999; text-align: center;">진행 중인 퀘스트가 없습니다.</div>'
        } else {
            quests.forEach(quest => {
                const progressPercent = (quest.progress / quest.target) * 100
                content += `
                    <div style="padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                        <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">${quest.title}</div>
                        <div style="font-size: 12px; color: #aaa; margin-bottom: 10px;">${quest.description}</div>
                        <div style="margin-bottom: 5px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="font-size: 12px;">진행도</span>
                                <span style="font-size: 12px;">${quest.progress}/${quest.target}</span>
                            </div>
                            <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; overflow: hidden;">
                                <div style="width: ${progressPercent}%; height: 100%; background: #4CAF50;"></div>
                            </div>
                        </div>
                        ${quest.completed ? `
                            <button onclick="window.completeQuest('${quest.id}')" style="padding: 8px 16px; border-radius: 6px; border: none; background: #4CAF50; color: #fff; cursor: pointer; width: 100%; margin-top: 10px;">보상 받기</button>
                        ` : ''}
                    </div>
                `
            })
        }
        
        content += `
                    </div>
                </div>
                
                <div>
                    <h3>선물하기</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px;">
        `
        
        const inventoryItems = this.inventoryManager ? this.inventoryManager.list() : []
        inventoryItems.forEach(item => {
            content += `
                <div style="padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px; text-align: center;">
                    <div style="font-size: 12px; margin-bottom: 5px;">${this.getItemDisplayName(item.name)}</div>
                    <div style="font-size: 11px; color: #999; margin-bottom: 5px;">보유: ${item.count}</div>
                    <button onclick="window.giveItemToNPC('${npc.id}', '${item.name}')" style="padding: 5px 10px; border-radius: 4px; border: none; background: #4CAF50; color: #fff; cursor: pointer; font-size: 11px;">선물</button>
                </div>
            `
        })
        
        content += `
                    </div>
                </div>
            </div>
        `
        
        // 전역 함수 등록
        const self = this
        ;(window as any).refreshNPCDialogue = (npcId: string) => {
            // 대화 새로고침 (새로운 랜덤 대화)
            const npc = npcSystem.getNPCById(npcId)
            if (npc) {
                self.showNPCPanel(npc, npcSystem)
            }
        }
        
        ;(window as any).dialogueAction = (action: string, npcId: string) => {
            if (action === 'accept_quest') {
                self.showMessage('퀘스트를 수락했습니다!', false)
            } else if (action === 'decline') {
                self.showMessage('나중에 다시 오겠습니다.', false)
            }
        }
        
        ;(window as any).completeQuest = (questId: string) => {
            const result = npcSystem.completeQuest(questId)
            if (result.success) {
                self.showMessage(result.message, false)
                // 코인/토큰 보상은 NPCSystem에서 자동으로 지급됨
                self.updateInventory()
                self.showNPCPanel(npc, npcSystem) // NPC 패널 새로고침
            } else {
                self.showMessage(result.message, false)
            }
        }
        
        ;(window as any).giveItemToNPC = (npcId: string, itemId: string) => {
            const result = npcSystem.giveItemToNPC(npcId, itemId, 1)
            if (result.success) {
                self.showMessage(result.message, false)
                self.updateInventory()
                self.showNPCPanel(npc, npcSystem) // NPC 패널 새로고침
            } else {
                self.showMessage(result.message, false)
            }
        }
        
        this.contextPanel.open('npc', npc.name, content)
    }
    
    public setEventSystem(eventSystem: any) {
        this.eventSystem = eventSystem
    }
    
    public setPhotoMode(photoMode: any) {
        this.photoMode = photoMode
    }
    
    public setBuildingSystem(buildingSystem: any) {
        this.buildingSystem = buildingSystem
    }
    
    public setInteriorSystem(interiorSystem: any) {
        this.interiorSystem = interiorSystem
    }
    
    public setDecorationSystem(decorationSystem: any) {
        this.decorationSystem = decorationSystem
    }
    
    public setCurrencySystem(currencySystem: any) {
        this.currencySystem = currencySystem
    }
    
    public setTimeSystem(timeSystem: any) {
        this.timeSystem = timeSystem
    }

    public updateTime(gameTime: { hour: number; minute: number; day?: number }) {
        if (this.topStatusBar && typeof (this.topStatusBar as any).setTime === 'function') {
            ;(this.topStatusBar as any).setTime(gameTime.hour, gameTime.minute)
        }
    }

    public setTutorialSystem(tutorialSystem: any, tutorialPanel: any) {
        this.tutorialSystem = tutorialSystem
        this.tutorialPanel = tutorialPanel
    }

    public setSettingsPanel(settingsPanel: any) {
        this.settingsPanel = settingsPanel
    }

    public showTutorialPanel() {
        if (this.tutorialPanel) {
            this.tutorialPanel.show()
        }
    }

    public hideTutorialPanel() {
        if (this.tutorialPanel) {
            this.tutorialPanel.hide()
        }
    }
    
    public getPendingBuildingType(): string | null {
        return this.pendingBuildingType
    }
    
    public clearPendingBuildingType(): void {
        this.pendingBuildingType = null
    }
    
    public handleBuildingPlacement(position: { x: number; y: number; z: number }): boolean {
        if (!this.pendingBuildingType || !this.buildingSystem) {
            return false
        }
        
        const buildingType = this.pendingBuildingType
        const playerCoins = this.currencySystem ? this.currencySystem.getCoins() : 0
        
        const result = this.buildingSystem.buildBuilding(buildingType, position, 0, playerCoins)
        
        if (result.success) {
            // 코인 차감
            if (this.currencySystem && this.buildingSystem.getBuildingData(buildingType).requirements.coins > 0) {
                this.currencySystem.spendCoins(this.buildingSystem.getBuildingData(buildingType).requirements.coins)
            }
            
            this.showMessage(result.message, false)
            this.updateInventory()
            this.clearPendingBuildingType()
            
            // PlayerController에 배치 모드 해제 알림
            if (this.playerController && typeof (this.playerController as any).setBuildingMode === 'function') {
                (this.playerController as any).setBuildingMode(false)
            }
            
            return true
        } else {
            this.showMessage(result.message, false)
            return false
        }
    }
    
    public showBuildingInteraction(building: any, buildingSystem: any) {
        if (!building || !buildingSystem) return
        
        const content = `
            <div style="padding: 20px;">
                <h3>${building.name}</h3>
                <div style="margin-top: 15px; margin-bottom: 15px;">
                    <div style="font-size: 14px; color: #aaa;">타입: ${building.type}</div>
                    <div style="font-size: 14px; color: #aaa;">위치: (${building.position.x.toFixed(1)}, ${building.position.y.toFixed(1)}, ${building.position.z.toFixed(1)})</div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="window.removeBuilding('${building.id}')" style="padding: 10px 20px; border-radius: 6px; border: none; background: #f44336; color: #fff; cursor: pointer;">제거</button>
                    <button onclick="window.closeBuildingInteraction()" style="padding: 10px 20px; border-radius: 6px; border: none; background: #666; color: #fff; cursor: pointer;">닫기</button>
                </div>
            </div>
        `
        
        const self = this
        ;(window as any).removeBuilding = (id: string) => {
            if (confirm('이 건물을 제거하시겠습니까?')) {
                const success = buildingSystem.removeBuilding(id)
                if (success) {
                    self.showMessage('건물이 제거되었습니다.', false)
                    self.contextPanel.close()
                    self.updateInventory()
                } else {
                    self.showMessage('건물 제거에 실패했습니다.', false)
                }
            }
        }
        
        ;(window as any).closeBuildingInteraction = () => {
            self.contextPanel.close()
        }
        
        this.contextPanel.open('building', building.name, content)
    }
    
    public handleDecorationPlacement(position: { x: number; y: number; z: number }): boolean {
        if (!this.pendingDecorationType || !this.decorationSystem) {
            return false
        }
        
        const decorationType = this.pendingDecorationType
        const result = this.decorationSystem.placeFurniture(decorationType, position, 0)
        
        if (result.success) {
            this.showMessage(result.message, false)
            this.clearPendingDecorationType()
            
            // PlayerController에 배치 모드 해제 알림
            if (this.playerController && typeof (this.playerController as any).setDecorationMode === 'function') {
                (this.playerController as any).setDecorationMode(false)
            }
            
            return true
        } else {
            this.showMessage(result.message, false)
            return false
        }
    }
    
    public setMiniMap(miniMap: MiniMap) {
        this.miniMap = miniMap
    }
    
    private showEventPanel() {
        if (!this.eventSystem) {
            this.contextPanel.open('events', '이벤트', '이벤트 시스템이 없습니다.')
            return
        }
        
        const activeEvents = this.eventSystem.getActiveEvents()
        const allEvents = this.eventSystem.getAllEvents()
        
        let content = `
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <h3>진행 중인 이벤트</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
        `
        
        if (activeEvents.length === 0) {
            content += '<div style="color: #999; text-align: center;">진행 중인 이벤트가 없습니다.</div>'
        } else {
            activeEvents.forEach(event => {
                content += `
                    <div style="padding: 15px; background: rgba(255, 200, 100, 0.2); border: 2px solid rgba(255, 200, 100, 0.5); border-radius: 10px;">
                        <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">${event.name}</div>
                        <div style="font-size: 12px; color: #aaa; margin-bottom: 10px;">${event.description}</div>
                        ${event.rewards ? `
                            <div style="font-size: 11px; color: #FFD700; margin-bottom: 10px;">
                                보상: ${event.rewards.coins ? `💰 ${event.rewards.coins} 코인 ` : ''}${event.rewards.tokens ? `✨ ${event.rewards.tokens} 토큰 ` : ''}
                            </div>
                        ` : ''}
                        <button onclick="window.claimEventReward('${event.id}')" style="padding: 8px 16px; border-radius: 6px; border: none; background: #4CAF50; color: #fff; cursor: pointer;">보상 받기</button>
                    </div>
                `
            })
        }
        
        content += `
                    </div>
                </div>
                
                <div>
                    <h3>전체 이벤트</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
        `
        
        allEvents.forEach(event => {
            const isActive = event.active
            content += `
                <div style="padding: 15px; background: ${isActive ? 'rgba(255, 200, 100, 0.2)' : 'rgba(100, 100, 100, 0.2)'}; border: 2px solid ${isActive ? 'rgba(255, 200, 100, 0.5)' : 'rgba(100, 100, 100, 0.3)'}; border-radius: 10px;">
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">${event.name} ${isActive ? '<span style="color: #4CAF50;">(진행 중)</span>' : ''}</div>
                    <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">${event.description}</div>
                    <div style="font-size: 11px; color: #999;">기간: ${event.startDate}일 ~ ${event.endDate}일</div>
                </div>
            `
        })
        
        content += `
                    </div>
                </div>
            </div>
        `
        
        // 별똥별 이벤트가 활성화되어 있으면 소원 빌기 버튼 추가
        if (this.eventSystem && this.eventSystem.isShootingStarActive && this.eventSystem.isShootingStarActive()) {
            const timeRemaining = this.eventSystem.getShootingStarTimeRemaining()
            content = `
                <div style="padding: 20px; margin-bottom: 20px; background: rgba(150, 200, 255, 0.3); border: 3px solid rgba(150, 200, 255, 0.7); border-radius: 15px; text-align: center;">
                    <div style="font-size: 32px; margin-bottom: 10px;">✨</div>
                    <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">별똥별이 보입니다!</div>
                    <div style="font-size: 14px; color: #aaa; margin-bottom: 15px;">남은 시간: ${timeRemaining}초</div>
                    <button onclick="window.makeWishOnShootingStar()" style="padding: 12px 24px; border-radius: 8px; border: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; cursor: pointer; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">✨ 소원 빌기 ✨</button>
                </div>
                ${content}
            `
        }
        
        content += `
            </div>
        `
        
        // 전역 함수 등록
        const self = this
        ;(window as any).claimEventReward = (eventId: string) => {
            const result = self.eventSystem.claimEventReward(eventId)
            if (result.success) {
                self.showMessage(result.message, false)
                // 코인/토큰 보상은 EventSystem에서 자동으로 지급됨
                self.updateInventory()
                self.showEventPanel() // 이벤트 패널 새로고침
            } else {
                self.showMessage(result.message, false)
            }
        }
        
        ;(window as any).makeWishOnShootingStar = () => {
            if (!self.eventSystem || !self.eventSystem.makeWishOnShootingStar) return
            
            const result = self.eventSystem.makeWishOnShootingStar()
            if (result.success) {
                self.showMessage(result.message, false)
                self.updateInventory()
                // 이벤트 패널 새로고침
                setTimeout(() => {
                    self.showEventPanel()
                }, 500)
            } else {
                self.showMessage(result.message, false)
            }
        }
        
        this.contextPanel.open('events', '이벤트', content)
    }
    
    private showPhotoMode() {
        if (!this.photoMode) {
            this.showMessage('사진 모드가 없습니다.', false)
            return
        }
        
        this.photoMode.toggle()
    }
    
    private showBuildPanel() {
        if (!this.buildingSystem) {
            this.contextPanel.open('build', '건설', '건설 시스템이 없습니다.')
            return
        }
        
        const buildingTypes = this.buildingSystem.getAllBuildingTypes()
        const playerCoins = this.currencySystem ? this.currencySystem.getCoins() : 0
        
        let content = `
            <div style="padding: 20px;">
                <h3>건물 건설</h3>
                <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 15px;">
        `
        
        buildingTypes.forEach(type => {
            const buildingData = this.buildingSystem.getBuildingData(type)
            const canBuild = this.buildingSystem.canBuild(type, playerCoins)
            
            content += `
                <div style="padding: 15px; border: 2px solid ${canBuild.canBuild ? 'rgba(100, 255, 100, 0.5)' : 'rgba(100, 100, 100, 0.3)'}; border-radius: 10px; background: ${canBuild.canBuild ? 'rgba(100, 255, 100, 0.1)' : 'rgba(50, 50, 50, 0.5)'};">
                    <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">${buildingData.name}</div>
                    <div style="font-size: 12px; color: #aaa; margin-bottom: 10px;">
                        크기: ${buildingData.size.width} x ${buildingData.size.height} x ${buildingData.size.depth}
                    </div>
                    <div style="font-size: 12px; color: #aaa; margin-bottom: 10px;">
                        재료: ${buildingData.requirements.materials.map(m => `${this.getItemDisplayName(m.id)} x${m.count}`).join(', ')}
                    </div>
                    <div style="font-size: 12px; color: #FFD700; margin-bottom: 10px;">
                        코인: ${buildingData.requirements.coins}
                    </div>
                    ${!canBuild.canBuild ? `
                        <div style="color: #ff6b6b; font-size: 11px; margin-bottom: 10px;">
                            ${canBuild.missingMaterials.length > 0 ? `부족한 재료: ${canBuild.missingMaterials.map(m => `${this.getItemDisplayName(m.id)} x${m.count}`).join(', ')}` : ''}
                            ${canBuild.missingCoins > 0 ? `부족한 코인: ${canBuild.missingCoins}` : ''}
                        </div>
                    ` : ''}
                    <button onclick="window.startBuilding('${type}')" style="padding: 8px 16px; border-radius: 6px; border: none; background: ${canBuild.canBuild ? '#4CAF50' : '#666'}; color: #fff; cursor: ${canBuild.canBuild ? 'pointer' : 'not-allowed'};" ${!canBuild.canBuild ? 'disabled' : ''}>건설 시작</button>
                </div>
            `
        })
        
        content += `
                </div>
            </div>
        `
        
        // 전역 함수 등록
        const self = this
        ;(window as any).startBuilding = (type: string) => {
            self.pendingBuildingType = type
            self.showMessage('건설 모드: 땅을 클릭하여 건물을 배치하세요. (ESC로 취소)', false)
            self.contextPanel.close()
            
            // PlayerController에 배치 모드 알림
            if (self.playerController && typeof (self.playerController as any).setBuildingMode === 'function') {
                (self.playerController as any).setBuildingMode(true)
            }
        }
        
        this.contextPanel.open('build', '건설', content)
    }
    
    private showDecorationPanel() {
        if (!this.decorationSystem) {
            this.contextPanel.open('decorate', '꾸미기', '꾸미기 시스템이 없습니다.')
            return
        }
        
        const furnitureTypes = this.decorationSystem.getAllFurnitureTypes()
        const themes = ['modern', 'rustic', 'cute', 'elegant'] as const
        
        // 인테리어 평가 (건물 내부에 있을 때만)
        let evaluationSection = ''
        if (this.interiorSystem && this.interiorSystem.isInsideBuilding()) {
            const evaluation = this.interiorSystem.evaluateInterior()
            if (evaluation) {
                const gradeColors: { [key: string]: string } = {
                    'C': '#999',
                    'B': '#4CAF50',
                    'A': '#2196F3',
                    'S': '#FFD700'
                }
                const gradeColor = gradeColors[evaluation.grade] || '#999'
                
                evaluationSection = `
                    <div style="margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px; border: 2px solid ${gradeColor};">
                        <h3 style="margin-top: 0;">인테리어 평가</h3>
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                            <div style="font-size: 48px; font-weight: bold; color: ${gradeColor};">${evaluation.grade}</div>
                            <div>
                                <div style="font-size: 24px; font-weight: bold; color: #FFD700;">${evaluation.totalScore}점</div>
                                <div style="font-size: 14px; color: #aaa;">주요 테마: ${evaluation.dominantTheme === 'modern' ? '모던' : evaluation.dominantTheme === 'rustic' ? '러스틱' : evaluation.dominantTheme === 'cute' ? '큐트' : '우아함'}</div>
                            </div>
                        </div>
                        <div style="margin-top: 15px;">
                            <div style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">테마별 점수:</div>
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                `
                
                Object.entries(evaluation.themeScores).forEach(([theme, score]) => {
                    const themeNames: { [key: string]: string } = {
                        modern: '모던',
                        rustic: '러스틱',
                        cute: '큐트',
                        elegant: '우아함'
                    }
                    evaluationSection += `
                        <div style="padding: 8px; background: rgba(255,255,255,0.05); border-radius: 6px;">
                            <div style="font-size: 12px; color: #aaa;">${themeNames[theme]}</div>
                            <div style="font-size: 16px; color: #FFD700;">${score}점</div>
                        </div>
                    `
                })
                
                evaluationSection += `
                            </div>
                        </div>
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2);">
                            <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px;">제안사항:</div>
                            <ul style="margin: 0; padding-left: 20px; color: #aaa; font-size: 13px;">
                `
                
                evaluation.suggestions.forEach(suggestion => {
                    evaluationSection += `<li style="margin-bottom: 5px;">${suggestion}</li>`
                })
                
                evaluationSection += `
                            </ul>
                        </div>
                    </div>
                `
            }
        }
        
        let content = `
            <div style="padding: 20px;">
                ${evaluationSection}
                <div style="margin-bottom: 20px;">
                    <h3>테마 점수</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px;">
        `
        
        themes.forEach(theme => {
            const score = this.decorationSystem.getThemeScore(theme)
            const themeNames = {
                modern: '모던',
                rustic: '러스틱',
                cute: '큐트',
                elegant: '우아함'
            }
            
            content += `
                <div style="padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <div style="font-size: 14px; font-weight: bold;">${themeNames[theme]}</div>
                    <div style="font-size: 18px; color: #FFD700;">${score}점</div>
                </div>
            `
        })
        
        content += `
                    </div>
                </div>
        `
        
        // 벽지/바닥재 변경 (건물 내부에 있을 때만)
        if (this.interiorSystem && this.interiorSystem.isInsideBuilding()) {
            const currentRoom = this.interiorSystem.getCurrentRoom()
            if (currentRoom) {
                const wallpapers = this.interiorSystem.getWallpapers()
                const floorings = this.interiorSystem.getFloorings()
                const currentWallpaper = this.interiorSystem.getCurrentWallpaper()
                const currentFlooring = this.interiorSystem.getCurrentFlooring()
                const playerCoins = this.currencySystem ? this.currencySystem.getCoins() : 0
                
                content += `
                <div style="margin-bottom: 20px;">
                    <h3>벽지 변경</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px; max-height: 300px; overflow-y: auto;">
                `
                
                wallpapers.forEach(wp => {
                    const isCurrent = currentWallpaper && currentWallpaper.id === wp.id
                    const canAfford = (wp.price || 0) <= playerCoins
                    const color = wp.color
                    
                    content += `
                        <div style="padding: 10px; background: ${isCurrent ? 'rgba(100, 255, 100, 0.2)' : 'rgba(255,255,255,0.1)'}; border: 2px solid ${isCurrent ? 'rgba(100, 255, 100, 0.8)' : 'rgba(255,255,255,0.3)'}; border-radius: 8px; text-align: center;">
                            <div style="width: 60px; height: 40px; margin: 0 auto 8px; background: rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}); border-radius: 4px; border: 2px solid rgba(255,255,255,0.3);"></div>
                            <div style="font-size: 12px; font-weight: bold; margin-bottom: 5px;">${wp.name}</div>
                            <div style="font-size: 11px; color: #FFD700; margin-bottom: 8px;">${wp.price || 0} 코인</div>
                            <button onclick="window.changeWallpaper('${currentRoom.id}', '${wp.id}')" style="padding: 6px 12px; border-radius: 6px; border: none; background: ${isCurrent ? '#666' : canAfford ? '#4CAF50' : '#999'}; color: #fff; cursor: ${isCurrent || !canAfford ? 'not-allowed' : 'pointer'}; font-size: 11px; width: 100%;" ${isCurrent || !canAfford ? 'disabled' : ''}>${isCurrent ? '적용됨' : '적용'}</button>
                        </div>
                    `
                })
                
                content += `
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3>바닥재 변경</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px; max-height: 300px; overflow-y: auto;">
                `
                
                floorings.forEach(fl => {
                    const isCurrent = currentFlooring && currentFlooring.id === fl.id
                    const canAfford = (fl.price || 0) <= playerCoins
                    const color = fl.color
                    
                    content += `
                        <div style="padding: 10px; background: ${isCurrent ? 'rgba(100, 255, 100, 0.2)' : 'rgba(255,255,255,0.1)'}; border: 2px solid ${isCurrent ? 'rgba(100, 255, 100, 0.8)' : 'rgba(255,255,255,0.3)'}; border-radius: 8px; text-align: center;">
                            <div style="width: 60px; height: 40px; margin: 0 auto 8px; background: rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}); border-radius: 4px; border: 2px solid rgba(255,255,255,0.3);"></div>
                            <div style="font-size: 12px; font-weight: bold; margin-bottom: 5px;">${fl.name}</div>
                            <div style="font-size: 11px; color: #FFD700; margin-bottom: 8px;">${fl.price || 0} 코인</div>
                            <button onclick="window.changeFlooring('${currentRoom.id}', '${fl.id}')" style="padding: 6px 12px; border-radius: 6px; border: none; background: ${isCurrent ? '#666' : canAfford ? '#4CAF50' : '#999'}; color: #fff; cursor: ${isCurrent || !canAfford ? 'not-allowed' : 'pointer'}; font-size: 11px; width: 100%;" ${isCurrent || !canAfford ? 'disabled' : ''}>${isCurrent ? '적용됨' : '적용'}</button>
                        </div>
                    `
                })
                
                content += `
                    </div>
                </div>
                `
            }
        }
        
        content += `
                
                <div>
                    <h3>가구 배치</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 15px;">
        `
        
        furnitureTypes.forEach(type => {
            const furnitureData = this.decorationSystem.getFurnitureData(type)
            
            content += `
                <div style="padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px;">
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">${furnitureData.name}</div>
                    <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">테마: ${furnitureData.theme}</div>
                    <div style="font-size: 12px; color: #FFD700; margin-bottom: 10px;">테마 점수: +${furnitureData.themeScore}</div>
                    <button onclick="window.placeFurniture('${type}')" style="padding: 8px 16px; border-radius: 6px; border: none; background: #4CAF50; color: #fff; cursor: pointer; width: 100%;">배치</button>
                </div>
            `
        })
        
        content += `
                    </div>
                </div>
            </div>
        `
        
        // 전역 함수 등록
        const self = this
        ;(window as any).placeFurniture = (type: string) => {
            self.pendingDecorationType = type
            self.showMessage('꾸미기 모드: 땅을 클릭하여 가구를 배치하세요. (ESC로 취소)', false)
            self.contextPanel.close()
            
            // PlayerController에 배치 모드 알림
            if (self.playerController && typeof (self.playerController as any).setDecorationMode === 'function') {
                (self.playerController as any).setDecorationMode(true)
            }
        }
        
        ;(window as any).changeWallpaper = (roomId: string, wallpaperId: string) => {
            if (!self.interiorSystem) return
            
            const wallpaper = self.interiorSystem.getWallpapers().find(wp => wp.id === wallpaperId)
            if (!wallpaper) return
            
            const playerCoins = self.currencySystem ? self.currencySystem.getCoins() : 0
            if ((wallpaper.price || 0) > playerCoins) {
                self.showMessage('코인이 부족합니다.', false)
                return
            }
            
            const success = self.interiorSystem.changeWallpaper(roomId, wallpaperId)
            if (success) {
                if (wallpaper.price && wallpaper.price > 0 && self.currencySystem) {
                    self.currencySystem.spendCoins(wallpaper.price)
                }
                self.showMessage(`벽지를 "${wallpaper.name}"로 변경했습니다!`, false)
                self.showDecorationPanel() // 패널 새로고침
            } else {
                self.showMessage('벽지 변경에 실패했습니다.', false)
            }
        }
        
        ;(window as any).changeFlooring = (roomId: string, flooringId: string) => {
            if (!self.interiorSystem) return
            
            const flooring = self.interiorSystem.getFloorings().find(fl => fl.id === flooringId)
            if (!flooring) return
            
            const playerCoins = self.currencySystem ? self.currencySystem.getCoins() : 0
            if ((flooring.price || 0) > playerCoins) {
                self.showMessage('코인이 부족합니다.', false)
                return
            }
            
            const success = self.interiorSystem.changeFlooring(roomId, flooringId)
            if (success) {
                if (flooring.price && flooring.price > 0 && self.currencySystem) {
                    self.currencySystem.spendCoins(flooring.price)
                }
                self.showMessage(`바닥재를 "${flooring.name}"로 변경했습니다!`, false)
                self.showDecorationPanel() // 패널 새로고침
            } else {
                self.showMessage('바닥재 변경에 실패했습니다.', false)
            }
        }
        
        this.contextPanel.open('decorate', '꾸미기', content)
    }
    
    // 가구 편집 패널 표시
    public showFurnitureEditPanel(furniture: any) {
        if (!this.decorationSystem || !furniture) return
        
        let content = `
            <div style="padding: 20px; text-align: center;">
                <h3 style="margin-top: 0;">${furniture.name} 편집</h3>
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                    <button onclick="window.rotateFurniture('${furniture.id}')" style="padding: 10px 20px; border-radius: 8px; border: none; background: #2196F3; color: #fff; cursor: pointer; font-size: 14px; font-weight: bold;">🔄 회전 (R)</button>
                    <button onclick="window.deleteFurniture('${furniture.id}')" style="padding: 10px 20px; border-radius: 8px; border: none; background: #f44336; color: #fff; cursor: pointer; font-size: 14px; font-weight: bold;">🗑️ 삭제</button>
                </div>
                <div style="margin-top: 20px; font-size: 12px; color: #aaa;">
                    <div>• 땅을 클릭하여 가구를 이동할 수 있습니다</div>
                    <div>• ESC 키로 편집 모드를 종료합니다</div>
                </div>
            </div>
        `
        
        // 전역 함수 등록
        const self = this
        ;(window as any).rotateFurniture = (furnitureId: string) => {
            if (!self.decorationSystem) return
            
            const success = self.decorationSystem.rotateFurniture90(furnitureId, true)
            if (success) {
                self.showMessage('가구를 회전했습니다.', false)
                self.showFurnitureEditPanel(self.decorationSystem.getFurnitureById(furnitureId)!)
            }
        }
        
        ;(window as any).deleteFurniture = (furnitureId: string) => {
            if (!self.decorationSystem) return
            
            const furniture = self.decorationSystem.getFurnitureById(furnitureId)
            if (!furniture) return
            
            if (confirm(`정말 ${furniture.name}을(를) 삭제하시겠습니까?`)) {
                const success = self.decorationSystem.removeFurniture(furnitureId)
                if (success) {
                    self.showMessage(`${furniture.name}을(를) 삭제했습니다.`, false)
                    self.hideFurnitureEditPanel()
                    
                    // PlayerController의 편집 모드 종료
                    if (self.playerController && typeof (self.playerController as any).furnitureEditMode !== 'undefined') {
                        ;(self.playerController as any).furnitureEditMode = false
                        ;(self.playerController as any).selectedFurniture = null
                    }
                }
            }
        }
        
        this.contextPanel.open('furniture_edit', '가구 편집', content)
    }
    
    // 가구 편집 패널 숨기기
    public hideFurnitureEditPanel() {
        this.contextPanel.close()
    }

    private showCustomizationPanel() {
        if (!this.customizationSystem) {
            this.contextPanel.open('customize', '커스터마이징', '커스터마이징 시스템이 없습니다.')
            return
        }

        const categories: Array<{ id: string; name: string }> = [
            { id: 'top', name: '상의' },
            { id: 'bottom', name: '하의' },
            { id: 'shoes', name: '신발' },
            { id: 'hair', name: '헤어' }
        ]

        let content = `
            <div style="padding: 20px;">
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
        `

        categories.forEach(cat => {
            content += `
                <button onclick="window.customizationFilter('${cat.id}')" style="padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); color: #fff; cursor: pointer;">${cat.name}</button>
            `
        })

        content += `
                </div>
                <div id="customization-items-list" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; max-height: 500px; overflow-y: auto; padding: 10px;">
        `

        const allClothing = this.customizationSystem.getAllClothing()
        allClothing.forEach(clothing => {
            const isEquipped = this.customizationSystem.isEquipped(clothing.id)
            const rarityColors: { [key: string]: string } = {
                'common': 'rgba(200, 200, 200, 0.3)',
                'rare': 'rgba(100, 150, 255, 0.3)',
                'epic': 'rgba(150, 100, 255, 0.3)',
                'legendary': 'rgba(255, 200, 100, 0.3)'
            }

            const borderColor = isEquipped ? 'rgba(100, 255, 100, 0.8)' : rarityColors[clothing.rarity] || 'rgba(100, 100, 100, 0.3)'

            content += `
                <div style="padding: 15px; border: 2px solid ${borderColor}; border-radius: 10px; background: ${isEquipped ? 'rgba(100, 255, 100, 0.1)' : 'rgba(50, 50, 50, 0.5)'}; text-align: center;">
                    <div style="width: 60px; height: 60px; margin: 0 auto 10px; background: ${clothing.color ? `rgb(${Math.floor(clothing.color.r * 255)}, ${Math.floor(clothing.color.g * 255)}, ${Math.floor(clothing.color.b * 255)})` : '#666'}; border-radius: 8px; border: 2px solid rgba(255,255,255,0.3);"></div>
                    <div style="font-size: 14px; font-weight: bold; margin-bottom: 5px;">${clothing.name}</div>
                    <div style="font-size: 11px; color: #aaa; margin-bottom: 10px;">${clothing.category === 'top' ? '상의' : clothing.category === 'bottom' ? '하의' : clothing.category === 'shoes' ? '신발' : clothing.category === 'hair' ? '헤어' : clothing.category}</div>
                    <button onclick="window.equipClothing('${clothing.id}')" style="padding: 6px 12px; border-radius: 6px; border: none; background: ${isEquipped ? '#666' : '#4CAF50'}; color: #fff; cursor: ${isEquipped ? 'not-allowed' : 'pointer'}; font-size: 12px;" ${isEquipped ? 'disabled' : ''}>${isEquipped ? '착용 중' : '착용'}</button>
                </div>
            `
        })

        content += `
                </div>
            </div>
        `

        // 전역 함수 등록
        const self = this
        ;(window as any).equipClothing = (clothingId: string) => {
            const success = self.customizationSystem.equipClothing(clothingId)
            if (success) {
                self.showMessage('의상을 착용했습니다!', false)
                self.showCustomizationPanel() // 패널 새로고침
            } else {
                self.showMessage('의상을 착용할 수 없습니다.', false)
            }
        }

        ;(window as any).customizationFilter = (category: string) => {
            // 필터 기능은 나중에 구현
            self.showCustomizationPanel()
        }

        this.contextPanel.open('customize', '커스터마이징', content)
    }

    public setCustomizationSystem(customizationSystem: any) {
        this.customizationSystem = customizationSystem
    }

    public setPetSystem(petSystem: any) {
        this.petSystem = petSystem
    }

    private showPetPanel() {
        if (!this.petSystem) {
            this.contextPanel.open('pets', '펫', '펫 시스템이 없습니다.')
            return
        }

        const pets = this.petSystem.getAllPets()
        const petTypes: Array<{ type: string; name: string }> = [
            { type: 'cat', name: '고양이' },
            { type: 'dog', name: '강아지' },
            { type: 'rabbit', name: '토끼' },
            { type: 'bird', name: '새' },
            { type: 'fox', name: '여우' },
            { type: 'bear', name: '곰' }
        ]

        let content = `
            <div style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0;">내 펫</h2>
                    <button onclick="window.openPetShop()" style="padding: 8px 16px; border-radius: 6px; border: none; background: #4CAF50; color: #fff; cursor: pointer;">펫 상점</button>
                </div>
        `

        if (pets.length === 0) {
            content += `
                <div style="text-align: center; padding: 40px; color: #999;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🐾</div>
                    <div style="font-size: 18px; margin-bottom: 10px;">아직 펫이 없습니다</div>
                    <div style="font-size: 14px; color: #666;">"펫 상점" 버튼을 눌러 펫을 구매해보세요!</div>
                </div>
            `
        } else {
            content += `
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
            `

            pets.forEach(pet => {
                const healthColor = pet.health > 70 ? '#4CAF50' : pet.health > 40 ? '#FFA500' : '#FF6B6B'
                const happinessColor = pet.happiness > 70 ? '#4CAF50' : pet.happiness > 40 ? '#FFA500' : '#FF6B6B'
                const intimacyColor = pet.intimacy > 70 ? '#4CAF50' : pet.intimacy > 40 ? '#FFA500' : '#FF6B6B'

                content += `
                    <div style="padding: 20px; border: 2px solid rgba(255,255,255,0.3); border-radius: 10px; background: rgba(255,255,255,0.05);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h3 style="margin: 0; font-size: 18px;">${pet.name}</h3>
                            <span style="font-size: 12px; color: #aaa;">Lv.${pet.level}</span>
                        </div>
                        <div style="width: 80px; height: 80px; margin: 0 auto 15px; background: ${pet.appearance && pet.appearance.color ? `rgb(${Math.floor(pet.appearance.color.r * 255)}, ${Math.floor(pet.appearance.color.g * 255)}, ${Math.floor(pet.appearance.color.b * 255)})` : '#666'}; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3);"></div>
                        
                        <div style="margin-bottom: 10px;">
                            <div style="font-size: 11px; color: #aaa; margin-bottom: 5px;">건강: ${Math.floor(pet.health)}%</div>
                            <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; overflow: hidden;">
                                <div style="width: ${pet.health}%; height: 100%; background: ${healthColor}; transition: width 0.3s;"></div>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 10px;">
                            <div style="font-size: 11px; color: #aaa; margin-bottom: 5px;">행복도: ${Math.floor(pet.happiness)}%</div>
                            <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; overflow: hidden;">
                                <div style="width: ${pet.happiness}%; height: 100%; background: ${happinessColor}; transition: width 0.3s;"></div>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 10px;">
                            <div style="font-size: 11px; color: #aaa; margin-bottom: 5px;">친밀도: ${Math.floor(pet.intimacy)}%</div>
                            <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; overflow: hidden;">
                                <div style="width: ${pet.intimacy}%; height: 100%; background: ${intimacyColor}; transition: width 0.3s;"></div>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 10px;">
                            <div style="font-size: 11px; color: #aaa; margin-bottom: 5px;">배고픔: ${Math.floor(pet.hunger)}%</div>
                            <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; overflow: hidden;">
                                <div style="width: ${pet.hunger}%; height: 100%; background: ${pet.hunger > 50 ? '#4CAF50' : '#FFA500'}; transition: width 0.3s;"></div>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 5px; margin-top: 15px;">
                            <button onclick="window.feedPet('${pet.id}')" style="flex: 1; padding: 6px 10px; border-radius: 6px; border: none; background: #FF9800; color: #fff; cursor: pointer; font-size: 11px;">음식</button>
                            <button onclick="window.playWithPet('${pet.id}')" style="flex: 1; padding: 6px 10px; border-radius: 6px; border: none; background: #2196F3; color: #fff; cursor: pointer; font-size: 11px;">놀기</button>
                            <button onclick="window.petPet('${pet.id}')" style="flex: 1; padding: 6px 10px; border-radius: 6px; border: none; background: #9C27B0; color: #fff; cursor: pointer; font-size: 11px;">쓰다듬기</button>
                        </div>
                        
                        <div style="margin-top: 10px;">
                            <button onclick="window.togglePetFollowing('${pet.id}')" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: none; background: ${pet.isFollowing ? '#666' : '#4CAF50'}; color: #fff; cursor: pointer; font-size: 11px;">${pet.isFollowing ? '집으로' : '따라오기'}</button>
                        </div>
                    </div>
                `
            })

            content += `
                </div>
            `
        }

        content += `
            </div>
        `

        // 전역 함수 등록
        const self = this
        ;(window as any).feedPet = (petId: string) => {
            const success = self.petSystem.feedPet(petId)
            if (success) {
                self.showMessage('펫에게 음식을 주었습니다!', false)
                self.showPetPanel()
            }
        }

        ;(window as any).playWithPet = (petId: string) => {
            const success = self.petSystem.playWithPet(petId)
            if (success) {
                self.showMessage('펫과 놀았습니다!', false)
                self.showPetPanel()
            }
        }

        ;(window as any).petPet = (petId: string) => {
            const success = self.petSystem.petPet(petId)
            if (success) {
                self.showMessage('펫을 쓰다듬었습니다!', false)
                self.showPetPanel()
            }
        }

        ;(window as any).togglePetFollowing = (petId: string) => {
            const pet = self.petSystem.getPet(petId)
            if (pet) {
                self.petSystem.setPetFollowing(petId, !pet.isFollowing)
                self.showMessage(`${pet.name}가 ${!pet.isFollowing ? '따라옵니다' : '집으로 돌아갑니다'}!`, false)
                self.showPetPanel()
            }
        }

        ;(window as any).openPetShop = () => {
            // 상점 패널을 열고 펫 카테고리로 필터링
            if (self.shopSystem) {
                self.showShopPanel()
                // 펫 카테고리 필터 적용
                setTimeout(() => {
                    if ((window as any).filterShopCategory) {
                        ;(window as any).filterShopCategory('pet')
                    }
                }, 100)
            } else {
                self.showMessage('상점 시스템이 없습니다.', false)
            }
        }

        this.contextPanel.open('pets', '펫', content)
    }
    
    public showSaveNotification(message: string = '저장 완료', duration: number = 2000) {
        this.saveNotification.show(message, duration)
    }
    
    public hideSaveNotification() {
        this.saveNotification.hide()
    }

    private showSettingsPanel() {
        if (this.settingsPanel) {
            this.settingsPanel.show()
        } else {
            this.contextPanel.open('settings', '설정', '설정 패널을 불러올 수 없습니다.')
        }
    }
    
    public showStatisticsPanel() {
        const statisticsManager = (window as any).statisticsManager
        if (!statisticsManager) {
            this.contextPanel.open('statistics', '통계', '통계 시스템이 없습니다.')
            return
        }
        
        const stats = statisticsManager.getStatistics()
        const formattedPlayTime = statisticsManager.getFormattedPlayTime()
        
        const content = `
            <div style="padding: 20px;">
                <h2 style="margin: 0 0 20px 0; font-size: 24px;">게임 통계</h2>
                
                <!-- 플레이 시간 -->
                <div style="background: rgba(100, 150, 255, 0.2); border-radius: 12px; padding: 15px; margin-bottom: 15px;">
                    <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">총 플레이 시간</div>
                    <div style="font-size: 28px; font-weight: bold; color: #64B5F6;">${formattedPlayTime}</div>
                </div>
                
                <!-- 채집 & 제작 -->
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 15px;">
                    <div style="background: rgba(76, 175, 80, 0.2); border-radius: 12px; padding: 15px;">
                        <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">채집한 아이템</div>
                        <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">${stats.itemsCollected.toLocaleString()}</div>
                    </div>
                    <div style="background: rgba(255, 193, 7, 0.2); border-radius: 12px; padding: 15px;">
                        <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">제작한 아이템</div>
                        <div style="font-size: 24px; font-weight: bold; color: #FFC107;">${stats.itemsCrafted.toLocaleString()}</div>
                    </div>
                    <div style="background: rgba(156, 39, 176, 0.2); border-radius: 12px; padding: 15px;">
                        <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">판매한 아이템</div>
                        <div style="font-size: 24px; font-weight: bold; color: #9C27B0;">${stats.itemsSold.toLocaleString()}</div>
                    </div>
                    <div style="background: rgba(244, 67, 54, 0.2); border-radius: 12px; padding: 15px;">
                        <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">도감 항목</div>
                        <div style="font-size: 24px; font-weight: bold; color: #F44336;">${stats.codexEntries}</div>
                    </div>
                </div>
                
                <!-- 활동 통계 -->
                <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; margin-bottom: 15px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 16px;">활동 통계</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 14px;">
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span>완료한 미션</span>
                            <span style="color: #FFC107; font-weight: bold;">${stats.missionsCompleted}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span>달성한 성취</span>
                            <span style="color: #9C27B0; font-weight: bold;">${stats.achievementsUnlocked}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span>건설한 건물</span>
                            <span style="color: #64B5F6; font-weight: bold;">${stats.buildingsBuilt}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span>수확한 작물</span>
                            <span style="color: #4CAF50; font-weight: bold;">${stats.cropsHarvested}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span>잡은 물고기</span>
                            <span style="color: #2196F3; font-weight: bold;">${stats.fishCaught}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span>잡은 곤충</span>
                            <span style="color: #FF9800; font-weight: bold;">${stats.bugsCaught}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span>박물관 기증</span>
                            <span style="color: #FFD700; font-weight: bold;">${stats.museumDonations}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                            <span>플레이한 날</span>
                            <span style="color: #BA68C8; font-weight: bold;">${stats.daysPlayed}일</span>
                        </div>
                    </div>
                </div>
                
                <!-- 획득 통계 -->
                <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 15px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 16px;">획득 통계</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 14px;">
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span>💰 총 획득 코인</span>
                            <span style="color: #FFD700; font-weight: bold;">${stats.coinsEarned.toLocaleString()}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                            <span>✨ 총 획득 토큰</span>
                            <span style="color: #BA68C8; font-weight: bold;">${stats.tokensEarned.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        `
        
        this.contextPanel.open('statistics', '통계', content)
    }
}
