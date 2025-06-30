<template>
<div class="dashboard">
    <main>

      <section class="overview-block">
        <!--
        <div class="image-placeholder"></div>-->
        <h2>{{themeName}}</h2>
        <div class="sat-icon-container">
          <h4 class="sat-title">今日も実感してる？</h4>
          <button class="sat-button"
            @click="triggerSatisfaction"
          >
            {{ result() }}
          </button>
        </div>
      </section>

      <!-- MindSlot Section -->
      <MindSlotView/>

      <!-- Analysis Section -->
      <SatisfactionDataView/>

      <!-- Widget Section -->
      <WidgetA
        v-if="hasWidgetA"
      />
      <WidgetB
        v-if="hasWidgetB"
        storeModule="analysisRecords"
        tabKey="bodyEmotionMindSpirit"
        tabType="tab_B"
        dataGetterName="getDataB"
        dataStatePath="analysisData.data_B"
        adviceStatePath="analysisData.advice_B"
        loadingGetterName="isLoading"
        loadDataAction="loadData"
        widgetConfig="data_B"
      />
      <WidgetC
        v-if="hasWidgetC"
        storeModule="analysisRecords"
        tabKey="activityEnvironmentExpression"
        tabType="tab_C"
        dataGetterName="getDataC"
        dataStatePath="analysisData.data_C"
        adviceStatePath="analysisData.advice_C"
        loadingGetterName="isLoading"
        loadDataAction="loadData"
        widgetConfig="data_C"
      />
      <Widget_TextA
        v-if="hasWidget_TextA"
      />
      <Widget_TextB 
        v-if="hasWidget_TextB"
        storeModule="analysisRecords"
        dataStatePath="analysisData.text_B"
        :widgetConfig="text_B"
      />

      <section class="stats-section">
        <div class="stat-item">
          <span class="stat-label">Solfieレベル</span>
          <span class="stat-value">{{ stats.solfieLevel }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">クエスト達成</span>
          <span class="stat-value">{{ completedCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">平均スコア</span>
          <span class="stat-value">{{ stats.averageScore }}</span>
        </div>
      </section>

      <section class="todo-section">
        <h2>今月の選択</h2>
        <div v-if="isTodosLoading" class="todos-loading">
          <div class="todo-loading-card" v-for="i in 3" :key="i">
            <div class="todo-loading-image"></div>
            <div class="todo-loading-content">
              <div class="todo-loading-title"></div>
              <div class="todo-loading-date"></div>
            </div>
          </div>
        </div>
        <div v-else class="todo-list">
          <div v-for="(todo, index) in todos" :key="index" class="todo-card">
            <div class="todo-image">
              <div class="placeholder-image"></div>
            </div>
            <div class="todo-content">
              <h3>{{ todo?.title }}</h3>
              <p>期限：{{ todo.date }}</p>
            </div>
            <div class="todo-actions">
              <button class="action-btn tick-btn" @click="completeTodo(index)">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <circle cx="12" cy="12" r="11" fill="none" stroke="#888" stroke-width="1"/>
                  <path d="M6 12l4 4 8-8" fill="none" stroke="#888" stroke-width="1"/>
                </svg>
              </button>
              <button class="action-btn cross-btn" @click="deleteTodo(index)">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <circle cx="12" cy="12" r="11" fill="none" stroke="#888" stroke-width="1"/>
                  <path d="M8 8l8 8M16 8l-8 8" fill="none" stroke="#888" stroke-width="1"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="todo-card add-todo" @click="showAddTodoModal">
            <div class="add-icon">+</div>
          </div>
        </div>
      </section>

      <!-- Add Todo Modal -->
      <div v-if="showModal" class="modal-overlay-todo">
        <div class="modal-content-todo">
          <h2>今月は何を選択する？</h2>
          <div class="modal-content-todo">
            <input v-model="newTodo.title" placeholder="選択を入力" />
            <input v-model="newTodo.date" type="date" :min="today" />
            <textarea v-model="newTodo.description" placeholder="説明を入力"></textarea>
            <div class="file-upload">
              <label for="file-upload" class="custom-file-upload">
                Upload Image
              </label>
              <input id="file-upload" type="file" @change="handleFileUpload" />
            </div>
            <div class="modal-actions">
              <button @click="addTodo">Add</button>
              <button @click="closeModal">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>


<script>
// Dashboard.vue
  import { defineComponent, ref, computed, onMounted } from 'vue';
  import { useStore } from 'vuex';
  import SatisfactionDataView from './satisfactionDataView.vue';
  import MindSlotView from './mindSlot.vue'
  import WidgetA from './Widget/widgetA.vue';
  import WidgetB from './Widget/widgetB.vue';
  import WidgetC from './Widget/widgetC.vue';
  import Widget_TextA from './Widget/widget_TextA.vue';
  import Widget_TextB from './Widget/widget_TextB.vue';

  export default defineComponent({
    name: 'DashboardView',
    components:{
      SatisfactionDataView,
      MindSlotView,
      WidgetA,
      WidgetB,
      WidgetC,
      Widget_TextA,
      Widget_TextB,
    },
    setup() {
      const store = useStore();
      const user = computed(() => store.state.user.user || {});
      const stats = computed(() => store.state.user.stats || {});
      const themeName = computed(() => store.state.mindspace.currentThemeName);
      const satisfactionValue = computed(() => store.state.themeSpace.satisfaction.currentSelfSatisfaction);
      
      //Activated Widget Check
      const currentThemeId = computed(() => store.state.mindspace.currentThemeId || "");
      const allUsersWidgets = computed(() => store.state.user.userWidgets || {});

      // Helper function to check if a widget exists in current theme
      const hasWidget = (widgetId) => {
          const themeId = currentThemeId.value;
          const themeWidgets = allUsersWidgets.value[themeId] || [];
          return themeWidgets.includes(widgetId);
      };

      // Use the helper function
      const hasWidgetA = computed(() => hasWidget('CC4ZpLD5Sz2DmwrTG84l'));
      const hasWidgetB = computed(() => hasWidget('GORz1h6ts9Vq2PKMD6un'));
      const hasWidgetC = computed(() => hasWidget('n33Khwkw7gKSmo8ZNxhk'));
      const hasWidgetD = computed(() => hasWidget('rezpOM7Kk7R780BzhqvW'));
      const hasWidget_TextA = computed(() => hasWidget('s4MoRxueN0CznLEXU6ei'));
      const hasWidget_TextB = computed(() => hasWidget('rQ5VgqQIuxsYlmC3Y0PP'));

      const result = () => {
        const satisfaction = ["😱", "😣", "😕", "😃", "😍"];
        if (satisfactionValue.value < 0 || satisfactionValue.value > 5) {
          return 'Invalid score';
        } else if (satisfactionValue.value >= 5) {
          return satisfaction[4];
        } else {
          return satisfaction[Math.floor(satisfactionValue.value)];
        }
      }

      const triggerSatisfaction = () => {
        store.dispatch('user/triggerSatWindow', true)
      };

      //=====[SYSTEM01 : TODOS]=====
      const todos = computed(() => store.state.todos.todos);
      const completedCount = computed(() => store.getters['todos/getCurrentCompleted']);
      const isTodosLoading = computed(() => store.getters['todos/isLoading']);

      const showModal = ref(false);
      const newTodo = ref({ title: '', date: '', description: '', image: null });

      const today = computed(() => {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      });

      const showAddTodoModal = () => {
        showModal.value = true;
        newTodo.value = { title: '', date: today.value, description: '', image: null };
      };

      const closeModal = () => {
        showModal.value = false;
      };

      // Corrected actions
      const addTodo = () => {
        if (newTodo.value.title && newTodo.value.date) {
          store.dispatch('todos/addTodo', {
            title: newTodo.value.title,
            date: newTodo.value.date.replace(/-/g, '/'),
            image: newTodo.value.image,
          });
          closeModal();
        }
      };

      const completeTodo = (index) => {
        store.dispatch('todos/completeTodo', index);
      };

      const deleteTodo = (index) => {
        store.dispatch('todos/deleteTodo', index);
      };


      const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            newTodo.value.image = e.target.result;
          };
          reader.readAsDataURL(file);
        }
      };

      onMounted(async () => {
        await store.dispatch('chat/addRandomMessages');
        await store.dispatch('scores/loadScoresData');
        await store.dispatch('todos/loadTodosData');
        await store.dispatch('user/getUserWidgets');
      });

      //console.log('Entire store state:', store.state);
      //console.log('Current User:', store.state.user.user.name);
      //console.log('Store state:', store.state);


      return {
        //USER DATA FUNCTION
        user,
        stats,
        themeName,
        result,
        triggerSatisfaction,

        //TODO FUNCTION
        todos,
        showModal,
        newTodo,
        today,
        completedCount,
        showAddTodoModal,
        closeModal,
        addTodo,
        completeTodo,
        deleteTodo,
        handleFileUpload,
        isTodosLoading,

        //Widgets
        hasWidgetA,
        hasWidgetB,
        hasWidgetC,
        hasWidgetD,
        hasWidget_TextA,
        hasWidget_TextB

      };
    },
  });
</script>


