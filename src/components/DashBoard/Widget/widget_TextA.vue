<!--widget_TextA.vue : 選択のコツ Widget-->
<template>
  <section class="text-widget-section">
    <section v-if="isDataLoading" class="text-widget-loading">
      <!-- Loading placeholder -->
      <div class="loading-text">Loading...</div>
    </section>
    
    <!-- TEXT view -->
    <section v-if="!isDataLoading && textData" class="text-content-section">
      <h4 v-if="widgetData" class="text-widget-title">{{ widgetData.name }}</h4>
      <p v-if="dateDisplayText" class="date-caption">
        {{ dateDisplayText }}
      </p>
      
      <div v-if="textData.description" class="text-container">
        <blockquote class="text-text">
          <span class="text-mark text-mark-start">"</span>
          {{ textData.description }}
          <span class="text-mark text-mark-end">"</span>
        </blockquote>
        <cite v-if="textData.content" class="text-title">— {{ textData.content }}</cite>
      </div>
      
      <div v-else class="no-text-data">
        現在表示するデータはありません
      </div>
    </section>
  </section>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { widgetService } from '@/firebase/firebaseWidget';
import { TEXT_WIDGET_CONFIG } from '@/config/widgetConfig';

export default defineComponent({
  name: 'Widget_TextA',
  props: {
    // Store module name to fetch data from
    storeModule: {
      type: String,
      default: 'analysisRecords'
    },
    // State path to quote data
    textStatePath: {
      type: String,
      default: 'analysisData.text_A'
    },
    // Getter name for text date info
    textDateInfoGetterName: {
      type: String,
      default: 'getTextDateInfoA'
    },
    // State path to loading status
    loadingGetterName: {
      type: String,
      default: 'isLoading'
    },
    // Widget ID
    widgetConfig: {
      type: String,
      default: 'text_A'
    }
  },
  setup(props) {
    const store = useStore();
    const id = TEXT_WIDGET_CONFIG[props.widgetConfig];

    // Get quote data from the store (already loaded by dashboard)
    const textData = computed(() => {
      const pathParts = props.textStatePath.split('.');
      let data = store.state[props.storeModule];
      
      for (const part of pathParts) {
        if (data && data[part]) {
          data = data[part];
        } else {
          return null;
        }
      }
      
      // Handle new structure: { data: {...}, dateInfo: {...} }
      if (data && typeof data === 'object' && data.data !== undefined) {
        return data.data;
      }
      
      // If data is an array, get the first item
      if (Array.isArray(data) && data.length > 0) {
        return data[0];
      }
      
      return data;
    });

    // Get text date info from store
    const textDateInfo = computed(() => {
      return store.getters[`${props.storeModule}/${props.textDateInfoGetterName}`] || null;
    });

    // Format date display string based on dateInfo
    const dateDisplayText = computed(() => {
      const dateInfo = textDateInfo.value;
      
      if (!dateInfo) {
        return null;
      }

      // Single date display for text widgets
      if (dateInfo.type === 'single') {
        let text = `更新日: ${dateInfo.newestDate}`;
        if (dateInfo.coverageText) {
          text += ` (${dateInfo.coverageText})`;
        }
        return text;
      }

      // Date range display (unlikely for text widgets, but included for consistency)
      if (dateInfo.type === 'range') {
        let text = `期間: ${dateInfo.oldestDate} - ${dateInfo.newestDate}`;
        if (dateInfo.coverageText) {
          text += ` (${dateInfo.coverageText})`;
        }
        return text;
      }

      return null;
    });
    
    const isDataLoading = computed(() => {
      return store.getters[`${props.storeModule}/${props.loadingGetterName}`];
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
        console.error("Error getting widget data:", error);
        return null;
      }
    }

    // Initialize only widget metadata when component is mounted
    onMounted(async () => {
      // REMOVED: Data loading - now handled by dashboard component
      // The dashboard will call store.dispatch('analysisRecords/loadData')
      // before any widgets are mounted
      
      // Only get widget metadata (name, description, etc.)
      if (id) {
        widgetData.value = await getWidget(id);
      }
    });

    return {
      widgetData,
      textData,
      isDataLoading,
      textDateInfo,
      dateDisplayText,
    };
  }
});
</script>

<style scoped>
.text-widget-section {
  margin-bottom: 1rem;
}

.text-widget-loading {
  padding: 2rem;
  text-align: center;
}

.loading-text {
  color: #666;
  font-style: italic;
}

.text-widget-title {
  margin-bottom: 1rem;
  color: #333;
}

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

.text-container {
  margin: 1rem 0;
}

.text-mark-start {
  left: 0;
  top: -0.5rem;
}

.text-mark-end {
  right: 0;
  bottom: -0.5rem;
}

.text-title {
  display: block;
  text-align: right;
  margin-top: 1rem;
  font-style: normal;
  color: #666;
}

.no-text-data {
  text-align: center;
  color: #999;
  padding: 2rem;
}
</style>