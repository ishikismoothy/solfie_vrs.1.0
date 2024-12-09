import { themeService } from '@/firebase/firebaseThemeSpace';

export default {
  namespaced: true,
  state: {
    selectedTab: {
      selectedSatTab: `comparison`,
      selectedScoreTab: '自己評価',
      scopeSatTab: 'year'
    },
    satisfactionData: {
      selfAssessment: [],
      aiAssessment: []
    },
    scoresData: {},
    isLoading: false,
  },
  mutations: {
    SET_SATISFACTION_DATA(state, data) {
      state.satisfactionData = data;
    },
    SET_SELECTED_SAT_TAB(state, tab) {
      state.selectedTab.selectedSatTab = tab;
    },
    SET_SCOPE_TAB(state, scope) {
      state.selectedTab.scopeSatTab = scope;
    },
    SET_SELECTED_SCORE_TAB(state, tab) {
      state.selectedTab.selectedScoreTab = tab;
    },
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    SET_SCORES_DATA(state, data) {
      state.scoresData = data;
    },
  },
  actions: {
    async fetchSatisfactionData({ commit }, themeId) {
      console.log("[scores.js/fetchSatisfactionData]",themeId)
      try {
        const themeData = await themeService.getThemeData(themeId);
        if (themeData && themeData.assessment) {
          commit('SET_SATISFACTION_DATA', {
            selfAssessment: themeData.assessment.selfAssessment || [],
            aiAssessment: themeData.assessment.aiAssessment || []
          });
        }
      } catch (error) {
        console.error('Error fetching satisfaction data:', error);
        throw error;
      }
    },

    selectSatTab({ commit }, tab) {
      commit('SET_SELECTED_SAT_TAB', tab);
    },

    selectScopeTab({ commit }, scope) {
      commit('SET_SCOPE_TAB', scope);
    },
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
      return state.scoresData[state.selectedTab.selectedScoreTab] || { date: '', items: {} };
    },
    getCurrentTab: (state) => {
      return state.selectedTab.selectedScoreTab || '自己評価';
    },
    isLoading: (state) => state.isLoading,
  },
};