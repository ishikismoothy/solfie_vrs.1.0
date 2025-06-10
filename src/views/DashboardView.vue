<template>
  <LoadingScreen v-model="isLoading" />

  <!-- header Menu -->
  <HeaderNav/>

  <div class="view-container">
    <!-- Page indicator - moved outside views-wrapper -->
    <div
      class="page-indicator"
      :class="{ 'shifted': isNavVisible, 'hidden': isChatBoxExpanded }"
      :style="{ transform: `translateY(${indicatorPosition}px)` }"
      >
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
      @touchstart="handleTouchStart($event)"
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

    <!-- MindUniverse view -->
    <MindUniverse
      v-if = "showMindUniverseModal"
    />

    <!-- Sticky Doc -->
    <div
      ref="navRef"
      class="sticky-nav"
      :class="{
        'visible': isNavVisible,
        'expanded': isChatBoxExpanded,
        'transitioning': isTransitioning
      }"
      :style="{
        transform: `translateY(${navPosition}px)`,
        zIndex: navZindex

      }"
    >
      <DockNav />
    </div>


    <!-- Dock Button -->
    <button
      class="dock-button"
      :class="{ 'shifted': isNavVisible, 'hidden': isChatBoxExpanded }"
      :style="{ transform: `translateY(${buttonPosition}px)` }"
      @click="toggleNav"
    >
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 13.9021 3.5901 15.6665 4.59721 17.1199C4.70168 17.2707 4.7226 17.4653 4.64529 17.6317L3.42747 20.2519C3.23699 20.5853 3.47768 21 3.86159 21H12Z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <ItemWindow class="itemWindow-view"
      :is-open="showItemWindow"
      @close="closeItemWindow"
      @click.self="closeItemWindow"
    />
    <satSlider class="satWindow-view"
      :is-open="showSatWindow"
      @close="closeSatWindow"
      @click.self="closeSatWindow"
    />

    <MoveItemModal class="moveItemWindow-view"
      :is-open="showMoveItemWindow"
      :item-id="currentItemId || ''"
      :current-mind-space-id="currentMindSpaceId || ''"
      @close="closeMoveItemWindow"
      @click.self="closeMoveItemWindow"
      @item-moved="updateMindSpace"
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
import ItemWindow from '@/components/ItemWindow/itemWindow.vue';
import MoveItemModal from '@/components/ItemWindow/moveItemModal.vue';
import LoadingScreen from '@/components/loadingScreen.vue';
import satSlider from '@/components/DashBoard/satisfactionSlider.vue';
import MindUniverse from '@/components/Universe/widgetGallary.vue';
import { disableBodyScroll,  /*enableBodyScroll, /*clearAllBodyScrollLocks*/ } from 'body-scroll-lock';

