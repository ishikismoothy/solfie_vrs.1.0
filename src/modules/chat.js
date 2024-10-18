import { OPENAI_API_URL, OPENAI_API_KEY } from '../modules/openAI.js';
//import { sendMessageToOpenAI } from '../modules/openAI.js';
import axios from 'axios';
// testing - uncomment testing code, comment out OpenAI code, run JSON server
// type in console: json-server --watch db.json
// const BASE_URL = 'http://localhost:3000';

const assistantId = 'asst_KSSMgcyDczRL8ky2PhrWtPJw';

export const getHeaders = () => ({
  'Authorization': `Bearer ${OPENAI_API_KEY}`,
  'OpenAI-Beta': 'assistants=v2',
  'Content-Type': 'application/json',
});


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
      let aiResponse = '';
      commit('ADD_CHAT_MESSAGE', { text: userMessage, sender: 'user', timestamp: new Date().toISOString() });

      try {
        let threadId = state.currentThreadId;

        //STEP01 CREATE NEWTHREADID
        if (!threadId) {
          const threadResponse = await dispatch('createNewThread');
          threadId = threadResponse.data.id;
          console.log('Thread created with ID:', threadId);
          commit('SET_THREAD_ID', threadId);

          //STEP02 : Create Message
          await dispatch('createMessage', { threadId, content: userMessage });

          //STEP03 : Run Assistant
          const runResponse = await dispatch ('runAssistant', {threadId});
          const runId = runResponse.data.id;
          console.log('Assistant run started with ID:', runId);

          //STEP04 : Check Assistant Status
          let status;
          do {
          await new Promise(resolve => setTimeout(resolve, 1000));
          status = await dispatch ('checkRunStatus', {threadId, runId});
          console.log('Run status:', status);
          } while (status !== 'completed' && status !== 'failed');

          if (status === 'failed') {
          throw new Error('Assistant run failed');
          }
          console.log('Run completed, fetching messages');

          //STEP05 : GET MESSAGE
          const generatedMessage = await dispatch ('getMessages', { threadId });

          if (generatedMessage.data && generatedMessage.data.length > 0) {
            console.log('Number of messages received:', generatedMessage.data.length);
            let assistantMessages = generatedMessage.data.filter(msg => msg.role === 'assistant');
            console.log('Number of assistant messages:', assistantMessages.length);

            if (assistantMessages.length > 0) {
                const latestMessage = assistantMessages[0];
                if (latestMessage.content && latestMessage.content.length > 0) {
                aiResponse = latestMessage.content[0].text.value;
                console.log("AI RESPONSE: ",aiResponse);
                commit('ADD_CHAT_MESSAGE', { text: aiResponse, sender: 'ai', timestamp: new Date().toISOString() });
                } else {
                aiResponse = 'Assistant message has no content.';
                }
            } else {
                aiResponse = 'No assistant messages found.';
            }
          } else {
            aiResponse = 'No messages received from the thread.';
          }
        }else{
          //SENCOND ATTEMPT
          console.log("Starting second attempt...");
          await dispatch('createMessage', { threadId, content: userMessage });
          const runResponse02 = await dispatch('runAssistant', { threadId });
          const runId02 = runResponse02.data.id;
          console.log("RunResponse02:", runId02);

          let status02;
          do {
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Fixed: Correctly pass runId02 to checkRunStatus
            status02 = await dispatch('checkRunStatus', { threadId, runId: runId02 });

            console.log('Run status (second attempt):', status02);
          } while (status02 !== 'completed' && status02 !== 'failed');

          if (status02 === 'failed') {
            throw new Error('Second assistant run failed');
          }
          console.log('Second run completed, fetching messages');

          // Fetch new messages after the second run
          const generatedMessage02 = await dispatch('getMessages', { threadId });

          if (generatedMessage02.data && generatedMessage02.data.length > 0) {
            const assistantMessages02 = generatedMessage02.data.filter(msg => msg.role === 'assistant');
            if (assistantMessages02.length > 0) {
              const latestMessage02 = assistantMessages02[0];
              if (latestMessage02.content && latestMessage02.content.length > 0) {
                aiResponse = latestMessage02.content[0].text.value;
                console.log("AI RESPONSE 02: ", aiResponse);
                commit('ADD_CHAT_MESSAGE', { text: aiResponse, sender: 'ai', timestamp: new Date().toISOString() });
              } else {
                aiResponse = 'Second assistant message has no content.';
              }
            } else {
              aiResponse = 'No assistant messages found in second attempt.';
            }
          } else {
            aiResponse = 'No messages received from the thread in second attempt.';
          }
        }

        const messages = state.chatMessages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
        }));


        // Add the new user message
        messages.push({ role: 'user', content: userMessage });

        // Send the entire message history to OpenAI
        //const aiResponse = await sendMessageToOpenAI(messages);
        //commit('ADD_CHAT_MESSAGE', { text: aiResponse, sender: 'ai', timestamp: new Date().toISOString() });



      } catch (error) {
        console.error('Conversation Error:', error);
      }

    },



    async createNewThread() {
      return axios.post('https://api.openai.com/v1/threads', {}, {
        headers: getHeaders(),
      });
    },



    async createMessage(_, { threadId, content }) {
      return axios.post(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        role: 'user',
        content: content,
      }, {
        headers: getHeaders(),
      });
    },

    async runAssistant(_, { threadId }){
      return axios.post(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        assistant_id: assistantId,
      }, {
          headers: getHeaders(),
      });
    },

    async checkRunStatus(_, { threadId, runId } ) {

      const response = await axios.get(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
          headers: getHeaders(),
      });
      return response.data.status;
    },

    async getMessages (_, { threadId }) {
        try {
            const response = await axios.get(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            headers: getHeaders(),
            });
            console.log('Full messages response:', JSON.stringify(response.data, null, 2));
            return response.data;
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
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
/*
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
    }, */

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
