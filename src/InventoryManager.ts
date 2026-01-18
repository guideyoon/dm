export interface InventoryItem {
    name: string;
    count: number;
}

export class InventoryManager {
    private items: Map<string, number> = new Map();
    private maxSlots: number = 20;

    add(itemName: string, count: number = 1): boolean {
        const currentCount = this.items.get(itemName) || 0;
        
        console.log('InventoryManager.add:', itemName, '현재 개수:', currentCount, '추가할 개수:', count, '슬롯 사용:', this.items.size, '/', this.maxSlots);
        
        // 인벤토리 공간 확인
        if (this.items.size >= this.maxSlots && !this.items.has(itemName)) {
            console.log('인벤토리 가득 참, 추가 실패:', itemName);
            return false; // 인벤토리 가득 참
        }

        const newCount = currentCount + count;
        this.items.set(itemName, newCount);
        console.log('아이템 추가 성공:', itemName, '새 개수:', newCount);
        return true;
    }

    remove(itemName: string, count: number = 1): boolean {
        const currentCount = this.items.get(itemName) || 0;
        
        if (currentCount < count) {
            return false; // 아이템 부족
        }

        if (currentCount === count) {
            this.items.delete(itemName);
        } else {
            this.items.set(itemName, currentCount - count);
        }
        
        return true;
    }

    getCount(itemName: string): number {
        return this.items.get(itemName) || 0;
    }

    has(itemName: string, count: number = 1): boolean {
        return this.getCount(itemName) >= count;
    }

    list(): InventoryItem[] {
        return Array.from(this.items.entries()).map(([name, count]) => ({
            name,
            count
        }));
    }

    getMaxSlots(): number {
        return this.maxSlots;
    }

    getUsedSlots(): number {
        return this.items.size;
    }

    isEmpty(): boolean {
        return this.items.size === 0;
    }
}