export default defineComponent({
  name: 'DashboardView',
  components: {
    DockNav,
    Dashboard,
    mindSpace,
    PageIndicator,
    HeaderNav,
    ItemWindow,
    MoveItemModal,
    satSlider,
    LoadingScreen,
    MindUniverse
  },
  setup() {
    const store = useStore();
    const userId = computed(() => store.state.user.user.uid);
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
    const currentMindSpaceId = computed(() => store.state.mindspace.currentMindSpaceId);
    const currentItemId = computed(() => store.state.mindspace.currentItemId);
    const slidePosition = computed(() => {
      if (isDragging.value) {
        const delta = currentX.value - startX.value;
        const basePosition = isMindSpaceView.value ? 0 : -50; // Changed from -100 to -50
        const dragPosition = (delta / window.innerWidth) * 50; // Changed from 100 to 50
        return Math.max(-50, Math.min(0, basePosition + dragPosition));
      }
      return isMindSpaceView.value ? 0 : -50; // Changed from -100 to -50
    });
    const bodyElement = document.querySelector('body');

    //[MONITOR] MODAL AND EDIT TOGGLE
    const showMindUniverseModal = computed(() => store.state.user.modalControl.showMindUniverseWindow);
    watch(
      () => showMindUniverseModal.value, (newValue) => {
        console.log('[DashboardView.vue] showMindUniverseModal changed:', { new: newValue })
      }
    );

    // Update toggleView:
    const toggleView = () => {
      isMindSpaceView.value = !isMindSpaceView.value;
      // Optional: Add a class to body to handle transitions
      document.body.classList.toggle('switching-view');
    };

    // Touch handling - SHIFT TO DASHBOARD OR MINDSPACE
    const handleTouchStart = (event) => {
      if (isEditMode.value) return

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
    const showItemWindow = computed(() => store.state.user.modalControl.showItemWindow);
    const closeItemWindow = () => {
        store.dispatch('user/triggerItemWindow', false);
    };

    const showMoveItemWindow = computed(() => store.state.user.modalControl.showMoveItemWindow);
    const closeMoveItemWindow = () => {
        store.dispatch('user/triggerMoveItemWindow', false);
    };

    const showSatWindow = computed(() => store.state.user.modalControl.showSatWindow);
    const closeSatWindow = () => {
        store.dispatch('user/triggerSatWindow', false);
    };


    // Nav visibility state
    const isNavVisible = computed(() => store.state.user.dock.isVisible);
    const isChatBoxExpanded = computed(() => store.state.user.dock.isExpanded);
    const isTransitioning = ref(false);
    const navZindex = ref(700);
    const navPosition = ref(160);
    const indicatorPosition = ref(0);
    const buttonPosition = ref(0);
    const navRef = ref(null);

    const updateZIndex = () => {
      navZindex.value = isChatBoxExpanded.value ? 700 : 1000;
    };
    // Toggle nav visibility
    const toggleNav = async () => {
      const newValue = !isNavVisible.value;
      await store.dispatch('user/setDockVisibility', newValue);
      console.log("[DashboardView.vue] Trigger:", newValue ? "ON" : "OFF");
      updatePositions();
      updateZIndex();
    };



    // Update positions based on nav visibility
    const updatePositions = () => {
      const navHeight = 180;
      if (isNavVisible.value) {
        navPosition.value = 0;
        indicatorPosition.value = -navHeight;
        buttonPosition.value = -navHeight;
      } else {
        navPosition.value = navHeight;
        indicatorPosition.value = 0;
        buttonPosition.value = 0;
      }
    };

    // Watch for edit mode changes to hide nav
    watch(() => isEditMode.value, (newValue) => {
      if (newValue) {
        store.dispatch('user/setDockVisibility', false);
        updatePositions();
      }
    });

    // Add watch for isNavVisible to handle state changes
    watch(isNavVisible, () => {
      updatePositions();
    });

    watch(isChatBoxExpanded, (newValue) => {
      console.log('[DashboardView.vue] ChatBox Expanded changed:', newValue);
      if (newValue) {
        // When expanding
        isTransitioning.value=true;
        //navRef.value.classList.add('transitioning');
        setTimeout(() => {
          isTransitioning.value=false;
          //navRef.value.classList.remove('transitioning');
        }, 1000);
      } else {
        // When collapsing
        isTransitioning.value=true;
        //navRef.value.classList.add('transitioning');
        setTimeout(() => {
          //navRef.value.classList.remove('transitioning');
          isTransitioning.value=false;
        }, 1000);
      }
      // Force a style update if needed
      updatePositions();
    });

    onMounted(async () => {
      //console.log("[DashboardView.vue]access store state: ",isNavVisible);
      const dashboardView = document.querySelector('.view.dashboard-view');
      const itemWindowView = document.querySelector('.itemWindow-view');

      disableBodyScroll(bodyElement, {
        allowTouchMove: (el) => {
          return dashboardView.contains(el) || itemWindowView.contains(el);
        }
      });

      // IF USER ACCESS TO DASHBOARD STRAIGHT.
      try {
        // Make sure we have a userId first
        if (!userId.value) {
          await store.dispatch('user/setUserId');
          console.log("[DashboardView.vue]",userId.value);
        }

        // If no theme is selected
        if (!currentThemeId.value) {
          const loadView = await store.dispatch('mindspace/loadViewThemeId',store.state.user.user.uid);

          if (!loadView) {
            return router.push('/themespace');
          }
        }

        // Load pages if we have a theme
        await store.dispatch('mindspace/setMindSpace');
        //toggleView();

      } catch (error) {
        console.error('Error in setup:', error);
        router.push('/themespace');
      }finally{
        await store.dispatch('user/setLastViewLocationHistory', {lastLocation:"mindspace"});
        store.dispatch('themeSpace/setThemeId', currentThemeId.value);
        await store.dispatch('themeSpace/getSelfAssessment');
        await store.dispatch('scores/fetchSatisfactionData',currentThemeId.value);
      }
    });


    const updateMindSpace = async () => {
      await store.dispatch('mindspace/setMindSpacePages');
    };

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

      currentMindSpaceId,
      currentItemId,

      showItemWindow,
      closeItemWindow,
      showMoveItemWindow,
      closeMoveItemWindow,
      showSatWindow,
      closeSatWindow,
      updateMindSpace,

      //Dock visibility Handlings
      navRef,
      isNavVisible,
      isChatBoxExpanded,
      isTransitioning,
      navZindex,
      navPosition,
      indicatorPosition,
      buttonPosition,
      toggleNav,

      //Dock Menu visibility Handlings
      showMindUniverseModal,
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
@import '../assets/deleteButtonStyle.scss';
@import '../assets/widgetStyle.scss';
@import '../assets/satisfactionDataViewStyle.scss';
@import '../assets/todosStyle.scss';
@import '../assets/dockStyle.scss';
</style>
