// Updated analysisRecords.js (Vuex store)
import { analysisService } from '@/utility/analysisProcessor';
import { WIDGET_CONFIG } from '@/config/widgetConfig';

export default {
    namespaced: true,
    state: {
        selectedTab:{
            tab_A: '今日',
            tab_B: '今日',
        },
        analysisData:{
            data_A: {}, // DecisionMakingPower
            data_B: {}, // bodyEmotionMindSpirit
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
      SET_SELECTED_TAB_B(state, data) {
        state.selectedTab.tab_B = data;
      },
      SET_DATA_A(state, data) {
        state.analysisData.data_A = data;
      },
      SET_DATA_B(state, data) {
        state.analysisData.data_B = data;
      },
      SET_ANALYSIS_DATA(state, { key, data }) {
        state.analysisData[key] = data;
      },
    },
    actions: {
      selectTab({ commit }, { tab, key }) {
        if (key === 'decisionMakingPower') {
          commit('SET_SELECTED_TAB_A', tab);
        }
        if (key === 'bodyEmotionMindSpirit') {
          commit('SET_SELECTED_TAB_B', tab);
        }
      },
      async loadData({ commit }, uid) {
        
        try {
          commit('SET_LOADING', true);
          
          if (!uid) {
            throw new Error('User not authenticated');
          }

          // Load analysis data using the service
          const analysisData = await analysisService.getAnalysisData(uid, WIDGET_CONFIG);
          
          // Commit the data to store
          commit('SET_DATA_A', analysisData.data_A || {});
          commit('SET_DATA_B', analysisData.data_B || {});
          
          commit('SET_LOADING', false);
        } catch (error) {
          console.error('Error loading analysis data:', error);
          commit('SET_LOADING', false);
          throw error;
        }
      },
      // Optional: Load specific widget data
      async loadWidgetData({ commit, rootGetters }, { widgetKey, widgetId }) {
        try {
          const userId = rootGetters['auth/userId'];
          if (!userId) {
            throw new Error('User not authenticated');
          }

          const widgetData = await analysisService.processWidgetAnalysis(userId, widgetId);
          commit('SET_ANALYSIS_DATA', { key: widgetKey, data: widgetData });
        } catch (error) {
          console.error(`Error loading ${widgetKey} data:`, error);
          throw error;
        }
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