<template>
  <div class="page-container">
    <van-empty v-if="ingredients.length === 0" description="暂无原材料数据" />
    
    <template v-else>
      <van-search v-model="searchText" placeholder="搜索原材料" />
      
      <van-list>
        <van-swipe-cell v-for="item in filteredIngredients" :key="item.id">
          <van-cell :title="item.name" :value="`${item.unit}`" @click="editIngredient(item)" />
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
      添加原材料
    </van-button>
    
    <!-- 添加/编辑原材料对话框 -->
    <van-dialog
      v-model:show="showAddDialog"
      :title="isEditing ? '编辑原材料' : '添加原材料'"
      show-cancel-button
      @confirm="saveIngredient"
    >
      <van-form @submit.prevent>
        <van-cell-group inset>
          <van-field
            v-model="currentIngredient.name"
            name="name"
            label="名称"
            placeholder="请输入原材料名称"
            :rules="[{ required: true, message: '请输入原材料名称' }]"
          />
          <van-field
            v-model="currentIngredient.unit"
            name="unit"
            label="单位"
            placeholder="请输入计量单位（如克、个）"
            :rules="[{ required: true, message: '请输入计量单位' }]"
          />
          <van-field
            v-model="currentIngredient.description"
            name="description"
            label="描述"
            type="textarea"
            placeholder="请输入原材料描述（可选）"
            rows="2"
            autosize
          />
        </van-cell-group>
      </van-form>
    </van-dialog>
    
    <!-- 删除确认对话框 -->
    <van-dialog
      v-model:show="showDeleteDialog"
      title="确认删除"
      show-cancel-button
      @confirm="deleteIngredient"
    >
      <p style="padding: 20px 16px;">确定要删除原材料 "{{ currentIngredient.name }}" 吗？</p>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useIngredientsStore, type Ingredient } from '../stores'
import { showToast } from 'vant'
import { v4 as uuidv4 } from 'uuid'

// 获取原材料存储
const ingredientsStore = useIngredientsStore()
const ingredients = computed(() => ingredientsStore.ingredients)

// 搜索功能
const searchText = ref('')
const filteredIngredients = computed(() => {
  if (!searchText.value) return ingredients.value
  const keyword = searchText.value.toLowerCase()
  return ingredients.value.filter(item => 
    item.name.toLowerCase().includes(keyword) ||
    (item.description && item.description.toLowerCase().includes(keyword))
  )
})

// 添加/编辑对话框状态
const showAddDialog = ref(false)
const isEditing = ref(false)
const currentIngredient = ref<Ingredient>({
  id: '',
  name: '',
  unit: '',
  description: ''
})

// 删除对话框状态
const showDeleteDialog = ref(false)

// 添加新原材料
const addNewIngredient = () => {
  isEditing.value = false
  currentIngredient.value = {
    id: '',
    name: '',
    unit: '',
    description: ''
  }
  showAddDialog.value = true
}

// 编辑原材料
const editIngredient = (ingredient: Ingredient) => {
  isEditing.value = true
  currentIngredient.value = { ...ingredient }
  showAddDialog.value = true
}

// 保存原材料
const saveIngredient = () => {
  if (!currentIngredient.value.name || !currentIngredient.value.unit) {
    showToast('请填写必填字段')
    return
  }
  
  if (isEditing.value) {
    ingredientsStore.updateIngredient(currentIngredient.value)
    showToast('原材料已更新')
  } else {
    const newIngredient = {
      ...currentIngredient.value,
      id: uuidv4()
    }
    ingredientsStore.addIngredient(newIngredient)
    showToast('原材料已添加')
  }
  
  // 重置表单
  currentIngredient.value = {
    id: '',
    name: '',
    unit: '',
    description: ''
  }
}

// 确认删除
const confirmDelete = (ingredient: Ingredient) => {
  currentIngredient.value = { ...ingredient }
  showDeleteDialog.value = true
}

// 删除原材料
const deleteIngredient = () => {
  ingredientsStore.deleteIngredient(currentIngredient.value.id)
  showToast('原材料已删除')
}
</script>

<style scoped>
.add-button {
  position: fixed;
  bottom: 70px;
  right: 16px;
  z-index: 10;
}
</style>