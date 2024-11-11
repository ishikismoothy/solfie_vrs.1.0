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
import TitleBlock from './blocks/titleBlock.vue';
import BodyBlock from './blocks/bodyBlock.vue';
import ImageBlock from './blocks/imgBlock.vue';
import LineBlock from './blocks/lineBlock.vue';
import TodoBlock from './blocks/todoBlock.vue';

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
