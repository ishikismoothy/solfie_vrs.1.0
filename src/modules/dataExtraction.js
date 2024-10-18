import { OPENAI_API_KEY } from './openAI.js';
import axios from 'axios';

const assistantId = 'asst_isdQ9nXilUFeVPCdienNz0PC';
const threads_endPoint = 'https://api.openai.com/v1/threads';
const files_endPoint = 'https://api.openai.com/v1/files';

const getHeaders = () => ({
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'OpenAI-Beta': 'assistants=v2',
    'Content-Type': 'application/json',
});

export default {
    state: {
        extractedData: null,   
        uploadedFileId: null,
        responseResult: null,
    },
    mutations: {
        SET_UPLOADED_FILE_ID(state, fileId) {
            console.log('Mutation: Setting uploadedFileId to', fileId);
            state.uploadedFileId = fileId;
        },
        SET_AI_RESPONSE(state, response) {
            state.responseResult = response;
        },
        SET_EXTRACTED_VALUES (state, values) {
            console.log('Mutation: Setting values to extractedData', values);
            state.extractedData = values;
        },
    },
    actions: {
        async extractValuesFromAIResponse(_,{ aiResponse }) {
            //const parsedResponse = JSON.parse(aiResponse);
            console.log('[extractValuesFromAIResponse] Looking at '+aiResponse)
            try {
                const jsonString = aiResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
            
                // The value field contains a JSON string, so we need to parse it again
                // Parse the cleaned JSON string
                const jsonData = JSON.parse(jsonString);
                
                // Check if harmonization_list exists and is an array
                if (!jsonData.harmonization_list || !Array.isArray(jsonData.harmonization_list)) {
                    console.error("Invalid data structure: harmonization_list not found or not an array");
                    return [];
                }
                
                // Extract the 'value' from each item in the harmonization_list
                const extractedValue = jsonData.harmonization_list.map(item => item.value);
                console.log('successfully Extracted: ', extractedValue);
                return extractedValue;
                } catch (error) {
                console.error("Error parsing JSON:", error);
                return [];
                }
        },

        async readAndRetrieveAnalysisData({ dispatch, commit }){
            let aiResponse = '';

            //await dispatch('fileUpload', { uploadedFile });

            const threadResponse = await dispatch('createNewThread');
            const threadId = threadResponse.data.id;
            console.log('Thread created with ID:', threadId);
            //commit('SET_THREAD_ID', threadId);

            //STEP02 : Create Message
            await dispatch('createMessage', { threadId });

            //STEP03 : Run Assistant
            const runResponse = await dispatch ('runAssistant', {threadId});
            const runId = runResponse.data.id;
            console.log('Assistant run started with ID:', runId);

            //STEP04 : Check Assistant Status
            await dispatch('monitorStatusUpdate', { runId, threadId });

            //STEP05 : GET MESSAGE
            const generatedMessage = await dispatch ('getMessages', { threadId });

            if (generatedMessage.data && generatedMessage.data.length > 0) {
                console.log('Number of messages received:', generatedMessage.data.length);
                let assistantMessages = generatedMessage.data.filter(msg => msg.role === 'assistant');
                console.log('Number of assistant messages:', assistantMessages.length);

                if (assistantMessages.length > 0) {
                    const latestMessage = assistantMessages[0];
                    console.log("RAW RESPONSE: ",latestMessage);
                    if (latestMessage.content && latestMessage.content.length > 0) {
                    aiResponse = latestMessage.content[0].text.value;
                    const extractedResponse = await dispatch('extractValuesFromAIResponse',{ aiResponse });
                    console.log("AI RESPONSE: ",extractedResponse);
                    
                    commit('SET_AI_RESPONSE', extractedResponse);

                    return { result: extractedResponse };
                    } else {
                        aiResponse = 'Assistant message has no content.';
                        return { result: aiResponse };
                    }
                } else {
                    aiResponse = 'No assistant messages found.';
                    return { result: aiResponse };
                }
            } else {
                aiResponse = 'No messages received from the thread.';
                return { result: aiResponse };
            }
        },
        
        async fileUpload({ state, commit }, { uploadedFile }) {
            console.log('Starting file upload...');
        
            const formData = new FormData();
            formData.append('file', uploadedFile);
            formData.append('purpose', 'assistants');
        
            try {
              const response = await axios.post(files_endPoint, formData, {
                headers: {
                  'Authorization': `Bearer ${OPENAI_API_KEY}`,
                }
              });
        
              console.log('API Response:', response.data);
        
              if (response.data && response.data.id) {
                console.log('File ID received:', response.data.id);
                commit('SET_UPLOADED_FILE_ID', response.data.id);
                console.log('State after commit:', state.uploadedFileId);
                return { fileId: response.data.id };
              } else {
                console.error('File ID not found in response');
                return { fileId: null };
              }
            } catch (error) {
              console.error('Error uploading file:', error);
              throw error;
            }
        },

        async fileDelete({state, commit}) {
            console.log('Starting file deletion For...', state.uploadedFileId);

            try {
                const response = await axios.delete(files_endPoint+'/'+state.uploadedFileId, {
                  headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                  }
                });
          
                console.log('API Response:', response.data);
          
                if (response.data && response.data.id) {
                  console.log('Deleted File ID :', response.data.id);
                  commit('SET_UPLOADED_FILE_ID', null);
                  console.log('State after commit:', state.uploadedFileId);
                  return { fileId: response.data.id };
                } else {
                  console.error('Target File ID not found in response');
                  return { fileId: null };
                }
              } catch (error) {
                console.error('Error deleting file:', error);
                throw error;
              }

        },

        //EXTRACT DATA FROM JSON DATA
        async extractDataFromJson({ commit }, { extractedJsonData }) {
            const values = extractedJsonData.harmonization_list.map(item => item.value);
            console.log(values);
            commit('SET_EXTRACTED_VALUES', values);
        },

        async createNewThread() {
            return axios.post(threads_endPoint, {}, {
                headers: getHeaders(),
            });
        },
        
        async createMessage({ state }, { threadId }) {
            return axios.post(threads_endPoint+`/${threadId}/messages`, {
                role: 'user',
                content: fileContent,
                "attachments": [
                    {
                        "file_id": state.uploadedFileId,
                        "tools" : [
                            {
                                "type": "file_search"
                            }
                        ]
                    }
                ],
            }, {
                headers: getHeaders(),
            });
        },
        
        async runAssistant(_, { threadId }){
            return axios.post(threads_endPoint+`/${threadId}/runs`, {
                assistant_id: assistantId,
            }, {
                headers: getHeaders(),
            });
        },

        async monitorStatusUpdate ({dispatch },{threadId, runId}){
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
        },
        
        async checkRunStatus(_, { threadId, runId } ) {
        
            const response = await axios.get(threads_endPoint+`/${threadId}/runs/${runId}`, {
                headers: getHeaders(),
            });
            return response.data.status;
        },
        
        async getMessages (_, { threadId }) {   
            try {
                const response = await axios.get(threads_endPoint+`/${threadId}/messages`, {
                headers: getHeaders(),
                });
                console.log('Full messages response:', JSON.stringify(response.data, null, 2));
                return response.data;
            } catch (error) {
                console.error('Error fetching messages:', error);
                throw error;
            }
        },
        
    },

    getters: {
        
    }
}

