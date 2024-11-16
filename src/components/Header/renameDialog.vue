<!-- RenameDialog.vue -->
<template>
    <Transition name="modal">
      <div v-if="modelValue" class="rename-modal-overlay">
        <div class="rename-modal-content">
          <div class="rename-modal-header">
            <h2>Rename board</h2>
            <button class="rename-modal-close-button" @click="close">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
                <label>Enter a new board name:</label>
                <input 
                type="text" 
                v-model="newName"
                ref="nameInput"
                class="name-input"
                >
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
import { ref, watch, nextTick } from 'vue';
export default {
  name: 'RenameDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    initialName: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue', 'confirm'],
  setup(props, { emit }) {
    const nameInput = ref(null);
    const newName = ref(props.initialName);

    watch(
      () => props.modelValue,
      (newVal) => {
        if (newVal) {
          newName.value = props.initialName;
          nextTick(() => {
            nameInput.value?.focus();
          });
        }
      }
    );

    const close = () => {
      emit('update:modelValue', false);
    };

    const handleSubmit = () => {
      if (newName.value.trim()) {
        emit('confirm', newName.value.trim());
        close();
      }
    };

    return {
      newName,
      nameInput,
      close,
      handleSubmit
    };
  }
};
</script>
