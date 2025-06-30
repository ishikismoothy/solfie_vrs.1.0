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
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
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
    widgetConfig: {
      type: String,
      default: 'text_A'
    }
  },
  setup(props) {
    console.log('🚀 Widget_TextA setup started with props:', props);
    
    const store = useStore();
    const id = TEXT_WIDGET_CONFIG[props.widgetConfig];
    console.log('📋 Widget ID from config:', id);
    console.log('📋 TEXT_WIDGET_CONFIG:', TEXT_WIDGET_CONFIG);
    
    const uid = computed(() => store.state.user?.user?.uid);
    const currentThemeId = computed(() => store.state.mindspace?.currentThemeId);
    
    console.log('👤 Initial UID:', uid.value);
    console.log('🎨 Initial Theme ID:', currentThemeId.value);

    // Get quote data from the store
    const textData = computed(() => {
      console.log('🔍 Computing textData...');
      console.log('📍 textStatePath:', props.textStatePath);
      
      const pathParts = props.textStatePath.split('.');
      let data = store.state[props.storeModule];
      console.log('📦 Initial store module data:', data);
      
      for (const part of pathParts) {
        console.log(`  📍 Accessing part: ${part}`);
        if (data && data[part]) {
          data = data[part];
          console.log(`  ✅ Found data for ${part}:`, data);
        } else {
          console.log(`  ❌ No data found for ${part}`);
          return null;
        }
      }
      
      // If data is an array, get the first item
      if (Array.isArray(data) && data.length > 0) {
        console.log('📋 Data is array, returning first item:', data[0]);
        return data[0];
      }
      
      console.log('📋 Final textData:', data);
      return data;
    });
    
    const isDataLoading = computed(() => {
      const loading = store.getters[`${props.storeModule}/${props.loadingGetterName}`];
      console.log('⏳ Loading state:', loading);
      return loading;
    });

    // Watch for changes in textData
    watch(textData, (newData) => {
      console.log('👀 textData changed:', newData);
    });

    // Watch for changes in loading state
    watch(isDataLoading, (newLoading) => {
      console.log('⏳ Loading state changed:', newLoading);
    });

    // Get Widget Data for widget Name
    const widgetData = ref(null);
    
    async function getWidget(widgetId) {
      console.log('🔧 Getting widget data for ID:', widgetId);
      try {
        const data = await widgetService.getWidgetById(widgetId);
        console.log('✅ Widget data received:', data);
        
        return {
          name: data.name, 
          description: data.description, 
          entries: data.entries
        };
      } catch (error) {
        console.error("❌ Error getting widget data:", error);
        return null;
      }
    }

    // Initialize data when component is mounted
    onMounted(async () => {
      console.log('🎬 Component mounted');
      console.log('👤 Current UID:', uid.value);
      console.log('🎨 Current Theme ID:', currentThemeId.value);
      
      try {
        // Check current store state
        console.log('📦 Current store state:', store.state);
        console.log('📦 Analysis Records module:', store.state[props.storeModule]);
        console.log('📦 Analysis Data:', store.state[props.storeModule]?.analysisData);
        console.log('📦 text_A data:', store.state[props.storeModule]?.analysisData?.text_A);
        
        // Load data from Vuex store
        if (uid.value && currentThemeId.value) {
          console.log('📡 Dispatching loadData action...');
          
          // Add a timeout to prevent hanging promises
          const loadDataPromise = store.dispatch(`${props.storeModule}/${props.loadDataAction}`, { 
            uid: uid.value, 
            themeId: currentThemeId.value
          });
          
          // Set a timeout of 30 seconds
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Load data timeout after 30 seconds')), 30000);
          });
          
          // Race between the actual load and timeout
          await Promise.race([loadDataPromise, timeoutPromise]);
          
          console.log('✅ LoadData action completed');
          
          // Check store state after loading
          console.log('📦 Store state after loading:', store.state[props.storeModule]?.analysisData);
          console.log('📦 text_A after loading:', store.state[props.storeModule]?.analysisData?.text_A);
        } else {
          console.warn('⚠️ Cannot load data: missing uid or themeId');
        }
        
        // Get widget data
        if (id) {
          console.log('🔧 Loading widget data...');
          
          // Also add timeout for widget loading
          const widgetPromise = getWidget(id);
          const widgetTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Widget load timeout after 10 seconds')), 10000);
          });
          
          widgetData.value = await Promise.race([widgetPromise, widgetTimeoutPromise]);
          console.log('✅ Widget data loaded:', widgetData.value);
        } else {
          console.warn('⚠️ No widget ID found in config');
        }
      } catch (error) {
        console.error('❌ Error in onMounted:', error);
        console.error('Error stack:', error.stack);
        
        // Set a user-friendly error state if needed
        // You might want to add an error ref to show to users
        // errorMessage.value = 'データの読み込みに失敗しました。ページを更新してください。';
      }
    });
          

    return {
      widgetData,
      textData,
      isDataLoading,
    };
  }
});
</script>

<style scoped>
</style>