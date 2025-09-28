<template>
  <div class="signIn-form">
    <h1>ログイン</h1>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <!-- Email field -->
        <div class="form-input-container">
          <label for="email">Email</label>
          <div class="input-wrapper">
            <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <input 
              v-model="email" 
              type="email" 
              id="email" 
              placeholder="Enter your email"
              required
              @focus="setActiveField('email')"
              @blur="setActiveField(null)"
              :class="{ 'input-focused': activeField === 'email' }"
            >
          </div>
        </div>

        <!-- Password field -->
        <div class="form-input-container">
          <label for="password">Password</label>
          <div class="input-wrapper">
            <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <input 
              v-model="password" 
              :type="showPassword ? 'text' : 'password'"
              id="password" 
              placeholder="Enter your password"
              required
              @focus="setActiveField('password')"
              @blur="setActiveField(null)"
              :class="{ 'input-focused': activeField === 'password' }"
            >
            <button 
              type="button"
              class="password-toggle"
              @click="togglePassword"
              tabindex="-1"
            >
              <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Remember me checkbox -->
        <div class="form-input-container checkbox-container">
          <label class="checkbox-label">
            <input 
              v-model="rememberMe" 
              type="checkbox" 
              class="checkbox-input"
            >
            <span class="checkbox-text">Remember me</span>
          </label>
        </div>
      </div>

      <div class="button-container">
        <button type="submit" :disabled="isLoading">
          <span v-if="!isLoading">Login</span>
          <span v-else class="loading-spinner">
            <svg class="spinner" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle class="spinner-circle" cx="12" cy="12" r="10" fill="none" stroke-width="3"></circle>
            </svg>
          </span>
        </button>
      </div>

      <transition name="fade">
        <p v-if="error" class="error-message">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {{ error }}
        </p>
      </transition>
    </form>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  setup() {
    const store = useStore();
    const router = useRouter();
    
    // Form fields
    const email = ref('');
    const password = ref('');
    const rememberMe = ref(false);
    
    // UI states
    const showPassword = ref(false);
    const activeField = ref(null);

    // Computed properties
    const isLoading = computed(() => store.getters['auth/isLoading']);
    const error = computed(() => store.getters['auth/authError']);

    // Methods
    const togglePassword = () => {
      showPassword.value = !showPassword.value;
    };
    
    const setActiveField = (field) => {
      activeField.value = field;
    };

    const handleLogin = async () => {
      // Clear any previous errors
      await store.dispatch('auth/clearError');
      
      await store.dispatch('auth/login', { 
        email: email.value, 
        password: password.value 
      });
      
      if (store.getters['auth/isAuthenticated']) {
        await store.dispatch('user/setUserId');
        
        // Store remember me preference if needed
        if (rememberMe.value) {
          localStorage.setItem('rememberMe', 'true');
        }
        
        router.push('/themespace');
        
        // Uncomment if you want to use view history logic
        /*
        if(store.state.user.viewHistory.lastLocation != "mindspace") {
          router.push('/themespace');
        } else {
          router.push('/mindspace');
        }
        */
      }
    };

    return { 
      email, 
      password, 
      rememberMe,
      showPassword,
      activeField,
      handleLogin,
      togglePassword,
      setActiveField,
      isLoading, 
      error 
    };
  }
}
</script>

<style lang="scss" scoped>
@import '../assets/loginViewStyle.scss';

// Additional styles specific to the sign-in form
.checkbox-container {
  margin-top: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.75rem;
  cursor: pointer;
  accent-color: $primary-color;
}

.checkbox-text {
  color: $text-secondary;
  font-size: 0.9rem;
  @include transition(color);
  
  .checkbox-label:hover & {
    color: $text-color;
  }
}
</style>