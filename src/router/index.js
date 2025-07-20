import { createRouter, createWebHistory } from 'vue-router'
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
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Remove the automatic redirect on auth state change
// This was causing issues with shared links
let isAuthInitialized = false;

onAuthStateChanged(getAuth(), () => {
  isAuthInitialized = true;
  // Don't do any automatic redirects here
  // Let the route guards handle navigation
});

router.beforeEach(async (to, from, next) => {
  const auth = getAuth();
  
  // Wait for auth to initialize if it hasn't yet
  if (!isAuthInitialized) {
    await new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(getAuth(), () => {
        unsubscribe();
        resolve();
      });
    });
  }
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isPublicShare = to.matched.some(record => record.meta.isPublicShare);
  
  // Allow public share routes without authentication
  if (isPublicShare) {
    next();
    return;
  }

  // Handle auth-required routes
  if (requiresAuth && !auth.currentUser) {
    next('/login');
  } 
  // Redirect authenticated users away from login
  else if (to.path === '/login' && auth.currentUser) {
    next('/themespace');
  } 
  // Handle root path for authenticated users
  else if (to.path === '/' && auth.currentUser) {
    next('/themespace');
  }
  else {
    next();
  }
})

export default router