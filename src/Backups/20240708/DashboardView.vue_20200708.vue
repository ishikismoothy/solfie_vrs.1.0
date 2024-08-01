<template>
  <header>
    <div class="user-info">
      <span class="avatar"></span>
      <span class="user-name">{{ user.name }}</span>
    </div>
    <div class="plan-type">Plan Type : {{ user.planType }}</div>
    <div class="notifications">
      <span class="bell-icon"></span>
      <span class="notification-count">{{ user.notifications }}</span>
    </div>
  </header>

  <div class="dashboard">
    <main>
      <section class="image-section">
        <div class="image-placeholder"></div>
        <h2>The Maestro - 巨匠</h2>
      </section>

      <section class="potential-section">
        <div class="score-tab-menu">
          <button 
            v-for="tab in Object.keys(scoresData)" 
            :key="tab" 
            @click="selectScoreTab(tab)"
            :class="{ active: selectedScoreTab === tab }"
          >
            {{ tab }}
          </button>
        </div>
        <section class="scores-section">
          <h3>更新：{{ currentScoreData.date }}</h3>

          <div v-for="(value, key) in currentScoreData.items" :key="key" class="score-item">
            <span class="score-label">{{ key }}</span>
            <div class="score-bar">
              <div class="ability-fill" :style="{ width: `${animatedScores[selectedScoreTab][key] * 20}%` }"></div>
            </div>
            <span class="ability-value">{{ animatedScores[selectedScoreTab][key].toFixed(1) }}</span>
          </div>       
        </section>
      </section>

      <svg width="0" height="0">
        <defs>
          <linearGradient id="abilityChartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#ff500b;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#E190CB;stop-opacity:1" />
          </linearGradient>
        </defs>
      </svg>

      <section class="decision-section">
        <div class="ability-tab-menu">
            <button 
              v-for="tab in Object.keys(abilitiesData)" 
              :key="tab" 
              @click="selectAbilityTab(tab)"
              :class="{ active: selectedAbilityTab === tab }"
            >
              {{ tab }}
            </button>
        </div>

        <section class="abilities-section">
          
          <div class="ability-chart">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#eee" stroke-width="10" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="url(#abilityChartGradient)" stroke-width="10"
                      stroke-dasharray="282.7" :stroke-dashoffset="282.7 - (282.7 * currentAbilities.percentage / 100)"
                      stroke-linecap="round" class="ability-fill-circle" />
            </svg>
            <span class="ability-percentage">{{ currentAbilities.percentage }}%</span>
          </div>

          <div v-for="(value, key) in currentAbilities.items" :key="key" class="ability-item">
            <span class="ability-label">{{ key }}</span>
            <div class="ability-bar">
              <div class="ability-fill" :style="{ width: `${animatedAbilities[selectedAbilityTab].items[key]}%` }"></div>
            </div>
            <span class="ability-value">{{ Math.round(animatedAbilities[selectedAbilityTab].items[key]) }}%</span>
          </div>
        </section>
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
        <div class="todo-list">
          <div v-for="(todo, index) in todos" :key="index" class="todo-card">
            <div class="todo-image">
              <div class="placeholder-image"></div>
            </div>
            <div class="todo-content">
              <h3>{{ todo.title }}</h3>
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
          <h2>Add New Todo</h2>
          <input v-model="newTodo.title" placeholder="Title" />
          <input v-model="newTodo.date" type="date" :min="today" />
          <textarea v-model="newTodo.description" placeholder="Description"></textarea>
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

  <nav class="sticky-nav">
    <div class="nav-buttons">
      <button class="active">ダッシュボード</button>
      <button>スコア</button>
      <button>ジャーナル</button>
    </div>
    <div class="search-field">
      <input type="text" placeholder="Search...">
    </div>
  </nav>
  
</template>

