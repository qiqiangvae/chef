s<template>
  <div class="page-container">
    <van-form @submit.prevent>
      <van-cell-group inset title="选择菜谱">
        <van-field
          readonly
          clickable
          label="菜谱"
          :value="selectedRecipesText"
          placeholder="请选择菜谱"
          @click="showRecipeSelector = true"
        />
      </van-cell-group>
      
      <van-cell-group inset title="设置桌数" v-if="purchaseItems.length > 0">
        <van-cell v-for="item in purchaseItems" :key="item.recipeId">
          <template #title>
            <div class="table-count-item">
              <span>{{ getRecipeName(item.recipeId) }}</span>
              <van-stepper v-model="item.tableCount" min="1" />
            </div>
          </template>
        </van-cell>
      </van-cell-group>
    </van-form>
    
    <van-divider v-if="purchaseItems.length > 0">采购清单</van-divider>
    
    <van-empty v-if="purchaseItems.length === 0" description="请先选择菜谱" />
    
    <div v-else>
      <van-cell-group inset>
        <van-cell
          v-for="item in purchaseList"
          :key="item.ingredientId"
          :title="item.name"
          :value="`${item.totalAmount} ${item.unit}`"
        />
      </van-cell-group>
      
      <div class="action-buttons">
        <van-button type="primary" block @click="printPurchaseList">打印采购清单</van-button>
        <van-button type="default" block @click="clearPurchaseList" style="margin-top: 12px;">清空</van-button>
      </div>
    </div>
    
    <!-- 菜谱选择器 -->
    <van-popup
      v-model:show="showRecipeSelector"
      position="bottom"
      :style="{ height: '70%' }"
      round
    >
      <div class="recipe-selector">
        <van-nav-bar
          title="选择菜谱"
          left-text="取消"
          right-text="确定"
          @click-left="showRecipeSelector = false"
          @click-right="confirmRecipeSelection"
        />
        
        <van-search v-model="searchText" placeholder="搜索菜谱" />
        
        <van-checkbox-group v-model="selectedRecipeIds">
          <van-cell-group inset>
            <van-cell
              v-for="recipe in filteredRecipes"
              :key="recipe.id"
              :title="recipe.name"
              clickable
              @click="toggleRecipeSelection(recipe.id)"
            >
              <template #right-icon>
                <van-checkbox :name="recipe.id" ref="checkboxRefs" />
              </template>
            </van-cell>
          </van-cell-group>
        </van-checkbox-group>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRecipesStore, useIngredientsStore, usePurchaseStore } from '../stores'
import { showToast } from 'vant'

// 获取存储
const recipesStore = useRecipesStore()
const ingredientsStore = useIngredientsStore()
const purchaseStore = usePurchaseStore()

const recipes = computed(() => recipesStore.recipes)
const ingredients = computed(() => ingredientsStore.ingredients)
const purchaseItems = computed(() => purchaseStore.purchaseItems)

// 菜谱选择器状态
const showRecipeSelector = ref(false)
const selectedRecipeIds = ref<string[]>([])
const searchText = ref('')

// 过滤菜谱
const filteredRecipes = computed(() => {
  if (!searchText.value) return recipes.value
  const keyword = searchText.value.toLowerCase()
  return recipes.value.filter(item => 
    item.name.toLowerCase().includes(keyword) ||
    (item.description && item.description.toLowerCase().includes(keyword))
  )
})

// 已选菜谱文本
const selectedRecipesText = computed(() => {
  if (purchaseItems.value.length === 0) return ''
  return purchaseItems.value.map(item => getRecipeName(item.recipeId)).join('、')
})

// 获取菜谱名称
const getRecipeName = (id: string) => {
  const recipe = recipes.value.find(item => item.id === id)
  return recipe ? recipe.name : '未知菜谱'
}

