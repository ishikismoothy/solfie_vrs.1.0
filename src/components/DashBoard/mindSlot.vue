<!-- Cleaned mindSlot.vue - Unified icon selection -->
<template>
  <div class="return-to-myself">
    <h2 class="title">Return to myself</h2>

    <!-- Mind Slots Container -->
    <div class="mind-slots">
      <div
        v-for="(mindslot, index) in mindspace.mindslot"
        :key="`slot-${index}`"
        class="mind-slot-card"
        @click="handleSlotClick(index)"
      >
        <div class="slot-header">
          <input
            v-if="editingSlotIndex === index"
            v-model="editingName"
            @blur="saveSlotName(index)"
            @keyup.enter="saveSlotName(index)"
            @click.stop
            class="slot-name-input"
            ref="nameInput"
          />
          <h3 v-else class="slot-name" @click.stop="startEditingName(index)">
            {{ mindslot.name || 'New Slot' }}
          </h3>

          <button
            @click.stop="deleteSlot(index)"
            class="delete-btn"
          >×</button>
        </div>

        <div class="slot-content">
          <!-- Single Item Display -->
          <div v-if="isSingleItemSlot(mindslot) && items[mindslot.item]" class="single-item-content">
            <div
              class="icon-slot has-item clickable single-item-icon"
              @contextmenu.prevent="handleSingleItemRightClick($event, index)"
              @touchstart="handleSingleItemTouchStart($event, index)"
              @touchend="handleSingleItemTouchEnd"
            >
              <!-- Show custom icon if set, otherwise show item name -->
              <div v-if="getSingleItemCustomIcon(mindslot)" class="custom-icon" v-html="getSingleItemCustomIcon(mindslot)"></div>
              <div v-else class="icon-item-name">
                {{ items[mindslot.item]?.name || items[mindslot.item]?.title || 'Unnamed Item' }}
              </div>
            </div>
            <div class="single-item-name">
              {{ items[mindslot.item]?.name || items[mindslot.item]?.title || 'Unnamed Item' }}
            </div>
          </div>

          <!-- Multi-Item or Empty Slot Display -->
          <div v-else class="empty-slot-wrapper">
            <div v-if="!hasAnyItems(mindslot)" class="empty-slot-text">Empty slot</div>

            <IconSlotGrid
              :initialIcons="mindslot.slotIcons || [null, null, null]"
              :iconItems="mindslot.iconItems || [null, null, null]"
              :customIcons="mindslot.customIcons || [null, null, null]"
              :items="items"
              :clickable="false"
              :expanded="false"
              @icons-changed="(icons) => handleSlotIconsChanged({ index, icons })"
              @icon-clicked="(iconIndex) => handleDirectIconClick(index, iconIndex)"
              @icon-right-click="(iconIndex, event) => openIconSelector(event, index, iconIndex)"
              @custom-icon-changed="(customIcons) => handleCustomIconsChanged({ index, customIcons })"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Add Slot Button -->
    <button
      v-if="mindspace.mindslot.length < 5"
      @click="addSlot('New Slot')"
      class="add-slot-btn"
    >
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

    <!-- Icon Selector Modal -->
    <IconSelector
      :isVisible="showIconSelector"
      :position="selectorPosition"
      :hasCurrentIcon="hasCurrentIcon"
      :screenPosition="'left'"
      @close="closeIconSelector"
      @select-icon="handleIconSelection"
    />
  </div>

  <!-- Toast popup for when mindslots are full-->
  <Teleport to="body">
    <div v-if="showToast" class="toast-notification">
      {{ toastMessage }}
    </div>
  </Teleport>

</template>

