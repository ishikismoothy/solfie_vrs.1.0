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
                    callback: function(value) {
                        if (value % 2 === 1 || value === 5) {
                            return value.toFixed(0);
                        }
                        return '';
                    },
                        stepSize: 1
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

            // Helper function to interpolate missing values and track which points are interpolated
            const interpolateValues = (data) => {
                const result = [...data];
                const isInterpolated = new Array(data.length).fill(false);
                
                // Find first and last non-null values
                let firstIndex = -1, lastIndex = -1;
                for (let i = 0; i < result.length; i++) {
                    if (result[i] !== null) {
                        if (firstIndex === -1) firstIndex = i;
                        lastIndex = i;
                    }
                }
                
                if (firstIndex === -1) return { data: result, isInterpolated }; // No data points
                
                // Interpolate between known values
                for (let i = firstIndex; i <= lastIndex; i++) {
                    if (result[i] === null) {
                        // Find previous and next non-null values
                        let prevIndex = i - 1;
                        let nextIndex = i + 1;
                        
                        while (prevIndex >= firstIndex && result[prevIndex] === null) prevIndex--;
                        while (nextIndex <= lastIndex && result[nextIndex] === null) nextIndex++;
                        
                        if (prevIndex >= firstIndex && nextIndex <= lastIndex) {
                            // Linear interpolation
                            const prevValue = result[prevIndex];
                            const nextValue = result[nextIndex];
                            const steps = nextIndex - prevIndex;
                            const stepValue = (nextValue - prevValue) / steps;
                            result[i] = Number((prevValue + stepValue * (i - prevIndex)).toFixed(2));
                            isInterpolated[i] = true; // Mark as interpolated
                        }
                    }
                }
                
                return { data: result, isInterpolated };
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
                    if (!Array.isArray(assessmentData)) return { data: [], isInterpolated: [] };
                    
                    const filteredData = assessmentData.filter(item => 
                    new Date(item.timestamp) >= timeRange
                    );

                    let rawData;
                    switch (scope) {
                    case 'year':
                        rawData = aggregateByPeriod(filteredData, 'month', 12);
                        break;
                    case 'month':
                        rawData = aggregateByPeriod(filteredData, 'week', 4);
                        break;
                    case 'week':
                        rawData = aggregateByPeriod(filteredData, 'day', 7);
                        break;
                    }
                    
                    // Apply interpolation to create continuous line
                    return interpolateValues(rawData);
                };

                if (tabType === 'comparison') {
                    const selfData = aggregateData(data.selfAssessment || []);
                    const aiData = aggregateData(data.aiAssessment || []);
                    
                    return {
                    labels,
                    datasets: [
                        {
                        label: 'Self Assessment',
                        data: selfData.data,
                        borderColor: '#FF6384',
                        backgroundColor: '#FF6384',
                        pointRadius: selfData.isInterpolated.map(interpolated => interpolated ? 0 : 4),
                        pointHoverRadius: selfData.isInterpolated.map(interpolated => interpolated ? 0 : 6)
                        },
                        {
                        label: 'AI Assessment',
                        data: aiData.data,
                        borderColor: '#36A2EB',
                        backgroundColor: '#36A2EB',
                        pointRadius: aiData.isInterpolated.map(interpolated => interpolated ? 0 : 4),
                        pointHoverRadius: aiData.isInterpolated.map(interpolated => interpolated ? 0 : 6)
                        }
                    ]
                    };
                }

                const processedData = aggregateData(data[tabType] || []);
                return {
                    labels,
                    datasets: [{
                    data: processedData.data,
                    borderColor: tabType === 'selfAssessment' ? '#FF6384' : '#36A2EB',
                    backgroundColor: tabType === 'selfAssessment' ? '#FF6384' : '#36A2EB',
                    pointRadius: processedData.isInterpolated.map(interpolated => interpolated ? 0 : 4),
                    pointHoverRadius: processedData.isInterpolated.map(interpolated => interpolated ? 0 : 6)
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

                    // Calculate averages (keep null for periods with no data)
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
                    for (let i = 11; i >= 0; i--) {
                        const date = new Date(now);
                        date.setMonth(now.getMonth() - i);
                        labels.push(i % 2 === 0 ? date.toLocaleString('default', { month: 'short' }) : '');
                    }
                    break;

                    case 'month':
                    for (let i = 0; i < 4; i++) {
                        labels.push(`Week ${i + 1}`);
                    }
                    break;

                    case 'week':
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