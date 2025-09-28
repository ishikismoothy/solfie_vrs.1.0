<template>
  <div class="signup-form">
    <h1>新規登録</h1>
    <form @submit.prevent="handleSignup">
      <div class="form-group">
        <!-- Name field -->
        <div class="form-input-container">
          <label for="displayName">Name</label>
          <div class="input-wrapper">
            <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <input 
              v-model="displayName" 
              type="text" 
              id="displayName" 
              placeholder="Enter your name"
              class="modern-input"
              required
              @focus="setActiveField('displayName')"
              @blur="setActiveField(null)"
              :class="{ 'input-focused': activeField === 'displayName' }"
            >
          </div>
        </div>

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
              class="modern-input"
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
              class="modern-input"
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

        <!-- Date of Birth field -->
        <div class="form-input-container">
          <label for="dateOfBirth">Date of Birth</label>
          <div class="input-wrapper">
            <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <input 
              v-model="dateOfBirth" 
              type="date" 
              id="dateOfBirth" 
              class="modern-input"
              required
              @focus="setActiveField('dateOfBirth')"
              @blur="setActiveField(null)"
              :class="{ 'input-focused': activeField === 'dateOfBirth' }"
              :max="maxDate"
            >
          </div>
        </div>

        <!-- Language dropdown -->
        <div class="form-input-container">
          <label for="language">Language</label>
          <div class="input-wrapper">
            <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <select 
              v-model="language" 
              id="language"
              class="modern-input modern-select"
              required
              @focus="setActiveField('language')"
              @blur="setActiveField(null)"
              :class="{ 'input-focused': activeField === 'language' }"
            >
              <option value="" disabled>Select a language</option>
              <option value="jp">Japanese</option>
              <option value="eng">English</option>
              <option value="cha">Chinese</option>
            </select>
            <svg class="select-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>

      <div class="button-container">
        <button type="submit" class="submit-button" :disabled="isLoading">
          <span v-if="!isLoading">Sign Up</span>
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
    const displayName = ref('');
    const email = ref('');
    const password = ref('');
    const dateOfBirth = ref('');
    const language = ref('');
    
    // UI states
    const showPassword = ref(false);
    const activeField = ref(null);
    
    // Computed properties
    const isLoading = computed(() => store.getters['auth/isLoading']);
    const error = computed(() => store.getters['auth/authError']);
    
    // Get max date (user must be at least 13 years old)
    const maxDate = computed(() => {
      const today = new Date();
      today.setFullYear(today.getFullYear() - 13);
      return today.toISOString().split('T')[0];
    });

    // Methods
    const togglePassword = () => {
      showPassword.value = !showPassword.value;
    };
    
    const setActiveField = (field) => {
      activeField.value = field;
    };

    const handleSignup = async () => {
      await store.dispatch('auth/register', { 
        email: email.value, 
        password: password.value,
        displayName: displayName.value,
        dateOfBirth: dateOfBirth.value,
        language: language.value
      });
      
      if (store.getters['auth/isAuthenticated']) {
        await store.dispatch('user/setUserId');
        router.push('/themespace');
      }
    };

    return { 
      displayName,
      email, 
      password, 
      dateOfBirth,
      language,
      showPassword,
      activeField,
      maxDate,
      handleSignup, 
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

.submit-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff572d, #ff8060);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(253, 74, 29, 0.3);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 5px rgba(253, 74, 29, 0.2);
}

