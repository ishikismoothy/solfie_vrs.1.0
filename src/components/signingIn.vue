<template>
  <div class="signIn-form">
    <h1>ログイン</h1>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="email">Email:</label>
        <input v-model="email" type="email" id="email" placeholder="Email" required>
        <label for="password">Password:</label>
        <input v-model="password" type="password" id="password" placeholder="Password" required>
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
        router.push('/dashboard');
      }
    };

    return { email, password, handleLogin, isLoading, error };
  }
}
</script>

<style scoped>
.signIn-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  margin-top: 5px;
}

input {
  width: 100%;
  padding: 8px;
  font-size: 16px;
}

.button-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

button {
  width: auto;
  min-width: 200px;
  padding: 10px 20px;
  font-size: 16px;
  background-color: #fd4a1d;
  color: white;
  border: none;
  cursor: pointer;
}

button:hover {
  background-color: #ff572d;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error {
  color: red;
  margin-top: 10px;
  text-align: center;
}
</style>