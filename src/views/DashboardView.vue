<template>
  <div>
  <Header />

  <Dashboard />

  <ChatBox />
  </div>
</template>

<script>
  import { defineComponent } from 'vue';
  import ChatBox from '@/components/chatBox.vue';
  import Header from '@/components/header.vue';
  import Dashboard from '@/components/dashboard.vue';

  export default defineComponent({
    name: 'DashboardView',
    components: {
      ChatBox,
      Header,
      Dashboard,
    },

  });
</script>
