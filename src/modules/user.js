//module/user.js
import {
  updateViewThemeHistory,
  updateViewMindspaceHistory,
  loadViewHistory,
} from '@/firebase/firebaseFirestore';
import { db } from '@/firebase/firebaseInit';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { getCurrentUserId } from '@/firebase/firebaseAuth';
import { widgetService } from '@/firebase/firebaseWidget';
import { mindspaceService } from '@/firebase/firebaseMindSpace';

export default {
  namespaced: true,
  state: {
    user: {
      name: '寺岡 佑記',
      uid: null,
      planType: 'Free Account',
      notifications: 3,
      isMobile: null,
    },
    stats: {
      solfieLevel: 10,
      questCleared: 0,
      averageScore: 0
    },
    data: {
      themeId: null,// Focused theme
      recordId: null,//Latest recordId
      mindSpaceId: null,// Focused mindSpace
    },
    viewHistory: {
      lastLocation: "themespace",
      lastThemeId: null,
      lastMindSpaceId: null,
    },
    dock:{
      isVisible: false,
      isExpanded: false
    },
    editMonitor:{
      isEditSatisfaction: false,
      isBlockEdit: false,
    },
    modalControl:{
      showItemWindow: false,
      showItemWindowFromMindSlot: false,
      showSatWindow: false,
      showMoveItemWindow: false,
      showMindUniverseWindow: false,
    },
    userImages: [],
    userWidgets: {},
    // Add items state
    items: {
      data: {},
      loading: false,
      lastFetched: null
    },
    // Add global icon synchronization state
    itemCustomIcons: {}, // { itemId: svgString }
    // userIcons: [] NOT YET IN USE
  },
  mutations: {
    SET_DEVICE_TYPE(state, value){
      state.user.isMobile = value;
    },
    SET_USER_ID(state, id){
      state.user.uid = id;
    },
    SET_LAST_LOCATION(state, location){
      state.viewHistory.lastLocation = location;
    },
    SET_LAST_THEMEID(state, id){
      state.viewHistory.lastThemeId = id;
    },
    SET_LAST_MINDSPACEID(state, id){
      state.viewHistory.lastMindSpaceId = id;
    },
    SET_DOCK_VISIBILITY(state, value){
      state.dock.isVisible = value;
    },
    SET_DOCK_EXPANDED(state, value) {
      state.dock.isExpanded = value;
    },
    SET_IS_BLOCK_EDIT(state, value){
      state.editMonitor.isBlockEdit = value;
    },
    SET_IS_SATISFACTION_EDIT(state, value) {
      state.editMonitor.isEditSatisfaction = value;
    },
    TRIGGER_ITEM_WINDOW (state, boolean) {
      state.modalControl.showItemWindow = boolean;
    },
    TRIGGER_ITEM_WINDOW_FROM_MINDSLOT (state, boolean) {
      state.modalControl.showItemWindowFromMindSlot = boolean;
    },
    TRIGGER_SAT_WINDOW (state, boolean) {
      state.modalControl.showSatWindow = boolean;
    },
    TRIGGER_MOVEITEM_WINDOW (state, boolean) {
      state.modalControl.showMoveItemWindow = boolean;
    },
    TRIGGER_MINDUNIVERSE_WINDOW (state, boolean) {
      state.modalControl.showMindUniverseWindow = boolean;
    },
    SET_USER_IMAGES(state, images) {
      state.userImages = images;
    },
    ADD_USER_IMAGE(state, imageUrl) {
      state.userImages.push(imageUrl);
    },
    SET_USER_WIDGETS(state, widgets) {
      state.userWidgets = widgets;
    },
    // Add items mutations
    SET_ITEMS_LOADING(state, loading) {
      state.items.loading = loading;
    },
    SET_ITEMS_DATA(state, items) {
      state.items.data = items;
      state.items.lastFetched = Date.now();
    },
    UPDATE_ITEM(state, { itemId, updates }) {
      if (state.items.data[itemId]) {
        state.items.data[itemId] = { ...state.items.data[itemId], ...updates };
      }
    },

    // Global Icon Synchronization Mutations
    SET_ITEM_CUSTOM_ICON: (state, { itemId, customIcon }) => {
      if (customIcon === null || customIcon === undefined) {
        // Remove the custom icon
        if (state.itemCustomIcons[itemId]) {
          delete state.itemCustomIcons[itemId]
        }
      } else {
        // Set the custom icon
        state.itemCustomIcons[itemId] = customIcon
      }
    },

    SET_ALL_ITEM_CUSTOM_ICONS: (state, customIcons) => {
      state.itemCustomIcons = { ...customIcons }
    },

    REMOVE_ITEM_CUSTOM_ICON: (state, itemId) => {
      if (state.itemCustomIcons[itemId]) {
        delete state.itemCustomIcons[itemId]
      }
    }
  },
  actions: {
    async setDeviceType({ commit }, size){
      try {
        if (size <= 768){
          commit('SET_DEVICE_TYPE', true);
        }
        else {
          commit('SET_DEVICE_TYPE', false);
        }
      } catch (error) {
        commit('SET_ERROR', error.message);
      }
    },
    async setUserId({ commit, state }) {
      //console.log("[user.js/setUserId] TRIGGERED");
      try {

        const userId = await getCurrentUserId();

        commit('SET_USER_ID', userId);
        console.log("[user.js/setUserId] UserId: ",state.user.uid);

      } catch (error) {
        console.error('Error initializing user ID:', error);
        commit('SET_ERROR', error.message);
      } finally {
        //console.log("[user.js/setUserId] Finish Process");
      }
    },
    setLastViewLocationHistory({ commit, state }, location){
      commit('SET_LAST_LOCATION', location.lastLocation);
      console.log("[user.js/setLastViewLocationHistory] Last View Location Set to: ", state.viewHistory.lastLocation);
    },
    setLastViewThemeHistory({ commit, state }, { uid, themeId }){
      //Triggered when user swap mindspace view page.

      //1) Update firebase
      updateViewThemeHistory(uid, themeId)
      //2) Set id
      commit('SET_LAST_THEMEID', themeId);
      console.log("[user.js/setLastViewThemeHistory] themeId History: ", state.viewHistory.lastThemeId);
    },
    setLastViewMindSpaceHistory({ commit, state }, { uid, mindSpaceId }){
      //Triggered when user swap mindspace view page.

      //1) Update firebase
      updateViewMindspaceHistory(uid, mindSpaceId)
      //2) Set id
      commit('SET_LAST_MINDSPACEID', mindSpaceId);
      console.log("[user.js/setLastMindSpaceId] mindspaceId History: ", state.viewHistory.lastMindSpaceId);
    },
    loadLastViewHistory( { commit }, uid) {
      //Trigger upon loading mindspace page.

      //1) read from firebase
      const lastViewHistory = loadViewHistory(uid);
      console.log("[user.js/loadLastViewHistory] ViewHistory: ", lastViewHistory);

      //2) Set id
      commit('SET_LAST_THEMEID', lastViewHistory.theme);
      commit('SET_LAST_MINDSPACEID', lastViewHistory.mindspace);
    },
    setDockVisibility({ commit },value){
      commit('SET_DOCK_VISIBILITY', value);
    },
    setDockExpanded({ commit },value){
      commit('SET_DOCK_EXPANDED', value);
    },
    setIsBlockEdit({ commit },value){
      commit('SET_IS_BLOCK_EDIT', value);
    },
    setIsEditSatisfaction({ commit, state },value){
      commit('SET_IS_SATISFACTION_EDIT', value);
      console.log(state.editMonitor.isEditSatisfaction);
    },
    //Modal Control
    triggerItemWindow({ commit, state }, boolean) {
      commit('TRIGGER_ITEM_WINDOW', boolean);
      console.log("Item Window Set to: ", state.modalControl.showItemWindow);
    },
    triggerItemWindowFromMindSlot({ commit, state }, boolean) {
      commit('TRIGGER_ITEM_WINDOW_FROM_MINDSLOT', boolean);
      console.log("Item Window Set to: ", state.modalControl.triggerItemWindowFromMindSlot);
    },
    triggerSatWindow({ commit, state }, boolean) {
      commit('TRIGGER_SAT_WINDOW', boolean);
      console.log("Satisfaction Window Set to: ", state.modalControl.showItemWindow);
    },
    triggerMoveItemWindow({ commit, state }, boolean){
      commit('TRIGGER_MOVEITEM_WINDOW', boolean);
      console.log("Move Item Window Set to: ", state.modalControl.showMoveItemWindow);
    },
    triggerMindUniverseWindow({ commit, state }, boolean){
      commit('TRIGGER_MINDUNIVERSE_WINDOW', boolean);
      console.log("MindUniverse Window Set to: ", state.modalControl.showMindUniverseWindow);
    },

    async fetchUserImages({ commit, state }) {
      try {
        // Fetch images from Firebase or your backend (replace this with actual fetching logic)
        const userId = state.user.uid;
        if (!userId) {
          throw new Error("User ID is not available.");
        }
        const q = query(collection(db, 'user_images'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);

        const images = [];
        querySnapshot.forEach((doc) => {
          images.push(doc.data().imageUrl);  // Assuming 'imageUrl' field stores the image URL
        });

        commit('SET_USER_IMAGES', images);
        console.log("[user.js/fetchUserImages] Fetched Images: ", images);
      } catch (error) {
        console.error('Error fetching user images:', error);
      }
    },

    addUserImage({ commit }, imageUrl) {
      commit('ADD_USER_IMAGE', imageUrl);
      console.log("[user.js/addUserImage] Image Added: ", imageUrl);
    },

    async getUserWidgets({ commit, state }) {
      if (!state.user.uid) {
          console.error("No user is signed in");
          return;
      }
      try {
          const userWidgets = await widgetService.getUsersWidgets(state.user.uid);
          // Fix: Change || [] to || {}
          commit('SET_USER_WIDGETS', userWidgets || {});
          return userWidgets;
      } catch (error) {
          console.error("Error getting user widgets:", error);
          // Fix: Return {} instead of []
          return {};
      } finally {
          console.log("[user.js/getUserWidgets] User's widgets: ", state.userWidgets)
      }
    },
    async addUserWidget({ dispatch, state }, { widgetId, themeId }) {
      try {
          await widgetService.addUsersWidgets(state.user.uid, widgetId, themeId);
          // Refresh user widgets after adding
          await dispatch('getUserWidgets');
      } catch (error) {
          console.error("Error adding user widget:", error);
      }
    },

    async removeUserWidget({ dispatch, state }, { widgetId, themeId }) {
        try {
            // Add this function to your widgetService
            await widgetService.removeUsersWidgets(state.user.uid, widgetId, themeId);
            // Refresh user widgets after removing
            await dispatch('getUserWidgets');
        } catch (error) {
            console.error("Error removing user widget:", error);
        }
    },

    // Add items actions
    async fetchItems({ commit, state, rootState }, userId = null) {
      // Check if accessing via share link first
      const shareData = rootState.sharing?.currentShareData;

      let targetUserId;

      if (shareData?.ownerId) {
        // If accessing shared content, use the owner's ID
        targetUserId = shareData.ownerId;
        console.log('[user.js/fetchItems] Using owner ID from share:', targetUserId);
      } else {
        // Otherwise use provided userId or current user
        targetUserId = userId || state.user?.uid;
      }
      
      if (!targetUserId) {
        console.log('[user.js/fetchItems] No user ID available');
        return;
      }

      if (state.items.loading) {
        console.log('[user.js/fetchItems] Already loading, skipping');
        return;
      }

      commit('SET_ITEMS_LOADING', true);
      try {
        console.log('🌍 [user.js/fetchItems] Fetching items for user:', targetUserId);
        const items = await mindspaceService.fetchItemsForSlots(targetUserId);
        commit('SET_ITEMS_DATA', items);
        console.log('🌍 [user.js/fetchItems] Items updated:', Object.keys(items).length, 'items',items );

        // Log any items with images for debugging
        const itemsWithImages = Object.values(items).filter(item => item.img);
        console.log('🌍 [user.js/fetchItems] Items with images:', itemsWithImages.length);
      } catch (error) {
        console.error('🌍 [user.js/fetchItems] Error fetching items:', error);
      } finally {
        commit('SET_ITEMS_LOADING', false);
      }
    },

    updateItemImage({ commit }, { itemId, imageUrl }) {
      commit('UPDATE_ITEM', {
        itemId,
        updates: { img: imageUrl }
      });
      console.log('🌍 [user.js/updateItemImage] Updated item image:', itemId);
    },

    updateItemName({ commit }, { itemId, name }) {
      commit('UPDATE_ITEM', {
        itemId,
        updates: { name }
      });
      console.log('🌍 [user.js/updateItemName] Updated item name:', itemId, name);
    },

    // Global Icon Synchronization Actions
    async setItemCustomIcon({ commit, state, dispatch }, { itemId, customIcon }) {
      try {
        // Update local state
        commit('SET_ITEM_CUSTOM_ICON', { itemId, customIcon })

        const userId = state.user.uid
        if (userId) {
          // Update custom icon in Firebase
          await updateItemCustomIconInFirebase(userId, itemId, customIcon)

          // NEW: Update the item's icon property
          await mindspaceService.updateItemIcon(itemId, customIcon || 'square.svg')

          // Refresh items to reflect the change
          await dispatch('fetchItems', userId)
        }
      } catch (error) {
        console.error('Error setting custom icon:', error)
        throw error
      }
    },

    async fetchItemCustomIcons({ commit, state }) {
      try {
        const userId = state.user.uid
        if (!userId) return

        const customIcons = await getItemCustomIconsFromFirebase(userId)
        commit('SET_ALL_ITEM_CUSTOM_ICONS', customIcons)

        console.log('✅ Custom icons fetched from Firebase:', Object.keys(customIcons).length, 'icons')
      } catch (error) {
        console.error('Error fetching custom icons:', error)
      }
    },

    async removeItemCustomIcon({ commit, state }, itemId) {
      try {
        // Update local state
        commit('REMOVE_ITEM_CUSTOM_ICON', itemId)

        // Update in Firebase
        const userId = state.user.uid
        if (userId) {
          await removeItemCustomIconFromFirebase(userId, itemId)
        }

        console.log(`✅ Custom icon removed for item ${itemId}`)
      } catch (error) {
        console.error('Error removing custom icon:', error)
        throw error
      }
    }
  },

  getters: {
    getLastThemeId: state => state.viewHistory.lastThemeId,
    getLastMindSpaceId: state => state.viewHistory.lastMindSpaceId,
    getShowItemWindow: state => state.modalControl.showItemWindow,
    getShowSatWindow: state => state.modalControl.showSatWindow,
    getUserImages: state => state.userImages,
    // Add items getters
    getItems: state => state.items.data,
    getItem: state => itemId => state.items.data[itemId] || null,
    getItemName: state => itemId => {
      const item = state.items.data[itemId];
      return item?.name || item?.title || 'Unnamed Item';
    },
    getItemImage: state => itemId => {
      const item = state.items.data[itemId];
      return item?.img || null;
    },
    isItemsLoading: state => state.items.loading,

    // Global Icon Synchronization Getters
    getItemCustomIcon: (state) => (itemId) => {
      return state.itemCustomIcons[itemId] || null
    },

    getAllItemCustomIcons: (state) => {
      return state.itemCustomIcons
    }
  }
};

// Firebase service functions for icon management
async function updateItemCustomIconInFirebase(userId, itemId, customIcon) {
  if (customIcon === null) {
    // Remove the icon
    await deleteDoc(doc(db, 'users', userId, 'itemCustomIcons', itemId))
  } else {
    // Set the icon
    await setDoc(doc(db, 'users', userId, 'itemCustomIcons', itemId), {
      customIcon,
      updatedAt: new Date()
    })
  }
}

async function getItemCustomIconsFromFirebase(userId) {
  const q = query(collection(db, 'users', userId, 'itemCustomIcons'))
  const querySnapshot = await getDocs(q)

  const customIcons = {}
  querySnapshot.forEach(doc => {
    customIcons[doc.id] = doc.data().customIcon
  })

  return customIcons
}

async function removeItemCustomIconFromFirebase(userId, itemId) {
  await deleteDoc(doc(db, 'users', userId, 'itemCustomIcons', itemId))
}
