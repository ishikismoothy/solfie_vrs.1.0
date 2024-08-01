export default {
  namespaced: true,
  state: {
    selectedScoreTab: '自己評価',
    scoresData: {},
    isLoading: false,
  },
  mutations: {
    SET_SELECTED_SCORE_TAB(state, tab) {
      state.selectedScoreTab = tab;
    },
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    SET_SCORES_DATA(state, data) {
      state.scoresData = data;
    },
  },
  actions: {
    selectScoreTab({ commit }, tab) {
      commit('SET_SELECTED_SCORE_TAB', tab);
    },
    loadScoresData({ commit }) {
      return new Promise((resolve) => {
        commit('SET_LOADING', true);
        // Simulating an API call
        setTimeout(() => {
          const scoresData = {
            '自己評価': {
              date: '2024/01/03',
              items: {
                '開花': 3.9,
                '姿': 4.5,
                '環境': 3.0,
                '活動': 1.5,
              }
            },
            '意識解析': {
              date: '2024/05/03',
              items: {
                '開花': 4.2,
                '姿': 3.7,
                '環境': 3.5,
                '活動': 4.0,
              }
            }
          };
          commit('SET_SCORES_DATA', scoresData);
          commit('SET_LOADING', false);
          resolve();
        }, 1000);
      });
    },
  },
  getters: {
    currentScoreData: (state) => {
      return state.scoresData[state.selectedScoreTab] || { date: '', items: {} };
    },
    getCurrentTab: (state) => {
      return state.selectedScoreTab || '自己評価';
    },
    isLoading: (state) => state.isLoading,
  },
};