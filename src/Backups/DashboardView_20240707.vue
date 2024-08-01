<template>
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
          <h3>最終更新：{{ currentScoreData.date }}</h3>

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
          <span class="stat-value">{{ stats.questCleared }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">平均スコア</span>
          <span class="stat-value">{{ stats.averageScore }}</span>
        </div>
      </section>

      <section class="todo-section">
        <div class="image-placeholder"></div>
        <div class="image-info">
          <span>{{ selectedImage.title }}</span>
          <span>期限：{{ selectedImage.date }}</span>
        </div>
        <div class="action-buttons">
          <button class="cancel"></button>
          <button class="confirm"></button>
        </div>
      </section>
    </main>
  </div>
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

      const stats = ref({
        solfieLevel: 100,
        questCleared: 34,
        averageScore: 4.5,
      });

      const selectedImage = ref({
        title: 'Title',
        date: '2024/01/01',
      });

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
        
      };
    },
  });
</script>

<style lang="scss">
  @import '../assets/dashboardStyle.scss';
</style>