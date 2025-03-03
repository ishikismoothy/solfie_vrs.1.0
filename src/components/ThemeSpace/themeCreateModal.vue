<!-- ThemeCreateModal.vue -->
<template>
  <Transition name="modal-fade">
    <div v-if="modelValue" class="modal-overlay" @click="close">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="text-xl font-semibold">Establish A New Wish</h2>
          <button class="theme-modal-close-button" @click="close">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form @submit.prevent="handleCreate">

          <div class="form-group">
            <label>願いを入力/ Enter your wish:</label>
            <input
              type="text"
              v-model="newName"
              placeholder="例：円満な家族関係、 仕事で活躍、才能の発揮、豊かな暮らし/ eg. Well-being, Healthy relationship, Unleashing true potentials. "
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

          <!-- image upload -->
          <div class="form-group">
            <label>Upload Image:</label>
            <input type="file" accept="image/*" @change="handleImageUpload"/>
          </div>

          <div class="button-group">
            <button
              type="button"
              class="cancel-button"
              @click="close"
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
import 'firebase/storage';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";

import { storage } from '../../firebase/firebaseInit';


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

      // image upload
    const imageUrl = ref('');
    // const isFileInputVisible = ref(false);

    const handleImageUpload = async (event) => {
      try {
        const file = event.target.files[0];
        if (!file) return; // If no file is selected, exit the function

        const MAX_SIZE = 5 * 1024 * 1024; // 5MB size limit
        if (file.size > MAX_SIZE) {
          alert("The file is too large. Please upload a file smaller than 5MB.");
          return;
        }

        // Check if the file type is an image (JPEG, PNG, or GIF)
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          alert("Please upload a valid image file (JPEG, PNG, GIF).");
          return; // Exit the function if it's not an image
        }

        const storageReference = storageRef(storage, `theme_images/${file.name}`);
        const uploadTask = uploadBytesResumable(storageReference, file);

        uploadTask.on('state_changed',
          (snapshot) => {
            // Track upload progress
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload is ${progress}% done`);
          },
          (error) => {
            // Handle error
            console.error(error);
          },
          () => {
            // Handle successful upload
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              console.log('File available at', downloadURL);
              imageUrl.value = downloadURL;
            });
          }
        );
      } catch (error) {
        console.error("Error uploading image: ", error);
      }
    };
      // image upload end

    const close = () => {
      emit('update:modelValue', false);
    };

    const handleCreate = () => {
      if (newName.value) {
        emit('create', {
          newTheme: newName.value,
          tags: hashtags.value // Include tags in the create event
        });
        resetForm();
        close();
      }
    };

    const resetForm = () => {
      newName.value = '';
      hashtags.value = [];
      currentHashtagInput.value = '';
    };

    return {
      handleCreate,
      close,
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
      focusHashtagInput,
      handleImageUpload,
      imageUrl
    };
  },
};
</script>
