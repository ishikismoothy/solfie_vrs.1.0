<!-- STILL WORKING ON THE FUNCTION FOR ADDING NEW MIND GRID PAGE -->
<!-- TRIGGER UPON NO ROOM FOR EXTRA ITEM LISTED -->
<!-- UPDATED 2024/09/10 18:07 -->

<!--
FUTURE DEVELOPMENT
ADD STATUS HEADER
1 NAME
2 Avator Icon
3 Plan Name
4 Menu bar with logout button
-->

<template>
    <div class="mindspace-container" :style="containerStyle">

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
            <div class="icon-wrapper"
              :class="{
                'dragging': draggingItem === item,
                'folder-hover': item.items && isDragging && hoveredFolderId === item.id
              }"
              :data-item-id="item.id"
              @click="handleItemClick(item)"
              @mousedown.prevent="handleMouseDown($event, item, pageIndex, index)"
              @touchstart.prevent="handleTouchStart($event, item, pageIndex, index)"
              @touchend.prevent="handleTouchEnd"
              @mouseover="handleItemHover(item)"
              @mouseleave="handleItemLeave()"
            >
              <!-- Add delete button -->
              <DeleteButton
                v-if="isEditMode && !isDragging"
                @delete="handleItemDelete(item)"
              />
              <!-- icon Shadow -->
              <div class="icon-shadow-container">
                <div class="icon-shadow" v-html="createShadowSvg(item.shape)"></div>
              </div>
                <img :src="item.shape" class="icon-shape" :alt="item.name">
              <div class="icon-content">
                <i v-if="item.icon" :class="item.icon"></i>
              </div>
              <div v-if="item.badge" class="badge" :class="item.badge">
                <i :class="getBadgeIcon(item.badge)"></i>
              </div>
            </div>
            <TruncateText
                class="item-name"
                :text="item.name"
                :mobile-cutoff="10"
                :tablet-cutoff="15"
                :desktop-cutoff="15"
              />
              <!--<span class="item-name">{{ item.name }}</span>-->
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
        v-if="showFolder"
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
                  <div class="icon-shadow-container">
                    <div class="icon-shadow" v-html="createShadowSvg(item.shape)"></div>
                  </div>
                  <img :src="item.shape" class="icon-shape" :alt="item.name">
                  <div class="icon-content">
                    <i v-if="item.icon" :class="item.icon"></i>
                  </div>
                  <div v-if="item.badge" class="badge" :class="item.badge">
                    <i :class="getBadgeIcon(item.badge)"></i>
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
      <AddItemPopup
        v-if="showAddItemPopup"
        :isInFolder="addItemTarget === 'folder'"
        @add="handleAddItemSelection"
        @close="showAddItemPopup = false"
      />

    </div>

  </template>

  <script>
    import { defineComponent, ref, computed, onMounted, watch, nextTick } from 'vue';
    import { useStore } from 'vuex';
    import { formatDate } from '@/utility/dateUtils';
    import backgroundImage from '@/assets/bg_img.jpg';
    import squareSvg from '@/assets/shapes/square.svg';
    //import circleSvg from '../assets/shapes/circle.svg';
    //import octagonSvg from '../assets/shapes/octagon.svg';
    //import cloudSvg from '../assets/shapes/cloud.svg';
    //import folderSvg from '../assets/shapes/folder.svg';
    import DeleteButton from './deleteButton.vue';
    import AddItemPopup from './addItemPopup.vue';
    import TruncateText from '../TruncateText/truncateSpanItemText.vue';

    export default defineComponent({
      name: 'iPhoneStyleMaestroUI',

      components: {
        AddItemPopup,
        TruncateText,
        DeleteButton
      },
      setup() {
        const store = useStore();
        const currentUser = computed(() =>store.getters['mindspace/getUserId']);
        const currentTime = ref('');

        //[BACKGROUND]
        const background = ref({
          type: 'image',
          value1: '#f0f0f0',
          value2: backgroundImage
        });

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

        //[MIND-GRID-CONTAINER] MIND-GRID-PAGE Rendering
        const ITEMS_PER_PAGE = 20; // 4x5 layout

        // Get state from Vuex with safe access
        //const isLoading = computed(() => store.getters['mindspace/isLoading']);
        //const error = computed(() => store.getters['mindspace/getError']);
        //const userId = computed(() => store.getters['mindspace/getUserId']);
        //const themeId = computed(() => store.getters['mindspace/getThemeId']);
        //const mindSpaceId = computed(() => store.getters['mindspace/getMindSpaceId']);

        const currentPage = computed(() => store.getters['mindspace/getCurrentPage']);
        const mindSpacePages = computed(() => store.getters['mindspace/getMindSpacePages']);

        watch(
          () => store.state.mindspace.mindSpacePages,
          () => {
            if (showFolder.value && currentFolder.value) {
              nextTick(() => {
                initializeFolderPages();
              });
            }
          },
          { deep: true }
        );

        //[ADD-ITEM]
        const showAddItemPopup = ref(false);

        const addItemTarget = ref(null);
        const addItemPageIndex = ref(null);

        const showAddItemMenu = (target, pageIndex) => {
          showAddItemPopup.value = true;
          addItemTarget.value = target;
          addItemPageIndex.value = pageIndex;
        };

        const handleAddItemSelection = (type) => {
          console.log('[handleAddItemSelection] Adding item type:', type);

          if (type === 'item') {
            addNewItemImpl(addItemTarget.value, addItemPageIndex.value);
          } else if (type === 'folder') {
            addNewFolderImpl(addItemTarget.value, addItemPageIndex.value);
          }

          showAddItemPopup.value = false;

          // Re-initialize pages if needed
          if (addItemTarget.value === 'folder') {
            nextTick(() => {
              initializeFolderPages();
            });
          }
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
              const newItem = {
                name: 'New Item',
                shape: squareSvg,
              };

              if (currentPageItems.length < ITEMS_PER_PAGE) {
                await store.dispatch('mindspace/addItemToPage', {
                  pageIndex,
                  index: currentPageItems.length,
                  item: newItem
                });
              } else {
                await store.dispatch('mindspace/addItemToPage', {
                  pageIndex: pageIndex + 1,
                  index: 0,
                  item: newItem
                });
                store.dispatch('mindspace/setCurrentPage', pageIndex + 1);
              }
            } catch (error) {
              console.error('Error adding new item:', error);
              // Handle error appropriately
            }
          } else if (target === 'folder' && currentFolder.value) {
            try {
              const newItem = {
                name: 'New Item',
                shape: squareSvg,
              };

              await store.dispatch('mindspace/addNewItemToFolder', {
                folderId: currentFolder.value.id,
                item: newItem
              });

              initializeFolderPages();
            } catch (error) {
              console.error('Error adding new item to folder:', error);
              // Handle error
            }
          }
          console.log(`[addNewItemImpl] Added new item to ${target}:`, newItem);
        };

        /*
        // New function to add multiple items at once
        const addMultipleItems = (items, targetPageIndex = null) => {
          const startPageIndex = targetPageIndex ?? store.getters['mindspace/getCurrentPage'];

          store.dispatch('mindspace/distributeItemsAcrossPages', {
            startPageIndex,
            items: items.map(item => ({
              id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: item.name || 'New Item',
              shape: item.shape || squareSvg,
              ...item
            })),
            itemsPerPage: ITEMS_PER_PAGE
          });
        };*/

        // Function to add a new folder
        const addNewFolderImpl = async (target, pageIndex) => {
          if (target === 'mindSpace') {
            const currentPageItems = store.getters['mindspace/getPageItems'](pageIndex);

            try {
              if (currentPageItems.length < ITEMS_PER_PAGE) {
                await store.dispatch('mindspace/addNewFolder', {
                  pageIndex,
                  index: currentPageItems.length
                });
              } else {
                await store.dispatch('mindspace/addNewFolder', {
                  pageIndex: pageIndex + 1,
                  index: 0
                });
                store.dispatch('mindspace/setCurrentPage', pageIndex + 1);
              }
            } catch (error) {
              console.error('Error adding new folder:', error);
              // Handle error
            }
          }
        };

        const handleItemDelete = async (item) => {
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

            // If the deleted item was in a folder, refresh folder pages
            if (showFolder.value && currentFolder.value) {
              nextTick(() => {
                initializeFolderPages();
              });
            }

            console.log('[handleItemDelete] Successfully deleted item');
          } catch (error) {
            console.error('[handleItemDelete] Error deleting item:', error);
            // Optionally show error to user
          }
        };


        //Icon Graphics - Shadow
        const createShadowSvg = (originalSvgUrl) => {
          // This is a placeholder. In a real implementation, you'd need to fetch and parse the SVG.
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
            //isEditMode.value = true;
            await store.dispatch('mindspace/setIsEditMode', true);
          }, 2000);
        };

        const cancelEditModeTimer = () => {
            if (editModeTimer.value) {
              clearTimeout(editModeTimer.value);
            }
        };

        const  exitEditMode = async () => {
          try {
            //isEditMode.value = false;
            await store.dispatch('mindspace/setIsEditMode', false);
            // First update the mindspace in Firestore
            await store.dispatch('mindspace/updateMindSpace');

            // Then refresh the pages from Firestore
            await store.dispatch('mindspace/setMindSpacePages');

            console.log('Successfully exited edit mode and updated mindspace');
          } catch (error) {
            console.error('Error exiting edit mode:', error);
            // Handle error (show message to user, etc.)
          }
        };

        //Mind-Grid Drag and Drop Interaction Handling
        const draggingItem = ref(null);
        const dragStartIndex = ref(null);
        const dragStartPageIndex = ref(null);

        const dragStartTime = ref(0);
        const dragStartX = ref(0);
        const dragStartY = ref(0);

        //const currentXForPageShift = ref(0);
        const isDraggingForPageShift = ref(false);
        const currentDragOffset = ref(0);
        const pageWidth = ref(window.innerWidth);

        const draggedElement = ref(null);
        const isDragging = ref(false);
        const dragOffset = ref({ x: 0, y: 0 });
        const ghostItem = ref(null);

        const dragThreshold = 10; // pixels
        const pageChangeTimer = ref(null);

        watch(isEditMode, (newValue) => {
          console.log("[mindSapce.vue] Disable handleTouchStart from Dashboard.",newValue)
          //emit('edit-mode-change', newValue);
        });

        //PageShift Touch Swipe
        const calculateTransform = (pageIndex) => {
          const baseTransform = (pageIndex - currentPage.value) * pageWidth.value;
          return isDraggingForPageShift.value
            ? baseTransform + currentDragOffset.value
            : baseTransform;
        };

        const handleTouchStartForPageShift = (event) => {
          //Disable when Dragging items.
          if (draggedElement.value) return;

          isDraggingForPageShift.value = true;
          dragStartX.value = event.touches[0].clientX;
          currentDragOffset.value = 0;

          // Disable transition when starting drag
          event.currentTarget.style.transition = 'none';
        };

        const handleTouchMoveForPageShift = (event) => {
          if (!isDraggingForPageShift.value) return;

          const currentX = event.touches[0].clientX;
          currentDragOffset.value = currentX - dragStartX.value;

          // Add resistance at the edges
          if ((currentPage.value === 0 && currentDragOffset.value > 0) ||
              (currentPage.value === mindSpacePages.value.length - 1 && currentDragOffset.value < 0)) {
            currentDragOffset.value *= 0.3;
          }

          event.preventDefault();
        };

        const handleTouchEndForPageShift = () => {
          if (!isDraggingForPageShift.value) return;

          const swipeThreshold = pageWidth.value * 0.1; // 20% of page width

          if (Math.abs(currentDragOffset.value) > swipeThreshold) {
            if (currentDragOffset.value > 0 && currentPage.value > 0) {
              store.dispatch('mindspace/setCurrentPage', currentPage.value - 1);
              console.log("[handleTouchEndForPageShift] currentPage: ",currentPage.value);
            } else if (currentDragOffset.value < 0 && currentPage.value < mindSpacePages.value.length - 1) {
              store.dispatch('mindspace/setCurrentPage', currentPage.value + 1);
              console.log("[handleTouchEndForPageShift] currentPage: ",currentPage.value);
            }
          }

          isDraggingForPageShift.value = false;
          currentDragOffset.value = 0;
        };

        //For console Use. List up items in the string.
        const formatItemList = (pages) => {
          return pages.map((page, pageIndex) => {
            // Check if page has items array
            if (page && page.items && Array.isArray(page.items)) {
              return `Page ${pageIndex}: ${page.items.map(item => item.name).join(', ')}`;
            }
            // Fallback for empty or invalid pages
            return `Page ${pageIndex}: empty`;
          }).join('\n');
        };

        // Update handleItemClick to include safety checks
        const handleItemClick = async (item) => {
          //console.log('[handleItemClick] Mind-Grid item clicked:', item);

          if (!item) {
            console.warn('[handleItemClick] No valid item provided');
            return;
          }

          if (item.items) {
            console.log('[handleItemClick] Opening folder:', item);
            showFolder.value = true;
            currentFolder.value = item;
            initializeFolderPages();
          } else {
            console.log('[handleItemClick] Clicked on non-folder item:', item.name);

            if(!isEditMode.value){
              await store.dispatch('mindspace/setItemId', item.id);
              await store.dispatch('mindspace/getItemName', item.name);
              await store.dispatch('mindspace/triggerItemWindow', true);
            }

            // Here you can add any additional functionality for non-folder items
          }
        };

        const handleMouseDown = (event, item, pageIndex, index) => {
          //[DEBUG]
          console.log('[handleMouseDown] TRIGGERED');

          if (isEditMode.value) {
            isMouseDown.value = true;
            dragStartX.value = event.clientX;
            dragStartY.value = event.clientY;
            dragStartTime.value = Date.now();

            draggingItem.value = item;
            dragStartIndex.value = index;
            dragStartPageIndex.value = pageIndex;

            // Store the dragged element
            draggedElement.value = event.target.closest('.mind-Item');

            //[DEBUG] LOGGING DRAGGED ITEM
            console.log('[handleMouseDown] Focus Item: ', draggingItem.value);
            console.log('[handleMouseDown] draggedElement: ', draggedElement.value);
            console.log('[handleMouseDown] Original Item index:', index,' / Original Page index:', pageIndex );

            // Calculate and store the offset within the dragged element
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
          //[DEBUG]
          console.log('[handleMouseUp] TRIGGERED');
          isMouseDown.value = false;
          if (isDragging.value) {
            endDrag(event);
          }
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };

        // Add these refs if you don't have them
        const touchStartTime = ref(0);
        const touchStartX = ref(0);
        const touchStartY = ref(0);
        const TAP_THRESHOLD = 200; // milliseconds
        const MOVE_THRESHOLD = 10; // pixels

        const handleTouchStart = (event, item, pageIndex, index) => {
          console.log('[handleTouchStart] TRIGGERED');

          touchStartTime.value = Date.now();
          touchStartX.value = event.touches[0].clientX;
          touchStartY.value = event.touches[0].clientY;

          if (isEditMode.value) {
            isMouseDown.value = true;
            dragStartX.value = event.touches[0].clientX;
            dragStartY.value = event.touches[0].clientY;
            dragStartTime.value = Date.now();
            draggingItem.value = item;
            dragStartIndex.value = index;
            dragStartPageIndex.value = pageIndex;

            draggedElement.value = event.target.closest('.mind-Item');

            console.log('[handleTouchStart] Focus Item:', draggingItem.value);

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
              event.preventDefault(); // Prevent scrolling while dragging
            }
          }
        };

        const handleTouchEnd = (event) => {
          console.log('[handleTouchEnd] TRIGGERED');

          // Calculate touch duration and movement
          const touchDuration = Date.now() - touchStartTime.value;
          const touchEndX = event.changedTouches[0].clientX;
          const touchEndY = event.changedTouches[0].clientY;
          const moveDistance = Math.sqrt(
            Math.pow(touchEndX - touchStartX.value, 2) +
            Math.pow(touchEndY - touchStartY.value, 2)
          );

          // If it was a short touch with minimal movement, treat it as a tap
          if (touchDuration < TAP_THRESHOLD && moveDistance < MOVE_THRESHOLD) {
            const itemElement = event.target.closest('.mind-Item');
            if (itemElement) {
              // Find the actual item from mindSpacePages using the data-id
              const itemId = itemElement.getAttribute('data-id');
              const item = findItemById(itemId);

              if (item) {
                console.log('[handleTouchEnd] Tap detected, triggering click for item:', item);
                handleItemClick(item);
              }
            }
          }

          // Normal touch end handling for drag operations
          isMouseDown.value = false;
          if (isDragging.value) {
            endDrag(event);
          }
          document.removeEventListener('touchmove', handleTouchMove);
          document.removeEventListener('touchend', handleTouchEnd);

          // Reset touch tracking values
          touchStartTime.value = 0;
          touchStartX.value = 0;
          touchStartY.value = 0;
        };

        // Add this helper function to find items by ID
        const findItemById = (id) => {
          // Search through mindSpacePages
          for (const page of mindSpacePages.value) {
            for (const item of page.items) {
              if (item.id === id) {
                return item;
              }
            }
          }
          return null;
        };


        const startDrag = () => {
          //[DEBUG]
          console.log('[startDrag] TRIGGERED');
          isDragging.value = true;
          draggedElement.value.classList.add('dragging');

          // Create placeholder (GHOST WHILE DRAGGING)
          ghostItem.value = draggedElement.value.cloneNode(true);
          ghostItem.value.classList.add('placeholder');
          ghostItem.value.style.opacity = '0.5';
          ghostItem.value.style.pointerEvents = 'none';

          // Insert placeholder at the original position
          draggedElement.value.parentNode.insertBefore(ghostItem.value, draggedElement.value);

          document.body.appendChild(draggedElement.value);

          // Use the new formatItemList
          console.log('[startDrag] Initial Grid-Items-Order:\n' + formatItemList(mindSpacePages.value));
        };

        const moveDraggedElement = (mouseX, mouseY) => {
          if (!draggedElement.value) return;

          draggedElement.value.style.position = 'fixed';
          draggedElement.value.style.zIndex = '1000';
          draggedElement.value.style.left = `${mouseX - dragOffset.value.x}px`;
          draggedElement.value.style.top = `${mouseY - dragOffset.value.y}px`;

          const elementUnderCursor = document.elementFromPoint(mouseX, mouseY);

          if (elementUnderCursor) {
            const detectedItem = elementUnderCursor.closest('.mind-Item');

            if (detectedItem) {
              const detectedItemId = detectedItem.getAttribute('data-id');
              //console.log('[moveDraggedElement] Found folder:', detectedItemId);

              // Find the folder in mindSpacePages
              for (const page of mindSpacePages.value) {
                const item = page.items.find(item => item.id === detectedItemId && item.items);
                if (item) {
                  //console.log('[moveDraggedElement] Found matching folder:', folder);
                  handleItemHover(item);
                  return;
                }
              }
              handleItemLeave();
            } else {
              handleItemLeave();
            }
          } else {
            handleItemLeave();
          }

          // Check for edge proximity to trigger page change
          const edgeThreshold = 50;
          if (mouseX < edgeThreshold) {
            startPageChangeTimer('prev');
          } else if (mouseX > window.innerWidth - edgeThreshold) {
            startPageChangeTimer('next');
          } else {
            cancelPageChangeTimer();
          }
        };

        // Only touches UI/ DOM Manipulation
        const endDrag = async (event) => {
          console.log('[endDrag] TRIGGERED');

          if (isDragging.value && draggedElement.value) {
            const mouseX = event.clientX || event.changedTouches?.[0]?.clientX;
            const mouseY = event.clientY || event.changedTouches?.[0]?.clientY;

            clearFolderHoverTimer();

            //OPEN FOLDER AND DROP ITEM
            if (showFolder.value) {
              //[DEBUG]
              console.log('[endDrag] DROP IN THE FOLDER');

              // Remove placeholder
              if (ghostItem.value?.parentNode) {
                ghostItem.value.parentNode.removeChild(ghostItem.value);
              }
              ghostItem.value = null;

              // Drop the item into the open folder
              const folderGrid = document.querySelector('.folder-grid');

              // Template usage (remains the same)
              if (folderGrid && currentFolder.value) {
                try {
                  // Ensure draggingItem.value exists and has an id
                  if (!draggingItem.value?.id) {
                    console.error('[endDrag] Invalid dragging item:', draggingItem.value);
                    return;
                  }

                  await store.dispatch('mindspace/moveItemToFolder', {
                    pageIndex: dragStartPageIndex.value,
                    folderId: currentFolder.value.id,
                    item: draggingItem.value // Pass the full item
                  });

                  nextTick(() => {
                    initializeFolderPages();
                  });
                } catch (error) {
                  console.error('[endDrag] Error moving item to folder:', error);
                }
              }
            }
            //DROP AT Mind-GRID
            else {

              // Find the element under the cursor
              const elementUnderCursor = document.elementFromPoint(mouseX, mouseY);
              if (!elementUnderCursor) {
                console.warn('[endDrag] No element found under cursor');
                return;
              }

              const targetMindItem = elementUnderCursor.closest('.mind-Item');

              let targetIndex, targetPage;

              if (targetMindItem) {

                // If we're over a mind-Item, get its Page index.
                targetPage = parseInt(targetMindItem.closest('.mind-grid').getAttribute('data-page-index1'));
                // If fail to get page index.
                if (isNaN(targetPage)) {
                  targetPage = dragStartPageIndex.value;
                }

                // Get its position index.
                const itemsInPage = Array.from(targetMindItem.closest('.mind-grid').querySelectorAll('.mind-Item:not(.dragging)'));
                targetIndex = itemsInPage.indexOf(targetMindItem);

                console.log('[endDrag] Start Item index:', dragStartIndex.value,' / Start Page index:', dragStartPageIndex.value );
                console.log('[endDrag] Target Item index:', targetIndex,' / Target Page index:', targetPage );

                // Insert before the target item when the item moved left
                if (targetPage === dragStartPageIndex.value){
                  if (targetIndex < dragStartIndex.value) {
                    targetIndex;
                  } else if (targetIndex > dragStartIndex.value) {
                    targetIndex++;

                  } else if (targetIndex === dragStartIndex.value) {
                    targetIndex++;
                    // Update the DOM
                    // THIS LOGIC IS NEEDED TO RENDER DROP AND DELETING GHOST ITEM PROPERLY
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
                }else{
                  targetIndex;
                }

              } else {
                targetPage = dragStartPageIndex.value;
                targetIndex = dragStartIndex.value;

                // Update the DOM
                // THIS LOGIC IS NEEDED TO RENDER DROP AND DELETING GHOST ITEM PROPERLY
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
                store.dispatch('mindspace/moveItemBetweenPages', {
                  fromPageIndex: dragStartPageIndex.value,
                  toPageIndex: targetPage,
                  fromIndex: dragStartIndex.value,
                  toIndex: targetIndex
                });
              } else {
                console.error('[endDrag] Invalid target position:', { targetPage, targetIndex });
              }

            }

            // Reset styles and clean up
            resetDraggedElementStyle();
            isDragging.value = false;
            draggingItem.value = null;
            draggedElement.value = null;
            dragStartIndex.value = null;
            dragStartPageIndex.value = null;

            console.log('[endDrag] Final Grid-Items-Order:\n' + formatItemList(mindSpacePages.value));
          }
          // Clean up empty pages
          store.dispatch('mindspace/cleanupEmptyPages');
        };

        /*
        // Update this function to work with the new data structure
        const updateItemPosition = async (newPosition) => {
          console.log('[updateItemPosition] TRIGGERED - Moving to...', newPosition);

          const { page: newPageIndex, index: newItemIndex } = newPosition;

          // Validate inputs
          if (isNaN(newPageIndex) || isNaN(newItemIndex)) {
            console.error('[updateItemPosition] Invalid position:', { newPageIndex, newItemIndex });
            return;
          }

          try {
            // Moving from folder to Mind-Grid
            if (dragStartPageIndex.value === null) {
              console.log('[updateItemPosition] Moving item from folder to Mind-Grid');
              if (!draggingFolderItem.value) {
                console.error('[updateItemPosition] No folder item to move');
                return;
              }

              await store.dispatch('mindspace/moveItemFromFolderToPage', {
                folderId: currentFolder.value.id,
                itemId: draggingFolderItem.value.id,
                targetPageIndex: newPageIndex,
                targetIndex: newItemIndex,
                item: draggingFolderItem.value
              });
            }
            // Moving within Mind-Grid
            else {
              console.log('[updateItemPosition] Moving items within the Mind-Grid');
              await store.dispatch('mindspace/moveItemBetweenPages', {
                fromPageIndex: dragStartPageIndex.value,
                toPageIndex: newPageIndex,
                fromIndex: dragStartIndex.value,
                toIndex: newItemIndex
              });
            }

            // Update current page if necessary
            if (newPageIndex !== currentPage.value) {
              store.dispatch('mindspace/setCurrentPage', newPageIndex);
            }

            // Log the update
            nextTick(() => {
              console.log(`[updateItemPosition] Mind-Item moved to page ${newPageIndex}, End-index ${newItemIndex}`);
              console.log('[updateItemPosition] Updated structure:', debugPageStructure(mindSpacePages.value));
            });
          } catch (error) {
            console.error('[updateItemPosition] Error updating position:', error);
          }
        };
        */

        /*
        // Helper function to remove item from MindSpace pages
        const removeItemFromMindSpacePages = (item) => {
          console.log('[removeItemFromMindSpacePages] TRIGGERED');

          mindSpacePages.value.forEach((page, pageIndex) => {
            const itemIndex = page.items.findIndex(i => i === item);
            if (itemIndex !== -1) {
              store.dispatch('mindspace/removeItemFromPage', {
                pageIndex,
                itemIndex
              });
            }
          });

          console.log('[removeItemFromMindSpacePages] Item removed from Mind pages', item);
        };*/

        // Helper function to reset the dragged element's style
        const resetDraggedElementStyle = () => {
          if (draggedElement.value) {
            draggedElement.value.style.position = '';
            draggedElement.value.style.zIndex = '';
            draggedElement.value.style.left = '';
            draggedElement.value.style.top = '';
            draggedElement.value.classList.remove('dragging');
          }
        };

        // Function to handle page changes
        const changePage = (direction) => {
            const currentValue = currentPage.value;
            const totalPages = store.getters['mindspace/getTotalPages'];

            if (direction === 'prev' && currentValue > 0) {
                console.log('[startPageChangeTimer] Shift to LEFT');
                store.dispatch('mindspace/setCurrentPage', currentValue - 1);
                store.dispatch('mindspace/cleanupEmptyPages');
            } else if (direction === 'next' && currentValue < totalPages - 1) {
                console.log('[startPageChangeTimer] Shift to RIGTH');
                store.dispatch('mindspace/setCurrentPage', currentValue + 1);

            } else if (direction === 'next' && currentValue === totalPages - 1) {
                console.log('[startPageChangeTimer] Shift to RIGTH AND ADD PAGE');
                // Add new page if at the last page
                store.dispatch('mindspace/addNewPage');
                store.dispatch('mindspace/setCurrentPage', currentValue + 1);
            }
        };

        // Only touches data structure
        const startPageChangeTimer = (direction) => {
            //[DEBUG]
            //console.log('[startPageChangeTimer] TRIGGERED');

            if (pageChangeTimer.value) return;

            pageChangeTimer.value = setTimeout(() => {
                changePage(direction);
                pageChangeTimer.value = null;
            }, 500); // Reduced from 3000ms to 500ms for a more responsive feel
        };

        const cancelPageChangeTimer = () => {
          //[DEBUG]
          //console.log('[cancelPageChangeTimer] TRIGGERED');
          if (pageChangeTimer.value) {
            clearTimeout(pageChangeTimer.value);
            pageChangeTimer.value = null;
          }
        };


        //[Mind-Grid] Hover Over Folder
        // Add these new reactive references
        const hoveredFolder = ref(null);
        const folderHoverTimer = ref(null);
        const hoveredFolderId = ref(null);

        const handleItemHover = (item) => {
          console.log("[handleItemHover] TRIGGERED.", item);
          //console.log("[handleItemHover] isDragging: ",isDragging.value)
          if (isDragging.value && item.items) {
            hoveredFolderId.value = item.id;
            hoveredFolder.value = item;
            //console.log("[handleItemHover] FolderId:", hoveredFolderId.value);
            //console.log("[handleItemHover] Folder:", hoveredFolder.value);
            startFolderHoverTimer(item);
          }
        };

        const handleItemLeave = () => {
          hoveredFolderId.value = null;
          clearFolderHoverTimer();
        };

        const startFolderHoverTimer = () => {
          //console.log("[startFolderHoverTimer] TRIGGERED");
          clearFolderHoverTimer();

          // Make sure we have a valid folder before starting the timer
          if (!hoveredFolder.value || !hoveredFolder.value.items) {
            console.warn("[startFolderHoverTimer] No valid folder to open");
            return;
          }

          folderHoverTimer.value = setTimeout(() => {
            console.log("[startFolderHoverTimer] Timer completed, opening folder", hoveredFolder.value);
            if (hoveredFolder.value && isDragging.value) {
              openFolder(hoveredFolder.value);
            }
          }, 1000);
        };

        const clearFolderHoverTimer = () => {
          //console.log("[clearFolderHoverTimer] TRIGGERED");
          if (folderHoverTimer.value) {
            //console.log("[clearFolderHoverTimer] TRIGGERED");
            clearTimeout(folderHoverTimer.value);
            folderHoverTimer.value = null;
          }
        };

        //[Folder] Show Handler
        const showFolder = ref(false);

        //[Folder] Get opened folder Items
        const currentFolder = computed({
          get: () => store.state.mindspace.currentFolder,
          set: (value) => store.commit('mindspace/UPDATE_CURRENT_FOLDER', value)
        });

        //[Folder] Function to open or close a folder
        const openFolder = (folder) => {
          console.log('[openFolder] TRIGGERED with folder:', folder);

          if (!folder || !folder.items) {
            console.warn('[openFolder] Invalid folder provided');
            return;
          }

          showFolder.value = true;
          currentFolder.value = folder;

          // Initialize folder pages after setting the current folder
          nextTick(() => {
            initializeFolderPages();
          });
        };

        const closeFolder = () => {
          //[DEBUG]
          console.log('[ClosingFolder] TRIGGERED');
          showFolder.value = false;
          if (!folderDraggedElement.value) {
            currentFolder.value = null;
          }
        };

        // Load Folder items
        // Folder-related reactive references
        const ITEMS_PER_FOLDER_PAGE = 12; // Adjust this value based on your folder layout
        const folderPages = ref([]);
        const currentFolderPage = ref(0);

        // Initialize folder pages
        // Updated initialization function
        const initializeFolderPages = () => {
          console.log('[initializeFolderPages] TRIGGERED');

          if (!currentFolder.value || !Array.isArray(currentFolder.value.items)) {
            console.log('[initializeFolderPages] Current folder is invalid or has no items. Initializing with an empty page.');
            folderPages.value = [{ items: [] }];
            return;
          }

          // Get fresh data from store
          const folder = store.getters['mindspace/getFolderById'](currentFolder.value.id);
          if (folder) {
            currentFolder.value = folder; // Update current folder with fresh data
          }

          const allItems = [...currentFolder.value.items]; // Create a copy of items
          folderPages.value = [];

          // Split items into pages
          while (allItems.length > 0 || folderPages.value.length === 0) {
            const pageItems = allItems.splice(0, ITEMS_PER_FOLDER_PAGE);
            folderPages.value.push({ items: pageItems });
          }

          // Ensure there's always at least one page
          if (folderPages.value.length === 0) {
            folderPages.value.push({ items: [] });
          }

          // Add empty page if the last page is full
          if (folderPages.value[folderPages.value.length - 1].items.length === ITEMS_PER_FOLDER_PAGE) {
            folderPages.value.push({ items: [] });
          }

          console.log('[initializeFolderPages] Initialized pages:', folderPages.value);
        };

        // Watch for changes in the currentFolder and reinitialize pages
        watch(() => currentFolder.value, (newFolder) => {
          //[DEBUG]
          console.log('[Watch] TRIGGERED, Looking at the folder:', newFolder);
          if (newFolder) {
            initializeFolderPages();
          } else {
            //console.log('Clearing folder pages');
            folderPages.value = []; // Clear pages when folder is closed
          }
        },{ deep: true });

        const selectFolderPage = (index) => {
          currentFolderPage.value = index;
        };


        // Folder-Drag and Drop related reactive references
        const draggingFolderItem = ref(null);
        const folderDragStartIndex = ref(null);
        const folderDragStartPageIndex = ref(null);

        const isFolderMouseDown = ref(false);
        const folderDragStartTime = ref(0);
        const folderDragStartX = ref(0);
        const folderDragStartY = ref(0);
        const folderDraggedElement = ref(null);
        const isFolderDragging = ref(false);
        const folderDragOffset = ref({ x: 0, y: 0 });
        const folderGhostItem = ref(null);


        const folderPageChangeTimer = ref(null);
        //const dragThreshold = 10; // pixels

        const isDraggingOutOfFolder = ref(false);
        const folderCloseTimer = ref(null);


        const handleFolderItemClick = async (item) => {
          //[DEBUG]
          console.log('[handleFolderItemClick] Clicked on Folder item clicked:', item.name);
          if(!isEditMode.value){
            await store.dispatch('mindspace/setItemId', item.id);
            await store.dispatch('mindspace/getItemName', item.name);
            await store.dispatch('mindspace/triggerItemWindow', true);
          }
        };

        const startFolderPageChangeTimer = (direction) => {
          if (folderPageChangeTimer.value) return;

          folderPageChangeTimer.value = setTimeout(() => {
            if (direction === 'prev' && currentFolderPage.value > 0) {
              currentFolderPage.value--;
            } else if (direction === 'next' && currentFolderPage.value < folderPages.value.length - 1) {
              currentFolderPage.value++;
            }
            folderPageChangeTimer.value = null;
          }, 500);
        };

        const cancelFolderPageChangeTimer = () => {
          if (folderPageChangeTimer.value) {
            clearTimeout(folderPageChangeTimer.value);
            folderPageChangeTimer.value = null;
          }
        };

        const handleFolderMouseDown = (event, item, pageIndex, index) => {
          //[DEBUG] LOGGING DRAGGING
          console.log('[handleFolderMouseDown] TRIGGERED');

          if (isEditMode.value) {
            isFolderMouseDown.value = true;
            folderDragStartX.value = event.clientX;
            folderDragStartY.value = event.clientY;
            folderDragStartTime.value = Date.now();

            draggingFolderItem.value = item;
            folderDragStartIndex.value = index;
            folderDragStartPageIndex.value = pageIndex;

            //Make sure to null mindspace item detection.
            dragStartPageIndex.value = null;
            dragStartIndex.value = null;

            // Store the dragged element
            folderDraggedElement.value = event.target.closest('.folder-item');

            //[DEBUG] LOGGING DRAGGED ITEM
            console.log('[handleFolderMouseDown] Focus Item: ',draggingFolderItem.value);
            console.log('[handleFolderMouseDown] draggedElement: ', folderDraggedElement.value);
            console.log('[handleFolderMouseDown] Original Item index:', index,' / Original Page index:', pageIndex );


            // Calculate and store the offset within the dragged element
            const rect = folderDraggedElement.value.getBoundingClientRect();
            folderDragOffset.value = {
              x: folderDragStartX.value - rect.left,
              y: folderDragStartY.value - rect.top
            };

            document.addEventListener('mousemove', handleFolderMouseMove);
            document.addEventListener('mouseup', handleFolderMouseUp);
          }
        };

        const handleFolderTouchStart = (event, item, pageIndex, index) => {
          console.log('[handleFolderTouchStart] TRIGGERED');
          folderDragStartX.value = event.touches[0].clientX;
          folderDragStartY.value = event.touches[0].clientY;
          folderDragStartTime.value = Date.now();

          if (isEditMode.value) {
            isFolderMouseDown.value = true;
            draggingFolderItem.value = item;
            folderDragStartIndex.value = index;
            folderDragStartPageIndex.value = pageIndex;

            // Store the dragged element
            folderDraggedElement.value = event.target.closest('.folder-item');

            //[DEBUG] LOGGING DRAGGED ITEM
            console.log('[handleFolderTouchStart] Focus Item: ',draggingFolderItem.value)
            console.log('[handleFolderTouchStart] draggedElement: ', folderDraggedElement.value);
            console.log('[handleFolderTouchStart] Original Item index:', index,' / Original Page index:', pageIndex );


            // Calculate and store the offset within the dragged element
            const rect = folderDraggedElement.value.getBoundingClientRect();
            folderDragOffset.value = {
              x: folderDragStartX.value - rect.left,
              y: folderDragStartY.value - rect.top
            };
            
            document.addEventListener('touchmove', handleFolderTouchMove, { passive: false });
            document.addEventListener('touchend', handleFolderTouchEnd);
          }else {
              // Non-edit mode - handle clicks
              const handleTouchEnd = (endEvent) => {
              const touchEndTime = Date.now();
              const touchDuration = touchEndTime - folderDragStartTime.value;
              
              // Calculate movement
              const touch = endEvent.changedTouches[0];
              const moveX = Math.abs(touch.clientX - folderDragStartX.value);
              const moveY = Math.abs(touch.clientY - folderDragStartY.value);
              
              // If it was a short touch without much movement, treat as click
              if (touchDuration < 500 && moveX < 10 && moveY < 10) {
                handleFolderItemClick(item);
              }
              
              document.removeEventListener('touchend', handleTouchEnd);
            };

            document.addEventListener('touchend', handleTouchEnd);
          }

          // Only prevent default in edit mode
          if (isEditMode.value) {
            event.preventDefault();
          }
        };

        const handleFolderMouseMove = (event) => {
          if (isEditMode.value && isFolderMouseDown.value) {
            const currentX = event.clientX;
            const currentY = event.clientY;
            const distance = Math.sqrt(Math.pow(currentX - folderDragStartX.value, 2) + Math.pow(currentY - folderDragStartY.value, 2));
            const timeDiff = Date.now() - folderDragStartTime.value;

            if (!isFolderDragging.value && (distance > dragThreshold || timeDiff > 500)) {
              startFolderDrag(event);
            }
            if (isFolderDragging.value) {
              moveFolderDraggedElement(currentX, currentY);
            }
          }
        };

        const handleFolderTouchMove = (event) => {
          if (isEditMode.value && isFolderMouseDown.value) {
            const currentX = event.touches[0].clientX;
            const currentY = event.touches[0].clientY;
            const distance = Math.sqrt(Math.pow(currentX - folderDragStartX.value, 2) + Math.pow(currentY - folderDragStartY.value, 2));
            const timeDiff = Date.now() - folderDragStartTime.value;

            if (!isFolderDragging.value && (distance > dragThreshold || timeDiff > 500)) {
              startFolderDrag(event);
            }

            if (isFolderDragging.value) {
              moveFolderDraggedElement(currentX, currentY);
              event.preventDefault(); // Prevent scrolling while dragging
            }
          }
        };

        const handleFolderMouseUp = (event) => {
          //[DEBUG]
          console.log('[handleFolderMouseUp] TRIGGERED');
          isFolderMouseDown.value = false;
          if (isFolderDragging.value) {
            //[DEBUG] LOGGING DRAGGED ITEM
            console.log('[handleFolderMouseUp] Dropped.');
            endFolderDrag(event);
          }
          document.removeEventListener('mousemove', handleFolderMouseMove);
          document.removeEventListener('mouseup', handleFolderMouseUp);
        };

        const handleFolderTouchEnd = (event) => {
          //[DEBUG]
          console.log('[handleFolderTouchEnd] TRIGGERED');

          isFolderMouseDown.value = false;
          if (isFolderDragging.value) {
            endFolderDrag(event);
          }
          document.removeEventListener('touchmove', handleFolderTouchMove);
          document.removeEventListener('touchend', handleFolderTouchEnd);
        };

        const startFolderDrag = () => {
          //[DEBUG]
          console.log('[startFolderDrag] TRIGGERED');
          isFolderDragging.value = true;
          folderDraggedElement.value.classList.add('dragging');

          // Create ghost item (placeholder)
          folderGhostItem.value = folderDraggedElement.value.cloneNode(true);
          folderGhostItem.value.classList.add('placeholder');
          folderGhostItem.value.style.opacity = '0.5';
          folderGhostItem.value.style.pointerEvents = 'none';

          // Insert ghost item at the original position
          folderDraggedElement.value.parentNode.insertBefore(folderGhostItem.value, folderDraggedElement.value);

          document.body.appendChild(folderDraggedElement.value);

          //[DEBUG]
          console.log('[startFolderDrag] Folder Drag Started Index: '+folderDragStartIndex.value);
          console.log('[startFolderDrag] Initial Folder-Items-Order : ' + formatItemList(folderPages.value));
        };

        const moveFolderDraggedElement = (mouseX, mouseY) => {
          if (!folderDraggedElement.value) return;

          folderDraggedElement.value.style.position = 'fixed';
          folderDraggedElement.value.style.zIndex = '1000';
          folderDraggedElement.value.style.left = `${mouseX - folderDragOffset.value.x}px`;
          folderDraggedElement.value.style.top = `${mouseY - folderDragOffset.value.y}px`;

          // NEW LOGIC: Detect if the cursor is over the folder exit area
          const folderExitAreaElement = document.querySelector('.folder-exit-area');
          if (folderExitAreaElement) {
            const exitAreaRect = folderExitAreaElement.getBoundingClientRect();
            const isOverExitArea = mouseX >= exitAreaRect.left && mouseX <= exitAreaRect.right &&
                                  mouseY >= exitAreaRect.top && mouseY <= exitAreaRect.bottom;

            if (isOverExitArea && !isDraggingOutOfFolder.value) {
              isDraggingOutOfFolder.value = true;
              //[DEBUG]
              //console.log('[moveFolderDraggedElement] Cursor over exit area, starting folder close timer');
              startFolderCloseTimer();
            } else if (!isOverExitArea && isDraggingOutOfFolder.value) {
              isDraggingOutOfFolder.value = false;
              //[DEBUG]
              //console.log('[moveFolderDraggedElement] Cursor left exit area, canceling folder close timer');
              cancelFolderCloseTimer();
            }
          }

          //[DEBUG]
          console.log('[moveFolderDraggedElement] Outside of Folder:',isDraggingOutOfFolder.value);

          // Existing logic for edge proximity to trigger page change
          const edgeThreshold = 50; // pixels from edge to trigger page change
          if (mouseX < edgeThreshold) {
            startFolderPageChangeTimer('prev');
          } else if (mouseX > window.innerWidth - edgeThreshold) {
            startFolderPageChangeTimer('next');
          } else {
            cancelFolderPageChangeTimer();
          }
        };

        const endFolderDrag = async (event) => {
          //[DEBUG]
          console.log('[endFolderDrag] TRIGGERED');

          if (isFolderDragging.value && folderDraggedElement.value) {
            const mouseX = event.clientX || event.changedTouches[0].clientX;
            const mouseY = event.clientY || event.changedTouches[0].clientY;

            cancelFolderCloseTimer();

            //COLSE FOLDER AND DROP ITEM IN MIND-GIRD
            if (!showFolder.value) {
              //[DEBUG]
              console.log('[endFolderDrag] DROP OUT OF FOLDER');

              // Remove placeholder
              if (folderGhostItem.value && folderGhostItem.value.parentNode) {
                folderGhostItem.value.parentNode.removeChild(folderGhostItem.value);
              }
              folderGhostItem.value = null;

              // Find the element under the cursor
              const elementUnderCursor = document.elementFromPoint(mouseX, mouseY);
              if (!elementUnderCursor) {
                console.warn('[endDrag] No element found under cursor');
                return;
              }

              const targetMindItem = elementUnderCursor.closest('.mind-Item');

              let targetIndex, targetPage;

              if (targetMindItem) {
                // Remove the item from the folder in state.mindSpacePages
                removeItemFromFolderPages(draggingFolderItem.value);
                console.log("[endFolderDrag/vuex] Removal",store.getters['mindspace/getMindSpacePages']);

                // If we're over an Mind-Item, get its index
                targetPage = parseInt(targetMindItem.closest('.mind-grid').getAttribute('data-page-index1'));
                const itemsInPage = Array.from(targetMindItem.closest('.mind-grid').querySelectorAll('.mind-Item:not(.dragging)'));
                targetIndex = itemsInPage.indexOf(targetMindItem);



                //[DEBUG]
                console.log('[endFolderDrag] target Index: '+targetIndex);

              } else {
                // If we're not over an Mind-Item, find the nearest grid and append to the end
                const nearestGrid = elementUnderCursor.closest('.mind-grid');
                if (nearestGrid) {
                  targetPage = dragStartPageIndex.value;
                  targetIndex = dragStartIndex.value;
                } else {
                  // If we're not over a grid at all, return the item to its original position
                  targetPage = dragStartPageIndex.value;
                  targetIndex = dragStartIndex.value;
                }
              }
              // Remove the temporary dragged element from the body
              if (folderDraggedElement.value && document.body.contains(folderDraggedElement.value)) {
                document.body.removeChild(folderDraggedElement.value);
              }

              if (!isNaN(targetPage) && !isNaN(targetIndex)) {
                //updateItemPosition({ page: targetPage, index: targetIndex });

                await store.dispatch('mindspace/moveItemFromFolderToPage', {
                  folderId: currentFolder.value.id,
                  itemId: draggingFolderItem.value.id,
                  targetPageIndex: targetPage,
                  targetIndex: targetIndex,
                  item: draggingFolderItem.value
                });
              } else {
                console.error('[endDrag] Invalid target position:', { targetPage, targetIndex });
              }
            }
            // DROP IT IN THE FOLDER
            else {

              // Find the element under the cursor
              const elementUnderCursor = document.elementFromPoint(mouseX, mouseY);
              const targetFolderGrid = elementUnderCursor.closest('.folder-grid');
              const targetFolderItem = elementUnderCursor.closest('.folder-item');

              let targetIndex;
              let targetPageIndex;

              if (targetFolderGrid) {
                targetPageIndex = parseInt(targetFolderGrid.getAttribute('data-page-index2'));
                if (targetFolderItem) {
                  const itemsInFolder = Array.from(targetFolderGrid.querySelectorAll('.folder-item:not(.dragging):not(.empty):not(.add-item)'));
                  targetIndex = itemsInFolder.indexOf(targetFolderItem);

                  //[DEBUG]
                  console.log('[endFolderDrag] Folder Drag Ended Index: '+targetIndex);

                  // Adjust target index based on drag direction
                  if (targetIndex < folderDragStartIndex.value && targetPageIndex === folderDragStartPageIndex.value) {
                    targetIndex;
                  } else {
                    targetIndex++;
                  }
                } else {
                  // If not over a folder item, append to the end of the current grid
                  targetIndex = targetFolderGrid.querySelectorAll('.folder-item:not(.dragging):not(.empty):not(.add-item)').length;
                }
              } else {
                // If we're not over an Mind-Item, find the nearest grid and append to the end
                const nearestGrid = elementUnderCursor.closest('.mind-grid');
                if(nearestGrid){
                  const nearestItemsInFolder = Array.from(nearestGrid.querySelectorAll('.folder-item:not(.dragging):not(.empty):not(.add-item)'));
                  targetPageIndex = folderDragStartPageIndex.value;
                  targetIndex = nearestItemsInFolder.indexOf(nearestGrid);
                }else{
                // If not over a folder grid, return to original position
                  targetPageIndex = folderDragStartPageIndex.value;
                  targetIndex = folderDragStartIndex.value;
                }
              }

              // Remove ghost item
              if (folderGhostItem.value && folderGhostItem.value.parentNode) {
                folderGhostItem.value.parentNode.removeChild(folderGhostItem.value);
              }
              folderGhostItem.value = null;

              // Update the item's position in the data structure
              if (!isNaN(targetPageIndex) && !isNaN(targetIndex)) {

                updateFolderItemPosition({ page: targetPageIndex, index: targetIndex });
              } else {
                console.error('[endDrag] Invalid target position:', { targetPageIndex, targetIndex });
              }

              //[DEBUG]
              console.log('[endFolderDrag] Updated Folder-gridItems: ' + formatItemList(folderPages.value));

              // Update the DOM
              // THIS LOGIC IS NEEDED TO RENDER DROP AND DELETING GHOST ITEM PROPERLY
              const folderGrids = document.querySelectorAll('.folder-grid')[targetPageIndex];
              const folderItems = folderGrids.querySelectorAll('.folder-item:not(.dragging):not(.empty):not(.add-item)');
              const addItemButton = folderGrids.querySelector('.add-item');

              if (targetIndex < folderItems.length) {
                folderGrids.insertBefore(folderDraggedElement.value, folderItems[targetIndex]);
              } else if (addItemButton) {
                folderGrids.insertBefore(folderDraggedElement.value, addItemButton);
              } else {
                folderGrids.appendChild(folderDraggedElement.value);
              }
            }

            // Reset styles and clean up
            resetFolderDraggedElementStyle();
            isFolderDragging.value = false;
            draggingFolderItem.value = null;
            folderDraggedElement.value = null;
            folderDragStartIndex.value = null;
            folderDragStartPageIndex.value = null;
            isDragging.value = false;
            isDraggingOutOfFolder.value = false;
          }
          store.dispatch('mindspace/cleanupEmptyPages');
        };

        // Update the existing folder-related functions to work with pages
        // Update folder item position handler
        const updateFolderItemPosition = (newPosition) => {
          console.log('[updateFolderItemPosition] TRIGGERED - Moving to...', newPosition);

          const { page: newPageIndex, index: newItemIndex } = newPosition;
          const oldPageIndex = folderDragStartPageIndex.value;
          const oldItemIndex = folderDragStartIndex.value;

          if (oldPageIndex === newPageIndex) {
            // Reorder within the same folder page
            store.dispatch('mindspace/reorderFolderItems', {
              folderId: currentFolder.value.id,
              fromIndex: oldItemIndex,
              toIndex: newItemIndex
            });
          } else {
            // Move between folder pages
            store.dispatch('mindspace/moveItemBetweenFolders', {
              fromFolderId: currentFolder.value.id,
              toFolderId: currentFolder.value.id, // Same folder, different pages
              fromIndex: oldItemIndex + (oldPageIndex * ITEMS_PER_FOLDER_PAGE),
              toIndex: newItemIndex + (newPageIndex * ITEMS_PER_FOLDER_PAGE)
            });
          }

          // Ensure the current folder page is updated if necessary
          if (newPageIndex !== currentFolderPage.value) {
            currentFolderPage.value = newPageIndex;
          }

          // Use nextTick to ensure DOM updates after all data changes
          nextTick(() => {
            console.log(`[updateFolderItemPosition] Folder item moved to page ${newPageIndex}, End-index ${newItemIndex}`);
            console.log('[updateFolderItemPosition] Updated folder structure:', currentFolder.value);
          });
        };

        // Helper function to remove item from folder pages
        const removeItemFromFolderPages = (item) => {
          console.log('[removeItemFromFolderPages] TRIGGERED', item);

          if (!item || !item.id) {
            console.error('Invalid item provided to removeItemFromFolderPages');
            return;
          }

          if (currentFolder.value) {
            store.dispatch('mindspace/removeItemFromFolder', {
              folderId: currentFolder.value.id,
              itemId: item.id
            });
          } else {
            console.warn('[removeItemFromFolderPages] currentFolder is null or undefined, unable to remove item');
          }
        };

        const resetFolderDraggedElementStyle = () => {
          if (folderDraggedElement.value) {
            folderDraggedElement.value.style.position = '';
            folderDraggedElement.value.style.zIndex = '';
            folderDraggedElement.value.style.left = '';
            folderDraggedElement.value.style.top = '';
            folderDraggedElement.value.classList.remove('dragging');
          }
        };

        // Add these new functions
        const startFolderCloseTimer = () => {
          //[DEBUG]
          console.log('[startFolderCloseTimer] TRIGGERED');
          if (folderCloseTimer.value) clearTimeout(folderCloseTimer.value);
          folderCloseTimer.value = setTimeout(() => {
            //[DEBUG]
            console.log('[startFolderCloseTimer] Closing folder');
            closeFolder();
          }, 500); // Adjust this delay as needed
        };

        const cancelFolderCloseTimer = () => {
          //[DEBUG]
          console.log('[cancelFolderCloseTimer] TRIGGERED');
          if (folderCloseTimer.value) {
            clearTimeout(folderCloseTimer.value);
            folderCloseTimer.value = null;
            //[DEBUG]
            console.log('[cancelFolderCloseTimer] Folder close timer canceled');
          }
        };

        const getEmptySlotCount = (page) => {
          if (!page?.items) return 0;
          const itemCount = page.items.length;
          const hasAddButton = itemCount < ITEMS_PER_FOLDER_PAGE;
          const emptySlots = ITEMS_PER_FOLDER_PAGE - itemCount - (hasAddButton ? 1 : 0);
          return Math.max(0, emptySlots);
        };



        const containerStyle = computed(() => {
            if (background.value.type === 'color') {
                return { backgroundColor: background.value.value1 };
            } else {
                return { backgroundImage: `url(${background.value.value2})` };
            }
        });

        onMounted(async () => {
            if(!currentUser.value) {
              await store.dispatch('mindspace/setUserId');
            }
            updateTime();
            setInterval(updateTime, 60000); // Update time every minute
            initializeFolderPages();
            console.log("[mindspace.vue] CurrentPage:",currentPage.value);
            //PageShiftForTouch
            window.addEventListener('resize', () => {
              pageWidth.value = window.innerWidth;
            });
        });

        return {
          // General UI elements
          currentTime,
          background,
          containerStyle,

          // Mind-Grid related
          //gridItems,
          mindSpacePages,
          currentPage,
          ITEMS_PER_PAGE,
          draggingItem,

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
          showAddItemPopup,
          addItemTarget,  // Make sure to return this
          showAddItemMenu,
          handleAddItemSelection,
          handleItemDelete,

          // Add Item To Folder
          getEmptySlotCount,

          // Mind-Grid Interaction functions
          getBadgeIcon,

          handleItemClick,
          handleMouseDown,
          handleTouchStart,
          handleTouchEnd,  // Add this
          handleTouchMove, // Add this if you're using it directly in template

          exitEditMode,
          startDrag,
          createShadowSvg,

          // Hover Over Folder Functions
          hoveredFolderId,
          handleItemHover,
          handleItemLeave,
          openFolder,

          // Folder related
          showFolder,
          currentFolder,
          draggingFolderItem,
          folderPages,
          currentFolderPage,
          ITEMS_PER_FOLDER_PAGE,

          // Folder functions
          closeFolder,

          initializeFolderPages,
          selectFolderPage,
          startFolderPageChangeTimer,
          cancelFolderPageChangeTimer,
          moveFolderDraggedElement,
          handleFolderItemClick,
          handleFolderMouseDown,
          handleFolderTouchStart,
          updateFolderItemPosition,

          // Utility functions
          formatDate,
        };
      }
    });
  </script>
