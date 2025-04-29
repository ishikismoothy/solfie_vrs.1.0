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
} from 'firebase/firestore';
import { getCurrentUserId } from '@/firebase/firebaseAuth';
import { widgetService } from '@/firebase/firebaseWidget';

export default {
  namespaced: true,
  state: {
    user: {
      name: '寺岡 佑記',
      uid: null,
      planType: 'Free Account',
      notifications: 3
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
      showSatWindow: false,
      showMoveItemWindow: false,
      showMindUniverseWindow: false,
    },
    userImages: [],
    userWidgets: [],
    // userIcons: [] NOT YET IN USE
  },
  mutations: {
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
  },
  actions: {
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
      console.log("[user.js/setLastViewLocationHistory] Last Vie Location Set to: ", state.viewHistory.lastLocation);
    },
    setLastViewThemeHistory({ commit, state }, { uid, themeId }){
      //Triggered when user swap mindspace view page.

      //1) Update firebase
      updateViewThemeHistory(uid, themeId)
      //2) Set id
      commit('SET_LAST_THEMEID', themeId);
      console.log("[user.js/setLastMindSpaceId] themeId History: ", state.viewHistory.lastThemeId);
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
          commit('SET_USER_WIDGETS', userWidgets || []);
          return userWidgets;
      } catch (error) {
          console.error("Error getting user widgets:", error);
          return [];
      }
    },
    async addUserWidget({ dispatch, state }, widgetId) {
      try {
          await widgetService.addUsersWidgets(state.user.uid, widgetId);
          // Refresh user widgets after adding
          await dispatch('getUserWidgets');
      } catch (error) {
          console.error("Error adding user widget:", error);
      }
    },
    
    async removeUserWidget({ dispatch, state }, widgetId) {
        try {
            // Add this function to your widgetService
            await widgetService.removeUsersWidgets(state.user.uid, widgetId);
            // Refresh user widgets after removing
            await dispatch('getUserWidgets');
        } catch (error) {
            console.error("Error removing user widget:", error);
        }
    }
  },

  getters: {
    getLastThemeId: state => state.viewHistory.lastThemeId,
    getLastMindSpaceId: state => state.viewHistory.lastMindSpaceId,
    getShowItemWindow: state => state.modalControl.showItemWindow,
    getShowSatWindow: state => state.modalControl.showSatWindow,
    getUserImages: state => state.userImages,
  }
};
