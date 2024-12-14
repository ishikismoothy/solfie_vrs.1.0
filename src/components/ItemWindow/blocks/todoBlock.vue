// todoBlock.vue
<template>
  <div class="todo-block">
    <div v-for="(todo, index) in todos" :key="index" class="todo-item">
      <div class="todo-item-left-section">
        <div class="text-nm text-gray-500" @click="handleClick(index)">
          <template v-if="editingIndex !== index">
            <span :class="{ 'line-through text-gray-500': todo.tick }">
              {{ todo.name }}
            </span>
          </template>
          <template v-else>
            <input
              v-model="editedTodoName"
              class="edit-input w-full"
              @blur="handleBlur(index)"
              @focus="handleFocus(index)"
              :ref="el => { if (el) todoEditInputs[index] = el }"
            >
          </template>
        </div>
        <div class="text-sm text-gray-500" @click="handleDateClick(index)">
          Due: 
          <template v-if="editingDateIndex !== index">
            {{ formatDate(todo.due) }}
          </template>
          <template v-else>
            <input
              type="date"
              v-model="editedDate"
              class="date-input"
              @blur="handleDateBlur(index)"
              @focus="handleDateFocus(index)"
              :ref="el => { if (el) dateEditInputs[index] = el }"
            >
          </template>
        </div>
      </div>
      <div class="todo-item-right-section">
        <input 
          type="checkbox" 
          v-model="todo.tick"
          @change="updateTodo(index)"
          class="form-checkbox"
        >
      </div> 
    </div>
    <button @click="addTodo" class="add-block-btn">
      + Add Todo
    </button>
  </div>
</template>

<script>
import { ref, nextTick, onBeforeUpdate } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'TodoBlock',
  props: {
    block: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const store = useStore();
    const editingIndex = ref(null);
    const editingDateIndex = ref(null);
    const editedTodoName = ref('');
    const editedDate = ref('');
    const todos = ref(props.block.content || []);
    const todoEditInputs = ref([]);
    const dateEditInputs = ref([]);
    const isFocused = ref(false);

    // Clear the refs before update
    onBeforeUpdate(() => {
      todoEditInputs.value = [];
      dateEditInputs.value = [];
    });

    // New date handlers
    const handleDateClick = async (index) => {
      if (isFocused.value) return;
      editingDateIndex.value = index;
      editedDate.value = new Date(todos.value[index].due).toISOString().split('T')[0];
      await nextTick();
      dateEditInputs.value[index]?.focus();
    };

    const handleDateFocus = async (index) => {
      store.dispatch('user/setIsBlockEdit', false);
      isFocused.value = true;
      await nextTick();
      dateEditInputs.value[index]?.select();
    };

    const handleDateBlur = async (index) => {
      await saveDateChanges(index);
      isFocused.value = false;
    };

    const saveDateChanges = (index) => {
      if (editedDate.value) {
        const updatedTodos = [...todos.value];
        updatedTodos[index] = {
          ...updatedTodos[index],
          due: new Date(editedDate.value).toISOString()
        };
        updateBlockContent(updatedTodos);
      }
      editingDateIndex.value = null;
    };

    const handleClick = async (index) => {
      if (isFocused.value) return;
      editingIndex.value = index;
      editedTodoName.value = todos.value[index].name;
      await nextTick();
      todoEditInputs.value[index]?.focus();
    };

    const handleFocus = async (index) => {
      store.dispatch('user/setIsBlockEdit', false);
      isFocused.value = true;
      await nextTick();
      todoEditInputs.value[index]?.select();
    };

    const handleBlur = async (index) => {
      await saveTodoChanges(index);
      isFocused.value = false;
    };

    const saveTodoChanges = (index) => {
      if (editedTodoName.value) {
        const updatedTodos = [...todos.value];
        updatedTodos[index] = {
          ...updatedTodos[index],
          name: editedTodoName.value
        };
        updateBlockContent(updatedTodos);
      }
      editingIndex.value = null;
    };

    const updateTodo = () => {
      const updatedTodos = [...todos.value];
      updateBlockContent(updatedTodos);
    };

    const addTodo = () => {
      const newTodo = {
        name: 'New todo item',
        tick: false,
        createdAt: new Date().toISOString(),
        due: new Date(Date.now() + 86400000).toISOString()
      };
      const updatedTodos = [...todos.value, newTodo];
      updateBlockContent(updatedTodos);
    };

    const updateBlockContent = (updatedTodos) => {
      store.dispatch('mindspace/updateBlock', {
        id: props.block.id,
        content: updatedTodos
      });
      todos.value = updatedTodos;
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString();
    };

    return {
      todos,
      editingIndex,
      editingDateIndex,
      editedTodoName,
      editedDate,
      handleClick,
      handleDateClick,
      handleDateFocus,
      handleDateBlur,
      saveTodoChanges,
      updateTodo,
      addTodo,
      formatDate,
      todoEditInputs,
      dateEditInputs,
      isFocused,
      handleFocus,
      handleBlur
    };
  }
};
</script>