const fileContent = `Please extract the data in the format of Json.
**Return only Json Data.**

#Example
{
  "document_info": {
    "source": "Solfie_Vrs.8.1.0_Alpha - Solfie (       ) - 2024-10-18  13-27.pdf",
    "software_version": "TimeWaver Pro 4.20.23.1249",
    "generation_date": "2024-10-18",
    "generation_time": "13:29:48"
  },
  "harmonization_plan": {
    "start_date": "2024-10-18 13:27:59",
    "end_date": "2024-11-15 13:27:59",
    "duration": "7d 12h 19m",
    "interval": "5m 59s"
  },
  "focus": "Present state",
  "harmonization_list": [
    {"index": 1, "consciousness": 97, "value": 46, "db_path": "01-01-46"},
    {"index": 2, "consciousness": 97, "value": 45, "db_path": "01-02-45"},
    {"index": 3, "consciousness": 90, "value": 31, "db_path": "01-03-31"},
    {"index": 4, "consciousness": -97, "value": 99, "db_path": "02-01-99"},
    {"index": 5, "consciousness": -94, "value": 48, "db_path": "02-02-48"},
    {"index": 6, "consciousness": -91, "value": 14, "db_path": "02-03-14"},
    {"index": 7, "consciousness": -88, "value": 3, "db_path": "03-01-12"},
    {"index": 8, "consciousness": 85, "value": 4, "db_path": "03-02-05"},
    {"index": 9, "consciousness": -66, "value": 1, "db_path": "03-03-01-10"},
    {"index": 10, "consciousness": 90, "value": 27, "db_path": "03-03-02-28"},
    {"index": 11, "consciousness": 84, "value": 8, "db_path": "03-03-03-09"},
    {"index": 12, "consciousness": 79, "value": 0, "db_path": "03-03-04-01"},
    {"index": 13, "consciousness": 90, "value": 35, "db_path": "03-03-05-36"},
    {"index": 14, "consciousness": -85, "value": 3, "db_path": "04-01-01-04"},
    {"index": 15, "consciousness": -80, "value": 3, "db_path": "04-01-02-04"},
    {"index": 16, "consciousness": 64, "value": 0, "db_path": "04-01-03-05"},
    {"index": 17, "consciousness": -85, "value": 0, "db_path": "04-01-04-09"},
    {"index": 18, "consciousness": 78, "value": 0, "db_path": "04-02-01-08"},
    {"index": 19, "consciousness": -73, "value": 4, "db_path": "04-02-02-05"},
    {"index": 20, "consciousness": 73, "value": 2, "db_path": "04-02-03-11"},
    {"index": 21, "consciousness": -88, "value": 0, "db_path": "04-02-04-03"},
    {"index": 22, "consciousness": 87, "value": 1, "db_path": "04-03-01-11"},
    {"index": 23, "consciousness": -90, "value": 1, "db_path": "04-03-02-07"},
    {"index": 24, "consciousness": -69, "value": 2, "db_path": "04-03-03-03"},
    {"index": 25, "consciousness": 62, "value": 1, "db_path": "04-03-04-04"},
    {"index": 26, "consciousness": -78, "value": 1, "db_path": "05-01-11"},
    {"index": 27, "consciousness": 99, "value": 27, "db_path": "05-02-28"}
  ],
  "notes": {
    "database_version": "Vrs.8.1.0_ALPHA"
  }
}`;

