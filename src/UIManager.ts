import { InventoryManager, InventoryItem } from './InventoryManager'
import { CraftingSystem } from './CraftingSystem'
import { Recipe } from './Recipe'

export class UIManager {
    private messageElement: HTMLDivElement
    private inventoryElement: HTMLDivElement
    private inventorySlots: HTMLDivElement[] = []
    private inventoryManager: InventoryManager | null = null
    private craftingPanel: HTMLDivElement | null = null
    private craftingSystem: CraftingSystem | null = null
    private isCraftingPanelOpen: boolean = false

    constructor() {
        this.messageElement = document.createElement('div')
        this.messageElement.id = 'interaction-ui'
        this.setupStyles()
        document.body.appendChild(this.messageElement)

        this.inventoryElement = document.createElement('div')
        this.inventoryElement.id = 'inventory-ui'
        this.setupInventoryStyles()
        document.body.appendChild(this.inventoryElement)

        this.setupCraftingPanel()
        this.setupKeyboardControls()
    }

    public setInventoryManager(inventoryManager: InventoryManager) {
        this.inventoryManager = inventoryManager
        this.createInventorySlots()
    }

    public setCraftingSystem(craftingSystem: CraftingSystem) {
        this.craftingSystem = craftingSystem
        this.updateCraftingPanel()
    }

