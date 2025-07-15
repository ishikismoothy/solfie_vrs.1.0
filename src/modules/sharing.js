// src/store/modules/sharing.js
import { shareService } from '@/firebase/firebaseShare';

export default {
  namespaced: true,
  
  state: {
    shareLinks: [],
    currentShareData: null,
    loading: false,
    error: null
  },
  
  mutations: {
    SET_SHARE_LINKS(state, links) {
      state.shareLinks = links;
    },
    
    ADD_SHARE_LINK(state, link) {
      state.shareLinks.push(link);
    },
    
    REMOVE_SHARE_LINK(state, linkId) {
      state.shareLinks = state.shareLinks.filter(link => link.id !== linkId);
    },
    
    SET_CURRENT_SHARE_DATA(state, data) {
      state.currentShareData = data;
    },
    
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
    
    SET_ERROR(state, error) {
      state.error = error;
    }
  },
  
  actions: {
    async createShareLink({ commit, rootState }, { accessType, expiryDays }) {
      try {
        commit('SET_LOADING', true);
        commit('SET_ERROR', null);
        
        const mindspaceId = rootState.mindspace.currentMindSpaceId;
        const themeId = rootState.mindspace.currentThemeId;
        const ownerId = rootState.user.user.uid;
        
        const shareData = await shareService.createShareLink(
          mindspaceId,
          themeId,
          ownerId,
          accessType,
          expiryDays
        );
        
        commit('ADD_SHARE_LINK', {
          ...shareData,
          mindspaceId,
          themeId,
          createdAt: new Date()
        });
        
        return shareData;
      } catch (error) {
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    async loadShareLinks({ commit, rootState }) {
      try {
        commit('SET_LOADING', true);
        commit('SET_ERROR', null);
        
        const mindspaceId = rootState.mindspace.currentMindSpaceId;
        const ownerId = rootState.user.user.uid;
        
        console.log('Loading share links with:', { mindspaceId, ownerId });
        
        if (!mindspaceId || !ownerId) {
          console.error('Missing required data:', { mindspaceId, ownerId });
          throw new Error('Missing mindspace ID or owner ID');
        }
        
        const links = await shareService.getShareLinks(mindspaceId, ownerId);
        console.log('Loaded links:', links);
        
        commit('SET_SHARE_LINKS', links);
      } catch (error) {
        console.error('Error loading share links:', error);
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    async revokeShareLink({ commit, state, rootState }, accessKey) {
      try {
        commit('SET_LOADING', true);
        commit('SET_ERROR', null);
        
        const ownerId = rootState.user.user.uid;
        await shareService.revokeShareLink(accessKey, ownerId);
        
        // Update the link in the state instead of removing it
        const links = state.shareLinks.map(link => 
          link.accessKey === accessKey ? { ...link, active: false } : link
        );
        commit('SET_SHARE_LINKS', links);
      } catch (error) {
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    async reactivateShareLink({ commit, state, rootState }, accessKey) {
      try {
        commit('SET_LOADING', true);
        commit('SET_ERROR', null);
        
        const ownerId = rootState.user.user.uid;
        await shareService.reactivateShareLink(accessKey, ownerId);
        
        // Update the link in the state
        const links = state.shareLinks.map(link => 
          link.accessKey === accessKey ? { ...link, active: true } : link
        );
        commit('SET_SHARE_LINKS', links);
      } catch (error) {
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    async deleteShareLink({ commit }, linkId) {
      try {
        commit('SET_LOADING', true);
        commit('SET_ERROR', null);
        
        await shareService.deleteShareLink(linkId);
        
        // Remove the link from state
        commit('REMOVE_SHARE_LINK', linkId);
      } catch (error) {
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    async accessSharedContent({ commit, rootState }, accessKey) {
      try {
        commit('SET_LOADING', true);
        commit('SET_ERROR', null);
        
        const currentUserId = rootState.user.user?.uid;
        const shareData = await shareService.accessSharedLink(accessKey, currentUserId);
        
        commit('SET_CURRENT_SHARE_DATA', shareData);
        return shareData;
      } catch (error) {
        commit('SET_ERROR', error.message);
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    }
  },
  
  getters: {
    getShareLinks: state => state.shareLinks,
    getCurrentShareData: state => state.currentShareData,
    isLoading: state => state.loading,
    getError: state => state.error,
    
    getShareLinkByType: state => type => {
      return state.shareLinks.filter(link => link.type === type);
    },
    
    hasActiveShareLinks: state => state.shareLinks.length > 0
  }
};