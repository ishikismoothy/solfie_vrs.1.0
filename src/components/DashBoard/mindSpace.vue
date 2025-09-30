<!-- Updated mindSpace.vue with unified icon styling and global sync -->
<template>
    <div class="mindspace-container">

      <!-- Mind-Grid container -->
      <div
        class="mind-grid-container"
        @touchstart="startEditModeTimer"
        @touchend="cancelEditModeTimer"
        @mousedown="startEditModeTimer"
        @mouseup="cancelEditModeTimer"
        @mouseleave="cancelEditModeTimer"
      >
        <!-- Edit mode overlay -->
        <div v-if="isEditMode" class="edit-mode-overlay"></div>

        <!-- Mind-Grid -->
        <div
          v-for="(page, pageIndex) in mindSpacePages"
          :key="pageIndex"
          class="mind-grid"
          :data-page-index1="pageIndex"
          :style="{
            transform: `translateX(${calculateTransform(pageIndex)}px)`,
            transition: isDraggingForPageShift ? 'none' : 'transform 0.3s ease'
          }"
          @touchstart="handleTouchStartForPageShift"
          @touchmove="handleTouchMoveForPageShift"
          @touchend="handleTouchEndForPageShift"
        >
          <!-- Mind-Item -->
          <div
            v-for="(item, index) in page.items"
            :key="item.id || index"
            class="mind-Item"
            :data-id="item.id"
          >
            <div
              class="icon-wrapper"
              :class="{
                'dragging': draggingItem === item,
                'folder-hover': item.items && isDragging && hoveredFolderId === item.id
              }"
              :data-item-id="item.id"
            >
              <!-- Separate container for delete button -->
              <div class="delete-button-container" v-if="isEditMode && !isDragging">
                <DeleteButton
                  @delete="handleItemDelete(item)"
                  @touchstart.stop="void 0"
                />
              </div>

              <!-- Main content wrapper -->

              <!-- Removed redundant touchstart.prevent to allow drag initiation -->
              <!-- @touchstart.prevent="handleTouchStart($event, item, pageIndex, index)"
               @touchend.prevent="handleTouchEnd" -->
              <div
                class="content-wrapper"
                @click="handleItemClick(item)"
                @mousedown.prevent="handleMouseDown($event, item, pageIndex, index)"
                @touchstart="handleTouchStart($event, item, pageIndex, index)"
                @touchend="handleTouchEnd"
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

      <div
         v-if="false"
        class="folder-overlay"
        @click.self="closeFolder"
        @touchstart="startEditModeTimer"
        @touchend="cancelEditModeTimer"
        @mousedown="startEditModeTimer"
        @mouseup="cancelEditModeTimer"
        @mouseleave="cancelEditModeTimer"
        @mousemove="handleFolderMouseMove"
        @touchmove="handleFolderTouchMove"
      >
        <div
          class="folder-exit-area"
          @click.self="closeFolder"
        ></div>
        <div class="folder-content">
          <h3>{{ currentFolder.name }}</h3>
          <div class="folder-grid-container">
            <div
              v-for="(page, pageIndex) in folderPages"
              :key="pageIndex"
              class="folder-grid"
              :data-page-index2="pageIndex"
              :style="{ transform: `translateX(${(pageIndex - currentFolderPage) * 100}%)` }"
            >
              <!-- Folder-Item -->
              <div
                v-for="(item, index) in page.items"
                :key="item.id || index"
                class="folder-item"
                :data-id="item.id"
              >
                <div class="icon-wrapper"
                  :class="{
                    'dragging': draggingFolderItem === item,
                    'empty': !item
                  }"
                  @click="handleFolderItemClick(item)"
                  @mousedown.prevent="handleFolderMouseDown($event, item, pageIndex, index)"
                  @touchstart="handleFolderTouchStart($event, item, pageIndex, index)"
                >
                  <!-- Add delete button -->
                  <DeleteButton
                      v-if="isEditMode"
                      @delete="handleItemDelete(item)"
                  />

                  <!-- Unified icon display for folder items -->
                  <div class="icon-display-container"
                       @contextmenu.prevent="handleFolderItemRightClick($event, item)"
                       @touchstart.passive="handleFolderItemTouchStart($event, item)"
                       @touchend.passive="handleFolderItemTouchEnd">
                    <!-- Custom icon from global store -->
                    <div v-if="getItemCustomIcon(item.id)" class="custom-icon unified-icon" v-html="getItemCustomIcon(item.id)"></div>

                    <!-- Default icon shape -->
                    <template v-else>
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
                <span class="item-name">{{ item.name }}</span>
              </div>

              <!-- Add button on every page -->
              <div
                v-if="page.items.length < ITEMS_PER_FOLDER_PAGE"
                class="folder-item add-item"
                @click="showAddItemMenu('folder', pageIndex)"
              >
                <div class="icon-wrapper">
                  <div class="icon-content">
                    <i class="fas fa-plus"></i>
                  </div>
                </div>
                <span class="item-name">Add New</span>
              </div>

              <!-- Empty slots to maintain grid layout -->
              <div v-if="getEmptySlotCount(page) > 0" class="empty-slots">
                <div
                  v-for="n in getEmptySlotCount(page)"
                  :key="`empty-${pageIndex}-${n}`"
                  class="folder-item empty"
                >
                  <div class="icon-wrapper empty">
                    <div class="icon-shadow-container">
                      <div class="icon-shadow"></div>
                    </div>
                  </div>
                  <span class="item-name"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Folder Page indicator -->
          <div class="folder-page-indicator">
            <span
              v-for="(page, index) in folderPages"
              :key="index"
              :class="{
                'active': index === currentFolderPage,
                'has-items': page.items.length > 0
              }"
              @click="selectFolderPage(index)"
            ></span>
          </div>
        </div>
      </div>

      <!-- Unified exit edit mode button -->
      <button
        v-if="isEditMode || isEditMode"
        @click="exitEditMode"
        class="exit-edit-mode"
      >
        Exit Edit Mode
      </button>

      <!-- Add this at the end of your template -->
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

