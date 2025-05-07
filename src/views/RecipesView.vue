<template>
  <div class="page-container">
    <van-empty v-if="recipes.length === 0" description="暂无菜谱数据" />
    
    <template v-else>
      <van-search v-model="searchText" placeholder="搜索菜谱" />
      
      <van-list>
        <van-swipe-cell v-for="item in filteredRecipes" :key="item.id">
          <van-cell :title="item.name" is-link @click="viewRecipeDetail(item)" />
          <template #right>
            <van-button square type="danger" text="删除" @click="confirmDelete(item)" />
          </template>
        </van-swipe-cell>
      </van-list>
    </template>
    
    <van-button
      type="primary"
      icon="plus"
      class="add-button"
      @click="showAddDialog = true"
    >
      添加菜谱
    </van-button>
    
    <!-- 添加/编辑菜谱对话框 -->
    <van-dialog
      v-model:show="showAddDialog"
      :title="isEditing ? '编辑菜谱' : '添加菜谱'"
      show-cancel-button
      @confirm="saveRecipe"
    >
      <van-form @submit.prevent>
        <van-cell-group inset>
          <van-field
            v-model="currentRecipe.name"
            name="name"
            label="菜谱名称"
            placeholder="请输入菜谱名称"
            :rules="[{ required: true, message: '请输入菜谱名称' }]"
          />
          <van-field
            v-model="currentRecipe.description"
            name="description"
            label="描述"
            type="textarea"
            placeholder="请输入菜谱描述（可选）"
            rows="2"
            autosize
          />
        </van-cell-group>
        
        <div class="ingredients-section">
          <div class="section-title">
            <span>配料清单</span>
            <van-button size="small" type="primary" @click="showIngredientSelector = true">添加配料</van-button>
          </div>
          
          <van-empty v-if="currentRecipe.ingredients.length === 0" description="暂无配料" />
          
          <van-cell-group v-else inset>
            <van-swipe-cell v-for="(item, index) in currentRecipe.ingredients" :key="index">
              <van-cell>
                <template #title>
                  <div class="ingredient-item">
                    <span>{{ getIngredientName(item.ingredientId) }}</span>
                    <div class="amount-input">
                      <van-stepper v-model="item.amount" min="0.1" step="0.1" :decimal-length="1" />
                      <span class="unit">{{ getIngredientUnit(item.ingredientId) }}</span>
                    </div>
                  </div>
                </template>
              </van-cell>
              <template #right>
                <van-button square type="danger" text="删除" @click="removeIngredient(index)" />
              </template>
            </van-swipe-cell>
          </van-cell-group>
        </div>
      </van-form>
    </van-dialog>
    
    <!-- 配料选择器 -->
    <van-dialog
      v-model:show="showIngredientSelector"
      title="选择配料"
      show-cancel-button
      @confirm="addSelectedIngredient"
    >
      <van-search v-model="ingredientSearchText" placeholder="搜索配料" />
      <van-radio-group v-model="selectedIngredientId">
        <van-cell-group inset>
          <van-cell
            v-for="ingredient in availableIngredients"
            :key="ingredient.id"
            :title="ingredient.name"
            clickable
            @click="selectedIngredientId = ingredient.id"
          >
            <template #right-icon>
              <van-radio :name="ingredient.id" />
            </template>
          </van-cell>
        </van-cell-group>
      </van-radio-group>
    </van-dialog>
    
    <!-- 删除确认对话框 -->
    <van-dialog
      v-model:show="showDeleteDialog"
      title="确认删除"
      show-cancel-button
      @confirm="deleteRecipe"
    >
      <p style="padding: 20px 16px;">确定要删除菜谱 "{{ currentRecipe.name }}" 吗？</p>
    </van-dialog>
    
    <!-- 菜谱详情 -->
    <van-popup
      v-model:show="showRecipeDetail"
      position="bottom"
      :style="{ height: '70%' }"
      round
    >
      <div class="recipe-detail">
        <van-nav-bar
          :title="currentRecipe.name"
          left-text="返回"
          right-text="编辑"
          @click-left="showRecipeDetail = false"
          @click-right="editCurrentRecipe"
        />
        
        <div class="recipe-content">
          <div class="recipe-description" v-if="currentRecipe.description">
            <h3>描述</h3>
            <p>{{ currentRecipe.description }}</p>
          </div>
          
          <div class="recipe-ingredients">
            <h3>配料清单</h3>
            <van-cell-group inset>
              <van-cell
                v-for="item in currentRecipe.ingredients"
                :key="item.ingredientId"
                :title="getIngredientName(item.ingredientId)"
                :value="`${item.amount} ${getIngredientUnit(item.ingredientId)}`"
              />
            </van-cell-group>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRecipesStore, useIngredientsStore, type Recipe, type RecipeIngredient } from '../stores'
import { showToast, showDialog } from 'vant'
import { v4 as uuidv4 } from 'uuid'

// 获取菜谱和原材料存储
const recipesStore = useRecipesStore()
const ingredientsStore = useIngredientsStore()

const recipes = computed(() => recipesStore.recipes)
const ingredients = computed(() => ingredientsStore.ingredients)

