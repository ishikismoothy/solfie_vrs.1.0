import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { firebaseApp } from '@/firebase/firebaseInit'

// Ensure Firebase is initialized
if (!firebaseApp) {
    throw new Error('Firebase has not been initialized properly')
}

store.dispatch('auth/initAuth').then(() => {
    createApp(App).use(store).use(router).mount('#app')
})