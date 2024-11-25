import { themeService } from '@/firebase/firebaseThemeSpace';

export default {
    namespaced: true,

    state: {
        focusedThemeId: null,
        themes: [],
        loading: false,
        error: null,
        searchQuery: '',
        themesKey: [
            '仕事', '家庭', '社交', 'プライベート', '余暇',
        ],
        topicsKey:[
            '暮らし方', '働き方', '表し方', '付き合い方',
        ]
    },

    mutations: {
        SET_FOCUS_THEME_ID(state, id){
            state.focusedThemeId = id;
        },
        SET_THEMES(state, themes) {
            state.themes = themes;
        },
        SET_LOADING(state, status) {
            state.loading = status;
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
        }
    },

    actions: {
        async fetchThemes({ commit }, uid ) {
            console.log("[fetchTheme/themeSpace.js] TRIGGERED")
            // Clear any existing errors
            commit('SET_ERROR', null);
            
            try {
            // Check for userId
            const userId = uid;
            console.log("[fetchThemes/themeSpace.js] userId:" , userId)

            if (!userId) {
                throw new Error('User not authenticated');
            }
    
            // Set loading state
            commit('SET_LOADING', true);
    
            // Fetch themes
            const themes = await themeService.getThemes(userId);
            commit('SET_THEMES', themes);
            
            console.log("[fetchTheme/themeSpace.js] themes: ",themes);

            return themes;

            } catch (error) {
                console.error('Error in fetchThemes:', error);
                commit('SET_ERROR', error.message);
                commit('SET_THEMES', []);
            } finally {
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
                const updatedTheme = await themeService.updateTheme(themeId, themeData);
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
            console.log("[deleteTheme/themeSpace.js]", userId);
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
        // Load user's theme data
        async setThemeId({ commit, state , /* dispatch*/ }, { userId }) {
            console.log("[themeSpace.js/setThemeId] TRIGGERED");
            try {
            // 1. Get user document to find focusTheme
            const focusedThemeId = await themeService.getUserThemeId(userId);
            
            commit('SET_FOCUS_THEME_ID', focusedThemeId);
            console.log("[setThemeId] Default Theme Id",state.focusedThemeId);

            } catch (error) {
            console.error('Error loading user theme data:', error);
            commit('SET_ERROR', error.message);
            }
        },
        async changeThemeId({ dispatch }, { userId, themeId }) {
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
    },

    getters: {
        getFocusedThemeId: state => state.focusedThemeId,
        getThemes: state => state.themes,
        isLoading: state => state.loading,
        getError: state => state.error,
        getSearchQuery: state => state.searchQuery,
        getThemeById: state => id => state.themes.find(theme => theme.id === id),
        getThemesKey: (state) => state.themesKey,
        getTopicsKey: (state) => state.topicsKey
    }
};