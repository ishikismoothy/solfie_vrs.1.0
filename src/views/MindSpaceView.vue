<!-- STILL WORKING ON THE FUNCTION FOR ADDING NEW APP GRID PAGE -->
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
    <div class="status-bar">
      <span class="time">{{ currentTime }}</span>
      <div class="status-icons">
        <i class="fas fa-signal"></i>
        <i class="fas fa-wifi"></i>
        <i class="fas fa-battery-full"></i>
      </div>
    </div>

    <!-- <header>
        <div class="profile-icon">
          <i class="fas fa-user-circle"></i>
        </div>
        <div class="title">
          <h1>The Maestro - 巨匠</h1>
          <p>updated : 2024-10-12 9:00AM</p>
        </div>
        <div class="note-icon">
          <i class="fas fa-sticky-note"></i>
        </div>
    </header> -->
    
    <!-- [ ↓↓↓ CURRENTLY WORKING ON ↓↓↓ ] -->
    <!-- UPDATED 2024/09/10 18:07 -->

    <!-- App grid container -->
    <div 
      class="app-grid-container" 
      @touchstart="touchStart"
      @touchmove="touchMove"
      @touchend="touchEnd"
      @mousedown="startEditModeTimer"
      @mouseup="cancelEditModeTimer"
      @mouseleave="cancelEditModeTimer"
    >
      <!-- Edit mode overlay -->
      <div v-if="isEditMode" class="edit-mode-overlay"></div>
      
      <!-- App-Grid -->
      <div 
        v-for="(page, pageIndex) in appPages" 
        :key="pageIndex" 
        class="app-grid" 
        :data-page-index1="pageIndex"
        :style="{ transform: `translateX(${(pageIndex - currentPage) * 100}%)` }"
      >
        <!-- App-Item -->
        <div 
          v-for="(item, index) in page" 
          :key="item.id || index" 
          class="app-item"
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
          class="app-item add-item" 
          @click="showAddItemMenu('app', pageIndex)"
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

    <!-- Page indicator -->
    <div class="page-indicator">
        <span 
          v-for="(page, index) in appPages" 
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

    <ChatBox />

  </div>

</template>

