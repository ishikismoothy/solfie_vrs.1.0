<!-- components/CreateMindspace.vue-->
<template>
  <Transition name="modal">
    <div v-if="isVisible" class="input-container">
      <Transition name="popup">
        <div>
          <!-- Title -->
          <h4>Create New Mindspace</h4>

          <!-- Form Content -->
          <div class="name-input-container">
            
            <div class="header-left">
              
              <input 
                v-model="mindspaceName" 
                type="text" 
                placeholder="Please Enter mindspace name"
                class="mindsapce-name-input"
                @input="handleNameInput"
              />

              <div 
                v-if="showSuggestions && filteredSuggestions.length"
                class="name-suggestions"
              >
                <div 
                  v-for="suggestion in filteredSuggestions" 
                  :key="suggestion"
                  class="name-item"
                  @click="selectMindspaceName(suggestion)"
                >
                  {{ suggestion }}
                </div>
              </div>

            </div>

            <div class="header-right">
              <button 
                @click="handleCreateMindspace" 
                :disabled="isLoading"
                class="icon-button"
              >
                🪄
              </button>

              <!-- Close button -->
              <button 
                @click="closePopup" 
                class="icon-button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

            </div>
            

            <p v-if="error" class="text-red-500">{{ error }}</p>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { createMindspace } from '@/firebase/firebaseMindSpace';
import { useStore } from 'vuex';

export default {
  name: 'CreateMindspace',
  
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    userId: {
      type: String,
      required: true
    },
    themeId: {
      type: String,
      required: true
    },
  },

  emits: ['update:isVisible', 'mindspace-created'],
  
  setup(props, { emit }) {
    const store = useStore();
    const mindspaceName = ref('');
    const selectedTheme = ref('');
    const isPrivate = ref(false);
    const isLoading = ref(false);
    const error = ref('');
    const showSuggestions = ref(false);

    const suggestedNames = [
      '心があったまる食事', '私が輝くプレゼン', '心身がリフレッシュする休憩時間', 'みんなが閃く講演会', '可能性が広がる学び', 
      'ワクワクする制作', '心が開く会話', 
    ];

    // Watch for changes in mindspaceName
    watch(mindspaceName, (newValue) => {
      console.log('mindspaceName changed:', newValue);
      handleNameInput();
    });

    const handleNameInput = () => {
      console.log('handleNameInput called');
      console.log('Current input value:', mindspaceName.value);
      showSuggestions.value = mindspaceName.value.length > 0;
      console.log('showSuggestions set to:', showSuggestions.value);
    };

    const filteredSuggestions = computed(() => {
      console.log('Computing filteredSuggestions');
      console.log('showSuggestions:', showSuggestions.value);
      console.log('mindspaceName:', mindspaceName.value);

      if (!showSuggestions.value || !mindspaceName.value) {
        console.log('Returning empty array - conditions not met');
        return [];
      }
      
      const searchTerm = mindspaceName.value.toLowerCase();
      const filtered = suggestedNames.filter(name => 
        name.toLowerCase().includes(searchTerm)
      );
      console.log('Filtered suggestions:', filtered);
      return filtered;
    });

    const selectMindspaceName = (name) => {
      mindspaceName.value = name;
      showSuggestions.value = false;
    };

    const closePopup = () => {
      emit('update:isVisible', false);
      resetForm();
    };

    const resetForm = () => {
      mindspaceName.value = '';
      isPrivate.value = false;
      error.value = '';
      showSuggestions.value = false;
    };

    const handleCreateMindspace = async () => {
      if (!mindspaceName.value) {
        error.value = 'Please fill in all required fields';
        return;
      }

      isLoading.value = true;
      error.value = '';

      try {
        const result = await createMindspace({
          uid: props.userId,
          themeId: props.themeId,
          name: mindspaceName.value,
          privacy: isPrivate.value
        });

        if (result.success) {
          await store.dispatch('mindspace/setMindSpaceList');
          emit('mindspace-created', result.mindspaceId);
          resetForm();
          closePopup();
        } else {
          error.value = result.error;
        }
      } catch (err) {
        error.value = 'Failed to create mindspace';
      } finally {
        isLoading.value = false;
      }
    };

    return {
      mindspaceName,
      selectedTheme,
      isPrivate,
      isLoading,
      error,
      showSuggestions,
      handleCreateMindspace,
      closePopup,
      selectMindspaceName,
      handleNameInput,
      filteredSuggestions,
    };
  }
};
</script>