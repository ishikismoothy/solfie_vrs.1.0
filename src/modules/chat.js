import { OPENAI_API_URL, OPENAI_API_KEY } from '../modules/openAI.js';
import { sendMessageToOpenAI } from '../modules/openAI.js';

// testing - uncomment testing code, comment out OpenAI code, run JSON server
// type in console: json-server --watch db.json
// const BASE_URL = 'http://localhost:3000';

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
    currentThreadId: null,
    aiResponse: ''
  },
  mutations: {
    ADD_CHAT_MESSAGE(state, message) {
      state.chatMessages.push(message);
    },
    ADD_RANDOM_MESSAGES(state, messages) {
      state.chatMessagesExample = messages;
    },
    SET_THREAD_ID(state, threadId) {
      state.currentThreadId = threadId;
    },
    SET_AI_RESPONSE(state, response) {
      state.aiResponse = response;
    }
  },
  actions: {
    sendChatMessage({ commit }, message) {
      commit('ADD_CHAT_MESSAGE', message);
    },

    addRandomMessages({state, commit }) {
      const library = state.chatMessagesExampleLibrary;

      const shuffleArray = (array) => {
        let shuffled = array.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      const shuffledLibrary = shuffleArray(library);
      const randomMessages = shuffledLibrary.slice(0, 3);

      commit('ADD_RANDOM_MESSAGES', randomMessages);
    },


    //comment out following code for testing
    
    async startConversation({ commit, dispatch, state }, userMessage) {
      try {
        let threadId = state.currentThreadId;

        if (!threadId) {
          threadId = await dispatch('createNewThread');
          commit('SET_THREAD_ID', threadId);
        }

        commit('ADD_CHAT_MESSAGE', { text: userMessage, sender: 'user', timestamp: new Date().toISOString() });

        const messages = state.chatMessages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        }));

        // Add the new user message
        messages.push({ role: 'user', content: userMessage });

        // Send the entire message history to OpenAI
        const aiResponse = await sendMessageToOpenAI(messages);
        commit('ADD_CHAT_MESSAGE', { text: aiResponse, sender: 'ai', timestamp: new Date().toISOString() });
        await dispatch('createMessage', { content: aiResponse, role: 'ai' });
      } catch (error) {
        console.error('Conversation Error:', error);
      }
    },



    async createNewThread() {
      const data = {
        messages: [
          { role: 'user', content: 'Hello!' } // Initial message to start the conversation
        ],
        model: 'gpt-3.5-turbo', // Specify the model
      };

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
        },
        body: JSON.stringify(data),
      };

      const response = await fetch(OPENAI_API_URL, options);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create new thread:', errorText);
        throw new Error('Network response was not ok.');
      }
      const result = await response.json();
      return result.id; // Return the new thread ID
    },



    async createMessage(_, { threadId, content, role }) {
      try {
        console.log('Creating message:', { threadId, content, role }); // Debug line

        const data = {
          model: 'gpt-3.5-turbo', // Specify the model
          messages: [
            {
              role: role === 'ai' ? 'assistant' : role,
              content: content
            }
          ],
        };
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify(data)
        };

        console.log('Sending message with data:', data);

        const response = await fetch(OPENAI_API_URL, options);

        if (!response.ok) {
          const errorText = await response.text(); // Capture error response
          console.error('Failed to create message:', errorText);
          throw new Error('Network response was not ok.');
        }

        // Return some result or confirmation
        return await response.json(); // This is the only return point

      } catch (error) {
        console.error('Error in createMessage:', error);
        throw error; // Rethrow or handle as necessary
      }
    },

    async getMessage(_, threadId) {
      const options = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      };
      const response = await fetch(`${OPENAI_API_URL}/${threadId}/messages`, options);
      if (!response.ok) {
        throw new Error('Failed to retrieve message.');
      }
      const result = await response.json();
      return result.data[0].content[0].text.value;
    },

    async runAssistant(_, threadId) {
      const data = {
        assistant_id: 'your_assistant_id_here',
        tools: [{ type: 'file_search', file_search: { max_num_results: 20 } }]
      };
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify(data)
      };
      const response = await fetch(`${OPENAI_API_URL}/${threadId}/runs`, options);
      const result = await response.json();
      return result.id;
    },

    async checkRunCompletion({ dispatch }, { threadId, runId }) {
      let status = '';
      let attempts = 0;
      const maxAttempts = 30;

      while (status !== 'completed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const result = await dispatch('retrieveRunStatus', { threadId, runId });
        status = result.status;
        attempts++;
      }

      if (status !== 'completed') {
        throw new Error('Maximum attempts reached.');
      }
    },

    async retrieveRunStatus(_, { threadId, runId }) {
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      };
      const response = await fetch(`${OPENAI_API_URL}/${threadId}/runs/${runId}`, options);
      return await response.json();
    },

      // testing - replace with commented-out code

      // const response = await fetch(`${BASE_URL}/threads`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ title: 'New Thread', content: '' }),
      // });
      // if (!response.ok) {
      //   throw new Error('Network response was not ok.');
      // }
      // const result = await response.json();
      // return result.id;

      // const response = await fetch(`${BASE_URL}/messages`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(data)
      // });

      // if (!response.ok) {
      //   throw new Error('Failed to create message.');
      // }

    // async getMessage(_, threadId ) {

    //   console.log('Getting messages for threadId:', threadId);

    //   try {
    //     const response = await fetch(`${BASE_URL}/AIResponse`);
    //     if (!response.ok) {
    //       throw new Error('Failed to retrieve response.');
    //     }
    //   const messagesForThread = await response.json();
    //   if (!Array.isArray(messagesForThread) || messagesForThread.length === 0) {
    //     throw new Error('Unexpected data format.');
    //   }

    //   const messageForThread = messagesForThread[0].content;
    //   console.log('Message for Thread:', messageForThread);


    //     return messageForThread
    //   } catch (error) {
    //     console.error('Error retrieving messages:', error);
    //     return 'Error retrieving messages';
    //   }
    // },

        // async runAssistant() {
    //   // Simulate running the assistant
    //   return 'simulated_run_id';
    // },

    // async checkRunCompletion() {
    //   // Simulate completion check
    //   await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds
    // },

    // async retrieveRunStatus() {
    //   // Simulate retrieving run status
    //   return { status: 'completed' }; // Return simulated status
    // },

    //end testing code

  },
  getters: {
    chatMessages: state => state.chatMessages,
    chatMessagesExample: state => state.chatMessagesExample,
    aiResponse: state => state.aiResponse,
    hasUserMessages(state) {return state.chatMessages.some(message => message.sender === 'user')},
  }
}
