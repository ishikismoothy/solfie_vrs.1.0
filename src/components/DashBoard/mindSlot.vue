<!-- mindSlot.vue -->
<template>
  <Teleport to="body">
    <div
      v-if="expandedSlotIndex !== null"
      class="card-window-overlay"
      @click="expandedSlotIndex = null"
    />
  </Teleport>

    <!-- Expanded card also teleported to body -->
  <Teleport to="body">
    <mind-slot-card
      v-if="expandedSlotIndex !== null"
      :key="`expanded-${expandedSlotIndex}`"
      :mindslot="mindspace.mindslot[expandedSlotIndex]"
      :index="expandedSlotIndex"
      :getItemImage="getItemImage"
      :getItemName="getItemName"
      :expanded="true"
      @delete="deleteSlot"
      @name-change="saveSlotName"
      @click="handleSlotClick"
      class="expanded-teleported"
    />
  </Teleport>

  <div class="return-to-myself">
    <h2 class="title">Return to myself</h2>

    <!-- Mind Slots Container -->
    <div class="mind-slots">
      <mind-slot-card
        v-for="(mindslot, index) in mindspace.mindslot"
        :key="`normal-${index}`"
        :mindslot="mindslot"
        :index="index"
        :getItemImage="getItemImage"
        :getItemName="getItemName"
        :expanded="false"
        v-show="expandedSlotIndex !== index"
        @delete="deleteSlot"
        @name-change="saveSlotName"
        @click="handleSlotClick"
      />
    </div>

  <!-- Add Slot Button -->
  <button @click="addSlot('buttonChild')" class="add-slot-btn">
    Add New Slot
  </button>

    <!-- <button
      v-if="mindspace.mindslot.length < 5"
      @click="addSlot"
      class="add-slot-btn"
    >
      Add a new slot ({{ 5 - mindspace.mindslot.length }} Remaining)
    </button> -->

    <!-- Listen for the event emitted by the ItemWindow component -->
    <!--
    <ItemWindow
      :is-open="showItemWindowFromMindSlot"
      @addMindslot="addSlot" />-->

  </div>
</template>

  <script>
  import { ref, computed, onMounted, onBeforeUnmount, watch, } from 'vue'
  import { useStore } from 'vuex';
  import { mindspaceService } from '@/firebase/firebaseMindSpace';
  import emitter from '@/eventBus';
  import MindSlotCard from './mindSlotCard.vue'

  //import ItemWindow from '@/components/ItemWindow/itemWindow.vue';
  //import { db } from '@/firebase/config' // Adjust path as needed

  export default {
    name: 'mindSlot',
    components: {
      MindSlotCard,
    },
    setup() {
        const store = useStore();
        const currentUser = computed(() => store.state.user.user.uid);
        const currentMindSpaceId = computed(() => store.state.mindspace.currentMindSpaceId);
        const showItemWindowFromMindSlot = computed(() => store.state.user.modalControl.showItemWindow);
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
                console.log("[mindSlot.vue/fetchMindspaceSlots] Slots: ",[...mindspace.value.mindslot]);
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
            //console.log("[mindSlot.vue/fetchItem] TRIGGERED ");
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

        // Old Add new slot Function
        // const addSlot = async () => {
        //     if (mindspace.value.mindslot.length >= 5) return;

        //     const newSlot = {
        //         name: 'New Slot',
        //         item: null
        //     };

        //     // Create a new mindspace object that preserves all existing properties
        //     const updatedMindspace = {
        //         ...mindspace.value,                      // Spread existing properties (including name)
        //         mindslot: [...mindspace.value.mindslot]  // Create new array with existing slots
        //     };

        //     // Add the new slot
        //     updatedMindspace.mindslot.push(newSlot);

        //     // Update the ref
        //     mindspace.value = updatedMindspace;

        //     // Save to Firebase
        //     await updateMindspace();
        // };

        async function addSlot(title, itemId) {
          if (mindspace.value.mindslot.length >= 5) return;
          console.log('Adding new slot with title:', title);
          mindspace.value.mindslot = [
            ...mindspace.value.mindslot,
            { name: title || 'New Slot', item: itemId }
          ];
          await updateMindspace();  // Save changes to backend
        }

        function handleAddMindslot({ title, itemId }) {
          addSlot(title, itemId);
        }

        onMounted(() => {
          emitter.on('addMindslot', handleAddMindslot);
        });
        onBeforeUnmount(() => {
          emitter.off('addMindslot', handleAddMindslot);
        });

        // Delete slot
        const deleteSlot = async (index) => {
          console.log(`deleting slot ${index} from mindspace`)
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
        const saveSlotName = async ({ index, newName }) => {
          if (newName.trim()) {
            mindspace.value.mindslot[index].name = newName;
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
            //console.log("[mindSlot.vue] Found uid: ", currentUser.value);
            if (newUserId) {
                await fetchItems();
            }
        });

        watch(currentMindSpaceId, async (newMindSpaceId) => {
            //console.log("[mindSlot.vue] Found MindSpaceId: ", currentMindSpaceId.value);
            if (newMindSpaceId) {
                await fetchMindspaceSlots();
                await fetchItems();
            }
        });

        // Modify onMounted
        onMounted(async () => {
            //await fetchMindspaceSlots();
            // Only fetch items if we have a user ID
            if (currentUser.value) {
                await fetchItems();
            }
        });

        // Expand selected slot

        const expandedSlotIndex = ref(null);

        function handleSlotClick(index) {
          console.log(`Slot ${index} clicked`);

          // Safety check - ensure the mindslot exists
          if (!mindspace.value.mindslot || !mindspace.value.mindslot[index]) {
            console.warn(`Mindslot at index ${index} not found`);
            return;
          }

          const mindslot = mindspace.value.mindslot[index];

          if (expandedSlotIndex.value === index) {
            // Slot already expanded, trigger item window flip
            console.log(`Slot ${index} already expanded, opening item window`);
            emitter.emit('openItemWindow', {
              id: mindslot.item || null,
              title: mindslot.name || 'Unnamed Slot',
              image: mindslot.image || null
            });
          } else {
            console.log(`Expanding slot ${index}`);
            expandedSlotIndex.value = index;
          }
        }

        return {
            mindspace,
            isEditing,
            editingSlotIndex,
            editingSlotName,
            showItemWindowFromMindSlot,
            getItemImage,
            getItemName,
            addSlot,
            deleteSlot,
            startEditing,
            saveSlotName,
            openItemSelection,
            handleSlotClick,
            expandedSlotIndex,
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

  /* .mind-slot {
    border-radius: 12px;
    overflow: hidden;
    background: #f5f5f5;
  } */

  /* .slot-header {
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
  } */
/*
  .slot-content {
    height: 120px;
    background-size: cover;
    background-position: center;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
  } */

  /* .item-content {
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
  } */

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

  .card-window-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  }

</style>