.submit-button:disabled {
  background: linear-gradient(135deg, #ccc, #e0e0e0);
  cursor: not-allowed;
  opacity: 0.7;
}


/* Responsive adjustments */

// Tablet and medium mobile (481px - 768px)
@media (max-width: 768px) and (min-width: 481px) {
  .signup-form {
    width: 95%;
    max-width: 450px;
    padding: 1.75rem;
  }
  
  .signup-form h1 {
    font-size: 1.625rem;
    margin-bottom: 1.75rem;
  }
  
  .form-group {
    gap: 1.125rem;
  }
}

// Standard mobile (376px - 480px)
@media (max-width: 480px) and (min-width: 376px) {
  .signup-form {
    width: 100%;
    padding: 1.5rem;
  }
  
  .signup-form h1 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .form-group {
    gap: 1rem;
  }
  
  .form-input-container label {
    font-size: 0.875rem;
    margin-bottom: 0.375rem;
  }
  
  .modern-input,
  .modern-select {
    font-size: 16px; /* Prevents zoom on iOS */
    padding: 0.8125rem 1rem 0.8125rem 2.75rem;
  }
  
  .input-icon {
    left: 0.875rem;
    width: 1.125rem;
    height: 1.125rem;
  }
  
  .password-toggle svg,
  .select-arrow {
    width: 1.125rem;
    height: 1.125rem;
  }
  
  .password-toggle {
    right: 0.875rem;
  }
  
  .select-arrow {
    right: 0.875rem;
  }
  
  .button-container {
    margin-top: 1.75rem;
  }
  
  .submit-button {
    padding: 0.9375rem;
    font-size: 1rem;
  }
  
  .error-message {
    font-size: 0.875rem;
    padding: 0.625rem 0.875rem;
  }
}

// Small mobile portrait (320px - 375px)
@media (max-width: 375px) {
  .signup-form {
    width: 100%;
    padding: 1.25rem 1rem;
  }
  
  .signup-form h1 {
    font-size: 1.375rem;
    margin-bottom: 1.25rem;
  }
  
  .form-group {
    gap: 0.875rem;
  }
  
  .form-input-container label {
    font-size: 0.8125rem;
    margin-bottom: 0.3125rem;
    font-weight: 500;
  }
  
  .modern-input,
  .modern-select {
    font-size: 16px; /* Prevents zoom on iOS */
    padding: 0.75rem 0.875rem 0.75rem 2.5rem;
    border-radius: 0.625rem;
  }
  
  .input-icon {
    left: 0.75rem;
    width: 1rem;
    height: 1rem;
  }
  
  .password-toggle svg,
  .select-arrow {
    width: 1rem;
    height: 1rem;
  }
  
  .password-toggle {
    right: 0.75rem;
    padding: 0.1875rem;
  }
  
  .select-arrow {
    right: 0.75rem;
  }
  
  .button-container {
    margin-top: 1.5rem;
  }
  
  .submit-button {
    padding: 0.875rem;
    font-size: 0.9375rem;
    border-radius: 0.625rem;
    min-height: 44px; /* Ensure touch target size */
  }
  
  .error-message {
    font-size: 0.8125rem;
    padding: 0.5625rem 0.75rem;
    margin-top: 0.875rem;
    
    svg {
      width: 1rem;
      height: 1rem;
    }
  }
  
  /* Optimize animations for small screens */
  .submit-button::before {
    display: none; /* Disable ripple on very small screens for performance */
  }
}

// Extra small devices (below 320px)
@media (max-width: 320px) {
  .signup-form {
    padding: 1rem 0.75rem;
  }
  
  .signup-form h1 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }
  
  .form-group {
    gap: 0.75rem;
  }
  
  .form-input-container label {
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
  }
  
  .modern-input,
  .modern-select {
    padding: 0.6875rem 0.75rem 0.6875rem 2.25rem;
    font-size: 16px;
    border-radius: 0.5rem;
  }
  
  .input-icon {
    left: 0.625rem;
    width: 0.9375rem;
    height: 0.9375rem;
  }
  
  .password-toggle svg,
  .select-arrow {
    width: 0.9375rem;
    height: 0.9375rem;
  }
  
  .password-toggle {
    right: 0.625rem;
  }
  
  .select-arrow {
    right: 0.625rem;
  }
  
  .button-container {
    margin-top: 1.25rem;
  }
  
  .submit-button {
    padding: 0.75rem;
    font-size: 0.875rem;
    font-weight: 500;
    min-height: 42px;
  }
  
  .error-message {
    font-size: 0.75rem;
    padding: 0.5rem 0.625rem;
  }
  
  /* Simplify focus states on very small screens */
  .modern-input:focus,
  .input-focused {
    box-shadow: 0 0 0 2px rgba(253, 74, 29, 0.1);
  }
}
</style>