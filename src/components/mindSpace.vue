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
    <div class="iphone-container" :style="containerStyle">

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
        <div class="pages-container"
          @touchstart="handleTouchStartForPageShift"
          @touchmove="handleTouchMoveForPageShift"
          @touchend="handleTouchEndForPageShift"
        >
          <div 
            v-for="(page, pageIndex) in mindSpacePages" 
            :key="pageIndex" 
            class="mind-grid" 
            :data-page-index1="pageIndex"
            :style="{ 
              transform: `translateX(${calculateTransform(pageIndex)}px)` ,
              transition: isDraggingForPageShift ? 'none' : 'transform 0.3s ease'
              }"
            @touchstart="handleTouchStartForPageShift"
            @touchmove="handleTouchMoveForPageShift"
            @touchend="handleTouchEndForPageShift"
          >
            <!-- Mind-Item -->
            <div 
              v-for="(item, index) in page" 
              :key="item.id || index" 
              class="mind-Item"
              :data-id="item.id"
            >
            <div class="icon-wrapper"
              :class="{ 
                'dragging': draggingItem === item,
                'folder-hover': item.items && isDragging && hoveredFolderId === item.id
              }"
              @click="handleItemClick(item)"
              @mousedown.prevent="handleMouseDown($event, item, pageIndex, index)"
              @touchstart.prevent="handleTouchStart($event, item, pageIndex, index)"
              @mouseover="handleItemHover(item)"
              @mouseleave="handleItemLeave()"
            >
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
            
            <!-- Add button only on the last page -->
            <div 
              v-if="page.length < ITEMS_PER_PAGE" 
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
      </div>
  
      <!-- Page indicator -->
      <!-- I WANT TO MAKE THIS AS SEPARATE COMPONETNS -->
      <div class="page-indicator">
          <span 
            v-for="(page, index) in mindSpacePages" 
            :key="index" 
            :class="{ active: index === currentPage }"
            @click="selectPage(index)"
          ></span>
      </div>
      
  
      <div 
        v-if="showFolder" 
        class="folder-overlay" 
        @click.self="closeFolder"
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
                v-for="(item, index) in page" 
                :key="item.id || index"
                class="folder-item"
                :data-id="item.id"
              >
                <div class="icon-wrapper"
                  :class="{ 'dragging': draggingFolderItem === item }"
                  @click="handleFolderItemClick(item)"
                  @mousedown.prevent="handleFolderMouseDown($event, item, pageIndex, index)"
                  @touchstart.prevent="handleFolderTouchStart($event, item, pageIndex, index)"
                >
                  <img :src="item.shape" class="icon-shape" :alt="item.name">
                </div>
                <span class="item-name">{{ item.name }}</span>
              </div>
              
              <!-- Add button on every page -->
              <div
                v-if="page.length < ITEMS_PER_FOLDER_PAGE" 
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
            </div>
          </div>
          
          <!-- Folder Page indicator -->
          <div class="folder-page-indicator">
            <span 
              v-for="(page, index) in folderPages" 
              :key="index" 
              :class="{ active: index === currentFolderPage }"
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
    import { formatDate } from '../utility/dateUtils';
    import backgroundImage from '../assets/bg_img.jpg';
    import squareSvg from '../assets/shapes/square.svg';
    //import circleSvg from '../assets/shapes/circle.svg';
    //import octagonSvg from '../assets/shapes/octagon.svg';
    //import cloudSvg from '../assets/shapes/cloud.svg';
    import folderSvg from '../assets/shapes/folder.svg';
    import AddItemPopup from '../components/addItemPopup.vue';
  
    export default defineComponent({
      name: 'iPhoneStyleMaestroUI',
      
      components: {
        AddItemPopup,
      },
      setup(props, { emit }) {
        const store = useStore();
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
        const currentPage = computed(() => store.getters['mindspace/getCurrentPage']);
        const mindSpacePages = computed(() => store.getters['mindspace/getMindSpacePages']);

        // Update page selection to use Vuex
        const selectPage = (index) => {
            store.dispatch('mindspace/setCurrentPage', index);
        };

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
          if (type === 'item') {
            addNewItemImpl(addItemTarget.value, addItemPageIndex.value);
          } else if (type === 'folder') {
            addNewFolderImpl(addItemTarget.value, addItemPageIndex.value);
          }
          showAddItemPopup.value = false;
        };
  
        const addNewItemImpl = (target, pageIndex) => {
          const newItem = {
            id: `item-${Date.now()}`,
            name: 'New Item',
            shape: squareSvg,
            index: target === 'mindSpace' ? mindSpacePages.value[pageIndex].length : folderPages.value[pageIndex].length
          };
  
          if (target === 'mindSpace') {
            // Logic for adding to mindSpacePages
            if (mindSpacePages.value[pageIndex].length === ITEMS_PER_PAGE) {
              mindSpacePages.value.splice(pageIndex + 1, 0, []);
              pageIndex++;
            }
            mindSpacePages.value[pageIndex].push(newItem);
            currentPage.value = pageIndex;
  
            if (mindSpacePages.value[mindSpacePages.value.length - 1].length === ITEMS_PER_PAGE) {
              mindSpacePages.value.push([]);
            }
          } else {
            // Logic for adding to folderPages
            if (folderPages.value[pageIndex].length === ITEMS_PER_FOLDER_PAGE) {
              folderPages.value.splice(pageIndex + 1, 0, []);
              pageIndex++;
            }
            folderPages.value[pageIndex].push(newItem);
            currentFolderPage.value = pageIndex;
  
            if (folderPages.value[pageIndex].length === ITEMS_PER_FOLDER_PAGE &&
                pageIndex === folderPages.value.length - 1) {
              folderPages.value.push([]);
            }
  
            // Update the currentFolder.value
            if (currentFolder.value) {
              currentFolder.value = {
                ...currentFolder.value,
                items: folderPages.value.flat()
              };
            }
  
            // Update the corresponding folder in mindSpacePages
            if (currentFolder.value) {
              mindSpacePages.value = mindSpacePages.value.map(page => 
                page.map(item => {
                  if (item.id === currentFolder.value.id) {
                    return {
                      ...item,
                      items: folderPages.value.flat()
                    };
                  }
                  return item;
                })
              );
            }
          }
  
          // Debug logging
          console.log(`Added new item to ${target}:`, newItem);
          if (target === 'mindSpace') {
            console.log('Updated mindSpacePages:', mindSpacePages.value);
          } else {
            console.log('Updated folderPages:', folderPages.value);
            console.log('Updated currentFolder:', currentFolder.value);
          }
  
          //updateusersMindSpace();
        };
  
        // Function to add a new folder
        const addNewFolderImpl = (target, pageIndex) => {
          const newFolder = {
            id: `f${Date.now()}`,
            name: 'New Folder',
            shape: folderSvg,
            items: []
          };
  
          if (target === 'mindSpace') {
            // Logic for adding to mindSpacePages
            if (mindSpacePages.value[pageIndex].length === ITEMS_PER_PAGE) {
              mindSpacePages.value.splice(pageIndex + 1, 0, []);
              pageIndex++;
            }
            mindSpacePages.value[pageIndex].push(newFolder);
            currentPage.value = pageIndex;
  
            if (mindSpacePages.value[mindSpacePages.value.length - 1].length === ITEMS_PER_PAGE) {
              mindSpacePages.value.push([]);
            }
          } else {
            // Logic for adding to folderPages
            if (folderPages.value[pageIndex].length === ITEMS_PER_FOLDER_PAGE) {
              folderPages.value.splice(pageIndex + 1, 0, []);
              pageIndex++;
            }
            folderPages.value[pageIndex].push(newFolder);
            currentFolderPage.value = pageIndex;
  
            if (folderPages.value[pageIndex].length === ITEMS_PER_FOLDER_PAGE &&
                pageIndex === folderPages.value.length - 1) {
              folderPages.value.push([]);
            }
  
            // Update the currentFolder.value
            if (currentFolder.value) {
              currentFolder.value = {
                ...currentFolder.value,
                items: folderPages.value.flat()
              };
            }
  
            // Update the corresponding folder in mindSpacePages
            if (currentFolder.value) {
              mindSpacePages.value = mindSpacePages.value.map(page => 
                page.map(item => {
                  if (item.id === currentFolder.value.id) {
                    return {
                      ...item,
                      items: folderPages.value.flat()
                    };
                  }
                  return item;
                })
              );
            }
          }
  
          // Debug logging
          console.log(`Added new folder to ${target}:`, newFolder);
          if (target === 'mindSpace') {
            console.log('Updated mindSpacePages:', mindSpacePages.value);
          } else {
            console.log('Updated folderPages:', folderPages.value);
            console.log('Updated currentFolder:', currentFolder.value);
          }
  
          //updateusersMindSpace();
        };
  
        const removeItem = (pageIndex, itemIndex) => {
          mindSpacePages.value[pageIndex].splice(itemIndex, 1);
          
          // Redistribute items from next pages if they exist
          for (let i = pageIndex; i < mindSpacePages.value.length - 1; i++) {
            if (mindSpacePages.value[i].length < ITEMS_PER_PAGE && mindSpacePages.value[i + 1].length > 0) {
              mindSpacePages.value[i].push(mindSpacePages.value[i + 1].shift());
            } else {
              break;
            }
          }
  
          // Remove empty pages, except the last one
          mindSpacePages.value = mindSpacePages.value.filter((page, index) => 
            page.length > 0 || index === mindSpacePages.value.length - 1
          );
  
          // Ensure there's always an empty page at the end if all others are full
          if (mindSpacePages.value[mindSpacePages.value.length - 1].length === ITEMS_PER_PAGE) {
            mindSpacePages.value.push([]);
          }
  
          // Adjust currentPage if necessary
          if (currentPage.value >= mindSpacePages.value.length) {
            currentPage.value = mindSpacePages.value.length - 1;
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
        const isEditMode = ref(false);
        const isMouseDown = ref(false);
        const editModeTimer = ref(null);
        
        const startEditModeTimer = (/*event*/) => {
          if (isEditMode.value) return;
          editModeTimer.value = setTimeout(() => {
            isEditMode.value = true;
          }, 2000);
        };
  
        const cancelEditModeTimer = () => {
            if (editModeTimer.value) {
              clearTimeout(editModeTimer.value);
            }
        };
  
        const exitEditMode = () => {
          isEditMode.value = false;
          isEditMode.value = false;
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
          emit('edit-mode-change', newValue);
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
            return `Page ${pageIndex}: ${page.map(item => item.name).join(', ')}`;
          }).join('\n');
        };
  
        const handleItemClick = (item) => {
          //[DEBUG] 
          console.log('[handleItemClick] Mind-Grid item clicked:', item);
          
          if (item.items) {
            //[DEBUG] 
            console.log('[handleItemClick] Opening folder:', item.name);
            showFolder.value = true;
            currentFolder.value = item;
          } else {
            //[DEBUG] 
            console.log('[handleItemClick] Clicked on non-folder item:', item.name);
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
            console.log('[handleMouseDown] Focus Item: ',draggingItem.value);
  
            // Calculate and store the offset within the dragged element
            const rect = draggedElement.value.getBoundingClientRect();
            dragOffset.value = {
              x: dragStartX.value - rect.left,
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

          store.dispatch('mindspace/cleanupEmptyPages');
          //initializePages();
        };
  
        const handleTouchStart = (event, item, pageIndex, index) => {
          //[DEBUG] 
          console.log('[handleTouchStart] TRIGGERED');
          if (isEditMode.value) {
            isMouseDown.value = true;
            dragStartX.value = event.touches[0].clientX;
            dragStartY.value = event.touches[0].clientY;
            dragStartTime.value = Date.now();
            draggingItem.value = item;
            dragStartIndex.value = index;
            dragStartPageIndex.value = pageIndex;
            
            // Store the dragged element
            draggedElement.value = event.target.closest('.mind-Item');
            
            //[DEBUG] LOGGING DRAGGED ITEM
            console.log('[handleTouchStart] Focus Item: ',draggingItem.value);
  
            // Calculate and store the offset within the dragged element
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
            const distance = Math.sqrt(Math.pow(currentX - dragStartX.value, 2) + Math.pow(currentY - dragStartY.value, 2));
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
          //[DEBUG] 
          console.log('[handleTouchEnd] TRIGGERED');
          isMouseDown.value = false;
          if (isDragging.value) {
            endDrag(event);
          }
          document.removeEventListener('touchmove', handleTouchMove);
          document.removeEventListener('touchend', handleTouchEnd);

          store.dispatch('mindspace/cleanupEmptyPages');
          //initializePages();
        };    
        
        const startDrag = () => {
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
  
          console.log('[startDrag] GridItems Drag Started Index: '+ dragStartIndex.value);
          console.log('[startDrag] Initial Grid-Items-Order : ' + formatItemList(mindSpacePages.value));
        };
  
        const moveDraggedElement = (mouseX, mouseY) => {
          if (!draggedElement.value) return; // Add this check
  
          draggedElement.value.style.position = 'fixed';
          draggedElement.value.style.zIndex = '1000';
          draggedElement.value.style.left = `${mouseX - dragOffset.value.x}px`;
          draggedElement.value.style.top = `${mouseY - dragOffset.value.y}px`;
          
          const elementUnderCursor = document.elementFromPoint(mouseX, mouseY);
          
          // Add null check for elementUnderCursor
          if (elementUnderCursor) {
            const folderItem = elementUnderCursor.closest('.mind-Item');
  
            if (folderItem) {
              const folderId = folderItem.getAttribute('data-id');
              console.log(folderId);
              const folder = mindSpacePages.value.flat().find(item => item.id === folderId && item.items);
              if (folder) {
                handleItemHover(folder);
              } else {
                handleItemLeave();
              }
            } else {
              handleItemLeave();
            }
          } else {
            // Handle the case when the cursor is outside the browser window
            handleItemLeave();
          }
  
          // Check for edge proximity to trigger page change
          const edgeThreshold = 50; // pixels from edge to trigger page change
          if (mouseX < edgeThreshold) {
            startPageChangeTimer('prev');
          } else if (mouseX > window.innerWidth - edgeThreshold) {
            startPageChangeTimer('next');
          } else {
            cancelPageChangeTimer();
          }
        };
  
        // Only touches UI/ DOM Manipulation
        const endDrag = (event) => {
          //DEBUG
          console.log('[endDrag] TRIGGERED'); 
  
          if (isDragging.value && draggedElement.value) {
            const mouseX = event.clientX || event.changedTouches[0].clientX;
            const mouseY = event.clientY || event.changedTouches[0].clientY;
            
            clearFolderHoverTimer();
  
            //OPEN FOLDER AND DROP ITEM
            if (showFolder.value) {
              // Remove placeholder
              if (ghostItem.value && ghostItem.value.parentNode) {
                ghostItem.value.parentNode.removeChild(ghostItem.value);
              }
              ghostItem.value = null;
  
              // Drop the item into the open folder
              const folderGrid = document.querySelector('.folder-grid');
  
              if (folderGrid) {
                //const targetIndex = folderGrid.children.length;
                currentFolder.value.items.push(draggingItem.value);
                //updateFolderItemPosition({ page: 0, index: targetIndex });
                removeItemFromMindSpacePages(draggingItem.value);
                initializeFolderPages();
              }
            } 
            //DROP AT Mind-GIRD
            else{
            // Find the element under the cursor
              const elementUnderCursor = document.elementFromPoint(mouseX, mouseY);
              const targetMindItem = elementUnderCursor.closest('.mind-Item');
  
              let targetIndex, targetPage;
  
              if (targetMindItem) {
                // If we're over an Mind-Item, get its index
                targetPage = parseInt(targetMindItem.closest('.mind-grid').getAttribute('data-page-index1'));
                const itemsInPage = Array.from(targetMindItem.closest('.mind-grid').querySelectorAll('.mind-Item:not(.dragging)'));
                targetIndex = itemsInPage.indexOf(targetMindItem);
  
                console.log('[endDrag] target Index: '+targetIndex);
  
                // Insert before the target item when the item moved right
                if(targetIndex < dragStartIndex.value && targetPage === dragStartPageIndex.value){
                  targetIndex;
                }else{
                  targetIndex++;
                }
                
              } else {
                // If we're not over an Mind-Item, find the nearest grid and append to the end
                const nearestGrid = elementUnderCursor.closest('.mind-grid');
                if (nearestGrid) {
                  //targetPage = parseInt(nearestGrid.getAttribute('data-page-index'));
                  //targetIndex = nearestGrid.querySelectorAll('.mind-Item:not(.dragging)').length;
                  targetPage = dragStartPageIndex.value;
                  targetIndex = dragStartIndex.value;
                } else {
                  // If we're not over a grid at all, return the item to its original position
                  targetPage = dragStartPageIndex.value;
                  targetIndex = dragStartIndex.value;
                }
              }
              // Remove placeholder
              if (ghostItem.value && ghostItem.value.parentNode) {
                ghostItem.value.parentNode.removeChild(ghostItem.value);
              }
              ghostItem.value = null;
  
              // Update the item's position in the data structure
              updateItemPosition({ page: targetPage, index: targetIndex });
  
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
            
            // Reset styles and clean up
            resetDraggedElementStyle();
            isDragging.value = false;
            draggingItem.value = null;
            draggedElement.value = null;
            dragStartIndex.value = null;
            dragStartPageIndex.value = null;
  
            console.log('[endDrag] GridItems Drag Ended Index: ' + formatItemList(mindSpacePages.value));
          }

          
        };
  
        const updateItemPosition = (newPosition) => {
          console.log('[updateItemPosition] TRIGGERED - Moving to...', newPosition);
  
          const { page: newPageIndex, index: newItemIndex } = newPosition;
  
          // Check if mindSpacePages is properly initialized
          if (!Array.isArray(mindSpacePages.value) || mindSpacePages.value.length === 0) {
            console.error('[updateItemPosition] mindSpacePages is not properly initialized');
            return;
          }
  
          // Create a new array to trigger reactivity
          const updatedMindSpacePages = [...mindSpacePages.value];
  
          let movedItem;
  
          // Check if we're moving from a folder (dragStartPageIndex will be null)
          if (dragStartPageIndex.value === null) {
            console.log('[updateItemPosition] Moving item from folder to Mind-Grid');
            // In this case, we're adding a new item to the Mind-Grid
            movedItem = draggingFolderItem.value; // Assuming draggingFolderItem contains the item being moved
            console.log('[updateItemPosition] Moved item from folder:', movedItem);
          } else {
            console.log('[updateItemPosition] Moving items within the Mind-Grid.');
            // We're moving within the Mind-Grid
            const oldPageIndex = dragStartPageIndex.value;
            const oldItemIndex = dragStartIndex.value;
  
            if (oldPageIndex === newPageIndex && oldItemIndex === newItemIndex) {
              console.log('[updateItemPosition] Item dropped at original position, no changes needed.');
              return;
            }
  
            if (!updatedMindSpacePages[oldPageIndex]) {
              console.error(`[updateItemPosition] Old page index ${oldPageIndex} does not exist`);
              return;
            }
  
            // Remove the item from its original position
            [movedItem] = updatedMindSpacePages[oldPageIndex].splice(oldItemIndex, 1);
          }
  
          if (!movedItem) {
            console.error('[updateItemPosition] Failed to get item to move');
            return;
          }
  
          console.log('[updateItemPosition] MovedItem: ', movedItem);
  
          // Insert the item at its new position
          while (updatedMindSpacePages.length <= newPageIndex) {
            updatedMindSpacePages.push([]);
          }
          updatedMindSpacePages[newPageIndex].splice(newItemIndex, 0, movedItem);
  
          // Remove empty pages, except the last one
          for (let i = updatedMindSpacePages.length - 2; i >= 0; i--) {
            if (updatedMindSpacePages[i].length === 0) {
              updatedMindSpacePages.splice(i, 1);
            }
          }
  
          // Ensure there's always an empty page at the end if all others are full
          if (updatedMindSpacePages[updatedMindSpacePages.length - 1].length === ITEMS_PER_PAGE - 1) {
            updatedMindSpacePages.push([]);
          }
  
          // Update the indices of items in all pages
          updatedMindSpacePages.forEach((page, pageIndex) => {
            page.forEach((item, index) => {
              if (item.id) {
                item.index = pageIndex * ITEMS_PER_PAGE + index;
              }
            });
          });
  
          // Update the reactive references
          mindSpacePages.value = updatedMindSpacePages;
          console.log('[updateItemPosition] mindSpacePages is Updadate.');
  
  
          // Ensure the current page is updated if necessary
          if (newPageIndex !== currentPage.value) {
            currentPage.value = newPageIndex;
          }
  
          // Use nextTick to ensure DOM updates after all data changes
          nextTick(() => {
            console.log(`[updateItemPosition] Mind-Item moved to page ${newPageIndex}, End-index ${newItemIndex}`);
          });
          
          //Update usersMindSpace.
          console.log('[updateItemPosition] Initiate updating usersMindSpace with,', mindSpacePages.value);
          //updateusersMindSpace();
        };
        
        const removeItemFromMindSpacePages = (item) => {
          //[DEBUG]
          console.log('[removeItemFromMindSpacePages] TRIGGERED');
          mindSpacePages.value = mindSpacePages.value.map(page => page.filter(i => i !== item));
          //[DEBUG]
          console.log('[removeItemFromMindSpacePages] Item removed from Mind pages', item);
        };
  
        const removeItemFromFolderPages = (item) => {
          //[DEBUG]
          console.log('[removeItemFromFolderPages] TRIGGERED', item);
  
          if (!item || !item.id) {
            //[DEBUG]
            console.error('Invalid item provided to removeItemFromFolderPages');
            return;
          }
  
          let itemRemoved = false;
          const updatedFolderPages = folderPages.value.map(page => {
            const updatedPage = page.filter(i => i.id !== item.id);
            if (updatedPage.length !== page.length) {
              itemRemoved = true;
            }
            return updatedPage;
          });
  
          if (!itemRemoved) {
            //[DEBUG]
            console.warn('[removeItemFromFolderPages] Item not found in folder pages', item);
            return;
          }
  
          // Remove any empty pages, except the last one
          while (updatedFolderPages.length > 1 && updatedFolderPages[updatedFolderPages.length - 2].length === 0) {
            updatedFolderPages.pop();
          }
  
          // Ensure there's always at least one page, even if it's empty
          if (updatedFolderPages.length === 0) {
            updatedFolderPages.push([]);
          }
  
          // Update the reactive references
          folderPages.value = updatedFolderPages;
  
          // Update the currentFolder.items
          if (currentFolder.value) {
            currentFolder.value.items = updatedFolderPages.flat();
          } else {
            //[DEBUG]
            console.warn('[removeItemFromFolderPages] currentFolder is null or undefined, unable to update items');
          }
          //[DEBUG]
          console.log('[removeItemFromFolderPages] Item removed from folder pages', item);
          console.log('[removeItemFromFolderPages] Updated folder pages', folderPages.value);
        };
  
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
        const hoveredFolderId = ref(null);
        const folderHoverTimer = ref(null);
  
        const handleItemHover = (item) => {
          if (isDragging.value && item.items) {
            hoveredFolderId.value = item.id;
            startFolderHoverTimer(item);
          }
        };
  
        const handleItemLeave = () => {
          hoveredFolderId.value = null;
          clearFolderHoverTimer();
        };
  
        const startFolderHoverTimer = (folder) => {
          clearFolderHoverTimer();
          folderHoverTimer.value = setTimeout(() => {
            openFolder(folder);
          }, 1000);
        };
  
        const clearFolderHoverTimer = () => {
          if (folderHoverTimer.value) {
            clearTimeout(folderHoverTimer.value);
            folderHoverTimer.value = null;
          }
        };
  
        //[Folder] Show Handler
        const showFolder = ref(false);
  
        //[Folder] Get opened folder Items
        const currentFolder = ref(null);
  
        //[Folder] Function to open or close a folder
        const openFolder = (folder) => {
          //[DEBUG]
          console.log('[openFolder] TRIGGERED');
          showFolder.value = true;
          currentFolder.value = folder;
          //initializeFolderPages();
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
        const ITEMS_PER_FOLDER_PAGE = 16; // Adjust this value based on your folder layout
        const folderPages = ref([]);
        const currentFolderPage = ref(0);
  
        // Initialize folder pages
        const initializeFolderPages = () => {
          //[DEBUG]
          console.log('[initializeFolderPages] TRIGGERED');
          
          if (!currentFolder.value || !Array.isArray(currentFolder.value.items)) {
            console.log('Current folder is invalid or has no items. Initializing with an empty page.');
            folderPages.value = [[]];
            return;
          }
  
          folderPages.value = [];
          let currentPageHolder = [];
  
          currentFolder.value.items.forEach((item, index) => {
            currentPageHolder.push(item);
            
            if ((index + 1) % ITEMS_PER_FOLDER_PAGE === 0) {
              folderPages.value.push(currentPageHolder);
              currentPageHolder = [];
            }
          });
  
          // Add the last page if it has any items
          if (currentPageHolder.length > 0) {
            folderPages.value.push(currentPageHolder);
          }
  
          // Always ensure there's an empty page at the end if all others are full
          if (folderPages.value.length === 0 || folderPages.value[folderPages.value.length - 1].length === ITEMS_PER_FOLDER_PAGE) {
            folderPages.value.push([]);
          }
  
          //[DEBUG]
          console.log(`[initializeFolderPages] Folder pages initialized. Total pages: ${folderPages.value.length}`);
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
        });
  
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
  
  
        const handleFolderItemClick = (item) => {
          //[DEBUG]
          console.log('[handleFolderItemClick] Folder item clicked: ', item);
          // Implement additional functionality as needed
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
            dragStartPageIndex.value = null;
            dragStartIndex.value = null;
  
            isFolderMouseDown.value = true;
            folderDragStartX.value = event.clientX;
            folderDragStartY.value = event.clientY;
            folderDragStartTime.value = Date.now();
            draggingFolderItem.value = item;
            folderDragStartIndex.value = index;
            folderDragStartPageIndex.value = pageIndex;
            folderDragStartIndex.value = index;
  
            //[DEBUG] LOGGING DRAGGED ITEM
            console.log('[handleFolderMouseDown] Focus Item: ',draggingFolderItem.value);
            
            // Store the dragged element
            folderDraggedElement.value = event.target.closest('.folder-item');
  
            // Calculate and store the offset within the dragged element
            //console.log('About to start getBoundingClientRect');
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
          if (isEditMode.value) {
            isFolderMouseDown.value = true;
            folderDragStartX.value = event.touches[0].clientX;
            folderDragStartY.value = event.touches[0].clientY;
            folderDragStartTime.value = Date.now();
            draggingFolderItem.value = item;
            folderDragStartIndex.value = index;
            folderDragStartPageIndex.value = pageIndex;
            folderDragStartIndex.value = index;
  
            //[DEBUG] LOGGING DRAGGED ITEM
            console.log('[handleFolderTouchStart] Focus Item: ',draggingFolderItem.value)
            
            // Store the dragged element
            folderDraggedElement.value = event.target.closest('.folder-item');
  
            // Calculate and store the offset within the dragged element
            const rect = folderDraggedElement.value.getBoundingClientRect();
            folderDragOffset.value = {
              x: folderDragStartX.value - rect.left,
              y: folderDragStartY.value - rect.top
            };
  
            document.addEventListener('touchmove', handleFolderTouchMove, { passive: false });
            document.addEventListener('touchend', handleFolderTouchEnd);
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
              const touch = event.touches[0];
              moveFolderDraggedElement(touch.currentX, touch.currentY);
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
          
          //if (!isFolderDragging.value || !showFolder.value) return;
  
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
  
        const endFolderDrag = (event) => {
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
              // Logic for dropping the item in the Mind-Grid
              // Find the element under the cursor
  
              // Remove placeholder
              if (folderGhostItem.value && folderGhostItem.value.parentNode) {
                folderGhostItem.value.parentNode.removeChild(folderGhostItem.value);
              }
              folderGhostItem.value = null;
  
              
              const elementUnderCursor = document.elementFromPoint(mouseX, mouseY);
              const targetMindItem = elementUnderCursor.closest('.mind-Item');
  
              let targetIndex, targetPage;
  
              if (targetMindItem) {              
                // Remove the item from the folder
                removeItemFromFolderPages(draggingFolderItem.value);
                
                // If we're over an Mind-Item, get its index
                targetPage = parseInt(targetMindItem.closest('.mind-grid').getAttribute('data-page-index1'));
                const itemsInPage = Array.from(targetMindItem.closest('.mind-grid').querySelectorAll('.mind-Item:not(.dragging)'));
                targetIndex = itemsInPage.indexOf(targetMindItem);
  
                //[DEBUG] 
                console.log('[endFolderDrag] target Index: '+targetIndex);
                //initializePages();
                
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
  
              updateItemPosition({ page: targetPage, index: targetIndex });
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
              updateFolderItemPosition({ page: targetPageIndex, index: targetIndex });
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
        };
  
        // Update the existing folder-related functions to work with pages
        const updateFolderItemPosition = (newPosition) => {
          //[DEBUG]
          console.log('[updateFolderItemPosition] TRIGGERED - Moving to...', newPosition);
  
          const { page: newPageIndex, index: newItemIndex } = newPosition;
          const oldPageIndex = folderDragStartPageIndex.value;
          const oldItemIndex = folderDragStartIndex.value;
  
          // Check if folderPages is properly initialized
          if (!Array.isArray(folderPages.value) || folderPages.value.length === 0) {
            //[DEBUG] 
            console.error('[updateFolderItemPosition] folderPages is not properly initialized');
            return;
          }
  
          // If the item hasn't moved, do nothing
          if (oldPageIndex === newPageIndex && oldItemIndex === newItemIndex) {
            //[DEBUG] 
            console.log('[updateFolderItemPosition] Item dropped at original position, no changes needed.');
            return;
          }
  
          // Check if the old page exists
          if (!folderPages.value[oldPageIndex]) {
            //[DEBUG] 
            console.error(`[updateFolderItemPosition] Old page index ${oldPageIndex} does not exist`);
            return;
          }
  
          // Create a new array to trigger reactivity
          const updatedFolderPages = [...folderPages.value];
  
          // Remove the item from its original position
          const [movedItem] = updatedFolderPages[oldPageIndex].splice(oldItemIndex, 1);
  
          if (!movedItem) {
            //[DEBUG] 
            console.error('[updateFolderItemPosition] Failed to remove item from original position');
            return;
          }
  
          // Insert the item at its new position
          if (!updatedFolderPages[newPageIndex]) {
            updatedFolderPages[newPageIndex] = [];
          }
          updatedFolderPages[newPageIndex].splice(newItemIndex, 0, movedItem);
  
          // Remove empty pages, except the last one
          for (let i = updatedFolderPages.length - 2; i >= 0; i--) {
            if (updatedFolderPages[i].length === 0) {
              updatedFolderPages.splice(i, 1);
            }
          }
  
          // Ensure there's always an empty page at the end if all others are full
          if (updatedFolderPages[updatedFolderPages.length - 1].length === ITEMS_PER_FOLDER_PAGE) {
            updatedFolderPages.push([]);
          }
  
          // Update the indices of items in all pages based on id
          updatedFolderPages.forEach((page, pageIndex) => {
            page.forEach((item, index) => {
              if (item.id) {
                item.index = pageIndex * ITEMS_PER_FOLDER_PAGE + index;
              }
            });
          });
  
          // Update the reactive references
          folderPages.value = updatedFolderPages;
          console.log('[updateFolderItemPosition] folderPages is Updadate.');
          
  
          // Check if currentFolder exists before updating its items
          if (currentFolder.value) {
            currentFolder.value.items = updatedFolderPages.flat();
          } else {
            console.warn('[updateFolderItemPosition] currentFolder is null or undefined, skipping item update');
          }
  
          // Ensure the current page is updated if necessary
          if (newPageIndex !== currentFolderPage.value) {
            currentFolderPage.value = newPageIndex;
          }
  
          // Use nextTick to ensure DOM updates after all data changes
          nextTick(() => {
            console.log(`[updateFolderItemPosition] Folder item moved from page ${oldPageIndex}, Start-index ${oldItemIndex} to page ${newPageIndex}, End-index ${newItemIndex}`);
          });
  
          //Update usersMindSpace.
          console.log('[updateItemPosition] Initiate updating usersMindSpace with,', folderPages.value);
          
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
  
        
  
        const containerStyle = computed(() => {
            if (background.value.type === 'color') {
                return { backgroundColor: background.value.value1 };
            } else {
                return { backgroundImage: `url(${background.value.value2})` };
            }
        });
  
        onMounted(() => {
            updateTime();
            setInterval(updateTime, 60000); // Update time every minute
            initializeFolderPages();
            console.log("[mindspace.vue] :",currentPage.value);

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
  
          // addNewItem,
          showAddItemPopup,
          addItemTarget,  // Make sure to return this
          showAddItemMenu,
          handleAddItemSelection,
  
          // Mind-Grid functions
          removeItem,
          selectPage,
          getBadgeIcon,
          handleItemClick,
          handleMouseDown,
          handleTouchStart,
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
          //addItemToFolder,
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