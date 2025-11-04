// src/store/modules/mindspace.js
import { mindspaceService} from '@/firebase/firebaseMindSpace';
import {
  updateViewThemeHistory,
  updateViewMindspaceHistory,
  loadViewHistory,
} from '@/firebase/firebaseFirestore';

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
      isSharedView: false,
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
      },
      ADD_NEW_PAGE(state) {
        state.mindSpacePages.push({
          items: []
        });
      },
      CLEANUP_EMPTY_PAGES(state) {
        if (state.mindSpacePages.length <= 1) return;

        state.mindSpacePages = state.mindSpacePages.filter((page, index) => {
          if (index === 0) return true;
          return page.items && page.items.length > 0;
        });

        if (state.mindSpacePages.length === 0) {
          state.mindSpacePages = [{
            items: []
          }];
        }

        if (state.currentPage >= state.mindSpacePages.length) {
          state.currentPage = state.mindSpacePages.length - 1;
        }
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

        const [movedItem] = page.items.splice(fromIndex, 1);

        if (!movedItem) {
          console.error('Failed to remove item for reordering');
          return;
        }

        page.items.splice(toIndex, 0, movedItem);
      },
      MOVE_ITEM_BETWEEN_PAGES(state, { fromPageIndex, toPageIndex, fromIndex, toIndex }) {
        if (!state.mindSpacePages[fromPageIndex]?.items || !state.mindSpacePages[toPageIndex]?.items) {
          console.error('Invalid page indices:', { fromPageIndex, toPageIndex });
          return;
        }

        const updatedPages = [...state.mindSpacePages];
        const movedItem = {...updatedPages[fromPageIndex].items[fromIndex]};

        updatedPages[fromPageIndex] = {
          items: updatedPages[fromPageIndex].items.filter((_, index) => index !== fromIndex)
        };

        const targetItems = [...updatedPages[toPageIndex].items];
        targetItems.splice(toIndex, 0, movedItem);
        updatedPages[toPageIndex] = { items: targetItems };

        state.mindSpacePages = updatedPages;
      },
      REMOVE_ITEM_FROM_PAGE(state, { itemId }) {
        state.mindSpacePages = state.mindSpacePages.map(page => {
          return {
            items: page.items.filter(item => item.id !== itemId)
          };
        });

        state.mindSpacePages = state.mindSpacePages.filter(page => page.items.length > 0);
      },

      //[ADD ITEM]
      ADD_ITEM_TO_PAGE(state, { pageIndex, index, item }) {
        while (state.mindSpacePages.length <= pageIndex) {
          state.mindSpacePages.push({ items: [] });
        }

        if (!state.mindSpacePages[pageIndex].items) {
          state.mindSpacePages[pageIndex].items = [];
        }

        state.mindSpacePages[pageIndex].items.splice(index, 0, item);
      },
      ADD_ITEMS_TO_PAGE(state, { pageIndex, items }) {
        if (!state.mindSpacePages[pageIndex]) {
          state.mindSpacePages[pageIndex] = { items: [] };
        }
        state.mindSpacePages[pageIndex].items.push(...items);
      },
      ADD_FOLDER_TO_PAGE(state, { pageIndex, index, folder }) {
        while (state.mindSpacePages.length <= pageIndex) {
          state.mindSpacePages.push({ items: [] });
        }

        if (!state.mindSpacePages[pageIndex].items) {
          state.mindSpacePages[pageIndex].items = [];
        }

        state.mindSpacePages[pageIndex].items.splice(index, 0, folder);
      },

      //[FOLDER RENDER MANAGEMENT]
      UPDATE_CURRENT_FOLDER(state, folder) {
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
              return { ...item, items: updatedItems };
            }
            return item;
          })
        }));
      },
      MOVE_ITEM_BETWEEN_FOLDERS(state, { fromFolderId, toFolderId, fromIndex, toIndex }) {
        let movedItem = null;

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

        if (movedItem) {
          state.mindSpacePages = state.mindSpacePages.map(page => ({
            items: page.items.map(item => {
              if (item.id === toFolderId && Array.isArray(item.items)) {
                const updatedItems = [...item.items];
                updatedItems.splice(toIndex, 0, movedItem);
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

      //[ITEM WINDOW HANDLING]
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
      },

      //[SHARED VIEW]
      SET_IS_SHARED_VIEW(state, isShared) {
        state.isSharedView = isShared;
      },

      CLEAR_SHARED_STATE(state) {
        state.currentThemeId = null;
        state.currentThemeName = null;
        state.currentMindSpaceId = null;
        state.currentMindSpaceName = null;
        state.currentItemId = null;
        state.currentItemName = null;
        state.mindSpacePages = [{ items: [] }];
        state.currentPage = 0;
        state.totalPages = 0;
        state.currentFolder = null;
        state.itemBlocks = [];
        state.isEditMode = false;
        state.isSharedView = false;
      }
    },

    actions: {
      async setUserId({ commit, state },userId) {
        try {
          commit('SET_LOADING', true);
          commit('SET_USER_ID', userId);
          console.log("[mindspace.js] UserId set:", state.userId);
        } catch (error) {
          console.error('Error initializing user ID:', error);
          commit('SET_ERROR', error.message);
          commit('SET_LOADING', false);
        } finally {
          commit('SET_LOADING', false);
        }
      },
      async loadViewThemeId({ commit, state, dispatch }, uid) {
        commit('SET_LOADING', true);
        try {
          if (!state.userId) {
            commit('SET_USER_ID', uid);
          }

          const viewHistory = await loadViewHistory(state.userId);

          if (!viewHistory) {
            return null;
          }

          if (viewHistory.theme) {
            commit('SET_THEME_ID', viewHistory.theme);
            console.log("[mindspace.js] Theme loaded from history:", state.currentThemeId);
            await dispatch('setThemeData');
          }

          return viewHistory;
        } catch (error) {
          console.error("[mindspace.js] Error loading theme:", error.message);
          return null;
        }
      },
      async setSelectedThemeId({ commit, state, dispatch }, data) {
        try {
          if (!state.userId) {
            commit('SET_USER_ID', data.uid);
          }

          commit('SET_THEME_ID', data.themeId);
          await updateViewThemeHistory(state.userId, state.currentThemeId);
          await dispatch('setThemeData');
          await dispatch('setMindSpaceId');

          console.log("[mindspace.js] Theme selected:", state.currentThemeId);
        } catch (error) {
          console.error("[mindspace.js] Error setting theme:", error);
        }
      },
      async setThemeData({ commit, state }) {
        const currentThemeData = await mindspaceService.getThemeData(state.currentThemeId);
        const currentThemeName = currentThemeData.name;
        commit('SET_THEME_NAME', currentThemeName);
      },
      async setMindSpace({ commit, dispatch, state }) {
        commit('SET_LOADING', true);
        try {
          if (!state.currentMindSpaceId) {
            await dispatch('setMindSpaceId');
          }

          if (state.currentMindSpaceId) {
            await dispatch('setMindSpacePages');
            await dispatch('setMindSpaceList');
          } else {
            console.error("[mindspace.js] Failed to set mindSpaceId");
            throw new Error('No valid mindSpaceId available after setMindSpaceId');
          }

        } catch (error) {
          console.error('Error loading mindspace:', error);
          commit('SET_ERROR', error.message);
          throw error;
        } finally {
          commit('SET_LOADING', false);
          console.log(`❤️‍🔥 Mindspace ready \nTheme: ${state.currentThemeName}, \nMindSpace: ${state.currentMindSpaceName}, \nMindSpaceId: ${state.currentMindSpaceId}, \nPages: ${state.totalPages}`);
        }
      },

      async setMindSpaceId({ commit, state }) {
        try {
          if (!state.currentThemeId) {
            throw new Error('No currentThemeId available for getting defaultMindSpaceId');
          }
          if (!state.userId) {
            throw new Error('No userId available for getting defaultMindSpaceId');
          }

          const defaultMindSpaceId = await mindspaceService.getDefaultMindSpaceId(state.currentThemeId, state.userId);

          if (!defaultMindSpaceId) {
            throw new Error('No default mindSpaceId found from mindspaceService');
          }

          commit('SET_MINDSPACE_ID', defaultMindSpaceId);
          console.log("✅ MindSpaceId set:", state.currentMindSpaceId);

          if (state.userId && state.currentMindSpaceId) {
            await updateViewMindspaceHistory(state.userId, state.currentMindSpaceId);
          }

        } catch (error) {
          console.error('❌ Error setting mindspace ID:', error);
          commit('SET_ERROR', error.message);
          throw error;
        }
      },

      async setMindSpaceList({ commit, state }) {
        try {
          if (!state.currentThemeId) {
            throw new Error('No currentThemeId available');
          }

          const result = await mindspaceService.getListOfMindSpace(state.currentThemeId);

          if (!Array.isArray(result)) {
            throw new Error('Invalid data format: expected an array');
          }

          result.forEach((mindspace, index) => {
            if (!mindspace || typeof mindspace !== 'object') {
              throw new Error(`Invalid mindspace object at index ${index}`);
            }
          });

          commit('SET_MINDSPACE_LIST', result);
          console.log("✅ MindSpace list loaded:", result.length, "spaces");

        } catch (error) {
          console.error('❌ Error loading mindspace list:', error);
          commit('SET_ERROR', error.message);
        }
      },

      async setMindSpacePages({ commit, state }) {
        try {
          if (!state.currentMindSpaceId) {
            throw new Error('No currentMindSpaceId available');
          }

          const result = await mindspaceService.getMindSpaceData(state.currentMindSpaceId);

          if (!result || !result.pages) {
            throw new Error('Invalid data returned from getMindSpaceData');
          }

          const { name, pages, totalPages } = result;

          commit('SET_MINDSPACE_NAME', name);
          commit('SET_MINDSPACE_PAGES', pages);
          commit('SET_TOTAL_PAGES', totalPages);

          console.log("✅ Pages loaded:", {
            name: state.currentMindSpaceName,
            totalPages: state.totalPages,
            itemCount: pages.reduce((sum, page) => sum + page.items.length, 0)
          });

        } catch (error) {
          console.error('❌ Error loading pages:', error);
        
          // If it's the "reading 'name'" error, trigger cleanup
          if (error.message?.includes("Cannot read properties of undefined")) {
              console.log('🔧 Attempting to clean up invalid references...');
              try {
                  await mindspaceService.cleanupInvalidReferences(state.currentMindSpaceId);
                  // Retry loading after cleanup
                  const result = await mindspaceService.getMindSpaceData(state.currentMindSpaceId);
                  commit('SET_MINDSPACE_NAME', result.name);
                  commit('SET_MINDSPACE_PAGES', result.pages);
                  commit('SET_TOTAL_PAGES', result.totalPages);
                  console.log('✅ Cleanup successful, pages loaded');
                  return;
              } catch (cleanupError) {
                  console.error('Failed to cleanup:', cleanupError);
              }
          }
          
          commit('SET_ERROR', error.message);
        } finally {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      },
      async updateDefaultMindSpace({ commit, dispatch, state }, mindSpace) {
        try {
          // Update both ID and name immediately
          commit('SET_MINDSPACE_ID', mindSpace.id);
          commit('SET_MINDSPACE_NAME', mindSpace.name);

          // Update the mindspace list to reflect the new default
          await dispatch('setMindSpacePages');
          await dispatch('setMindSpaceList');

          // Update view history if you have this function
          if (state.userId && mindSpace.id) {
            // await updateViewMindspaceHistory(state.userId, mindSpace.id);
          }

          console.log("✅ Default MindSpace updated:", {
            id: mindSpace.id,
            name: mindSpace.name
          });

        } catch (error) {
          console.error('❌ Error updating default mindspace:', error);
          commit('SET_ERROR', error.message);
          throw error;
        }
      },
      async updateMindSpace({ state, commit }) {
        try {
          commit('SET_LOADING', true);
          commit('SET_ERROR', null);

          await mindspaceService.updateMindSpaceData(state.currentMindSpaceId, state.mindSpacePages);

          console.log('✅ Mindspace updated successfully');
        } catch (error) {
          console.error('❌ Update error:', error);
          commit('SET_ERROR', error.message);
          throw error;
        } finally {
          commit('SET_LOADING', false);
        }
      },
      async saveMindSpaceChanges({ dispatch }, { autoRetry = true, maxRetries = 3 } = {}) {
        let retries = 0;

        const attemptSave = async () => {
          try {
            await dispatch('updateMindSpace');
            console.log('[mindspace.js] Changes saved successfully');
          } catch (error) {
            if (autoRetry && retries < maxRetries) {
              retries++;
              console.log(`[mindspace.js] Retrying save... Attempt ${retries} of ${maxRetries}`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              return attemptSave();
            }
            throw error;
          }
        };

        return attemptSave();
      },
      setCurrentPage({ commit }, page) {
        commit('SET_CURRENT_PAGE', page);
      },
      addNewPage({ commit, state }) {
        commit('ADD_NEW_PAGE');
        commit('SET_TOTAL_PAGES', state.mindSpacePages);
      },
      cleanupEmptyPages({ commit, state }) {
        commit('CLEANUP_EMPTY_PAGES');
        commit('SET_TOTAL_PAGES', state.mindSpacePages.length);
      },
      setIsEditMode({ commit, state }, value){
        commit('SET_IS_EDIT_MODE', value);
        console.log("[mindspace.js] Edit mode:", state.isEditMode ? "ON" : "OFF");
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

        console.log('[mindspace.js] Item added:', itemId);
        await dispatch('setMindSpacePages');

        // IMPORTANT: Make sure to return the itemId
        return itemId;
      } catch (error) {
        console.error('Error adding item:', error);
        throw error;
      }
    },
      addItemsToPage({ commit }, payload) {
        commit('ADD_ITEMS_TO_PAGE', payload);
      },
      async addNewFolder({ commit, state, dispatch }, { pageIndex, index }) {
        try {
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

          console.log('[mindspace.js] Folder added:', folderId);
          await dispatch('setMindSpacePages');
          return folderId;
        } catch (error) {
          console.error('Error adding folder:', error);
          throw error;
        }
      },
      async duplicateItemToPage({ state, dispatch }) {
        try {
          const { itemId } = await mindspaceService.duplicateItemInMindspace(
            state.userId,
            state.currentMindSpaceId,
            state.currentPage,
            state.currentItemId
          );

          console.log('[mindspace.js] Item duplicated:', itemId);
          await dispatch('setMindSpacePages');
          return itemId;
        } catch (error) {
          console.error('Error duplicating item:', error);
          throw error;
        }
      },
      removeItemFromPage({ commit }, { itemId }) {
        commit('REMOVE_ITEM_FROM_PAGE', { itemId });
      },
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
        commit('ADD_ITEM_TO_FOLDER', { folderId, item });

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

          // Set default custom icon for the new folder item
          if (itemId) {
            const defaultIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(255, 86, 56)" stroke-width="2">
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                  <circle cx="12" cy="12" r="1.5" fill="rgb(255, 86, 56)"/>
                                </svg>`;

            await dispatch('user/setItemCustomIcon', {
              itemId,
              customIcon: defaultIcon
            }, { root: true });
          }

          console.log('[mindspace.js] Item added to folder with default icon:', itemId);
          return itemId;
        } catch (error) {
          console.error('Error adding item to folder:', error);
          throw error;
        }
      },
      async duplicateItemToFolder({ state, dispatch }) {
        try {
          const { itemId } = await mindspaceService.duplicateItemToFolder(
            state.userId,
            state.currentMindSpaceId,
            state.currentFolder.id,
            state.currentItemId
          );

          console.log('[mindspace.js] Item duplicated to folder:', itemId);
          await dispatch('setMindSpacePages');
          return itemId;
        } catch (error) {
          console.error('Error duplicating to folder:', error);
          throw error;
        }
      },
      removeItemFromFolder({ commit }, payload) {
        commit('REMOVE_ITEM_FROM_FOLDER', payload);
      },
      async moveItemFromFolderToPage({ commit, state }, { folderId, itemId, targetPageIndex, targetIndex, item }) {
        try {
          const { rawPages, rawFolders } = await mindspaceService.moveItemFromFolderToMindspace(
            state.currentMindSpaceId,
            { folderId, itemId, targetPageIndex, targetIndex }
          );

          const updatedPages = state.mindSpacePages.map(page => ({
            items: [...page.items]
          }));

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

          while (updatedPages.length <= targetPageIndex) {
            updatedPages.push({ items: [] });
          }

          updatedPages[targetPageIndex].items.splice(targetIndex, 0, {
            id: itemId,
            name: item.name,
            shape: item.shape,
            badge: item.badge || null
          });

          commit('SET_MINDSPACE_PAGES', updatedPages);
          commit('SET_RAW_DATA', { pages: rawPages, folders: rawFolders });

          console.log('[mindspace.js] Item moved from folder to page');
        } catch (error) {
          console.error('Error moving item from folder:', error);
          throw error;
        }
      },
      async moveItemToFolder({ commit, state }, { pageIndex, folderId, item }) {
        try {
          const { rawPages, rawFolders } = await mindspaceService.moveItemToFolder(
            state.currentMindSpaceId,
            {
              pageIndex,
              folderId,
              itemId: item.id
            }
          );

          const updatedPages = [...state.mindSpacePages];

          updatedPages[pageIndex] = {
            items: updatedPages[pageIndex].items.filter(pageItem => pageItem.id !== item.id)
          };

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

          commit('SET_MINDSPACE_PAGES', updatedPages);
          commit('SET_RAW_DATA', { pages: rawPages, folders: rawFolders });

          console.log('[mindspace.js] Item moved to folder');
        } catch (error) {
          console.error('Error moving item to folder:', error);
          throw error;
        }
      },
      async deleteItem({ commit, state }, itemId) {
        try {
          const { rawPages, rawFolders } = await mindspaceService.deleteItem(state.currentMindSpaceId, itemId);

          const updatedPages = state.mindSpacePages.map(page => ({
            items: page.items.filter(item => {
              if (item.id === itemId) {
                return false;
              }

              if (item.items) {
                item.items = item.items.filter(folderItem => folderItem.id !== itemId);
              }
              return true;
            })
          }));

          commit('SET_MINDSPACE_PAGES', updatedPages);
          commit('SET_RAW_DATA', { pages: rawPages, folders: rawFolders });

          console.log('[mindspace.js] Item deleted:', itemId);
        } catch (error) {
          console.error('Error deleting item:', error);
          throw error;
        }finally{
          await this.cleanupInvalidReferences(state.currentMindSpaceId);
        }
      },
      async setItemId({ commit, dispatch, state }, itemId) {
        commit('SET_ITEM_ID', itemId);
        console.log('[mindspace.js] Current item:', itemId);

        try {
          await dispatch('setBlocks', itemId);

          const item = state.mindSpacePages.flatMap(page => page.items).find(item => item.id === itemId);
          if (item && item.name) {
            commit('SET_ITEM_NAME', item.name);
          } else {
            commit('SET_ITEM_NAME', 'Unnamed Item');
          }

        } catch (error) {
          console.error('Error loading item data:', error);
        }
      },

      async getItemName({ commit }, itemName) {
        commit('SET_ITEM_NAME', itemName);
      },
      async setItemName({ commit, state, dispatch }, itemName) {
        commit('SET_ITEM_NAME', itemName);
        await mindspaceService.updateItemData(state.currentItemId, state.currentItemName, state.itemBlocks );
        await dispatch('setMindSpacePages');
        console.log("[mindspace.js] Item name updated:", state.currentItemName);
      },
      async setBlocks({ commit }, itemId) {
        const itemData = await mindspaceService.getItemData(itemId);

        if(itemData.success){
          const data = itemData.data;
          commit('SET_BLOCKS', data);
          console.log("[mindspace.js] Blocks loaded:", data.length, "blocks");
        }else{
          console.log("[mindspace.js] No blocks found");
        }
      },
      async addBlock({ commit, state }, block) {
        commit('ADD_BLOCK', block);
        await mindspaceService.updateItemData(state.currentItemId, state.currentItemName, state.itemBlocks );
      },
      async addBlockAtIndex({ commit, state }, { block, index }) {
        const currentBlocks = state.itemBlocks || [];
        const newBlocks = [...currentBlocks];
        newBlocks.splice(index, 0, block);
        commit('SET_BLOCKS', newBlocks);
        await mindspaceService.updateItemData(state.currentItemId, state.currentItemName, newBlocks);
      },
      async duplicateBlock({ commit, state }, { id, index }) {
        try {
          const blockToDuplicate = state.itemBlocks.find(block => block.id === id);

          if (!blockToDuplicate) {
            throw new Error('Block not found');
          }

          const duplicatedBlock = {
            ...blockToDuplicate,
            id: 'e-' + Date.now(),
            createdAt: Date.now(),
            editedAt: null,
            editedBy: [state.userId],
            createdBy: state.userId
          };

          const block = duplicatedBlock;
          const currentBlocks = state.itemBlocks || [];
          const newBlocks = [...currentBlocks];
          newBlocks.splice(index + 1, 0, block);

          commit('SET_BLOCKS', newBlocks);
          await mindspaceService.updateItemData(state.currentItemId, state.currentItemName, newBlocks);

          console.log('[mindspace.js] Block duplicated');
        } catch (error) {
          console.error('Error duplicating block:', error);
          throw error;
        }
      },
      async updateBlock({ commit, state, dispatch }, { id, content }) {
        commit('UPDATE_BLOCK', { id, content });
        await mindspaceService.updateItemData(state.currentItemId, state.currentItemName, state.itemBlocks);
        await dispatch('setBlocks', state.currentItemId);
      },
      async deleteBlock({ commit, state }, id) {
        try {
          const blockToDelete = state.itemBlocks.find(block => block.id === id);
          if (!blockToDelete) {
            console.error('Block not found:', id);
            return;
          }
          if (blockToDelete.type === 'image-block') {
            await mindspaceService.deleteImageFromStorage(blockToDelete.content);
            commit('DELETE_BLOCK', id);
          }else{
            commit('DELETE_BLOCK', id);
          }
        } catch (error) {
          console.error('Error deleting block:', error);
        }
        await mindspaceService.updateItemData(state.currentItemId, state.currentItemName, state.itemBlocks );
      },
      async moveBlock({ commit, state }, { id, direction }) {
        commit('MOVE_BLOCK', { id, direction });
        await mindspaceService.updateItemData(state.currentItemId, state.currentItemName, state.itemBlocks );
      },
      setEditingBlock({ commit }, id) {
        commit('SET_EDITING_BLOCK', id);
      },
      async handleImageUpload({ getters }, { file }) {
        try {
          const userId = getters.getUserId;
          const downloadURL = await mindspaceService.handleImageUpload({
            file,
            userId
          });
          return downloadURL;
        } catch (error) {
          console.error('Error uploading image:', error);
          throw error;
        }
      },
      async setItemImage({ dispatch }, { itemId, imageUrl }) {
        try {
          await mindspaceService.updateItemImage(itemId, imageUrl);
          await dispatch('setMindSpacePages');
          console.log('[mindspace.js] Item image updated');
        } catch (error) {
          console.error('Error updating item image:', error);
          throw error;
        }
      },

      async setSharedMindspace({ commit, dispatch }, { ownerId, themeId, mindspaceId }) {
        try {
          commit('SET_LOADING', true);
          commit('SET_IS_SHARED_VIEW', true);

          commit('SET_USER_ID', ownerId);
          commit('SET_THEME_ID', themeId);
          await dispatch('setThemeData');

          commit('SET_MINDSPACE_ID', mindspaceId);
          await dispatch('setMindSpacePages');
          await dispatch('setMindSpaceList');

          console.log('[mindspace.js] Shared mindspace loaded');
        } catch (error) {
          console.error('Error loading shared mindspace:', error);
          commit('SET_ERROR', error.message);
          throw error;
        } finally {
          commit('SET_LOADING', false);
        }
      },

      clearSharedState({ commit }) {
        commit('CLEAR_SHARED_STATE');
      },

      async refreshCurrentThemeData({ dispatch, state }) {
        try {
          if (!state.currentThemeId || !state.userId) {
            console.log('[mindspace.js] Missing theme ID or user ID for refresh')
            return
          }

          console.log('[mindspace.js] Refreshing current theme data...')

          // Refresh mindspace pages to get latest items
          await dispatch('setMindSpacePages')

          // Refresh user items to get latest data
          await dispatch('user/fetchItems', state.userId, { root: true })

          console.log('[mindspace.js] Current theme data refreshed')
        } catch (error) {
          console.error('[mindspace.js] Error refreshing theme data:', error)
          throw error
        }
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
      getPageItems: state => pageIndex => {
        return state.mindSpacePages[pageIndex]?.items || [];
      },
      getFolderById: state => folderId => {
        for (const page of state.mindSpacePages) {
          const folder = page.items.find(item => item.id === folderId && item.items);
          if (folder) return folder;
        }
        return null;
      },
      getItemById: (state) => (itemId) => {
        for (const page of state.mindSpacePages) {
          for (const item of page.items) {
            if (item.id === itemId) {
              return item;
            }
            if (item.items && Array.isArray(item.items)) {
              const found = item.items.find(folderItem => folderItem.id === itemId);
              if (found) return found;
            }
          }
        }
        return null;
      },
      getIsEditMode: state => state.isEditMode,

    }
  };
