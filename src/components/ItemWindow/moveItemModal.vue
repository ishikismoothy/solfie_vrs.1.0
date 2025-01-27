<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="modal-overlay" @click="close">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>移動先をお選びください。</h2>
          <button class="close-button" @click="close">×</button>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-container">
          <p>読み込み中...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-container">
          <p>エラーが発生しました: {{ error }}</p>
          <button @click="retryLastAction" class="retry-button">再試行</button>
        </div>

        <!-- Content -->
        <template v-else>
          <!-- Step 1: Theme Space Selection -->
          <div v-if="!selectedTheme" class="selection-container">
            <h3>テーマスペースを選択</h3>
            <ul class="space-list">
              <li v-for="theme in themeSpaces" 
                  :key="theme.id" 
                  @click="selectTheme(theme)"
                  class="space-item">
                {{ theme.name }}
              </li>
            </ul>
          </div>

          <!-- Step 2: Mind Space Selection -->
          <div v-else-if="!selectedMindSpace" class="selection-container">
            <h3>マインドスペースを選択</h3>
            <button class="back-button" @click="selectedTheme = null">戻る</button>
            <ul class="space-list">
              <li v-for="mindspace in mindSpaces" 
                  :key="mindspace.id" 
                  @click="selectMindspace(mindspace)"
                  class="space-item">
                {{ getMindspaceName(mindspace) }}
              </li>
            </ul>
          </div>

          <!-- Step 3: Move Options -->
          <div v-else class="move-options">
            <h3>移動オプション</h3>
            <button class="back-button" @click="selectedMindspace = null">戻る</button>
            <div class="options-container">
              <button @click="handleMoveItem" class="option-button">
                移動
              </button>
              <button @click="handleDuplicateAndMove" class="option-button">
                複製して移動
              </button>
              <button @click="close" class="option-button cancel">
                キャンセル
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Transition>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { mindspaceService } from '@/firebase/firebaseMindSpace';

export default {
  name: 'MoveItemModal',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    itemId: {
      type: String,
      required: true
    },
    currentMindSpaceId: {
    type: String,
    required: true
    }
  },
  
  emits: ['close', 'itemMoved'],

  setup(props, { emit }) {
    const store = useStore();
    const debug = ref(true); // Set to true for debugging
    const userId = computed(() => store.state.user.user.userId);
    const selectedTheme = ref(null);
    const selectedMindSpace = ref(null);
    const themeSpaces = ref([]);
    const mindSpaces = ref([]);
    const isLoading = ref(false);
    const error = ref(null);
    let lastAction = null;

    const fetchThemeSpaces = async () => {
      isLoading.value = true;
      error.value = null;
      try {
        if (!userId.value) {
          throw new Error('User ID not found in store');
        }
        themeSpaces.value = await mindspaceService.fetchThemeSpaces(userId.value);
      } catch (err) {
        error.value = 'テーマスペースの読み込みに失敗しました。';
        console.error(err);
      } finally {
        isLoading.value = false;
      }
    };

    const selectTheme = async (theme) => {
      selectedTheme.value = theme;
      isLoading.value = true;
      error.value = null;
      try {
        mindSpaces.value = await mindspaceService.fetchMindSpaces(theme.id);
      } catch (err) {
        error.value = 'マインドスペースを読み込めませんでした。';
        console.error(err);
      } finally {
        isLoading.value = false;
      }
    };

    const selectMindspace = (mindspace) => {
      selectedMindSpace.value = mindspace;
    };

    const getMindspaceName = (mindspace) => {
      // Implement your logic to get a display name
      return `Mindspace ${mindspace.name.slice(0, 6)}`;
    };

    // Debug watcher
    watch(() => ({
      props: { ...props },
      selectedTheme: selectedTheme.value,
      selectedMindspace: selectedMindSpace.value
    }), (newVal) => {
      console.log('State changed:', newVal);
    }, { deep: true, immediate: true });

    const handleMoveItem = async () => {
      lastAction = 'move';
      isLoading.value = true;
      error.value = null;
      
      // Debug logging
      console.log('Moving item with params:', {
        currentMindSpaceId: props.currentMindSpaceId,
        newMindSpaceId: selectedMindSpace.value?.id,
        itemId: props.itemId,
        state: {
          selectedTheme: selectedTheme.value,
          selectedMindspace: selectedMindSpace.value
        }
      });
      
      try {
        if (!props.currentMindSpaceId) {
          throw new Error('Current mindspace ID is missing');
        }
        if (!selectedMindSpace.value?.id) {
          throw new Error('Selected mindspace ID is missing');
        }
        if (!props.itemId) {
          throw new Error('Item ID is missing');
        }
        
        await mindspaceService.moveItem(
          props.currentMindSpaceId,
          selectedMindSpace.value.id,
          props.itemId
        );
        
        emit('itemMoved');
        close();
      } catch (err) {
        console.error('Error in handleMoveItem:', err);
        error.value = `項目の移動に失敗しました。${err.message}`;
      } finally {
        isLoading.value = false;
      }
    };

    const handleDuplicateAndMove = async () => {
      lastAction = 'duplicate';
      isLoading.value = true;
      error.value = null;
      
      console.log('Duplicating item with params:', {
        newMindspaceId: selectedMindSpace.value?.id,
        itemId: props.itemId
      });
      
      try {
        if (!selectedMindSpace.value?.id) {
          throw new Error('Selected mindspace ID is missing');
        }
        if (!props.itemId) {
          throw new Error('Item ID is missing');
        }

        await mindspaceService.duplicateAndMoveItem(
          selectedMindSpace.value.id,
          props.itemId
        );
        
        emit('itemMoved');
        close();
      } catch (err) {
        console.error('Error in handleDuplicateAndMove:', err);
        error.value = `項目の複製と移動に失敗しました。${err.message}`;
      } finally {
        isLoading.value = false;
      }
    };

    const retryLastAction = () => {
      if (lastAction === 'move') {
        handleMoveItem();
      } else if (lastAction === 'duplicate') {
        handleDuplicateAndMove();
      } else {
        fetchThemeSpaces();
      }
    };

    const close = () => {
      selectedTheme.value = null;
      selectedMindSpace.value = null;
      error.value = null;
      emit('close');
    };

    onMounted(async () => {
      await fetchThemeSpaces();
    });

    return {
      debug,
      selectedTheme,
      selectedMindSpace,
      themeSpaces,
      mindSpaces,
      isLoading,
      error,
      selectTheme,
      selectMindspace,
      getMindspaceName,
      handleMoveItem,
      handleDuplicateAndMove,
      retryLastAction,
      close
    };
  }
}
</script>

<style lang="scss">

.loading-container,
.error-container {
  text-align: center;
  padding: 20px;
}

.retry-button {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.selection-container {
  margin-bottom: 20px;
}

.space-list {
  list-style: none;
  padding: 0;
}

.space-item {
  padding: 10px;
  margin: 5px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.space-item:hover {
  background-color: #f5f5f5;
}

.back-button {
  margin-bottom: 10px;
  padding: 5px 10px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-button {
  padding: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #4CAF50;
  color: white;
}

.option-button.cancel {
  background-color: #f44336;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>