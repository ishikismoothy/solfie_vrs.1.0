<!-- RenameDialog.vue -->
<template>
  <Transition name="theme-modal-fade">
    <div v-if="modelValue" class="theme-modal-overlay" @click="close">
      <div class="theme-modal-content" @click.stop>
        <div class="theme-modal-header">
          <h2 class="text-xl font-semibold">Rename MindTheme</h2>
          <button class="theme-modal-close-button" @click="close">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form @submit.prevent="handleSubmit">
          
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
  emits: ['update:modelValue', 'rename'],

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
        emit('rename', newName.value.trim());
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