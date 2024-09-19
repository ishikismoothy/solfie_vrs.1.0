// src/services/openAI.js

import axios from 'axios';

export const OPENAI_API_KEY = process.env.VUE_APP_OPENAI_API_KEY;
export const OPENAI_API_URL = '/api/v1/chat/completions';

export const sendMessageToOpenAI = async (messages) => {
  try {
      const response = await axios.post(OPENAI_API_URL, {
          model: 'gpt-3.5-turbo', // Use the appropriate model
          messages: messages, // Pass the entire messages array
      }, {
          headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
          },
      });

      return response.data.choices[0].message.content;
  } catch (error) {
      console.error('Error communicating with OpenAI:', error.response?.data || error);
      throw error;
  }
};
