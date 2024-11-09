import { createRouter, createWebHashHistory } from 'vue-router'
import { getAuth } from 'firebase/auth'

const routes = [
  {
    path: '/',
    name: 'home',
    redirect: () => {
      const auth = getAuth();
      return auth.currentUser ? '/dashboard' : '/login'
    }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/logInView.vue')
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/mindspace',
    name: 'mindspace',
    component: () => import('../views/MindSpaceView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dataextract',
    name: 'dataextract',
    component: () => import('../views/dataExtractTestView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/testItem',
    name: 'testItem',
    component: () => import('@/components/itemContentsWindow.vue'),
    meta: { requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const auth = getAuth();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !auth.currentUser) {
    next('/login');
  } else if (to.path === '/login' && auth.currentUser) {
    next('/dashboard');
  } else {
    next();
  }
})

export default router
