<!-- Fully Integrated mindSpace.vue with Unified Drag & Drop -->
<template>
    <div class="mindspace-container">

      <!-- Mind-Grid container -->
      <div
        class="mind-grid-container"
        :class="{ 'drag-active': isDragging }"
        @touchstart="!isDragging && startEditModeTimer()"
        @touchend="cancelEditModeTimer"
        @mousedown="!isDragging && startEditModeTimer()"
        @mouseup="cancelEditModeTimer"
        @mouseleave="cancelEditModeTimer"
      >
        <!-- Edit mode overlay -->
        <div v-if="isEditMode" class="edit-mode-overlay"></div>

        <!-- Mind-Grid -->
        <div
          v-for="(page, pageIndex) in mindSpacePages"
          :key="pageIndex"
          class="mind-grid grid-page"
          :data-page-index1="pageIndex"
          :style="{
            transform: `translateX(${calculateTransform(pageIndex)}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease'
          }"
          @touchstart="handleTouchStartForPageShift"
          @touchmove="handleTouchMoveForPageShift"
          @touchend="handleTouchEndForPageShift"
        >
          <!-- Mind-Item -->
          <div
            v-for="(item, index) in page.items"
            :key="item.id || index"
            class="mind-Item grid-item draggable-item"
            :class="{ 'is-dragging': draggedItem?.id === item.id }"
            :data-id="item.id"
          >
            <div class="icon-wrapper" :data-item-id="item.id">
              <!-- Delete button container -->
              <div class="delete-button-container" v-if="isEditMode && !isDragging">
                <button
                  class="delete-button"
                  @click.stop="handleItemDelete(item)"
                >
                  <HeroIcon name="x-mark" class="background-circle" />
                </button>
              </div>

              <!-- Main content wrapper -->
              <div
                class="content-wrapper"
                @click="!isEditMode && handleItemClick(item)"
                @mousedown.prevent="isEditMode && handleDragStart($event, item, pageIndex, index)"
                @touchstart="isEditMode && handleDragStart($event, item, pageIndex, index)"
                @mouseover="handleItemHover(item)"
                @mouseleave="handleItemLeave()"
              >
                <!-- Unified icon display -->
                <div class="icon-display-container"
                     @contextmenu.prevent="handleItemRightClick($event, item)"
                     @touchstart.passive="handleItemTouchStart($event, item)"
                     @touchend.passive="handleItemTouchEnd">
                  <!-- Custom icon from global store -->
                  <div v-if="getItemCustomIcon(item.id)" class="custom-icon unified-icon" v-html="getItemCustomIcon(item.id)"></div>

                  <!-- Default icon shape -->
                  <template v-else>
                    <!-- icon Shadow -->
                    <div class="icon-shadow-container">
                      <div class="icon-shadow" v-html="createShadowSvg(item.shape)"></div>
                    </div>
                    <img :src="item.shape" class="icon-shape" :alt="item.name">

                    <!-- Icon content and badge (only show if no custom icon) -->
                    <div class="icon-content">
                      <i v-if="item.icon" :class="item.icon"></i>
                    </div>
                    <div v-if="item.badge" class="badge" :class="item.badge">
                      <i :class="getBadgeIcon(item.badge)"></i>
                    </div>
                  </template>
                </div>
              </div>
            </div>
            <TruncateText
              class="item-name"
              :text="item.name"
              :mobile-cutoff="10"
              :tablet-cutoff="15"
              :desktop-cutoff="15"
            />
          </div>

          <!-- Add button only on the last page -->
          <div
            v-if="page.items.length < ITEMS_PER_PAGE"
            class="mind-Item add-item"
            @click="showAddItemMenu('mindSpace', pageIndex)"
          >
            <div class="icon-wrapper">
              <div class="icon-content">
                <i class="fas fa-plus"></i>
              </div>
            </div>
            <span class="item-name">Add New</span>
          </div>
        </div>
      </div>

      <!-- Scroll indicators when dragging near edges -->
      <div v-if="isDragging" class="drag-scroll-indicator drag-scroll-indicator-left"></div>
      <div v-if="isDragging" class="drag-scroll-indicator drag-scroll-indicator-right"></div>

      <!-- Unified exit edit mode button -->
      <button
        v-if="isEditMode"
        @click="exitEditMode"
        class="exit-edit-mode"
      >
        Exit Edit Mode
      </button>

      <!-- Add Item Modal -->
      <AddItemModal
        v-if="showAddItemModal"
        :isInFolder="addItemTarget === 'folder'"
        @add="handleAddItemSelection"
        @close="showAddItemModal = false"
      />

      <!-- Unified Icon Selector for mind grid items -->
      <IconSelector
        :isVisible="showIconSelector"
        :position="selectorPosition"
        :hasCurrentIcon="hasCurrentIcon"
        :screenPosition="'right'"
        @close="closeIconSelector"
        @select-icon="handleIconSelection"
      />

    </div>

  </template>

<script>
  import { defineComponent, ref, computed, onMounted, watch, nextTick } from 'vue';
  import { useStore } from 'vuex';
  import { formatDate } from '@/utility/dateUtils';
  import squareSvg from '@/assets/shapes/square.svg';
  import AddItemModal from './addItemModal.vue';
  import TruncateText from '../TruncateText/truncateSpanItemText.vue';
  import IconSelector from '@/./components/ItemWindow/IconSelector.vue';
  import { useDragAndDrop } from '@/./components/composables/useDragAndDrop';
  import emitter from '@/eventBus'

  export default defineComponent({
    name: 'iPhoneStyleMaestroUI',

    components: {
      AddItemModal,
      TruncateText,
      IconSelector,
    },

    setup() {
      const store = useStore();
      const currentTime = ref('');

      // Detect Share view or not
      const isSharedView = computed(() => store.state.mindspace?.isSharedView || false)
      const currentShareData = computed(() => store.state.sharing?.currentShareData)
      const isSharedAccess = computed(() => !!currentShareData.value?.mindspaceId)
      const isViewOnly = computed(() => {
        if (currentShareData.value?.access) {
          return currentShareData.value.access === 'view'
        }
        return isSharedView.value && !isEditMode.value
      })

      // Icon selector state
      const showIconSelector = ref(false)
      const selectorPosition = ref({ x: 0, y: 0 })
      const currentItemForIcon = ref(null)
      const hasCurrentIcon = ref(false)

      // Touch handling for icon selection
      let iconTouchTimer = null
      const longPressDelay = 500

      // Badge icons
      const getBadgeIcon = (badge) => {
        const icons = {
          lightblue: 'fas fa-lightbulb',
          pink: 'fas fa-hand-paper',
          green: 'fas fa-hand-paper',
          red: 'fas fa-exclamation',
          yellow: 'fas fa-gift'
        }
        return icons[badge] || ''
      };

      const updateTime = () => {
        const now = new Date();
        currentTime.value = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      };

      // Global icon management
      const getItemCustomIcon = (itemId) => {
        if (!itemId) return null
        return store.getters['user/getItemCustomIcon'](itemId)
      }

      // Icon selection handlers for mind grid items
      const handleItemRightClick = (event, item) => {
        event.preventDefault()
        openIconSelector(event, item)
      }

      const handleItemTouchStart = (event, item) => {
        if (isEditMode.value) {
          return
        }
        iconTouchTimer = setTimeout(() => {
          openIconSelector(event.touches[0], item)
        }, longPressDelay)
      }

      const handleItemTouchEnd = () => {
        if (iconTouchTimer) {
          clearTimeout(iconTouchTimer)
          iconTouchTimer = null
        }
      }

      // Open icon selector
      const openIconSelector = (event, item) => {
        currentItemForIcon.value = item
        hasCurrentIcon.value = !!getItemCustomIcon(item.id)
        selectorPosition.value = { x: 0, y: 0 }
        showIconSelector.value = true
      }

      // Close icon selector
      const closeIconSelector = () => {
        showIconSelector.value = false
        currentItemForIcon.value = null
        hasCurrentIcon.value = false
      }

      // Handle icon selection
      const handleIconSelection = async (selectedIcon) => {
        if (currentItemForIcon.value) {
          const itemId = currentItemForIcon.value.id

          if (selectedIcon === null) {
            await store.dispatch('user/setItemCustomIcon', {
              itemId,
              customIcon: null
            })
          } else {
            await store.dispatch('user/setItemCustomIcon', {
              itemId,
              customIcon: selectedIcon.svg
            })
          }
        }
        closeIconSelector()
      }

      // Mind-Grid Page Configuration
      const ITEMS_PER_PAGE = 20;
      const currentPage = computed(() => store.getters['mindspace/getCurrentPage']);
      const mindSpacePages = computed(() => store.getters['mindspace/getMindSpacePages']);

      // Add Item Modal
      const showAddItemModal = ref(false);
      const addItemTarget = ref(null);
      const addItemPageIndex = ref(null);

      const showAddItemMenu = (target, pageIndex) => {
        showAddItemModal.value = true;
        addItemTarget.value = target;
        addItemPageIndex.value = pageIndex;
      };

      const handleAddItemSelection = (type) => {
        console.log('[handleAddItemSelection] Adding item type:', type);

        if (type === 'folder') {
          alert('Folder functionality is temporarily disabled');
          showAddItemModal.value = false;
          return;
        }

        if (type === 'item') {
          addNewItemImpl(addItemTarget.value, addItemPageIndex.value);
        }

        showAddItemModal.value = false;
      };

      const addNewItemImpl = async (target, pageIndex) => {
        const newItem = {
          name: 'New Item',
          shape: squareSvg,
        };

        console.log('[addNewItemImpl] Adding new item:', { target, pageIndex, newItem });

        if (target === 'mindSpace') {
          const currentPageItems = store.getters['mindspace/getPageItems'](pageIndex);
          try {
            let itemId;

            if (currentPageItems.length < ITEMS_PER_PAGE) {
              itemId = await store.dispatch('mindspace/addItemToPage', {
                pageIndex,
                index: currentPageItems.length,
                item: newItem
              });
            } else {
              itemId = await store.dispatch('mindspace/addItemToPage', {
                pageIndex: pageIndex + 1,
                index: 0,
                item: newItem
              });
              store.dispatch('mindspace/setCurrentPage', pageIndex + 1);
            }

            // Set default custom icon for the new item
            if (itemId) {
              const defaultIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(255, 86, 56)" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                    <circle cx="12" cy="12" r="1.5" fill="rgb(255, 86, 56)"/>
                                  </svg>`;

              await store.dispatch('user/setItemCustomIcon', {
                itemId,
                customIcon: defaultIcon
              });
            }

            return itemId

          } catch (error) {
            console.error('Error adding new item:', error);
          }
        }
        return null;
      };

      const handleItemDelete = async (item) => {
        console.error('mindSpace.vue/handleItemDelete: TRIGGERED');
        try {
          if (!item || !item.id) {
            console.error('Invalid item for deletion');
            return;
          }

          if (!confirm('Are you sure you want to delete this item?')) {
            return;
          }

          console.log('[handleItemDelete] Deleting item:', item);
          await store.dispatch('mindspace/deleteItem', item.id);
          console.log('[handleItemDelete] Successfully deleted item');
        } catch (error) {
          console.error('[handleItemDelete] Error deleting item:', error);
        }
      };

      // Icon Graphics - Shadow
      const createShadowSvg = (originalSvgUrl) => {
        return `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <defs>
              <filter id="shadow">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                <feOffset dx="4" dy="4" result="offsetblur"/>
                <feFlood flood-color="rgba(0,0,0,0.5)"/>
                <feComposite in2="offsetblur" operator="in"/>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <use href="${originalSvgUrl}#shape" fill="black" filter="url(#shadow)"/>
          </svg>
        `;
      };

      // Edit Mode Handling
      const isEditMode = computed(() => store.getters['mindspace/getIsEditMode']);
      const editModeTimer = ref(null);

      const startEditModeTimer = () => {
        if (isEditMode.value) return;
        editModeTimer.value = setTimeout(async() => {
          await store.dispatch('mindspace/setIsEditMode', true);
        }, 2000);
      };

      const cancelEditModeTimer = () => {
          if (editModeTimer.value) {
            clearTimeout(editModeTimer.value);
          }
      };

      const exitEditMode = async () => {
        try {
          await store.dispatch('mindspace/setIsEditMode', false);
          await store.dispatch('mindspace/updateMindSpace');
          await store.dispatch('mindspace/setMindSpacePages');
          console.log('Successfully exited edit mode and updated mindspace');
        } catch (error) {
          console.error('Error exiting edit mode:', error);
        }
      };

      // ✅ NEW - Unified Drag and Drop Integration
      const {
        isDragging,
        draggedItem,
        initDrag
      } = useDragAndDrop({
        containerSelector: '.mind-grid-container',
        itemSelector: '.mind-Item',
        pageSelector: '.mind-grid',
        dragThreshold: 10,
        edgeScrollThreshold: 50,
        pageChangeDelay: 500,

        onDragStart: ({ item }) => {
          console.log('[Drag Start]', item.name);
        },

        onDragMove: () => {
          // Optional: Add custom logic during drag
        },

        onDragEnd: async ({ dropResult }) => {
          console.log('[Drag End]', dropResult);

          if (!dropResult) return;

          const { fromPage, toPage, fromIndex, toIndex } = dropResult;

          // Skip if position hasn't changed
          if (fromPage === toPage && fromIndex === toIndex) {
            return;
          }

          try {
            // Update position in store
            await store.dispatch('mindspace/moveItemBetweenPages', {
              fromPageIndex: fromPage,
              toPageIndex: toPage,
              fromIndex: fromIndex,
              toIndex: toIndex
            });

            console.log('[Drag Complete] Successfully moved item');
          } catch (error) {
            console.error('[Drag Error]', error);
          }
        },

        onPageChange: (direction) => {
          const currentPageVal = currentPage.value;
          const maxPage = mindSpacePages.value.length - 1;

          if (direction === 'prev' && currentPageVal > 0) {
            store.dispatch('mindspace/setCurrentPage', currentPageVal - 1);
          } else if (direction === 'next' && currentPageVal < maxPage) {
            store.dispatch('mindspace/setCurrentPage', currentPageVal + 1);
          }
        }
      });

      // ✅ NEW - Simple drag handler (replaces old handleMouseDown/handleTouchStart)
      const handleDragStart = (event, item, pageIndex, index) => {
        if (!isEditMode.value) return;

        initDrag(event, item, {
          pageIndex,
          originalIndex: index
        });
      };

      // Page Shift for Touch Swipe (KEEP - this is different from item dragging)
      const isDraggingForPageShift = ref(false);
      const currentDragOffset = ref(0);
      const pageWidth = ref(window.innerWidth);
      const dragStartX = ref(0);

      const calculateTransform = (pageIndex) => {
        const baseTransform = (pageIndex - currentPage.value) * pageWidth.value;
        return (isDraggingForPageShift.value && !isEditMode.value)
          ? baseTransform + currentDragOffset.value
          : baseTransform;
      };

      const handleTouchStartForPageShift = (event) => {
        if (isDragging.value) return;

        isDraggingForPageShift.value = true;
        dragStartX.value = event.touches[0].clientX;
        currentDragOffset.value = 0;
        event.currentTarget.style.transition = 'none';
      };

      const handleTouchMoveForPageShift = (event) => {
        if (!isDraggingForPageShift.value) return;

        const currentX = event.touches[0].clientX;
        currentDragOffset.value = currentX - dragStartX.value;

        if ((currentPage.value === 0 && currentDragOffset.value > 0) ||
            (currentPage.value === mindSpacePages.value.length - 1 && currentDragOffset.value < 0)) {
          currentDragOffset.value *= 0.3;
        }

        event.preventDefault();
      };

      const handleTouchEndForPageShift = () => {
        if (!isDraggingForPageShift.value) return;

        const swipeThreshold = pageWidth.value * 0.1;

        if (Math.abs(currentDragOffset.value) > swipeThreshold) {
          if (currentDragOffset.value > 0 && currentPage.value > 0) {
            store.dispatch('mindspace/setCurrentPage', currentPage.value - 1);
          } else if (currentDragOffset.value < 0 && currentPage.value < mindSpacePages.value.length - 1) {
            store.dispatch('mindspace/setCurrentPage', currentPage.value + 1);
          }
        }

        isDraggingForPageShift.value = false;
        currentDragOffset.value = 0;
      };

      // Item Click Handler
      const handleItemClick = async (item) => {
        if (!item) {
          console.warn('[handleItemClick] No valid item provided');
          return;
        }

        if (item.items) {
          console.log('[handleItemClick] Folder functionality disabled:', item);
          alert('Folder functionality is temporarily disabled');
          return;
        } else {
          console.log('[handleItemClick] Clicked on item:', item.name);

          if (!isEditMode.value) {
            await store.dispatch('mindspace/setItemId', item.id);
            await store.dispatch('mindspace/getItemName', item.name);
            await store.dispatch('user/triggerItemWindow', true);
          }
        }
      };

      // Folder hover (disabled but keeping for compatibility)
      const hoveredFolderId = ref(null);
      const handleItemHover = () => {
        // Folder functionality disabled
      };
      const handleItemLeave = () => {
        // Folder functionality disabled
      };

      // Refresh mind grid after operations
      const refreshMindGridAfterOperation = async () => {
        try {
          const currentMindSpaceId = store.state.mindspace.currentMindSpaceId;

          if (!currentMindSpaceId) {
            await store.dispatch('mindspace/setMindSpace');
          } else {
            await store.dispatch('mindspace/setMindSpacePages');
          }

          await nextTick();
          console.log('[refreshMindGridAfterOperation] Mind grid refreshed successfully');
        } catch (error) {
          console.error('[refreshMindGridAfterOperation] Error refreshing mind grid:', error);
        }
      };

      onMounted(async () => {
        updateTime();
        setInterval(updateTime, 60000);

        try {
          const currentMindSpaceId = store.state.mindspace.currentMindSpaceId;
          const mindSpacePages = store.state.mindspace.mindSpacePages;

          if (!currentMindSpaceId) {
            console.log('[onMounted] Waiting for parent component to initialize mindspace...');

            const unwatch = watch(
              () => store.state.mindspace.currentMindSpaceId,
              async (newId) => {
                if (newId) {
                  await store.dispatch('user/fetchItemCustomIcons');
                  unwatch();
                }
              },
              { immediate: true }
            );
          } else if (mindSpacePages && mindSpacePages.length > 0 && mindSpacePages[0].items !== undefined) {
            console.log('[onMounted] Mindspace already loaded, fetching custom icons only...');
            await store.dispatch('user/fetchItemCustomIcons');
          } else {
            console.log('[onMounted] Mindspace ID exists but pages not loaded, refreshing...');
            await store.dispatch('user/fetchItemCustomIcons');
            await refreshMindGridAfterOperation();
          }
        } catch (error) {
          console.error('[onMounted] Error during initialization:', error);
        }

        window.addEventListener('resize', () => {
          pageWidth.value = window.innerWidth;
        });
      });

      const checkAndFixDataConsistency = async () => {
        try {
          const storePages = store.getters['mindspace/getMindSpacePages'];
          const currentMindSpaceId = store.state.mindspace.currentMindSpaceId;

          if (!storePages || !currentMindSpaceId) {
            console.log('[checkAndFixDataConsistency] Missing data, refreshing...');
            await store.dispatch('mindspace/setMindSpacePages');
          }

          const allItemIds = [];
          storePages.forEach(page => {
            if (page.items) {
              allItemIds.push(...page.items);
            }
          });

          console.log('[checkAndFixDataConsistency] Total items in mind grid:', allItemIds.length);

        } catch (error) {
          console.error('[checkAndFixDataConsistency] Error checking consistency:', error);
        }
      };

      // Listen for slot item creation requests
      emitter.on('createNewItemForSlot', async () => {
        const pageIndex = currentPage.value || 0

        // Create the item
        const itemId = await addNewItemImpl('mindSpace', pageIndex)

        // Emit to ItemSelectionGrid so it can add to selection
        if (itemId) {
          emitter.emit('newItemCreatedForSelection', { itemId })
        }
      })

      setInterval(checkAndFixDataConsistency, 60000);

      return {
        // General UI elements
        currentTime,
        isViewOnly,
        isSharedAccess,

        // Mind-Grid related
        mindSpacePages,
        currentPage,
        ITEMS_PER_PAGE,

        // ✅ NEW - Drag and drop
        isDragging,
        draggedItem,
        handleDragStart,

        // Icon management
        getItemCustomIcon,
        showIconSelector,
        selectorPosition,
        hasCurrentIcon,
        handleItemRightClick,
        handleItemTouchStart,
        handleItemTouchEnd,
        closeIconSelector,
        handleIconSelection,

        // EditMode related
        isEditMode,

        // PageShift for Touch
        isDraggingForPageShift,
        handleTouchStartForPageShift,
        handleTouchMoveForPageShift,
        handleTouchEndForPageShift,
        calculateTransform,

        // EditMode functions
        startEditModeTimer,
        cancelEditModeTimer,

        // Add New Item
        showAddItemModal,
        addItemTarget,
        showAddItemMenu,
        handleAddItemSelection,
        handleItemDelete,

        // Mind-Grid Interaction functions
        getBadgeIcon,
        handleItemClick,
        exitEditMode,
        createShadowSvg,

        // Folder functions (disabled but kept for compatibility)
        hoveredFolderId,
        handleItemHover,
        handleItemLeave,

        // Utility functions
        formatDate,
      };
    }
  });
