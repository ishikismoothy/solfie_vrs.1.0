// titleBlock.vue
<template>
  <div 
    class="title-block"
    @click="isEditable && !isFocused && handleClick()"
  >
    <template v-if="!isEditing">
      <h4>{{ block.content }}</h4>
    </template>
    <template v-else>
      <input
        v-model="editedContent"
        class="edit-input-title"
        @blur="handleBlur"
        @focus="handleFocus"
        ref="editInput"
      >
    </template>
  </div>
</template>

<script>
import { ref, nextTick } from 'vue';
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
    const editInput = ref(null);
    const isFocused = ref(false);

    //CLICK AND OPEN INPUT
    const handleClick = async () => {
      if (isFocused.value) return; // Extra safety check
      isEditing.value = true;
      editedContent.value = props.block.content;
      await nextTick();
      editInput.value.focus();
    };

    //FOCUS ON INPUT FIELD
    const handleFocus = async () => {
      store.dispatch('user/setIsBlockEdit', false);
      isFocused.value = true;
      await nextTick();
      editInput.value.select();
      
    };

    const handleBlur = () => {
      saveChanges();
      isFocused.value = false; // Reset focus state
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
      isFocused.value = false;
    };

    return {
      isEditing,
      editedContent,
      isEditable,
      handleClick,
      saveChanges,
      editInput,
      isFocused,
      handleFocus,
      handleBlur
    };
  }
};
</script>