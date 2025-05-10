<!-- SatisfactionDataView.vue -->
<template>
    <section class="satisfaction-data-section">
      <div class="sat-tabs">
        <button 
          v-for="tab in satTabs" 
          :key="tab.value"
          :class="['sat-tab', { 'active': selectedSatTab === tab.value }]"
          @click="handleSatTabChange(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
  
      <div class="sat-data-section">
        <div class="scope-tabs">
          <button 
            v-for="scope in scopeTabs" 
            :key="scope.value"
            :class="['scope-tab', { 'active': selectedScopeTab === scope.value }]"
            @click="handleScopeTabChange(scope.value)"
          >
            {{ scope.label }}
          </button>
        </div>
  
        <div class="chart-container">
          <div v-if="isLoading" class="loading">Loading...</div>
          <LineChart 
            v-else
            :data="chartData"
            :options="chartOptions"
          />
        </div>
      </div>
    </section>
</template>
  
<script>
    import { computed, onMounted } from 'vue';
    import { useStore } from 'vuex';
    import { Line as LineChart } from 'vue-chartjs';
    import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
    } from 'chart.js';

    ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
    );

    export default {
        name: 'SatisfactionDataView',
        components: { LineChart },
        
        setup() {
            const store = useStore();
            const isLoading = computed(() => store.getters['mindspace/isLoading']);
            //const currentThemeId = computed(() => store.state.themeSpace.currentThemeId);

            // Tabs configuration
            const satTabs = [
            { label: '自己評価', value: 'selfAssessment' },
            { label: 'AI評価', value: 'aiAssessment' },
            { label: '比較', value: 'comparison' }
            ];

            const scopeTabs = [
            { label: '1 Year', value: 'year' },
            { label: '1 Month', value: 'month' },
            { label: '1 Week', value: 'week' }
            ];

            const selectedSatTab = computed({
            get: () => store.state.scores.selectedTab.selectedSatTab,
            set: (value) => store.dispatch('scores/selectSatTab', value)
            });

            const selectedScopeTab = computed({
            get: () => store.state.scores.selectedTab.scopeSatTab,
            set: (value) => store.dispatch('scores/selectScopeTab', value)
            });

            const satisfactionData = computed(() => store.state.scores.satisfactionData || {
            selfAssessment: [],
            aiAssessment: []
            });

            const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 0,
                    max: 5,
                    grid: {
                        display: false
                    },
                    ticks: {
                    // Show only 1, 3, and 5
                    callback: function(value) {
                        if (value % 2 === 1 || value === 5) {  // Show only odd numbers and 5
                            return value.toFixed(0);  // Remove decimals
                        }
                        return '';  // Return empty string for other values
                    },
                        stepSize: 1  // Ensure we get whole numbers
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            elements: {
                line: {
                tension: 0.4
                }
            },
            plugins: {
                legend: {
                display: false
                }
            }
            };

            const processDataForChart = (data, tabType, scope) => {
                if (!data || (!data.selfAssessment && !data.aiAssessment)) {
                    return {
                    labels: [],
                    datasets: [{
                        data: [],
                        borderColor: '#FF6384',
                        backgroundColor: '#FF6384'
                    }]
                    };
                }

                const timeRange = getTimeRange(scope);
                const labels = getLabels(timeRange, scope);

                const aggregateData = (assessmentData) => {
                    if (!Array.isArray(assessmentData)) return [];
                    
                    const filteredData = assessmentData.filter(item => 
                    new Date(item.timestamp) >= timeRange
                    );

                    switch (scope) {
                    case 'year':
                        // Group and average by month
                        return aggregateByPeriod(filteredData, 'month', 12);
                    
                    case 'month':
                        // Group and average by week
                        return aggregateByPeriod(filteredData, 'week', 4);
                    
                    case 'week':
                        // Group and average by day
                        return aggregateByPeriod(filteredData, 'day', 7);
                    }
                };

                if (tabType === 'comparison') {
                    return {
                    labels,
                    datasets: [
                        {
                        label: 'Self Assessment',
                        data: aggregateData(data.selfAssessment || []),
                        borderColor: '#FF6384',
                        backgroundColor: '#FF6384'
                        },
                        {
                        label: 'AI Assessment',
                        data: aggregateData(data.aiAssessment || []),
                        borderColor: '#36A2EB',
                        backgroundColor: '#36A2EB'
                        }
                    ]
                    };
                }

                return {
                    labels,
                    datasets: [{
                    data: aggregateData(data[tabType] || []),
                    borderColor: tabType === 'selfAssessment' ? '#FF6384' : '#36A2EB',
                    backgroundColor: tabType === 'selfAssessment' ? '#FF6384' : '#36A2EB'
                    }]
                };
                };

                // Helper function to aggregate data by time period
                const aggregateByPeriod = (data, period, numPeriods) => {
                    const result = new Array(numPeriods).fill(0);
                    const counts = new Array(numPeriods).fill(0);

                    data.forEach(item => {
                        const date = new Date(item.timestamp);
                        let index;

                        switch (period) {
                        case 'month':
                            index = numPeriods - 1 - (new Date().getMonth() - date.getMonth() + 
                            (12 * (new Date().getFullYear() - date.getFullYear())));
                            break;
                        case 'week':
                            index = Math.floor((new Date() - date) / (7 * 24 * 60 * 60 * 1000));
                            index = numPeriods - 1 - index;
                            break;
                        case 'day':
                            index = numPeriods - 1 - Math.floor((new Date() - date) / (24 * 60 * 60 * 1000));
                            break;
                        }

                        if (index >= 0 && index < numPeriods) {
                        result[index] += item.value;
                        counts[index]++;
                        }
                    });

                    // Calculate averages
                    return result.map((sum, i) => 
                        counts[i] > 0 ? Number((sum / counts[i]).toFixed(2)) : null
                    );
                };

            const chartData = computed(() => {
            return processDataForChart(
                satisfactionData.value,
                selectedSatTab.value,
                selectedScopeTab.value
            );
            });

            const getTimeRange = (scope) => {
                const now = new Date();
                switch (scope) {
                    case 'week':
                    return new Date(now.setDate(now.getDate() - 7));
                    case 'month':
                    return new Date(now.setMonth(now.getMonth() - 1));
                    default: // year
                    return new Date(now.setFullYear(now.getFullYear() - 1));
                }
            };

            const getLabels = (startTime, scope) => {
                const labels = [];
                const now = new Date();

                switch (scope) {
                    case 'year':
                    // Generate month labels for the past year
                    for (let i = 11; i >= 0; i--) {
                        const date = new Date(now);
                        date.setMonth(now.getMonth() - i);

                        //Show every month
                        //labels.push(date.toLocaleString('default', { month: 'short' }));

                        //Show every two months
                        labels.push(i % 2 === 0 ? date.toLocaleString('default', { month: 'short' }) : '');
                    }
                    break;

                    case 'month':
                    // Generate weekly labels for the past month
                    for (let i = 0; i < 4; i++) {
                        labels.push(`Week ${i + 1}`);
                    }
                    break;

                    case 'week':
                    // Generate daily labels for the past week
                    for (let i = 6; i >= 0; i--) {
                        const date = new Date(now);
                        date.setDate(now.getDate() - i);
                        labels.push(date.toLocaleString('default', { weekday: 'short' }));
                    }
                    break;
                }

                return labels;
            };

            const handleSatTabChange = (tab) => {
            selectedSatTab.value = tab;
            };

            const handleScopeTabChange = (scope) => {
            selectedScopeTab.value = scope;
            };

            onMounted(async () => {
            try {
                //console.log("none");
            } finally {
                isLoading.value = false;
            }
            });

            return {
            satTabs,
            scopeTabs,
            selectedSatTab,
            selectedScopeTab,
            chartData,
            chartOptions,
            isLoading,
            handleSatTabChange,
            handleScopeTabChange
            };
        }
    };
</script>