/*
const testData = {
    "document_info": {
      "source": "Solfie_Vrs.8.1.0_Alpha - Solfie (       ) - 2024-10-18  13-27.pdf",
      "software_version": "TimeWaver Pro 4.20.23.1249",
      "generation_date": "2024-10-18",
      "generation_time": "13:29:48"
    },
    "harmonization_plan": {
      "start_date": "2024-10-18 13:27:59",
      "end_date": "2024-11-15 13:27:59",
      "duration": "7d 12h 19m",
      "interval": "5m 59s"
    },
    "focus": "Present state",
    "harmonization_list": [
      {"index": 1, "consciousness": 97, "value": 46, "db_path": "01-01-46"},
      {"index": 2, "consciousness": 97, "value": 45, "db_path": "01-02-45"},
      {"index": 3, "consciousness": 90, "value": 31, "db_path": "01-03-31"},
      {"index": 4, "consciousness": -97, "value": 99, "db_path": "02-01-99"},
      {"index": 5, "consciousness": -94, "value": 48, "db_path": "02-02-48"},
      {"index": 6, "consciousness": -91, "value": 14, "db_path": "02-03-14"},
      {"index": 7, "consciousness": -88, "value": 3, "db_path": "03-01-12"},
      {"index": 8, "consciousness": 85, "value": 4, "db_path": "03-02-05"},
      {"index": 9, "consciousness": -66, "value": 1, "db_path": "03-03-01-10"},
      {"index": 10, "consciousness": 90, "value": 27, "db_path": "03-03-02-28"},
      {"index": 11, "consciousness": 84, "value": 8, "db_path": "03-03-03-09"},
      {"index": 12, "consciousness": 79, "value": 0, "db_path": "03-03-04-01"},
      {"index": 13, "consciousness": 90, "value": 35, "db_path": "03-03-05-36"},
      {"index": 14, "consciousness": -85, "value": 3, "db_path": "04-01-01-04"},
      {"index": 15, "consciousness": -80, "value": 3, "db_path": "04-01-02-04"},
      {"index": 16, "consciousness": 64, "value": 0, "db_path": "04-01-03-05"},
      {"index": 17, "consciousness": -85, "value": 0, "db_path": "04-01-04-09"},
      {"index": 18, "consciousness": 78, "value": 0, "db_path": "04-02-01-08"},
      {"index": 19, "consciousness": -73, "value": 4, "db_path": "04-02-02-05"},
      {"index": 20, "consciousness": 73, "value": 2, "db_path": "04-02-03-11"},
      {"index": 21, "consciousness": -88, "value": 0, "db_path": "04-02-04-03"},
      {"index": 22, "consciousness": 87, "value": 1, "db_path": "04-03-01-11"},
      {"index": 23, "consciousness": -90, "value": 1, "db_path": "04-03-02-07"},
      {"index": 24, "consciousness": -69, "value": 2, "db_path": "04-03-03-03"},
      {"index": 25, "consciousness": 62, "value": 1, "db_path": "04-03-04-04"},
      {"index": 26, "consciousness": -78, "value": 1, "db_path": "05-01-11"},
      {"index": 27, "consciousness": 99, "value": 27, "db_path": "05-02-28"}
    ],
    "notes": {
      "database_version": "Vrs.8.1.0_ALPHA"
    }
  };*/