// Clean mindSpace.vue with folders properly disabled
// Replace the script section with this:

<script>
  import { defineComponent, ref, computed, onMounted, watch, nextTick } from 'vue';
  import { useStore } from 'vuex';
  import { formatDate } from '@/utility/dateUtils';
  import squareSvg from '@/assets/shapes/square.svg';
  import DeleteButton from './deleteButton.vue';
  import AddItemModal from './addItemModal.vue';
  import TruncateText from '../TruncateText/truncateSpanItemText.vue';
  import IconSelector from '@/./components/ItemWindow/IconSelector.vue';

  export default defineComponent({
    name: 'iPhoneStyleMaestroUI',

    components: {
      AddItemModal,
      TruncateText,
      DeleteButton,
      IconSelector,
    },
    setup() {
      const store = useStore();
      const currentTime = ref('');

      //Detect Share view or not
      const isSharedView = computed(() => store.state.mindspace?.isSharedView || false)
      const currentShareData = computed(() => store.state.sharing?.currentShareData)
      const isSharedAccess = computed(() => !!currentShareData.value?.mindspaceId)
      const isViewOnly = computed(() => {
        if (currentShareData.value?.access) {
          return currentShareData.value.access === 'view'
        }

        // Fallback to original logic if no share data
        // View-only if in shared view AND not in edit mode
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

      //[MIND-GRID-CONTAINER] MIND-GRID-PAGE
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

      // DISABLED: Folder item icon selection handlers
      const handleFolderItemRightClick = () => {
        console.log('Folder functionality disabled');
      }

      const handleFolderItemTouchStart = () => {
        console.log('Folder functionality disabled');
      }

      const handleFolderItemTouchEnd = () => {
        console.log('Folder functionality disabled');
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
            // Remove custom icon
            await store.dispatch('user/setItemCustomIcon', {
              itemId,
              customIcon: null
            })
          } else {
            // Set custom icon
            await store.dispatch('user/setItemCustomIcon', {
              itemId,
              customIcon: selectedIcon.svg
            })
          }
        }
        closeIconSelector()
      }

      //[MIND-GRID-CONTAINER] MIND-GRID-PAGE Rendering
      const ITEMS_PER_PAGE = 20; // 4x5 layout

      const currentPage = computed(() => store.getters['mindspace/getCurrentPage']);
      const mindSpacePages = computed(() => store.getters['mindspace/getMindSpacePages']);

      // DISABLED: Folder watcher
      // watch(
      //   () => store.state.mindspace.mindSpacePages,
      //   () => {
      //     // Folder functionality disabled
      //   },
      //   { deep: true }
      // );

      //[ADD-ITEM]
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

        // TEMPORARILY DISABLE FOLDERS
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
          shape: squareSvg, // Keep original shape as fallback
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
              console.log('[addNewItemImpl] Setting default custom icon for item:', itemId);

              const defaultIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(255, 86, 56)" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                    <circle cx="12" cy="12" r="1.5" fill="rgb(255, 86, 56)"/>
                                  </svg>`;

              await store.dispatch('user/setItemCustomIcon', {
                itemId,
                customIcon: defaultIcon
              });

              console.log('[addNewItemImpl] Default custom icon set successfully');
            }

          } catch (error) {
            console.error('Error adding new item:', error);
          }
        } else if (target === 'folder') {
          // DISABLED: Folder functionality
          console.log('Folder functionality disabled');
        }

        console.log(`[addNewItemImpl] Added new item to ${target}:`, newItem);
      };

      const handleItemDelete = async (item) => {
        console.error('mindSpace.vue/handleItemDelete: TRIGGERED');
        try {
          if (!item || !item.id) {
            console.error('Invalid item for deletion');
            return;
          }

          // Optional: Add confirmation dialog
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

      //Icon Graphics - Shadow
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

      //[Drag&Drop]Mind-Grid Drag and Drop mode Handling
      const isEditMode = computed(() => store.getters['mindspace/getIsEditMode']);
      const isMouseDown = ref(false);
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

      //Mind-Grid Drag and Drop Interaction Handling
      const draggingItem = ref(null);
      const dragStartIndex = ref(null);
      const dragStartPageIndex = ref(null);
      const dragStartTime = ref(0);
      const dragStartX = ref(0);
      const dragStartY = ref(0);
      const isDraggingForPageShift = ref(false);
      const currentDragOffset = ref(0);
      const pageWidth = ref(window.innerWidth);
      const draggedElement = ref(null);
      const isDragging = ref(false);
      const dragOffset = ref({ x: 0, y: 0 });
      const ghostItem = ref(null);
      const dragThreshold = 10; // pixels
      const pageChangeTimer = ref(null);

      // DISABLED: Folder hover variables
      const hoveredFolderId = ref(null);

      watch(isEditMode, (newValue) => {
        console.log("[mindSpace.vue] Edit mode changed:", newValue)
      });

      //PageShift Touch Swipe
      const calculateTransform = (pageIndex) => {
        const baseTransform = (pageIndex - currentPage.value) * pageWidth.value;
        return isDraggingForPageShift.value
          ? baseTransform + currentDragOffset.value
          : baseTransform;
      };

      const handleTouchStartForPageShift = (event) => {
        if (draggedElement.value) return;

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

      //For console Use. List up items in the string.
      const formatItemList = (pages) => {
        return pages.map((page, pageIndex) => {
          if (page && page.items && Array.isArray(page.items)) {
            return `Page ${pageIndex}: ${page.items.map(item => item.name).join(', ')}`;
          }
          return `Page ${pageIndex}: empty`;
        }).join('\n');
      };

      // Update handleItemClick to disable folders
      const handleItemClick = async (item) => {
        if (!item) {
          console.warn('[handleItemClick] No valid item provided');
          return;
        }

        // TEMPORARILY DISABLE FOLDER OPENING
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

      const handleMouseDown = (event, item, pageIndex, index) => {
        console.log('[handleMouseDown] TRIGGERED');

        if (isEditMode.value) {
          isMouseDown.value = true;
          dragStartX.value = event.clientX;
          dragStartY.value = event.clientY;
          dragStartTime.value = Date.now();

          draggingItem.value = item;
          dragStartIndex.value = index;
          dragStartPageIndex.value = pageIndex;

          draggedElement.value = event.target.closest('.mind-Item');

          const rect = draggedElement.value.getBoundingClientRect();
          dragOffset.value = {
            x: dragStartX.value - rect.left*1.1,
            y: dragStartY.value - rect.top
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }
      };

      const handleMouseMove = (event) => {
        if (isEditMode.value && isMouseDown.value) {
          const currentX = event.clientX;
          const currentY = event.clientY;
          const distance = Math.sqrt(Math.pow(currentX - dragStartX.value, 2) + Math.pow(currentY - dragStartY.value, 2));
          const timeDiff = Date.now() - dragStartTime.value;

          if (!isDragging.value && (distance > dragThreshold || timeDiff > 500)) {
            startDrag(event);
          }

          if (isDragging.value) {
            moveDraggedElement(currentX, currentY);
          }
        }
      };

      const handleMouseUp = (event) => {
        console.log('[handleMouseUp] TRIGGERED');
        isMouseDown.value = false;
        if (isDragging.value) {
          endDrag(event);
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      // Touch handling
      const touchStartTime = ref(0);
      const touchStartX = ref(0);
      const touchStartY = ref(0);
      // const TAP_THRESHOLD = 200;
      // const MOVE_THRESHOLD = 10;

      const handleTouchStart = (event, item, pageIndex, index) => {
        console.log('[handleTouchStart] TRIGGERED');

        touchStartTime.value = Date.now();
        touchStartX.value = event.touches[0].clientX;
        touchStartY.value = event.touches[0].clientY;

        if (isEditMode.value) {
          // Added preventDefault to avoid triggering click after drag
          event.preventDefault();
          isMouseDown.value = true;
          dragStartX.value = event.touches[0].clientX;
          dragStartY.value = event.touches[0].clientY;
          dragStartTime.value = Date.now();
          draggingItem.value = item;
          dragStartIndex.value = index;
          dragStartPageIndex.value = pageIndex;

          draggedElement.value = event.target.closest('.mind-Item');

          const rect = draggedElement.value.getBoundingClientRect();
          dragOffset.value = {
            x: dragStartX.value - rect.left,
            y: dragStartY.value - rect.top
          };

          document.addEventListener('touchmove', handleTouchMove, { passive: false });
          document.addEventListener('touchend', handleTouchEnd);
        }
      };

      const handleTouchMove = (event) => {
        if (isEditMode.value && isMouseDown.value) {
          const currentX = event.touches[0].clientX;
          const currentY = event.touches[0].clientY;
          const distance = Math.sqrt(
            Math.pow(currentX - dragStartX.value, 2) +
            Math.pow(currentY - dragStartY.value, 2)
          );
          const timeDiff = Date.now() - dragStartTime.value;

          if (!isDragging.value && (distance > dragThreshold || timeDiff > 500)) {
            startDrag(event);
          }

          if (isDragging.value) {
            moveDraggedElement(currentX, currentY);
            event.preventDefault();
          }
        }
      };

      // Simplified handleTouchEnd due to changes to click handling
      // const handleTouchEnd = (event) => {
      //   console.log('[handleTouchEnd] TRIGGERED');

      //   const touchDuration = Date.now() - touchStartTime.value;
      //   const touchEndX = event.changedTouches[0].clientX;
      //   const touchEndY = event.changedTouches[0].clientY;
      //   const moveDistance = Math.sqrt(
      //     Math.pow(touchEndX - touchStartX.value, 2) +
      //     Math.pow(touchEndY - touchStartY.value, 2)
      //   );

      //   if (touchDuration < TAP_THRESHOLD && moveDistance < MOVE_THRESHOLD) {
      //     const itemElement = event.target.closest('.mind-Item');
      //     if (itemElement) {
      //       const itemId = itemElement.getAttribute('data-id');
      //       const item = findItemById(itemId);

      //       if (item) {
      //         console.log('[handleTouchEnd] Tap detected, triggering click for item:', item);
      //         handleItemClick(item);
      //       }
      //     }
      //   }

      //   isMouseDown.value = false;
      //   if (isDragging.value) {
      //     endDrag(event);
      //   }
      //   document.removeEventListener('touchmove', handleTouchMove);
      //   document.removeEventListener('touchend', handleTouchEnd);

      //   touchStartTime.value = 0;
      //   touchStartX.value = 0;
      //   touchStartY.value = 0;
      // };

      const handleTouchEnd = (event) => {
        console.log('[handleTouchEnd] TRIGGERED');

        if (isEditMode.value) {
          // Only handle drag end in edit mode
          isMouseDown.value = false;
          if (isDragging.value) {
            endDrag(event);
          }
          document.removeEventListener('touchmove', handleTouchMove);
          document.removeEventListener('touchend', handleTouchEnd);
        }

        // Reset touch tracking
        touchStartTime.value = 0;
        touchStartX.value = 0;
        touchStartY.value = 0;
      };

      // const findItemById = (id) => {
      //   for (const page of mindSpacePages.value) {
      //     for (const item of page.items) {
      //       if (item.id === id) {
      //         return item;
      //       }
      //     }
      //   }
      //   return null;
      // };

      const startDrag = () => {
        console.log('[startDrag] TRIGGERED');
        isDragging.value = true;
        draggedElement.value.classList.add('dragging');

        ghostItem.value = draggedElement.value.cloneNode(true);
        ghostItem.value.classList.add('placeholder');
        ghostItem.value.style.opacity = '0.5';
        ghostItem.value.style.pointerEvents = 'none';

        draggedElement.value.parentNode.insertBefore(ghostItem.value, draggedElement.value);
        document.body.appendChild(draggedElement.value);

        console.log('[startDrag] Initial Grid-Items-Order:\n' + formatItemList(mindSpacePages.value));
      };

      const moveDraggedElement = (mouseX, mouseY) => {
        if (!draggedElement.value) return;

        draggedElement.value.style.position = 'fixed';
        draggedElement.value.style.zIndex = '1000';
        draggedElement.value.style.left = `${mouseX - dragOffset.value.x}px`;
        draggedElement.value.style.top = `${mouseY - dragOffset.value.y}px`;

        // DISABLED: Folder detection
        // Just handle page edge detection
        const edgeThreshold = 50;
        if (mouseX < edgeThreshold) {
          startPageChangeTimer('prev');
        } else if (mouseX > window.innerWidth - edgeThreshold) {
          startPageChangeTimer('next');
        } else {
          cancelPageChangeTimer();
        }
      };

      const endDrag = async (event) => {
        console.log('[endDrag] TRIGGERED');

        if (isDragging.value && draggedElement.value) {
          const mouseX = event.clientX || event.changedTouches?.[0]?.clientX;
          const mouseY = event.clientY || event.changedTouches?.[0]?.clientY;

          // DISABLED: Folder operations completely removed
          const elementUnderCursor = document.elementFromPoint(mouseX, mouseY);
          if (!elementUnderCursor) {
            console.warn('[endDrag] No element found under cursor');
            return;
          }

          const targetMindItem = elementUnderCursor.closest('.mind-Item');
          let targetIndex, targetPage;

          if (targetMindItem) {
            targetPage = parseInt(targetMindItem.closest('.mind-grid').getAttribute('data-page-index1'));
            if (isNaN(targetPage)) {
              targetPage = dragStartPageIndex.value;
            }

            const itemsInPage = Array.from(targetMindItem.closest('.mind-grid').querySelectorAll('.mind-Item:not(.dragging)'));
            targetIndex = itemsInPage.indexOf(targetMindItem);

            if (targetPage === dragStartPageIndex.value) {
              if (targetIndex < dragStartIndex.value) {
                // targetIndex remains the same
              } else if (targetIndex > dragStartIndex.value) {
                targetIndex++;
              } else if (targetIndex === dragStartIndex.value) {
                targetIndex++;
                const targetGrid = document.querySelectorAll('.mind-grid')[targetPage];
                const targetItems = targetGrid.querySelectorAll('.mind-Item:not(.dragging):not(.add-item)');
                const addItemButton = targetGrid.querySelector('.add-item');

                if (targetIndex < targetItems.length) {
                  targetGrid.insertBefore(draggedElement.value, targetItems[targetIndex]);
                } else if (addItemButton) {
                  targetGrid.insertBefore(draggedElement.value, addItemButton);
                } else {
                  targetGrid.appendChild(draggedElement.value);
                }
              }
            }
          } else {
            targetPage = dragStartPageIndex.value;
            targetIndex = dragStartIndex.value;

            const targetGrid = document.querySelectorAll('.mind-grid')[targetPage];
            const targetItems = targetGrid.querySelectorAll('.mind-Item:not(.dragging):not(.add-item)');
            const addItemButton = targetGrid.querySelector('.add-item');

            if (targetIndex < targetItems.length) {
              targetGrid.insertBefore(draggedElement.value, targetItems[targetIndex]);
            } else if (addItemButton) {
              targetGrid.insertBefore(draggedElement.value, addItemButton);
            } else {
              targetGrid.appendChild(draggedElement.value);
            }
            console.log('[endDrag] No valid target found, returning to original position');
          }

          // Remove placeholder
          if (ghostItem.value?.parentNode) {
            ghostItem.value.parentNode.removeChild(ghostItem.value);
          }
          ghostItem.value = null;

          // Update the item's position in the data structure
          console.log('[endDrag] Updating position to:', { targetPage, targetIndex });

          if (!isNaN(targetPage) && !isNaN(targetIndex)) {
            await store.dispatch('mindspace/moveItemBetweenPages', {
              fromPageIndex: dragStartPageIndex.value,
              toPageIndex: targetPage,
              fromIndex: dragStartIndex.value,
              toIndex: targetIndex
            });
          } else {
            console.error('[endDrag] Invalid target position:', { targetPage, targetIndex });
          }

          // Reset styles and clean up
          resetDraggedElementStyle();
          isDragging.value = false;
          draggingItem.value = null;
          draggedElement.value = null;
          dragStartIndex.value = null;
          dragStartPageIndex.value = null;
        }

        await store.dispatch('mindspace/cleanupEmptyPages');
      };

      const resetDraggedElementStyle = () => {
        if (draggedElement.value) {
          draggedElement.value.style.position = '';
          draggedElement.value.style.zIndex = '';
          draggedElement.value.style.left = '';
          draggedElement.value.style.top = '';
          draggedElement.value.classList.remove('dragging');
        }
      };

      const changePage = (direction) => {
          const currentValue = currentPage.value;
          const totalPages = store.getters['mindspace/getTotalPages'];

          if (direction === 'prev' && currentValue > 0) {
              store.dispatch('mindspace/setCurrentPage', currentValue - 1);
              store.dispatch('mindspace/cleanupEmptyPages');
          } else if (direction === 'next' && currentValue < totalPages - 1) {
              store.dispatch('mindspace/setCurrentPage', currentValue + 1);
          } else if (direction === 'next' && currentValue === totalPages - 1) {
              store.dispatch('mindspace/addNewPage');
              store.dispatch('mindspace/setCurrentPage', currentValue + 1);
          }
      };

      const startPageChangeTimer = (direction) => {
          if (pageChangeTimer.value) return;

          pageChangeTimer.value = setTimeout(() => {
              changePage(direction);
              pageChangeTimer.value = null;
          }, 500);
      };

      const cancelPageChangeTimer = () => {
        if (pageChangeTimer.value) {
          clearTimeout(pageChangeTimer.value);
          pageChangeTimer.value = null;
        }
      };

      // DISABLED: All folder-related functions
      const handleItemHover = () => {
        // Folder hover disabled
      };

      const handleItemLeave = () => {
        hoveredFolderId.value = null;
      };

      // DISABLED: Folder state and functions
      const showFolder = ref(false);
      const currentFolder = ref(null);
      const folderPages = ref([]);
      const currentFolderPage = ref(0);
      const ITEMS_PER_FOLDER_PAGE = 12;

      // Empty functions to prevent errors
      const openFolder = () => {
        console.log('Folder functionality disabled');
      };

      const closeFolder = () => {
        console.log('Folder functionality disabled');
      };

      const initializeFolderPages = () => {
        console.log('Folder functionality disabled');
      };

      const selectFolderPage = () => {
        console.log('Folder functionality disabled');
      };

      const handleFolderItemClick = () => {
        console.log('Folder functionality disabled');
      };

      const handleFolderMouseDown = () => {
        console.log('Folder functionality disabled');
      };

      const handleFolderTouchStart = () => {
        console.log('Folder functionality disabled');
      };

      const updateFolderItemPosition = () => {
        console.log('Folder functionality disabled');
      };

      const getEmptySlotCount = () => {
        return 0;
      };

      const refreshMindGridAfterOperation = async () => {
        try {
          console.log('[refreshMindGridAfterOperation] Refreshing mind grid data');

          // Check if we have a currentMindSpaceId first
          const currentMindSpaceId = store.state.mindspace.currentMindSpaceId;

          if (!currentMindSpaceId) {
            console.log('[refreshMindGridAfterOperation] No currentMindSpaceId yet, initializing mindspace...');
            // If no mindSpaceId, we need to initialize first
            await store.dispatch('mindspace/setMindSpace');
            // setMindSpace already calls setMindSpacePages, so we're done
          } else {
            // Only refresh if we already have a mindSpaceId (e.g., after edit operations)
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
          // Check if mindspace data is already loaded
          const currentMindSpaceId = store.state.mindspace.currentMindSpaceId;
          const mindSpacePages = store.state.mindspace.mindSpacePages;

          if (!currentMindSpaceId) {
            console.log('[onMounted] Waiting for parent component to initialize mindspace...');
            // The parent component (DashboardView) handles the initialization
            // We'll wait for it to be ready

            const unwatch = watch(
              () => store.state.mindspace.currentMindSpaceId,
              async (newId) => {
                if (newId) {
                  //console.log('[onMounted] Mindspace initialized by parent, loading custom icons...');
                  await store.dispatch('user/fetchItemCustomIcons');
                  // Don't call refreshMindGridAfterOperation here as parent already loaded the data
                  unwatch();
                }
              },
              { immediate: true }
            );
          } else if (mindSpacePages && mindSpacePages.length > 0 && mindSpacePages[0].items !== undefined) {
            // Mindspace is already initialized and has data, just fetch custom icons
            console.log('[onMounted] Mindspace already loaded, fetching custom icons only...');
            await store.dispatch('user/fetchItemCustomIcons');
            // Don't refresh grid data as it's already loaded
          } else {
            // Mindspace ID exists but pages might not be loaded (edge case)
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
        draggingItem,

        // Icon management
        getItemCustomIcon,
        showIconSelector,
        selectorPosition,
        hasCurrentIcon,
        handleItemRightClick,
        handleItemTouchStart,
        handleItemTouchEnd,
        handleFolderItemRightClick,
        handleFolderItemTouchStart,
        handleFolderItemTouchEnd,
        closeIconSelector,
        handleIconSelection,

        // EditMode related
        isEditMode,
        isDragging,

        //PageShiftForTouch
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
        handleMouseDown,
        handleTouchStart,
        handleTouchEnd,
        handleTouchMove,
        exitEditMode,
        startDrag,
        createShadowSvg,

        // DISABLED: Folder functions (kept for template compatibility)
        hoveredFolderId,
        handleItemHover,
        handleItemLeave,
        openFolder,
        showFolder,
        currentFolder,
        folderPages,
        currentFolderPage,
        ITEMS_PER_FOLDER_PAGE,
        closeFolder,
        initializeFolderPages,
        selectFolderPage,
        handleFolderItemClick,
        handleFolderMouseDown,
        handleFolderTouchStart,
        updateFolderItemPosition,
        getEmptySlotCount,

        // Utility functions
        formatDate,
      };
    }
  });
</script>

  <style lang="scss">
    @import '@/assets/mindSpaceStyle.scss';
    @import '@/assets/itemWindowStyle.scss';

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

    .folder-item:not(.empty):not(.add-item):hover .unified-icon {
      transform: scale(1.1);
      transition: transform 0.2s ease;
    }
  </style>
