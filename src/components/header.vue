<template>
  <header>
    <div class="user-info">
      <span class="avatar"></span>
      <span class="user-name">{{ user.name }}</span>
    </div>
    <div class="plan-type">Plan Type: {{ user.planType }}</div>
    <div class="notifications">
      <span class="bell-icon"></span>
      <span class="notification-count">{{ user.notifications }}</span>
      <LogoutButton/>
    </div>
  </header>
</template>

<script>
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';
import LogoutButton from '@/components/logoutButton.vue';

export default defineComponent({
  name: 'HeaderComponent',
  components: {
    LogoutButton,
  },

  setup() {
    const store = useStore();
    const user = computed(() => store.state.user.user || {});

    return {
      user,
    };
  },
});
</script>