<script>
// Dashboard.vue
  import { defineComponent, ref, computed, watch} from 'vue';

  export default defineComponent({
    name: 'DashboardView',
    setup() {
      const user = ref({
        name: '寺岡 佑記',
        planType: 'Solfie Careplus',
        notifications: 3,
      });

      const stats = ref({
        solfieLevel: 100,
        questCleared: 34,
        averageScore: 4.5,
      });

      const selectedImage = ref({
        title: 'Title',
        date: '2024/01/01',
      });


      //=====[SYSTEM01 : TAB FOR POTENTIAL GRAPH]=====
      const selectedScoreTab = ref('自己評価');
      const animatedScores = ref({});

      const scoresData = ref({
        '自己評価': {
          date: '2024/01/03',
          items: {
            '開花': 3.9,
            '姿': 4.5,
            '環境': 3.0,
            '活動': 1.5,
          }
        },
        '意識解析': {
          date: '2024/05/03',
          items: {
            '開花': 4.2,
            '姿': 3.7,
            '環境': 3.5,
            '活動': 4.0,
          }
        }
      });

      const currentScoreData = computed(() => scoresData.value[selectedScoreTab.value]);

      const selectScoreTab = (tab) => {
        selectedScoreTab.value = tab;
      };

      // Initialize animatedScores with starting values
      Object.keys(scoresData.value).forEach(tab => {
        animatedScores.value[tab] = Object.fromEntries(
          Object.keys(scoresData.value[tab].items).map(key => [key, 0])
        );
      });

      // Watch for changes in the selected score tab and animate the values
      watch(selectedScoreTab, (newTab) => {
        const targetScores = scoresData.value[newTab].items;
        const duration = 500; // Animation duration in milliseconds
        const start = performance.now();

        const animate = (time) => {
          const elapsed = time - start;
          const progress = Math.min(elapsed / duration, 1);

          animatedScores.value[newTab] = Object.fromEntries(
            Object.entries(targetScores).map(([key, value]) => [
              key,
              lerp(animatedScores.value[newTab][key], value, progress)
            ])
          );

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
      }, { immediate: true });

      const currentAbilities = computed(() => abilitiesData.value[selectedAbilityTab.value]);

      const selectAbilityTab = (tab) => {
        selectedAbilityTab.value = tab;
      };


      //=====[SYSTEM02 : TAB FOR DECISION GRAPH]=====
      const selectedAbilityTab = ref('姿');
      const animatedAbilities = ref({});

      const abilitiesData = ref({
        '姿': {
          percentage: 65,
          items: {
            '意識': 45,
            '同期': 50,
            '選択': 75
          }
        },
        '環境': {
          percentage: 70,
          items: {
            '意識': 60,
            '同期': 80,
            '選択': 70
          }
        },
        '活動': {
          percentage: 55,
          items: {
            '意識': 50,
            '同期': 60,
            '選択': 55
          }
        }
      });
      
      // Initialize animatedAbilities with starting values
      Object.keys(abilitiesData.value).forEach(tab => {
        animatedAbilities.value[tab] = {
          percentage: 0,
          items: Object.fromEntries(
            Object.keys(abilitiesData.value[tab].items).map(key => [key, 0])
          )
        };
      });

      // Watch for changes in the selected tab and animate the values
      watch(selectedAbilityTab, (newTab) => {
        const targetAbilities = abilitiesData.value[newTab];
        const duration = 500; // Animation duration in milliseconds
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
      }, { immediate: true });

      // Linear interpolation function
      const lerp = (start, end, t) => start * (1 - t) + end * t;


      //=====[SYSTEM03 : TODOS]=====
      const todos = ref([
        { title: 'Sample Todo', date: '2024/01/01', image: null },
        // Add more sample todos as needed
      ]);

      const showModal = ref(false);
      const newTodo = ref({ title: '', date: '', description: '', image: null });
      const completedCount = ref(0);

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

      const addTodo = () => {
        if (newTodo.value.title && newTodo.value.date) {
          todos.value.push({
            title: newTodo.value.title,
            date: newTodo.value.date.replace(/-/g, '/'),
            image: newTodo.value.image,
          });
          closeModal();
        }
      };

      const completeTodo = (index) => {
        todos.value.splice(index, 1);
        completedCount.value++;
      };

      const deleteTodo = (index) => {
        todos.value.splice(index, 1);
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

      return {
        user, 

        selectedScoreTab,
        scoresData,
        currentScoreData,
        selectScoreTab,
        animatedScores,
      
        selectedAbilityTab,
        abilitiesData,
        currentAbilities,
        selectAbilityTab,
        animatedAbilities,
        
        stats,
        selectedImage,
        
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
      };
    },
  });
</script>

<style lang="scss">
  @import '../assets/dashboardStyle.scss';
  @import '../assets/todosStyle.scss';
</style>