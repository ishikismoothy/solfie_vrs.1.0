<template>
  <!-- header Menu -->

  <!-- Theme library -->
  <!-- Assign Theme Id -->
  <!-- set mindspace Id -->
  <Header />

  <div class="view-container">
    <!-- Page indicator - moved outside views-wrapper -->
    <PageIndicator 
      :is-app-view="isMindSpaceView"
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
        <Dashboard />
      </div>
      
      <!-- MindSpace view -->
      <div class="view mindspace-view">
        <mindSpace @edit-mode-change="handleEditModeChange"/>
      </div>
    </div>

    <ChatBox />
    <itemWindow 
      :is-open="showItemWindow"
      @close="closeItemWindow"
    />
  </div>
</template>

<script>
import { defineComponent, computed, ref, onMounted } from 'vue';
import ChatBox from '@/components/chatBox.vue';
import Header from '@/components/HeaderNav.vue';
import Dashboard from '@/components/dashboard.vue';
import { useStore } from 'vuex';
import mindSpace from '@/components/mindSpace.vue';
import PageIndicator from '@/components/pageIndicator.vue';
import itemWindow from '@/components/itemContentsWindow.vue';

export default defineComponent({
  name: 'DashboardView',
  components: {
    ChatBox,
    Dashboard,
    mindSpace,
    PageIndicator,
    Header,
    itemWindow
  },
  setup() {
    const store = useStore();
    const isMindSpaceView = ref(true);
    const isDragging = ref(false);
    const startX = ref(0);
    const startY = ref(0);
    const currentX = ref(0);
    const currentY = ref(0);
    const deltaX = ref(0);
    const deltaY = ref(0);
    const isHorizontalDrag = ref(false);
    const isEditing = ref(false);
    const currentPage = computed(() => store.getters['mindspace/getCurrentPage']);
    
    const slidePosition = computed(() => {
      if (isDragging.value) {
        const delta = currentX.value - startX.value;
        const basePosition = isMindSpaceView.value ? 0 : -50; // Changed from -100 to -50
        const dragPosition = (delta / window.innerWidth) * 50; // Changed from 100 to 50
        return Math.max(-50, Math.min(0, basePosition + dragPosition));
      }
      return isMindSpaceView.value ? 0 : -50; // Changed from -100 to -50
    });

    const handleEditModeChange = (value) => {
      isEditing.value = value;
      console.log("[DashboardView.vue]",isEditing.value);
    };


    // Update toggleView:
    const toggleView = () => {
      isMindSpaceView.value = !isMindSpaceView.value;
      // Optional: Add a class to body to handle transitions
      document.body.classList.toggle('switching-view');
    };

    // Touch handling - SHIFT TO DASHBOARD OR MINDSPACE
    const handleTouchStart = (event) => {
      if (isEditing.value) return;

      if (currentPage.value < 1 && !isEditing.value){
        console.log("[DashboardView.vue/handleTouchStart] start at: ",currentPage.value);
        startX.value = event.touches[0].clientX;
        startY.value = event.touches[0].clientY;
      }else if (currentPage.value >= 1){
        console.log("[DashboardView.vue/handleTouchStart] END, CurrentPage: ",currentPage.value);
        return;
      }else{
        return;
      }
    };

    const handleTouchMove = (event) => {
      if (isEditing.value) return;
      
      const minDis = 30;
      if (currentPage.value < 1 && !isEditing.value){
        currentX.value = event.touches[0].clientX;
        currentY.value = event.touches[0].clientY;
        deltaX.value = Math.abs(currentX.value - startX.value);
        deltaY.value = Math.abs(currentY.value - startY.value);
        if (deltaX.value > minDis || deltaY.value > minDis) {
          if (deltaX.value > deltaY.value){
            isDragging.value = true;
            console.log("[DashboardView.vue/handleTouchMove] Horizontal: ",isHorizontalDrag.value);
            event.preventDefault();
          }else{
            console.log("[DashboardView.vue/handleTouchMove] Vertical");
            return;
          }
        }
      }else if (currentPage.value >= 1){
        return;
      }else{
        return;
      }
    };

    const handleTouchEnd = () => {
      if (isEditing.value) return;

      if (isDragging.value) {
          const delta = currentX.value - startX.value;
          const threshold = window.innerWidth * 0.1; // Changed from 0.2 to 0.1

          if (Math.abs(delta) > threshold) {
            isMindSpaceView.value = delta > 0;
          }
          isDragging.value = false;
          console.log("[DashboardView.vue/handleTouchEnd] End at: ",currentPage.value);
      }else{
        return;
      }
    };

    //Item Window
    const showItemWindow = computed(() => store.getters['mindspace/getShowItemWindow']);
    const closeItemWindow = () => {
        store.dispatch('mindspace/triggerItemWindow', false);
    };

    onMounted(() => {
      store.dispatch('mindspace/setMindSpacePages');
    });

    return {
      isMindSpaceView,
      toggleView,
      isDragging,
      slidePosition,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      isEditing,
      handleEditModeChange,
      closeItemWindow,
      showItemWindow
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