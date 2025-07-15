import { createRouter, createWebHashHistory } from 'vue-router'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { firebaseApp } from '@/firebase/firebaseInit'

if (!firebaseApp) {
  throw new Error('Firebase has not been initialized');
}

const routes = [
  {
    path: '/',
    name: 'home',
    redirect: '/login'
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
  {
    path: '/shared/:accessKey',
    name: 'SharedDashboard',
    component: () => import('@/views/SharedDashboardView.vue'),
    meta: { 
      requiresAuth: false,
      isPublicShare: true 
    }
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

let isAuthInitialized = false;

onAuthStateChanged(getAuth(), (user) => {
  if (!isAuthInitialized) {
    isAuthInitialized = true;
    if (user) {
      // Redirect to themespace if authenticated
      router.push('/themespace');
    } else {
      // Redirect to login if not authenticated
      router.push('/login');
    }
  }
});

router.beforeEach((to, from, next) => {
  const auth = getAuth();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isPublicShare = to.matched.some(record => record.meta.isPublicShare);
  
  // Allow public share routes without authentication
  if (isPublicShare) {
    next();
    return;
  }

  if (requiresAuth && !auth.currentUser) {
    next('/login');
  } else if (to.path === '/login' && auth.currentUser) {
    next('/dashboard');
  } else {
    next();
  }
})

export default router
