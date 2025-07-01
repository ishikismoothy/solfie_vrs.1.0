// analysisRecords.js (Vuex store)
import { analysisService } from '@/utility/analysisProcessor';
import { recordService } from '@/firebase/firebaseRecrods';
import { WIDGET_CONFIG, ADVICE_WIDGET_CONFIG } from '@/config/widgetConfig';
import { useStore } from 'vuex';

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
            text_A: null, // Quote data - single object with content and description,
            text_B: null,
        },
        isLoading: false,
        // Store current theme info
        currentThemeId: null,
        usersWidgets: {},
        lastLoadedThemeId: null, // Track theme that was last loaded
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
      // Add this new mutation for setting quote data
      SET_TEXT_A(state, data) {
        state.analysisData.text_A = data;
      },
      SET_TEXT_B(state, data) {
        state.analysisData.text_B = data;
      },
      SET_ANALYSIS_DATA(state, { key, data }) {
        state.analysisData[key] = data;
      },
      SET_CURRENT_THEME_ID(state, themeId) {
        state.currentThemeId = themeId;
      },
      SET_USERS_WIDGETS(state, usersWidgets) {
        state.usersWidgets = usersWidgets;
      },
      SET_LAST_LOADED_THEME_ID(state, themeId) {
        state.lastLoadedThemeId = themeId;
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

      // Get current theme ID from themeSpace store
      async getCurrentThemeId({ commit }, themeId) {
        try {
          
          console.log('🎯 Final current theme ID:', themeId);
          commit('SET_CURRENT_THEME_ID', themeId);
          return themeId;
        } catch (error) {
          console.error('❌ Error getting current theme ID:', error);
          return null;
        }
      },

      // Get users widgets configuration
      async getUsersWidgets({ commit }, uid) {
        try {
          const usersWidgets = await recordService.getUsersWidgets(uid);
          commit('SET_USERS_WIDGETS', usersWidgets);
          return usersWidgets;
        } catch (error) {
          console.error('❌ Error getting users widgets:', error);
          return {};
        }
      },

      // Main data loading action - current theme based
      async loadData({ commit, dispatch }, { uid, themeId }) {
        try {
          commit('SET_LOADING', true);
          
          if (!uid) {
            throw new Error('User not authenticated');
          }

          console.log('🚀 Loading data for current theme...');

          // Get current theme ID and users widgets configuration
          const [currentThemeId, usersWidgets] = await Promise.all([
            dispatch('getCurrentThemeId', themeId),
            dispatch('getUsersWidgets', uid)
          ]);
          
          if (!currentThemeId) {
            console.warn('⚠️ No current theme ID found');
            commit('SET_LOADING', false);
            return;
          }

          console.log('📊 Loading data with:', { currentThemeId, usersWidgets });

          // Load all types of data in parallel
          const [analysisData, adviceData, textData] = await Promise.all([
            analysisService.getAnalysisData(uid, currentThemeId, usersWidgets),
            analysisService.getAdviceData(uid, currentThemeId, usersWidgets),
            analysisService.getTextData(uid, currentThemeId, usersWidgets)
          ]);
          
          console.log('📈 Analysis data loaded:', analysisData);
          console.log('💡 Advice data loaded:', adviceData);
          console.log('📝 Text data loaded:', textData);
          
          // Commit the data to store
          commit('SET_DATA_A', analysisData.data_A || {});
          commit('SET_DATA_B', analysisData.data_B || {});
          commit('SET_DATA_C', analysisData.data_C || {});
          
          // Commit advice data
          commit('SET_ADVICE_A', adviceData.advice_A || []);
          commit('SET_ADVICE_B', adviceData.advice_B || []);
          commit('SET_ADVICE_C', adviceData.advice_C || []);
          
          // Commit text data
          commit('SET_TEXT_A', textData.text_A || null);
          commit('SET_TEXT_B', textData.text_B || null);

          // Track the theme we loaded data for
          commit('SET_LAST_LOADED_THEME_ID', currentThemeId);
          
          console.log('✅ All data committed to store successfully');
          console.log('📦 Final store state:', {
            data: analysisData,
            advice: adviceData,
            text: textData
          });
          
          commit('SET_LOADING', false);
        } catch (error) {
          console.error('❌ Error loading analysis data:', error);
          commit('SET_LOADING', false);
          throw error;
        }
      },

      // Load specific widget data
      async loadWidgetData({ commit, state, dispatch }, { widgetKey, isAdvice = false, uid }) {
        const store = useStore();
        try {
          if (!uid) {
            throw new Error('User not authenticated');
          }

          // Get current theme info if not available
          let currentThemeId = store.state.themeSpace.currentThemeId;
          let usersWidgets = state.usersWidgets;
          
          if (!currentThemeId) {
            currentThemeId = await dispatch('getCurrentThemeId', uid);
          }
          
          if (!usersWidgets || Object.keys(usersWidgets).length === 0) {
            usersWidgets = await dispatch('getUsersWidgets', uid);
          }

          console.log('🎯 Loading specific widget data:', { widgetKey, isAdvice, currentThemeId });
          
          // Get the widget ID for this category
          const widgetConfig = isAdvice ? ADVICE_WIDGET_CONFIG : WIDGET_CONFIG;
          const widgetId = widgetConfig[widgetKey];
          
          if (!widgetId) {
            throw new Error(`No widget ID found for ${widgetKey}`);
          }

          // Check if current theme has this widget
          const themeWidgets = usersWidgets[currentThemeId] || [];
          if (!themeWidgets.includes(widgetId)) {
            console.warn(`⚠️ Current theme ${currentThemeId} does not have widget ${widgetId}`);
            return;
          }
          
          // Load the data
          let widgetData;
          if (isAdvice) {
            widgetData = await analysisService.processAdviceData(uid, currentThemeId, widgetId);
          } else {
            widgetData = await analysisService.processWidgetAnalysis(uid, currentThemeId, widgetId);
          }
          
          commit('SET_ANALYSIS_DATA', { key: widgetKey, data: widgetData });
        } catch (error) {
          console.error(`❌ Error loading ${widgetKey} data:`, error);
          throw error;
        }
      },

      // Check if theme has changed and reload data if necessary
      async checkAndReloadIfThemeChanged({ state, dispatch, rootGetters }, uid) {
        try {
          const currentFocusedTheme = rootGetters['themeSpace/getFocusedThemeId'];
          const lastLoadedTheme = state.lastLoadedThemeId;
          
          // Check if theme has changed
          if (currentFocusedTheme && currentFocusedTheme !== lastLoadedTheme) {
            console.log('🔄 Theme changed, reloading data...', {
              previous: lastLoadedTheme,
              current: currentFocusedTheme
            });
            
            await dispatch('loadData', uid);
          }
        } catch (error) {
          console.error('❌ Error checking theme changes:', error);
        }
      },

      // Debug action to check current configuration
      async debugCurrentConfiguration({ state, rootGetters }) {
        const currentThemeId = state.currentThemeId || rootGetters['themeSpace/getFocusedThemeId'];
        const usersWidgets = state.usersWidgets;
        
        console.log('🔧 Current Configuration Debug:');
        console.log('Current theme ID:', currentThemeId);
        console.log('Users widgets:', usersWidgets);
        console.log('Theme widgets:', usersWidgets[currentThemeId] || []);
        console.log('Analysis data keys:', Object.keys(state.analysisData));
        console.log('Last loaded theme:', state.lastLoadedThemeId);
        
        // Check which widgets are available for current theme
        const themeWidgets = usersWidgets[currentThemeId] || [];
        const availableData = {};
        const availableAdvice = {};
        
        Object.entries(WIDGET_CONFIG).forEach(([key, widgetId]) => {
          availableData[key] = themeWidgets.includes(widgetId);
        });
        
        Object.entries(ADVICE_WIDGET_CONFIG).forEach(([key, widgetId]) => {
          availableAdvice[key] = themeWidgets.includes(widgetId);
        });
        
        console.log('Available data widgets:', availableData);
        console.log('Available advice widgets:', availableAdvice);
        
        return {
          currentThemeId,
          usersWidgets,
          themeWidgets,
          availableData,
          availableAdvice,
          analysisDataKeys: Object.keys(state.analysisData),
          lastLoadedTheme: state.lastLoadedThemeId
        };
      },

      // Force reload data (useful for debugging)
      async forceReloadData({ dispatch }, uid) {
        console.log('🔄 Force reloading all data...');
        await dispatch('loadData', uid);
      }
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
      getTextDataA: (state) => {
        return state.analysisData.text_A || null
      },
      getTextDataB: (state) => {
        return state.analysisData.text_B || null
      },
      isLoading: (state) => state.isLoading,
      
      // New getters for current theme info
      getCurrentThemeId: (state) => state.currentThemeId,
      getUsersWidgets: (state) => state.usersWidgets,
      getLastLoadedThemeId: (state) => state.lastLoadedThemeId,
      
      // Check if current theme has specific widget
      hasWidgetInCurrentTheme: (state) => (widgetKey, isAdvice = false) => {
        const widgetConfig = isAdvice ? ADVICE_WIDGET_CONFIG : WIDGET_CONFIG;
        const widgetId = widgetConfig[widgetKey];
        const themeWidgets = state.usersWidgets[state.currentThemeId] || [];
        
        return themeWidgets.includes(widgetId);
      },
      
      // Check if theme has changed since last load
      hasThemeChanged: (state, getters, rootState, rootGetters) => {
        const currentFocusedTheme = rootGetters['themeSpace/getFocusedThemeId'];
        return currentFocusedTheme && currentFocusedTheme !== state.lastLoadedThemeId;
      },
      
      // Get available widgets for current theme
      getAvailableWidgets: (state) => (isAdvice = false) => {
        const widgetConfig = isAdvice ? ADVICE_WIDGET_CONFIG : WIDGET_CONFIG;
        const themeWidgets = state.usersWidgets[state.currentThemeId] || [];
        const available = {};
        
        Object.entries(widgetConfig).forEach(([key, widgetId]) => {
          if (themeWidgets.includes(widgetId)) {
            available[key] = widgetId;
          }
        });
        
        return available;
      },
      
      // Debug getter
      getDebugInfo: (state, getters, rootState, rootGetters) => {
        return {
          currentThemeId: state.currentThemeId,
          focusedThemeFromStore: rootGetters['themeSpace/getFocusedThemeId'],
          lastLoadedThemeId: state.lastLoadedThemeId,
          usersWidgets: state.usersWidgets,
          dataKeys: Object.keys(state.analysisData),
          selectedTabs: state.selectedTab,
          loadingState: state.isLoading,
          themeChanged: getters.hasThemeChanged,
          availableDataWidgets: getters.getAvailableWidgets(false),
          availableAdviceWidgets: getters.getAvailableWidgets(true)
        };
      }
    },
};