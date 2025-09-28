<!-- views/DashboardView.vue -->
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
      <div class="view mindspace-view" 
        :style="containerStyle"
        :class="{ 'scroll-disabled': isMindSpaceView }">
        <mindSpace />
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

    <!-- Unified Item Window overlay -->
    <Teleport to="body">
      <div
        v-if="showAnyItemWindow"
        class="item-window-overlay"
        @click="closeAnyItemWindow"
      />
    </Teleport>

    <!-- Unified Item Window -->
    <Teleport to="body">
      <ItemWindow
        v-if="showAnyItemWindow && unifiedItemWindowProps"
        v-bind="unifiedItemWindowProps"
        :items="mindspaceItems"
        @close="closeAnyItemWindow"
        @refresh-items="fetchMindspaceItems"
        class="unified-item-window"
      />
    </Teleport>

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
import { defineComponent, computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
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
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';
import emitter from '@/eventBus'
import backgroundImage from '@/assets/bg_img.jpg';

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
    MindUniverse,
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
        const basePosition = isMindSpaceView.value ? 0 : -50;
        const dragPosition = (delta / window.innerWidth) * 50;
        return Math.max(-50, Math.min(0, basePosition + dragPosition));
      }
      return isMindSpaceView.value ? 0 : -50;
    });
    const bodyElement = document.querySelector('body');
    const selectedItemId = computed(() => store.getters['mindspace/getItemId']);

    // Unified item window state
    const currentItemWindowConfig = ref(null);

    // Use Vuex store for items
    const mindspaceItems = computed(() => store.getters['user/getItems'])

    //[BACKGROUND]
    const background = ref({
      type: 'image',
      value1: '#f0f0f0',
      value2: backgroundImage
    });
  
    const containerStyle = computed(() => {
      if (background.value.type === 'color') {
        return { backgroundColor: background.value.value1 };
      } else {
        return { backgroundImage: `url(${background.value.value2})` };
      }
    });
    
    // Fetch items using Vuex store
    const fetchMindspaceItems = async () => {
      if (!userId.value) {
        console.log('Waiting for user ID...')
        return
      }
      await store.dispatch('user/fetchItems', userId.value)
    }

    // Updated getItemImage function
    const getItemImage = (itemId) => {
      return store.getters['user/getItemImage'](itemId)
    }

    // Updated getItemName function
    const getItemName = (itemId) => {
      return store.getters['user/getItemName'](itemId)
    }

    // Unified window controls
    const showAnyItemWindow = computed(() => {
      return store.state.user.modalControl.showItemWindow || !!currentItemWindowConfig.value
    })

    const unifiedItemWindowProps = computed(() => {
      // Priority: mindslot config over mind grid config
      if (currentItemWindowConfig.value) {
        return currentItemWindowConfig.value
      }

      // Fallback to mind grid item window
      if (store.state.user.modalControl.showItemWindow && selectedItemId.value) {
        return {
          mindslot: {
            name: store.getters['mindspace/getItemName'] || 'Unnamed Item',
            item: selectedItemId.value
          },
          index: 0,
          getItemImage,
          getItemName,
          fromMindGrid: true,
          expanded: true,
          initialFlipped: false,
          openedFromMindslot: false,
          directIconIndex: -1,
          expandedSlotIndex: null
        }
      }

      return null
    })

    const closeAnyItemWindow = () => {
      // Reset edit mode when closing itemwindow via clickaway
      store.dispatch('user/setIsBlockEdit', false)
      // Clear mindslot window config
      currentItemWindowConfig.value = null
      // Clear mind grid window
      store.dispatch('user/triggerItemWindow', false)
    }

    // Handle mindslot item window requests
    const handleMindslotItemWindow = (config) => {
      console.log('🎯 Unified: Opening mindslot item window with config:', config)
      // Close any existing mind grid window
      store.dispatch('user/triggerItemWindow', false)
      // Set mindslot config
      currentItemWindowConfig.value = {
        ...config,
        getItemImage,
        getItemName,
        fromMindGrid: false
      }
    }

    // Handle close requests from mindslot
    const handleCloseUnifiedItemWindow = () => {
      console.log('🎯 Unified: Closing item window from mindslot')
      closeAnyItemWindow()
    }

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
          const threshold = window.innerWidth * 0.1;

          if (Math.abs(delta) > threshold) {
            isMindSpaceView.value = delta > 0;
          }
          isDragging.value = false;
          console.log("[DashboardView.vue/handleTouchEnd] End at: ",currentPage.value);
      }else{
        return;
      }
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

    const toggleNav = async () => {
      const newValue = !isNavVisible.value;
      await store.dispatch('user/setDockVisibility', newValue);
      console.log("[DashboardView.vue] Trigger:", newValue ? "ON" : "OFF");
      updatePositions();
      updateZIndex();
    };

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

    const updateMindSpace = async () => {
      await store.dispatch('mindspace/setMindSpacePages');
    };

    // Watch for edit mode changes to hide nav
    watch(() => isEditMode.value, (newValue) => {
      if (newValue) {
        store.dispatch('user/setDockVisibility', false);
        updatePositions();
      }
    });

    watch(isNavVisible, () => {
      updatePositions();
    });

    watch(isChatBoxExpanded, (newValue) => {
      console.log('[DashboardView.vue] ChatBox Expanded changed:', newValue);
      if (newValue) {
        isTransitioning.value=true;
        setTimeout(() => {
          isTransitioning.value=false;
        }, 1000);
      } else {
        isTransitioning.value=true;
        setTimeout(() => {
          isTransitioning.value=false;
        }, 1000);
      }
      updatePositions();
    });

    // Watch for userId changes to fetch items
    watch(userId, async (newUserId) => {
      if (newUserId) {
        await fetchMindspaceItems()
      }
    })

    // Add a watcher for isMindSpaceView
    watch(isMindSpaceView, async (newValue) => {
      // Wait for DOM update
      await nextTick();
      
      // Get the mindspace container element
      const mindspaceContainer = document.querySelector('.mindspace-container');
      
      if (mindspaceContainer) {
        if (newValue) {
          // Disable scrolling when in mindspace view
          disableBodyScroll(mindspaceContainer);
          console.log('[DashboardView] Scrolling disabled for mindspace-container');
        } else {
          // Re-enable scrolling when switching to dashboard view
          enableBodyScroll(mindspaceContainer);
          console.log('[DashboardView] Scrolling enabled for mindspace-container');
        }
      }
    }, { immediate: true }); 

    onMounted(async () => {
      const dashboardView = document.querySelector('.view.dashboard-view');
      const itemWindowView = document.querySelector('.itemWindow-view');

      disableBodyScroll(bodyElement, {
        allowTouchMove: (el) => {
          return dashboardView.contains(el) || itemWindowView.contains(el);
        }
      });

      // Set up event listener for mindslot item windows
      emitter.on('openUnifiedItemWindow', handleMindslotItemWindow)
      emitter.on('closeUnifiedItemWindow', handleCloseUnifiedItemWindow)

      try {
        if (!userId.value) {
          await store.dispatch('user/setUserId');
          console.log("[DashboardView.vue]", userId.value);
        }

        if (userId.value) {
          await fetchMindspaceItems()
        }

        if (!currentThemeId.value) {
          const loadView = await store.dispatch('mindspace/loadViewThemeId', store.state.user.user.uid);
          if (!loadView) {
            return router.push('/themespace');
          }
        }

        // Call setMindSpace instead of setMindSpaceId directly
        // This will handle the proper initialization flow
        await store.dispatch('mindspace/setMindSpace');

        // Load all dashboard-related data after core initialization
        await Promise.all([
          store.dispatch('user/setLastViewLocationHistory', { lastLocation: "mindspace" }),
          store.dispatch('themeSpace/setThemeId', currentThemeId.value),
          store.dispatch('themeSpace/getSelfAssessment'),
          store.dispatch('scores/fetchSatisfactionData', currentThemeId.value)
        ]);

        // Load widget data after everything else is ready
        if (userId.value && currentThemeId.value) {
          console.log('[DashboardView.vue] Loading widget data for:', {
            uid: userId.value,
            themeId: currentThemeId.value
          });

          await store.dispatch('analysisRecords/loadData', {
            uid: userId.value,
            themeId: currentThemeId.value
          });

          // Also load other dashboard data that was previously in dashboard.vue
          await Promise.all([
            store.dispatch('chat/addRandomMessages'),
            store.dispatch('scores/loadScoresData'),
            store.dispatch('todos/loadTodosData'),
            store.dispatch('user/getUserWidgets')
          ]);
        }

      } catch (error) {
        console.error('Error in setup:', error);
        router.push('/themespace');
      }
    });

    // Don't forget to clean up on unmount
    onUnmounted(() => {
      const mindspaceContainer = document.querySelector('.mindspace-container');
      if (mindspaceContainer) {
        enableBodyScroll(mindspaceContainer);
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
      background,
      containerStyle,

      currentMindSpaceId,
      currentItemId,

      // Unified item window
      showAnyItemWindow,
      unifiedItemWindowProps,
      closeAnyItemWindow,

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

      // Shared items
      mindspaceItems,
      fetchMindspaceItems,
      getItemImage,
      getItemName,
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

.dashboard-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;

  // Position it where appropriate in your layout
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
}
</style>
