<template>
    <section class="decision-section">
      <div class="ability-tab-menu" v-if="Object.keys(decisionMakingPowerData).length">
        <button
          v-for="tab in Object.keys(decisionMakingPowerData)"
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
      <!--
      <div v-else class="no-data">No ability data available.</div>-->
    </section>
  </template>
  
  <script>
  import { defineComponent, ref, computed, watch, onMounted } from 'vue';
  import { useStore } from 'vuex';
  
  export default defineComponent({
    name: 'DecisionSection',
    setup() {
      const store = useStore();
  
      // Linear interpolation function for smooth animations
      const lerp = (start, end, t) => start * (1 - t) + end * t;
  
      // Computed properties for abilities data from Vuex store
      const selectedAbilityTab = computed({
        get: () => store.state.analysisRecords.selectedTab.tab_A,
        set: (tab) => store.dispatch('analysisRecords/selectTab', { tab, key:'decisionMakingPower' })
      });
  
      const currentAbilities = computed(() => store.getters['analysisRecords/currentAbilities'] || { percentage: 0, items: {} });
      const decisionMakingPowerData = computed(() => store.state.analysisRecords.analysisData.analysisData_A);
      const isAbilitiesLoading = computed(() => store.getters['analysisRecords/isLoading']);
  
      // Animated abilities state with initial values
      const animatedAbilities = ref({
        '1年': {
          percentage: 0,
          items: {
            '主体性': 0,
            '方向性': 0,
            '安定性': 0
          }
        },
        '6ヶ月': {
          percentage: 0,
          items: {
            '主体性': 0,
            '方向性': 0,
            '安定性': 0
          }
        },
        '今日': {
          percentage: 0,
          items: {
            '主体性': 0,
            '方向性': 0,
            '安定性': 0
          }
        }
       });
  
      // Initialize animated abilities with correct structure based on actual data
      const initializeAnimatedAbilities = () => {
        Object.keys(decisionMakingPowerData.value).forEach(tab => {
          if (decisionMakingPowerData.value[tab] && decisionMakingPowerData.value[tab].items) {
            animatedAbilities.value[tab] = {
              percentage: 0,
              items: Object.fromEntries(
                Object.keys(decisionMakingPowerData.value[tab].items).map(key => [key, 0])
              )
            };
          }
        });
      };
  
      // Watch for changes in selected tab or loading state to animate transitions
      watch([selectedAbilityTab, isAbilitiesLoading], ([newTab, isLoading]) => {
        if (!isLoading && decisionMakingPowerData.value[newTab]?.items) {
          const targetAbilities = decisionMakingPowerData.value[newTab];
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
  
      // Initialize data when component is mounted
      onMounted(async () => {
        // Load abilities data from Vuex store
        await store.dispatch('analysisRecords/loadData');
        
        // Initialize animated abilities with the correct structure
        initializeAnimatedAbilities();
      });


      //console.log('Selected ability tab:', selectedAbilityTab.value);
      //console.log('Current abilities:', currentAbilities.value);
  
      return {
        // Return all required properties and methods
        selectedAbilityTab,
        currentAbilities,
        decisionMakingPowerData,
        isAbilitiesLoading,
        animatedAbilities,
      };
    }
  });
  </script>
  