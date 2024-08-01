export default {
  namespaced: true,
  state: {
    todos: [],
    completedCount: 0,
    isLoading: false,
  },
  mutations: {
    SET_TODOS(state, todos) {
      state.todos = todos;
    },
    SET_COMPLETED_COUNT(state, count) {
      state.completedCount = count;
    },
    ADD_TODO(state, todo) {
      state.todos.push(todo);
    },
    COMPLETE_TODO(state, index) {
      state.todos.splice(index, 1);
      state.completedCount++;
    },
    DELETE_TODO(state, index) {
      state.todos.splice(index, 1);
    },
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
  },
  actions: {
    loadTodosData({ commit }) {
      return new Promise((resolve) => {
        commit('SET_LOADING', true);
        // Simulating an API call
        setTimeout(() => {
          const todosData = [
            { title: 'Sample Todo 1', date: '2024/01/01', image: null },
            { title: 'Sample Todo 2', date: '2024/01/15', image: null },
            { title: 'Sample Todo 3', date: '2024/02/01', image: null },
          ];
          const completedCount = 10;
          commit('SET_TODOS', todosData);
          commit('SET_COMPLETED_COUNT', completedCount);
          commit('SET_LOADING', false);
          resolve();
        }, 1000); // 1 seconds delay to match the scores loading time
      });
    },
    addTodo({ commit }, todo) {
      commit('SET_LOADING', true);
      // Simulating an API call
      setTimeout(() => {
        commit('ADD_TODO', todo);
        commit('SET_LOADING', false);
      }, 500);
    },
    completeTodo({ commit }, index) {
      commit('SET_LOADING', true);
      // Simulating an API call
      setTimeout(() => {
        commit('COMPLETE_TODO', index);
        commit('SET_LOADING', false);
      }, 500);
    },
    deleteTodo({ commit }, index) {
      commit('SET_LOADING', true);
      // Simulating an API call
      setTimeout(() => {
        commit('DELETE_TODO', index);
        commit('SET_LOADING', false);
      }, 500);
    },
  },
  getters: {
    getCurrentCompleted: (state) => {
      return state.completedCount || 0;
    },
    isLoading: (state) => state.isLoading,
  },
};