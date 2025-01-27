<template>
  <div class="signup-form">
    <h1>新規登録</h1>
    <form @submit.prevent="handleSignup">
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
        <button type="submit" :disabled="isLoading">Sign Up</button>
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

    const handleSignup = async () => {
      await store.dispatch('auth/register', { 
        email: email.value, 
        password: password.value 
      });
      if (store.getters['auth/isAuthenticated']) {
        router.push('/themespace');
      }
    };

    return { email, password, handleSignup, isLoading, error };
  }
}
</script>
