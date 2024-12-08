import { 
  updateViewThemeHistory,
  updateViewMindspaceHistory,
  loadViewHistory,
} from '@/firebase/firebaseFirestore';

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
    }
  },
  mutations: {
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
  },
  actions: {
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
  },
  getters: {
    getLastThemeId: state => state.viewHistory.lastThemeId,
    getLastMindSpaceId: state => state.viewHistory.lastMindSpaceId,
    getShowItemWindow: state => state.modalControl.showItemWindow,
    getShowSatWindow: state => state.modalControl.showSatWindow,
  }
};

