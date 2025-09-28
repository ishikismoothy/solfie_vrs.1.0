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
      async register({ commit }, { email, password, displayName, dateOfBirth, language }) {
        try {
          commit('SET_LOADING', true);
          commit('SET_ERROR', null); // Clear any previous errors
          
          const userCredential = await registerUser(email, password);
          const user = userCredential.user;
          
          // Create user document with all the new fields
          const userData = {
            email: user.email,
            displayName: displayName || '',
            dateOfBirth: dateOfBirth || '',
            language: language || 'eng',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          await createUserDocument(user.uid, userData);
          await createDefaultUserGalleries(user.uid);
          
          // Merge Firebase user object with additional user data
          commit('SET_USER', { ...user, ...userData });
        } catch (error) {
          console.error('Registration error:', error);
          
          // Provide user-friendly error messages
          let errorMessage = 'Registration failed. Please try again.';
          
          switch (error.code) {
            case 'auth/email-already-in-use':
              errorMessage = 'This email is already registered. Please use a different email or sign in.';
              break;
            case 'auth/invalid-email':
              errorMessage = 'Please enter a valid email address.';
              break;
            case 'auth/operation-not-allowed':
              errorMessage = 'Registration is currently disabled. Please try again later.';
              break;
            case 'auth/weak-password':
              errorMessage = 'Password should be at least 6 characters long.';
              break;
            default:
              errorMessage = error.message || 'Registration failed. Please try again.';
          }
          
          commit('SET_ERROR', errorMessage);
        } finally {
          commit('SET_LOADING', false);
        }
      },
      
      async login({ commit }, { email, password }) {
        try {
          commit('SET_LOADING', true);
          commit('SET_ERROR', null); // Clear any previous errors
          
          const userCredential = await loginUser(email, password);
          const user = userCredential.user;
          
          // Fetch additional user data from Firestore
          const userDoc = await getUserDocument(user.uid);
          const userData = userDoc.exists() ? userDoc.data() : {};
          
          commit('SET_USER', { ...user, ...userData });
        } catch (error) {
          console.error('Login error:', error);
          
          // Provide user-friendly error messages
          let errorMessage = 'Login failed. Please try again.';
          
          switch (error.code) {
            case 'auth/invalid-email':
              errorMessage = 'Please enter a valid email address.';
              break;
            case 'auth/user-disabled':
              errorMessage = 'This account has been disabled. Please contact support.';
              break;
            case 'auth/user-not-found':
              errorMessage = 'No account found with this email. Please sign up first.';
              break;
            case 'auth/wrong-password':
              errorMessage = 'Incorrect password. Please try again.';
              break;
            case 'auth/invalid-credential':
              errorMessage = 'Invalid email or password. Please try again.';
              break;
            case 'auth/too-many-requests':
              errorMessage = 'Too many failed login attempts. Please try again later.';
              break;
            default:
              errorMessage = error.message || 'Login failed. Please try again.';
          }
          
          commit('SET_ERROR', errorMessage);
        } finally {
          commit('SET_LOADING', false);
        }
      },
      
      async logout({ commit }) {
        try {
          await logoutUser();
          commit('SET_USER', null);
          commit('SET_ERROR', null);
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
            const userData = userDoc.exists() ? userDoc.data() : {};
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
          onAuthStateChange(async (user) => {
            if (user) {
              try {
                const userDoc = await getUserDocument(user.uid);
                const userData = userDoc.exists() ? userDoc.data() : {};
                commit('SET_USER', { ...user, ...userData });
              } catch (error) {
                console.error('Error fetching user document:', error);
                commit('SET_USER', user);
              }
            } else {
              commit('SET_USER', null);
            }
            commit('SET_LOADING', false);
            resolve(user);
          });
        });
      },
      
      clearError({ commit }) {
        commit('SET_ERROR', null);
      }
    },
    
    getters: {
      isAuthenticated: (state) => !!state.user,
      currentUser: (state) => state.user,
      authError: (state) => state.error,
      isLoading: (state) => state.loading,
      userDisplayName: (state) => state.user?.displayName || 'User',
      userLanguage: (state) => state.user?.language || 'eng',
      userDateOfBirth: (state) => state.user?.dateOfBirth || null
    }
  };