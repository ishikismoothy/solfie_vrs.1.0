<template>
  <div class="login-view-wrapper" :class="{ 'dark-mode': isDarkMode }">
    <div class="logo-section">
      <div class="logo-content">
        <svg class="logo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
        <h1>Solfie</h1>
      </div>
      
      <!-- Optional: Dark mode toggle button for manual override -->
      <button 
        v-if="showDarkModeToggle" 
        @click="toggleDarkMode"
        class="dark-mode-toggle"
        :title="darkModeInfo"
      >
        <svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      </button>
    </div>
    
    <div class="auth-container">
      <transition name="form-switch" mode="out-in">
        <signingUp 
          v-if="!isAuthenticated && isSigningUp && !isForgetPassword"
          key="signup"
        />
        <signingIn 
          v-else-if="!isAuthenticated && !isSigningUp && !isForgetPassword"
          key="signin"
        />
        <ForgotPassword 
          v-else-if="!isAuthenticated && isForgetPassword"
          key="forgot"
        />
      </transition>
      
      <div class="auth-btn-container" v-if="!isAuthenticated">
        <transition name="fade-slide" mode="out-in">
          <div v-if="!isForgetPassword" class="auth-buttons" key="auth-buttons">
            <button 
              v-if="isSigningUp" 
              @click="toggleSignUp"
              class="auth-toggle-btn primary-variant"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              I have an account
            </button>
            
            <button 
              v-else
              @click="toggleSignUp"
              class="auth-toggle-btn primary-variant"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
              Create a new account
            </button>
            
            <div class="divider">
              <span>or</span>
            </div>
            
            <button 
              @click="toggleForgetPassword"
              class="auth-toggle-btn secondary-variant"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              Forgot Password?
            </button>
          </div>
          
          <div v-else class="auth-buttons" key="back-button">
            <button 
              @click="goBack"
              class="auth-toggle-btn back-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to Sign In
            </button>
          </div>
        </transition>
      </div>
      
      <logoutButton v-if="isAuthenticated" />
    </div>
    
    <!-- Background decoration -->
    <div class="background-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>
  </div>
</template>

<script>
import signingIn from '@/components/signingIn.vue'
import signingUp from '@/components/signingUp.vue'
import logoutButton from '@/components/logoutButton.vue'
import ForgotPassword from '@/components/ForgetPassword.vue'
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'

// Import the seasonal dark mode utility
import { createDarkModeManager, getDarkModeInfo } from '@/utility/seasonalDarkMode'

export default {
  components: {
    signingIn,
    signingUp,
    logoutButton,
    ForgotPassword,
  },
  
  setup() {
    const store = useStore();
    
    // Authentication state
    const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);
    const isSigningUp = ref(false);
    const isForgetPassword = ref(false);
    
    // Dark mode state
    const isDarkMode = ref(false);
    const showDarkModeToggle = ref(true); // Set to false to hide manual toggle
    const darkModeInfo = ref('');
    
    // Create dark mode manager
    const darkModeManager = createDarkModeManager((newState) => {
      isDarkMode.value = newState;
      updateDarkModeInfo();
    });
    
    // Update dark mode info for tooltip
    const updateDarkModeInfo = () => {
      if (process.env.NODE_ENV === 'development') {
        const info = darkModeManager.getInfo();
        darkModeInfo.value = `Dark: ${info.darkStart}–${info.darkEnd} | Now: ${info.currentTime}`;
      }
    };
    
    // Toggle dark mode manually
    const toggleDarkMode = () => {
      darkModeManager.toggle();
    };
    
    // Form navigation methods
    const toggleSignUp = () => {
      isSigningUp.value = !isSigningUp.value;
      isForgetPassword.value = false;
    };

    const toggleForgetPassword = () => {
      isForgetPassword.value = !isForgetPassword.value;
      isSigningUp.value = false;
    };
    
    const goBack = () => {
      isForgetPassword.value = false;
      isSigningUp.value = false;
    };
    
    // Lifecycle hooks
    onMounted(() => {
      darkModeManager.start();
      console.log(getDarkModeInfo())
    });
    
    onUnmounted(() => {
      darkModeManager.stop();
    });

    return {
      // Authentication
      isAuthenticated,
      isSigningUp,
      isForgetPassword,
      toggleSignUp,
      toggleForgetPassword,
      goBack,
      
      // Dark mode
      isDarkMode,
      showDarkModeToggle,
      darkModeInfo,
      toggleDarkMode,
    };
  }
}
</script>

