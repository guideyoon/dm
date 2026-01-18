import { Tooltip } from './Tooltip'

export type MenuType = 'home' | 'map' | 'bag' | 'codex' | 'craft' | 'build' | 'decorate' | 'villagers' | 'missions' | 'shop' | 'events' | 'photo' | 'customize' | 'pets' | 'settings'

export interface MenuConfig {
    id: MenuType
    name: string
    icon: string
}

export class LeftMenuBar {
    private element: HTMLDivElement
    private menuItems: HTMLDivElement[] = []
    private activeMenu: MenuType | null = null
    private onMenuClick: ((menu: MenuType) => void) | null = null
    private isExpanded: boolean = false

    private menus: MenuConfig[] = [
        { id: 'home', name: '홈', icon: '🏠' },
        { id: 'map', name: '지도', icon: '🗺️' },
        { id: 'bag', name: '가방', icon: '🎒' },
        { id: 'codex', name: '도감', icon: '📚' },
        { id: 'craft', name: '제작', icon: '🔨' },
        { id: 'build', name: '건설', icon: '🏗️' },
        { id: 'decorate', name: '꾸미기', icon: '🎨' },
        { id: 'villagers', name: '주민', icon: '👥' },
        { id: 'missions', name: '미션', icon: '✅' },
        { id: 'shop', name: '상점', icon: '🛒' },
        { id: 'events', name: '이벤트', icon: '🎉' },
        { id: 'photo', name: '사진', icon: '📸' },
        { id: 'customize', name: '커스터마이징', icon: '👕' },
        { id: 'pets', name: '펫', icon: '🐾' },
        { id: 'settings', name: '설정', icon: '⚙️' }
    ]

    constructor() {
        this.element = document.createElement('div')
        this.element.id = 'left-menu-bar'
        this.setupStyles()
        this.createMenuItems()
        document.body.appendChild(this.element)
    }

    private setupStyles() {
        Object.assign(this.element.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '72px',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '44px',
            zIndex: '1001',
            transition: 'width 0.3s ease'
        })
    }

    private createMenuItems() {
        this.menus.forEach((menu, index) => {
            const menuItem = document.createElement('div')
            menuItem.className = 'menu-item'
            menuItem.dataset.menuId = menu.id
            
            Object.assign(menuItem.style, {
                width: '100%',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                position: 'relative',
                fontSize: '24px'
            })

            menuItem.textContent = menu.icon
            menuItem.title = menu.name

            const tooltip = Tooltip.getInstance()

            menuItem.onmouseenter = (e) => {
                if (!this.isExpanded) {
                    menuItem.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                    const rect = menuItem.getBoundingClientRect()
                    tooltip.show(menu.name, rect.right, rect.top + rect.height / 2)
                }
            }

            menuItem.onmouseleave = () => {
                if (!this.isExpanded || this.activeMenu !== menu.id) {
                    menuItem.style.backgroundColor = 'transparent'
                }
                tooltip.hide()
            }

            menuItem.onmousemove = (e) => {
                if (!this.isExpanded) {
                    const rect = menuItem.getBoundingClientRect()
                    tooltip.updatePosition(rect.right, rect.top + rect.height / 2)
                }
            }

            menuItem.onclick = () => {
                this.selectMenu(menu.id)
            }

            this.element.appendChild(menuItem)
            this.menuItems.push(menuItem)
        })
    }

    public selectMenu(menuId: MenuType) {
        // 같은 메뉴 클릭 시 토글
        if (this.activeMenu === menuId) {
            this.activeMenu = null
            this.onMenuClick?.(null as any)
        } else {
            this.activeMenu = menuId
            this.onMenuClick?.(menuId)
        }

        this.updateActiveState()
    }

    private updateActiveState() {
        this.menuItems.forEach((item, index) => {
            const menuId = this.menus[index].id
            if (menuId === this.activeMenu) {
                item.style.backgroundColor = 'rgba(100, 150, 255, 0.3)'
                item.style.borderLeft = '3px solid rgba(100, 150, 255, 1)'
            } else {
                item.style.backgroundColor = 'transparent'
                item.style.borderLeft = 'none'
            }
        })
    }

    public setOnMenuClick(callback: (menu: MenuType | null) => void) {
        this.onMenuClick = callback
    }

    public getActiveMenu(): MenuType | null {
        return this.activeMenu
    }
}
