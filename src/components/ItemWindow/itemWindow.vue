<!-- Clean itemWindow.vue -->
<template>
  <div
    class="mind-slot-card"
    :class="{
      expanded: expanded,
      flipped: isFlipped,
      'full-screen': expanded && isFlipped
    }"
    @click="handleCardClick"
  >
    <!-- Card Front: Slot Display -->
    <div class="card-face front">
      <div class="slot-header">
        <input
          v-if="isEditingName"
          v-model="editingName"
          @blur="saveSlotName"
          @keyup.enter="saveSlotName"
          @click.stop
          class="slot-name-input"
          ref="nameInput"
        />
        <h3 v-else class="slot-name" @click.stop="startEditingName">
          {{ mindslot.name || 'New Slot' }}
        </h3>

        <button
          v-if="expanded"
          @click.stop="handleClose"
          class="icon-button close-button"
        >×</button>

        <button
          v-else
          @click.stop="$emit('delete', index)"
          class="delete-btn"
        >×</button>
      </div>

      <div class="slot-content"
        :style="expanded && isSingleItemSlot && items && items[mindslot.item] && items[mindslot.item].img ?
                { backgroundImage: `url(${items[mindslot.item].img})` } : {}"
        @contextmenu.prevent="handleSlotRightClick"
        @touchstart="handleSlotTouchStart"
        @touchend="handleSlotTouchEnd">

        <!-- Single Item Display -->
        <div v-if="isSingleItemSlot && getItemName(mindslot.item)" class="single-item-content">
          <!-- For expanded slots, just show the name in top-left -->
          <div v-if="expanded" class="single-item-name-overlay">
            {{ getItemName(mindslot.item) }}
          </div>

          <!-- For unexpanded slots, show the normal icon + name layout -->
          <template v-else>
            <div class="icon-slot has-item clickable single-item-icon">
              <div class="icon-item-name">
                {{ getItemName(mindslot.item) }}
              </div>
            </div>
            <div class="single-item-name">
              {{ getItemName(mindslot.item) }}
            </div>
          </template>
        </div>

        <!-- Multi-Item or Empty Slot Display -->
        <div v-else class="empty-slot-wrapper">
          <div v-if="!hasAnyItems" class="empty-slot-text">Empty slot</div>

          <IconSlotGrid
            :initialIcons="mindslot.slotIcons || [null, null, null]"
            :iconItems="mindslot.iconItems || [null, null, null]"
            :customIcons="mindslot.customIcons || [null, null, null]"
            :getItemName="getItemName"
            :clickable="expanded"
            :expanded="expanded"
            @icons-changed="handleIconsChanged"
            @icon-clicked="handleIconClick"
            @custom-icon-changed="handleCustomIconsChanged"
          />
        </div>
      </div>

      <!-- Flip indicator when expanded -->
      <div v-if="expanded && hasAnyItems" class="flip-indicator">
        <span v-if="isSingleItemSlot">Click to view item details →</span>
        <span v-else>Click icons to view items →</span>
      </div>
    </div>

    <!-- Card Back: Item Details -->
    <div class="card-face back">
      <div class="item-window-content">
        <!-- Button Container -->
        <div class="block-option-container">
          <template v-if="!currentItemId">
            <button @click.stop="handleClose" class="icon-button close-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </template>

          <template v-else>
            <button class="icon-button editBlock-button" @click.stop="toggleEditBlock">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75 1.84-1.83z"/>
                <path d="M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z"/>
              </svg>
            </button>

            <template v-if="!openedFromMindslot">
              <button class="icon-button moveItem-button" @click.stop="openMoveItemModal">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/>
                  <path d="M3 6l2-4h3l2 4"/>
                  <path d="M8 14h8M16 14l-3 3M16 14l-3-3"/>
                </svg>
              </button>

              <button class="icon-button duplicateBlock-button" @click.stop="openDuplicateDialog">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>

              <button class="icon-button" @click.stop="openDeleteDialog">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>

              <button class="icon-button" @click.stop="triggerAddMindslot">+MIND</button>
            </template>

            <button v-if="openedFromMindslot" class="icon-button remove-mind-button" @click.stop="triggerRemoveMindslot">
              -MIND
            </button>



            <button @click.stop="flipToSlot" class="icon-button back-button">← Back</button>
            <button @click.stop="handleClose" class="icon-button close-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </template>
        </div>

        <!-- Empty Slot View -->
        <div v-if="viewMode === 'slot' || !currentItemId" class="empty-slot-view">
          <div class="empty-slot-header">
            <h3 class="empty-slot-title">Empty Slot</h3>
          </div>
          <div class="empty-slot-content">
            <div class="empty-slot-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h4>This slot is empty</h4>
            <p>Select items from your mindspace to fill this slot, or close this window and choose a different slot.</p>
          </div>
        </div>

        <!-- Icon Grid View -->
        <div v-else-if="viewMode === 'iconGrid'" class="icon-grid-view">
          <div class="icon-grid-header">
            <h3>Choose an item to view</h3>
          </div>

          <div class="icon-grid-content">
            <div class="large-icon-grid">
              <div
                v-for="(item, iconIndex) in (mindslot.iconItems || [null, null, null])"
                :key="iconIndex"
                :class="['large-icon-slot', { 'has-item': item }]"
                @click="switchToIconItem(iconIndex)"
              >
                <div v-if="item && getItemName" class="large-icon-item-name">
                  {{ getItemName(item) }}
                </div>
                <div v-else class="large-icon-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Item Content View -->
        <div v-else-if="viewMode === 'itemContent'" class="regular-item-view">
          <div class="item-header">
            <div class="item-title-section">
              <input
                v-if="isEditingItemName"
                v-model="editedItemName"
                class="edit-input-name"
                type="text"
                ref="itemNameInput"
                @blur="saveItemName"
                @keyup.enter="saveItemName"
                @click.stop
              />
              <h3 v-else @click.stop="startEditingItemName">
                {{ currentItemName }}
              </h3>
            </div>
          </div>

          <div class="blocks-container">
            <AddBlockButton
              :index="0"
              :is-block-edit="isBlockEdit"
              @add="handleAddBlock"
              @add-image="handleImageUpload"
              v-if="isBlockEdit"
            />
            <template v-for="(block, index) in blocks" :key="block.id">
              <block-wrapper
                :block="block"
                :index="index"
                :total-blocks="blocks.length"
                @edit="handleBlockEdit"
              />
              <AddBlockButton
                :index="index + 1"
                :is-block-edit="isBlockEdit"
                @add="handleAddBlock"
                @add-image="handleImageUpload"
                v-if="isBlockEdit"
              />
            </template>
          </div>
        </div>
      </div>
      <!-- Multi-item navigation -->
      <div v-if="!isSingleItemSlot && hasMultipleItems" class="multi-item-nav">
        <template v-for="(item, iconIndex) in mindslot.iconItems" :key="iconIndex">
          <button
            v-if="item"
            @click.stop="switchToIconItem(iconIndex)"
            :class="['icon-nav-btn', { active: currentIconIndex === iconIndex }]"
          >
            {{ iconIndex + 1 }}
          </button>
        </template>
      </div>
    </div>
  </div>

  <!-- Hidden file input for slot image upload -->
  <input
    ref="slotImageUploadInput"
    type="file"
    accept="image/*"
    @change="handleSlotImageUpload"
    style="display: none;"
  >

