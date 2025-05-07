<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 当前激活的标签页
const activeTab = ref('ingredients')

// 导航栏标题
const navTitle = computed(() => {
  return route.meta.title as string || '配菜系统'
})

// 是否显示返回箭头
const showBackArrow = computed(() => {
  // 在子页面显示返回箭头
  return route.path.split('/').length > 2
})

// 返回按钮点击事件
const onClickLeft = () => {
  router.back()
}
</script>

<template>
  <div class="app-container">
    <van-nav-bar
      :title="navTitle"
      left-arrow
      @click-left="onClickLeft"
      v-if="showBackArrow"
      fixed
    />
    <div class="content">
      <router-view />
    </div>
    <van-tabbar v-model="activeTab" route>
      <van-tabbar-item icon="apps-o" to="/ingredients" name="ingredients">原材料</van-tabbar-item>
      <van-tabbar-item icon="orders-o" to="/recipes" name="recipes">菜谱</van-tabbar-item>
      <van-tabbar-item icon="cart-o" to="/purchase" name="purchase">采购</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<style>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f8fa;
}

.content {
  flex: 1;
  padding-top: 46px; /* 导航栏高度 */
  padding-bottom: 50px; /* 底部标签栏高度 */
  overflow-y: auto;
}

/* 全局样式 */
:root {
  --van-primary-color: #1989fa;
}

/* 页面通用样式 */
.page-container {
  padding: 16px;
}

.form-group {
  margin-bottom: 16px;
}
</style>
