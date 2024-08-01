export default {
  namespaced: true,
  state: {
    selectedAbilityTab: '姿',
    abilitiesData: {},
    isLoading: false,
  },
  mutations: {
    SET_SELECTED_ABILITY_TAB(state, tab) {
      state.selectedAbilityTab = tab;
    },
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    SET_ABILITIES_DATA(state, data) {
      state.abilitiesData = data;
    },
  },
  actions: {
    selectAbilityTab({ commit }, tab) {
      commit('SET_SELECTED_ABILITY_TAB', tab);
    },
    loadAbilitiesData({ commit }) {
      return new Promise((resolve) => {
        commit('SET_LOADING', true);
        // Simulating an API call
        setTimeout(() => {
          const abilitiesData = {
            '姿': {
              percentage: 65,
              items: {
                '意識': 45,
                '同期': 50,
                '選択': 75
              }
            },
            '環境': {
              percentage: 70,
              items: {
                '意識': 60,
                '同期': 80,
                '選択': 70
              }
            },
            '活動': {
              percentage: 55,
              items: {
                '意識': 50,
                '同期': 60,
                '選択': 55
              }
            }
          };
          commit('SET_ABILITIES_DATA', abilitiesData);
          commit('SET_LOADING', false);
          resolve();
        }, 1000);
      });
    },
  },
  getters: {
    currentAbilities: (state) => {
      return state.abilitiesData[state.selectedAbilityTab] || { percentage: 0, items: {} };
    },
    isLoading: (state) => state.isLoading,
  },
};