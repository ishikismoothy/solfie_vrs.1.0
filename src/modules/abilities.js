export default {
  namespaced: true,
  state: {
    selectedAbilityTab: '今日',
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
            '1年': {
              percentage: 65,
              items: {
                '主体性': 45,
                '方向性': 50,
                '安定性': 75
              }
            },
            '6ヶ月': {
              percentage: 70,
              items: {
                '主体性': 60,
                '方向性': 80,
                '安定性': 70
              }
            },
            '今日': {
              percentage: 55,
              items: {
                '主体性': 50,
                '方向性': 60,
                '安定性': 55
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