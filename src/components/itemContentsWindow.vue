<template>
    <div v-if="isOpen" class="item-window-overlay">
      <div class="item-window">
        <div class="page-container">
          <button @click="close" class="icon-button close-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <div class="controls mb-4">
            <button @click="addNewBlock('title-block')" class="btn">Add Title</button>
            <button @click="addNewBlock('body-block')" class="btn">Add Body</button>
            <button @click="addNewBlock('image-block')" class="btn">Add Image</button>
            <button @click="addNewBlock('line-block')" class="btn">Add Line</button>
            <button @click="addNewBlock('todo-block')" class="btn">Add Todo</button>
          </div>
  
          <div class="blocks-container">
            <block-wrapper
              v-for="(block, index) in blocks"
              :key="block.id"
              :block="block"
              :index="index"
              :total-blocks="blocks.length"
              @edit="handleBlockEdit"
            />
          </div>
        </div>
      </div>
    </div>
</template>

<script>
import { computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import BlockWrapper from './blocks/blockWrapper.vue';

// Move helper functions outside of setup
const generateRandomId = (length = 10) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const getDefaultContent = (type) => {
    switch (type) {
        case 'title-block':
            return 'New Title'
        case 'body-block':
            return 'New body text'
        case 'image-block':
            return '/path/to/default/image.jpg'
        case 'todo-block':
            return [{
                name: 'New todo item',
                tick: false,
                createdAt: new Date().toISOString(),
                due: new Date(Date.now() + 86400000).toISOString() // Tomorrow
            }]
        default:
            return null
    }
};
  
export default {
    name: 'ItemWindow',
    components: {
        BlockWrapper
    },
    props: {
        isOpen: {
        type: Boolean,
        required: true
        },
    },
    emits: ['close'],
    setup(props, { emit }) {
        const store = useStore();
        const selectedItemId = computed(() => store.getters['mindspace/getItemId']);
        const currentUid = computed(() => store.getters['mindspace/getUserId']); 
        const blocks = computed(() => store.getters['mindspace/getItemBlocks']);
        const close = () => {
            emit('close');
        };

        const loadItemData = async () => {
            if (selectedItemId.value) {
                await store.dispatch('mindspace/setBlocks', selectedItemId.value);
            }
        };

        // Watch for changes in itemId to reload data
        watch(() => selectedItemId.value, async (newId) => {
            if (newId) {
                await loadItemData();
            }
            
        });
        onMounted(async () => {
            if (selectedItemId.value) {
                await loadItemData();
            }
        });
        
        const addNewBlock = (type) => {
            const newBlock = {
                id: 'e-' + generateRandomId(),
                type,
                content: getDefaultContent(type),
                createdBy: currentUid.value,
                editedBy: [currentUid.value],
                createdAt: new Date().toISOString(),
                editedAt: new Date().toISOString()
            };
            store.dispatch('mindspace/addBlock', newBlock);
            };

            const handleBlockEdit = (blockId) => {
            store.dispatch('mindspace/setEditingBlock', blockId);
        };

        return {
            blocks,
            close,
            addNewBlock,
            handleBlockEdit
        };
    }
};
</script>

<style lang="scss">
.item-window-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.item-window {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  
  .close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    
    &:hover {
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: 50%;
    }
  }
}

.page-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

// Include your existing styles here
.controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn {
  padding: 0.5rem 1rem;
  background-color: #4a5568;
  color: white;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #2d3748;
  }
}

.block-wrapper {
    margin: 1rem 0;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
}

.edit-textarea {
  width: 100%;
  min-height: 100px;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.25rem;
  resize: vertical;
}

/* Block-specific styles */
.title-block {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.body-block {
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 1rem;

    .todo-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem 0;
    }
}



.section-line {
  border: none;
  border-top: 2px solid #e2e8f0;
  margin: 1rem 0;
}

.image-block {
  margin: 1rem 0;

    .image-item {
        max-width: 100%;
        height: auto;
    }

}

.todo-block {
  background-color: #f7fafc;
  padding: 1rem;
  border-radius: 0.5rem;

  .todo-item .completed {
    text-decoration: line-through;
    color: #718096;
  }

}

  
.edit-input {
width: 100%;
padding: 0.5rem;
border: 1px solid #e2e8f0;
border-radius: 0.25rem;
}





.timestamp-info {
margin-top: 0.5rem;
font-size: 0.875rem;
color: #718096;
}
  </style>
  