<style lang="scss" scoped>
@import '../assets/loginViewStyle.scss';

// Wrapper and layout
.login-view-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  //background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background: linear-gradient(135deg, #ffeef8 0%, #ffe0f0 50%, #fef0e6 100%);
  position: relative;
  overflow: hidden;
}

// Enhanced logo section
.logo-section {
  margin-bottom: 2.5rem;
  animation: fadeInDown 0.8s ease-out;
  
  .logo-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    
    .logo-icon {
      width: 2.5rem;
      height: 2.5rem;
      color: $primary-color;
      animation: rotate 20s linear infinite;
    }
    
    h1 {
      font-size: 2.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, $primary-color, $primary-hover);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.5px;
    }
  }
}

// Auth container with card effect
.auth-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 1.5rem;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  position: relative;
  z-index: 1;
}

// Enhanced button container
.auth-btn-container {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba($border-color, 0.5);
  
  .auth-buttons {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .auth-toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 0.875rem 1.5rem;
    border: none;
    border-radius: 0.75rem;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    
    svg {
      width: 1.25rem;
      height: 1.25rem;
    }
    
    // Primary variant
    &.primary-variant {
      background: linear-gradient(135deg, $primary-color, $primary-hover);
      color: white;
      
      &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: translate(-50%, -50%);
        transition: width 0.6s ease, height 0.6s ease;
      }
      
      &:hover::before {
        width: 300px;
        height: 300px;
      }
      
      @media (hover: hover) {
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba($primary-color, 0.3);
        }
      }
      
      &:active {
        transform: translateY(0);
      }
    }
    
    // Secondary variant
    &.secondary-variant {
      background: $background-button;
      color: $text-secondary;
      
      @media (hover: hover) {
        &:hover {
          background: darken($background-button, 5%);
          transform: translateY(-1px);
        }
      }
      
      &:active {
        background: darken($background-button, 10%);
        transform: translateY(0);
      }
    }
    
    // Back button
    &.back-btn {
      background: transparent;
      color: $text-secondary;
      border: 2px solid $border-color;
      
      @media (hover: hover) {
        &:hover {
          background: $background-light;
          border-color: $primary-color;
          color: $primary-color;
          
          svg {
            animation: slideLeft 0.3s ease;
          }
        }
      }
    }
  }
  
  .divider {
    display: flex;
    align-items: center;
    margin: 0.5rem 0;
    
    &::before,
    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: $border-color;
    }
    
    span {
      padding: 0 1rem;
      color: $text-muted;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }
}

// Background decoration
.background-decoration {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: hidden;
  
  .circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.1;
    
    &.circle-1 {
      width: 300px;
      height: 300px;
      background: linear-gradient(135deg, $primary-color, $primary-hover);
      top: -150px;
      right: -150px;
      animation: float 15s ease-in-out infinite;
    }
    
    &.circle-2 {
      width: 200px;
      height: 200px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      bottom: -100px;
      left: -100px;
      animation: float 20s ease-in-out infinite reverse;
    }
    
    &.circle-3 {
      width: 150px;
      height: 150px;
      background: linear-gradient(135deg, #f093fb, #f5576c);
      top: 50%;
      right: -75px;
      animation: float 25s ease-in-out infinite;
    }
  }
}

