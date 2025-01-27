// src/store/modules/mindspace.js
//import squareSvg from '../assets/shapes/square.svg';
//import circleSvg from '../assets/shapes/circle.svg';
//import octagonSvg from '../assets/shapes/octagon.svg';
//import cloudSvg from '../assets/shapes/cloud.svg';
//import folderSvg from '../assets/shapes/folder.svg';
import { mindspaceService} from '@/firebase/firebaseMindSpace';
import { 
  updateViewThemeHistory,
  updateViewMindspaceHistory,
  loadViewHistory,
} from '@/firebase/firebaseFirestore';
import { getCurrentUserId } from '@/firebase/firebaseAuth';

export default {
    namespaced: true,
    
    state: {
      userId: null,
      mindSpaceList: null,
      currentThemeId: null,
      currentThemeName: null,
      currentMindSpaceId: null,
      currentMindSpaceName: null,
      currentItemId: null,
      currentItemName: null,
      mindSpacePages: [{
        items: []
      }],
      currentPage: 0,
      totalPages: 0,
      currentFolder: null,
      loading: false,
      error: null,
      itemBlocks:[],
      rawPages: null,
      rawFolders: null,
      showItemWindow: false,
      isEditMode: false,
    },
    
    mutations: {
      //[PREPARATION]
      SET_USER_ID(state, id) {
        state.userId = id;
      },
      SET_THEME_ID(state, id) {
        state.currentThemeId = id;
      },
      SET_MINDSPACE_ID(state, id) {
        state.currentMindSpaceId = id;
      },
      SET_ITEM_ID(state, id) {
        state.currentItemId = id;
      },
      
      //[LOADING DATA]
      SET_THEME_NAME(state, name) {
        state.currentThemeName = name;
      },
      SET_MINDSPACE_LIST(state, list) {
        state.mindSpaceList = list;
      },
      SET_MINDSPACE_NAME(state, name) {
        state.currentMindSpaceName = name;
      },
      SET_MINDSPACE_PAGES(state, pages) {
        state.mindSpacePages = pages;
      },
      SET_RAW_DATA(state, rawpages, rawfolders) {
        state.rawPages = rawpages;
        state.rawFolders = rawfolders;
      },
      SET_LOADING(state, loading) {
        state.loading = loading;
      },
      SET_ERROR(state, error) {
        state.error = error;
      },

      //[PAGE RENDER MANAGEMENT]
      SET_CURRENT_PAGE(state, page) {
        state.currentPage = page;
      },
      SET_TOTAL_PAGES(state, total) {
        state.totalPages = total;
        console.log("[SET_TOTAL_PAGES] totalPages:", state.totalPages);
      },
      ADD_NEW_PAGE(state) {
        // Add new page with empty items array
        state.mindSpacePages.push({
          items: []
        });
      },
      CLEANUP_EMPTY_PAGES(state) {
        // Don't remove the first page even if empty
        if (state.mindSpacePages.length <= 1) return;
        
        // Filter out empty pages except the first one
        state.mindSpacePages = state.mindSpacePages.filter((page, index) => {
          if (index === 0) return true; // Always keep first page
          return page.items && page.items.length > 0;
        });
    
        // Ensure at least one page exists
        if (state.mindSpacePages.length === 0) {
          state.mindSpacePages = [{
            items: []
          }];
        }
    
        // Adjust currentPage if needed
        if (state.currentPage >= state.mindSpacePages.length) {
          state.currentPage = state.mindSpacePages.length - 1;
        }
        console.log("[CLEANUP_EMPTY_PAGES] mindSpacePages:", state.mindSpacePages);
        console.log("[CLEANUP_EMPTY_PAGES] currentPage:", state.currentPage);
      },

      //[ITEM ORDER MANAGEMENT]
      SET_IS_EDIT_MODE(state, value){
        state.isEditMode = value;
      },
      UPDATE_PAGE_ITEMS(state, { pageIndex, items }) {
        if (pageIndex >= 0 && pageIndex < state.mindSpacePages.length) {
          state.mindSpacePages[pageIndex].items = items;
        }
      },
      REORDER_PAGE_ITEMS(state, { pageIndex, fromIndex, toIndex }) {
        const page = state.mindSpacePages[pageIndex];
        if (!page?.items) {
          console.error('Invalid page index:', pageIndex);
          return;
        }
  
        // Remove item from old position
        const [movedItem] = page.items.splice(fromIndex, 1);
        
        if (!movedItem) {
          console.error('Failed to remove item for reordering');
          return;
        }
  
        // Insert at new position
        page.items.splice(toIndex, 0, movedItem);
  
        console.log('After reorder:', {
          page: page.items.map(i => i.name)
        });
      },
      MOVE_ITEM_BETWEEN_PAGES(state, { fromPageIndex, toPageIndex, fromIndex, toIndex }) {
        
        console.log('[MOVE_ITEM_BETWEEN_PAGES] fromIndex:', fromIndex,' / fromPageIndex:', fromPageIndex );
        console.log('[MOVE_ITEM_BETWEEN_PAGES] toIndex:', toIndex,' / toPageIndex:', toPageIndex );
        // Validation
        if (!state.mindSpacePages[fromPageIndex]?.items || !state.mindSpacePages[toPageIndex]?.items) {
          console.error('Invalid page indices:', { fromPageIndex, toPageIndex });
          return;
        }
    
        // Create deep copies of the pages to avoid mutation issues
        const updatedPages = [...state.mindSpacePages];

        // Get the item to move
        const movedItem = {...updatedPages[fromPageIndex].items[fromIndex]};
        
        // Remove from source
        updatedPages[fromPageIndex] = {
          items: updatedPages[fromPageIndex].items.filter((_, index) => index !== fromIndex)
        };
    
        // Insert at new position
        const targetItems = [...updatedPages[toPageIndex].items];
        targetItems.splice(toIndex, 0, movedItem);
        updatedPages[toPageIndex] = { items: targetItems };

        // Update state with new array
        state.mindSpacePages = updatedPages;
      },
      /*
      REMOVE_ITEM_FROM_PAGE(state, { pageIndex, itemIndex }) {
        if (state.mindSpacePages[pageIndex]?.items) {
          state.mindSpacePages[pageIndex].items.splice(itemIndex, 1);
        }
      },*/
      REMOVE_ITEM_FROM_PAGE(state, { itemId }) {
        // Update each page
        state.mindSpacePages = state.mindSpacePages.map(page => {
          return {
            // Keep page structure but filter out the item with matching ID
            items: page.items.filter(item => item.id !== itemId)
          };
        });
    
        // Optional: Remove empty pages if needed
        state.mindSpacePages = state.mindSpacePages.filter(page => page.items.length > 0);
        
        console.log('[REMOVE_ITEM_FROM_PAGE] Item removed:', itemId);
      },

      //[ADD ITEM]
      ADD_ITEM_TO_PAGE(state, { pageIndex, index, item }) {
        // Ensure the page exists
        while (state.mindSpacePages.length <= pageIndex) {
          state.mindSpacePages.push({ items: [] });
        }
  
        // Ensure the items array exists
        if (!state.mindSpacePages[pageIndex].items) {
          state.mindSpacePages[pageIndex].items = [];
        }
  
        // Add the item
        state.mindSpacePages[pageIndex].items.splice(index, 0, item);
      },
      ADD_ITEMS_TO_PAGE(state, { pageIndex, items }) {
        if (!state.mindSpacePages[pageIndex]) {
          state.mindSpacePages[pageIndex] = { items: [] };
        }
        state.mindSpacePages[pageIndex].items.push(...items);
      }, 
      ADD_FOLDER_TO_PAGE(state, { pageIndex, index, folder }) {
        // Ensure the page exists
        while (state.mindSpacePages.length <= pageIndex) {
          state.mindSpacePages.push({ items: [] });
        }
  
        // Ensure the items array exists
        if (!state.mindSpacePages[pageIndex].items) {
          state.mindSpacePages[pageIndex].items = [];
        }
  
        // Add the folder
        state.mindSpacePages[pageIndex].items.splice(index, 0, folder);
      },

      //[FOLDER RENDER MANAGEMENT]
      UPDATE_CURRENT_FOLDER(state, folder) {
        // Add a mutation to update the current folder specifically
        state.currentFolder = folder;
      },
      GET_FOLDER_BY_ID: (state) => (folderId) => {
        for (const page of state.mindSpacePages) {
          const folder = page.items.find(item => item.id === folderId);
          if (folder) return folder;
        }
        return null;
      },

      //[FOLDER ITEM ORDER MANAGEMENT]
      UPDATE_FOLDER_ITEMS(state, { folderId, items }) {
        state.mindSpacePages = state.mindSpacePages.map(page => ({
          items: page.items.map(item => {
            if (item.id === folderId) {
              return { ...item, items };
            }
            return item;
          })
        }));
      }, 
      REORDER_FOLDER_ITEMS(state, { folderId, fromIndex, toIndex }) {
        state.mindSpacePages = state.mindSpacePages.map(page => ({
          items: page.items.map(item => {
            if (item.id === folderId && Array.isArray(item.items)) {
              const updatedItems = [...item.items];
              const [movedItem] = updatedItems.splice(fromIndex, 1);
              updatedItems.splice(toIndex, 0, movedItem);
              
              console.log("[REORDER_FOLDER_ITEMS] Reordered folder items:", {
                folderId,
                fromIndex,
                toIndex,
                updatedItems
              });
  
              return { ...item, items: updatedItems };
            }
            return item;
          })
        }));
      },
      MOVE_ITEM_BETWEEN_FOLDERS(state, { fromFolderId, toFolderId, fromIndex, toIndex }) {
        let movedItem = null;
        
        // First pass: remove item from source folder
        state.mindSpacePages = state.mindSpacePages.map(page => ({
          items: page.items.map(item => {
            if (item.id === fromFolderId && Array.isArray(item.items)) {
              const updatedItems = [...item.items];
              [movedItem] = updatedItems.splice(fromIndex, 1);
              return { ...item, items: updatedItems };
            }
            return item;
          })
        }));
  
        // Second pass: add item to destination folder
        if (movedItem) {
          state.mindSpacePages = state.mindSpacePages.map(page => ({
            items: page.items.map(item => {
              if (item.id === toFolderId && Array.isArray(item.items)) {
                const updatedItems = [...item.items];
                updatedItems.splice(toIndex, 0, movedItem);
                
                console.log("[MOVE_ITEM_BETWEEN_FOLDERS] Moved item between folders:", {
                  fromFolderId,
                  toFolderId,
                  fromIndex,
                  toIndex,
                  movedItem,
                  updatedItems
                });
  
                return { ...item, items: updatedItems };
              }
              return item;
            })
          }));
        }
      },
      REMOVE_ITEM_FROM_FOLDER(state, { folderId, itemId }) {
        state.mindSpacePages = state.mindSpacePages.map(page => ({
          items: page.items.map(item => {
            if (item.id === folderId) {
              return {
                ...item,
                items: item.items.filter(i => i.id !== itemId)
              };
            }
            return item;
          })
        }));
        console.log("[REMOVE_ITEM_FROM_FOLDER] Successful.");
      },

      //[ADD FOLDER ITEM]
      ADD_ITEM_TO_FOLDER(state, { folderId, item }) {
        state.mindSpacePages = state.mindSpacePages.map(page => ({
          items: page.items.map(existingItem => {
            if (existingItem.id === folderId) {
              return {
                ...existingItem,
                items: [...(existingItem.items || []), item]
              };
            }
            return existingItem;
          })
        }));
      },
      ADD_ITEMS_TO_FOLDER(state, { folderId, items }) {
        state.mindSpacePages = state.mindSpacePages.map(page => ({
          items: page.items.map(existingItem => {
            if (existingItem.id === folderId) {
              return {
                ...existingItem,
                items: Array.isArray(existingItem.items)
                  ? [...existingItem.items, ...items]
                  : [...items]
              };
            }
            return existingItem;
          })
        }));
      },

      //[ITEM PAGE HANDLING]
      
      SET_ITEM_NAME (state, name) {
        state.currentItemName = name;
      },
      SET_BLOCKS(state, itemBlocks) {
        state.itemBlocks = itemBlocks;
      },
      ADD_BLOCK(state, block) {
        state.itemBlocks.push(block);
      },
      UPDATE_BLOCK(state, { id, content }) {
        const block = state.itemBlocks.find(b => b.id === id);
        if (block) {
          block.content = content;
        }
      },
      DELETE_BLOCK(state, id) {
        state.itemBlocks = state.itemBlocks.filter(b => b.id !== id);
      },
      MOVE_BLOCK(state, { id, direction }) {
        const index = state.itemBlocks.findIndex(b => b.id === id);
        if (index === -1) return;
  
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= state.itemBlocks.length) return;
  
        const itemBlocks = [...state.itemBlocks];
        const temp = itemBlocks[index];
        itemBlocks[index] = itemBlocks[newIndex];
        itemBlocks[newIndex] = temp;
        state.itemBlocks = itemBlocks;
      },
      SET_EDITING_BLOCK(state, id) {
        state.editingBlockId = id;
      }
    },
    
    actions: {
      async setUserId({ commit, state, /*dispatch*/ }) {
        console.log("[setUserId] TRIGGERED");
        try {
          commit('SET_LOADING', true);
          
          const userId = await getCurrentUserId();
          
          commit('SET_USER_ID', userId);
          console.log("[setUserId]",state.userId);
          
        } catch (error) {
          console.error('Error initializing user ID:', error);
          commit('SET_ERROR', error.message);
        } finally {
          console.log("[setUserId] Finish Process");
        }
      },
      async loadViewThemeId({ commit, state, dispatch }) {
        console.log("[loadViewThemeId] TRIGGERED");
        try {
          // Check if userId exists
          if (!state.userId) {
            console.log("[loadViewThemeId] No userId available");
            return null;
          }
      
          // Add await here
          const viewHistory = await loadViewHistory(state.userId);
      
          if (!viewHistory) {
            return null;
          }
      
          // Add null check for theme
          if (viewHistory.theme) {
            commit('SET_THEME_ID', viewHistory.theme);
            console.log("[setViewThemeId] Current", state.currentThemeId);
      
            // 2. Load theme data to get theme name
            await dispatch('setThemeData');
              
            // 3. Load theme data to get defaultMindSpace
            await dispatch('setMindSpaceId'); 
            console.log("[loadViewThemeId] reset mindspaceId: ",state.currentMindSpaceId);
          }
      
          return viewHistory;
        } catch (error) {
          console.error("[loadViewThemeId] Error:", error.message);
          return null;
        }
      },
      async setViewThemeId({ commit, state, dispatch }, themeId) {
        console.log("[setViewThemeId] TRIGGERED", themeId);
        try {
          
          commit('SET_THEME_ID', themeId);
          console.log("[setViewThemeId] Current", state.currentThemeId);
          await updateViewThemeHistory( state.userId, state.currentThemeId);

          // 2. Load theme data to get theme name
          await dispatch('setThemeData');
            
          // 3. Load theme data to get defaultMindSpace
          await dispatch('setMindSpaceId');  
          
        } catch (error) {
          console.log(error.message);
        }
      },
      // Load theme's mindspace data
      async setMindSpaceId({ commit, state, dispatch }) {
        console.log("[setMindSpaceId] TRIGGERED");
        try {
          // Get theme document to find defaultMindSpace
          const defaultMindSpaceId = await mindspaceService.getDefaultMindSpaceId(state.currentThemeId, state.userId);

          commit('SET_MINDSPACE_ID', defaultMindSpaceId);
          console.log("[setMindSpaceId]",state.currentMindSpaceId);
          await updateViewMindspaceHistory( state.userId, state.currentMindSpaceId);

          // Now load the mindspace pages
          await dispatch('setMindSpacePages');

          // Now load the mindspace lists
          await dispatch('setMindSpaceList');

        } catch (error) {
          console.error('Error loading theme mindspace data:', error);
          commit('SET_ERROR', error.message);
        }
      },
      async setItemId ({ commit, state, dispatch }, itemId) {
        try {
          commit('SET_ITEM_ID', itemId);
          console.log("[setItemId]",state.currentItemId);

          await dispatch('setBlocks', itemId);
        } catch (error) {
          console.error('Error loading theme mindspace data:', error);
          commit('SET_ERROR', error.message);
        }
      },
      async setThemeData({ commit, state }) {
        console.log("[setThemeData] TRIGGERED");
        const currentThemeData = await mindspaceService.getThemeData(state.currentThemeId);
        const currentThemeName = currentThemeData.name;
        commit('SET_THEME_NAME', currentThemeName);
        console.log("[setThemeData] Mindspace Name:", state.currentThemeName);
      },
      async setMindSpaceList({ commit, state }) {
        try {
          console.log("[setMindSpaceList] TRIGGERED");
          const result = await mindspaceService.getListOfMindSpace(state.currentThemeId);

          // Validate that result is an array
          if (!Array.isArray(result)) {
            throw new Error('Invalid data format: expected an array');
          }

          // If you want to validate that each mindspace has certain properties
          result.forEach((mindspace, index) => {
            if (!mindspace || typeof mindspace !== 'object') {
              throw new Error(`Invalid mindspace object at index ${index}`);
            }
            // Optional: validate specific properties if needed
            // if (!mindspace.pages) {
            //   throw new Error(`Mindspace at index ${index} missing pages property`);
            // }
          });

          commit('SET_MINDSPACE_LIST', result);
          console.log("[setMindSpaceList] Successfully set mindspace list:", result);


        } catch (error) {
          console.error('Error loading mindspace list:', error);
          commit('SET_ERROR', error.message);
        }

      },
      // Modified original function to use getMindSpaceData
      async setMindSpacePages({ commit, state }) {
        try {
          console.log("[setMindSpacePages] TRIGGERED");
          
          const result = await mindspaceService.getMindSpaceData(state.currentMindSpaceId);
          console.log("[setMindSpacePages] Got result:", result);
          
          if (!result || !result.pages) {
            throw new Error('Invalid data returned from getMindSpaceData');
          }
          
          const { name, pages, totalPages } = result;

          commit('SET_MINDSPACE_NAME', name);
          console.log("[setMindSpacePages] Mindspace Name:", state.currentMindSpaceName);
          
          commit('SET_MINDSPACE_PAGES', pages);
          console.log("[setMindSpacePages] Mindspace Pages:", state.mindSpacePages);
          
          commit('SET_TOTAL_PAGES', totalPages);
          console.log("[setMindSpacePages] totalPages:", state.totalPages);
          
        } catch (error) {
          console.error('Error loading mindspace:', error);
          commit('SET_ERROR', error.message);
        } finally {
          await new Promise(resolve => setTimeout(resolve, 500));
          commit('SET_LOADING', false);
        }
      },
      
      /*
      setMindSpacePages({ commit, state }) {
        console.log("[setMindSpacePages] TRIGGERED");
        
        //Load Users MindSpace from Firebase
        const usersMindSpace = [
          {
            items: [
              { id:'0000', name: '0', shape: circleSvg, badge: 'lightblue' },
              { id:'0001', name: '1', shape: cloudSvg },
              { 
                id:'f0009',
                name: 'フォルダー1', 
                shape: folderSvg, 
                items: [
                  { id:'0009', name: 'Item 1', shape: circleSvg, badge: 'lightblue' },
                  { id:'0010', name: 'Item 2', shape: squareSvg },
                  { id:'0011', name: 'Item 3', shape: cloudSvg },
                  { id:'0012', name: 'Item 4', shape: octagonSvg },
                  { id:'0013', name: 'Item 5', shape: circleSvg },
                  { id:'0014', name: 'Item 6', shape: squareSvg },
                  { id:'0015', name: 'Item 7', shape: cloudSvg },
                  { id:'0016', name: 'Item 8', shape: octagonSvg },
                ]
              },
            ]
          },
          {
            items: [
              { id:'0009', name: '0', shape: circleSvg },
              { id:'0010', name: '1', shape: cloudSvg },
            ]
          }
        ];

        commit('SET_MINDSPACE_PAGES', usersMindSpace);
        commit('SET_TOTAL_PAGES', usersMindSpace);
        console.log("[mindspace.js] totalPages:", state.totalPages);
      },*/
      async updateMindSpace({ state, commit }) {
        try {
          commit('SET_LOADING', true);
          commit('SET_ERROR', null);
  
          await mindspaceService.updateMindSpaceData(state.currentMindSpaceId, state.mindSpacePages);
          
          console.log('[updateMindSpace] Successfully updated mindspace');
        } catch (error) {
          console.error('[updateMindSpace] Error:', error);
          commit('SET_ERROR', error.message);
          throw error;
        } finally {
          commit('SET_LOADING', false);
        }
      },
      //Save changes with retry capability
      async saveMindSpaceChanges({ dispatch }, { autoRetry = true, maxRetries = 3 } = {}) {
        let retries = 0;
        
        const attemptSave = async () => {
          try {
            await dispatch('updateMindSpace');
            console.log('[saveMindSpaceChanges] Successfully saved changes');
          } catch (error) {
            if (autoRetry && retries < maxRetries) {
              retries++;
              console.log(`[saveMindSpaceChanges] Retrying... Attempt ${retries} of ${maxRetries}`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              return attemptSave();
            }
            throw error;
          }
        };
  
        return attemptSave();
      },
      setCurrentPage({ commit }, page) {
        console.log("[setCurrentPage] TRIGGERED",page);
        commit('SET_CURRENT_PAGE', page);
      },
      addNewPage({ commit, state }) {
        commit('ADD_NEW_PAGE');
        commit('SET_TOTAL_PAGES', state.mindSpacePages);
      },
      cleanupEmptyPages({ commit, state }) {
        console.log("[CleanupEmptyPages] TRIGGERED");
        commit('CLEANUP_EMPTY_PAGES');
        commit('SET_TOTAL_PAGES', state.mindSpacePages.length);
      },
      // New action for updating page items
      setIsEditMode({ commit, state }, value){
        console.log("[setIsEditMode] TRIGGERED");
        commit('SET_IS_EDIT_MODE', value);
        console.log("[mindspace.js/setIsEditMode] isEditMode: ", state.isEditMode);
      },
      updatePageItems({ commit }, { pageIndex, items }) {
        commit('UPDATE_PAGE_ITEMS', { pageIndex, items });
      },
      reorderPageItems({ commit, state }, payload) {
        const { pageIndex } = payload;
        if (pageIndex < 0 || pageIndex >= state.mindSpacePages.length) {
          console.error('Invalid page index in reorderPageItems:', payload);
          return;
        }
  
        commit('REORDER_PAGE_ITEMS', payload);
      },
      moveItemBetweenPages({ commit, state }, payload) {
        // Validate payload
        const { fromPageIndex, toPageIndex } = payload;
        if (
          fromPageIndex < 0 || fromPageIndex >= state.mindSpacePages.length ||
          toPageIndex < 0 || toPageIndex >= state.mindSpacePages.length
        ) {
          console.error('Invalid page indices in moveItemBetweenPages:', payload);
          return;
        }
  
        commit('MOVE_ITEM_BETWEEN_PAGES', payload);
      },
      async addItemToPage({ commit, state, dispatch }, { pageIndex, index, item }) {
        try {
          console.log('[addItemToPage] Starting with:', { pageIndex, index, item });
          console.log('[addItemToPage] userId: ',state.userId)
          const { itemId, itemData } = await mindspaceService.addNewItemToMindspace(
            state.userId,
            state.currentMindSpaceId,
            pageIndex,
            index,
            item
          );
  
          commit('ADD_ITEM_TO_PAGE', {
            pageIndex,
            index,
            item: itemData
          });
  
          console.log('[addItemToPage] Completed:', { itemId, itemData });
          await dispatch('setMindSpacePages');
          return itemId;
        } catch (error) {
          console.error('Error in addItemToPage:', error);
          throw error;
        }
      },
      addItemsToPage({ commit }, payload) {
        commit('ADD_ITEMS_TO_PAGE', payload);
      },
      async addNewFolder({ commit, state, dispatch }, { pageIndex, index }) {
        try {
          console.log('[addNewFolder] Starting with:', { pageIndex, index });
          
          const { folderId, folderData } = await mindspaceService.addFolderToMindspace(
            state.currentMindSpaceId,
            pageIndex,
            index
          );
  
          commit('ADD_FOLDER_TO_PAGE', {
            pageIndex,
            index,
            folder: folderData
          });
  
          console.log('[addNewFolder] Completed:', { folderId, folderData });
          await dispatch('setMindSpacePages');
          return folderId;
        } catch (error) {
          console.error('Error in addNewFolder:', error);
          throw error;
        }
      },
      async duplicateItemToPage({ state, dispatch }) {
        try {
          const { itemId, itemData } = await mindspaceService.duplicateItemInMindspace(
            state.userId,
            state.currentMindSpaceId,
            state.currentPage,
            state.currentItemId
          );
    
          console.log('[duplicateItemToPage] Completed:', { itemId, itemData });
          await dispatch('setMindSpacePages');
          return itemId;
        } catch (error) {
          console.error('Error in addItemToPage:', error);
          throw error;
        }
      },
      removeItemFromPage({ commit }, { itemId }) {
        commit('REMOVE_ITEM_FROM_PAGE', { itemId });
      },
      // New action for updating folder items
      updateFolderItems({ commit }, { folderId, items }) {
        commit('UPDATE_FOLDER_ITEMS', { folderId, items });
      },
      reorderFolderItems({ commit }, { folderId, fromIndex, toIndex }) {
        commit('REORDER_FOLDER_ITEMS', { folderId, fromIndex, toIndex });
      },
      moveItemBetweenFolders({ commit }, { fromFolderId, toFolderId, fromIndex, toIndex }) {
        commit('MOVE_ITEM_BETWEEN_FOLDERS', { fromFolderId, toFolderId, fromIndex, toIndex });
      },
      addItemToFolder({ commit, getters }, { folderId, item }) {
        // Add the item
        commit('ADD_ITEM_TO_FOLDER', { folderId, item });
        
        // Get the updated folder and update current folder state
        const updatedFolder = getters.getFolderById(folderId);
        if (updatedFolder) {
          commit('UPDATE_CURRENT_FOLDER', updatedFolder);
        }
      },
      async addNewItemToFolder({ commit, state, dispatch }, { folderId, item }) {
        try {
          const { itemId, itemData } = await mindspaceService.addItemToFolder(
            state.userId,
            state.currentMindSpaceId,
            folderId,
            item
          );
  
          commit('ADD_ITEM_TO_FOLDER', {
            folderId,
            item: itemData
          });
          await dispatch('setMindSpacePages');

          return itemId;
        } catch (error) {
          console.error('Error in addNewItemToFolder:', error);
          throw error;
        }
      },
      async duplicateItemToFolder({ state, dispatch }) {
        console.log('Duplicating to folder:', state.currentFolder.id);
        
        try {
          const { itemId, itemData } = await mindspaceService.duplicateItemToFolder(
            state.userId,
            state.currentMindSpaceId,
            state.currentFolder.id,
            state.currentItemId
          );
    
          console.log('[duplicateItemToFolder] Completed:', { itemId, itemData });
          await dispatch('setMindSpacePages');
          return itemId;
        } catch (error) {
          console.error('Error in duplicateItemToFolder:', error);
          throw error;
        }
      },
      removeItemFromFolder({ commit }, payload) {
        commit('REMOVE_ITEM_FROM_FOLDER', payload);
      },
      async moveItemFromFolderToPage({ commit, state }, { folderId, itemId, targetPageIndex, targetIndex, item }) {
        try {
          console.log('[moveItemFromFolderToPage] Starting move operation');
    
          // 1. Update Firestore and get raw data
          const { rawPages, rawFolders } = await mindspaceService.moveItemFromFolderToMindspace(
            state.currentMindSpaceId,
            { folderId, itemId, targetPageIndex, targetIndex }
          );
    
          // 2. Update local state directly
          const updatedPages = state.mindSpacePages.map(page => ({
            items: [...page.items]
          }));
    
          // Remove item from folder in local state
          updatedPages.forEach(page => {
            page.items = page.items.map(pageItem => {
              if (pageItem.id === folderId) {
                return {
                  ...pageItem,
                  items: pageItem.items.filter(folderItem => folderItem.id !== itemId)
                };
              }
              return pageItem;
            });
          });
    
          // Add item to target page
          while (updatedPages.length <= targetPageIndex) {
            updatedPages.push({ items: [] });
          }
    
          // Add the item with its full data structure
          updatedPages[targetPageIndex].items.splice(targetIndex, 0, {
            id: itemId,
            name: item.name,
            shape: item.shape,
            badge: item.badge || null
          });
    
          // 3. Update state
          commit('SET_MINDSPACE_PAGES', updatedPages);
          
          // 4. Store raw data
          commit('SET_RAW_DATA', { pages: rawPages, folders: rawFolders });
          
          console.log('[moveItemFromFolderToPage] Successfully moved item');
        } catch (error) {
          console.error('[moveItemFromFolderToPage] Error:', error);
          throw error;
        }
      },
      /*
      async moveItemFromFolderToPage({ commit, state }, payload) {
        try {
          const { pages, rawPages, rawFolders } = await moveItemFromFolderToMindspace(
            state.currentMindSpaceId,
            payload
          );
    
          // Update the rendered state with rich data
          commit('SET_MINDSPACE_PAGES', pages);
          
          // Store raw data for future operations (optional)
          commit('SET_RAW_DATA', { pages: rawPages, folders: rawFolders });
          
          console.log('[moveItemFromFolderToPage] Successfully moved item');
        } catch (error) {
          console.error('[moveItemFromFolderToPage] Error:', error);
          throw error;
        }
      },*/
      async moveItemToFolder({ commit, state }, { pageIndex, folderId, item }) {
        try {
          console.log('[moveItemToFolder] Starting move operation:', {
            pageIndex,
            folderId,
            item
          });
      
          // 1. Update Firestore
          const { rawPages, rawFolders } = await mindspaceService.moveItemToFolder(
            state.currentMindSpaceId,
            {
              pageIndex,
              folderId,
              itemId: item.id // Pass itemId explicitly
            }
          );
      
          // 2. Update local state directly
          const updatedPages = [...state.mindSpacePages];

          // Remove item from mindspace pages
          updatedPages[pageIndex] = {
            items: updatedPages[pageIndex].items.filter(pageItem => pageItem.id !== item.id)
          };
          
          // Add item to target folder
          updatedPages.forEach(page => {
            page.items = page.items.map(pageItem => {
              if (pageItem.id === folderId) {
                return {
                  ...pageItem,
                  items: [...(pageItem.items || []), {
                    id: item.id,
                    name: item.name,
                    shape: item.shape,
                    badge: item.badge || null
                  }]
                };
              }
              return pageItem;
            });
          });
      
          // 3. Update state
          commit('SET_MINDSPACE_PAGES', updatedPages);
          
          // 4. Store raw data
          commit('SET_RAW_DATA', { pages: rawPages, folders: rawFolders });
          
          console.log('[moveItemToFolder] Successfully moved item to folder');
        } catch (error) {
          console.error('[moveItemToFolder] Error:', error);
          throw error;
        }
      },
      async deleteItem({ commit, state }, itemId) {
        try {
          console.log('[deleteItem] Starting deletion of item:', itemId);
          
          // 1. First delete from Firestore and get raw data
          const { rawPages, rawFolders } = await mindspaceService.deleteItem(state.currentMindSpaceId, itemId);

          // 2. Filter out the deleted item from current state
          const updatedPages = state.mindSpacePages.map(page => ({
            items: page.items.filter(item => {
              // Keep the item if:
              // - It's not the item we're deleting AND
              // - If it's a folder, filter the deleted item from its items array
              if (item.id === itemId) {
                return false;
              }

              // If this is a folder, filter its items too
              if (item.items) {
                item.items = item.items.filter(folderItem => folderItem.id !== itemId);
              }
              return true;
            })
          }));

          // 3. Update state with filtered pages
          commit('SET_MINDSPACE_PAGES', updatedPages);
          
          // Store raw data for future operations
          commit('SET_RAW_DATA', { pages: rawPages, folders: rawFolders });
          
          console.log('[deleteItem] Successfully deleted item');
        } catch (error) {
          console.error('[deleteItem] Error:', error);
          throw error;
        }
      },
      //Item Blocks Handling
      async getItemName({ commit, state }, itemName) {
        commit('SET_ITEM_NAME', itemName);
        console.log("[getItemName/mindspace.js] itemName:", state.currentItemName);
      },
      async setItemName({ commit, state, dispatch }, itemName) {
        commit('SET_ITEM_NAME', itemName);
        console.log("[setItemName/mindspace.js] itemName:", state.currentItemName);
        await mindspaceService.updateItemData(state.currentItemId, state.currentItemName, state.itemBlocks );
        await dispatch('setMindSpacePages');
      },
      async setBlocks({ commit }, itemId) {
        const itemData = await mindspaceService.getItemData(itemId);

        if(itemData.success){
          console.log(itemData.data);
          const data = itemData.data;
          commit('SET_BLOCKS', data);
        }else{
          console.log(itemData.message);
        }
      },
      async addBlock({ commit, state }, block) {
        commit('ADD_BLOCK', block);
        console.log("[mindspace.js/itemBlocks] Currently: ", state.itemBlocks);
        await mindspaceService.updateItemData(state.currentItemId, state.currentItemName, state.itemBlocks );
      },
      async addBlockAtIndex({ commit, state }, { block, index }) {
        // First check if itemBlocks exists and is an array
        const currentBlocks = state.itemBlocks || [];
        const newBlocks = [...currentBlocks];
        newBlocks.splice(index, 0, block);
        commit('SET_BLOCKS', newBlocks);
        console.log(newBlocks);
        await mindspaceService.updateItemData(state.currentItemId, state.currentItemName, newBlocks);
      },
      async duplicateBlock({ commit, state }, { id, index }) {
        try {
          // Find the block to duplicate
          const blockToDuplicate = state.itemBlocks.find(block => block.id === id);
          
          if (!blockToDuplicate) {
            throw new Error('Block not found');
          }
    
          // Create a new block with duplicated content but new ID
          const duplicatedBlock = {
            ...blockToDuplicate,
            id: 'e-' + Date.now(), // Generate a new unique ID
            createdAt: Date.now(),
            editedAt: null,
            editedBy: [state.userId],
            createdBy: state.userId
          };
    
          // Use the existing addBlockAtIndex action to insert the duplicated block
          const block = duplicatedBlock;
          const currentBlocks = state.itemBlocks || [];
          const newBlocks = [...currentBlocks];
          // Insert after the current block
          newBlocks.splice(index + 1, 0, block);
          
          commit('SET_BLOCKS', newBlocks);
          await mindspaceService.updateItemData(state.currentItemId, state.currentItemName, newBlocks);
          
          console.log('[duplicateBlock] Block duplicated:', { original: id, new: duplicatedBlock.id });
        } catch (error) {
          console.error('Error duplicating block:', error);
          throw error;
        }
      },
      async updateBlock({ commit, state, dispatch }, { id, content }) {
        commit('UPDATE_BLOCK', { id, content });
        await mindspaceService.updateItemData(state.currentItemId, state.currentItemName, state.itemBlocks);
        // Optionally update the store with the cleaned contents
        await dispatch('setBlocks', state.currentItemId);
      },
      async deleteBlock({ commit, state }, id) {
        commit('DELETE_BLOCK', id);
        console.log("[mindspace.js/itemBlocks] Currently: ", state.itemBlocks);
        await mindspaceService.updateItemData(state.currentItemId, state.currentItemName, state.itemBlocks );
      },
      async moveBlock({ commit, state }, { id, direction }) {
        commit('MOVE_BLOCK', { id, direction });
        console.log("[mindspace.js/itemBlocks] Currently: ", state.itemBlocks);
        await mindspaceService.updateItemData(state.currentItemId, state.currentItemName, state.itemBlocks );
      },
      setEditingBlock({ commit }, id) {
        commit('SET_EDITING_BLOCK', id);
      },

    },
    
    getters: {
      getUserId: state => state.userId,
      getThemeId: state => state.currentThemeId,
      getMindSpaceId: state => state.currentMindSpaceId,
      getItemId: state => state.currentItemId,
      getBlockById: state => (id) => {
        return state.itemBlocks.find(block => block.id === id);
      },
      getItemBlocks: state => state.itemBlocks,
      getThemeName: state => state.currentThemeName,
      getMindSpaceList: state => state.mindSpaceList,
      getMindSpaceName: state => state.currentMindSpaceName,
      getMindSpacePages: state => state.mindSpacePages,
      getCurrentPage: state => state.currentPage,
      getTotalPages: state => state.totalPages,
      getItemName: state => state.currentItemName,
      isLoading: state => state.loading,
      getError: state => state.error,
      // New getter to get items from a specific page
      getPageItems: state => pageIndex => {
        return state.mindSpacePages[pageIndex]?.items || [];
      },
      // New getter to find a folder by ID
      getFolderById: state => folderId => {
        for (const page of state.mindSpacePages) {
          const folder = page.items.find(item => item.id === folderId && item.items);
          if (folder) return folder;
        }
        return null;
      },
      getIsEditMode: state => state.isEditMode,
    }
  };


