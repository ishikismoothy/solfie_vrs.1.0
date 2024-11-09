// titleBlock.vue
<template>
  <div 
    class="title-block"
    @click="isEditable && handleClick()"
  >
    <template v-if="!isEditing">
      <h2>{{ block.content }}</h2>
    </template>
    <template v-else>
      <input
        v-model="editedContent"
        class="edit-input"
        @blur="saveChanges"
        @keyup.enter="saveChanges"
        ref="editInput"
      >
    </template>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'TitleBlock',
  props: {
    block: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const store = useStore();
    const isEditing = ref(false);
    const editedContent = ref('');
    const isEditable = ref(true);
    
    const handleClick = () => {
      isEditing.value = true;
      editedContent.value = props.block.content;
    };

    const saveChanges = () => {
      if (editedContent.value !== props.block.content) {
        store.dispatch('mindspace/updateBlock', {
          id: props.block.id,
          content: editedContent.value,
          editedAt: new Date().toISOString()
        });
      }
      isEditing.value = false;
    };

    return {
      isEditing,
      editedContent,
      isEditable,
      handleClick,
      saveChanges
    };
  }
};
</script>