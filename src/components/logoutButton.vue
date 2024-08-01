<template>
  <button @click="handleLogout" :disabled="isLoading">
    {{ isLoading ? 'Logging out...' : 'Log out' }}
  </button>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'LogoutButton',
  setup() {
    const store = useStore();
    const router = useRouter();

    const isLoading = computed(() => store.getters['auth/isLoading']);

    const handleLogout = async () => {
      await store.dispatch('auth/logout');
      if (!store.getters['auth/isAuthenticated']) {
        router.push('/login');
      }
    };

    return {
      isLoading,
      handleLogout
    };
  }
}
</script>