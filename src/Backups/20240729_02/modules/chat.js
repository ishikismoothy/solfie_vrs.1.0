export default {
  namespaced: true,
  state: {
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
    ADD_CHAT_MESSAGE(state, message) {
      state.chatMessages.push(message);
    },
  },
  actions: {
    sendChatMessage({ commit }, message) {
      commit('ADD_CHAT_MESSAGE', message);
      // Here you would typically call an API to get the AI's response
      // and then commit another ADD_CHAT_MESSAGE mutation with the response
    },
  },
  getters: {
    getChatMessagesExample: (state) => state.chatMessagesExample
  },
};