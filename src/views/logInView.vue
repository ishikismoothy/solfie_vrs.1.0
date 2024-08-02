<template>
  <div class="about">
    <signingUp v-if="!isAuthenticated && isSigningUp  && !isForgetPassword"/>
    <signingIn v-if="!isAuthenticated && !isSigningUp  && !isForgetPassword"/>
    <ForgotPassword v-if="!isAuthenticated && isForgetPassword" />

    <button v-if="!isAuthenticated && isSigningUp" @click="toggleSignUp">I have an account</button>
    <button v-if="!isAuthenticated && !isSigningUp" @click="toggleSignUp">Create a new account</button>

    <button v-if="!isAuthenticated && isSigningUp && !isForgetPassword" @click="toggleForgetPassword">Forgot Password</button>

    <LogoutButton v-if="isAuthenticated" />
  </div>
</template>

<script>
import signingIn from '@/components/signingIn.vue'
import signingUp from '@/components/signingUp.vue'
import LogoutButton from '@/components/logoutButton.vue'
import ForgotPassword from '@/components/ForgetPassword.vue'
import { computed, ref } from 'vue'
import { useStore } from 'vuex'

export default {
  components: {
    signingIn,
    signingUp,
    LogoutButton,
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