    private setupStyles() {
        Object.assign(this.messageElement.style, {
            position: 'absolute',
            bottom: '50px',
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
            zIndex: '1000',
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

        // persistent가 false일 때만 자동으로 사라짐
        if (!persistent) {
            this.timeout = window.setTimeout(() => {
                this.hideMessage()
            }, 2000)
        }
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

    private setupInventoryStyles() {
        Object.assign(this.inventoryElement.style, {
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px',
            padding: '10px',
            borderRadius: '15px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            zIndex: '1000',
            pointerEvents: 'auto'
        })
    }

    private createInventorySlots() {
        if (!this.inventoryManager) return

        this.inventoryElement.innerHTML = ''
        this.inventorySlots = []

        const maxSlots = this.inventoryManager.getMaxSlots()
        for (let i = 0; i < maxSlots; i++) {
            const slot = document.createElement('div')
            slot.className = 'inventory-slot'
            Object.assign(slot.style, {
                width: '50px',
                height: '50px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#ffffff',
                position: 'relative',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            })
            
            this.inventoryElement.appendChild(slot)
            this.inventorySlots.push(slot)
        }

        this.updateInventory()
    }

    public updateInventory() {
        if (!this.inventoryManager) return

        const items = this.inventoryManager.list()
        
        // 모든 슬롯 초기화
        this.inventorySlots.forEach(slot => {
            slot.innerHTML = ''
            slot.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
        })

        // 아이템 표시
        items.forEach((item, index) => {
            if (index >= this.inventorySlots.length) return

            const slot = this.inventorySlots[index]
            slot.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 10px; margin-bottom: 2px;">${this.getItemDisplayName(item.name)}</div>
                    <div style="font-size: 14px; font-weight: bold;">${item.count}</div>
                </div>
            `
            slot.style.backgroundColor = 'rgba(100, 150, 255, 0.3)'
        })
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

    private setupCraftingPanel() {
        this.craftingPanel = document.createElement('div')
        this.craftingPanel.id = 'crafting-panel'
        Object.assign(this.craftingPanel.style, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            maxHeight: '600px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '20px',
            padding: '20px',
            zIndex: '2000',
            display: 'none',
            flexDirection: 'column',
            gap: '15px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#ffffff',
            overflowY: 'auto'
        })

        const title = document.createElement('h2')
        title.textContent = '제작'
        title.style.margin = '0 0 10px 0'
        title.style.fontSize = '24px'
        this.craftingPanel.appendChild(title)

        const closeBtn = document.createElement('button')
        closeBtn.textContent = '닫기 (C)'
        closeBtn.style.padding = '10px 20px'
        closeBtn.style.marginTop = '10px'
        closeBtn.style.borderRadius = '8px'
        closeBtn.style.border = 'none'
        closeBtn.style.backgroundColor = '#666'
        closeBtn.style.color = '#fff'
        closeBtn.style.cursor = 'pointer'
        closeBtn.onclick = () => this.toggleCraftingPanel()
        this.craftingPanel.appendChild(closeBtn)

        document.body.appendChild(this.craftingPanel)
    }

    private setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'c') {
                this.toggleCraftingPanel()
            }
        })
    }

    public toggleCraftingPanel() {
        if (!this.craftingPanel) return

        this.isCraftingPanelOpen = !this.isCraftingPanelOpen
        this.craftingPanel.style.display = this.isCraftingPanelOpen ? 'flex' : 'none'
        
        if (this.isCraftingPanelOpen) {
            this.updateCraftingPanel()
        }
    }

    private updateCraftingPanel() {
        if (!this.craftingPanel || !this.craftingSystem) return

        // 레시피 리스트 영역 찾기 또는 생성
        let recipeList = this.craftingPanel.querySelector('.recipe-list') as HTMLDivElement
        if (!recipeList) {
            recipeList = document.createElement('div')
            recipeList.className = 'recipe-list'
            recipeList.style.display = 'flex'
            recipeList.style.flexDirection = 'column'
            recipeList.style.gap = '10px'
            this.craftingPanel.insertBefore(recipeList, this.craftingPanel.lastElementChild)
        }

        recipeList.innerHTML = ''

        const recipes = this.craftingSystem.getAllRecipes()

        if (recipes.length === 0) {
            const emptyMsg = document.createElement('div')
            emptyMsg.textContent = '제작 가능한 레시피가 없습니다.'
            emptyMsg.style.textAlign = 'center'
            emptyMsg.style.color = '#999'
            recipeList.appendChild(emptyMsg)
            return
        }

        recipes.forEach(recipe => {
            const canCraft = this.craftingSystem?.getRecipeManager().canCraft(
                recipe.id,
                this.inventoryManager?.list() || []
            )

            const recipeItem = document.createElement('div')
            recipeItem.style.padding = '15px'
            recipeItem.style.border = `2px solid ${canCraft ? 'rgba(100, 255, 100, 0.5)' : 'rgba(100, 100, 100, 0.3)'}`
            recipeItem.style.borderRadius = '10px'
            recipeItem.style.backgroundColor = canCraft ? 'rgba(100, 255, 100, 0.1)' : 'rgba(50, 50, 50, 0.5)'

            const recipeName = document.createElement('div')
            recipeName.textContent = recipe.name
            recipeName.style.fontSize = '18px'
            recipeName.style.fontWeight = 'bold'
            recipeName.style.marginBottom = '8px'
            recipeItem.appendChild(recipeName)

            const resultText = document.createElement('div')
            resultText.textContent = `결과: ${this.getItemDisplayName(recipe.resultItem)} x${recipe.resultCount}`
            resultText.style.fontSize = '14px'
            resultText.style.color = '#aaa'
            resultText.style.marginBottom = '10px'
            recipeItem.appendChild(resultText)

            if (recipe.ingredients.length > 0) {
                const ingredientsText = document.createElement('div')
                ingredientsText.textContent = '재료: ' + recipe.ingredients
                    .map(ing => `${this.getItemDisplayName(ing.name)} x${ing.count}`)
                    .join(', ')
                ingredientsText.style.fontSize = '12px'
                ingredientsText.style.color = '#ccc'
                ingredientsText.style.marginBottom = '10px'
                recipeItem.appendChild(ingredientsText)
            }

            const craftBtn = document.createElement('button')
            craftBtn.textContent = canCraft ? '제작' : '재료 부족'
            craftBtn.style.padding = '8px 16px'
            craftBtn.style.borderRadius = '6px'
            craftBtn.style.border = 'none'
            craftBtn.style.backgroundColor = canCraft ? '#4CAF50' : '#666'
            craftBtn.style.color = '#fff'
            craftBtn.style.cursor = canCraft ? 'pointer' : 'not-allowed'
            craftBtn.disabled = !canCraft

            craftBtn.onclick = () => {
                if (!this.craftingSystem || !canCraft) return
                const result = this.craftingSystem.craft(recipe.id)
                if (result.success) {
                    this.showMessage(result.message, false)
                    this.updateInventory()
                    this.updateCraftingPanel()
                } else {
                    this.showMessage(result.message, false)
                }
            }

            recipeItem.appendChild(craftBtn)
            recipeList.appendChild(recipeItem)
        })
    }
}
