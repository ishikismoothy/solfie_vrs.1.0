<template>
<div class="minduniverse-window">
    <div class="minduniverse-window-container">
        <div class="minduniverse-window-header">
            <h1>Solfie Universe</h1>
            <button 
                class="close-btn"
                @click="closeMindUniverse"
            >×</button>
        </div>
        
        <div class="tabs">
            <button class="tab active">Widget</button>
            <button class="tab">Slots</button>
            <button class="tab">Cards</button>
        </div>
    
        <div class="search-container">
            <div class="search-icon">🔍</div>
            <input type="text" class="search-input" placeholder="Search...">
        </div>
    
        <div class="card-container">
            <div v-for="(card) in widgets" :key="card.id" class="card">
                <div class="card-image">
                    <div class="placeholder-image">
                        <div class="image-icon">🖼️</div>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="card-text">
                        <h3>{{ card.name }}</h3>
                        <p>{{ card.createdAtFormatted || card.createdAt }}</p>
                    </div>
                    <label class="toggle">
                        <input 
                            type="checkbox" 
                            :checked="isWidgetEnabled(card.id)"
                            @change="handleToggleChange(card, $event.target.checked)"
                        >
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script>
    import { onMounted, computed, ref } from 'vue';
    import { useStore } from 'vuex';
    import { widgetService } from '@/firebase/firebaseWidget';
    //import { widgetService } from '@/firebase/firebaseWidget';
    export default {
        name: 'SolfieUniverse',
        data() {
            return {
            cards: [
                {
                title: 'Card Title',
                secondaryText: 'Secondary text',
                enabled: true
                },
                {
                title: 'Card Title',
                secondaryText: 'Secondary text',
                enabled: true
                }
            ]
            }
        },
        setup() {
            const store = useStore();
            const widgets = ref([]);
            const usersWidgets = computed(() => store.state.user.userWidgets || []);
            const isLoading = ref(true);
            const error = ref(null);

            const closeMindUniverse = async () => {
                store.dispatch('user/triggerMindUniverseWindow',false);
            };

            // Function 1: Check if widget is enabled (in user's widgets)
            const isWidgetEnabled = (widgetId) => {
                return usersWidgets.value.includes(widgetId);
            };

            // Function 2: Add widget to user's widgets when toggled on
            const addUserWidget = async (widgetId) => {
                try {
                    // Dispatch action to add widget to user's widgets
                    await store.dispatch('user/addUserWidget', widgetId);
                    //console.log(`Widget ${widgetId} added to user's widgets`);
                } catch (err) {
                    console.error("Error adding widget:", err);
                }
            };

            // Function 3: Remove widget from user's widgets when toggled off
            const removeUserWidget = async (widgetId) => {
                try {
                    
                    // Dispatch action to remove widget from user's widgets
                    await store.dispatch('user/removeUserWidget', widgetId);
                    //console.log(`Widget ${widgetId} removed from user's widgets`);
                } catch (err) {
                    console.error("Error removing widget:", err);
                }
            };

            // Function to handle toggle changes
            const handleToggleChange = async (widget, isEnabled) => {
                if (isEnabled) {
                    await addUserWidget(widget.id);
                } else {
                    await removeUserWidget(widget.id);
                }
            };
            onMounted(async () => {
                try {
                    // Get a list of widgets
                    widgets.value = await widgetService.getWidgets();
                    
                    // Get data of user widgets
                    await store.dispatch('user/getUserWidgets');
                    
                    isLoading.value = false;
                } catch (err) {
                    error.value = err;
                    isLoading.value = false;
                    console.error('[widgetGallery.vue] Error fetching widgets:', err);
                }
            });

            return{
                closeMindUniverse,
                widgets,
                usersWidgets,
                isLoading,
                error,
                isWidgetEnabled,
                handleToggleChange
            };
        }
    }
</script>

<style scoped>

.minduniverse-window {
position: absolute;
top: 0;
left:0;
width: 100%;
height: 100vh;
background-color: rgba(0, 0, 0, 0.75);
z-index: 1003;
}
.minduniverse-window-container {
    display: flex;  
    flex-direction: column;
    min-width: 250px;
    max-width: 98%;
    max-height: 95vh; /* Add this to limit the modal height */
    margin: 2vh auto; /* Center it vertically with some space */
    background-color: white;
    overflow: hidden;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
    border-radius: 8px; /* Optional: for rounded corners */
}

.minduniverse-window-header {
display: flex;
justify-content: space-between;
align-items: center;
padding: 15px 20px;
border-bottom: 1px solid #eee;
}

.minduniverse-window-header h1 {
margin: 0;
font-size: 24px;
font-weight: bold;
}

.close-btn {
background: none;
border: none;
font-size: 24px;
cursor: pointer;
padding: 0;
margin: 0;
}

.tabs {
display: flex;
border-bottom: 1px solid #eee;
}

.tab {
padding: 12px 20px;
background: none;
border: none;
cursor: pointer;
font-size: 14px;
position: relative;
}

.tab.active {
font-weight: bold;
}

.tab.active::after {
content: '';
position: absolute;
bottom: 0;
left: 20px;
right: 20px;
height: 2px;
background-color: #000;
}

.search-container {
display: flex;
align-items: center;
margin: 20px;
padding: 10px;
border: 1px solid #ddd;
border-radius: 25px;
}

.search-icon {
margin: 0 10px;
}

.search-input {
flex: 1;
border: none;
outline: none;
font-size: 16px;
}

.card-container {
    padding: 0 20px 20px 20px;
    overflow-y: auto;
    max-height: calc(100vh - 200px); /* Adjust this value based on your header heights */
    height: 100%;
}

.card {
margin-bottom: 20px;
border: 1px solid #ddd;
border-radius: 5px;
overflow: hidden;
}

.card-image {
background-color: #ddd;
height: 200px;
display: flex;
justify-content: center;
align-items: center;
}

.placeholder-image {
background-color: #333;
width: 50px;
height: 50px;
display: flex;
justify-content: center;
align-items: center;
border-radius: 5px;
}

.image-icon {
color: white;
}

.card-footer {
display: flex;
justify-content: space-between;
align-items: center;
padding: 15px;
}

.card-text h3 {
margin: 0 0 5px 0;
font-size: 18px;
}

.card-text p {
margin: 0;
color: #666;
}

.toggle {
position: relative;
display: inline-block;
width: 50px;
height: 24px;
}

.toggle input {
opacity: 0;
width: 0;
height: 0;
}

.slider {
position: absolute;
cursor: pointer;
top: 0;
left: 0;
right: 0;
bottom: 0;
background-color: #ccc;
transition: .4s;
}

.slider:before {
position: absolute;
content: "";
height: 16px;
width: 16px;
left: 4px;
bottom: 4px;
background-color: white;
transition: .4s;
}

input:checked + .slider {
background-color: #333;
}

input:focus + .slider {
box-shadow: 0 0 1px #333;
}

input:checked + .slider:before {
transform: translateX(26px);
}

.slider.round {
border-radius: 24px;
}

.slider.round:before {
border-radius: 50%;
}
</style>