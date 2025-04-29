export default {
    namespaced: true,
    state: {
        selectedTab:{
            tab_A: '今日',
        },
        analysisData:{
            analysisData_A: {}, // DecisionMakingPower
        },
        isLoading: false,
    },
    mutations: {
      SET_LOADING(state, isLoading) {
        state.isLoading = isLoading;
      },
      SET_SELECTED_DECISION_TAB(state, data) {
        state.selectedTab.tab_A = data; // Fixed: Changed data_A to tab_A to match state structure
      },
      SET_ABILITIES_DATA(state, data) { // Added missing mutation that was used in actions
        state.analysisData.analysisData_A = data;
      },
    },
    actions: {
      selectTab({ commit }, { tab, key }) {
        if(key == 'decisionMakingPower'){
            commit('SET_SELECTED_DECISION_TAB', tab);
        }
      },
      loadData({ commit }) {
        return new Promise((resolve) => {
          commit('SET_LOADING', true);
          // Simulating an API call
          setTimeout(() => {
            const fetchedDataA = {
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
            commit('SET_ABILITIES_DATA', fetchedDataA);
            commit('SET_LOADING', false);
            resolve();
          }, 1000);
        });
      },
    },
    getters: {
      currentAbilities: (state) => {
        return state.analysisData.analysisData_A[state.selectedTab.tab_A] || { percentage: 0, items: {} };
      },
      isLoading: (state) => state.isLoading,
    },
  };