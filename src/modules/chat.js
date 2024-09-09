export default {
  namespaced: true,
  state: {
    chatMessages: [
      { text: "Hello! How can I help you today?", sender: "ai", timestamp: "2024/03/01 20:44" },
      { text: "I have a question about the weather.", sender: "user", timestamp: "2024/03/01 20:45" },
      { text: "Certainly! What would you like to know about the weather?", sender: "ai", timestamp: "2024/03/01 20:50" },
    ],
    chatMessagesExampleLibrary: [
      "1st message",
      "2nd message",
      "3rd message",
      "4th message",
      "5th message",
      "6th message",
      "7th message",
      "8th message",
      "9th message",
      "10th message",
      "11th message",
      "12th message",
      "13th message",
      "14th message",
      "15th message",
      "16th message",
      "17th message",
      "18th message",
      "19th message",
      "20th message"
    ],
    chatMessagesExample: [
      // These are placeholders and shouldn't appear in the final product
      'ソルフィ！解析結果を解説して！',
      '選択を手伝って！',
      '今月は何を意識したらいいかな？'
    ],
  },
  mutations: {
    ADD_CHAT_MESSAGE(state, message) {
      state.chatMessages.push(message);
    },
    ADD_RANDOM_MESSAGES(state, messages) {
      state.chatMessagesExample = messages;

    }
  },
  actions: {
    sendChatMessage({ commit }, message) {
      commit('ADD_CHAT_MESSAGE', message);
      // Here you would typically call an API to get the AI's response
      // and then commit another ADD_CHAT_MESSAGE mutation with the response
    },
    addRandomMessages({state, commit }) {
      const library = state.chatMessagesExampleLibrary;

      // Function to shuffle an array
      const shuffleArray = (array) => {
        let shuffled = array.slice(); // Copy the array
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap elements
        }
        return shuffled;
      };
      
      // Shuffle the library and take the first 3 elements
      const shuffledLibrary = shuffleArray(library);
      const randomMessages = shuffledLibrary.slice(0, 3);

      commit('ADD_RANDOM_MESSAGES', randomMessages);
    }
  },
  getters: {
    getChatMessagesExample: (state) => state.chatMessagesExample
  },
};