// 搜索功能
const searchText = ref('')
const filteredRecipes = computed(() => {
  if (!searchText.value) return recipes.value
  const keyword = searchText.value.toLowerCase()
  return recipes.value.filter(item => 
    item.name.toLowerCase().includes(keyword) ||
    (item.description && item.description.toLowerCase().includes(keyword))
  )
})

// 添加/编辑对话框状态
const showAddDialog = ref(false)
const isEditing = ref(false)
const currentRecipe = ref<Recipe>({
  id: '',
  name: '',
  ingredients: [],
  description: ''
})

// 删除对话框状态
const showDeleteDialog = ref(false)

// 菜谱详情状态
const showRecipeDetail = ref(false)

// 配料选择器状态
const showIngredientSelector = ref(false)
const selectedIngredientId = ref('')
const ingredientSearchText = ref('')

// 可用的原材料（排除已添加的）
const availableIngredients = computed(() => {
  const addedIds = currentRecipe.value.ingredients.map(item => item.ingredientId)
  const filtered = ingredients.value.filter(item => !addedIds.includes(item.id))
  
  // 搜索过滤
  if (ingredientSearchText.value) {
    const keyword = ingredientSearchText.value.toLowerCase()
    return filtered.filter(item => 
      item.name.toLowerCase().includes(keyword)
    )
  }
  
  // 默认只显示前10条
  return filtered.slice(0, 10)
})

// 获取原材料名称
const getIngredientName = (id: string) => {
  const ingredient = ingredients.value.find(item => item.id === id)
  return ingredient ? ingredient.name : '未知原材料'
}

// 获取原材料单位
const getIngredientUnit = (id: string) => {
  const ingredient = ingredients.value.find(item => item.id === id)
  return ingredient ? ingredient.unit : ''
}

// 添加新菜谱
const addNewRecipe = () => {
  isEditing.value = false
  currentRecipe.value = {
    id: '',
    name: '',
    ingredients: [],
    description: ''
  }
  showAddDialog.value = true
}

// 编辑菜谱
const editRecipe = (recipe: Recipe) => {
  isEditing.value = true
  currentRecipe.value = JSON.parse(JSON.stringify(recipe)) // 深拷贝
  showAddDialog.value = true
}

// 编辑当前查看的菜谱
const editCurrentRecipe = () => {
  showRecipeDetail.value = false
  editRecipe(currentRecipe.value)
}

// 保存菜谱
const saveRecipe = () => {
  if (!currentRecipe.value.name) {
    showToast('请填写菜谱名称')
    return
  }
  
  if (currentRecipe.value.ingredients.length === 0) {
    showDialog({
      title: '提示',
      message: '当前菜谱没有添加任何配料，确定要保存吗？',
      showCancelButton: true,
    }).then(({ confirm }) => {
      if (confirm) {
        saveRecipeToStore()
      }
    })
  } else {
    saveRecipeToStore()
  }
}

// 保存菜谱到存储
const saveRecipeToStore = () => {
  if (isEditing.value) {
    recipesStore.updateRecipe(currentRecipe.value)
    showToast('菜谱已更新')
  } else {
    const newRecipe = {
      ...currentRecipe.value,
      id: uuidv4()
    }
    recipesStore.addRecipe(newRecipe)
    showToast('菜谱已添加')
  }
  
  // 重置表单
  currentRecipe.value = {
    id: '',
    name: '',
    ingredients: [],
    description: ''
  }
}

// 查看菜谱详情
const viewRecipeDetail = (recipe: Recipe) => {
  currentRecipe.value = JSON.parse(JSON.stringify(recipe)) // 深拷贝
  showRecipeDetail.value = true
}

// 确认删除
const confirmDelete = (recipe: Recipe) => {
  currentRecipe.value = { ...recipe }
  showDeleteDialog.value = true
}

// 删除菜谱
const deleteRecipe = () => {
  recipesStore.deleteRecipe(currentRecipe.value.id)
  showToast('菜谱已删除')
}

// 添加选中的配料
const addSelectedIngredient = () => {
  if (!selectedIngredientId.value) {
    showToast('请选择一个配料')
    return
  }
  
  const newIngredient: RecipeIngredient = {
    ingredientId: selectedIngredientId.value,
    amount: 1
  }
  
  currentRecipe.value.ingredients.push(newIngredient)
  selectedIngredientId.value = ''
}

// 移除配料
const removeIngredient = (index: number) => {
  currentRecipe.value.ingredients.splice(index, 1)
}
</script>

<style scoped>
.add-button {
  position: fixed;
  bottom: 70px;
  right: 16px;
  z-index: 10;
}

.ingredients-section {
  margin-top: 16px;
  padding: 0 16px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: bold;
}

.ingredient-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount-input {
  display: flex;
  align-items: center;
}

.unit {
  margin-left: 8px;
  color: #666;
}

.recipe-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.recipe-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.recipe-description,
.recipe-ingredients {
  margin-bottom: 24px;
}

.recipe-description h3,
.recipe-ingredients h3 {
  margin-bottom: 8px;
  font-size: 16px;
  color: #323233;
}
</style>