import { InventoryItem } from './InventoryManager'

export interface Recipe {
    id: string
    name: string
    resultItem: string
    resultCount: number
    ingredients: InventoryItem[]
    category: 'tool' | 'furniture' | 'consumable' | 'decoration'
}

export class RecipeManager {
    private recipes: Map<string, Recipe> = new Map()

    constructor() {
        this.initializeRecipes()
    }

    private initializeRecipes() {
        // 기본 도구 레시피
        this.addRecipe({
            id: 'wood_stick',
            name: '나뭇가지',
            resultItem: '나무',
            resultCount: 1,
            ingredients: [],
            category: 'tool'
        })

        // === 도구 레시피 ===
        // 도끼
        this.addRecipe({
            id: 'tool_axe',
            name: '도끼',
            resultItem: 'tool_axe',
            resultCount: 1,
            ingredients: [
                { name: '나무', count: 5 },
                { name: '돌', count: 3 }
            ],
            category: 'tool'
        })

        // 곡괭이
        this.addRecipe({
            id: 'tool_pickaxe',
            name: '곡괭이',
            resultItem: 'tool_pickaxe',
            resultCount: 1,
            ingredients: [
                { name: '나무', count: 3 },
                { name: '돌', count: 5 }
            ],
            category: 'tool'
        })

        // 삽
        this.addRecipe({
            id: 'tool_shovel',
            name: '삽',
            resultItem: 'tool_shovel',
            resultCount: 1,
            ingredients: [
                { name: '나무', count: 3 },
                { name: '돌', count: 2 }
            ],
            category: 'tool'
        })

        // 낚싯대
        this.addRecipe({
            id: 'tool_fishing_rod',
            name: '낚싯대',
            resultItem: 'tool_fishing_rod',
            resultCount: 1,
            ingredients: [
                { name: '나무', count: 8 },
                { name: '돌', count: 1 }
            ],
            category: 'tool'
        })

        // 곤충망
        this.addRecipe({
            id: 'tool_net',
            name: '곤충망',
            resultItem: 'tool_net',
            resultCount: 1,
            ingredients: [
                { name: '나무', count: 4 },
                { name: '돌', count: 2 }
            ],
            category: 'tool'
        })

        // 물뿌리개
        this.addRecipe({
            id: 'tool_watering_can',
            name: '물뿌리개',
            resultItem: 'tool_watering_can',
            resultCount: 1,
            ingredients: [
                { name: '나무', count: 3 },
                { name: '돌', count: 3 }
            ],
            category: 'tool'
        })

        // === 가구 레시피 ===
        // 의자
        this.addRecipe({
            id: 'furniture_chair',
            name: '의자',
            resultItem: 'furniture_chair',
            resultCount: 1,
            ingredients: [
                { name: '나무', count: 8 }
            ],
            category: 'furniture'
        })

        // 테이블
        this.addRecipe({
            id: 'furniture_table',
            name: '테이블',
            resultItem: 'furniture_table',
            resultCount: 1,
            ingredients: [
                { name: '나무', count: 15 }
            ],
            category: 'furniture'
        })

        // 램프
        this.addRecipe({
            id: 'furniture_lamp',
            name: '램프',
            resultItem: 'furniture_lamp',
            resultCount: 1,
            ingredients: [
                { name: '나무', count: 3 },
                { name: '돌', count: 2 }
            ],
            category: 'furniture'
        })

        // 화분
        this.addRecipe({
            id: 'furniture_plant',
            name: '화분',
            resultItem: 'furniture_plant',
            resultCount: 1,
            ingredients: [
                { name: '돌', count: 3 },
                { name: '무작위 씨앗', count: 1 }
            ],
            category: 'furniture'
        })

        // 카펫
        this.addRecipe({
            id: 'furniture_rug',
            name: '카펫',
            resultItem: 'furniture_rug',
            resultCount: 1,
            ingredients: [
                { name: '녹색 허브', count: 5 },
                { name: '파란 허브', count: 3 }
            ],
            category: 'furniture'
        })

        // === 소비 아이템 레시피 ===
        // 나무 판자
        this.addRecipe({
            id: 'material_plank',
            name: '나무 판자',
            resultItem: 'material_plank',
            resultCount: 4,
            ingredients: [
                { name: '나무', count: 1 }
            ],
            category: 'consumable'
        })

        // 돌 벽돌
        this.addRecipe({
            id: 'material_brick',
            name: '돌 벽돌',
            resultItem: 'material_brick',
            resultCount: 4,
            ingredients: [
                { name: '돌', count: 1 }
            ],
            category: 'consumable'
        })

        // 베리 주스
        this.addRecipe({
            id: 'consumable_berry_juice',
            name: '베리 주스',
            resultItem: 'consumable_berry_juice',
            resultCount: 1,
            ingredients: [
                { name: '열매', count: 3 }
            ],
            category: 'consumable'
        })

        // 허브 차
        this.addRecipe({
            id: 'consumable_herb_tea',
            name: '허브 차',
            resultItem: 'consumable_herb_tea',
            resultCount: 1,
            ingredients: [
                { name: '녹색 허브', count: 2 },
                { name: '파란 허브', count: 1 }
            ],
            category: 'consumable'
        })

        // 버섯 수프
        this.addRecipe({
            id: 'consumable_mushroom_soup',
            name: '버섯 수프',
            resultItem: 'consumable_mushroom_soup',
            resultCount: 1,
            ingredients: [
                { name: '버섯', count: 2 },
                { name: '돌', count: 1 }
            ],
            category: 'consumable'
        })

        // 순무 샐러드
        this.addRecipe({
            id: 'consumable_turnip_salad',
            name: '순무 샐러드',
            resultItem: 'consumable_turnip_salad',
            resultCount: 1,
            ingredients: [
                { name: '순무', count: 2 },
                { name: '일반 꽃', count: 1 }
            ],
            category: 'consumable'
        })

        // 당근 케이크
        this.addRecipe({
            id: 'consumable_carrot_cake',
            name: '당근 케이크',
            resultItem: 'consumable_carrot_cake',
            resultCount: 1,
            ingredients: [
                { name: '당근', count: 3 },
                { name: '열매', count: 2 }
            ],
            category: 'consumable'
        })

        // 감자 튀김
        this.addRecipe({
            id: 'consumable_fried_potato',
            name: '감자 튀김',
            resultItem: 'consumable_fried_potato',
            resultCount: 2,
            ingredients: [
                { name: '감자', count: 2 },
                { name: '돌', count: 1 }
            ],
            category: 'consumable'
        })

        // 토마토 주스
        this.addRecipe({
            id: 'consumable_tomato_juice',
            name: '토마토 주스',
            resultItem: 'consumable_tomato_juice',
            resultCount: 2,
            ingredients: [
                { name: '토마토', count: 3 }
            ],
            category: 'consumable'
        })

        // 옥수수 수프
        this.addRecipe({
            id: 'consumable_corn_soup',
            name: '옥수수 수프',
            resultItem: 'consumable_corn_soup',
            resultCount: 1,
            ingredients: [
                { name: '옥수수', count: 2 },
                { name: '버섯', count: 1 }
            ],
            category: 'consumable'
        })

        // 야채 볶음
        this.addRecipe({
            id: 'consumable_stir_fry',
            name: '야채 볶음',
            resultItem: 'consumable_stir_fry',
            resultCount: 1,
            ingredients: [
                { name: '순무', count: 1 },
                { name: '당근', count: 1 },
                { name: '감자', count: 1 }
            ],
            category: 'consumable'
        })

        // 토마토 파스타
        this.addRecipe({
            id: 'consumable_tomato_pasta',
            name: '토마토 파스타',
            resultItem: 'consumable_tomato_pasta',
            resultCount: 1,
            ingredients: [
                { name: '토마토', count: 2 },
                { name: '나무', count: 2 }
            ],
            category: 'consumable'
        })

        // 꽃 화관
        this.addRecipe({
            id: 'decoration_flower_crown',
            name: '꽃 화관',
            resultItem: 'decoration_flower_crown',
            resultCount: 1,
            ingredients: [
                { name: '일반 꽃', count: 5 }
            ],
            category: 'decoration'
        })

        // 꽃다발
        this.addRecipe({
            id: 'decoration_flower_bouquet',
            name: '꽃다발',
            resultItem: 'decoration_flower_bouquet',
            resultCount: 1,
            ingredients: [
                { name: '일반 꽃', count: 3 },
                { name: '희귀 꽃', count: 2 }
            ],
            category: 'decoration'
        })

        // 조개 장식
        this.addRecipe({
            id: 'decoration_shell_ornament',
            name: '조개 장식',
            resultItem: 'decoration_shell_ornament',
            resultCount: 1,
            ingredients: [
                { name: '일반 조개', count: 5 }
            ],
            category: 'decoration'
        })

        // 화석 가공품
        this.addRecipe({
            id: 'decoration_fossil_display',
            name: '화석 표시품',
            resultItem: 'decoration_fossil_display',
            resultCount: 1,
            ingredients: [
                { name: '화석', count: 1 },
                { name: '돌', count: 3 }
            ],
            category: 'decoration'
        })

        // === 고급 도구 레시피 ===
        // 강화 도끼 (철 도끼)
        this.addRecipe({
            id: 'tool_axe_iron',
            name: '강화 도끼',
            resultItem: 'tool_axe_iron',
            resultCount: 1,
            ingredients: [
                { name: 'tool_axe', count: 1 },
                { name: '철광석', count: 3 },
                { name: '나무', count: 2 }
            ],
            category: 'tool'
        })

        // 강화 곡괭이 (철 곡괭이)
        this.addRecipe({
            id: 'tool_pickaxe_iron',
            name: '강화 곡괭이',
            resultItem: 'tool_pickaxe_iron',
            resultCount: 1,
            ingredients: [
                { name: 'tool_pickaxe', count: 1 },
                { name: '철광석', count: 3 },
                { name: '나무', count: 2 }
            ],
            category: 'tool'
        })

        // 고급 낚싯대
        this.addRecipe({
            id: 'tool_fishing_rod_pro',
            name: '고급 낚싯대',
            resultItem: 'tool_fishing_rod_pro',
            resultCount: 1,
            ingredients: [
                { name: 'tool_fishing_rod', count: 1 },
                { name: '철광석', count: 2 },
                { name: '나무', count: 5 }
            ],
            category: 'tool'
        })
    }

    addRecipe(recipe: Recipe) {
        this.recipes.set(recipe.id, recipe)
    }

    getRecipe(id: string): Recipe | undefined {
        return this.recipes.get(id)
    }

    getAllRecipes(): Recipe[] {
        return Array.from(this.recipes.values())
    }

    getRecipesByCategory(category: string): Recipe[] {
        return this.getAllRecipes().filter(r => r.category === category)
    }

    canCraft(recipeId: string, inventoryItems: InventoryItem[]): boolean {
        const recipe = this.getRecipe(recipeId)
        if (!recipe) return false

        // 인벤토리를 Map으로 변환
        const inventoryMap = new Map<string, number>()
        inventoryItems.forEach(item => {
            inventoryMap.set(item.name, item.count)
        })

        // 재료 확인
        for (const ingredient of recipe.ingredients) {
            const available = inventoryMap.get(ingredient.name) || 0
            if (available < ingredient.count) {
                return false
            }
        }

        return true
    }
}
