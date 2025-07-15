// todoBlock.vue
<template>
  <div class="todo-block">
    <div v-for="(todo, index) in todos" :key="index" class="todo-item">
      <div class="todo-item-checkbox">
        <input
          type="checkbox"
          v-model="todo.tick"
          @change="updateTodo(index)"
          class="todo-checkbox"
        >
      </div>
      <div class="todo-item-content">
        <div class="todo-name" @click="handleClick(index)">
          <template v-if="editingIndex !== index">
            <span :class="{ 'completed': todo.tick }">
              {{ todo.name }}
            </span>
          </template>
          <template v-else>
            <input
              v-model="editedTodoName"
              class="edit-input"
              @blur="handleBlur(index)"
              @focus="handleFocus(index)"
              :ref="el => { if (el) todoEditInputs[index] = el }"
            >
          </template>
        </div>
        <div class="todo-date" @click="handleDateClick(index)">
          Due:
          <template v-if="editingDateIndex !== index">
            <span class="date-display">{{ formatDate(todo.due) }}</span>
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
    </div>
    <button @click="addTodo" class="add-todo-btn">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      Add Todo
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

<style lang="scss" scoped>
.todo-block {
  padding: 16px;
  background: white;
  border-radius: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif;

  // Ensure all child elements inherit the font
  *, *::before, *::after {
    font-family: inherit;
  }

  .todo-item {
    display: flex;
    align-items: flex-start;
    padding: 12px 0;
    border-bottom: 1px solid #f3f4f6;
    gap: 12px;

    &:last-child {
      border-bottom: none;
    }

    .todo-item-checkbox {
      display: flex;
      align-items: center;
      margin-top: 2px; // Align with first line of text

      .todo-checkbox {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: #3b82f6;

        &:checked {
          accent-color: #22c55e;
        }
      }
    }

    .todo-item-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;

      .todo-name {
        cursor: pointer;
        font-size: 14px;
        line-height: 1.5;
        color: #374151;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background-color 0.2s ease;

        &:hover {
          background: #f9fafb;
        }

        .completed {
          text-decoration: line-through;
          color: #9ca3af;
        }

        .edit-input {
          width: 100%;
          border: none;
          outline: none;
          background: #f9fafb;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          border: 2px solid #e0e7ff;

          &:focus {
            background: white;
            border-color: #3b82f6;
          }
        }
      }

      .todo-date {
        font-size: 12px;
        color: #6b7280;
        cursor: pointer;
        padding: 2px 8px;
        border-radius: 4px;
        transition: background-color 0.2s ease;

        &:hover {
          background: #f9fafb;
        }

        .date-display {
          font-weight: 500;
        }

        .date-input {
          background: #f9fafb;
          border: 2px solid #e0e7ff;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 12px;
          font-family: inherit;
          outline: none;

          &:focus {
            background: white;
            border-color: #3b82f6;
          }
        }
      }
    }
  }

  .add-todo-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 12px;
    margin-top: 16px;
    background: #f9fafb;
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    color: #6b7280;
    transition: all 0.2s ease;
    justify-content: center;

    &:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
      color: #374151;

      svg {
        color: #374151;
      }
    }

    svg {
      color: #6b7280;
      transition: color 0.2s ease;
    }
  }

  // Empty state
  &:empty::after {
    content: "No todos yet. Click 'Add Todo' to get started.";
    display: block;
    text-align: center;
    color: #9ca3af;
    font-style: italic;
    padding: 32px;
  }
}
</style>
