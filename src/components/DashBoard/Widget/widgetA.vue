<!--widgetA.vue : DecisionPower-->
<template>
  <section class="chart-section">
    <div class="data-tab-menu" v-if="Object.keys(chartData).length || hasAdviceData">
      <button
        v-for="tab in availableTabs"
        :key="tab"
        @click="selectedDataTab = tab"
        :class="{ active: selectedDataTab === tab }"
        :disabled="isDataLoading"
      >
        {{ tab }}
      </button>
    </div>
    <section v-if="isDataLoading" class="chart-section-loading">
      <!-- Loading placeholder -->
    </section>
    
    <!-- Regular chart view -->
    <section v-if="!isDataLoading && selectedDataTab !== 'アドバイス' && currentDataValues.items && Object.keys(currentDataValues.items).length > 0" class="chart-content-section">
      <h4 v-if="widgetData">{{ widgetData.name }}</h4>
      <div class="chart-circle">
        <svg width="0" height="0">
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#ff500b;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#E190CB;stop-opacity:1" />
            </linearGradient>
          </defs>
        </svg>
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#eee" stroke-width="10" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="url(#chartGradient)" stroke-width="10"
                  stroke-dasharray="282.7" :stroke-dashoffset="282.7 - (282.7 * (animatedValues[selectedDataTab]?.percentage || 0) / 100)"
                  stroke-linecap="round" class="chart-fill-circle" />
        </svg>
        <span class="chart-percentage">{{ Math.round(animatedValues[selectedDataTab]?.percentage || 0) }}%</span>
      </div>

      <div v-for="(value, key) in currentDataValues.items" :key="key" class="chart-item">
        <span class="chart-label">{{ key }}</span>
        <div class="chart-bar">
          <div class="chart-fill" :style="{ width: `${animatedValues[selectedDataTab]?.items[key] || 0}%` }"></div>
        </div>
        <span class="chart-value">{{ Math.round(animatedValues[selectedDataTab]?.items[key] || 0) }}%</span>
      </div>
    </section>

    <!-- No data message -->
    <section v-if="!isDataLoading && selectedDataTab !== 'アドバイス' && (!currentDataValues.items || Object.keys(currentDataValues.items).length === 0)" class="chart-content-section no-data-section">
      <h4 v-if="widgetData">{{ widgetData.name }}</h4>
      <h4 v-else>Loading...</h4>
      <div class="no-data-message">
        There is no available data yet.
      </div>
    </section>

    <!-- Advice view -->
    <section v-if="!isDataLoading && selectedDataTab === 'アドバイス'" class="chart-content-section advice-section">
      <h4 v-if="widgetData">{{ widgetData.name }} - アドバイス</h4>
      <h4 v-else>アドバイス</h4>
      
      <div v-if="adviceData && adviceData.length > 0" class="advice-content">
        <div 
          v-for="(advice, index) in adviceData" 
          :key="index" 
          class="advice-item flip-advice-card"
          @click="toggleFlip(index)"
          @keydown.enter="toggleFlip(index)"
          @keydown.space.prevent="toggleFlip(index)"
          tabindex="0"
          role="button"
          :aria-label="`アドバイス ${index + 1}: クリックして詳細を表示`"
        >
          <div class="flip-advice-card-inner" :class="{ 'flipped': flippedCards[index] }">
            <!-- Front side -->
            <div class="flip-advice-card-front">
              <h5 class="advice-title">{{ advice.title }}</h5>
              <p class="advice-text">{{ advice.content }}</p>
              <div class="flip-advice-indicator">
                <span class="flip-advice-text">タップして詳細を見る</span>
                <svg class="flip-advice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M7 17L17 7M17 7H7M17 7V17"/>
                </svg>
              </div>
            </div>
            
            <!-- Back side -->
            <div class="flip-advice-card-back">
              <h5 class="advice-title">{{ advice.title }}</h5>
              <p class="advice-description">{{ advice.description }}</p>
              <div class="flip-advice-indicator">
                <span class="flip-advice-text">タップして戻る</span>
                <svg class="flip-advice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 7L7 17M7 17H17M7 17V7"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="no-advice">
        アドバイスデータがありません
      </div>
    </section>
  </section>
</template>

<script>

