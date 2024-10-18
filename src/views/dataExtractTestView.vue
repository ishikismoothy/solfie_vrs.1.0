<template>
    <div>
        <h1>File Upload Test</h1>
        
        <input 
            type="file" 
            @change="handleFileUpload" 
            accept="application/pdf"
            :disabled="isUploading"
        >
        
        <p v-if="isUploading">Uploading...</p>
        
        <div v-if="localUploadedFileId">
            <h2>Upload Successful!</h2>
            <p>Uploaded File ID: {{ localUploadedFileId }}</p>
        </div>
        
        <div v-if="errorMessage">
            <h2>Error</h2>
            <p>{{ errorMessage }}</p>
        </div>
    
        <button 
            @click="handleDataExtraction" 
            :disabled="!localUploadedFileId || isExtracting"
        >
            Extract File
        </button>
    
        <button 
            @click="handleFileDelete" 
            :disabled="!localUploadedFileId || isDeleting"
        >
            Delete File
        </button>
        <p v-if="isDeleting">Deleting...</p>
        <p v-if="deleteErrorMessage">{{ deleteErrorMessage }}</p>

        <table>
            <!--
            <thead>
                <tr>
                <th v-for="(_, index) in extractedData" :key="'header-' + index">
                    Value {{ index + 1 }}
                </th>
                </tr>
            </thead>-->
            <tbody>
                <tr>
                <td v-for="(value, index) in extractedData" :key="'value-' + index">
                    {{ value }}
                </td>
                </tr>
            </tbody>
        </table>
    
        <!-- New section to display extracted data -->
        <div v-if="extractedData.length > 0">
            <h2>Extracted Data:</h2>
            <ul>
            <li v-for="(value, index) in extractedData" :key="index">
                {{ value }}
            </li>
            </ul>
        </div>
    </div>
</template>
  
  <script>
import { defineComponent, ref, computed, watch, nextTick } from 'vue';
import { useStore } from 'vuex';

export default defineComponent({
  name: 'FileUploadTest',
  
  setup() {
    const store = useStore();

    const isUploading = ref(false);
    const isDeleting = ref(false);
    const isExtracting = ref(false);
    const errorMessage = ref(null);
    const deleteErrorMessage = ref(null);
    const localUploadedFileId = ref(null);
    const extractedData = ref([]); // New ref to store extracted data

    const uploadedFileId = computed(() => store.state.uploadedFileId);

    watch(uploadedFileId, (newId) => {
      console.log('Watch - uploadedFileId changed:', newId);
    }, { immediate: true });
    
    const handleDataExtraction = async () => {
      if (localUploadedFileId.value) {
        isExtracting.value = true;
        try {
          console.log('Starting data extraction in component...');
          const result = await store.dispatch('readAndRetrieveAnalysisData');
          
          console.log('result:', result);
          
          // Store the extracted data
          extractedData.value = result.result;
          
        } catch (error) {
          console.error('Error in extractData:', error);
          errorMessage.value = error.message || 'An error occurred while extracting Data.';
        } finally {
          isExtracting.value = false;
        }
      }
      //handleFileDelete();
    };
    
    const handleFileUpload = async (event) => {
      const file = event.target.files[0];
      if (file) {
        isUploading.value = true;
        errorMessage.value = null;
        
        try {
          console.log('Starting file upload in component...');
          const result = await store.dispatch('fileUpload', { uploadedFile: file });
          
          console.log('File upload result:', result);
          
          localUploadedFileId.value = result.fileId;
          console.log('Local ID set:', localUploadedFileId.value);
          
          nextTick(() => {
            console.log('Next tick - ID from state:', uploadedFileId.value);
          });
        } catch (error) {
          console.error('Error in handleFileUpload:', error);
          errorMessage.value = error.message || 'An error occurred while uploading the file.';
        } finally {
          isUploading.value = false;
        }
      }
    };

    const handleFileDelete = async () => {
      if (localUploadedFileId.value) {
        isDeleting.value = true;
        deleteErrorMessage.value = null;

        try {
          console.log('Starting file deletion in component...');
          const result = await store.dispatch('fileDelete');

          console.log('File deletion result:', result);
          localUploadedFileId.value = null;
          extractedData.value = []; // Clear extracted data when file is deleted

          nextTick(() => {
            console.log('Next tick - ID from state after deletion:', uploadedFileId.value);
          });
        } catch (error) {
          console.error('Error in handleFileDelete:', error);
          deleteErrorMessage.value = error.message || 'An error occurred while deleting the file.';
        } finally {
          isDeleting.value = false;
        }
      }
    };

    return {
      isUploading,
      isDeleting,
      isExtracting,
      errorMessage,
      deleteErrorMessage,
      localUploadedFileId,
      uploadedFileId,
      extractedData, // Expose extracted data to the template
      handleFileUpload,
      handleFileDelete,
      handleDataExtraction,
    };
  }
});
</script>