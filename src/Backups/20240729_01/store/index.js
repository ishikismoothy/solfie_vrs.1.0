/*import user from './modules/user';
import scores from './modules/scores';
import abilities from './modules/abilities';
import todos from './modules/todos';
import chat from './modules/chat';*/
import { createStore } from 'vuex'

export default createStore({
  state: {
    user: {
      name: '寺岡 佑記',
      planType: 'Solfie Careplus',
      notifications: 3,
    },
    stats: {
      solfieLevel: 100,
      questCleared: 34,
      averageScore: 4.5,
    },
    selectedScoreTab: '自己評価',
    selectedAbilityTab: '姿',
    scoresData: {
      '自己評価': {
        date: '2024/01/03',
        items: {
          '開花': 3.9,
          '姿': 4.5,
          '環境': 3.0,
          '活動': 1.5,
        }
      },
      '意識解析': {
        date: '2024/05/03',
        items: {
          '開花': 4.2,
          '姿': 3.7,
          '環境': 3.5,
          '活動': 4.0,
        }
      }
    },
    abilitiesData: {
      '姿': {
        percentage: 65,
        items: {
          '意識': 45,
          '同期': 50,
          '選択': 75
        }
      },
      '環境': {
        percentage: 70,
        items: {
          '意識': 60,
          '同期': 80,
          '選択': 70
        }
      },
      '活動': {
        percentage: 55,
        items: {
          '意識': 50,
          '同期': 60,
          '選択': 55
        }
      }
    },
    todos: [
      { title: 'Sample Todo', date: '2024/01/01', image: null },
    ],
    chatMessages: [
      { text: "Hello! How can I help you today?", sender: "ai", timestamp: "2024/03/01 20:44" },
      { text: "I have a question about the weather.", sender: "user", timestamp: "2024/03/01 20:45" },
      { text: "Certainly! What would you like to know about the weather?", sender: "ai", timestamp: "2024/03/01 20:50" },
    ],
    chatMessagesExample: [
      'ソルフィ！解析結果を解説して！',
      '選択を手伝って！',
      '今月は何を意識したらいいかな？'
    ],
  },
  mutations: {
    SET_SELECTED_SCORE_TAB(state, tab) {
      state.selectedScoreTab = tab;
    },
    SET_SELECTED_ABILITY_TAB(state, tab) {
      state.selectedAbilityTab = tab;
    },
    ADD_TODO(state, todo) {
      state.todos.push(todo);
    },
    COMPLETE_TODO(state, index) {
      state.todos.splice(index, 1);
      state.stats.questCleared++;
    },
    DELETE_TODO(state, index) {
      state.todos.splice(index, 1);
    },
    ADD_CHAT_MESSAGE(state, message) {
      state.chatMessages.push(message);
    },
  },
  actions: {
    selectScoreTab({ commit }, tab) {
      commit('SET_SELECTED_SCORE_TAB', tab);
    },
    selectAbilityTab({ commit }, tab) {
      commit('SET_SELECTED_ABILITY_TAB', tab);
    },
    addTodo({ commit }, todo) {
      commit('ADD_TODO', todo);
    },
    completeTodo({ commit }, index) {
      commit('COMPLETE_TODO', index);
    },
    deleteTodo({ commit }, index) {
      commit('DELETE_TODO', index);
    },
    sendChatMessage({ commit }, message) {
      commit('ADD_CHAT_MESSAGE', message);
      // Here you would typically call an API to get the AI's response
      // and then commit another ADD_CHAT_MESSAGE mutation with the response
    },
  },
  getters: {
    currentScoreData: (state) => {
      return state.scoresData[state.selectedScoreTab] || { date: '', items: {} };
    },
    currentAbilities: (state) => {
      return state.abilitiesData[state.selectedAbilityTab] || { percentage: 0, items: {} };
    },
  },
})