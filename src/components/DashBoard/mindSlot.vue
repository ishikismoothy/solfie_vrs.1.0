<!-- Updated mindSlot.vue -->
<template>
  <Teleport to="body">
    <div
      v-if="expandedSlotIndex !== null"
      class="card-window-overlay"
      @click="handleOverlayClick"
    />
  </Teleport>

  <!-- Expanded card teleported to body -->
  <Teleport to="body">
    <ItemWindow
      v-if="expandedSlotIndex !== null"
      :key="`expanded-${expandedSlotIndex}`"
      :mindslot="mindspace.mindslot[expandedSlotIndex]"
      :index="expandedSlotIndex"
      :getItemImage="getItemImage"
      :getItemName="getItemName"
      :expanded="true"
      :initialFlipped="openDirectlyToItem"
      :openedFromMindslot="true"
      @delete="deleteSlot"
      @name-change="saveSlotName"
      @click="handleSlotClick"
      @close="closeExpandedCard"
      class="expanded-teleported"
    />
  </Teleport>

  <div class="return-to-myself">
    <h2 class="title">Return to myself</h2>

    <!-- Mind Slots Container -->
    <div class="mind-slots">
      <ItemWindow
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
        @slot-icons-changed="handleSlotIconsChanged"
        @click="handleSlotClick"
      />
    </div>

    <!-- Add Slot Button -->
    <button @click="addSlot('New Slot')" class="add-slot-btn">
      Add New Slot
    </button>

    <!-- Slot Selection Modal -->
    <Teleport to="body">
      <div v-if="showSlotSelectionModal" class="slot-selection-overlay" @click="closeSlotSelection">
        <div class="slot-selection-modal" @click.stop>
          <h3>Add "{{ pendingItem.title }}" to Mind Slots</h3>

          <!-- Show empty slots if they exist -->
          <div v-if="pendingItem.emptySlots && pendingItem.emptySlots.length > 0" class="empty-slots-section">
            <h4>Fill an existing empty slot:</h4>
            <div class="empty-slots-list">
              <button
                v-for="slot in pendingItem.emptySlots"
                :key="slot.slotIndex"
                @click="fillExistingSlot(slot.slotIndex)"
                class="empty-slot-option"
              >
                Slot {{ slot.slotIndex + 1 }}: "{{ slot.name }}"
              </button>
            </div>
            <div class="divider">OR</div>
          </div>

          <!-- Option to create new slot -->
          <div class="new-slot-section">
            <button
              @click="createNewSlot"
              class="new-slot-option"
              :disabled="pendingItem.totalSlots >= 5"
            >
              <span v-if="pendingItem.totalSlots >= 5">
                Maximum slots reached (5/5)
              </span>
              <span v-else>
                Create New Slot ({{ 5 - pendingItem.totalSlots }} remaining)
              </span>
            </button>
          </div>

          <button @click="closeSlotSelection" class="cancel-btn">Cancel</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import { useStore } from 'vuex'
  import { mindspaceService } from '@/firebase/firebaseMindSpace'
  import emitter from '@/eventBus'
  import ItemWindow from '@/./components/ItemWindow/itemWindow.vue'

  const store = useStore()
  const currentUser = computed(() => store.state.user.user.uid)
  const currentMindSpaceId = computed(() => store.state.mindspace.currentMindSpaceId)

  // Reactive variables
  const mindspace = ref({
    name: '',
    mindslot: []
  })
  const items = ref({})
  const expandedSlotIndex = ref(null)
  const openDirectlyToItem = ref(false)
  const showSlotSelectionModal = ref(false)
  const pendingItem = ref({
    title: '',
    itemId: null,
    emptySlots: [],
    totalSlots: 0
  })

  // Fetch mindspace slots
  const fetchMindspaceSlots = async () => {
    try {
      if (!currentMindSpaceId.value) {
        console.warn('[fetchMindspaceSlots] No mindspace ID available')
        return
      }

      const data = await mindspaceService.fetchMindspaceSlots(currentMindSpaceId.value)
      mindspace.value = {
        ...data,
        mindslot: data.mindslot || []
      }
      console.log("[mindSlot.vue/fetchMindspaceSlots] Slots: ", [...mindspace.value.mindslot])
    } catch (error) {
      console.error('[fetchMindspaceSlots] Error fetching mindspace slots:', error)
      mindspace.value = {
        ...mindspace.value,
        mindslot: mindspace.value.mindslot || []
      }
    }
  }

  // Fetch items
  const fetchItems = async () => {
    try {
      if (!currentUser.value) {
        console.log('Waiting for user ID...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        return fetchItems()
      }

      items.value = await mindspaceService.fetchItemsForSlots(currentUser.value)
    } catch (error) {
      console.error('Error fetching items:', error)
    }
  }

  // Get item image/name functions
  const getItemImage = async (itemId) => {
    return await mindspaceService.getItemImage(itemId, items)
  }

  const getItemName = async (itemId) => {
    return await mindspaceService.getItemName(itemId, items)
  }

  // Slot management functions
  async function addSlot(title, itemId) {
    if (mindspace.value.mindslot.length >= 5) return
    console.log('Adding new slot with title:', title)
    mindspace.value.mindslot = [
      ...mindspace.value.mindslot,
      { name: title || 'New Slot', item: itemId }
    ]
    await updateMindspace()
  }

  // Handle slot click
  function handleSlotClick(index) {
    console.log(`Slot ${index} clicked`)

    if (expandedSlotIndex.value === index) {
      // Already expanded, close it
      expandedSlotIndex.value = null
    } else {
      // Expand this slot
      expandedSlotIndex.value = index
      openDirectlyToItem.value = false
    }
  }

  // Handle overlay click
  function handleOverlayClick() {
    expandedSlotIndex.value = null
    openDirectlyToItem.value = false
  }

  // Close expanded card
  function closeExpandedCard() {
    expandedSlotIndex.value = null
    openDirectlyToItem.value = false
  }

  // Delete slot
  const deleteSlot = async (index) => {
    console.log(`deleting slot ${index} from mindspace`)
    mindspace.value.mindslot.splice(index, 1)
    await updateMindspace()
  }

  // Save slot name
  const saveSlotName = async ({ index, newName }) => {
    if (newName.trim()) {
      mindspace.value.mindslot[index].name = newName
      await updateMindspace()
    }
  }

  // Update mindspace
  const updateMindspace = async () => {
    try {
      const updatedData = {
        mindslot: mindspace.value.mindslot || [],
        ...mindspace.value
      }

      await mindspaceService.updateMindspaceSlots(
        currentMindSpaceId.value,
        updatedData
      )
    } catch (error) {
      console.error('Error updating mindspace:', error)
    }
  }

  function handleRemoveMindslot({ itemId, slotIndex }) {
    console.log('Removing item from mindslot:', { itemId, slotIndex })
    // Remove the item from the slot but keep the slot
    mindspace.value.mindslot[slotIndex] = {
      ...mindspace.value.mindslot[slotIndex],
      item: null
    }

    updateMindspace()
  }

  async function handleSlotIconsChanged({ index, icons }) {
    console.log(`Updating icons for slot ${index}:`, icons)

    mindspace.value.mindslot[index] = {
      ...mindspace.value.mindslot[index],
      slotIcons: icons
    }

    await updateMindspace()
  }

  // Modal functions
  function closeSlotSelection() {
    showSlotSelectionModal.value = false
    pendingItem.value = {
      title: '',
      itemId: null,
      emptySlots: [],
      totalSlots: 0
    }
  }

  async function fillExistingSlot(slotIndex) {
    console.log(`Filling existing slot ${slotIndex} with item:`, pendingItem.value)
    mindspace.value.mindslot[slotIndex] = {
      ...mindspace.value.mindslot[slotIndex],
      item: pendingItem.value.itemId
    }
    await updateMindspace()
    closeSlotSelection()
  }

  async function createNewSlot() {
    console.log('Creating new slot with item:', pendingItem.value)
    if (mindspace.value.mindslot.length >= 5) {
      alert('Maximum of 5 mind slots reached. Cannot add more slots.')
      closeSlotSelection()
      return
    }
    mindspace.value.mindslot = [
      ...mindspace.value.mindslot,
      {
        name: 'New Slot',
        item: pendingItem.value.itemId
      }
    ]
    await updateMindspace()
    closeSlotSelection()
  }

  // Handle modal trigger from +MIND button
  function handleShowMindslotModal({ title, itemId }) {
    console.log('Showing mindslot modal for:', { title, itemId })

    const currentSlots = mindspace.value.mindslot || []

    if (currentSlots.length >= 5) {
      alert('Maximum of 5 mind slots reached. Cannot add more slots.')
      return
    }

    const emptySlots = currentSlots
      .map((slot, index) => ({ ...slot, slotIndex: index }))
      .filter(slot => !slot.item || slot.item === null || slot.item === undefined)

    console.log('Found empty slots:', emptySlots)
    console.log('Total slots:', currentSlots.length)

    pendingItem.value = {
      title,
      itemId,
      emptySlots,
      totalSlots: currentSlots.length
    }

    console.log('Showing slot selection modal')
    showSlotSelectionModal.value = true
  }

  // Handle opening item directly from event bus
  function handleOpenItemWindow({ id, title }) {
    console.log('Opening item window for:', { id, title })

    // Find the slot with this item
    const slotIndex = mindspace.value.mindslot.findIndex(slot => slot.item === id)

    if (slotIndex !== -1) {
      expandedSlotIndex.value = slotIndex
      openDirectlyToItem.value = true
    } else {
      console.warn('Item not found in any slot:', id)
    }
  }

  // Watchers
  watch(currentUser, async (newUserId) => {
    if (newUserId) {
      await fetchItems()
    }
  })

  watch(currentMindSpaceId, async (newMindSpaceId) => {
    if (newMindSpaceId) {
      await fetchMindspaceSlots()
      await fetchItems()
    }
  })

  // Lifecycle hooks
  onMounted(async () => {
    emitter.on('showMindslotModal', handleShowMindslotModal)
    emitter.on('openItemWindow', handleOpenItemWindow)
    emitter.on('removeMindslot', handleRemoveMindslot)

    if (currentUser.value) {
      await fetchItems()
    }
  })

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

  .expanded-teleported {
    z-index: 2001;
  }

  /* Modal Styles */
  .slot-selection-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }

  .slot-selection-modal {
    background: white;
    border-radius: 15px;
    padding: 25px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }

  .slot-selection-modal h3 {
    margin: 0 0 20px 0;
    font-size: 18px;
    color: #333;
    text-align: center;
  }

  .slot-selection-modal h4 {
    margin: 0 0 15px 0;
    font-size: 14px;
    color: #666;
  }

  .empty-slots-section {
    margin-bottom: 20px;
  }

  .empty-slots-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 15px;
  }

  .empty-slot-option {
    background: #f0f8ff;
    border: 2px solid #4a90e2;
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    font-size: 14px;
  }

  .empty-slot-option:hover {
    background: #e6f3ff;
    transform: translateY(-1px);
  }

  .divider {
    text-align: center;
    color: #999;
    font-weight: bold;
    margin: 15px 0;
    position: relative;
  }

  .divider::before,
  .divider::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 40%;
    height: 1px;
    background: #ddd;
  }

  .divider::before {
    left: 0;
  }

  .divider::after {
    right: 0;
  }

  .new-slot-section {
    margin-bottom: 20px;
  }

  .new-slot-option {
    background: #f0fff0;
    border: 2px solid #4caf50;
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
    font-size: 14px;
  }

  .new-slot-option:hover:not(:disabled) {
    background: #e8ffe8;
    transform: translateY(-1px);
  }

  .new-slot-option:disabled {
    background: #f5f5f5;
    border-color: #ccc;
    color: #999;
    cursor: not-allowed;
  }

  .cancel-btn {
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 10px 20px;
    cursor: pointer;
    width: 100%;
    margin-top: 10px;
    transition: background 0.2s;
  }

  .cancel-btn:hover {
    background: #eee;
  }
</style>
