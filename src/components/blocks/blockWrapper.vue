// blockWrapper.vue
<template>
  <div class="block-wrapper relative" :class="block.type">
    <div 
      class="block-content"
      @mouseenter="isEditing = true"
      @mouseleave="isEditing = false"
    >
        <div class="block-controls absolute right-2 top-2 flex gap-2" v-if="isEditing">
        <button @click="moveBlock('up')" class="control-btn" :disabled="isFirst">↑</button>
        <button @click="moveBlock('down')" class="control-btn" :disabled="isLast">↓</button>
        <button @click="deleteBlock" class="control-btn text-red-500">×</button>
        </div>
        <component 
            :is="getBlockComponent"
            :block="block"
            @edit="handleEdit"
        />
    </div>
    <div class="timestamp-info text-sm text-gray-500" v-if="isEditing">
      <span>Created: {{ formatDate(block.createdAt) }}</span>
      <span class="ml-4">Last edited: {{ formatDate(block.editedAt) }}</span>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import TitleBlock from './titleBlock.vue';
import BodyBlock from './bodyBlock.vue';
import ImageBlock from './imgBlock.vue';
import LineBlock from './lineBlock.vue';
import TodoBlock from './todoBlock.vue';

export default {
  name: 'BlockWrapper',
  components: {
    TitleBlock,
    BodyBlock,
    ImageBlock,
    LineBlock,
    TodoBlock
  },
  props: {
    block: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    totalBlocks: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    const store = useStore();
    const isEditing = ref(false);
    
    const isFirst = computed(() => props.index === 0);
    const isLast = computed(() => props.index === props.totalBlocks - 1);

    const getBlockComponent = computed(() => {
      const componentMap = {
        'title-block': TitleBlock,
        'body-block': BodyBlock,
        'image-block': ImageBlock,
        'line-block': LineBlock,
        'todo-block': TodoBlock
      };
      return componentMap[props.block.type];
    });

    const moveBlock = (direction) => {
      store.dispatch('mindspace/moveBlock', {
        id: props.block.id,
        direction
      });
    };

    const deleteBlock = () => {
      if (confirm('Are you sure you want to delete this block?')) {
        store.dispatch('mindspace/deleteBlock', props.block.id);
      }
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleString();
    };

    const handleEdit = (blockId) => {
      store.dispatch('mindspace/setEditingBlock', blockId);
    };

    return {
      isEditing,
      isFirst,
      isLast,
      getBlockComponent,
      moveBlock,
      deleteBlock,
      formatDate,
      handleEdit
    };
  }
};
</script>

<style scoped>
.block-wrapper {
  position: relative;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.control-btn {
  padding: 0.25rem 0.5rem;
  background-color: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.25rem;
  cursor: pointer;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>