// 切换菜谱选择
const toggleRecipeSelection = (id: string) => {
  const index = selectedRecipeIds.value.indexOf(id)
  if (index === -1) {
    selectedRecipeIds.value.push(id)
  } else {
    selectedRecipeIds.value.splice(index, 1)
  }
}

// 确认菜谱选择
const confirmRecipeSelection = () => {
  // 清空当前采购项
  purchaseStore.clearPurchaseItems()
  
  // 添加新选择的菜谱
  selectedRecipeIds.value.forEach(recipeId => {
    purchaseStore.addPurchaseItem({
      recipeId,
      tableCount: 1
    })
  })
  
  showRecipeSelector.value = false
}

// 计算采购清单
const purchaseList = computed(() => {
  // 创建一个Map来存储每种原材料的总量
  const ingredientMap = new Map<string, { totalAmount: number, name: string, unit: string }>()
  
  // 遍历所有采购项
  purchaseItems.value.forEach(purchaseItem => {
    const recipe = recipes.value.find(r => r.id === purchaseItem.recipeId)
    if (!recipe) return
    
    // 遍历菜谱中的每种配料
    recipe.ingredients.forEach(ingredient => {
      const totalAmount = ingredient.amount * purchaseItem.tableCount
      const ingredientInfo = ingredients.value.find(i => i.id === ingredient.ingredientId)
      if (!ingredientInfo) return
      
      // 如果Map中已有该原材料，则累加数量
      if (ingredientMap.has(ingredient.ingredientId)) {
        const existing = ingredientMap.get(ingredient.ingredientId)!
        existing.totalAmount += totalAmount
      } else {
        // 否则添加新条目
        ingredientMap.set(ingredient.ingredientId, {
          totalAmount,
          name: ingredientInfo.name,
          unit: ingredientInfo.unit
        })
      }
    })
  })
  
  // 将Map转换为数组并返回
  return Array.from(ingredientMap.entries()).map(([ingredientId, info]) => ({
    ingredientId,
    ...info,
    // 保留一位小数
    totalAmount: Math.round(info.totalAmount * 10) / 10
  }))
})

// 打印采购清单
const printPurchaseList = () => {
  if (purchaseList.value.length === 0) {
    showToast('采购清单为空')
    return
  }
  
  // 创建打印内容
  let printContent = `<html><head><title>采购清单</title>`
  printContent += `<style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { text-align: center; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>`
  printContent += `</head><body>`
  printContent += `<h1>采购清单</h1>`
  printContent += `<p>生成时间: ${new Date().toLocaleString()}</p>`
  
  // 添加菜谱和桌数信息
  printContent += `<h2>菜谱信息</h2>`
  printContent += `<table><tr><th>菜谱名称</th><th>桌数</th></tr>`
  purchaseItems.value.forEach(item => {
    printContent += `<tr><td>${getRecipeName(item.recipeId)}</td><td>${item.tableCount}</td></tr>`
  })
  printContent += `</table>`
  
  // 添加采购清单
  printContent += `<h2>原材料清单</h2>`
  printContent += `<table><tr><th>原材料</th><th>数量</th><th>单位</th></tr>`
  purchaseList.value.forEach(item => {
    printContent += `<tr><td>${item.name}</td><td>${item.totalAmount}</td><td>${item.unit}</td></tr>`
  })
  printContent += `</table>`
  
  printContent += `</body></html>`
  
  // 创建打印窗口
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    // 延迟打印，确保内容已加载
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  } else {
    showToast('无法打开打印窗口，请检查浏览器设置')
  }
}

// 清空采购清单
const clearPurchaseList = () => {
  purchaseStore.clearPurchaseItems()
  selectedRecipeIds.value = []
}

// 初始化选中的菜谱ID
purchaseItems.value.forEach(item => {
  if (!selectedRecipeIds.value.includes(item.recipeId)) {
    selectedRecipeIds.value.push(item.recipeId)
  }
})
</script>

<style scoped>
.table-count-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recipe-selector {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.action-buttons {
  margin: 24px 16px;
}
</style>