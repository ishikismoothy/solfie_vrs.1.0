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
    }
  },
  mutations: {
    SET_LAST_THEMEID(state, id){
      state.viewHistory.lastThemeId = id;
    },
    SET_LAST_MINDSPACEID(state, id){
      state.viewHistory.lastMindSpaceId = id;
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
  },
  getters: {
    getLastThemeId: state => state.viewHistory.lastThemeId,
    getLastMindSpaceId: state => state.viewHistory.lastMindSpaceId,
  }
};

