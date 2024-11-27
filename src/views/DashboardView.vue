<template>
  <LoadingScreen v-model="isLoading" />

  <!-- header Menu -->
  <HeaderNav 
    :on-edit="isEditMode"
  />

  <div class="view-container">
    <!-- Page indicator - moved outside views-wrapper -->
    <div class="page-indicator">
      <PageIndicator 
        :is-app-view="isMindSpaceView"
        @view-switch="toggleView"
      />
    </div>
   
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
        <mindSpace/>
      </div>
    </div>

    <DockNav />
    
    <itemWindow 
      :is-open="showItemWindow"
      @close="closeItemWindow"
    />
    
  </div>
</template>

<script>
import { defineComponent, computed, ref, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router'; // Add this import at the top
import DockNav from '@/components/dockNav.vue';
import HeaderNav from '@/components/Header/HeaderNav.vue';
import Dashboard from '@/components/DashBoard/dashboard.vue';
import mindSpace from '@/components/DashBoard/mindSpace.vue';
import PageIndicator from '@/components/DashBoard/pageIndicator.vue';
import itemWindow from '@/components/ItemWindow/itemWindow.vue';
import LoadingScreen from '@/components/loadingScreen.vue';

export default defineComponent({
  name: 'DashboardView',
  components: {
    DockNav,
    Dashboard,
    mindSpace,
    PageIndicator,
    HeaderNav,
    itemWindow,
    LoadingScreen
  },
  setup() {
    const store = useStore();
    const userId = computed(() => store.getters['mindspace/getUserId']);
    const router = useRouter();
    const isLoading = computed(() => store.getters['mindspace/isLoading']);
    const isMindSpaceView = ref(true);
    const isDragging = ref(false);
    const startX = ref(0);
    const startY = ref(0);
    const currentX = ref(0);
    const currentY = ref(0);
    const deltaX = ref(0);
    const deltaY = ref(0);
    const isHorizontalDrag = ref(false);
    const isEditMode = computed(() => store.getters['mindspace/getIsEditMode']);
    const currentPage = computed(() => store.getters['mindspace/getCurrentPage']);
    const currentThemeId = computed(() => store.getters['mindspace/getThemeId']);
    const slidePosition = computed(() => {
      if (isDragging.value) {
        const delta = currentX.value - startX.value;
        const basePosition = isMindSpaceView.value ? 0 : -50; // Changed from -100 to -50
        const dragPosition = (delta / window.innerWidth) * 50; // Changed from 100 to 50
        return Math.max(-50, Math.min(0, basePosition + dragPosition));
      }
      return isMindSpaceView.value ? 0 : -50; // Changed from -100 to -50
    });

    watch(
      () => isEditMode.value,
      (newValue, oldValue) => {
        console.log('[DashboardView.vue] Edit mode changed:', { new: newValue, old: oldValue })
      },
      { immediate: true }
    )


    // Update toggleView:
    const toggleView = () => {
      isMindSpaceView.value = !isMindSpaceView.value;
      // Optional: Add a class to body to handle transitions
      document.body.classList.toggle('switching-view');
    };

    // Touch handling - SHIFT TO DASHBOARD OR MINDSPACE
    const handleTouchStart = (event) => {
      if (isEditMode.value) return;

      if (currentPage.value < 1 && !isEditMode.value){
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
      if (isEditMode.value) return;
      
      const minDis = 30;
      if (currentPage.value < 1 && !isEditMode.value){
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
      if (isEditMode.value) return;

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

    onMounted(async () => {
      try {
        // Make sure we have a userId first
        if (!userId.value) {
          await store.dispatch('mindspace/setUserId');
        }

        // If no theme is selected
        if (!currentThemeId.value) {
          const loadView = await store.dispatch('mindspace/loadViewThemeId');
          
          if (!loadView) {
            return router.push('/themespace');
          }
        }

        // Load pages if we have a theme
        await store.dispatch('mindspace/setMindSpacePages');
        toggleView();

      } catch (error) {
        console.error('Error in setup:', error);
        router.push('/themespace');
      }
    });

    return {
      isLoading,
      isMindSpaceView,
      toggleView,
      isDragging,
      slidePosition,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      isEditMode,
      closeItemWindow,
      showItemWindow
    };
  }
});
</script>

<style lang="scss">
@mixin responsive($breakpoint) {
  @if $breakpoint == iPhoneSE {
    @media (min-width: 200px) { @content; }
  } 
  @if $breakpoint == iPhonePro {
    @media (min-width: 390px) { @content; }
  } 
  @if $breakpoint == tablet {
    @media (min-width: 768px) { @content; }
  } @else if $breakpoint == desktop {
    @media (min-width: 1024px) { @content; }
  }
}

@import '../assets/dashboardStyle.scss';
@import '../assets/mindSpaceStyle.scss';
@import '../assets/todosStyle.scss';
@import '../assets/dockStyle.scss';
</style>