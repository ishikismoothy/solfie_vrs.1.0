// todoBlock.vue
<template>
  <div class="todo-block">
    <div v-for="(todo, index) in todos" :key="index" class="todo-item">
      <div class="flex items-center gap-4">
        <input 
          type="checkbox" 
          v-model="todo.tick"
          @change="updateTodo(index)"
          class="form-checkbox"
        >
        <div class="flex-grow" @click="handleClick(index)">
          <template v-if="editingIndex !== index">
            <span :class="{ 'line-through text-gray-500': todo.tick }">
              {{ todo.name }}
            </span>
          </template>
          <template v-else>
            <input
            v-model="editedTodoName"
            class="edit-input w-full"
            @blur="saveTodoChanges(index)"
            @keyup.enter="saveTodoChanges(index)"
            :ref="el => { if (el) todoEditInputs[index] = el }"
            >
          </template>
        </div>
        <div class="text-sm text-gray-500">
          Due: {{ formatDate(todo.due) }}
        </div>
      </div>
    </div>
    <button 
      @click="addTodo"
      class="mt-2 text-blue-500 hover:text-blue-700"
    >
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
    const editedTodoName = ref('');
    const todos = ref(props.block.content || []);
    const todoEditInputs = ref([]); // Change to array of refs

    // Clear the refs before update
    onBeforeUpdate(() => {
      todoEditInputs.value = [];
    });

    const handleClick = async (index) => {
      editingIndex.value = index;
      editedTodoName.value = todos.value[index].name;
      await nextTick();
      todoEditInputs.value[index]?.focus();
      todoEditInputs.value[index]?.select();
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
      editedTodoName,
      handleClick,
      saveTodoChanges,
      updateTodo,
      addTodo,
      formatDate,
      todoEditInputs
    };
  }
};
</script>