import { defineComponent, ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { widgetService } from '@/firebase/firebaseWidget'
import { WIDGET_CONFIG } from '@/config/widgetConfig'

export default defineComponent({
  name: 'ChartComponent',
  props: {
    // Store module name to fetch data from
    storeModule: {
      type: String,
      default: 'analysisRecords'
    },
    // Tab key in the store
    tabKey: {
      type: String,
      default: 'decisionMakingPower'
    },
    tabType: {
      type: String,
      default: 'tab_A'
    },
    // Getter name for data
    dataGetterName: {
      type: String,
      default: 'getDataA'
    },
    // State path to chart data
    dataStatePath: {
      type: String,
      default: 'analysisData.data_A'
    },
    // State path to advice data
    adviceStatePath: {
      type: String,
      default: 'analysisData.advice_A'
    },
    // State path to loading status
    loadingGetterName: {
      type: String,
      default: 'isLoading'
    },
    // Action name to load data
    loadDataAction: {
      type: String,
      default: 'loadData'
    },
    // Widget ID
    widgetConfig:{
      type: String,
      default: 'data_A'
    }
  },
  setup(props) {
    const store = useStore();
    const id = WIDGET_CONFIG[props.widgetConfig];
    const uid = store.state.user.user.uid;
    const currentThemeId = store.state.mindspace.currentThemeId;

    // Linear interpolation function for smooth animations
    const lerp = (start, end, t) => start * (1 - t) + end * t;

    // State for flip cards
    const flippedCards = ref({});

    // Function to toggle flip state
    const toggleFlip = (index) => {
      flippedCards.value = {
        ...flippedCards.value,
        [index]: !flippedCards.value[index]
      };
    };

    // Computed properties for data from Vuex store
    const selectedDataTab = computed({
      get: () => store.state[props.storeModule].selectedTab[props.tabType],
      set: (tab) => store.dispatch(`${props.storeModule}/selectTab`, { tab, key: props.tabKey })
    });

    const currentDataValues = computed(() => store.getters[`${props.storeModule}/${props.dataGetterName}`] || { percentage: 0, items: {} });
    
    // Get chart data from the store using the provided path
    const chartData = computed(() => {
      const pathParts = props.dataStatePath.split('.');
      let data = store.state[props.storeModule];
      
      for (const part of pathParts) {
        if (data && data[part]) {
          data = data[part];
        } else {
          return {};
        }
      }
      
      return data;
    });

    // Get advice data from the store
    const adviceData = computed(() => {
      const pathParts = props.adviceStatePath.split('.');
      let data = store.state[props.storeModule];
      
      for (const part of pathParts) {
        if (data && data[part]) {
          data = data[part];
        } else {
          return [];
        }
      }
      
      return Array.isArray(data) ? data : [];
    });

    // Check if advice data exists
    const hasAdviceData = computed(() => adviceData.value && adviceData.value.length > 0);

    // Available tabs including advice tab
    const availableTabs = computed(() => {
      const tabs = Object.keys(chartData.value);
      if (hasAdviceData.value) {
        tabs.push('アドバイス');
      }
      return tabs;
    });
    
    const isDataLoading = computed(() => store.getters[`${props.storeModule}/${props.loadingGetterName}`]);

    // Animated values state with initial values
    const animatedValues = ref({});

    // Initialize animated values with correct structure based on actual data
    const initializeAnimatedValues = () => {
      Object.keys(chartData.value).forEach(tab => {
        if (chartData.value[tab] && chartData.value[tab].items) {
          animatedValues.value[tab] = {
            percentage: 0,
            items: Object.fromEntries(
              Object.keys(chartData.value[tab].items).map(key => [key, 0])
            )
          };
        }
      });
    };

    // Watch for changes in selected tab or loading state to animate transitions
    watch([selectedDataTab, isDataLoading], ([newTab, isLoading]) => {
      if (!isLoading && newTab !== 'アドバイス' && chartData.value[newTab]?.items) {
        const targetValues = chartData.value[newTab];
        const duration = 500;
        const start = performance.now();

        const animate = (time) => {
          const elapsed = time - start;
          const progress = Math.min(elapsed / duration, 1);

          // Create the tab if it doesn't exist yet
          if (!animatedValues.value[newTab]) {
            animatedValues.value[newTab] = {
              percentage: 0,
              items: {}
            };
            
            // Initialize all items to 0
            for (const key in targetValues.items) {
              animatedValues.value[newTab].items[key] = 0;
            }
          }

          animatedValues.value[newTab] = {
            percentage: lerp(animatedValues.value[newTab].percentage, targetValues.percentage, progress),
            items: Object.fromEntries(
              Object.entries(targetValues.items).map(([key, value]) => [
                key,
                lerp(animatedValues.value[newTab].items[key] || 0, value, progress)
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

    // Reset flip states when switching to advice tab
    watch(selectedDataTab, (newTab) => {
      if (newTab === 'アドバイス') {
        flippedCards.value = {};
      }
    });

    //Get Widget Data for widget Name
    const widgetData = ref(null);
    async function getWidget(widgetId) {
      try {
        // Make sure to await the Promise
        const data = await widgetService.getWidgetById(widgetId);
        
        return {
          name: data.name, 
          description: data.description, 
          entries: data.entries
        };
      } catch (error) {
        console.error("Error getting widget name:", error);
        return null;
      }
    }

    // Initialize data when component is mounted
    onMounted(async () => {
      // Load data from Vuex store
      await store.dispatch(`${props.storeModule}/${props.loadDataAction}`, { uid:uid, themeId:currentThemeId});
      
      // Initialize animated values with the correct structure
      initializeAnimatedValues();

      // Get widget data
      widgetData.value = await getWidget(id);
    });

    return {
      widgetData,
      selectedDataTab,
      currentDataValues,
      chartData,
      adviceData,
      hasAdviceData,
      availableTabs,
      isDataLoading,
      animatedValues,
      flippedCards,
      toggleFlip,
    };
  }
});
</script>