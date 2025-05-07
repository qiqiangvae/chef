import { defineStore } from 'pinia'
import { ref } from 'vue'

// 定义原材料类型
export interface Ingredient {
  id: string
  name: string
  unit: string
  description?: string
}

// 定义菜谱中的配料类型
export interface RecipeIngredient {
  ingredientId: string
  amount: number
}

// 定义菜谱类型
export interface Recipe {
  id: string
  name: string
  ingredients: RecipeIngredient[]
  description?: string
}

// 定义采购项类型
export interface PurchaseItem {
  recipeId: string
  tableCount: number
}

// 导入预设的原材料数据
import { defaultIngredients } from '../data/defaultIngredients'

// 原材料存储
export const useIngredientsStore = defineStore('ingredients', () => {
  const ingredients = ref<Ingredient[]>([])

  // 从本地存储加载数据
  const loadIngredients = () => {
    const savedData = localStorage.getItem('chef-ingredients')
    if (savedData) {
      ingredients.value = JSON.parse(savedData)
    } else {
      // 如果没有本地存储数据，加载预设的原材料数据
      ingredients.value = [...defaultIngredients]
      // 保存到本地存储
      saveIngredients()
    }
  }

  // 保存数据到本地存储
  const saveIngredients = () => {
    localStorage.setItem('chef-ingredients', JSON.stringify(ingredients.value))
  }

  // 添加原材料
  const addIngredient = (ingredient: Ingredient) => {
    ingredients.value.push(ingredient)
    saveIngredients()
  }

  // 更新原材料
  const updateIngredient = (updatedIngredient: Ingredient) => {
    const index = ingredients.value.findIndex(item => item.id === updatedIngredient.id)
    if (index !== -1) {
      ingredients.value[index] = updatedIngredient
      saveIngredients()
    }
  }

  // 删除原材料
  const deleteIngredient = (id: string) => {
    ingredients.value = ingredients.value.filter(item => item.id !== id)
    saveIngredients()
  }

  // 初始化时加载数据
  loadIngredients()

  return {
    ingredients,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    loadIngredients
  }
})

// 菜谱存储
export const useRecipesStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>([])

  // 从本地存储加载数据
  const loadRecipes = () => {
    const savedData = localStorage.getItem('chef-recipes')
    if (savedData) {
      recipes.value = JSON.parse(savedData)
    }
  }

  // 保存数据到本地存储
  const saveRecipes = () => {
    localStorage.setItem('chef-recipes', JSON.stringify(recipes.value))
  }

  // 添加菜谱
  const addRecipe = (recipe: Recipe) => {
    recipes.value.push(recipe)
    saveRecipes()
  }

  // 更新菜谱
  const updateRecipe = (updatedRecipe: Recipe) => {
    const index = recipes.value.findIndex(item => item.id === updatedRecipe.id)
    if (index !== -1) {
      recipes.value[index] = updatedRecipe
      saveRecipes()
    }
  }

  // 删除菜谱
  const deleteRecipe = (id: string) => {
    recipes.value = recipes.value.filter(item => item.id !== id)
    saveRecipes()
  }

  // 初始化时加载数据
  loadRecipes()

  return {
    recipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    loadRecipes
  }
})

// 采购存储
export const usePurchaseStore = defineStore('purchase', () => {
  const purchaseItems = ref<PurchaseItem[]>([])

  // 添加采购项
  const addPurchaseItem = (item: PurchaseItem) => {
    // 检查是否已存在相同菜谱的采购项
    const existingIndex = purchaseItems.value.findIndex(i => i.recipeId === item.recipeId)
    if (existingIndex !== -1) {
      // 如果存在，更新桌数
      purchaseItems.value[existingIndex].tableCount = item.tableCount
    } else {
      // 如果不存在，添加新项
      purchaseItems.value.push(item)
    }
  }

  // 删除采购项
  const removePurchaseItem = (recipeId: string) => {
    purchaseItems.value = purchaseItems.value.filter(item => item.recipeId !== recipeId)
  }

  // 清空采购项
  const clearPurchaseItems = () => {
    purchaseItems.value = []
  }

  return {
    purchaseItems,
    addPurchaseItem,
    removePurchaseItem,
    clearPurchaseItems
  }
})