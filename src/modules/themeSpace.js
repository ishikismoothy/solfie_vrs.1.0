import { themeService } from '@/firebase/firebaseThemeSpace';

export default {
    namespaced: true,

    state: {
        focusedThemeId: null,
        currentThemeId: null,
        themes: [],
        isLoading: false,
        error: null,
        searchQuery: '',
        themesKey: [
            '仕事', '家庭', '社交', 'プライベート', '余暇',
        ],
        topicsKey:[
            '暮らし方', '働き方', '表し方', '付き合い方',
        ],
        satisfaction: {
            currentSelfSatisfaction: 5,
            currentAiSatisfaction: 5,
            showSatWindow: false,
        }
    },

    mutations: {
        SET_FOCUS_THEME_ID(state, id){
            state.focusedThemeId = id;
        },
        SET_THEMES(state, themes) {
            state.themes = themes;
        },
        SET_THEME_ID(state, id){
            state.currentThemeId = id;
        },
        SET_LOADING(state, status) {
            state.isLoading = status;
        },
        SET_ERROR(state, error) {
            state.error = error;
        },
        SET_SEARCH_QUERY(state, query) {
            state.searchQuery = query;
        },
        ADD_THEME(state, theme) {
            state.themes.unshift(theme);
        },
        UPDATE_THEME(state, updatedTheme) {
            const index = state.themes.findIndex(theme => theme.id === updatedTheme.id);
            if (index !== -1) {
            state.themes.splice(index, 1, updatedTheme);
            }
        },
        DELETE_THEME(state, themeId) {
            state.themes = state.themes.filter(theme => theme.id !== themeId);
        },
        CLEAR_THEMES(state) {
            state.themes = [];
        },
        SET_THEMESKEY(state, themes) {
            state.themesKey = themes;
        },
        SET_TOPICSKEY(state, topics) {
            state.topicsKey = topics;
        },
        SET_SATWINDOW(state, value) {
            state.satisfaction.showSatWindow = value;
        },
        SET_SELF_SATISFACTION(state, value) {
            // Convert string to number and update
            const numValue = Number(value);
            if (!isNaN(numValue)) {
                state.satisfaction = {
                    ...state.satisfaction,  // preserve other properties
                    currentSelfSatisfaction: numValue
                };
            }
        },
        SET_AI_SATISFACTION(state, value) {
            // Convert string to number and update
            const numValue = Number(value);
            if (!isNaN(numValue)) {
                state.satisfaction = {
                    ...state.satisfaction,  // preserve other properties
                    currentAiSatisfaction: numValue
                };
            }
        },
    },

    actions: {
        async fetchThemes({ commit }, uid ) {
            // Set loading state
            commit('SET_LOADING', true);

            // Clear any existing errors
            commit('SET_ERROR', null);
            // Clear any existing theme Data
            commit('SET_THEMES', null);

            try {
            // Check for userId
            const userId = uid;
            //console.log("[fetchThemes/themeSpace.js] userId:" , userId)

            if (!userId) {
                throw new Error('User not authenticated');
            }



            // Fetch themes
            const themes = await themeService.getThemes(userId);
            commit('SET_THEMES', themes);

            //console.log("[fetchTheme/themeSpace.js] themes: ",themes);

            return themes;

            } catch (error) {
                console.error('Error in fetchThemes:', error);
                commit('SET_ERROR', error.message);
                commit('SET_THEMES', []);
            } finally {
                await new Promise(resolve => setTimeout(resolve, 3000));
                commit('SET_LOADING', false);
            }
        },

        async addTheme({ commit }, { themeData, userId }) {
            console.log("[addTheme/themeSpace.js] uid:", userId);
            console.log("[addTheme/themeSpace.js] themeData:", themeData);

            if (!userId) {
              commit('SET_ERROR', 'User not authenticated');
              return;
            }

            commit('SET_LOADING', true);
            try {
              const newTheme = await themeService.addTheme(themeData, userId);
              commit('ADD_THEME', newTheme);
              return newTheme;
            } catch (error) {
              commit('SET_ERROR', error.message);
              throw error;
            } finally {
              commit('SET_LOADING', false);
            }
        },

        async updateTheme({ commit }, { themeId, themeData, userId }) {
            if (!userId) {
                commit('SET_ERROR', 'User not authenticated');
                return;
            }

            commit('SET_LOADING', true);
            try {
                const updatedTheme = await themeService.updateTheme(themeId, themeData, userId);
                commit('UPDATE_THEME', updatedTheme);
                return updatedTheme;
            } catch (error) {
                commit('SET_ERROR', error.message);
                throw error;
            } finally {
                commit('SET_LOADING', false);
            }
        },

        async deleteTheme({ commit, dispatch }, { userId, themeId }) {
            console.log("[deleteTheme/themeSpace.js]", themeId);
            if (!userId) {
                commit('SET_ERROR', 'User not authenticated');
                return;
            }

            commit('SET_LOADING', true);
            try {
                await themeService.deleteTheme(userId, themeId );
                commit('DELETE_THEME', themeId);
            } catch (error) {
                commit('SET_ERROR', error.message);
                throw error;
            } finally {
                await dispatch('fetchThemes', userId);
                commit('SET_LOADING', false);
            }
        },

        async searchThemes({ commit }, { searchTerm, uid }) {
        if (!uid) {
            commit('SET_ERROR', 'User not authenticated');
            return;
        }

        commit('SET_LOADING', true);
        try {
            const themes = await themeService.searchThemes(searchTerm);
            commit('SET_THEMES', themes);
        } catch (error) {
            commit('SET_ERROR', error.message);
        } finally {
            commit('SET_LOADING', false);
        }
        },

        setSearchQuery({ commit }, query) {
        commit('SET_SEARCH_QUERY', query);
        },

        clearThemes({ commit }) {
            commit('CLEAR_THEMES');
        },
        // If you need to load themes/topics from an API in the future
        loadThemesAndTopics({ commit }) {
            // API call could go here
            commit('SET_THEMESKEY', ['健やかになる', '満たされる', '成長する', '感謝される']);
            commit('SET_TOPICSKEY', ['仕事や活動', '暮らし', '人間関係', '在り方', '環境']);
        },
        setThemeId({ commit }, id) {
            console.log("themeSpace.js/setThemeId: ThemeId: ", id);
            commit('SET_THEME_ID', id);
        },
        // Load user's theme data
        async setFocusThemeId({ commit, state }, userId) {
            try {
                // 1. Get user document to find focusTheme
                const focusedThemeId = await themeService.getUserThemeId(userId);
                commit('SET_FOCUS_THEME_ID', focusedThemeId);
                console.log('[themeSpace.js/setFocusThemeId] Focused ThemeId:', state.focusedThemeId);

            } catch (error) {
                console.error('Error loading user theme data:', error);
                commit('SET_ERROR', error.message);
            }
        },
        async changeFocusThemeId({ dispatch }, { userId, themeId }) {
            console.log("[themeSpace.js/changeThemeId] TRIGGERED");
            try {
            const result = await themeService.changeUserThemeId(userId, themeId);

            if(result.success) {
                console.log(result.message);

                await dispatch('setThemeId', { userId });

            }else{
                console.log(result.message);
            }
            } catch (error) {
            console.log(error.message);
            }
        },

        async updateThemeOrder({ commit, rootState }, themes) {
          commit('SET_LOADING', true);
          try {
              const userId = rootState.user.user.uid;
              await themeService.updateThemeOrder(themes, userId);
              commit('SET_THEMES', themes);
          } catch (error) {
              console.error('Error updating theme order:', error);
              throw error;
          } finally {
              commit('SET_LOADING', false);
          }
        },

        async updateSatisfaction({ commit, state }, value) {
            // Convert to number right away
            const numValue = Number(value);
            if (!isNaN(numValue)) {
                commit('SET_SELF_SATISFACTION', numValue);
                await themeService.updateAssessment(state.currentThemeId, numValue);
            }
        },
        setSatWindow({ commit }, value){
            commit('SET_SATWINDOW', value);
        },
        async getSelfAssessment({ commit, state }) {
            const latestSelfAssessment = await themeService.getLatestAssessment(state.currentThemeId);

            // If no assessment exists, set to default value (0)
            const value = latestSelfAssessment ? latestSelfAssessment.value : 0;
            commit('SET_SELF_SATISFACTION', value);
        },

        async getAiAssessment({ commit, state }) {
            const latestAiAssessment = await themeService.getLatestAssessment(state.currentThemeId, 'aiAssessment');

            // If no assessment exists, set to default value (0)
            const value = latestAiAssessment ? latestAiAssessment.value : 0;
            commit('SET_AI_SATISFACTION', value);
        }
    },

    getters: {
        getFocusedThemeId: state => state.focusedThemeId,
        getThemes: state => state.themes,
        isLoading: state => state.isLoading,
        getError: state => state.error,
        getSearchQuery: state => state.searchQuery,
        getThemeById: state => id => state.themes.find(theme => theme.id === id),
        getThemesKey: (state) => state.themesKey,
        getTopicsKey: (state) => state.topicsKey
    }
};