<script>
  import { defineComponent, ref, computed, onMounted, watch, nextTick } from 'vue';
  import { useStore } from 'vuex';
  import { formatDate } from '../utility/dateUtils';
  import solfieJournalIcon from '../assets/icons/journalIcon.svg';
  import solfieEventIcon from '../assets/icons/eventIcon.svg';
  import solfieSquareIcon from '../assets/icons/squareIcon.svg';
  import statusIcon from '../assets/icons/statusIcon.svg';
  import backgroundImage from '../assets/bg_img.jpg';
  import squareSvg from '../assets/shapes/square.svg';
  import circleSvg from '../assets/shapes/circle.svg';
  import octagonSvg from '../assets/shapes/octagon.svg';
  import cloudSvg from '../assets/shapes/cloud.svg';
  import folderSvg from '../assets/shapes/folder.svg';
  import AddItemPopup from '../components/addItemPopup.vue';
  import ChatBox from '@/components/chatBox.vue';

  export default defineComponent({
    name: 'iPhoneStyleMaestroUI',
    
    components: {
      AddItemPopup,
      ChatBox,
    },
    setup() {
      const store = useStore();
      const currentTime = ref('');
      
      //[BACKGROUND]
      const background = ref({
        type: 'image',
        value1: '#f0f0f0',
        value2: backgroundImage
      });

      //[DOCK]
      const dockApps = ref([
        { name: 'Solfie Journal', svg: solfieJournalIcon, label: 'Solfie Journal' },
        { name: 'Solfie Events', svg: solfieEventIcon, label: 'Solfie Events' },
        { name: 'Solfie Square', svg: solfieSquareIcon, label: 'Solfie Square' },
        { name: 'Status', svg: statusIcon, label: 'Status' },
      ]);

      //[APP-GRID-CONTAINER] APP-GRID-PAGE
      // New refs for rearrangement feature
      const touchStartX = ref(0);
      const usersAppSpace = ref([
        [
          { id:'0000', name: '0', shape: circleSvg },
          { id:'0001', name: '1', shape: cloudSvg },
          { id:'0002', name: '2', shape: squareSvg },
          { id:'0003', name: '3', shape: octagonSvg, badge: 'lightblue' },
          { id:'0004', name: '4', shape: circleSvg },
          { id:'0005', name: '5', shape: cloudSvg },
          { id:'0006', name: '6', shape: cloudSvg },
          { id:'0007', name: '7', shape: cloudSvg },
          { id:'0008', name: '9', shape: cloudSvg },
          { 
            id:'f0009',
            name: 'フォルダー1', 
            shape: folderSvg, 
            items: [
              { id:'0009', name: 'Item 1', shape: circleSvg },
              { id:'0010', name: 'Item 2', shape: squareSvg },
              { id:'0011', name: 'Item 3', shape: cloudSvg },
              { id:'0012', name: 'Item 4', shape: octagonSvg },
              { id:'0013', name: 'Item 5', shape: circleSvg },
              { id:'0014', name: 'Item 6', shape: squareSvg },
              { id:'0015', name: 'Item 7', shape: cloudSvg },
              { id:'0016', name: 'Item 8', shape: octagonSvg },
            ]
          },
          { 
            id:'f0010',
            name: 'フォルダー2', 
            shape: folderSvg, 
            items: [
              { id:'0017', name: 'Item 9', shape: circleSvg },
              { id:'0018', name: 'Item 10', shape: squareSvg },
              { id:'0019', name: 'Item 11', shape: cloudSvg },
              { id:'0020', name: 'Item 12', shape: octagonSvg },
              { id:'0021', name: 'Item 13', shape: circleSvg },
              { id:'0022', name: 'Item 14', shape: squareSvg },
              { id:'0023', name: 'Item 15', shape: cloudSvg },
              { id:'0024', name: 'Item 16', shape: octagonSvg },
            ]
          },
        ],
        [
          { id:'0009', name: '0', shape: circleSvg },
          { id:'0010', name: '1', shape: cloudSvg },
          { id:'0011', name: '2', shape: squareSvg },
          { id:'0012', name: '3', shape: octagonSvg, badge: 'lightblue' },
          { id:'0013', name: '4', shape: circleSvg },
          { id:'0014', name: '5', shape: cloudSvg },
          { id:'0015', name: '6', shape: cloudSvg },
          { id:'0016', name: '7', shape: cloudSvg },
          { id:'0017', name: '9', shape: cloudSvg },
        ]
      ]);

      // Helper function to update usersAppSpace
      const updateUsersAppSpace = () => {
        //[DEBUG] 
        console.log('[updateUsersAppSpace] TRIGGERD');
        
        // If usersAppSpace is a flat array
        if (!Array.isArray(usersAppSpace.value[0])) {
          usersAppSpace.value = appPages.value;
          //[DEBUG] 
          console.log('[updateUsersAppSpace] Current usersAppSpace: ',usersAppSpace.value);
        } 
        // If usersAppSpace is an array of arrays
        else {
          usersAppSpace.value = [...appPages.value];
          //[DEBUG] 
          console.log('[updateUsersAppSpace] Current usersAppSpace: ',usersAppSpace.value);
        }
        //[DEBUG] 
        console.log('[updateUsersAppSpace] Updated usersAppSpace: ', usersAppSpace.value);
      };

      /* const gridItems = ref([
        { id:'000', name: '魂を癒す', shape: circleSvg, badge: 'lightblue' },
        { id:'001', name: '選択01', shape: circleSvg },
        { id:'002', name: '勇気', shape: cloudSvg, badge: 'lightblue' },
        { id:'003', name: '先人の言葉', shape: cloudSvg, badge: 'lightblue' },
        { id:'004', name: 'ビジョン', shape: squareSvg },
        { id:'005',name: '活動', shape: squareSvg, badge: 'pink' },
        { id:'006', name: '姿', shape: squareSvg, badge: 'green' },
        { id:'007', name: '環境', shape: squareSvg },
        { id:'008', name: '母の影響', shape: octagonSvg, badge: 'red' },
        { id:'009', name: '恐怖', shape: octagonSvg, badge: 'red' },
        { id:'010', name: '座右の銘', shape: cloudSvg },
        { id:'011', name: '想像的選択', shape: cloudSvg, badge: 'lightblue' },
        { id:'012', name: '現状を活かす', shape: cloudSvg, badge: 'lightblue' },
        { id:'013', name: '大切・練磨', shape: circleSvg },
        { id:'014', name: '選択提案', shape: circleSvg, badge: 'yellow' },
        { id:'015', name: '選択共有', shape: circleSvg, badge: 'green' },
        { 
          id:'f0001',
          name: 'フォルダー', 
          shape: folderSvg, 
          items: [
            { id:'016', name: 'Item 1', shape: circleSvg },
            { id:'017', name: 'Item 2', shape: squareSvg },
            { id:'018', name: 'Item 3', shape: cloudSvg },
          ]
        },
        { id:'019', name: '提案された姿', shape: squareSvg, badge: 'yellow' },
      ]); */

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

      //[APP-GRID-CONTAINER] APP-GRID-PAGE Rendering
      const ITEMS_PER_PAGE = 20; // 4x5 layout
      const appPages = ref([]); // Hold whole app data to render. Use this to update 'usersAppSpace'
      const currentPage = ref(0);

      const initializePages = () => {
        //[DEBUG] 
        console.log('[initializePages] TRIGGERED');
        
        appPages.value = [];

        // Helper function to check if an item is valid
        const isValidItem = (item) => item && typeof item === 'object' && 'id' in item;

        // Helper function to process a single page
        const processPage = (items) => {
          let currentPage = items.filter(isValidItem);
          if (currentPage.length > 0) {
            appPages.value.push(currentPage);
          }
        };

        try {
          if (Array.isArray(usersAppSpace.value)) {
            if (usersAppSpace.value.length === 0) {
              // Handle empty usersAppSpace
              appPages.value.push([]);
            } else if (Array.isArray(usersAppSpace.value[0])) {
              // usersAppSpace is an array of arrays (pages)
              usersAppSpace.value.forEach(processPage);
            } else if (typeof usersAppSpace.value[0] === 'object') {
              // usersAppSpace is a flat array of items
              let validItems = usersAppSpace.value.filter(isValidItem);
              for (let i = 0; i < validItems.length; i += ITEMS_PER_PAGE) {
                appPages.value.push(validItems.slice(i, i + ITEMS_PER_PAGE));
              }
            } else {
              throw new Error('[initializePages] Invalid item structure in usersAppSpace');
            }
          } else {
            throw new Error('[initializePages] usersAppSpace is not an array');
          }

          // Always ensure there's at least one page
          if (appPages.value.length === 0) {
            appPages.value.push([]);
          }

          // Add an empty page at the end if the last page is full
          if (appPages.value[appPages.value.length - 1].length === ITEMS_PER_PAGE) {
            appPages.value.push([]);
          }
        } catch (error) {
          //[DEBUG] 
          console.error('[initializePages] Error in initializePages:', error);
          // Initialize with an empty page as fallback
          appPages.value = [[]];
        }

        //[DEBUG] 
        console.log('[initializePages] AppPage is ready', appPages.value);
      };

      const selectPage = (index) => {
        currentPage.value = index;
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
          index: target === 'app' ? appPages.value[pageIndex].length : folderPages.value[pageIndex].length
        };

        if (target === 'app') {
          // Logic for adding to appPages
          if (appPages.value[pageIndex].length === ITEMS_PER_PAGE) {
            appPages.value.splice(pageIndex + 1, 0, []);
            pageIndex++;
          }
          appPages.value[pageIndex].push(newItem);
          currentPage.value = pageIndex;

          if (appPages.value[appPages.value.length - 1].length === ITEMS_PER_PAGE) {
            appPages.value.push([]);
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

          // Update the corresponding folder in appPages
          if (currentFolder.value) {
            appPages.value = appPages.value.map(page => 
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
        if (target === 'app') {
          console.log('Updated appPages:', appPages.value);
        } else {
          console.log('Updated folderPages:', folderPages.value);
          console.log('Updated currentFolder:', currentFolder.value);
        }

        updateUsersAppSpace();
      };

      // Function to add a new folder
      const addNewFolderImpl = (target, pageIndex) => {
        const newFolder = {
          id: `f${Date.now()}`,
          name: 'New Folder',
          shape: folderSvg,
          items: []
        };

        if (target === 'app') {
          // Logic for adding to appPages
          if (appPages.value[pageIndex].length === ITEMS_PER_PAGE) {
            appPages.value.splice(pageIndex + 1, 0, []);
            pageIndex++;
          }
          appPages.value[pageIndex].push(newFolder);
          currentPage.value = pageIndex;

          if (appPages.value[appPages.value.length - 1].length === ITEMS_PER_PAGE) {
            appPages.value.push([]);
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

          // Update the corresponding folder in appPages
          if (currentFolder.value) {
            appPages.value = appPages.value.map(page => 
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
        if (target === 'app') {
          console.log('Updated appPages:', appPages.value);
        } else {
          console.log('Updated folderPages:', folderPages.value);
          console.log('Updated currentFolder:', currentFolder.value);
        }

        updateUsersAppSpace();
      };

      /* const addNewItem = (pageIndex) => {
        const newItem = {
          id: Date.now(),  // Use a timestamp as a simple unique id
          name: 'New Item',
          shape: squareSvg,
          index: appPages.value[pageIndex].length
        };

        // If the current page is full, create a new page
        if (appPages.value[pageIndex].length === ITEMS_PER_PAGE) {
          appPages.value.splice(pageIndex + 1, 0, []);
          pageIndex++;
        }

        // Add the new item to the page
        appPages.value[pageIndex].push(newItem);

        // Update currentPage to show the new page if a new one was created
        currentPage.value = pageIndex;

        // Ensure there's always an empty page at the end
        if (appPages.value[appPages.value.length - 1].length === ITEMS_PER_PAGE) {
          appPages.value.push([]);
        }

        updateUsersAppSpace();
      }; */

      const removeItem = (pageIndex, itemIndex) => {
        appPages.value[pageIndex].splice(itemIndex, 1);
        
        // Redistribute items from next pages if they exist
        for (let i = pageIndex; i < appPages.value.length - 1; i++) {
          if (appPages.value[i].length < ITEMS_PER_PAGE && appPages.value[i + 1].length > 0) {
            appPages.value[i].push(appPages.value[i + 1].shift());
          } else {
            break;
          }
        }

        // Remove empty pages, except the last one
        appPages.value = appPages.value.filter((page, index) => 
          page.length > 0 || index === appPages.value.length - 1
        );

        // Ensure there's always an empty page at the end if all others are full
        if (appPages.value[appPages.value.length - 1].length === ITEMS_PER_PAGE) {
          appPages.value.push([]);
        }

        // Adjust currentPage if necessary
        if (currentPage.value >= appPages.value.length) {
          currentPage.value = appPages.value.length - 1;
        }
      };

      const touchStart = (event) => {
        touchStartX.value = event.touches[0].clientX;
      };

      const touchMove = (/*event*/) => {
        // Implement swipe logic here if needed
      };

      const touchEnd = (event) => {
        const touchEndX = event.changedTouches[0].clientX;
        const diffX = touchStartX.value - touchEndX;

        if (Math.abs(diffX) > 50) { // Minimum swipe distance
          if (diffX > 0 && currentPage.value < appPages.value.length - 1) {
            currentPage.value++;
          } else if (diffX < 0 && currentPage.value > 0) {
            currentPage.value--;
          }
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


      //[Drag&Drop]App grid Drag and Drop mode Handling
      
      const isEditMode = ref(false);
      const isMouseDown = ref(false);
      const editModeTimer = ref(null);
      
      const startEditModeTimer = (/*event*/) => {
        if (isEditMode.value) return;
        editModeTimer.value = setTimeout(() => {
          isEditMode.value = true;
        }, 3000);
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

      //App grid Drag and Drop Interaction Handling
      const draggingItem = ref(null);
      const dragStartIndex = ref(null);
      const dragStartPageIndex = ref(null);

      const dragStartTime = ref(0);
      const dragStartX = ref(0);
      const dragStartY = ref(0);

      const draggedElement = ref(null);
      const isDragging = ref(false);
      const dragOffset = ref({ x: 0, y: 0 });
      const ghostItem = ref(null);

      const dragThreshold = 10; // pixels
      const pageChangeTimer = ref(null);

      const formatItemList = (pages) => {
        return pages.map((page, pageIndex) => {
          return `Page ${pageIndex}: ${page.map(item => item.name).join(', ')}`;
        }).join('\n');
      };

      const handleItemClick = (item) => {
        //[DEBUG] 
        console.log('[handleItemClick] App grid item clicked:', item);
        
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
          draggedElement.value = event.target.closest('.app-item');

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
        initializePages();
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
          draggedElement.value = event.target.closest('.app-item');
          
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
        initializePages();
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
        console.log('[startDrag] Initial Grid-Items-Order : ' + formatItemList(appPages.value));
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
          const folderItem = elementUnderCursor.closest('.app-item');

          if (folderItem) {
            const folderId = folderItem.getAttribute('data-id');
            console.log(folderId);
            const folder = appPages.value.flat().find(item => item.id === folderId && item.items);
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
              removeItemFromAppPages(draggingItem.value);
              initializeFolderPages();
            }
          } 
          //DROP AT APP GIRD
          else{
          // Find the element under the cursor
            const elementUnderCursor = document.elementFromPoint(mouseX, mouseY);
            const targetAppItem = elementUnderCursor.closest('.app-item');

            let targetIndex, targetPage;

            if (targetAppItem) {
              // If we're over an app item, get its index
              targetPage = parseInt(targetAppItem.closest('.app-grid').getAttribute('data-page-index1'));
              const itemsInPage = Array.from(targetAppItem.closest('.app-grid').querySelectorAll('.app-item:not(.dragging)'));
              targetIndex = itemsInPage.indexOf(targetAppItem);

              console.log('[endDrag] target Index: '+targetIndex);

              // Insert before the target item when the item moved right
              if(targetIndex < dragStartIndex.value && targetPage === dragStartPageIndex.value){
                targetIndex;
              }else{
                targetIndex++;
              }
              
            } else {
              // If we're not over an app item, find the nearest grid and append to the end
              const nearestGrid = elementUnderCursor.closest('.app-grid');
              if (nearestGrid) {
                //targetPage = parseInt(nearestGrid.getAttribute('data-page-index'));
                //targetIndex = nearestGrid.querySelectorAll('.app-item:not(.dragging)').length;
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
            const targetGrid = document.querySelectorAll('.app-grid')[targetPage];
            const targetItems = targetGrid.querySelectorAll('.app-item:not(.dragging):not(.add-item)');
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

          console.log('[endDrag] GridItems Drag Ended Index: ' + formatItemList(appPages.value));
        }
      };

      const updateItemPosition = (newPosition) => {
        console.log('[updateItemPosition] TRIGGERED - Moving to...', newPosition);

        const { page: newPageIndex, index: newItemIndex } = newPosition;

        // Check if appPages is properly initialized
        if (!Array.isArray(appPages.value) || appPages.value.length === 0) {
          console.error('[updateItemPosition] appPages is not properly initialized');
          return;
        }

        // Create a new array to trigger reactivity
        const updatedAppPages = [...appPages.value];

        let movedItem;

        // Check if we're moving from a folder (dragStartPageIndex will be null)
        if (dragStartPageIndex.value === null) {
          console.log('[updateItemPosition] Moving item from folder to app grid');
          // In this case, we're adding a new item to the app grid
          movedItem = draggingFolderItem.value; // Assuming draggingFolderItem contains the item being moved
          console.log('[updateItemPosition] Moved item from folder:', movedItem);
        } else {
          console.log('[updateItemPosition] Moving items within the app grid.');
          // We're moving within the app grid
          const oldPageIndex = dragStartPageIndex.value;
          const oldItemIndex = dragStartIndex.value;

          if (oldPageIndex === newPageIndex && oldItemIndex === newItemIndex) {
            console.log('[updateItemPosition] Item dropped at original position, no changes needed.');
            return;
          }

          if (!updatedAppPages[oldPageIndex]) {
            console.error(`[updateItemPosition] Old page index ${oldPageIndex} does not exist`);
            return;
          }

          // Remove the item from its original position
          [movedItem] = updatedAppPages[oldPageIndex].splice(oldItemIndex, 1);
        }

        if (!movedItem) {
          console.error('[updateItemPosition] Failed to get item to move');
          return;
        }

        console.log('[updateItemPosition] MovedItem: ', movedItem);

        // Insert the item at its new position
        while (updatedAppPages.length <= newPageIndex) {
          updatedAppPages.push([]);
        }
        updatedAppPages[newPageIndex].splice(newItemIndex, 0, movedItem);

        // Remove empty pages, except the last one
        for (let i = updatedAppPages.length - 2; i >= 0; i--) {
          if (updatedAppPages[i].length === 0) {
            updatedAppPages.splice(i, 1);
          }
        }

        // Ensure there's always an empty page at the end if all others are full
        if (updatedAppPages[updatedAppPages.length - 1].length === ITEMS_PER_PAGE - 1) {
          updatedAppPages.push([]);
        }

        // Update the indices of items in all pages
        updatedAppPages.forEach((page, pageIndex) => {
          page.forEach((item, index) => {
            if (item.id) {
              item.index = pageIndex * ITEMS_PER_PAGE + index;
            }
          });
        });

        // Update the reactive references
        appPages.value = updatedAppPages;
        console.log('[updateItemPosition] appPages is Updadate.');


        // Ensure the current page is updated if necessary
        if (newPageIndex !== currentPage.value) {
          currentPage.value = newPageIndex;
        }

        // Use nextTick to ensure DOM updates after all data changes
        nextTick(() => {
          console.log(`[updateItemPosition] App item moved to page ${newPageIndex}, End-index ${newItemIndex}`);          //console.log('Updated App-gridItems: ' + formatItemList(appPages.value));
        });
        
        //Update usersAppSpace.
        console.log('[updateItemPosition] Initiate updating usersAppSpace with,', appPages.value);
        updateUsersAppSpace();
      };
      
      const removeItemFromAppPages = (item) => {
        //[DEBUG]
        console.log('[removeItemFromAppPages] TRIGGERED');
        appPages.value = appPages.value.map(page => page.filter(i => i !== item));
        //[DEBUG]
        console.log('[removeItemFromAppPages] Item removed from App pages', item);
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

      // Only touches data structure
      const startPageChangeTimer = (direction) => {
        //[DEBUG]
        //console.log('[startPageChangeTimer] TRIGGERED');
        if (pageChangeTimer.value) return;

        pageChangeTimer.value = setTimeout(() => {
          if (direction === 'prev' && currentPage.value > 0) {
            //[DEBUG]
            console.log('[startPageChangeTimer] Shift to LEFT');
            currentPage.value--;
          } else if (direction === 'next' && currentPage.value < appPages.value.length - 1) {
            console.log('[startPageChangeTimer] Shift to RIGTH');
            currentPage.value++;
          } else if (direction ===  'next' && currentPage.value == appPages.value.length - 1){
            appPages.value.push([]);
            currentPage.value++;
          }
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
      
      //[App-Grid] Hover Over Folder
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

      /* const closeFolder = () => {
        console.log('Closing folder');
        showFolder.value = false;
        if (folderDraggedElement.value) {
          document.body.appendChild(folderDraggedElement.value);
        }else{
          currentFolder.value = null;
        } 
      }; */

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

      /* //[Folder] Add Item Hnadler
      const addItemToFolder = (pageIndex) => {
        const newItem = {
          id: `item-${Date.now()}`,  // Use a timestamp as a simple unique id
          name: 'New Item',
          shape: squareSvg,
        };

        // Add the new item to folderPages
        if (folderPages.value[pageIndex].length === ITEMS_PER_FOLDER_PAGE) {
          folderPages.value.splice(pageIndex + 1, 0, []);
          pageIndex++;
        }
        folderPages.value[pageIndex].push(newItem);

        // Update currentPage to show the new page if a new one was created
        currentFolderPage.value = pageIndex;

        // Ensure there's always an empty page at the end
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

        // Update the corresponding folder in appPages
        if (currentFolder.value) {
          appPages.value = appPages.value.map(page => 
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

        //[DEBUG]
        console.log('Updated appPage:', appPages.value);
        console.log('Updated FolderPages:', folderPages.value);
        console.log('Updated currentFolder:', currentFolder.value);
        
        updateUsersAppSpace();
      }; */


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
        //initializePages();
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

        // Check if the cursor is outside the folder content

        /*
        const folderContentElement = document.querySelector('.folder-content');

        if (folderContentElement) {
          const folderRect = folderContentElement.getBoundingClientRect();
          const isOutside = mouseX < folderRect.left || mouseX > folderRect.right ||
                            mouseY < folderRect.top || mouseY > folderRect.bottom;

          //console.log('Mouse position:', mouseX, mouseY);
          //console.log('Folder rect:', folderRect);
          //console.log('Is outside:', isOutside);
          
          if (isOutside && !isDraggingOutOfFolder.value) {
            isDraggingOutOfFolder.value = true;
            console.log('Starting folder close timer');
            startFolderCloseTimer();
          } else if (!isOutside && isDraggingOutOfFolder.value) {
            isDraggingOutOfFolder.value = false;
            console.log('Canceling folder close timer');
            cancelFolderCloseTimer();
          }
        }*/

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

          //COLSE FOLDER AND DROP ITEM IN APP GIRD
          if (!showFolder.value) {
            //[DEBUG] 
            console.log('[endFolderDrag] DROP OUT OF FOLDER');
            // Logic for dropping the item in the app grid
            // Find the element under the cursor

            // Remove placeholder
            if (folderGhostItem.value && folderGhostItem.value.parentNode) {
              folderGhostItem.value.parentNode.removeChild(folderGhostItem.value);
            }
            folderGhostItem.value = null;

            
            const elementUnderCursor = document.elementFromPoint(mouseX, mouseY);
            const targetAppItem = elementUnderCursor.closest('.app-item');

            let targetIndex, targetPage;

            if (targetAppItem) {              
              // Remove the item from the folder
              removeItemFromFolderPages(draggingFolderItem.value);
              
              // If we're over an app item, get its index
              targetPage = parseInt(targetAppItem.closest('.app-grid').getAttribute('data-page-index1'));
              const itemsInPage = Array.from(targetAppItem.closest('.app-grid').querySelectorAll('.app-item:not(.dragging)'));
              targetIndex = itemsInPage.indexOf(targetAppItem);

              //[DEBUG] 
              console.log('[endFolderDrag] target Index: '+targetIndex);
              initializePages();
              
            } else {
              // If we're not over an app item, find the nearest grid and append to the end
              const nearestGrid = elementUnderCursor.closest('.app-grid');
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
              // If we're not over an app item, find the nearest grid and append to the end
              const nearestGrid = elementUnderCursor.closest('.app-grid');
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

        //Update usersAppSpace.
        console.log('[updateItemPosition] Initiate updating usersAppSpace with,', folderPages.value);
        updateUsersAppSpace();
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

      //Chat
      const isChatBoxExpanded = ref(false);
      const chatInput = ref('');

      const toggleChatBox = () => {
        isChatBoxExpanded.value = !isChatBoxExpanded.value;
      };

      const chatMessagesExample = computed(() => store.getters['chat/getChatMessagesExample']);

      const copyToTextarea = (message) => {
        chatInput.value = message;
      };

      const chatMessages = computed(() => store.state.chat.chatMessages);

      const sendMessage = () => {
        if (chatInput.value.trim()) {
          const formattedMessage = chatInput.value.replace(/\n/g, '\n');
          store.dispatch('chat/sendChatMessage', {
            text: formattedMessage,
            sender: 'user',
            timestamp: new Date().toISOString()
          });
          chatInput.value = '';
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
        initializePages();
        initializeFolderPages();
      });

      return {
        // General UI elements
        currentTime,
        background,
        containerStyle,

        // App grid related
        //gridItems,
        appPages,
        currentPage,
        ITEMS_PER_PAGE,
        draggingItem,

        // EditMode related
        isEditMode,
        isDragging,

        // EditMode functions
        startEditModeTimer,
        cancelEditModeTimer,

        //addNewItem,
        showAddItemPopup,
        addItemTarget,  // Make sure to return this
        showAddItemMenu,
        handleAddItemSelection,

        // App grid functions
        removeItem,
        selectPage,
        getBadgeIcon,
        handleItemClick,
        handleMouseDown,
        handleTouchStart,
        exitEditMode,
        startDrag,

        // Hover Over Folder Functions
        hoveredFolderId,
        handleItemHover,
        handleItemLeave,
        openFolder,

        // Touch events for app grid
        touchStart,
        touchMove,
        touchEnd,

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

        // Dock apps
        dockApps,
        createShadowSvg,

        // Chat related
        isChatBoxExpanded,
        chatInput,
        chatMessagesExample,
        chatMessages,

        // Chat functions
        toggleChatBox,
        copyToTextarea,
        sendMessage,

        // Utility functions
        formatDate,
      };
    }
  });
</script>

<style lang='scss'>
  @import '../assets/mindSpaceStyle.scss';
</style>