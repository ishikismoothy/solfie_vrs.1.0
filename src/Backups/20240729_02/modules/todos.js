export default {
  namespaced: true,
  state: {
    todos: [
      { title: 'Sample Todo', date: '2024/01/01', image: null },
    ],
    completedCount: 10,
  },
  mutations: {
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
  },
  actions: {
    addTodo({ commit }, todo) {
      commit('ADD_TODO', todo);
    },
    completeTodo({ commit }, index) {
      commit('COMPLETE_TODO', index);
    },
    deleteTodo({ commit }, index) {
      commit('DELETE_TODO', index);
    },
  },
  getters: {
    getCurrentCompleted: (state) => {
      return state.completedCount || 0;
    },
  },
};