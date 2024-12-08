<!-- CustomSlider.vue -->
<template>
    <div v-if="isOpen" class="satisfaction-overlay"
    >
        <div class="slider-container">
            <div class="slider-top-container">
            <h3>今日も実感してる？</h3>
            </div>
            <div class="slider-bot-container">
            
            <!-- Gradient Slider -->
            <div class="slider-section">
                <div class="slider-value-container">{{ formattedValue }}</div>
                    <div class="slider-bar-container">
                        <input
                            class="slider-gradient"
                            type="range" 
                            v-model="value" 
                            :min="min" 
                            :max="max" 
                            :step="step"
                            @touchstart="handleTouchStart"
                            @touchMove="handleTouchMove"
                            @touchend="handleTouchEnd"
                        />
                    </div>
                    
                    <div class="sat-icon-container">{{ result }}</div>
                </div>
                
                <button 
                    class="sat-submit-button"
                    @click="submit"
                >Submit</button>
            </div>
        </div>          
    </div>
</template>
  
<script>
  import  { defineComponent, ref, computed, watch } from 'vue';
  import { useStore } from 'vuex';

  export default defineComponent({
        name: 'CustomSlider',
        props: {
            isOpen: {
                type: Boolean,
                required: true
            }
        },
        emits: ['close'],
        setup(props, { emit }) {
            const store = useStore();

            const value = ref(0);
            const formattedValue = computed(() => Number(value.value).toFixed(1));
            const min = ref(0);
            const max = ref(5);
            const step = ref(0.1);
            //const isEditSatisfaction = computed(() => store.state.user.editMonitor.onEditSatisfaction);
            const satisfaction = [
            "😱",
            "😣",
            "😕",
            "😃",
            "😍"
            ];
            
            const result = ref(satisfaction[0]);
            const close = () => {
                emit('close');
                //onNameEdit.value = false;
                //store.dispatch('user/setIsBlockEdit', false);
            };
            const handleTouchStart = () => {
                store.dispatch('user/setIsEditSatisfaction', true);
            };
            const handleTouchMove = () => {
                store.dispatch('user/setIsEditSatisfaction', true);
            };
            const handleTouchEnd = () => {
                store.dispatch('user/setIsEditSatisfaction', false);
            };

            const submit = () => {
                console.log("satisfactionSlider.vue/submit");
                store.dispatch('themeSpace/updateSatisfaction', value.value);
                close();
            };

            watch(value, (newValue) => {
            if (newValue < 0 || newValue > 5) {
                result.value = 'Invalid score';
            } else if (newValue >= 5) {
                result.value = satisfaction[4];
            } else {
                result.value = satisfaction[Math.floor(newValue)];
            }
            }, { immediate: true });

            return {
                value,
                formattedValue,
                min,
                max,
                step,
                result,
                close,
                handleTouchStart,
                handleTouchMove,
                handleTouchEnd,
                submit
            };
        },
    });
</script>
  
<style lang="scss">
    @import '@/assets/satisfactionStyle.scss';
</style>