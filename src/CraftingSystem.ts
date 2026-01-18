import { RecipeManager, Recipe } from './Recipe'
import { InventoryManager, InventoryItem } from './InventoryManager'

export class CraftingSystem {
    private recipeManager: RecipeManager
    private inventoryManager: InventoryManager

    constructor(inventoryManager: InventoryManager) {
        this.recipeManager = new RecipeManager()
        this.inventoryManager = inventoryManager
    }

    craft(recipeId: string): { success: boolean; message: string } {
        const recipe = this.recipeManager.getRecipe(recipeId)
        if (!recipe) {
            return { success: false, message: '레시피를 찾을 수 없습니다.' }
        }

        // 재료 확인
        const canCraft = this.recipeManager.canCraft(
            recipeId,
            this.inventoryManager.list()
        )

        if (!canCraft) {
            return { success: false, message: '재료가 부족합니다.' }
        }

        // 인벤토리 공간 확인
        const currentCount = this.inventoryManager.getCount(recipe.resultItem)
        const canAdd = this.inventoryManager.add(recipe.resultItem, recipe.resultCount)
        
        if (!canAdd) {
            return { success: false, message: '인벤토리가 가득 찼습니다.' }
        }

        // 재료 소비
        for (const ingredient of recipe.ingredients) {
            this.inventoryManager.remove(ingredient.name, ingredient.count)
        }

        return { success: true, message: `${recipe.name} 제작 완료!` }
    }

    getAvailableRecipes(): Recipe[] {
        const allRecipes = this.recipeManager.getAllRecipes()
        const inventoryItems = this.inventoryManager.list()

        return allRecipes.filter(recipe =>
            this.recipeManager.canCraft(recipe.id, inventoryItems)
        )
    }

    getAllRecipes(): Recipe[] {
        return this.recipeManager.getAllRecipes()
    }

    getRecipeManager(): RecipeManager {
        return this.recipeManager
    }
}
