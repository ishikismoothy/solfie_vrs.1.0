<!-- ThemeCreateModal.vue -->
<template>
    <Transition name="theme-modal-fade">
      <div v-if="modelValue" class="theme-modal-overlay" @click="closeModal">
        <div class="theme-modal-content" @click.stop>
          <div class="theme-modal-header">
            <h2 class="text-xl font-semibold">Create New Theme</h2>
              <button class="theme-modal-close-button" @click="closeModal">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
          </div>
          
          <div class="theme-modal-body">
            <div class="selection-container">

              <div class="selection-group">
                <label>テーマ</label>
                <div class="select-wrapper">
                  <select v-model="selectedTheme" class="theme-select">
                    <option v-for="theme in themes" :key="theme" :value="theme">
                      {{ theme }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="selection-group">
                <div class="operator">X</div>
              </div>

              <div class="selection-group">
                <label>トピック</label>
                <div class="select-wrapper">
                  <select v-model="selectedTopic" class="topic-select">
                    <option v-for="topic in topics" :key="topic" :value="topic">
                      {{ topic }}
                    </option>
                  </select>
                </div>
              </div>

            </div>

            <!-- Preview Section -->
            <div class="preview-section" v-if="combinedValue">
              <div class="preview-label">Preview:</div>
              <div class="preview-value">{{ combinedValue }}</div>
            </div>
  
            <button 
              class="theme-modal-create-button" 
              @click="handleCreate"
              :disabled="!isValidCombination"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </template>
  
  <script>
  import { ref, computed } from 'vue';
  import { useStore } from 'vuex';
  
  export default {
    name: 'ThemeCreateModal',
    props: {
      modelValue: {
        type: Boolean,
        required: true
      }
    },
    emits: ['update:modelValue', 'create'],
    setup(props, { emit }){
      const store = useStore();

      const selectedTheme = ref('');
      const selectedTopic = ref('');

      // Get themes and topics from store
      const themes = computed(() => store.getters['themeSpace/getThemesKey']);
      const topics = computed(() => store.getters['themeSpace/getTopicsKey']);

      const combinedValue = computed(() => {
        if (selectedTopic.value && selectedTheme.value) {
          return `${selectedTheme.value}${selectedTopic.value}`;
        }
        return '';
      });

      const isValidCombination = computed(() => 
        selectedTheme.value && selectedTopic.value
      );

      const closeModal = () => {
        emit('update:modelValue', false);
      };

      const handleCreate = () => {
        if (isValidCombination.value) {
          emit('create', {
            theme: selectedTheme.value,
            topic: selectedTopic.value,
            combinedValue: combinedValue.value
          });
          resetForm();
          closeModal();
        }
      };

      const resetForm = () => {
        selectedTheme.value = '';
        selectedTopic.value = '';
      };

      // Optional: Load data when component mounts
      //store.dispatch('themeSpace/loadThemesAndTopics');

      return{
        handleCreate,
        closeModal,
        themes,
        topics,
        combinedValue,
        isValidCombination,
        selectedTheme,
        selectedTopic
      }
    },
  }
  </script>
  
  <style lang="scss">
  
</style>