// Animations
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(-20px, -30px);
  }
  50% {
    transform: translate(20px, -20px);
  }
  75% {
    transform: translate(-15px, 20px);
  }
}

@keyframes slideLeft {
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-3px);
  }
  100% {
    transform: translateX(0);
  }
}

// Transitions
.form-switch-enter-active,
.form-switch-leave-active {
  transition: all 0.4s ease;
}

.form-switch-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.form-switch-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

// Responsive design

// Tablet and medium mobile devices (481px - 768px)
@media (max-width: 768px) and (min-width: 481px) {
  .login-view-wrapper {
    padding: 1.5rem;
  }
  
  .logo-section {
    margin-bottom: 2rem;
    
    .logo-content {
      .logo-icon {
        width: 2.25rem;
        height: 2.25rem;
      }
      
      h1 {
        font-size: 2.25rem;
      }
    }
  }
  
  .auth-container {
    padding: 1.75rem;
    border-radius: 1.25rem;
    width: 80%;
    max-width: 450px;
  }
  
  .auth-btn-container {
    margin-top: 1.75rem;
    
    .auth-toggle-btn {
      padding: 0.875rem 1.25rem;
      font-size: 0.95rem;
    }
  }
}

// Standard mobile devices (376px - 480px)
@media (max-width: 480px) and (min-width: 376px) {
  .login-view-wrapper {
    padding: 1rem;
    min-height: 100vh;
    min-height: 100dvh; // Dynamic viewport height for mobile browsers
  }
  
  .logo-section {
    margin-bottom: 1.5rem;
    
    .logo-content {
      gap: 0.625rem;
      
      .logo-icon {
        width: 2rem;
        height: 2rem;
      }
      
      h1 {
        font-size: 2rem;
      }
    }
  }
  
  .auth-container {
    padding: 1.5rem;
    border-radius: 1rem;
    width: 80%;
    max-width: none;
    margin: 0 auto;
  }
  
  .auth-btn-container {
    margin-top: 1.5rem;
    padding-top: 1.25rem;
    
    .auth-buttons {
      gap: 0.875rem;
    }
    
    .auth-toggle-btn {
      padding: 0.8125rem 1.125rem;
      font-size: 0.925rem;
      
      svg {
        width: 1.125rem;
        height: 1.125rem;
      }
    }
    
    .divider {
      margin: 0.375rem 0;
      
      span {
        padding: 0 0.75rem;
        font-size: 0.8rem;
      }
    }
  }
  
  .background-decoration {
    .circle {
      &.circle-1 {
        width: 180px;
        height: 180px;
        top: -90px;
        right: -90px;
      }
      
      &.circle-2 {
        width: 140px;
        height: 140px;
        bottom: -70px;
        left: -70px;
      }
      
      &.circle-3 {
        width: 100px;
        height: 100px;
        right: -50px;
      }
    }
  }
}

