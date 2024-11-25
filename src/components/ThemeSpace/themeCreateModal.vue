<!-- ThemeCreateModal.vue -->
<template>
  <Transition name="theme-modal-fade">
    <div v-if="modelValue" class="theme-modal-overlay" @click="closeModal">
      <div class="theme-modal-content" @click.stop>
        <div class="theme-modal-header">
          <h2 class="text-xl font-semibold">Create New MindTheme</h2>
          <button class="theme-modal-close-button" @click="closeModal">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form @submit.prevent="handleCreate">
          
          <div class="form-group">
            <label>名前を入力/ Enter a name:</label>
            <input 
              type="text" 
              v-model="newName"
              placeholder="例：父、プロジェクトマネジャー、生徒/ eg. father, project Manager, student. "
              ref="nameInput"
              class="name-input"
            >
          </div>

          <!-- Hashtag Input Section -->
          <div class="form-group">
            <div class="hashtag-input-container">
              <div 
                class="hashtag-input-wrapper"
                @click="focusHashtagInput"
              >
                <div class="hashtag-list">
                  <span 
                    v-for="(tag, index) in hashtags" 
                    :key="index"
                    class="hashtag-badge"
                  >
                    #{{ tag }}
                    <button 
                      @click.prevent="removeHashtag(index)" 
                      class="remove-button"
                    >
                      ×
                    </button>
                  </span>
                </div>
                
                <input
                  ref="hashtagInput"
                  v-model="currentHashtagInput"
                  type="text"
                  class="hashtag-input"
                  placeholder="#仕事 #社交 #家庭... #Job #family #social-life..."
                  @input="handleHashtagInput"
                  @keydown="handleHashtagKeydown"
                />
              </div>

              <div 
                v-if="isTypingHashtag && filteredSuggestions.length"
                class="hashtag-suggestions"
              >
                <div 
                  v-for="suggestion in filteredSuggestions" 
                  :key="suggestion"
                  class="suggestion-item"
                  @click="selectHashtag(suggestion)"
                >
                  #{{ suggestion }}
                </div>
              </div>
            </div>
          </div>
          
          <div class="button-group">
            <button 
              type="button" 
              class="cancel-button"
              @click="closeModal"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              class="submit-button"
            >
              Ok
            </button>
          </div>
        </form>
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

  setup(props, { emit }) {
    const store = useStore();
    const newName = ref('');
    const hashtags = ref([]);
    const currentHashtagInput = ref('');
    const isTypingHashtag = ref(false);
    const hashtagInput = ref(null);

    // Suggested tags - you can modify this list or load from your store
    const suggestedTags = [
      'work', 'family', 'study', 'personal', 'project', 
      'leadership', 'teamwork', 'management', 'learning'
    ];

    const filteredSuggestions = computed(() => {
      if (!isTypingHashtag.value || !currentHashtagInput.value.startsWith('#')) return [];
      const searchTerm = currentHashtagInput.value.slice(1).toLowerCase();
      return suggestedTags.filter(tag => 
        tag.toLowerCase().includes(searchTerm) && 
        !hashtags.value.includes(tag)
      );
    });

    const handleHashtagInput = () => {
      isTypingHashtag.value = currentHashtagInput.value.includes('#');
    };

    const handleHashtagKeydown = (e) => {
      if ([/*'Enter',*/ ' ', ','].includes(e.key) && currentHashtagInput.value.includes('#')) {
        e.preventDefault();
        const tag = currentHashtagInput.value.slice(1).trim();
        if (tag && !hashtags.value.includes(tag)) {
          hashtags.value.push(tag);
          currentHashtagInput.value = '';
        }
      }
    };

    const selectHashtag = (tag) => {
      if (!hashtags.value.includes(tag)) {
        hashtags.value.push(tag);
        currentHashtagInput.value = '';
        isTypingHashtag.value = false;
      }
    };

    const removeHashtag = (index) => {
      hashtags.value.splice(index, 1);
    };

    const focusHashtagInput = () => {
      hashtagInput.value?.focus();
    };

    const closeModal = () => {
      emit('update:modelValue', false);
    };

    const handleCreate = () => {
      if (newName.value) {
        emit('create', {
          newTheme: newName.value,
          tags: hashtags.value // Include tags in the create event
        });
        resetForm();
        closeModal();
      }
    };

    const resetForm = () => {
      newName.value = '';
      hashtags.value = [];
      currentHashtagInput.value = '';
    };

    return {
      handleCreate,
      closeModal,
      themes: computed(() => store.getters['themeSpace/getThemesKey']),
      topics: computed(() => store.getters['themeSpace/getTopicsKey']),
      newName,
      hashtags,
      currentHashtagInput,
      isTypingHashtag,
      filteredSuggestions,
      hashtagInput,
      handleHashtagInput,
      handleHashtagKeydown,
      selectHashtag,
      removeHashtag,
      focusHashtagInput
    };
  },
};
</script>
