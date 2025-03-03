<template>
  <div class="signIn-form">
    <h1>ログイン</h1>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <div class="form-input-container">
          <label for="email">Email:</label>
          <input v-model="email" type="email" id="email" placeholder="Email" required>
        </div>
        <div class="form-input-container">
          <label for="password">Password:</label>
          <input v-model="password" type="password" id="password" placeholder="Password" required>
        </div>
      </div>
      <div class="button-container">
        <button type="submit" :disabled="isLoading">Login</button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
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
    const email = ref('');
    const password = ref('');

    const isLoading = computed(() => store.getters['auth/isLoading']);
    const error = computed(() => store.getters['auth/authError']);

    const handleLogin = async () => {
      await store.dispatch('auth/login', { 
        email: email.value, 
        password: password.value 
      });
      if (store.getters['auth/isAuthenticated']) {
        await store.dispatch('user/setUserId');
        if(store.state.user.viewHistory.lastLocation != "mindspace") {
          router.push('/themespace');
        }else{
          router.push('/mindspace');
        }
      }
    };

    return { email, password, handleLogin, isLoading, error };
  }
}
</script>
