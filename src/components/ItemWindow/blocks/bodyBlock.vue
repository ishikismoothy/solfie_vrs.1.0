<template>
  <div 
    class="body-block"
    @click="isEditable && handleClick()"
  >
    <template v-if="!isEditing">
      <p>{{ block.content }}</p>
    </template>
    <template v-else>
      <textarea
        v-model="editedContent"
        class="edit-textarea"
        @blur="saveChanges"
        ref="editTextarea"
        rows="4"
      ></textarea>
    </template>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'BodyBlock',
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
          content: editedContent.value
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