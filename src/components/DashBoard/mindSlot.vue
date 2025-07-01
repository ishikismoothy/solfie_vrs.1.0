<!-- Fixed mindSlot.vue -->
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
    <div
      v-show="expandedSlotIndex !== null"
      class="debug-container"
      :class="{ 'has-slot': expandedSlotIndex !== null && mindspace.mindslot[expandedSlotIndex] }"
    >
      <div class="debug-info">
        DEBUG: expandedSlotIndex={{ expandedSlotIndex }},
        openDirectlyToItem={{ openDirectlyToItem }},
        directIconIndex={{ directIconIndex }}
      </div>

      <ItemWindow
        v-if="mindspace.mindslot[expandedSlotIndex]"
        :key="`expanded-${expandedSlotIndex}-${directIconIndex}-${openDirectlyToItem}-${Date.now()}`"
        :mindslot="mindspace.mindslot[expandedSlotIndex]"
        :index="expandedSlotIndex"
        :getItemImage="getItemImage"
        :getItemName="getItemName"
        :items="items"
        :expanded="true"
        :initialFlipped="openDirectlyToItem"
        :openedFromMindslot="true"
        :directIconIndex="directIconIndex"
        @refresh-items="fetchItems"
        @delete="deleteSlot"
        @name-change="saveSlotName"
        @click="handleSlotClick"
        @close="closeExpandedCard"
        @custom-icons-changed="handleCustomIconsChanged"
        class="expanded-teleported"
      />
    </div>
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
        :items="items"
        :expanded="false"
        :expandedSlotIndex="expandedSlotIndex"
        v-show="expandedSlotIndex !== index"
        @refresh-items="fetchItems"
        @delete="deleteSlot"
        @name-change="saveSlotName"
        @slot-icons-changed="handleSlotIconsChanged"
        @click="handleSlotClick"
        @icon-direct-click="handleDirectIconClick"
        @custom-icons-changed="handleCustomIconsChanged"
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
  const preventSlotClick = ref(false) // Add this flag
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
          iconItems: (slot.iconItems || [null, null, null]).map(item => item === undefined ? null : item),
          slotIcons: (slot.slotIcons || [null, null, null]).map(icon => icon === undefined ? null : icon),
          customIcons: (slot.customIcons || [null, null, null]).map(icon => icon === undefined ? null : icon)
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
      console.log('🔍 Items fetched:', items.value) // ADD THIS DEBUG
      console.log('🔍 Item we need:', items.value?.[expandedSlotIndex.value]) // ADD THIS DEBUG
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
      slotIcons: [null, null, null],
      customIcons: [null, null, null]  // Explicitly set to null, not undefined
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

  // Handle icons
  const handleSlotIconsChanged = async ({ index, icons }) => {
    mindspace.value.mindslot[index] = {
      ...mindspace.value.mindslot[index],
      slotIcons: icons
    }
    await updateMindspace()
  }

  const handleCustomIconsChanged = async ({ index, customIcons }) => {
    // Ensure all values are either null or valid strings, never undefined
    const safeCustomIcons = customIcons.map(icon => icon === undefined ? null : icon)

    mindspace.value.mindslot[index] = {
      ...mindspace.value.mindslot[index],
      customIcons: safeCustomIcons
    }
    await updateMindspace()
  }

  // Handle direct icon click - DEBUGGING VERSION
  const handleDirectIconClick = async (slotIndex, iconIndex) => {
    console.log('🔥 handleDirectIconClick START:', slotIndex, iconIndex)

    const slot = mindspace.value.mindslot[slotIndex]
    const iconItems = slot.iconItems || [null, null, null]
    const itemId = iconItems[iconIndex]

    if (!itemId) {
      console.log('❌ NO ITEM ID FOUND!')
      return
    }

    console.log('✅ Item ID found:', itemId)

    // Set values synchronously - no async here
    expandedSlotIndex.value = slotIndex
    openDirectlyToItem.value = true
    directIconIndex.value = iconIndex

    console.log('🎯 Values set - expandedSlotIndex:', expandedSlotIndex.value)
    console.log('🎯 Values set - openDirectlyToItem:', openDirectlyToItem.value)
    console.log('🎯 Values set - directIconIndex:', directIconIndex.value)

    // Prevent any slot clicks for a brief moment
    setTimeout(() => {
      console.log('🔒 Setting preventSlotClick to false')
      preventSlotClick.value = false
    }, 500)

    preventSlotClick.value = true
    console.log('🔒 Setting preventSlotClick to true')

    // Add a small delay to see if timing is the issue
    setTimeout(() => {
      console.log('⏰ After timeout - expandedSlotIndex:', expandedSlotIndex.value)
      console.log('⏰ After timeout - condition check:', expandedSlotIndex.value !== null && !!mindspace.value.mindslot[expandedSlotIndex.value])
    }, 100)
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
        iconItems: (slot.iconItems || [null, null, null]).map(item => item === undefined ? null : item),
        slotIcons: (slot.slotIcons || [null, null, null]).map(icon => icon === undefined ? null : icon),
        customIcons: (slot.customIcons || [null, null, null]).map(icon => icon === undefined ? null : icon)
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

  // DEBUG: Track what's changing expandedSlotIndex
  watch(expandedSlotIndex, (newValue, oldValue) => {
    console.log('📊 expandedSlotIndex changed:', { oldValue, newValue })
    if (newValue === null && oldValue !== null) {
      console.log('❌ expandedSlotIndex was reset to null!')
      console.trace('Stack trace:')
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

<style lang="scss">
@import '@/assets/itemWindowStyle.scss';
@import '@/assets/globalIconStyle.scss';
</style>
