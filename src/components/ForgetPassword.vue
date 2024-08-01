<template>
  <div class="forgot-password">
    <h2>Forgot Password</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="email">Email:</label>
        <input
          type="email"
          id="email"
          v-model="email"
          required
          placeholder="Enter your email"
        >
      </div>
      <div class="button-container">
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Sending...' : 'Reset Password' }}
        </button>
      </div>
    </form>
    <p v-if="message" :class="{ 'error-message': isError, 'success-message': !isError }">
      {{ message }}
    </p>
  </div>
</template>

<script>
import { ref } from 'vue';
import { resetPassword } from '@/firebase/firebaseAuth'; // Adjust the import path as needed

export default {
  name: 'ForgotPassword',
  setup() {
    const email = ref('');
    const isLoading = ref(false);
    const message = ref('');
    const isError = ref(false);

    const handleSubmit = async () => {
      isLoading.value = true;
      message.value = '';
      isError.value = false;

      try {
        await resetPassword(email.value);
        message.value = 'Password reset email sent. Please check your inbox.';
        email.value = ''; // Clear the email input
      } catch (error) {
        console.error('Error sending password reset email:', error);
        message.value = 'Failed to send password reset email. Please try again.';
        isError.value = true;
      } finally {
        isLoading.value = false;
      }
    };

    return {
      email,
      isLoading,
      message,
      isError,
      handleSubmit,
    };
  },
};
</script>

<style scoped>
.forgot-password {
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
  min-width: 120px;
  padding: 10px 20px;
  font-size: 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  color: red;
  margin-top: 10px;
  text-align: center;
}

.success-message {
  color: green;
  margin-top: 10px;
  text-align: center;
}
</style>