/*
[EXAMPLE USE]

//MINDSPACE
// Example 1: Update entire items array
store.dispatch('mindspace/updatePageItems', {
  pageIndex: 0,
  items: newItems
});

// Example 2: Reorder items within the same page
// Moving item from index 1 to index 2 (your example case)
store.dispatch('mindspace/reorderPageItems', {
  pageIndex: 0,  // first page
  fromIndex: 1,  // current position (id: '0001')
  toIndex: 2     // new position after id: '0002'
});

// Example 3: Move item between different pages
store.dispatch('mindspace/moveItemBetweenPages', {
  fromPageIndex: 0,  // source page
  toPageIndex: 1,    // destination page
  fromIndex: 1,      // position in source page
  toIndex: 0         // position in destination page
});


//FOLDER
// Example 1: Update entire folder items array
store.dispatch('mindspace/updateFolderItems', {
  folderId: 'f0009',
  items: newItems
});

// Example 2: Reorder items within the same folder
store.dispatch('mindspace/reorderFolderItems', {
  folderId: 'f0009',
  fromIndex: 1,  // current position
  toIndex: 3     // new position
});

// Example 3: Move item between different folders
store.dispatch('mindspace/moveItemBetweenFolders', {
  fromFolderId: 'f0009',
  toFolderId: 'f0010',
  fromIndex: 1,
  toIndex: 0
});

// Get items from a specific page
const pageItems = store.getters['mindspace/getPageItems'](0);

// Find a folder
const folder = store.getters['mindspace/getFolderById']('f0009');

*/