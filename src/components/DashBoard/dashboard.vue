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

      <SatisfactionDataView/>

      <section class="decision-section">
        <div class="ability-tab-menu" v-if="Object.keys(abilitiesData).length">
          <button
            v-for="tab in Object.keys(abilitiesData)"
            :key="tab"
            @click="selectedAbilityTab = tab"
            :class="{ active: selectedAbilityTab === tab }"
            :disabled="isAbilitiesLoading"
          >
            {{ tab }}
          </button>
        </div>
        <section v-if="isAbilitiesLoading" class="abilities-section-loading">
          <!-- <div class="abilities-loading-text">Loading...</div> -->
        </section>
        <section v-if="!isAbilitiesLoading && currentAbilities.items" class="abilities-section">
          <div class="ability-chart">
            <svg width="0" height="0">
              <defs>
                <linearGradient id="abilityChartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style="stop-color:#ff500b;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#E190CB;stop-opacity:1" />
                </linearGradient>
              </defs>
            </svg>
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#eee" stroke-width="10" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="url(#abilityChartGradient)" stroke-width="10"
                      stroke-dasharray="282.7" :stroke-dashoffset="282.7 - (282.7 * (animatedAbilities[selectedAbilityTab]?.percentage || 0) / 100)"
                      stroke-linecap="round" class="ability-fill-circle" />
            </svg>
            <span class="ability-percentage">{{ Math.round(animatedAbilities[selectedAbilityTab]?.percentage || 0) }}%</span>
          </div>

          <div v-for="(value, key) in currentAbilities.items" :key="key" class="ability-item">
            <span class="ability-label">{{ key }}</span>
            <div class="ability-bar">
              <div class="ability-fill" :style="{ width: `${animatedAbilities[selectedAbilityTab]?.items[key] || 0}%` }"></div>
            </div>
            <span class="ability-value">{{ Math.round(animatedAbilities[selectedAbilityTab]?.items[key] || 0) }}%</span>
          </div>
        </section>
        <div v-else class="no-data">No ability data available.</div>
      </section>

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
      <div v-if="showModal" class="modal">
        <div class="modal-content">
          <h2>今月は何を選択する？</h2>
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

    </main>
  </div>
</template>


<script>
// Dashboard.vue
  import { defineComponent, ref, computed, watch, onMounted } from 'vue';
  import { useStore } from 'vuex';
  import SatisfactionDataView from './satisfactionDataView.vue';
  export default defineComponent({
    name: 'DashboardView',
    components:{
      SatisfactionDataView
    },
    setup() {
      const store = useStore();
      const user = computed(() => store.state.user.user || {});
      const stats = computed(() => store.state.user.stats || {});
      const themeName = computed(() => store.state.mindspace.currentThemeName);
      const satisfactionValue = computed(() => store.state.themeSpace.satisfaction.currentSelfSatisfaction);

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


      //=====[SYSTEM01 : TAB FOR POTENTIAL GRAPH]=====

      

      //=====[SYSTEM02 : TAB FOR DECISION GRAPH]=====
      const lerp = (start, end, t) => start * (1 - t) + end * t;

      const selectedAbilityTab = computed({
        get: () => store.state.abilities.selectedAbilityTab,
        set: (value) => store.dispatch('abilities/selectAbilityTab', value)
      });

      const currentAbilities = computed(() => store.getters['abilities/currentAbilities'] || { percentage: 0, items: {} });
      const abilitiesData = computed(() => store.state.abilities.abilitiesData);
      const isAbilitiesLoading = computed(() => store.getters['abilities/isLoading']);

      const animatedAbilities = ref({
        '姿': {
          percentage: 0,
          items: {
            '意識': 0,
            '同期': 0,
            '選択': 0
          }
        },
        '環境': {
          percentage: 0,
          items: {
            '意識': 0,
            '同期': 0,
            '選択': 0
          }
        },
        '活動': {
          percentage: 0,
          items: {
            '意識': 0,
            '同期': 0,
            '選択': 0
          }
        }
       });

      const initializeAnimatedAbilities = () => {
        Object.keys(abilitiesData.value).forEach(tab => {
          if (abilitiesData.value[tab] && abilitiesData.value[tab].items) {
            animatedAbilities.value[tab] = {
              percentage: 0,
              items: Object.fromEntries(
                Object.keys(abilitiesData.value[tab].items).map(key => [key, 0])
              )
            };
          }
        });
      };

      watch([selectedAbilityTab, isAbilitiesLoading], ([newTab, isLoading]) => {
        if (!isLoading && abilitiesData.value[newTab]?.items) {
          const targetAbilities = abilitiesData.value[newTab];
          const duration = 500;
          const start = performance.now();

          const animate = (time) => {
            const elapsed = time - start;
            const progress = Math.min(elapsed / duration, 1);

            animatedAbilities.value[newTab] = {
              percentage: lerp(animatedAbilities.value[newTab].percentage, targetAbilities.percentage, progress),
              items: Object.fromEntries(
                Object.entries(targetAbilities.items).map(([key, value]) => [
                  key,
                  lerp(animatedAbilities.value[newTab].items[key], value, progress)
                ])
              )
            };

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      }, { immediate: true });

      //=====[SYSTEM03 : TODOS]=====
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
        await store.dispatch('abilities/loadAbilitiesData');
        await store.dispatch('todos/loadTodosData');
        initializeAnimatedAbilities();
      });

      console.log('Entire store state:', store.state);
      console.log('Current User:', store.state.user.user.name);
      console.log('Store state:', store.state);
      console.log('Selected ability tab:', selectedAbilityTab.value);
      console.log('Current abilities:', currentAbilities.value);


      return {
        //USER DATA FUNCTION
        user,
        stats,
        themeName,
        result,
        triggerSatisfaction,

        //ABILITY DISPLAY FUNCTION
        selectedAbilityTab,
        currentAbilities,
        abilitiesData,
        isAbilitiesLoading,
        animatedAbilities,

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

      };
    },
  });
</script>


