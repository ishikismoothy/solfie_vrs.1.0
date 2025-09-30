<!-- src/components/mindSlot.vue -->
<template>
  <div class="return-to-myself">

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
            v-if="editingSlotIndex === index && !isViewOnly"
            v-model="editingName"
            @blur="saveSlotName(index)"
            @keyup.enter="saveSlotName(index)"
            @click.stop
            class="slot-name-input"
            ref="nameInput"
          />
          <h3 v-else class="slot-name" @click.stop="!isViewOnly && startEditingName(index)">
            {{ mindslot.name || 'New Slot' }}
          </h3>

          <!-- Hide delete button in view-only mode -->
          <button
            v-if="!isViewOnly"
            @click.stop="deleteSlot(index)"
            class="delete-btn"
          >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          </button>
        </div>

        <div class="slot-content">
          <!-- Single Item Display -->
          <div v-if="isSingleItemSlot(mindslot) && items[mindslot.item]" class="single-item-content">
            <div
              class="icon-slot has-item clickable single-item-icon"
              @contextmenu.prevent="!isViewOnly && handleSingleItemRightClick($event, index)"
              @touchstart="!isViewOnly && handleSingleItemTouchStart($event, index)"
              @touchend="!isViewOnly && handleSingleItemTouchEnd()"
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
            <div v-if="!hasAnyItems(mindslot) && !expanded && !isViewOnly" class="empty-slot-options">
              <h4 class="empty-slot-title">スロットタイプの選択</h4>

              <div class="slot-type-options">
                <button
                  class="slot-type-option single-item-option"
                  @click="openItemSelector(index, 'single')"
                >
                  <div class="option-content">
                    <div class="option-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="5" y="5" width="14" height="14" rx="2" ry="2"></rect>
                      </svg>
                    </div>
                    <div class="option-text">
                      <strong>スロット</strong>
                      <small>１つのアイテムを挿入</small>
                    </div>
                  </div>
                </button>

                <button
                  class="slot-type-option multi-item-option"
                  @click="openItemSelector(index, 'multi')"
                >
                  <div class="option-content">
                    <div class="option-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="8" height="8" rx="1" ry="1"></rect>
                        <rect x="13" y="3" width="8" height="8" rx="1" ry="1"></rect>
                        <rect x="3" y="13" width="8" height="8" rx="1" ry="1"></rect>
                      </svg>
                    </div>
                    <div class="option-text">
                      <strong>複数スロット</strong>
                      <small>３つのアイテムを挿入</small>
                    </div>
                  </div>
                </button>
              </div>
            </div>
            <!-- Delete this part <div v-else class="empty-slot-options"> no data</div> -->

            <IconSlotGrid
              v-if="hasAnyItems(mindslot)"
              :initialIcons="mindslot.slotIcons || [null, null, null]"
              :iconItems="mindslot.iconItems || [null, null, null]"
              :customIcons="mindslot.customIcons || [null, null, null]"
              :items="items"
              :clickable="false"
              :expanded="false"
              @icons-changed="(icons) => !isViewOnly && handleSlotIconsChanged({ index, icons })"
              @icon-clicked="(iconIndex) => handleDirectIconClick(index, iconIndex)"
              @icon-right-click="(iconIndex, event) => !isViewOnly && openIconSelector(event, index, iconIndex)"
              @custom-icon-changed="(customIcons) => !isViewOnly && handleCustomIconsChanged({ index, customIcons })"
              @empty-slot-clicked="(iconIndex) => !isViewOnly && openItemSelector(index, 'multi')"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Add Slot Button - Hidden in view-only mode -->
    <button
      v-if="mindspace.mindslot.length < 5 && !isViewOnly"
      @click="addSlot('New Slot')"
      class="add-slot-btn"
    >
      スロットの追加
    </button>

    <!-- Slot Selection Modal -->
    <Teleport to="body">
      <div v-if="showSlotSelectionModal" class="slot-selection-overlay" @click="closeSlotSelection">
        <div class="slot-selection-modal" @click.stop>
          <h3>"{{ pendingItem.title }}" をマインドスロットへ追加</h3>

          <!-- Show available slots if they exist -->
          <div v-if="pendingItem.availableSlots && pendingItem.availableSlots.length > 0" class="available-slots-section">
            <h4>既存のスロットに追加</h4>
            <div class="available-slots-list">
              <button
                v-for="slot in pendingItem.availableSlots"
                :key="`${slot.slotIndex}-${slot.type}`"
                @click="addToExistingSlot(slot)"
                class="available-slot-option"
                :class="slot.type"
              >
                <div class="slot-info">
                  <strong>スロット {{ slot.slotIndex + 1 }}: "{{ slot.name }}"</strong>
                  <span class="slot-type">{{ slot.typeLabel }}</span>
                </div>
              </button>
            </div>
            <div class="divider">OR</div>
          </div>

          <!-- Option to create new slot -->
          <div class="new-slot-section">
            <h4>新しいスロットの追加</h4>
            <div class="new-slot-options">
              <button
                @click="createNewSlot('single')"
                class="new-slot-option single-item"
                :disabled="pendingItem.totalSlots >= 5"
              >
                <div class="option-content">
                  <strong>スロット</strong>
                  <small>１つのアイテムを挿入</small>
                </div>
              </button>

              <button
                @click="createNewSlot('multi')"
                class="new-slot-option multi-item"
                :disabled="pendingItem.totalSlots >= 5"
              >
                <div class="option-content">
                  <strong>複数スロット</strong>
                  <small>３つのアイテムを挿入</small>
                </div>
              </button>
            </div>

            <div v-if="pendingItem.totalSlots >= 5" class="max-slots-warning">
              最大スロット数になりました (5/5)
            </div>
            <div v-else class="slots-remaining">
              残り{{ 5 - pendingItem.totalSlots }} スロット
            </div>
          </div>

          <button @click="closeSlotSelection" class="cancel-btn">キャンセル</button>
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

    <!-- Item Selection Grid -->
    <ItemSelectionGrid
      :isVisible="showItemSelector"
      :slotIndex="itemSelectorSlotIndex"
      :slotType="itemSelectorSlotType"
      :screenPosition="'left'"
      @close="closeItemSelector"
      @select-item="handleItemSelection"
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
  import ItemSelectionGrid from '@/./components/ItemWindow/ItemSelectionGrid.vue'

  const store = useStore()
  const currentUser = computed(() => store.state.user?.user?.uid)
  const currentMindSpaceId = computed(() => store.state.mindspace?.currentMindSpaceId)

  // Check if in view-only mode (shared view without edit permissions)
  const isSharedView = computed(() => store.state.mindspace?.isSharedView || false)
  const isEditMode = computed(() => store.state.mindspace?.isEditMode || false)

  // 1. Add the currentShareData getter from the sharing module
  const currentShareData = computed(() => store.state.sharing?.currentShareData)
  const isSharedAccess = computed(() => !!currentShareData.value?.mindspaceId)
  // 2. Update the isViewOnly computed property
  // Update the isViewOnly computed property (as you already have)
  const isViewOnly = computed(() => {
    if (currentShareData.value?.access) {
      return currentShareData.value.access === 'view'
    }

    // Fallback to original logic if no share data
    // View-only if in shared view AND not in edit mode
    return isSharedView.value && !isEditMode.value
  })

  // Add a new computed property to get the correct mindspace ID
  const activeMindSpaceId = computed(() => {
    // If accessing via share link, use the mindspaceId from shareData
    if (isSharedAccess.value && currentShareData.value?.mindspaceId) {
      return currentShareData.value.mindspaceId
    }
    // Otherwise use the regular mindspaceId
    return currentMindSpaceId.value
  })

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
    if (isViewOnly.value) return
    event.preventDefault()
    openIconSelector(event, slotIndex, -1) // -1 indicates single item
  }

  const handleSingleItemTouchStart = (event, slotIndex) => {
    if (isViewOnly.value) return
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
    if (isViewOnly.value) return

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
    if (isViewOnly.value) return

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
    console.log('[fetchMindspaceSlots] TRIGGERED')
    try {
      // Use activeMindSpaceId instead of currentMindSpaceId
      if (!activeMindSpaceId.value) {
        console.warn('[fetchMindspaceSlots] No mindspace ID available')
        return
      }

      console.log('[fetchMindspaceSlots] Fetching with ID:', activeMindSpaceId.value, 'isShared:', isSharedAccess.value)
      
      const data = await mindspaceService.fetchMindspaceSlots(activeMindSpaceId.value)

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
      console.log("[mindSlot.vue/fetchMindspaceSlots] Slots loaded: ", [...mindspace.value.mindslot])
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

    if (hasAnyItems(mindslot)) {
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
    if (isViewOnly.value) return

    editingSlotIndex.value = index
    editingName.value = mindspace.value.mindslot[index].name || 'New Slot'
    nextTick(() => {
      // Focus the input if needed
    })
  }

  const saveSlotName = (index) => {
    if (isViewOnly.value) return

    editingSlotIndex.value = null
    if (editingName.value.trim() !== mindspace.value.mindslot[index].name) {
      mindspace.value.mindslot[index].name = editingName.value.trim()
      updateMindspace()
    }
  }

  // Add Item Via Empty Slot

  const showItemSelector = ref(false)
  const itemSelectorSlotIndex = ref(-1)
  const itemSelectorSlotType = ref('single')

  // Open item selector for empty slots
  const openItemSelector = (slotIndex, slotType = 'single') => {
    if (isViewOnly.value) return

    itemSelectorSlotIndex.value = slotIndex
    itemSelectorSlotType.value = slotType
    showItemSelector.value = true
  }

  // Close item selector
  const closeItemSelector = () => {
    showItemSelector.value = false
    itemSelectorSlotIndex.value = -1
    itemSelectorSlotType.value = 'single'
  }

  // Handle item selection from the grid
  const handleItemSelection = async ({ itemIds, slotIndex, slotType }) => {
    if (isViewOnly.value) return

    try {
      const slot = mindspace.value.mindslot[slotIndex]

      if (slotType === 'single') {
        // Set as single item slot (use first item only)
        mindspace.value.mindslot[slotIndex] = {
          ...slot,
          item: itemIds[0],
          iconItems: [null, null, null],
          slotIcons: [null, null, null],
          customIcons: [null, null, null]
        }
      } else {
        // Set as multi-item slot
        const iconItems = [null, null, null]

        // Fill slots with selected items in order
        itemIds.forEach((itemId, index) => {
          if (index < 3) { // Max 3 items
            iconItems[index] = itemId
          }
        })

        mindspace.value.mindslot[slotIndex] = {
          ...slot,
          item: null,
          iconItems,
          slotIcons: slot.slotIcons || [null, null, null],
          customIcons: slot.customIcons || [null, null, null]
        }
      }

      await updateMindspace()
      console.log('✅ Item added to slot:', { itemIds, slotIndex, slotType })

    } catch (error) {
      console.error('❌ Error adding item to slot:', error)
    }
  }

  // Slot management functions
  const addSlot = async (title, itemId, slotType = 'single') => {
    if (isViewOnly.value) return
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
    if (isViewOnly.value) return

    mindspace.value.mindslot[index] = {
      ...mindspace.value.mindslot[index],
      slotIcons: icons
    }
    await updateMindspace()
  }

  const handleCustomIconsChanged = async ({ index, customIcons }) => {
    if (isViewOnly.value) return

    const safeCustomIcons = customIcons.map(icon => icon === undefined ? null : icon)

    mindspace.value.mindslot[index] = {
      ...mindspace.value.mindslot[index],
      customIcons: safeCustomIcons
    }
    await updateMindspace()
  }

  // Delete slot
  const deleteSlot = async (index) => {
    if (isViewOnly.value) return

    mindspace.value.mindslot.splice(index, 1)
    await updateMindspace()
  }

  // Update mindspace
  // Update the updateMindspace function to use activeMindSpaceId
  const updateMindspace = async () => {
    if (isViewOnly.value) {
      console.log('❌ Update blocked: View-only mode');
      return;
    }

    try {
      // Use activeMindSpaceId instead of currentMindSpaceId
      if (!activeMindSpaceId.value) {
        console.error('[updateMindspace] No mindspace ID available')
        return
      }

      console.log('🔍 Update attempt:', {
        mindspaceId: activeMindSpaceId.value,
        isSharedAccess: isSharedAccess.value,
        shareData: currentShareData.value,
        access: currentShareData.value?.access
      });

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

      await mindspaceService.updateMindspaceSlots(activeMindSpaceId.value, updatedData)
      console.log('[updateMindspace] Update successful')
    } catch (error) {
      console.error('❌ Update failed:', {
        error: error.message,
        code: error.code,
        details: error
      });

      // Show user-friendly error
      if (error.code === 'permission-denied') {
        showToastMessage('You don\'t have permission to edit this mindspace.');
      } else {
        showToastMessage('Failed to save changes. Please try again.');
      }
    }
  }

  // Update the watchers to use activeMindSpaceId
  watch(() => activeMindSpaceId.value, async (newMindSpaceId) => {
    if (newMindSpaceId) {
      console.log('[Watcher] MindSpace ID changed:', newMindSpaceId)
      await fetchMindspaceSlots()
      
      // Check if this is shared access or regular access
      if (currentShareData.value?.ownerId) {
        // Shared access - use owner's ID
        await store.dispatch('user/fetchItems', currentShareData.value.ownerId)
      } else if (currentUser.value) {
        // Regular access - use current user's ID
        await store.dispatch('user/fetchItems', currentUser.value)
      }
    }
  })

  // Also watch for shareData changes
  watch(() => currentShareData.value, async (newShareData) => {
    if (newShareData?.mindspaceId) {
      console.log('[Watcher] Share data changed, fetching mindspace slots')
      await fetchMindspaceSlots()
      
      // Fetch items using the owner's ID from shareData
      if (newShareData.ownerId) {
        await store.dispatch('user/fetchItems', newShareData.ownerId)
      }
    }
  }, { deep: true })

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
    if (isViewOnly.value) return

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
    if (isViewOnly.value) return

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
    if (isViewOnly.value) {
      showToastMessage('Cannot edit mindslots in view-only mode')
      return
    }

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
    if (isViewOnly.value) return

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

  // Add this computed property for debugging
  const debugInfo = computed(() => ({
    shareData: currentShareData.value,
    access: currentShareData.value?.access,
    isViewOnly: isViewOnly.value,
    isSharedAccess: isSharedAccess.value,
    mindspaceId: activeMindSpaceId.value
  }))

  // Watch for changes
  watch(debugInfo, (newVal) => {
    console.log('Debug info changed:', newVal)
  }, { deep: true })

  // Lifecycle hooks
  onMounted(async () => {
    emitter.on('showMindslotModal', handleShowMindslotModal)
    emitter.on('removeMindslot', handleRemoveMindslot)
    console.log('Component mounted with:', debugInfo.value)
    fetchMindspaceSlots()

    console.log('mindslot data:', mindspace.value.mindslot)
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
