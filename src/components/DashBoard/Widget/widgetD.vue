<!--widgetD.vue : Bi-directional Widget (-100 to +100)-->
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
    
    <!-- Regular chart view - hidden when there's no data -->
    <section v-if="!isDataLoading && selectedDataTab !== 'アドバイス' && currentDataValues.items && Object.keys(currentDataValues.items).length > 0" class="chart-content-section">
      <h4 v-if="widgetData">{{ widgetData.name }}</h4>
      <p v-if="dateDisplayText" class="date-caption">
        {{ dateDisplayText }}
      </p>

      <!-- 3/4 Circle Gauge -->
      <div class="gauge-container">
        <svg viewBox="0 0 120 100" class="gauge-svg">
          <defs>
            <!-- Gradient for negative values (blue) -->
            <linearGradient id="gaugeGradientNegativeD" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#1E40AF;stop-opacity:1" />
            </linearGradient>
            <!-- Gradient for positive values (orange) -->
            <linearGradient id="gaugeGradientPositiveD" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#F97316;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#FB923C;stop-opacity:1" />
            </linearGradient>
          </defs>
          
          <!-- Background arc (270 degrees, gap at bottom) -->
          <!-- Arc spans from 225° (bottom-left) through 270° (left), 0° (top), 90° (right) to 135° (bottom-right) -->
          <path
            :d="describeArcFixed(60, 50, 40, 135, -135)"
            fill="none"
            stroke="#E5E7EB"
            stroke-width="8"
            stroke-linecap="round"
          />
          
          <!-- Negative fill arc (blue) - from 0 (top) toward left (-100) -->
          <path
            v-if="currentAnimatedPercentage < 0"
            :d="describeArcFixed(60, 50, 40, 0, -Math.abs(currentAnimatedPercentage) * 1.35)"
            fill="none"
            stroke="url(#gaugeGradientNegativeD)"
            stroke-width="8"
            stroke-linecap="round"
            class="gauge-fill-arc"
          />
          
          <!-- Positive fill arc (orange) - from 0 (top) toward right (+100) -->
          <path
            v-if="currentAnimatedPercentage > 0"
            :d="describeArcFixed(60, 50, 40, 0, Math.abs(currentAnimatedPercentage) * 1.35)"
            fill="none"
            stroke="url(#gaugeGradientPositiveD)"
            stroke-width="8"
            stroke-linecap="round"
            class="gauge-fill-arc"
          />
          
          <!-- Center indicator dot at 0 position (top) -->
          <circle cx="60" cy="10" r="3" fill="#6B7280" />
          
          <!-- Scale labels -->
          <text x="15" y="75" class="gauge-label" text-anchor="middle">-100</text>
          <text x="60" y="8" class="gauge-label" text-anchor="middle">0</text>
          <text x="105" y="75" class="gauge-label" text-anchor="middle">+100</text>
        </svg>
        
        <!-- Center percentage display -->
        <div class="gauge-value-container">
          <span 
            class="gauge-percentage" 
            :class="{ 
              'gauge-negative': currentAnimatedPercentage < 0, 
              'gauge-positive': currentAnimatedPercentage > 0 
            }"
          >
            {{ formatPercentage(currentAnimatedPercentage) }}
          </span>
          <span 
            class="gauge-status-label"
            :class="getStatusColorClass(getStatusLabel(currentAnimatedPercentage).type)"
          >
            {{ getStatusLabel(currentAnimatedPercentage).label }}
          </span>
        </div>
      </div>

      <!-- Bi-directional Progress Bars -->
      <div class="bidirectional-bars">
        <div v-for="(value, key) in currentDataValues.items" :key="key" class="bidirectional-item">
          <span class="bidirectional-label">{{ key }}</span>
          <div class="bidirectional-bar-container">
            <!-- Left side (negative) -->
            <div class="bidirectional-bar-half bidirectional-bar-left">
              <div 
                class="bidirectional-fill bidirectional-fill-negative"
                :style="getBarStyle(animatedValues[selectedDataTab]?.items[key] || 0, 'negative')"
              ></div>
            </div>
            <!-- Center divider -->
            <div class="bidirectional-center-line"></div>
            <!-- Right side (positive) -->
            <div class="bidirectional-bar-half bidirectional-bar-right">
              <div 
                class="bidirectional-fill bidirectional-fill-positive"
                :style="getBarStyle(animatedValues[selectedDataTab]?.items[key] || 0, 'positive')"
              ></div>
            </div>
          </div>
          <div class="bidirectional-value-container">
            <span 
              class="bidirectional-value"
              :class="{ 
                'value-negative': (animatedValues[selectedDataTab]?.items[key] || 0) < 0, 
                'value-positive': (animatedValues[selectedDataTab]?.items[key] || 0) > 0 
              }"
            >
              {{ formatPercentage(animatedValues[selectedDataTab]?.items[key] || 0) }}
            </span>
            <span 
              class="bidirectional-status"
              :class="getStatusColorClass(getStatusLabel(animatedValues[selectedDataTab]?.items[key] || 0).type)"
            >
              {{ getStatusLabel(animatedValues[selectedDataTab]?.items[key] || 0).label }}
            </span>
          </div>
        </div>
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
      <p v-if="dateDisplayText" class="date-caption">
        {{ dateDisplayText }}
      </p>
      
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
  name: 'WidgetD',
  props: {
    // Store module name to fetch data from
    storeModule: {
      type: String,
      default: 'analysisRecords'
    },
    // Tab key in the store
    tabKey: {
      type: String,
      default: 'bidirectionalData'
    },
    tabType: {
      type: String,
      default: 'tab_D'
    },
    // Getter name for data
    dataGetterName: {
      type: String,
      default: 'getDataD'
    },
    // State path to chart data
    dataStatePath: {
      type: String,
      default: 'analysisData.data_D'
    },
    // State path to advice data
    adviceStatePath: {
      type: String,
      default: 'analysisData.advice_D'
    },
    // Getter name for advice date info
    adviceDateInfoGetterName: {
      type: String,
      default: 'getAdviceDateInfoD'
    },
    // State path to loading status
    loadingGetterName: {
      type: String,
      default: 'isLoading'
    },
    // Widget ID
    widgetConfig: {
      type: String,
      default: 'data_D'
    }
  },
  setup(props) {
    const store = useStore();
    const id = WIDGET_CONFIG[props.widgetConfig];

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

    /**
     * Helper function to describe an SVG arc path (original version)
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} radius - Arc radius
     * @param {number} startAngle - Start angle in degrees
     * @param {number} endAngle - End angle in degrees
     */
    const describeArc = (x, y, radius, startAngle, endAngle) => {
      const start = polarToCartesian(x, y, radius, endAngle);
      const end = polarToCartesian(x, y, radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      
      return [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
      ].join(" ");
    };

    /**
     * Fixed arc function for bi-directional gauge
     * - 0° is at TOP (12 o'clock)
     * - Positive angles go CLOCKWISE (toward right/+100)
     * - Negative angles go COUNTERCLOCKWISE (toward left/-100)
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} r - Radius
     * @param {number} startAngle - Start angle in degrees (0 = top)
     * @param {number} endAngle - End angle in degrees (positive = clockwise, negative = counterclockwise)
     */
    const describeArcFixed = (cx, cy, r, startAngle, endAngle) => {
      // Convert angle to radians, with 0° at top (12 o'clock)
      const toRadians = (angle) => (angle - 90) * Math.PI / 180;
      
      const startRad = toRadians(startAngle);
      const endRad = toRadians(endAngle);
      
      const startX = cx + r * Math.cos(startRad);
      const startY = cy + r * Math.sin(startRad);
      const endX = cx + r * Math.cos(endRad);
      const endY = cy + r * Math.sin(endRad);
      
      // Calculate arc span
      let arcSpan = endAngle - startAngle;
      
      // Determine flags
      const largeArcFlag = Math.abs(arcSpan) > 180 ? 1 : 0;
      // Sweep flag: 1 = clockwise, 0 = counterclockwise
      const sweepFlag = arcSpan >= 0 ? 1 : 0;
      
      return `M ${startX} ${startY} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
    };

    /**
     * Convert polar coordinates to Cartesian
     */
    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      };
    };

    /**
     * Format percentage with sign
     */
    const formatPercentage = (value) => {
      const rounded = Math.round(value);
      if (rounded > 0) return `+${rounded}%`;
      if (rounded < 0) return `${rounded}%`;
      return '0%';
    };

    /**
     * Get status label based on value
     * @param {number} value - Value from -100 to +100
     * @returns {Object} { label: string, type: string }
     */
    const getStatusLabel = (value) => {
      const rounded = Math.round(value);
      
      // Stable range: -15 to +15
      if (rounded >= -15 && rounded <= 15) {
        return { label: '安定', type: 'stable' };
      }
      
      // Negative ranges
      if (rounded >= -25 && rounded <= -16) {
        return { label: '休憩', type: 'rest' };
      }
      if (rounded >= -50 && rounded <= -26) {
        return { label: '滞り', type: 'stagnant' };
      }
      if (rounded >= -75 && rounded <= -51) {
        return { label: '停滞', type: 'dormant' };
      }
      if (rounded >= -100 && rounded <= -76) {
        return { label: '無反応', type: 'unresponsive' };
      }
      
      // Positive ranges
      if (rounded >= 16 && rounded <= 25) {
        return { label: '活発', type: 'active' };
      }
      if (rounded >= 26 && rounded <= 50) {
        return { label: '活性', type: 'activated' };
      }
      if (rounded >= 51 && rounded <= 75) {
        return { label: '過剰活性', type: 'hyperactive' };
      }
      if (rounded >= 76 && rounded <= 100) {
        return { label: '炎症', type: 'inflamed' };
      }
      
      return { label: '安定', type: 'stable' };
    };

    /**
     * Get status color class based on status type
     * @param {string} type - Status type
     * @returns {string} CSS class name
     */
    const getStatusColorClass = (type) => {
      const colorMap = {
        'stable': 'status-stable',
        'rest': 'status-rest',
        'active': 'status-active',
        'stagnant': 'status-stagnant',
        'activated': 'status-activated',
        'dormant': 'status-dormant',
        'hyperactive': 'status-hyperactive',
        'unresponsive': 'status-unresponsive',
        'inflamed': 'status-inflamed'
      };
      return colorMap[type] || 'status-stable';
    };

    /**
     * Calculate bar style for bi-directional progress bar
     * @param {number} value - Value from -100 to +100
     * @param {string} side - 'negative' or 'positive'
     */
    const getBarStyle = (value, side) => {
      const absValue = Math.abs(value);
      
      if (side === 'negative' && value < 0) {
        // Negative value: fill from right to left
        return {
          width: `${absValue}%`,
          opacity: 1
        };
      } else if (side === 'positive' && value > 0) {
        // Positive value: fill from left to right
        return {
          width: `${absValue}%`,
          opacity: 1
        };
      }
      
      return {
        width: '0%',
        opacity: 0
      };
    };

    // Computed properties for data from Vuex store
    const selectedDataTab = computed({
      get: () => store.state[props.storeModule].selectedTab[props.tabType],
      set: (tab) => store.dispatch(`${props.storeModule}/selectTab`, { tab, key: props.tabKey })
    });

    const currentDataValues = computed(() => store.getters[`${props.storeModule}/${props.dataGetterName}`] || { percentage: 0, items: {}, dateInfo: null });
    
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

    // Get advice data from the store (new structure: { items: [], dateInfo: null })
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
      
      // Handle new structure: { items: [], dateInfo: null }
      if (data && typeof data === 'object' && Array.isArray(data.items)) {
        return data.items;
      }
      
      return Array.isArray(data) ? data : [];
    });

    // Get advice date info from store
    const adviceDateInfo = computed(() => {
      return store.getters[`${props.storeModule}/${props.adviceDateInfoGetterName}`] || null;
    });

    // Get current date info based on selected tab
    const currentDateInfo = computed(() => {
      if (selectedDataTab.value === 'アドバイス') {
        return adviceDateInfo.value;
      }
      return currentDataValues.value?.dateInfo || null;
    });

    // Format date display string based on dateInfo
    const dateDisplayText = computed(() => {
      const dateInfo = currentDateInfo.value;
      
      if (!dateInfo) {
        return null;
      }

      // Single date display (今日 tab or single record)
      if (dateInfo.type === 'single') {
        let text = `更新日: ${dateInfo.newestDate}`;
        if (dateInfo.coverageText) {
          text += ` (${dateInfo.coverageText})`;
        }
        return text;
      }

      // Date range display (6ヶ月 or 1年 tab)
      if (dateInfo.type === 'range') {
        let text = `期間: ${dateInfo.oldestDate} - ${dateInfo.newestDate}`;
        if (dateInfo.coverageText) {
          text += ` (${dateInfo.coverageText})`;
        }
        return text;
      }

      return null;
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

    // Current animated percentage for the gauge
    const currentAnimatedPercentage = computed(() => {
      return animatedValues.value[selectedDataTab.value]?.percentage || 0;
    });

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
        const duration = 600; // Slightly longer for smoother bi-directional animation
        const start = performance.now();

        const animate = (time) => {
          const elapsed = time - start;
          const progress = Math.min(elapsed / duration, 1);
          // Use easeOutCubic for smoother animation
          const easedProgress = 1 - Math.pow(1 - progress, 3);

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
            percentage: lerp(animatedValues.value[newTab].percentage, targetValues.percentage, easedProgress),
            items: Object.fromEntries(
              Object.entries(targetValues.items).map(([key, value]) => [
                key,
                lerp(animatedValues.value[newTab].items[key] || 0, value, easedProgress)
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

    // Watch for data changes to initialize animated values
    watch(chartData, () => {
      initializeAnimatedValues();
    }, { immediate: true });

    // Reset flip states when switching to advice tab
    watch(selectedDataTab, (newTab) => {
      if (newTab === 'アドバイス') {
        flippedCards.value = {};
      }
    });

    // Get Widget Data for widget Name
    const widgetData = ref(null);
    async function getWidget(widgetId) {
      try {
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

    // Initialize only widget metadata when component is mounted
    onMounted(async () => {
      // Initialize animated values with the data that's already in the store
      initializeAnimatedValues();

      // Only get widget metadata (name, description, etc.)
      if (id) {
        widgetData.value = await getWidget(id);
      }
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
      currentDateInfo,
      dateDisplayText,
      // New methods for bi-directional widget
      describeArc,
      describeArcFixed,
      formatPercentage,
      getBarStyle,
      currentAnimatedPercentage,
      getStatusLabel,
      getStatusColorClass,
    };
  }
});
</script>

<style scoped>
/* Date Caption */
.date-caption {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.7rem;
  color: #777;
  margin: 4px 0 12px 0;
  padding: 4px 8px;
  border-radius: 4px;
}

/* ========================================
   3/4 Circle Gauge Styles
   ======================================== */
.gauge-container {
  position: relative;
  width: 100%;
  max-width: 200px;
  margin: 0 auto 1.5rem auto;
}

.gauge-svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

.gauge-label {
  font-size: 8px;
  fill: #9CA3AF;
  font-weight: 500;
}

.gauge-fill-arc {
  transition: d 0.3s ease-out;
}

.gauge-value-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -20%);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.gauge-percentage {
  font-size: 1.5rem;
  font-weight: 700;
  color: #6B7280;
  line-height: 1.2;
}

.gauge-percentage.gauge-negative {
  color: #2563EB;
}

.gauge-percentage.gauge-positive {
  color: #EA580C;
}

.gauge-status-label {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
}

/* ========================================
   Bi-directional Progress Bar Styles
   ======================================== */
.bidirectional-bars {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0 0.5rem;
}

.bidirectional-item {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  align-items: center;
  gap: 0.5rem;
}

.bidirectional-label {
  font-size: 0.85rem;
  color: #374151;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bidirectional-value-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 70px;
}

.bidirectional-bar-container {
  display: flex;
  align-items: center;
  height: 20px;
  background-color: #F3F4F6;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.bidirectional-bar-half {
  flex: 1;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.bidirectional-bar-left {
  display: flex;
  justify-content: flex-end;
}

.bidirectional-bar-right {
  display: flex;
  justify-content: flex-start;
}

/* Subtle center divider line */
.bidirectional-center-line {
  width: 2px;
  height: 100%;
  background-color: #D1D5DB;
  flex-shrink: 0;
  z-index: 1;
}

.bidirectional-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease-out, opacity 0.3s ease-out;
}

.bidirectional-fill-negative {
  background: linear-gradient(to left, #3B82F6, #1E40AF);
  border-radius: 10px 0 0 10px;
}

.bidirectional-fill-positive {
  background: linear-gradient(to right, #F97316, #FB923C);
  border-radius: 0 10px 10px 0;
}

.bidirectional-value {
  font-size: 0.85rem;
  font-weight: 600;
  text-align: left;
  color: #6B7280;
  line-height: 1.2;
}

.bidirectional-value.value-negative {
  color: #2563EB;
}

.bidirectional-value.value-positive {
  color: #EA580C;
}

.bidirectional-status {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 8px;
  white-space: nowrap;
}

/* ========================================
   Status Color Classes
   ======================================== */
/* Stable: -15 to +15 (Gray/Green) */
.status-stable {
  background-color: #D1FAE5;
  color: #065F46;
}

/* Rest: -25 to -16 (Light Blue) */
.status-rest {
  background-color: #DBEAFE;
  color: #1E40AF;
}

/* Active: +16 to +25 (Light Orange) */
.status-active {
  background-color: #FED7AA;
  color: #C2410C;
}

/* Stagnant: -50 to -26 (Blue) */
.status-stagnant {
  background-color: #BFDBFE;
  color: #1E3A8A;
}

/* Activated: +26 to +50 (Orange) */
.status-activated {
  background-color: #FDBA74;
  color: #9A3412;
}

/* Dormant: -75 to -51 (Dark Blue) */
.status-dormant {
  background-color: #93C5FD;
  color: #1E3A8A;
}

/* Hyperactive: +51 to +75 (Dark Orange) */
.status-hyperactive {
  background-color: #FB923C;
  color: #7C2D12;
}

/* Unresponsive: -100 to -76 (Deep Blue) */
.status-unresponsive {
  background-color: #60A5FA;
  color: #1E3A8A;
}

/* Inflamed: +76 to +100 (Red) */
.status-inflamed {
  background-color: #FCA5A5;
  color: #991B1B;
}

/* ========================================
   No Data Section
   ======================================== */
.no-data-section {
  text-align: center;
  padding: 2rem;
}

.no-data-message {
  color: #9CA3AF;
  font-size: 0.9rem;
}

/* ========================================
   Advice Section (same as other widgets)
   ======================================== */
.advice-section {
  padding: 1rem;
}

.advice-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.no-advice {
  text-align: center;
  color: #9CA3AF;
  padding: 2rem;
}
</style>
