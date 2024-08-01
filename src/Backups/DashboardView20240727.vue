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
          <p class="score-update">更新：{{ currentScoreData.date }}</p>

          <div v-for="(value, key) in currentScoreData.items" :key="key" class="score-item">
            <span class="score-label">{{ key }}</span>
            <div class="score-bar">
              <div class="ability-fill" :style="{ width: `${animatedScores[selectedScoreTab][key] * 20}%` }"></div>
            </div>
            <span class="ability-value">{{ animatedScores[selectedScoreTab][key].toFixed(1) }}</span>
          </div>       
        </section>
      </section>

      

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

  <nav class="sticky-nav" :class="{ expanded: isChatBoxExpanded }">
      <div class="nav-icons" v-if="!isChatBoxExpanded">
        <a href="#" class="nav-icon">
          <img src="../assets/icons/journalIcon.svg" alt="Journal" />
          <span class="icon-label">Solfie Journal</span>
        </a>
        <a href="#" class="nav-icon">
          <img src="../assets/icons/eventIcon.svg" alt="Event" />
          <span class="icon-label">Solfie Events</span>
        </a>
        <a href="#" class="nav-icon">
          <img src="../assets/icons/squareIcon.svg" alt="Square" />
          <span class="icon-label">Solfie Square</span>
        </a>
        <a href="#" class="nav-icon">
          <img src="../assets/icons/statusIcon.svg" alt="Status" />
          <span class="icon-label">Status</span>
        </a>
      </div>
      <button class="chatbox-button" @click="toggleChatBox" v-if="!isChatBoxExpanded">
        <span class="chat-text">Chat with Solfie AI</span>
        <div class="icon-group">
          <span class="clip-icon">📎</span>
          <span class="paper-plane-icon">✈️</span>
        </div>
      </button>
      <div class="expanded-chat-box" v-if="isChatBoxExpanded">
        <div class="header">
          <div class="header-content">
            <span class="solfie-ai-label">Solfie AI</span>
            <button class="close-icon" @click="toggleChatBox">×</button>
          </div>
        </div>
        <div class="chat-messages">
          <div v-for="(message, index) in chatMessages" :key="index" 
              class="message-container" 
              :class="{ 'user-message': message.sender === 'user', 'ai-message': message.sender === 'ai' }">
              <div class="sender-name">{{ message.sender === 'user' ? 'You' : 'Solfie AI' }}</div>
            <div class="chat-bubble">
              <p v-for="(line, lineIndex) in message.text.split('\n')" :key="lineIndex">
                {{ line }}
              </p>
            </div>
            <div class="timestamp">{{ formatDate(message.timestamp) }}</div>
          </div>
        </div>
        <div class="chat-messages-example">
          <div 
            v-for="(messageExample, index) in chatMessagesExample" 
            :key="index" 
            class="messageExample"
            @click="copyToTextarea(messageExample)"
          >
            {{ messageExample }}
          </div>
        </div>
        <div class="chat-input-field">
          <textarea v-model="chatInput" placeholder="Type a message..."></textarea>
          <div class="chat-actions">
            <button class="file-upload-button">
              <span class="clip-icon">📎</span>
            </button>
            <button class="send-button" @click="sendMessage">✈️</button>
          </div>
        </div>
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

      const toggleChatBox = () => {
        isChatBoxExpanded.value = !isChatBoxExpanded.value;
      };

      const isChatBoxExpanded = ref(false);
      
      const chatInput = ref('');

      
      const chatMessagesExample = ref([
        'ソルフィ！解析結果を解説して！',
        '選択を手伝って！',
        '今月は何を意識したらいいかな？'
      ]);

      const copyToTextarea = (message) => {
        chatInput.value = message;
      };
   
      const chatMessages = ref([
        { text: "Hello! How can I help you today?", sender: "ai", timestamp: "2024/03/01 20:44" },
        { text: "I have a question about the weather.", sender: "user", timestamp: "2024/03/01 20:45" },
        { text: "Certainly! What would you like to know about the weather?", sender: "ai", timestamp: "2024/03/01 20:50" },
        // ... more messages
      ]);

      const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('ja-JP', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit'
        });
      };
      
      const sendMessage = () => {
        if (chatInput.value.trim()) {
          // Replace line breaks with <br> tags
          const formattedMessage = chatInput.value.replace(/\n/g, '\n');
          
          chatMessages.value.push({
            text: formattedMessage,
            sender: 'user',
            timestamp: new Date().toISOString() // Add current timestamp
          });

          chatInput.value = '';
          // Here you would typically call a function to get the AI's response
          // and then add it to the chatMessages array
        }
      };

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
        //USER DATA FUNCTION
        user,
        stats,
        //SCORE DISPLAY FUNCTION
        selectedScoreTab,
        scoresData,
        currentScoreData,
        selectScoreTab,
        animatedScores,
        //ABILITY DISPLAY FUNCTION
        selectedAbilityTab,
        abilitiesData,
        currentAbilities,
        selectAbilityTab,
        animatedAbilities,
        
        selectedImage,
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
        //CHAT FUNCTION
        isChatBoxExpanded,
        chatInput,
        chatMessagesExample,
        copyToTextarea,
        chatMessages,
        formatDate,
        toggleChatBox,
        sendMessage,
      };
    },
  });
</script>

<style lang="scss">
  @import '../assets/dashboardStyle.scss';
  @import '../assets/todosStyle.scss';
</style>