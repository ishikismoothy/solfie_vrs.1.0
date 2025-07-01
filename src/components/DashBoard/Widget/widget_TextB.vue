<!--widget_TextB.vue : Quote Display Widget-->
<template>
  <section class="text-widget-section">
    <section v-if="isDataLoading" class="text-widget-loading">
      <!-- Loading placeholder -->
      <div class="loading-text">Loading...</div>
    </section>
    
    <!-- Quote view -->
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
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { widgetService } from '@/firebase/firebaseWidget';
import { TEXT_WIDGET_CONFIG } from '@/config/widgetConfig';

export default defineComponent({
  name: 'Widget_TextB',
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
    const store = useStore();
    const id = TEXT_WIDGET_CONFIG[props.widgetConfig];
    const uid = computed(() => store.state.user?.user?.uid);
    const currentThemeId = computed(() => store.state.mindspace?.currentThemeId);

    // Get quote data from the store
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
      
      // If data is an array, get the first item
      if (Array.isArray(data) && data.length > 0) {
        return data[0];
      }
      
      return data;
    });
    
    const isDataLoading = computed(() => store.getters[`${props.storeModule}/${props.loadingGetterName}`]);

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

    // Initialize data when component is mounted
    onMounted(async () => {
      // Load data from Vuex store
      if (uid.value && currentThemeId.value) {
        await store.dispatch(`${props.storeModule}/${props.loadDataAction}`, { 
          uid: uid.value, 
          themeId: currentThemeId.value
        });
      }
      
      // Get widget data
      if (id) {
        widgetData.value = await getWidget(id);
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
