import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/ingredients'
    },
    {
      path: '/ingredients',
      name: 'Ingredients',
      component: () => import('../views/IngredientsView.vue'),
      meta: { title: '原材料管理' }
    },
    {
      path: '/recipes',
      name: 'Recipes',
      component: () => import('../views/RecipesView.vue'),
      meta: { title: '菜谱管理' }
    },
    {
      path: '/purchase',
      name: 'Purchase',
      component: () => import('../views/PurchaseView.vue'),
      meta: { title: '采购计算' }
    }
  ]
})

router.beforeEach((to, _from, next) => {
  document.title = to.meta.title as string || '配菜系统'
  next()
})

export default router