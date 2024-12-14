<template>
  <div class="logo-section">
    <h1>Solfie</h1>     
  </div>
  <div class="auth-container">
    <signingUp v-if="!isAuthenticated && isSigningUp  && !isForgetPassword"/>
    <signingIn v-if="!isAuthenticated && !isSigningUp  && !isForgetPassword"/>
    <ForgotPassword v-if="!isAuthenticated && isForgetPassword" />
    <div class="auth-btn-container">
      <button v-if="!isAuthenticated && isSigningUp" @click="toggleSignUp">I have an account</button>
      <button v-if="!isAuthenticated && !isSigningUp" @click="toggleSignUp">Create a new account</button>
      <button v-if="!isAuthenticated && isSigningUp && !isForgetPassword" @click="toggleForgetPassword">Forgot Password</button>
    </div>
    <logoutButton v-if="isAuthenticated" />
  </div>
</template>

<script>
import signingIn from '@/components/signingIn.vue'
import signingUp from '@/components/signingUp.vue'
import logoutButton from '@/components/logoutButton.vue'
import ForgotPassword from '@/components/ForgetPassword.vue'
import { computed, ref } from 'vue'
import { useStore } from 'vuex'

export default {
  components: {
    signingIn,
    signingUp,
    logoutButton,
    ForgotPassword,
  },
  setup() {
    const store = useStore();
    const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);
    const isSigningUp = ref(false);
    const isForgetPassword = ref(false);

    const toggleSignUp = () => {
      isSigningUp.value = !isSigningUp.value;
      isForgetPassword.value = false;  // Always set isForgetPassword to false when toggling signup
    };

    const toggleForgetPassword = () => {
      isForgetPassword.value = !isForgetPassword.value;
      isSigningUp.value = false;  // Always set isSigningUp to false when toggling forget password
    };

    return {
      isAuthenticated,
      isSigningUp,
      isForgetPassword,  // This line was missing before
      toggleSignUp,
      toggleForgetPassword,
    };
  }
}
</script>

<style>
@import '../assets/loginViewStyle.scss';
</style>