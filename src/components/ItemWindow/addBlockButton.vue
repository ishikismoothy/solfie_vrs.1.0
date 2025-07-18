<!-- AddBlockButton.vue -->
<template>
    <div class="add-block-wrapper">
          <!-- Hidden file input -->
      <input
        type="file"
        ref="fileInput"
        accept="image/*"
        :style="{ display: 'none' }"
        @change="onFileChange"
      />
        <button
            @click="toggleOptions"
            class="icon-button"
            v-show="isBlockEdit"
        >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
        </button>

        <!-- Modal Overlay -->
        <div v-if="showOptions" class="modal-overlay">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>Add Block</h3>
                    <button class="icon-button close-button" @click="toggleOptions">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="options-grid">
                    <button
                        v-for="option in blockOptions"
                        :key="option.type"
                        @click="addBlock(option.type)"
                        class="block-option"
                    >
                        <span class="icon" v-html="option.icon"></span>
                        <span class="label">{{ option.label }}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
  import { ref, onMounted, onUnmounted } from 'vue';

  export default{
    name: 'AddBlockButton',
    props:{
        index: {
            type: Number,
            required: true
        },
        isBlockEdit: {
            type: Boolean,
            required: true
        }
    },
    emits: ['add', 'add-image'],
    setup(props, { emit }){
      const showOptions = ref(false);
      const fileInput = ref(null);
      const onFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
          emit('add-image', { file: file, index: props.index });
          console.log('File selected:', file);
        }
      };


      const blockOptions = [
          {
              type: 'title-block',
              label: 'Title',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>'
          },
          {
              type: 'body-block',
              label: 'Body',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>'
          },
          {
              type: 'image-block',
              label: 'Image',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'
          },
          {
              type: 'line-block',
              label: 'Line',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>'
          },
          {
              type: 'todo-block',
              label: 'Todo',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>'
          }
      ];

      const toggleOptions = () => {
          showOptions.value = !showOptions.value;
      };

      const addBlock = (type) => {
        if (type === 'image-block') {
          fileInput.value?.click(); // trigger the hidden file input
        } else {
          emit('add', { type, index: props.index });
        }
        showOptions.value = false;
      };

      // Close options menu when clicking outside
      const handleClickOutside = (event) => {
          if (event.target.closest('.modal-overlay') && !event.target.closest('.modal-content')) {
              showOptions.value = false;
          }
      };


      // Add and remove click outside listener
      onMounted(() => {
          document.addEventListener('click', handleClickOutside);
      });

      onUnmounted(() => {
          document.removeEventListener('click', handleClickOutside);
      });

      return{
        showOptions,       // Add this
        blockOptions,
        toggleOptions,
        addBlock,
        fileInput,
        onFileChange
      };
    }
  }

  </script>

  <style lang="scss" scoped>
  // Base Layout
  .add-block-wrapper {
    position: relative;
    display: flex;
    justify-content: center;
    margin: 4px 0;
  }

  // Icon Button (Add Block Button)
  .icon-button {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border: 1px solid #ddd;
    border-radius: 50%;
    cursor: pointer;
    opacity: 0.7;
    transition: all 0.2s ease;

    &:hover {
      opacity: 1;
      background: #f5f5f5;
      border-color: #007bff;
      transform: scale(1.05);
    }

    svg {
      color: #4b5563;
      width: 20px;
      height: 20px;
    }

    &.close-button {
      width: 28px;
      height: 28px;
      opacity: 1;

      &:hover {
        background: #fef2f2;
        border-color: #fecaca;

        svg {
          color: #dc2626;
        }
      }

      svg {
        color: #ef4444;
        width: 18px;
        height: 18px;
      }
    }
  }

  // Modal Layout
  .modal-overlay {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
  }

  .modal-content {
    width: 90%;
    max-width: 320px;
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    margin: 0;
  }

  // Modal Header
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f3f4f6;

    h3 {
      margin: 0;
      color: #374151;
      font-size: 18px;
      font-weight: 600;
    }
  }

  // Options Grid
  .options-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 70vh;
    overflow-y: auto;
  }

  // Block Options
  .block-option {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 14px 16px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;

    &:hover {
      background: #f9fafb;
      border-color: #d1d5db;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .icon {
      display: flex;
      align-items: center;
      color: #6b7280;
      min-width: 24px;

      svg {
        width: 18px;
        height: 18px;
      }
    }

    .label {
      color: #374151;
      font-size: 14px;
      font-weight: 500;
    }
  }
  </style>
