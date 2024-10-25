<template>
    <div>
      <h1>User Management Dashboard</h1>
  
      <!-- User List -->
      <div v-if="loading">Loading users...</div>
      <div v-else-if="error">{{ error }}</div>
      <div v-else>
        <h2>User List</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.name }}</td>
              <td>
                <button @click="editUser(user)">Edit</button>
                <button @click="deleteUser(user.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- Add/Edit User Form -->
      <div>
        <h2>{{ isEditing ? 'Edit User' : 'Add New User' }}</h2>
        <form @submit.prevent="submitUser">
          <input v-model="userForm.name" placeholder="Name" required>
          <!-- Add more fields as needed -->
          <button type="submit">{{ isEditing ? 'Update' : 'Add' }} User</button>
          <button v-if="isEditing" type="button" @click="cancelEdit">Cancel</button>
        </form>
      </div>
    </div>

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
    import { defineComponent, ref, computed, watch, nextTick, onMounted } from 'vue';
    import { useStore } from 'vuex';
    //import { db } from '@/firebase/firebaseInit';
    //import { collection, getDocs } from 'firebase/firestore';
    import { getUsersCollections } from '@/firebase/firebaseFirestore';

    export default defineComponent({
    name: 'FileUploadTest',
    
    setup() {
        const store = useStore();

        //LIST UP USERS
        const userForm = ref({ name: '' });
        const isEditing = ref(false);
        const editingUserId = ref(null);
    
        //const users = computed(() => store.state.users);
        const loading = computed(() => store.state.loading);
        //const error = computed(() => store.state.error);

        const users = ref([]);
        const error = ref(null);


        onMounted(() => {
            console.log('onMount Starting...');
            users.value = getUsersCollections();
            //ERROR I WANT TO FIX HERE!!**
            //store.dispatch('fetchUsers');
        });

        // Watch for changes in the users state
        watch(() => store.state.users, (newUsers) => {
            console.log('Users updated:', newUsers);
        });

        const submitUser = async () => {
            if (isEditing.value) {
                await store.dispatch('updateUser', { id: editingUserId.value, userData: userForm.value });
            } else {
                await store.dispatch('addUser', userForm.value);
            }
            resetForm();
        };

        const editUser = (user) => {
            userForm.value = { ...user };
            isEditing.value = true;
            editingUserId.value = user.id;
        };
    
        const deleteUser = async (userId) => {
            if (confirm('Are you sure you want to delete this user?')) {
            await store.dispatch('deleteUser', userId);
            }
        };
    
        const cancelEdit = () => {
            resetForm();
        };
    
        const resetForm = () => {
            userForm.value = { name: '' };
            isEditing.value = false;
            editingUserId.value = null;
        };

        //FILE UPLOAD
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

            users,
            loading,
            error,
            userForm,
            isEditing,
            submitUser,
            editUser,
            deleteUser,
            cancelEdit,
        };
    }
    });
</script>