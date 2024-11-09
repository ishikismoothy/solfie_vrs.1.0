// components/CreateMindspace.vue
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
              />

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
import { ref } from 'vue';
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
    

    const closePopup = () => {
      console.log("[createMindSpace.vue] userId: ",props.userId);
      console.log("[createMindSpace.vue] themeId: ",props.themeId);
      emit('update:isVisible', false);
      // Reset form when closing
      resetForm();
    };

    const resetForm = () => {
      mindspaceName.value = '';
      isPrivate.value = false;
      error.value = '';
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
          uid: props.userId, // Assuming this is how you store user ID
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
      handleCreateMindspace,
      closePopup
    };
  }
};
</script>

<style lang="scss">
.input-container{
  padding: 16px 0;
  margin-bottom: 40px;
}
.name-input-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 16px; // Adds space between elements

  .header-left {
    flex: 1; // This will make the left section take up available space
    min-width: 0; // Prevents flex item from overflowing
  }

  .header-right {
    display: flex;
    gap: 8px; // Space between buttons
    align-items: center;
  }
}

.mindsapce-name-input {
  height: 32px;
  width: 100%;
  border: none; // Remove border
  outline: none; // Remove outline on focus
  background: transparent; // Optional: makes input background transparent
  
  &:focus {
    outline: none; // Removes the focus outline
    border-bottom: 1px solid #E5E7EB;
    ring: none; // Removes any ring effect
    @apply focus:ring-0 focus:border-0; // Removes Tailwind focus styles
  }
  
  &::placeholder {
    color: #9CA3AF; // Customize placeholder color if needed
  }
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 4px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

/* Animation */
// New transition animations
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.popup-enter-active {
  animation: popup-in 0.3s ease-out;
}

.popup-leave-active {
  animation: popup-out 0.3s ease-in;
}

@keyframes popup-in {
  0% {
    transform: scale(0.95);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes popup-out {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.95);
    opacity: 0;
  }
}

.fixed {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>