export default {
    namespaced: true,
    state: {
        selectedTab:{
            tab_A: '今日',
            tab_B: '今日',
        },
        analysisData:{
            data_A: {}, // DecisionMakingPower
            data_B: {}, // DecisionMakingPower
        },
        isLoading: false,
    },
    mutations: {
      SET_LOADING(state, isLoading) {
        state.isLoading = isLoading;
      },
      SET_SELECTED_TAB_A(state, data) {
        state.selectedTab.tab_A = data;
      },
      SET_SELECTED_TAB_B(state, data) {  // Added this
        state.selectedTab.tab_B = data;
      },
      SET_DATA_A(state, data) {
        state.analysisData.data_A = data;
      },
      SET_DATA_B(state, data) {
        state.analysisData.data_B = data;
      },
    },
    actions: {
      selectTab({ commit }, { tab, key }) {
        if (key === 'decisionMakingPower') {
          commit('SET_SELECTED_TAB_A', tab);
        }
        if (key === 'bodyEmotionMindSpirit') {
          commit('SET_SELECTED_TAB_B', tab);  // Changed to SET_SELECTED_TAB_B
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
                  '安定性': 75,
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
            const fetchedDataB = {
              '1年': {
                percentage: 65,
                items: {
                  'Body': 45,
                  'Emotion': 50,
                  'Mind': 75,
                  'Spirit': 75,
                  
                }
              },
              '6ヶ月': {
                percentage: 70,
                items: {
                  'Body': 60,
                  'Emotion': 80,
                  'Mind': 70,
                  'Spirit': 75,
                }
              },
              '今日': {
                percentage: 55,
                items: {
                  'Body': 50,
                  'Emotion': 60,
                  'Mind': 55,
                  'Spirit': 75,
                }
              }
            };
            commit('SET_DATA_A', fetchedDataA);
            commit('SET_DATA_B', fetchedDataB);
            commit('SET_LOADING', false);
            resolve();
          }, 1000);
        });
      },
    },
    getters: {
      getDataA: (state) => {
        return state.analysisData.data_A[state.selectedTab.tab_A] || { percentage: 0, items: {} };
      },
      getDataB: (state) => {
        return state.analysisData.data_B[state.selectedTab.tab_B] || { percentage: 0, items: {} };
      },
      isLoading: (state) => state.isLoading,
    },
  };