</template>

<script setup>
  import { ref, computed, watch, nextTick, defineEmits, defineProps } from 'vue'
  import { useStore } from 'vuex'
  import BlockWrapper from '../ItemWindow/blockWrapper.vue'
  import AddBlockButton from '../ItemWindow/addBlockButton.vue'
  import emitter from '@/eventBus'
  import IconSlotGrid from '@/./components/ItemWindow/iconSlotGrid.vue'

  // Props
  const props = defineProps({
    mindslot: {
      type: Object,
      default: () => ({
        name: 'New Slot',
        item: null,
        iconItems: [null, null, null],
        slotIcons: [null, null, null]
      })
    },
    index: {
      type: Number,
      required: true
    },
    getItemImage: {
      type: Function,
      default: () => () => null
    },
    getItemName: {
      type: Function,
      default: () => () => null
    },
    expanded: {
      type: Boolean,
      default: false
    },
    initialFlipped: {
      type: Boolean,
      default: false
    },
    openedFromMindslot: {
      type: Boolean,
      default: false
    },
    directIconIndex: {
      type: Number,
      default: -1
    },
      expandedSlotIndex: {
    type: Number,
    default: null
    },
      items: {
      type: Object,
      default: () => ({})
    }
  })

  // Emits
  const emit = defineEmits([
    'delete',
    'name-change',
    'click',
    'close',
    'item-updated',
    'slot-icons-changed',
    'custom-icons-changed',
    'icon-direct-click',
    'refresh-items'
  ])

  const store = useStore()

  // Reactive state
  const isFlipped = ref(props.initialFlipped)
  const isEditingName = ref(false)
  const editingName = ref(props.mindslot.name || 'New Slot')
  const nameInput = ref(null)
  const currentIconIndex = ref(0)
  const viewMode = ref('slot') // 'slot', 'iconGrid', 'itemContent'

  // Item editing state
  const isEditingItemName = ref(false)
  const editedItemName = ref('')
  const itemNameInput = ref(null)

  // Computed properties
  const currentItemId = computed(() => store.getters['mindspace/getItemId'])
  const currentItemName = computed(() => store.getters['mindspace/getItemName'] || 'Loading...')
  const currentUid = computed(() => store.getters['mindspace/getUserId'])
  const blocks = computed(() => store.getters['mindspace/getItemBlocks'])
  const isBlockEdit = computed(() => store.state.user.editMonitor.isBlockEdit)

  const isSingleItemSlot = computed(() => {
    return !!(props.mindslot.item && !hasIconItems.value)
  })
  const slotImageUploadInput = ref(null)
  let touchTimer = null
  const longPressDelay = 500

  const hasIconItems = computed(() => {
    const iconItems = props.mindslot.iconItems || [null, null, null]
    return iconItems.some(item => item !== null && item !== undefined)
  })

  const hasAnyItems = computed(() => {
    return isSingleItemSlot.value || hasIconItems.value
  })

  const hasMultipleItems = computed(() => {
    const iconItems = props.mindslot.iconItems || [null, null, null]
    return iconItems.filter(item => item !== null && item !== undefined).length > 1
  })

  function handleIconsChanged(newIcons) {
    emit('slot-icons-changed', {
      index: props.index,
      icons: newIcons
    })
  }

  // Card interaction methods
  async function handleCardClick() {
    console.log('🎮 handleCardClick called - props.expanded:', props.expanded)
    console.log('🎮 expandedSlotIndex:', props.expandedSlotIndex)
    // If any slot is expanded, don't handle clicks on unexpanded cards
    if (!props.expanded && props.expandedSlotIndex !== null) {
      console.log('🎮 Another slot is expanded - ignoring click on unexpanded card')
      return
    }
    if (!props.expanded) {
      console.log('🎮 emitting click to parent')
      emit('click', props.index)
      return
    }
    // If this is an expanded multi-item card, don't handle background clicks
    if (props.expanded && hasIconItems.value) {
      console.log('🎮 This is an expanded multi-item card - ignoring background clicks')
      return
    }
    // Check if this is a direct icon click scenario - don't flip automatically
    if (props.openedFromMindslot && props.initialFlipped) {
      console.log('🎮 This is a direct icon click - not handling card click')
      return
    }
    // Only flip if clicking the background AND not already showing item content
    if (!isFlipped.value && hasIconItems.value && viewMode.value !== 'itemContent') {
      viewMode.value = 'iconGrid'
      isFlipped.value = true
    } else if (!isFlipped.value && isSingleItemSlot.value) {
      // Single item slot - go directly to item content (this will still work!)
      viewMode.value = 'itemContent'
      await flipToItem()
    }
  }



  async function handleIconClick(iconIndex) {
    const iconItems = props.mindslot.iconItems || [null, null, null]
    const itemId = iconItems[iconIndex]

    console.log('=== DEBUG START ===')
    console.log('iconIndex:', iconIndex)
    console.log('itemId:', itemId)
    console.log('props.expanded:', props.expanded)
    console.log('!props.expanded:', !props.expanded)

    if (!itemId) {
      console.log('EARLY RETURN: No item found')
      return
    }

    // Split the condition for debugging
    const isExpanded = props.expanded
    console.log('isExpanded variable:', isExpanded)

    if (!isExpanded) {
      console.log('ENTERING UNEXPANDED BRANCH')
      console.log('About to emit icon-direct-click with:', props.index, iconIndex)
      emit('icon-direct-click', props.index, iconIndex)
      console.log('Emit completed, returning')
      return
    }

    console.log('ENTERING EXPANDED BRANCH')
    // For expanded cards, set up the content and show it directly
    currentIconIndex.value = iconIndex
    viewMode.value = 'itemContent'

    // Load the item data
    await store.dispatch('mindspace/setItemId', itemId)
    await nextTick()

    // Set to flipped state to show item content
    isFlipped.value = true

    console.log('=== DEBUG END ===')
  }

  async function switchToIconItem(iconIndex) {
    const iconItems = props.mindslot.iconItems || [null, null, null]
    const itemId = iconItems[iconIndex]

    if (itemId) {
      currentIconIndex.value = iconIndex
      viewMode.value = 'itemContent'  // Go directly to content
      await store.dispatch('mindspace/setItemId', itemId)
      await nextTick()
    }
  }

  const handleSlotRightClick = (event) => {
    if (isSingleItemSlot.value && props.mindslot.item) {
      event.preventDefault()
      slotImageUploadInput.value?.click()
    }
  }

  const handleSlotTouchStart = () => {
    if (isSingleItemSlot.value && props.mindslot.item) {
      touchTimer = setTimeout(() => {
        slotImageUploadInput.value?.click()
      }, longPressDelay)
    }
  }

  const handleSlotTouchEnd = () => {
    if (touchTimer) {
      clearTimeout(touchTimer)
      touchTimer = null
    }
  }

  const handleSlotImageUpload = async (event) => {
    const file = event.target.files[0]
    console.log('🖼️ File selected:', file?.name)

    if (file && props.mindslot.item) {
      try {
        console.log('🖼️ Uploading image for item:', props.mindslot.item)

        const downloadURL = await store.dispatch('mindspace/handleImageUpload', { file })
        console.log('🖼️ Image uploaded, URL:', downloadURL)

        if (downloadURL) {
          await store.dispatch('mindspace/setItemImage', {
            itemId: props.mindslot.item,
            imageUrl: downloadURL
          })
          console.log('🖼️ Item image updated in database')

          // ADD THIS: Emit event to refresh items in parent
          emit('refresh-items')

          event.target.value = ''
        }
      } catch (error) {
        console.error('Error uploading slot image:', error)
      }
    }
  }

  async function loadItemAndFlip(itemId) {
    await store.dispatch('mindspace/setItemId', itemId)
    await nextTick()
    isFlipped.value = true
  }

  async function flipToItem() {
    if (isSingleItemSlot.value && props.mindslot.item) {
      await loadItemAndFlip(props.mindslot.item)
    } else if (hasIconItems.value) {
      const iconItems = props.mindslot.iconItems || [null, null, null]
      const firstItemIndex = iconItems.findIndex(item => item !== null && item !== undefined)
      if (firstItemIndex !== -1) {
        currentIconIndex.value = firstItemIndex
        await loadItemAndFlip(iconItems[firstItemIndex])
      }
    }
  }

  function flipToSlot() {
    isFlipped.value = false
    viewMode.value = 'slot'
  }

  function handleClose() {
    emit('close')
  }

  // Name editing methods
  function startEditingName() {
    isEditingName.value = true
    editingName.value = props.mindslot.name || 'New Slot'
    nextTick(() => {
      nameInput.value?.focus()
      nameInput.value?.select()
    })
  }

  function saveSlotName() {
    isEditingName.value = false
    if (editingName.value.trim() !== props.mindslot.name) {
      emit('name-change', { index: props.index, newName: editingName.value.trim() })
    }
  }

  // Item name editing
  function startEditingItemName() {
    if (!currentItemId.value) return
    isEditingItemName.value = true
    editedItemName.value = currentItemName.value
    nextTick(() => {
      itemNameInput.value?.focus()
      itemNameInput.value?.select()
    })
  }

  function saveItemName() {
    isEditingItemName.value = false
    if (editedItemName.value !== currentItemName.value) {
      store.dispatch('mindspace/setItemName', editedItemName.value)
    }
  }

  // Item action methods
  function toggleEditBlock() {
    store.dispatch('user/setIsBlockEdit', !isBlockEdit.value)
  }

  function openMoveItemModal() {
    store.dispatch('user/triggerMoveItemWindow', true)
    emit('close')
  }

  function openDuplicateDialog() {
    if (!confirm('Are you sure you want to duplicate this item?')) return
    const currentFolder = store.state.mindspace.currentFolder
    if (!currentFolder?.id) {
      store.dispatch('mindspace/duplicateItemToPage')
    } else {
      store.dispatch('mindspace/duplicateItemToFolder')
    }
    emit('close')
  }

  function openDeleteDialog() {
    if (!confirm('Are you sure you want to delete this item?')) return
    store.dispatch('mindspace/deleteItem', currentItemId.value)
    emit('close')
  }

  function triggerAddMindslot() {
    emitter.emit('showMindslotModal', {
      itemId: currentItemId.value,
      title: currentItemName.value
    })
  }

  function triggerRemoveMindslot() {
    if (isSingleItemSlot.value) {
      emitter.emit('removeMindslot', {
        itemId: currentItemId.value,
        slotIndex: props.index
      })
    } else {
      emitter.emit('removeMindslot', {
        itemId: currentItemId.value,
        slotIndex: props.index,
        iconIndex: currentIconIndex.value
      })
    }
    emit('close')
  }

  // Handle Icons

  const handleCustomIconsChanged = (newCustomIcons) => {
    emit('custom-icons-changed', {
      index: props.index,
      customIcons: newCustomIcons
    })
  }

  // Block management
  const generateRandomId = (length = 10) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }

  const getDefaultContent = (type) => {
    switch (type) {
      case 'title-block': return 'New Title'
      case 'body-block': return 'New body text'
      case 'image-block': return '/path/to/default/image.jpg'
      case 'todo-block': return [{
        name: 'New todo item',
        tick: false,
        createdAt: new Date().toISOString(),
        due: new Date(Date.now() + 86400000).toISOString()
      }]
      default: return null
    }
  }

  function handleBlockEdit(blockId) {
    store.dispatch('mindspace/setEditingBlock', blockId)
  }

  function handleAddBlock({ type, index, content }) {
    const newBlock = {
      id: 'e-' + generateRandomId(),
      type,
      content: content || getDefaultContent(type),
      createdBy: currentUid.value,
      editedBy: [currentUid.value],
      createdAt: new Date().toISOString(),
      editedAt: new Date().toISOString()
    }
    store.dispatch('mindspace/addBlockAtIndex', { block: newBlock, index })
  }

  async function handleImageUpload({ file, index }) {
    try {
      const downloadURL = await store.dispatch('mindspace/handleImageUpload', { file })
      if (downloadURL) {
        handleAddBlock({ type: 'image-block', index, content: downloadURL })
      }
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }

  // Watchers
  watch(() => props.mindslot?.name, (newName) => {
    if (newName) editingName.value = newName
  })

  watch(() => props.initialFlipped, (newValue) => {
    isFlipped.value = newValue
  })

  watch(currentItemName, (newName, oldName) => {
    console.log('[ItemWindow] Item name changed:', { oldName, newName, itemId: currentItemId.value })
  })

  // Watch for direct icon access
watch(() => props.directIconIndex, async (newIconIndex) => {
  console.log('*** WATCHER TRIGGERED ***', { newIconIndex, expanded: props.expanded, initialFlipped: props.initialFlipped })

  if (newIconIndex >= 0 && props.expanded) {
    console.log('*** WATCHER CONDITIONS MET ***')
    const iconItems = props.mindslot.iconItems || [null, null, null]
    const itemId = iconItems[newIconIndex]

    if (itemId) {
      console.log('*** WATCHER SETTING UP ITEM CONTENT ***')
      currentIconIndex.value = newIconIndex
      viewMode.value = 'itemContent'
      await store.dispatch('mindspace/setItemId', itemId)
      await nextTick()
      isFlipped.value = true
      console.log('*** WATCHER COMPLETED ***')
    }
  }
}, { immediate: true })

  watch([() => props.mindslot.item, isFlipped], async ([newItemId, flipped]) => {
    if (flipped && newItemId && newItemId !== currentItemId.value) {
      await store.dispatch('mindspace/setItemId', newItemId)
    }
  }, { immediate: true })

</script>

<style lang="scss">
  @import '@/assets/itemWindowStyle.scss';
  @import '@/assets/globalIconStyle.scss';
</style>