// Small mobile devices - Portrait (320px - 375px)
@media (max-width: 375px) {
  .login-view-wrapper {
    padding: 0.75rem;
    min-height: 100vh;
    min-height: 100dvh; // Dynamic viewport height for mobile browsers
    background: linear-gradient(135deg, #ffeef8 0%, #ffe0f0 100%); // Simplified gradient
  }
  
  .logo-section {
    margin-bottom: 1.25rem;
    
    .logo-content {
      gap: 0.5rem;
      
      .logo-icon {
        width: 1.75rem;
        height: 1.75rem;
      }
      
      h1 {
        font-size: 1.75rem;
        letter-spacing: -0.25px;
      }
    }
  }
  
  .auth-container {
    padding: 1.25rem 1rem;
    border-radius: 0.875rem;
    width: 85%;
    max-width: none;
    box-shadow: 
      0 10px 30px rgba(0, 0, 0, 0.08),
      0 0 0 1px rgba(255, 255, 255, 0.5);
  }
  
  .auth-btn-container {
    margin-top: 1.25rem;
    padding-top: 1rem;
    
    .auth-buttons {
      gap: 0.75rem;
    }
    
    .auth-toggle-btn {
      padding: 0.75rem 1rem;
      font-size: 0.9rem;
      gap: 0.625rem;
      
      svg {
        width: 1rem;
        height: 1rem;
      }
      
      // Ensure minimum touch target size (44px)
      min-height: 44px;
    }
    
    .divider {
      margin: 0.25rem 0;
      
      span {
        padding: 0 0.625rem;
        font-size: 0.75rem;
      }
    }
  }
  
  .background-decoration {
    .circle {
      opacity: 0.05; // More subtle on small screens
      
      &.circle-1 {
        width: 150px;
        height: 150px;
        top: -75px;
        right: -75px;
      }
      
      &.circle-2 {
        width: 120px;
        height: 120px;
        bottom: -60px;
        left: -60px;
      }
      
      &.circle-3 {
        display: none; // Hide third circle on very small screens
      }
    }
  }
}

// Extra small devices - Very small phones (below 320px)
@media (max-width: 320px) {
  .login-view-wrapper {
    padding: 0.5rem;
  }
  
  .logo-section {
    margin-bottom: 1rem;
    
    .logo-content {
      gap: 0.375rem;
      
      .logo-icon {
        width: 1.5rem;
        height: 1.5rem;
      }
      
      h1 {
        font-size: 1.5rem;
      }
    }
  }
  
  .auth-container {
    padding: 1rem 0.75rem;
    border-radius: 0.75rem;
  }
  
  .auth-btn-container {
    margin-top: 1rem;
    padding-top: 0.875rem;
    
    .auth-buttons {
      gap: 0.625rem;
    }
    
    .auth-toggle-btn {
      padding: 0.6875rem 0.875rem;
      font-size: 0.875rem;
      gap: 0.5rem;
      min-height: 42px;
      
      svg {
        width: 0.9375rem;
        height: 0.9375rem;
      }
    }
  }
  
  .background-decoration {
    display: none; // Hide decorations on very small screens for performance
  }
}

// Dark mode toggle button (optional)
.dark-mode-toggle {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: $primary-color;
  }
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

.dark-mode {
  &.login-view-wrapper {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  }
  
  .logo-content {
    .logo-icon {
      color: #ffffff;
    }
    
    h1 {
      background: linear-gradient(135deg, #ffffff, #ffffff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }
  
  .auth-container {
    background: rgba(30, 30, 30, 0.95);
    box-shadow: 
      0 20px 60px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.1);
  }
  
  .auth-btn-container {
    border-top-color: rgba(255, 255, 255, 0.1);
    
    .auth-toggle-btn {
      &.primary-variant {
        background: linear-gradient(135deg, #ffffff, #ffffff);
        color: #1a1a2e;
        
        &:hover {
          box-shadow: 0 8px 20px rgba(224, 224, 224, 0.3);
        }
      }
      
      &.secondary-variant {
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);
        
        &:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffd700;
        }
      }
      
      &.back-btn {
        color: rgba(255, 255, 255, 0.7);
        border-color: rgba(255, 255, 255, 0.2);
        
        &:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: #ffd700;
          color: #ffd700;
        }
      }
    }
    
    .divider {
      &::before,
      &::after {
        background: rgba(255, 255, 255, 0.1);
      }
      
      span {
        color: rgba(255, 255, 255, 0.5);
      }
    }
  }
  
  .background-decoration {
    .circle {
      opacity: 0.05;
    }
  }
  
  // Dark mode toggle button in dark mode
  .dark-mode-toggle {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    
    svg {
      color: #ffd700;
    }
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

// Keep the system preference as a fallback
@media (prefers-color-scheme: dark) {
  // This will only apply if the user hasn't manually toggled
  body:not(.dark-mode-override) {
    .login-view-wrapper {
      //background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    }
    
    .auth-container {
      //background: rgba(30, 30, 30, 0.95);
      box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.1);
    }
  }
}
</style>