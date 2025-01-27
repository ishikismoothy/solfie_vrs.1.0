import { createRouter, createWebHashHistory } from 'vue-router'
import { getAuth } from 'firebase/auth'

const routes = [
  {
    path: '/',
    name: 'home',
    redirect: () => {
      const auth = getAuth();
      return auth.currentUser ? '/themespace' : '/login'
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
     path: '/dataextract',
     name: 'dataextract',
     component: () => import('../views/dataExtractTestView.vue'),
     meta: { requiresAuth: true }
   },
  {
    path: '/themespace',
    name: 'themespace',
    component: () => import('@/views/ThemeSpaceView.vue'),
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
