// Updated analysisRecords.js (Vuex store)
import { analysisService } from '@/utility/analysisProcessor';
import { WIDGET_CONFIG, ADVICE_WIDGET_CONFIG } from '@/config/widgetConfig';

export default {
    namespaced: true,
    state: {
        selectedTab:{
            tab_A: '今日',
            tab_B: '今日',
            tab_C: '今日',
        },
        analysisData:{
            data_A: {}, // DecisionMakingPower
            data_B: {}, // bodyEmotionMindSpirit
            data_C: {}, // 活動環境表現
            advice_A: [], // Advice data for DecisionMakingPower
            advice_B: [], // Advice data for bodyEmotionMindSpirit
            advice_C: [], // Advice data for 活動環境表現
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
      SET_SELECTED_TAB_C(state, data) {
        state.selectedTab.tab_C = data;
      },
      SET_DATA_A(state, data) {
        state.analysisData.data_A = data;
      },
      SET_DATA_B(state, data) {
        state.analysisData.data_B = data;
      },
      SET_DATA_C(state, data) {
        state.analysisData.data_C = data;
      },
      SET_ADVICE_A(state, data) {
        state.analysisData.advice_A = data;
      },
      SET_ADVICE_B(state, data) {
        state.analysisData.advice_B = data;
      },
      SET_ADVICE_C(state, data) {
        state.analysisData.advice_C = data;
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
        if (key === 'activityEnvironmentExpression') {
          commit('SET_SELECTED_TAB_C', tab);
        }
      },
      async loadData({ commit }, uid) {
        try {
          commit('SET_LOADING', true);
          
          if (!uid) {
            throw new Error('User not authenticated');
          }

          // Load regular analysis data using the existing widget config
          const analysisData = await analysisService.getAnalysisData(uid, WIDGET_CONFIG);
          
          const adviceData = await analysisService.getAdviceData(uid, ADVICE_WIDGET_CONFIG);
          
          // Commit the data to store
          commit('SET_DATA_A', analysisData.data_A || {});
          commit('SET_DATA_B', analysisData.data_B || {});
          commit('SET_DATA_C', analysisData.data_C || {});
          
          // Commit advice data
          commit('SET_ADVICE_A', adviceData.advice_A || []);
          commit('SET_ADVICE_B', adviceData.advice_B || []);
          commit('SET_ADVICE_C', adviceData.advice_C || []);
          
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
      getDataC: (state) => {
        return state.analysisData.data_C[state.selectedTab.tab_C] || { percentage: 0, items: {} };
      },
      getAdviceA: (state) => {
        return state.analysisData.advice_A || [];
      },
      getAdviceB: (state) => {
        return state.analysisData.advice_B || [];
      },
      getAdviceC: (state) => {
        return state.analysisData.advice_C || [];
      },
      isLoading: (state) => state.isLoading,
    },
  };