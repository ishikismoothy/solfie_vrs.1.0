// blockWrapper.vue
<template>
  <div class="block-wrapper relative"
    :class="{
      block: block.type,
      'onBlockEdit':isBlockEdit
    }"
  >
    <div
      class="block-content"
    >
        <div class="block-controls" v-if="isBlockEdit">
          <button @click="moveBlock('up')" class="control-btn" :disabled="isFirst">↑</button>
          <button @click="moveBlock('down')" class="control-btn" :disabled="isLast">↓</button>
          <button class="control-btn" @click="DuplicateBlock(block)">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
          </button>
          <button @click="deleteBlock(block.type)" class="control-btn text-red-500">×</button>
        </div>
        <component
            :is="getBlockComponent"
            :block="block"
            @edit="handleEdit"
        />
    </div>
    <div class="timestamp-info text-sm text-gray-500" v-if="isBlockEdit">
      <span>Created: {{ formatDate(block.createdAt) }}</span>
      <span class="ml-4">Last edited: {{ formatDate(block.editedAt) }}</span>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
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
    const isBlockEdit = computed(() => store.state.user.editMonitor.isBlockEdit);

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

    const deleteBlock = (type) => {
      if (confirm('Are you sure you want to delete this block?',type)) {
        store.dispatch('mindspace/deleteBlock', props.block.id);
      }
    };

    const DuplicateBlock = (block) => {
      console.log(block.id);
      if (confirm('Are you sure you want to duplicate this block?')) {
        store.dispatch('mindspace/duplicateBlock', { id: props.block.id, index: props.index });
      }
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleString();
    };

    const handleEdit = (blockId) => {
      store.dispatch('mindspace/setEditingBlock', blockId);
    };

    return {
      isBlockEdit,
      isFirst,
      isLast,
      getBlockComponent,
      moveBlock,
      deleteBlock,
      DuplicateBlock,
      formatDate,
      handleEdit
    };
  }
};
</script>
