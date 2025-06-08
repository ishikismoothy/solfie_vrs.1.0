<template>
  <section class="chart-section">
    <div class="data-tab-menu" v-if="Object.keys(chartData).length">
      <button
        v-for="tab in Object.keys(chartData)"
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
    <section v-if="!isDataLoading && currentDataValues.items" class="chart-content-section">
      <h4 v-if="widgetData">{{ widgetData.name }}</h4>
      <h4 v-else>Loading...</h4>  
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
    <!--
    <div v-else class="no-data">No data available.</div>-->
  </section>
</template>

<script>
//[WidgetA] 
//ID: CC4ZpLD5Sz2DmwrTG84l

import { defineComponent, ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
//import { widgetService } from '@/firebase/firebaseWidget'

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
    // State path to loading status
    loadingGetterName: {
      type: String,
      default: 'isLoading'
    },
    // Action name to load data
    loadDataAction: {
      type: String,
      default: 'loadData'
    }
  },
  setup(props) {
    const store = useStore();
    //const id = 'CC4ZpLD5Sz2DmwrTG84l';
    const uid = store.state.user.user.uid;

    //Get Widget Data
    const widgetData = ref(null);

    // Linear interpolation function for smooth animations
    const lerp = (start, end, t) => start * (1 - t) + end * t;

    // Computed properties for data from Vuex store
    const selectedDataTab = computed({
      get: () => store.state[props.storeModule].selectedTab.tab_A,
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
      if (!isLoading && chartData.value[newTab]?.items) {
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

    /*
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
    }*/


    // Initialize data when component is mounted
    onMounted(async () => {
      // Load data from Vuex store
      await store.dispatch(`${props.storeModule}/${props.loadDataAction}`,uid);
      
      // Initialize animated values with the correct structure
      initializeAnimatedValues();

      // Get widget data
      //widgetData.value = await getWidget(id);
      //console.log(widgetData?.value);
    });

    return {
      widgetData,
      // Return all required properties and methods
      selectedDataTab,
      currentDataValues,
      chartData,
      isDataLoading,
      animatedValues,
      
    };
  }
});
</script>