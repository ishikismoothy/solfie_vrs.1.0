<!-- ReturnToMyself.vue -->
<template>
    <div class="return-to-myself">
      <h2 class="title">Return to myself</h2>
      
      <!-- Mind Slots Container -->
      <div class="mind-slots">
        <div v-for="(slot, index) in mindspace.mindslot" :key="index" class="mind-slot">
          <!-- Slot Header with Edit Option -->
          <div class="slot-header">
            <input 
              v-if="isEditing && editingSlotIndex === index"
              v-model="editingSlotName"
              @blur="saveSlotName(index)"
              @keyup.enter="saveSlotName(index)"
              class="slot-name-input"
            />
            <h3 v-else class="slot-name" @click="startEditing(index, slot.name)">
              {{ slot.name }}
            </h3>
            <button @click="deleteSlot(index)" class="delete-btn">×</button>
          </div>
  
          <!-- Slot Content -->
          <div
            class="slot-content"
            @click="openItemSelection(index)"
            :style="{ backgroundImage: getItemImage(slot.item) }"
          >
            <div v-if="getItemName(slot.item)" class="item-content">
              {{ getItemName(slot.item) }}
            </div>
            <div v-else class="empty-slot">
              Click to select item
            </div>
          </div>
        </div>
      </div>
  
      <!-- Add Slot Button -->
      <button 
        v-if="mindspace.mindslot.length < 5"
        @click="addSlot" 
        class="add-slot-btn"
      >
        Add a new slot ({{ 5 - mindspace.mindslot.length }} Remaining)
      </button>
    </div>
  </template>
  
  <script>
  import { ref, computed, onMounted, watch } from 'vue'
  import { useStore } from 'vuex';
  import { mindspaceService } from '@/firebase/firebaseMindSpace';
  //import { db } from '@/firebase/config' // Adjust path as needed
  
  export default {
    name: 'ReturnToMyself',
    setup() {
        const store = useStore();
        const currentUser = computed(() => store.state.user.user.uid);
        const currentMindSpaceId = computed(() => store.state.mindspace.currentMindSpaceId);
        const mindspace = ref({
            name: '',
            mindslot: []
        })
        const items = ref({})
        const isEditing = ref(false)
        const editingSlotIndex = ref(null)
        const editingSlotName = ref('')
    
        // Fetch mindspace slots with name preservation
        const fetchMindspaceSlots = async () => {
          console.log("[mindSlot.vue/fetchMindspaceSlots] TRIGGERED ");
            try {
                if (!currentMindSpaceId.value) {
                    console.warn('[fetchMindspaceSlots] No mindspace ID available');
                    return;
                }

                const data = await mindspaceService.fetchMindspaceSlots(currentMindSpaceId.value);
                mindspace.value = {
                    ...data, // This preserves all existing data including name
                    mindslot: data.mindslot || []
                };
            } catch (error) {
                console.error('[fetchMindspaceSlots] Error fetching mindspace slots:', error);
                // Preserve existing data on error
                mindspace.value = {
                    ...mindspace.value,
                    mindslot: mindspace.value.mindslot || []
                };
            }
        };

        // Fetch items
        const fetchItems = async () => {
            console.log("[mindSlot.vue/fetchItem] TRIGGERED ");
            try {
                // Check if user ID exists
                if (!currentUser.value) {
                    console.log('Waiting for user ID...');
                    // Wait a bit and try again
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return fetchItems(); // Retry
                }
                
                items.value = await mindspaceService.fetchItemsForSlots(currentUser.value);
            } catch (error) {
                console.error('Error fetching items:', error);
            }
        };
    
        // Get item image
        const getItemImage = async(itemId) => {
            return await mindspaceService.getItemImage(itemId, items);
        };

        // Get item name
        const getItemName = async(itemId) => {
            return await mindspaceService.getItemName(itemId, items);
        };
    
        // Add new slot
        const addSlot = async () => {
            if (mindspace.value.mindslot.length >= 5) return;

            const newSlot = {
                name: 'New Slot',
                item: null
            };

            // Create a new mindspace object that preserves all existing properties
            const updatedMindspace = {
                ...mindspace.value,                      // Spread existing properties (including name)
                mindslot: [...mindspace.value.mindslot]  // Create new array with existing slots
            };
            
            // Add the new slot
            updatedMindspace.mindslot.push(newSlot);
            
            // Update the ref
            mindspace.value = updatedMindspace;
            
            // Save to Firebase
            await updateMindspace();
        };

        // Delete slot
        const deleteSlot = async (index) => {
            mindspace.value.mindslot.splice(index, 1);
            await updateMindspace();
        };

        // Start editing slot name
        const startEditing = (index, name) => {
            isEditing.value = true;
            editingSlotIndex.value = index;
            editingSlotName.value = name;
        };

        // Save slot name
        const saveSlotName = async (index) => {
            if (editingSlotName.value.trim()) {
                mindspace.value.mindslot[index].name = editingSlotName.value;
                await updateMindspace();
            }
            isEditing.value = false;
            editingSlotIndex.value = null;
            editingSlotName.value = '';
        };

        // Update mindspace while preserving name
        const updateMindspace = async () => {
            try {
                const updatedData = {
                    //name: mindspace.value.name || '',  // Ensure name exists
                    mindslot: mindspace.value.mindslot || [],  // Ensure mindslot exists
                    ...mindspace.value  // Include any other properties
                };
                
                await mindspaceService.updateMindspaceSlots(
                    currentMindSpaceId.value, 
                    updatedData
                );
            } catch (error) {
                console.error('Error updating mindspace:', error);
            }
        };

        // Open item selection
        const openItemSelection = (/*slotIndex*/) => {
            // Emit event to parent to handle item selection
            //emit('open-item-selection', slotIndex);
        };

        // Add a watch for currentUser
        watch(currentUser, async (newUserId) => {
            console.log("[mindSlot.vue] Found uid: ", currentUser.value);
            if (newUserId) {
                await fetchItems();
            }
        });

        watch(currentMindSpaceId, async (newMindSpaceId) => {
            console.log("[mindSlot.vue] Found uid: ", currentMindSpaceId.value);
            if (newMindSpaceId) {
                await fetchMindspaceSlots();
                await fetchItems();
            }
        });

        // Modify onMounted
        onMounted(async () => {
            await fetchMindspaceSlots();
            // Only fetch items if we have a user ID
            if (currentUser.value) {
                await fetchItems();
            }
        });
    
        return {
            mindspace,
            isEditing,
            editingSlotIndex,
            editingSlotName,
            getItemImage,
            getItemName,
            addSlot,
            deleteSlot,
            startEditing,
            saveSlotName,
            openItemSelection
        }
    }
  }
  </script>
  
  <style scoped>
  .return-to-myself {
    padding: 20px;
    background: #fff;
    border-radius: 30px;
    margin-bottom: 20px;
  }
  
  .title {
    font-size: 24px;
    margin-bottom: 20px;
  }
  
  .mind-slots {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .mind-slot {
    border-radius: 12px;
    overflow: hidden;
    background: #f5f5f5;
  }
  
  .slot-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background: rgba(0, 0, 0, 0.05);
  }
  
  .slot-name-input {
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    width: 80%;
  }
  
  .slot-content {
    height: 120px;
    background-size: cover;
    background-position: center;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
  }
  
  .item-content {
    background: rgba(0, 0, 0, 0.5);
    color: white;
    padding: 8px;
    border-radius: 4px;
  }
  
  .empty-slot {
    color: #666;
  }
  
  .delete-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 20px;
    padding: 0 8px;
  }
  
  .add-slot-btn {
    width: 100%;
    padding: 12px;
    margin-top: 15px;
    background: #f0f0f0;
    border: 2px dashed #ccc;
    border-radius: 8px;
    cursor: pointer;
    color: #666;
  }
  
  .add-slot-btn:hover {
    background: #e5e5e5;
  }
  </style>