</script>

  <style lang="scss">
    @import '@/assets/mindSpaceStyle.scss';
    @import '@/assets/itemWindowStyle.scss';
    @import '@/assets/dragAndDrop.scss';

    // Unified icon styling for mind grid items
    .icon-display-container {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .unified-icon {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgb(255, 86, 56);
      z-index: 2;

      svg {
        width: 80%;
        height: 80%;
        max-width: 48px;
        max-height: 48px;
        stroke: currentColor;
        fill: none;
      }
    }

    // Override the icon-content class when custom icon is present
    .icon-wrapper:has(.unified-icon) {
      .icon-content,
      .badge,
      .icon-shadow-container {
        display: none;
      }
    }

    // Ensure mind grid icons follow the same hover and interaction patterns
    .mind-Item:not(.empty):not(.add-item):hover .unified-icon {
      transform: scale(1.1);
      transition: transform 0.2s ease;
    }

    // ✅ NEW - Drag and drop specific styles
    .mind-Item.is-dragging {
      visibility: hidden;
    }

    .mind-Item:not(.is-dragging) {
      transition: transform 0.2s ease;
    }

    .edit-mode .draggable-item {
      cursor: grab;
    }

    .edit-mode .draggable-item:active {
      cursor: grabbing;
    }
  </style>
