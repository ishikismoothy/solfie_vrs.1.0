<!-- Clean mindSlot.vue -->
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
      :directIconIndex="directIconIndex"
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
        @icon-direct-click="handleDirectIconClick"
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

          <!-- Show available slots if they exist -->
          <div v-if="pendingItem.availableSlots && pendingItem.availableSlots.length > 0" class="available-slots-section">
            <h4>Add to existing slot:</h4>
            <div class="available-slots-list">
              <button
                v-for="slot in pendingItem.availableSlots"
                :key="`${slot.slotIndex}-${slot.type}`"
                @click="addToExistingSlot(slot)"
                class="available-slot-option"
                :class="slot.type"
              >
                <div class="slot-info">
                  <strong>Slot {{ slot.slotIndex + 1 }}: "{{ slot.name }}"</strong>
                  <span class="slot-type">{{ slot.typeLabel }}</span>
                </div>
              </button>
            </div>
            <div class="divider">OR</div>
          </div>

          <!-- Option to create new slot -->
          <div class="new-slot-section">
            <h4>Create new slot:</h4>
            <div class="new-slot-options">
              <button
                @click="createNewSlot('single')"
                class="new-slot-option single-item"
                :disabled="pendingItem.totalSlots >= 5"
              >
                <div class="option-content">
                  <strong>Single Item Slot</strong>
                  <small>This item only</small>
                </div>
              </button>

              <button
                @click="createNewSlot('multi')"
                class="new-slot-option multi-item"
                :disabled="pendingItem.totalSlots >= 5"
              >
                <div class="option-content">
                  <strong>Multi-Item Slot</strong>
                  <small>Up to 3 items</small>
                </div>
              </button>
            </div>

            <div v-if="pendingItem.totalSlots >= 5" class="max-slots-warning">
              Maximum slots reached (5/5)
            </div>
            <div v-else class="slots-remaining">
              {{ 5 - pendingItem.totalSlots }} slot(s) remaining
            </div>
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
  const currentUser = computed(() => store.state.user?.user?.uid)
  const currentMindSpaceId = computed(() => store.state.mindspace?.currentMindSpaceId)

  // Reactive variables
  const mindspace = ref({
    name: '',
    mindslot: []
  })
  const items = ref({})
  const expandedSlotIndex = ref(null)
  const openDirectlyToItem = ref(false)
  const directIconIndex = ref(-1)
  const showSlotSelectionModal = ref(false)
  const pendingItem = ref({
    title: '',
    itemId: null,
    availableSlots: [],
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

      const cleanedData = {
        ...data,
        mindslot: (data.mindslot || []).map(slot => ({
          name: slot.name || 'New Slot',
          item: slot.item || null,
          iconItems: slot.iconItems || [null, null, null],
          slotIcons: slot.slotIcons || [null, null, null]
        }))
      }

      mindspace.value = cleanedData
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
  const addSlot = async (title, itemId, slotType = 'single') => {
    if (mindspace.value.mindslot.length >= 5) return

    const newSlot = {
      name: title || 'New Slot',
      item: slotType === 'single' ? (itemId || null) : null,
      iconItems: slotType === 'multi' ?
        (itemId ? [itemId, null, null] : [null, null, null]) :
        [null, null, null],
      slotIcons: [null, null, null]
    }

    mindspace.value.mindslot = [...mindspace.value.mindslot, newSlot]
    await updateMindspace()
  }

  // Handle slot click
  const handleSlotClick = (index) => {
    if (expandedSlotIndex.value === index) {
      expandedSlotIndex.value = null
    } else {
      expandedSlotIndex.value = index
      openDirectlyToItem.value = false
      directIconIndex.value = -1
    }
  }

  // Handle direct icon click
  const handleDirectIconClick = (slotIndex, iconIndex) => {
    const slot = mindspace.value.mindslot[slotIndex]
    const iconItems = slot.iconItems || [null, null, null]
    const itemId = iconItems[iconIndex]

    if (itemId) {
      expandedSlotIndex.value = slotIndex
      openDirectlyToItem.value = true
      directIconIndex.value = iconIndex
    }
  }

  // Handle overlay click
  const handleOverlayClick = () => {
    expandedSlotIndex.value = null
    openDirectlyToItem.value = false
    directIconIndex.value = -1
  }

  // Close expanded card
  const closeExpandedCard = () => {
    expandedSlotIndex.value = null
    openDirectlyToItem.value = false
    directIconIndex.value = -1
  }

  // Delete slot
  const deleteSlot = async (index) => {
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
      const cleanMindslots = (mindspace.value.mindslot || []).map(slot => ({
        name: slot.name || 'New Slot',
        item: slot.item || null,
        iconItems: slot.iconItems || [null, null, null],
        slotIcons: slot.slotIcons || [null, null, null]
      }))

      const updatedData = {
        ...mindspace.value,
        mindslot: cleanMindslots
      }

      await mindspaceService.updateMindspaceSlots(currentMindSpaceId.value, updatedData)
    } catch (error) {
      console.error('Error updating mindspace:', error)
    }
  }

  const handleSlotIconsChanged = async ({ index, icons }) => {
    mindspace.value.mindslot[index] = {
      ...mindspace.value.mindslot[index],
      slotIcons: icons
    }
    await updateMindspace()
  }

  // Helper function to determine slot availability
  const getSlotAvailability = (slot, slotIndex) => {
    const availableSlots = []

    // Check if it's a single-item slot that's empty
    if (!slot.item && (!slot.iconItems || slot.iconItems.every(item => !item))) {
      availableSlots.push({
        slotIndex,
        name: slot.name,
        type: 'empty',
        typeLabel: 'Empty slot'
      })
    }

    // Check if it's a multi-item slot with available spaces
    if (slot.iconItems && Array.isArray(slot.iconItems)) {
      const emptyIconSlots = slot.iconItems.filter(item => !item).length
      // Only add if there are empty spaces AND it's not also a single-item slot
      if (emptyIconSlots > 0 && !slot.item) {
        availableSlots.push({
          slotIndex,
          name: slot.name,
          type: 'multi-item',
          typeLabel: `Multi-item slot (${emptyIconSlots} space${emptyIconSlots > 1 ? 's' : ''} available)`
        })
      }
    }

    return availableSlots
  }

  // Modal functions
  const closeSlotSelection = () => {
    showSlotSelectionModal.value = false
    pendingItem.value = {
      title: '',
      itemId: null,
      availableSlots: [],
      totalSlots: 0
    }
  }

  const addToExistingSlot = async (slot) => {
    const slotData = mindspace.value.mindslot[slot.slotIndex]

    if (slot.type === 'empty') {
      mindspace.value.mindslot[slot.slotIndex] = {
        ...slotData,
        item: pendingItem.value.itemId,
        iconItems: [null, null, null]
      }
    } else if (slot.type === 'multi-item') {
      const iconItems = [...slotData.iconItems]
      const firstEmptyIndex = iconItems.findIndex(item => !item)
      if (firstEmptyIndex !== -1) {
        iconItems[firstEmptyIndex] = pendingItem.value.itemId
        mindspace.value.mindslot[slot.slotIndex] = {
          ...slotData,
          item: null,
          iconItems
        }
      }
    }

    await updateMindspace()
    closeSlotSelection()
  }

  const createNewSlot = async (slotType) => {
    if (mindspace.value.mindslot.length >= 5) {
      alert('Maximum of 5 mind slots reached. Cannot add more slots.')
      closeSlotSelection()
      return
    }

    await addSlot('New Slot', pendingItem.value.itemId, slotType)
    closeSlotSelection()
  }

  // Handle modal trigger from +MIND button
  const handleShowMindslotModal = ({ title, itemId }) => {
    const currentSlots = mindspace.value.mindslot || []

    if (currentSlots.length >= 5) {
      alert('Maximum of 5 mind slots reached. Cannot add more slots.')
      return
    }

    const availableSlots = []
    currentSlots.forEach((slot, index) => {
      const slotAvailability = getSlotAvailability(slot, index)
      availableSlots.push(...slotAvailability)
    })

    pendingItem.value = {
      title,
      itemId,
      availableSlots,
      totalSlots: currentSlots.length
    }

    showSlotSelectionModal.value = true
  }

  // Handle opening item directly from event bus
  const handleOpenItemWindow = ({ id }) => {
    const slotIndex = mindspace.value.mindslot.findIndex(slot => {
      if (slot.item === id) return true
      if (slot.iconItems && slot.iconItems.includes(id)) return true
      return false
    })

    if (slotIndex !== -1) {
      expandedSlotIndex.value = slotIndex
      openDirectlyToItem.value = true
    } else {
      console.warn('Item not found in any slot:', id)
    }
  }

  const handleRemoveMindslot = ({ slotIndex, iconIndex }) => {
    const slot = mindspace.value.mindslot[slotIndex]

    if (iconIndex !== undefined) {
      const iconItems = [...slot.iconItems]
      iconItems[iconIndex] = null
      mindspace.value.mindslot[slotIndex] = { ...slot, iconItems }
    } else {
      mindspace.value.mindslot[slotIndex] = { ...slot, item: null }
    }

    updateMindspace()
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
  transition: background 0.2s ease;
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
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
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

.available-slots-section {
  margin-bottom: 20px;
}

.available-slots-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.available-slot-option {
  background: #f0f8ff;
  border: 2px solid #4a90e2;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.available-slot-option:hover {
  background: #e6f3ff;
  transform: translateY(-1px);
}

.available-slot-option.multi-item {
  border-color: #9c4ae2;
  background: #f8f0ff;
}

.available-slot-option.multi-item:hover {
  background: #f0e6ff;
}

.slot-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slot-type {
  font-size: 12px;
  color: #666;
  font-style: italic;
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

.new-slot-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.new-slot-option {
  border: 2px solid;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.new-slot-option:hover:not(:disabled) {
  transform: translateY(-1px);
}

.new-slot-option:disabled {
  background: #f5f5f5;
  border-color: #ccc;
  color: #999;
  cursor: not-allowed;
}

.single-item {
  background: #f0fff0;
  border-color: #4caf50;
}

.single-item:hover:not(:disabled) {
  background: #e8ffe8;
}

.multi-item {
  background: #fff0f8;
  border-color: #e24a90;
}

.multi-item:hover:not(:disabled) {
  background: #ffe6f3;
}

.option-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.option-content small {
  color: #666;
  font-size: 12px;
}

.max-slots-warning {
  text-align: center;
  color: #ff6b6b;
  font-weight: bold;
  font-size: 14px;
}

.slots-remaining {
  text-align: center;
  color: #666;
  font-size: 14px;
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