<script setup>
  import { ref, computed, onMounted, watch, nextTick } from 'vue'
  import { useStore } from 'vuex'
  import { mindspaceService } from '@/firebase/firebaseMindSpace'
  import emitter from '@/eventBus'
  import IconSlotGrid from '@/./components/ItemWindow/iconSlotGrid.vue'
  import IconSelector from '@/./components/ItemWindow/IconSelector.vue'

  const store = useStore()
  const currentUser = computed(() => store.state.user?.user?.uid)
  const currentMindSpaceId = computed(() => store.state.mindspace?.currentMindSpaceId)

  // Reactive state
  const mindspace = ref({
    name: '',
    mindslot: []
  })
  const editingSlotIndex = ref(null)
  const editingName = ref('')
  const showSlotSelectionModal = ref(false)
  const pendingItem = ref({
    title: '',
    itemId: null,
    availableSlots: [],
    totalSlots: 0
  })
  const showToast = ref(false)
  const toastMessage = ref('')

  // Icon selector state
  const showIconSelector = ref(false)
  const selectorPosition = ref({ x: 0, y: 0 })
  const currentSlotIndex = ref(-1)
  const currentIconIndex = ref(-1) // -1 for single item, 0-2 for multi-item
  const hasCurrentIcon = ref(false)

  // Touch handling for long press
  let touchTimer = null
  const longPressDelay = 500

  // Use Vuex store for items - reactive to changes
  const items = computed(() => store.getters['user/getItems'])

  // Helper functions
  const isSingleItemSlot = (mindslot) => {
    return !!(mindslot.item && !hasIconItems(mindslot))
  }

  const hasIconItems = (mindslot) => {
    const iconItems = mindslot.iconItems || [null, null, null]
    return iconItems.some(item => item !== null && item !== undefined)
  }

  const hasAnyItems = (mindslot) => {
    return isSingleItemSlot(mindslot) || hasIconItems(mindslot)
  }

  // Get custom icon for single item from global store
  const getSingleItemCustomIcon = (mindslot) => {
    if (!isSingleItemSlot(mindslot)) return null
    const itemId = mindslot.item
    return itemId ? store.getters['user/getItemCustomIcon'](itemId) : null
  }

  // Single-item icon selection handlers
  const handleSingleItemRightClick = (event, slotIndex) => {
    event.preventDefault()
    openIconSelector(event, slotIndex, -1) // -1 indicates single item
  }

  const handleSingleItemTouchStart = (event, slotIndex) => {
    touchTimer = setTimeout(() => {
      openIconSelector(event.touches[0], slotIndex, -1)
    }, longPressDelay)
  }

  const handleSingleItemTouchEnd = () => {
    if (touchTimer) {
      clearTimeout(touchTimer)
      touchTimer = null
    }
  }

  // Open icon selector
  const openIconSelector = (event, slotIndex, iconIndex) => {
    currentSlotIndex.value = slotIndex
    currentIconIndex.value = iconIndex

    // Get the actual item ID for the icon
    const mindslot = mindspace.value.mindslot[slotIndex]
    let targetItemId = null

    if (iconIndex === -1) {
      // Single item
      targetItemId = mindslot.item
    } else {
      // Multi-item - get item ID from iconItems array
      const iconItems = mindslot.iconItems || [null, null, null]
      targetItemId = iconItems[iconIndex]
    }

    if (!targetItemId) {
      console.warn('No item ID found for icon selection')
      return
    }

    // Check if this item has a custom icon in global store
    hasCurrentIcon.value = !!store.getters['user/getItemCustomIcon'](targetItemId)

    selectorPosition.value = { x: 0, y: 0 }
    showIconSelector.value = true
  }

  // Close icon selector
  const closeIconSelector = () => {
    showIconSelector.value = false
    currentSlotIndex.value = -1
    currentIconIndex.value = -1
    hasCurrentIcon.value = false
  }

  // Handle icon selection
  const handleIconSelection = async (selectedIcon) => {
    if (currentSlotIndex.value >= 0) {
      const mindslot = mindspace.value.mindslot[currentSlotIndex.value]

      // Get the actual item ID for the icon
      let targetItemId = null
      if (currentIconIndex.value === -1) {
        // Single item
        targetItemId = mindslot.item
      } else {
        // Multi-item - get item ID from iconItems array
        const iconItems = mindslot.iconItems || [null, null, null]
        targetItemId = iconItems[currentIconIndex.value]
      }

      if (!targetItemId) {
        console.warn('No item ID found for icon update')
        closeIconSelector()
        return
      }

      // Update the global icon store
      try {
        await store.dispatch('user/setItemCustomIcon', {
          itemId: targetItemId,
          customIcon: selectedIcon?.svg || null
        })
        console.log('✅ Icon updated globally for item:', targetItemId)
      } catch (error) {
        console.error('❌ Error updating icon:', error)
      }
    }

    closeIconSelector()
  }

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

  // Handle slot click - emit to unified system
  const handleSlotClick = (index) => {
    const mindslot = mindspace.value.mindslot[index]
    console.log('🎯 Slot clicked, opening unified window for:', mindslot.name)

    emitter.emit('openUnifiedItemWindow', {
      mindslot,
      index,
      expanded: true,
      initialFlipped: false,
      openedFromMindslot: true,
      directIconIndex: -1,
      expandedSlotIndex: null
    })
  }

  // Handle direct icon click - emit to unified system
  const handleDirectIconClick = (slotIndex, iconIndex) => {
    const slot = mindspace.value.mindslot[slotIndex]
    const iconItems = slot.iconItems || [null, null, null]
    const itemId = iconItems[iconIndex]

    if (!itemId) {
      console.log('❌ NO ITEM ID FOUND!')
      return
    }

    console.log('✅ Icon clicked, opening unified window for item:', itemId)

    emitter.emit('openUnifiedItemWindow', {
      mindslot: slot,
      index: slotIndex,
      expanded: true,
      initialFlipped: true,
      openedFromMindslot: true,
      directIconIndex: iconIndex,
      expandedSlotIndex: null
    })
  }

  // Name editing
  const startEditingName = (index) => {
    editingSlotIndex.value = index
    editingName.value = mindspace.value.mindslot[index].name || 'New Slot'
    nextTick(() => {
      // Focus the input if needed
    })
  }

  const saveSlotName = (index) => {
    editingSlotIndex.value = null
    if (editingName.value.trim() !== mindspace.value.mindslot[index].name) {
      mindspace.value.mindslot[index].name = editingName.value.trim()
      updateMindspace()
    }
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
      customIcons: [null, null, null]
    }

    mindspace.value.mindslot = [...mindspace.value.mindslot, newSlot]
    await updateMindspace()
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
    const safeCustomIcons = customIcons.map(icon => icon === undefined ? null : icon)

    mindspace.value.mindslot[index] = {
      ...mindspace.value.mindslot[index],
      customIcons: safeCustomIcons
    }
    await updateMindspace()
  }

  // Delete slot
  const deleteSlot = async (index) => {
    mindspace.value.mindslot.splice(index, 1)
    await updateMindspace()
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

    if (!slot.item && (!slot.iconItems || slot.iconItems.every(item => !item))) {
      availableSlots.push({
        slotIndex,
        name: slot.name,
        type: 'empty',
        typeLabel: 'Empty slot'
      })
    }

    if (slot.iconItems && Array.isArray(slot.iconItems)) {
      const emptyIconSlots = slot.iconItems.filter(item => !item).length
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
    // Check total slots count, not full slots count, since we're creating a new slot
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

    // Count only FULL slots, not all slots
    const fullSlots = currentSlots.filter(slot => {
      if (slot.item && !hasIconItems(slot)) {
        return true // Single-item slot is full
      }

      if (hasIconItems(slot)) {
        const iconItems = slot.iconItems || [null, null, null]
        return iconItems.every(item => item !== null && item !== undefined)
      }

      return false
    })

    // Show toast if all slots are truly full
    if (fullSlots.length >= 5) {
      showToastMessage('All mind slots are full!')
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

  // Show toast
  const showToastMessage = (message, duration = 3000) => {
    toastMessage.value = message
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
    }, duration)
  }

  // Watchers
  watch(() => currentUser.value, async (newUserId) => {
    if (newUserId && Object.keys(store.getters['user/getItems']).length === 0) {
      await store.dispatch('user/fetchItems', newUserId)
    }
  })

  watch(() => currentMindSpaceId.value, async (newMindSpaceId) => {
    if (newMindSpaceId) {
      await fetchMindspaceSlots()
      if (currentUser.value) {
        await store.dispatch('user/fetchItems', currentUser.value)
      }
    }
  })

  // Watch the Vuex store items for changes
  watch(() => store.getters['user/getItems'], (newItems) => {
    console.log('🎯 mindSlot: Vuex store items changed:', Object.keys(newItems).length, 'items')
  }, { deep: true })

  // Lifecycle hooks
  onMounted(async () => {
    emitter.on('showMindslotModal', handleShowMindslotModal)
    emitter.on('removeMindslot', handleRemoveMindslot)

    // Fetch items using Vuex store if needed
    if (currentUser.value && Object.keys(store.getters['user/getItems']).length === 0) {
      await store.dispatch('user/fetchItems', currentUser.value)
    }
  })

</script>

<style lang="scss">
@import '@/assets/itemWindowStyle.scss';
@import '@/assets/globalIconStyle.scss';
@import '@/assets/toastStyle.scss';
</style>
