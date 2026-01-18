export class QuickSlotBar {
    private element: HTMLDivElement
    private slots: HTMLDivElement[] = []
    private onSlotClick: ((slot: number) => void) | null = null
    private currentSlot: number = 1
    
    constructor() {
        this.element = document.createElement('div')
        this.element.id = 'quick-slot-bar'
        this.setupStyles()
        this.createSlots()
        document.body.appendChild(this.element)
        
        // 키보드 단축키 (1-9)
        window.addEventListener('keydown', (e) => {
            const key = e.key
            if (key >= '1' && key <= '9') {
                const slot = parseInt(key)
                this.selectSlot(slot)
            }
        })
    }
    
    private setupStyles() {
        Object.assign(this.element.style, {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '5px',
            zIndex: '1000',
            padding: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
        })
    }
    
    private createSlots() {
        for (let i = 1; i <= 9; i++) {
            const slot = document.createElement('div')
            slot.className = 'quick-slot'
            slot.dataset.slot = i.toString()
            
            Object.assign(slot.style, {
                width: '50px',
                height: '50px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
            })
            
            // 슬롯 번호
            const slotNumber = document.createElement('div')
            slotNumber.textContent = i.toString()
            slotNumber.style.cssText = 'position: absolute; top: 2px; left: 2px; font-size: 10px; color: #999;'
            slot.appendChild(slotNumber)
            
            // 아이템 표시 영역
            const itemDisplay = document.createElement('div')
            itemDisplay.className = 'item-display'
            itemDisplay.style.cssText = 'font-size: 20px;'
            slot.appendChild(itemDisplay)
            
            slot.onclick = () => {
                this.selectSlot(i)
            }
            
            slot.onmouseenter = () => {
                if (this.currentSlot !== i) {
                    slot.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                }
            }
            
            slot.onmouseleave = () => {
                if (this.currentSlot !== i) {
                    slot.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                }
            }
            
            this.element.appendChild(slot)
            this.slots.push(slot)
        }
        
        // 초기 슬롯 선택
        this.selectSlot(1)
    }
    
    public selectSlot(slot: number) {
        if (slot < 1 || slot > 9) return
        
        // 이전 슬롯 스타일 제거
        const prevSlot = this.slots[this.currentSlot - 1]
        if (prevSlot) {
            prevSlot.style.borderColor = 'rgba(255, 255, 255, 0.3)'
            prevSlot.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
        }
        
        // 새 슬롯 선택
        this.currentSlot = slot
        const currentSlotElement = this.slots[slot - 1]
        if (currentSlotElement) {
            currentSlotElement.style.borderColor = 'rgba(100, 150, 255, 1)'
            currentSlotElement.style.backgroundColor = 'rgba(100, 150, 255, 0.3)'
        }
        
        // 콜백 호출
        if (this.onSlotClick) {
            this.onSlotClick(slot)
        }
    }
    
    public setSlotItem(slot: number, itemId: string | null, toolType: string | null) {
        if (slot < 1 || slot > 9) return
        
        const slotElement = this.slots[slot - 1]
        if (!slotElement) return
        
        const itemDisplay = slotElement.querySelector('.item-display') as HTMLDivElement
        if (!itemDisplay) return
        
        if (toolType) {
            const toolIcons: { [key: string]: string } = {
                'hand': '✋',
                'axe': '🪓',
                'pickaxe': '⛏️',
                'shovel': '🪣',
                'fishing_rod': '🎣',
                'net': '🪰',
                'watering_can': '💧'
            }
            itemDisplay.textContent = toolIcons[toolType] || '?'
        } else if (itemId) {
            itemDisplay.textContent = '📦'
        } else {
            itemDisplay.textContent = ''
        }
    }
    
    public setOnSlotClick(callback: (slot: number) => void) {
        this.onSlotClick = callback
    }
    
    public getCurrentSlot(): number {
        return this.currentSlot
    }
}
