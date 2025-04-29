// src/store/modules/auth.js

import {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    onAuthStateChange
  } from '@/firebase/firebaseAuth';
  import { createUserDocument, getUserDocument, createDefaultUserGalleries } from '@/firebase/firebaseFirestore';

  export default {
    namespaced: true,
    state: () => ({
      user: null,
      loading: true,
      error: null
    }),
    mutations: {
      SET_USER(state, user) {
        state.user = user;
      },
      SET_LOADING(state, loading) {
        state.loading = loading;
      },
      SET_ERROR(state, error) {
        state.error = error;
      }
    },
    actions: {
      async register({ commit }, { email, password }) {
        try {
          commit('SET_LOADING', true);
          const userCredential = await registerUser(email, password);
          const user = userCredential.user;
          await createUserDocument(user.uid, { email: user.email });
          await createDefaultUserGalleries(user.uid);
          commit('SET_USER', user);
        } catch (error) {
          commit('SET_ERROR', error.message);
        } finally {
          commit('SET_LOADING', false);
        }
      },
      async login({ commit }, { email, password }) {
        try {
          commit('SET_LOADING', true);
          const userCredential = await loginUser(email, password);
          const user = userCredential.user;
          commit('SET_USER', user);
        } catch (error) {
          commit('SET_ERROR', error.message);
        } finally {
          commit('SET_LOADING', false);
        }
      },
      async logout({ commit }) {
        try {
          await logoutUser(); // Ensure this correctly calls Firebase's signOut
          commit('SET_USER', null);
          console.log('Logout successful');
        } catch (error) {
          commit('SET_ERROR', error.message);
          console.error('Error during logout:', error.message);
        }
      },
      async fetchUser({ commit }) {
        try {
          commit('SET_LOADING', true);
          const user = await getCurrentUser();
          console.log('Fetched user:', user);
          if (user) {
            const userDoc = await getUserDocument(user.uid);
            const userData = userDoc.data();
            commit('SET_USER', { ...user, ...userData });
          } else {
            commit('SET_USER', null);
          }
        } catch (error) {
          commit('SET_ERROR', error.message);
        } finally {
          commit('SET_LOADING', false);
        }
      },
      initAuth({ commit }) {
        return new Promise((resolve) => {
          onAuthStateChange((user) => {
            if (user) {
              getUserDocument(user.uid).then((userDoc) => {
                const userData = userDoc.data();
                commit('SET_USER', { ...user, ...userData });
              });
            } else {
              commit('SET_USER', null);
            }
            commit('SET_LOADING', false);
            resolve(user);
          });
        });
      }
    },
    getters: {
      isAuthenticated: (state) => !!state.user,
      currentUser: (state) => state.user,
      authError: (state) => state.error,
      isLoading: (state) => state.loading
    }
  };
