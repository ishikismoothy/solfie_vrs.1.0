// src/store/modules/mindspace.js
import squareSvg from '../assets/shapes/square.svg';
import circleSvg from '../assets/shapes/circle.svg';
import octagonSvg from '../assets/shapes/octagon.svg';
import cloudSvg from '../assets/shapes/cloud.svg';
import folderSvg from '../assets/shapes/folder.svg';

export default {
    namespaced: true,
    
    state: {
      mindSpacePages: [[]],
      currentPage: 0,
      totalPage: 0,
      item:{},
    },
    
    mutations: {
      SET_APP_PAGES(state, pages) {
        state.mindSpacePages = pages;
      },
      SET_CURRENT_PAGE(state, page) {
        state.currentPage = page;
      },
      SET_TOTAL_PAGES(state, page) {
        state.totalPage = page.length;
      },
      ADD_NEW_PAGE(state) {
        state.mindSpacePages.push([]);
      },
      CLEANUP_EMPTY_PAGES(state) {
        // Don't remove the first page even if empty
        if (state.mindSpacePages.length <= 1) return;
        
        // Filter out empty pages except the first one
        state.mindSpacePages = state.mindSpacePages.filter((page, index) => {
            if (index === 0) return true; // Always keep first page
            // Check if the array has any items using Object.keys()
            return !Array.isArray(page) || Object.values(page).length > 0;
        });
    
        // Adjust currentPage if needed
        if (state.currentPage >= state.mindSpacePages.length) {
            state.currentPage = state.mindSpacePages.length - 1;
        }
        console.log("[CLEANUP_EMPTY_PAGES] mindSpacePages :", state.mindSpacePages);
      }
    },
    
    actions: {
      setMindSpacePages({ commit, state }) {
        //Use firebase to retrieve app list.
        console.log("[setMindSpacePages] TRIGGERED");
        const usersMindSpace = [
          [
            { id:'0000', name: '0', shape: circleSvg },
            { id:'0001', name: '1', shape: cloudSvg },
            { id:'0002', name: '2', shape: squareSvg },
            { id:'0003', name: '3', shape: octagonSvg, badge: 'lightblue' },
            { id:'0004', name: '4', shape: circleSvg },
            { id:'0005', name: '5', shape: cloudSvg },
            { id:'0006', name: '6', shape: cloudSvg },
            { id:'0007', name: '7', shape: cloudSvg },
            { id:'0008', name: '9', shape: cloudSvg },
            { 
              id:'f0009',
              name: 'フォルダー1', 
              shape: folderSvg, 
              items: [
                { id:'0009', name: 'Item 1', shape: circleSvg },
                { id:'0010', name: 'Item 2', shape: squareSvg },
                { id:'0011', name: 'Item 3', shape: cloudSvg },
                { id:'0012', name: 'Item 4', shape: octagonSvg },
                { id:'0013', name: 'Item 5', shape: circleSvg },
                { id:'0014', name: 'Item 6', shape: squareSvg },
                { id:'0015', name: 'Item 7', shape: cloudSvg },
                { id:'0016', name: 'Item 8', shape: octagonSvg },
              ]
            },
            { 
              id:'f0010',
              name: 'フォルダー2', 
              shape: folderSvg, 
              items: [
                { id:'0017', name: 'Item 9', shape: circleSvg },
                { id:'0018', name: 'Item 10', shape: squareSvg },
                { id:'0019', name: 'Item 11', shape: cloudSvg },
                { id:'0020', name: 'Item 12', shape: octagonSvg },
                { id:'0021', name: 'Item 13', shape: circleSvg },
                { id:'0022', name: 'Item 14', shape: squareSvg },
                { id:'0023', name: 'Item 15', shape: cloudSvg },
                { id:'0024', name: 'Item 16', shape: octagonSvg },
              ]
            },
          ],
          [
            { id:'0009', name: '0', shape: circleSvg },
            { id:'0010', name: '1', shape: cloudSvg },
            { id:'0011', name: '2', shape: squareSvg },
            { id:'0012', name: '3', shape: octagonSvg, badge: 'lightblue' },
            { id:'0013', name: '4', shape: circleSvg },
            { id:'0014', name: '5', shape: cloudSvg },
            { id:'0015', name: '6', shape: cloudSvg },
            { id:'0016', name: '7', shape: cloudSvg },
            { id:'0017', name: '9', shape: cloudSvg },
          ]
        ];
        commit('SET_APP_PAGES', usersMindSpace);
        commit('SET_TOTAL_PAGES', usersMindSpace);
        console.log("[mindspace.js] TotalPage :", state.totalPage);
      },
      setCurrentPage({ commit }, page) {
        commit('SET_CURRENT_PAGE', page);
      },
      addNewPage({ commit, state }) {
        commit('ADD_NEW_PAGE');
        commit('SET_TOTAL_PAGES', state.mindSpacePages);
      },
      cleanupEmptyPages({ commit, state }) {
        console.log("[CleanupEmptyPages] TRIGGERED");
        commit('CLEANUP_EMPTY_PAGES');
        commit('SET_TOTAL_PAGES', state.mindSpacePages);
      }
    },
    
    getters: {
      getMindSpacePages: state => state.mindSpacePages,
      getCurrentPage: state => state.currentPage,
      getTotalPages: state => state.totalPage
    }
  };