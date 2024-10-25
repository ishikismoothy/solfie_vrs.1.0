<template>
  <div class="view-container">
    <!-- Page indicator - moved outside views-wrapper -->
    <PageIndicator 
      :is-app-view="isAppView"
      @page-selected="handlePageSelect"
      @view-switch="toggleView"
    />
    <!-- Container for sliding views -->
    <div 
      class="views-wrapper"
      :style="{ 
        transform: `translateX(${slidePosition}%)`, 
        transition: isDragging ? 'none' : 'transform 0.5s ease'
        }"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    >
      <!-- Dashboard view -->
      <div class="view dashboard-view">
        <Header />
        <Dashboard />
      </div>
      
      <!-- MindSpace view -->
      <div class="view mindspace-view">
        <mindSpace />
      </div>
    </div>

    <ChatBox />
  </div>
</template>

<script>
import { defineComponent, computed, ref, onMounted } from 'vue';
import ChatBox from '@/components/chatBox.vue';
import Header from '@/components/header.vue';
import Dashboard from '@/components/dashboard.vue';
import { useStore } from 'vuex';
import mindSpace from '@/components/mindSpace.vue';
import PageIndicator from '@/components/pageIndicator.vue';

export default defineComponent({
  name: 'DashboardView',
  components: {
    ChatBox,
    Dashboard,
    mindSpace,
    PageIndicator,
    Header
  },
  setup() {
    const store = useStore();
    const isAppView = ref(true);
    const isDragging = ref(false);
    const startX = ref(0);
    const currentX = ref(0);
    
    const slidePosition = computed(() => {
      if (isDragging.value) {
        const delta = currentX.value - startX.value;
        const basePosition = isAppView.value ? 0 : -50; // Changed from -100 to -50
        const dragPosition = (delta / window.innerWidth) * 50; // Changed from 100 to 50
        return Math.max(-50, Math.min(0, basePosition + dragPosition));
      }
      return isAppView.value ? 0 : -50; // Changed from -100 to -50
    });


    // Update toggleView:
    const toggleView = () => {
      isAppView.value = !isAppView.value;
      // Optional: Add a class to body to handle transitions
      document.body.classList.toggle('switching-view');
    };

    // Touch handling
    const handleTouchStart = (event) => {
      isDragging.value = true;
      startX.value = event.touches[0].clientX;
      currentX.value = startX.value;
    };

    const handleTouchMove = (event) => {
      if (isDragging.value) {
        currentX.value = event.touches[0].clientX;
        // Prevent default to stop scrolling
        event.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (isDragging.value) {
        const delta = currentX.value - startX.value;
        const threshold = window.innerWidth * 0.1; // Changed from 0.2 to 0.1

        if (Math.abs(delta) > threshold) {
          isAppView.value = delta > 0;
        }

        isDragging.value = false;
      }
    };

    onMounted(() => {
      store.dispatch('mindspace/setAppPages');
    });

    return {
      isAppView,
      toggleView,
      isDragging,
      slidePosition,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd
    };
  }
});
</script>

<style lang="scss">
@import '../assets/dashboardStyle.scss';
@import '../assets/mindSpaceStyle.scss';
@import '../assets/todosStyle.scss';
@import '../assets/layerStyle.scss';
</style>