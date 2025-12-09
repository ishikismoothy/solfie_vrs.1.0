<!-- Updated itemWindow.vue with iOS-compatible image upload -->
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
    <div class="card-flip-container">
      <!-- Card Front: Slot Display -->
      <div class="card-face front">
        <div class="slot-header">
          <input
            v-if="isEditingName && isFlipped"
            v-model="editingName"
            @blur="saveSlotName"
            @keyup.enter="saveSlotName"
            @click.stop
            class="slot-name-input"
            ref="nameInput"
          />
          <h3 v-else class="slot-name" @click.stop="isFlipped && startEditingName()">
            {{ mindslot.name || 'New Slot' }}
          </h3>

          <button
            v-if="expanded"
            @click.stop="handleClose"
            class="icon-button close-button"
          >
            <HeroIcon name="x-mark" class="w-4 h-4" />
          </button>

          <button
            v-else
            @click.stop="$emit('delete', index)"
            class="delete-btn"
          >
            <HeroIcon name="trash" class="w-4 h-4" />
          </button>
        </div>

        <!-- iOS-friendly label wrapper for touch devices -->
        <label
          v-if="canUploadImage && isTouchDevice && showUploadPrompt"
          :for="`slot-image-input-${index}`"
          class="slot-content-label"
          @click.stop="handleLabelClick"
        >
          <div class="upload-prompt-overlay">
            <div class="upload-prompt-content">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <p>Tap to upload cover image</p>
            </div>
          </div>
          <div
            class="slot-content"
            :class="{ 'long-pressing': isLongPressing }"
            :style="expanded && (isSingleItemSlot || isFromMindGrid || isDirectMultiItem) && getCurrentItemImage() ?
                    { backgroundImage: `url(${getCurrentItemImage()})` } : {}"
          >
            <!-- Existing slot content -->
            <div v-if="isSingleItemSlot && items[mindslot.item]" class="single-item-content">
              <!-- Content remains the same -->
              <!-- <div v-if="expanded" class="single-item-name-overlay">
                {{ items[mindslot.item]?.name || items[mindslot.item]?.title || 'Unnamed Item' }}
              </div> -->
              <template>
                <div
                  class="icon-slot has-item clickable single-item-icon"
                  @contextmenu.prevent="handleSingleItemRightClick($event)"
                  @touchstart="handleSingleItemTouchStart($event)"
                  @touchend="handleSingleItemTouchEnd"
                >
                  <div v-if="getSingleItemCustomIcon()" class="custom-icon" v-html="getSingleItemCustomIcon()"></div>
                  <div v-else class="icon-item-name">
                    {{ items[mindslot.item]?.name || items[mindslot.item]?.title || 'Unnamed Item' }}
                  </div>
                </div>
                <div class="single-item-name">
                  {{ items[mindslot.item]?.name || items[mindslot.item]?.title || 'Unnamed Item' }}
                </div>
              </template>
            </div>

            <div v-else-if="isFromMindGrid && currentItemId" class="single-item-content">
              <!-- <div v-if="expanded" class="single-item-name-overlay">
                {{ currentItemName }}
              </div> -->
              <template>
                <div class="icon-slot has-item clickable single-item-icon">
                  <div class="icon-item-name">
                    {{ currentItemName }}
                  </div>
                </div>
                <div class="single-item-name">
                  {{ currentItemName }}
                </div>
              </template>
            </div>

            <div v-else-if="isDirectMultiItem" class="single-item-content">
              <!-- Direct multi-item: show the specific item's cover -->
              <template>
                <div class="icon-slot has-item clickable single-item-icon">
                  <div class="icon-item-name">
                    {{ currentItemName }}
                  </div>
                </div>
                <div class="single-item-name">
                  {{ currentItemName }}
                </div>
              </template>
            </div>

            <div v-else class="empty-slot-wrapper">
              <div v-if="!hasAnyItems" class="empty-slot-text">Empty slot</div>
              <IconSlotGrid
                :initialIcons="mindslot.slotIcons || [null, null, null]"
                :iconItems="mindslot.iconItems || [null, null, null]"
                :customIcons="mindslot.customIcons || [null, null, null]"
                :items="items"
                :clickable="expanded"
                :expanded="expanded"
                @icons-changed="handleIconsChanged"
                @icon-clicked="handleIconClick"
                @icon-right-click="openIconSelector"
                @custom-icon-changed="handleCustomIconsChanged"
              />
            </div>
          </div>
        </label>

        <!-- Regular slot content for non-touch devices -->
        <div
          v-else
          class="slot-content"
          :class="{ 'long-pressing': isLongPressing }"
          :style="expanded && (isSingleItemSlot || isFromMindGrid || isDirectMultiItem) && getCurrentItemImage() ?
                  { backgroundImage: `url(${getCurrentItemImage()})` } : {}"
          @contextmenu.prevent="handleSlotRightClick"
          @touchstart="handleSlotTouchStart"
          @touchend="handleSlotTouchEnd"
          @touchcancel="handleSlotTouchCancel"
        >
          <!-- Same content as above (repeated for non-touch devices) -->
          <div v-if="isSingleItemSlot && items[mindslot.item]" class="single-item-content">
            <!-- <div v-if="expanded" class="single-item-name-overlay">
              {{ items[mindslot.item]?.name || items[mindslot.item]?.title || 'Unnamed Item' }}
            </div> -->
            <template>
              <div
                class="icon-slot has-item clickable single-item-icon"
                @contextmenu.prevent="handleSingleItemRightClick($event)"
                @touchstart="handleSingleItemTouchStart($event)"
                @touchend="handleSingleItemTouchEnd"
              >
                <div v-if="getSingleItemCustomIcon()" class="custom-icon" v-html="getSingleItemCustomIcon()"></div>
                <div v-else class="icon-item-name">
                  {{ items[mindslot.item]?.name || items[mindslot.item]?.title || 'Unnamed Item' }}
                </div>
              </div>
              <div class="single-item-name">
                {{ items[mindslot.item]?.name || items[mindslot.item]?.title || 'Unnamed Item' }}
              </div>
            </template>
          </div>

          <div v-else-if="isFromMindGrid && currentItemId" class="single-item-content">
            <!-- <div v-if="expanded" class="single-item-name-overlay">
              {{ currentItemName }}
            </div> -->
            <template>
              <div class="icon-slot has-item clickable single-item-icon">
                <div class="icon-item-name">
                  {{ currentItemName }}
                </div>
              </div>
              <div class="single-item-name">
                {{ currentItemName }}
              </div>
            </template>
          </div>

          <div v-else-if="isDirectMultiItem" class="single-item-content">
            <!-- Direct multi-item: show the specific item's cover -->
            <template>
              <div class="icon-slot has-item clickable single-item-icon">
                <div class="icon-item-name">
                  {{ currentItemName }}
                </div>
              </div>
              <div class="single-item-name">
                {{ currentItemName }}
              </div>
            </template>
          </div>

          <div v-else class="empty-slot-wrapper">
            <div v-if="!hasAnyItems" class="empty-slot-text">Empty slot</div>
            <IconSlotGrid
              :initialIcons="mindslot.slotIcons || [null, null, null]"
              :iconItems="mindslot.iconItems || [null, null, null]"
              :customIcons="mindslot.customIcons || [null, null, null]"
              :items="items"
              :clickable="expanded"
              :expanded="expanded"
              @icons-changed="handleIconsChanged"
              @icon-clicked="handleIconClick"
              @icon-right-click="openIconSelector"
              @custom-icon-changed="handleCustomIconsChanged"
            />
          </div>
        </div>

        <!-- Mobile upload button (alternative approach) -->
        <button
          v-if="canUploadImage && isTouchDevice && !showUploadPrompt"
          @click.stop="handleMobileUploadClick"
          class="mobile-upload-button"
          aria-label="Upload cover image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </button>

        <!-- Multi-item navigation on front (for direct multi-item mode cover view) -->
        <div v-if="isDirectMultiItem && !isFlipped" class="multi-item-nav">
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

        <!-- Flip indicator when expanded -->
        <div v-if="expanded && (hasAnyItems || isFromMindGrid || isDirectMultiItem)" class="flip-indicator">
          <span v-if="isSingleItemSlot || isFromMindGrid || isDirectMultiItem">裏返す↩︎</span>
          <span v-else>Click icons to view items →</span>
        </div>
      </div>

      <!-- Card Back: Item Details (remains the same) -->
      <div class="card-face back">
        <!-- Content remains unchanged -->
        <div class="item-window-content">
          <div v-if="!isViewOnly" class="block-option-container">
            <template v-if="!currentItemId">
              <button @click.stop="handleClose" class="icon-button close-button">
                <HeroIcon name="x-mark" class="w-4 h-4" />
              </button>
            </template>

            <template v-else>
              <button class="icon-button editBlock-button" @click.stop="toggleEditBlock">
                <HeroIcon name="pencil" class="w-4 h-4" />
              </button>

              <template v-if="!openedFromMindslot">
                <button class="icon-button moveItem-button" @click.stop="openMoveItemModal">
                  <HeroIcon name="arrows-up-down" class="w-4 h-4" />
                </button>

                <button class="icon-button duplicateBlock-button" @click.stop="openDuplicateDialog">
                  <HeroIcon name="document-duplicate" class="w-4 h-4" />
                </button>

                <button class="icon-button" @click.stop="openDeleteDialog">
                  <HeroIcon name="trash" class="w-4 h-4" />
                </button>

                <button class="icon-button" @click.stop="triggerAddMindslot">
                  +MIND
                </button>
              </template>

              <button v-if="openedFromMindslot" class="icon-button" @click.stop="triggerRemoveMindslot">
                -MIND
              </button>

              <!-- The old icons -->
              <!-- <template v-if="!openedFromMindslot">
                <button class="icon-button moveItem-button" @click.stop="openMoveItemModal">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/>
                    <path d="M3 6l2-4h3l2 4"/>
                    <path d="M8 14h8M16 14l-3 3M16 14l-3-3"/>
                  </svg>
                </button>

                <button class="icon-button duplicateBlock-button" @click.stop="openDuplicateDialog">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="m5 15-1 0a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>

                <button class="icon-button" @click.stop="openDeleteDialog">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                    <path d="m8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>

                <button class="icon-button" @click.stop="triggerAddMindslot">
                  +MIND
                </button>
              </template> -->

              <button @click.stop="flipToSlot" class="icon-button back-button">
                <HeroIcon name="arrow-uturn-left" class="w-6 h-6" />
              </button>

              <button @click.stop="handleClose" class="icon-button close-button">
                <HeroIcon name="x-mark" class="w-4 h-4" />
              </button>
            </template>
          </div>

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
            </div>
          </div>

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
                  @contextmenu.prevent="openIconSelector($event, iconIndex)"
                  @touchstart="handleLargeIconTouchStart($event, iconIndex)"
                  @touchend="handleLargeIconTouchEnd"
                >
                  <div v-if="getLargeCustomIcon(iconIndex)" class="large-custom-icon" v-html="getLargeCustomIcon(iconIndex)"></div>
                  <div v-else-if="item && getItemName" class="large-icon-item-name">
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

        <div v-if="(!isSingleItemSlot && !isFromMindGrid && hasMultipleItems) || isDirectMultiItem" class="multi-item-nav">
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
  </div>

  <!-- Hidden file input with unique ID for label connection -->
  <input
    :id="`slot-image-input-${index}`"
    ref="slotImageUploadInput"
    type="file"
    accept="image/*"
    @change="handleSlotImageUpload"
    style="display: none;"
  >

  <!-- Unified Icon Selector -->
  <IconSelector
    :isVisible="showIconSelector"
    :position="selectorPosition"
    :hasCurrentIcon="hasCurrentIcon"
    :screenPosition="'left'"
    @close="closeIconSelector"
    @select-icon="handleIconSelection"
  />

</template>

<script setup>
  import { ref, computed, watch, nextTick, defineEmits, defineProps } from 'vue'
  import { useStore } from 'vuex'
  import BlockWrapper from '../ItemWindow/blockWrapper.vue'
  import AddBlockButton from '../ItemWindow/addBlockButton.vue'
  import emitter from '@/eventBus'
  import IconSlotGrid from '@/./components/ItemWindow/iconSlotGrid.vue'
  import IconSelector from '@/./components/ItemWindow/IconSelector.vue'

  // Props (same as before)
  const props = defineProps({
    mindslot: {
      type: Object,
      default: () => ({
        name: 'New Slot',
        item: null,
        iconItems: [null, null, null],
        slotIcons: [null, null, null],
        customIcons: [null, null, null]
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
    },
    fromMindGrid: {
      type: Boolean,
      default: false
    }
  })

  // Emits (same as before)
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

  // Share view detection (same as before)
  const isEditMode = computed(() => store.state.mindspace?.isEditMode || false)
  const isSharedView = computed(() => store.state.mindspace?.isSharedView || false)
  const currentShareData = computed(() => store.state.sharing?.currentShareData)
  const isViewOnly = computed(() => {
    if (currentShareData.value?.access) {
      return currentShareData.value.access === 'view'
    }
    return isSharedView.value && !isEditMode.value
  })

  // Reactive state (same as before)
  const isFlipped = ref(props.initialFlipped)
  const isEditingName = ref(false)
  const editingName = ref(props.mindslot.name || 'New Slot')
  const nameInput = ref(null)
  const currentIconIndex = ref(props.directIconIndex >= 0 ? props.directIconIndex : 0)

  // DEBUG: Log props at initialization
  console.log('🔍 [ItemWindow Init] Props:', {
    directIconIndex: props.directIconIndex,
    initialFlipped: props.initialFlipped,
    expanded: props.expanded,
    openedFromMindslot: props.openedFromMindslot
  })

  const viewMode = ref(props.directIconIndex >= 0 ? 'itemContent' : 'slot')

  console.log('🔍 [ItemWindow Init] Initial viewMode:', viewMode.value)

  // Item editing state (same as before)
  const isEditingItemName = ref(false)
  const editedItemName = ref('')
  const itemNameInput = ref(null)

  // Icon selector state (same as before)
  const showIconSelector = ref(false)
  const selectorPosition = ref({ x: 0, y: 0 })
  const currentSlotIconIndex = ref(-1)
  const hasCurrentIcon = ref(false)

  // NEW: Touch device detection and upload prompt
  const isTouchDevice = ref(false)
  const showUploadPrompt = ref(false)

  // Check if device supports touch on mount
  if (typeof window !== 'undefined') {
    isTouchDevice.value = 'ontouchstart' in window ||
                          navigator.maxTouchPoints > 0 ||
                          /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  }

  // Computed properties (same as before)
  const currentItemId = computed(() => store.getters['mindspace/getItemId'])
  const currentItemName = computed(() => store.getters['mindspace/getItemName'] || 'Loading...')
  const currentUid = computed(() => store.getters['mindspace/getUserId'])
  const blocks = computed(() => store.getters['mindspace/getItemBlocks'])
  const isBlockEdit = computed(() => store.state.user.editMonitor.isBlockEdit)

  const isSingleItemSlot = computed(() => {
    return !!(props.mindslot.item && !hasIconItems.value)
  })

  const isFromMindGrid = computed(() => {
    return props.fromMindGrid && !!currentItemId.value
  })

  // Check if opening directly to a specific item in a multi-slot
  const isDirectMultiItem = computed(() => {
    const result = props.directIconIndex >= 0 && hasIconItems.value && !!currentItemId.value
    console.log('🔍 [isDirectMultiItem]', {
      directIconIndex: props.directIconIndex,
      hasIconItems: hasIconItems.value,
      currentItemId: currentItemId.value,
      result
    })
    return result
  })

  // NEW: Check if image upload is available for this slot
  const canUploadImage = computed(() => {
    return (isSingleItemSlot.value && props.mindslot.item) ||
           (isFromMindGrid.value && currentItemId.value)
  })

  const slotImageUploadInput = ref(null)
  let touchTimer = null
  const longPressDelay = 500
  const isLongPressing = ref(false)

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

  // Helper functions (same as before)
  const getCurrentItemImage = () => {
    if (isSingleItemSlot.value && props.mindslot.item) {
      const item = props.items[props.mindslot.item]
      return item?.img || null
    } else if (isFromMindGrid.value && currentItemId.value) {
      const item = props.items[currentItemId.value]
      return item?.img || null
    } else if (isDirectMultiItem.value && currentItemId.value) {
      const item = props.items[currentItemId.value]
      return item?.img || null
    }
    return null
  }

  const getSingleItemCustomIcon = () => {
    if (!isSingleItemSlot.value) return null
    const itemId = props.mindslot.item
    return itemId ? store.getters['user/getItemCustomIcon'](itemId) : null
  }

  const getLargeCustomIcon = (iconIndex) => {
    const iconItems = props.mindslot.iconItems || [null, null, null]
    const itemId = iconItems[iconIndex]
    return itemId ? store.getters['user/getItemCustomIcon'](itemId) : null
  }

  // Icon selector functions (same as before)
  const openIconSelector = (event, iconIndex) => {
    currentSlotIconIndex.value = iconIndex

    if (iconIndex === -1) {
      hasCurrentIcon.value = !!(props.mindslot.customIcons?.[0])
    } else {
      hasCurrentIcon.value = !!(props.mindslot.customIcons?.[iconIndex])
    }

    selectorPosition.value = { x: 0, y: 0 }
    showIconSelector.value = true
  }

  const closeIconSelector = () => {
    showIconSelector.value = false
    currentSlotIconIndex.value = -1
    hasCurrentIcon.value = false
  }

  const handleIconSelection = async (selectedIcon) => {
    if (currentSlotIconIndex.value >= -1) {
      let targetItemId = null
      if (currentSlotIconIndex.value === -1) {
        targetItemId = props.mindslot.item
      } else {
        const iconItems = props.mindslot.iconItems || [null, null, null]
        targetItemId = iconItems[currentSlotIconIndex.value]
      }

      if (!targetItemId) {
        console.warn('No item ID found for icon update')
        closeIconSelector()
        return
      }

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

  // Icon handlers (same as before)
  const handleSingleItemRightClick = (event) => {
    event.preventDefault()
    openIconSelector(event, -1)
  }

  const handleSingleItemTouchStart = (event) => {
    touchTimer = setTimeout(() => {
      openIconSelector(event.touches[0], -1)
    }, longPressDelay)
  }

  const handleSingleItemTouchEnd = () => {
    if (touchTimer) {
      clearTimeout(touchTimer)
      touchTimer = null
    }
  }

  const handleLargeIconTouchStart = (event, iconIndex) => {
    touchTimer = setTimeout(() => {
      openIconSelector(event.touches[0], iconIndex)
    }, longPressDelay)
  }

  const handleLargeIconTouchEnd = () => {
    if (touchTimer) {
      clearTimeout(touchTimer)
      touchTimer = null
    }
  }

  function handleIconsChanged(newIcons) {
    emit('slot-icons-changed', {
      index: props.index,
      icons: newIcons
    })
  }

  const handleCustomIconsChanged = (newCustomIcons) => {
    emit('custom-icons-changed', {
      index: props.index,
      customIcons: newCustomIcons
    })
  }

  // Card interaction methods (same as before)
  async function handleCardClick() {
    console.log('🎮 [handleCardClick] Called with:', {
      expanded: props.expanded,
      expandedSlotIndex: props.expandedSlotIndex,
      directIconIndex: props.directIconIndex,
      openedFromMindslot: props.openedFromMindslot,
      initialFlipped: props.initialFlipped,
      currentViewMode: viewMode.value,
      currentIsFlipped: isFlipped.value,
      hasIconItems: hasIconItems.value
    })

    if (!props.expanded && props.expandedSlotIndex !== null) {
      console.log('🎮 Another slot is expanded - ignoring click on unexpanded card')
      return
    }
    if (!props.expanded) {
      console.log('🎮 emitting click to parent')
      emit('click', props.index)
      return
    }

    if (props.expanded && hasIconItems.value && !isDirectMultiItem.value) {
      console.log('🎮 This is an expanded multi-item card - ignoring background clicks')
      return
    }

    if (props.openedFromMindslot && props.initialFlipped) {
      console.log('🎮 This is a direct icon click - not handling card click')
      return
    }

    // Skip iconGrid view if opening directly to a specific item (but allow flipping)
    if (props.directIconIndex >= 0) {
      console.log('🎮 Direct multi-item mode - allowing flip')
      if (isDirectMultiItem.value) {
        // Toggle flip state for direct multi-item
        isFlipped.value = !isFlipped.value
        console.log('🎮 Toggled flip to:', isFlipped.value)
      }
      return
    }

    if (!isFlipped.value && hasIconItems.value && viewMode.value !== 'itemContent') {
      console.log('🎮 Setting viewMode to iconGrid')
      viewMode.value = 'iconGrid'
      isFlipped.value = true
    } else if (!isFlipped.value && (isSingleItemSlot.value || isFromMindGrid.value)) {
      console.log('🎮 Setting viewMode to itemContent')
      viewMode.value = 'itemContent'
      await flipToItem()
    }
  }

  // NEW: Handle label click to prevent card flip on upload
  const handleLabelClick = (event) => {
    // Don't flip the card when clicking the label for upload
    event.stopPropagation()
  }

  // NEW: Mobile upload button handler
  const handleMobileUploadClick = () => {
    slotImageUploadInput.value?.click()
  }

  // Icon click handler (same as before)
  async function handleIconClick(iconIndex) {
    const iconItems = props.mindslot.iconItems || [null, null, null]
    const itemId = iconItems[iconIndex]

    if (!itemId) {
      return
    }

    const isExpanded = props.expanded

    if (!isExpanded) {
      emit('icon-direct-click', props.index, iconIndex)
      return
    }

    currentIconIndex.value = iconIndex
    viewMode.value = 'itemContent'

    await store.dispatch('mindspace/setItemId', itemId)
    await nextTick()

    isFlipped.value = true
  }

  async function switchToIconItem(iconIndex) {
    const iconItems = props.mindslot.iconItems || [null, null, null]
    const itemId = iconItems[iconIndex]

    if (itemId) {
      currentIconIndex.value = iconIndex
      viewMode.value = 'itemContent'
      await store.dispatch('mindspace/setItemId', itemId)
      await nextTick()
    }
  }

  // Desktop right-click handler (same as before)
  const handleSlotRightClick = (event) => {
    event.preventDefault()
    if (canUploadImage.value && !isTouchDevice.value) {
      slotImageUploadInput.value?.click()
    }
  }

  // UPDATED: Touch handlers for non-iOS or fallback
  const handleSlotTouchStart = () => {
    if (!canUploadImage.value) return

    // For iOS: Show upload prompt overlay
    if (isTouchDevice.value && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
      isLongPressing.value = true

      touchTimer = setTimeout(() => {
        isLongPressing.value = false
        showUploadPrompt.value = true
        if (navigator.vibrate) navigator.vibrate(10)

        // Hide prompt after 3 seconds
        setTimeout(() => {
          showUploadPrompt.value = false
        }, 3000)
      }, longPressDelay)
    }
    // For other devices: Try direct approach
    else {
      isLongPressing.value = true

      touchTimer = setTimeout(() => {
        isLongPressing.value = false
        if (navigator.vibrate) navigator.vibrate(10)
        slotImageUploadInput.value?.click()
      }, longPressDelay)
    }
  }

  const handleSlotTouchEnd = () => {
    isLongPressing.value = false

    if (touchTimer) {
      clearTimeout(touchTimer)
      touchTimer = null
    }
  }

  const handleSlotTouchCancel = () => {
    isLongPressing.value = false
    showUploadPrompt.value = false

    if (touchTimer) {
      clearTimeout(touchTimer)
      touchTimer = null
    }
  }

  // Image upload handler (same as before)
  const handleSlotImageUpload = async (event) => {
    const file = event.target.files[0]
    console.log('🖼️ File selected:', file?.name)

    // Hide upload prompt if shown
    showUploadPrompt.value = false

    let targetItemId = null

    if (isSingleItemSlot.value && props.mindslot.item) {
      targetItemId = props.mindslot.item
    } else if (isFromMindGrid.value && currentItemId.value) {
      targetItemId = currentItemId.value
    }

    if (file && targetItemId) {
      try {
        console.log('🖼️ Uploading image for item:', targetItemId)

        const downloadURL = await store.dispatch('mindspace/handleImageUpload', { file })
        console.log('🖼️ Image uploaded, URL:', downloadURL)

        if (downloadURL) {
          await store.dispatch('mindspace/setItemImage', {
            itemId: targetItemId,
            imageUrl: downloadURL
          })
          console.log('🖼️ Item image updated in both stores')

          emit('refresh-items')
          event.target.value = ''
        }
      } catch (error) {
        console.error('Error uploading slot image:', error)
      }
    }
  }

  // Rest of the functions remain the same...
  async function loadItemAndFlip(itemId) {
    await store.dispatch('mindspace/setItemId', itemId)
    await nextTick()
    isFlipped.value = true
  }

  async function flipToItem() {
    if (isSingleItemSlot.value && props.mindslot.item) {
      await loadItemAndFlip(props.mindslot.item)
    } else if (isFromMindGrid.value && currentItemId.value) {
      isFlipped.value = true
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
    // For direct multi-item, keep viewMode as itemContent to maintain the item context
    if (!isDirectMultiItem.value) {
      viewMode.value = 'slot'
    }
  }

  function handleClose() {
    store.dispatch('user/setIsBlockEdit', false)
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

  async function saveItemName() {
    isEditingItemName.value = false
    if (editedItemName.value !== currentItemName.value) {
      const itemId = currentItemId.value
      const newName = editedItemName.value

      // Update in mindspace store
      await store.dispatch('mindspace/setItemName', newName)

      // Also update in user store to keep them in sync
      await store.dispatch('user/updateItemName', { itemId, name: newName })

      // Emit refresh event so other components update
      emit('refresh-items')
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

    const deletedItemId = currentItemId.value

    // Emit event to clean up slots BEFORE deleting
    emitter.emit('itemDeleted', { itemId: deletedItemId })

    store.dispatch('mindspace/deleteItem', deletedItemId)
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

  // Watchers (same as before)
  watch(() => props.mindslot?.name, (newName) => {
    if (newName) editingName.value = newName
  })

  watch(() => props.initialFlipped, (newValue) => {
    isFlipped.value = newValue
  })

  watch(currentItemName, (newName, oldName) => {
    console.log('[ItemWindow] Item name changed:', { oldName, newName, itemId: currentItemId.value })
  })

  watch(() => props.directIconIndex, async (newIconIndex) => {
    console.log('*** WATCHER TRIGGERED ***', {
      newIconIndex,
      expanded: props.expanded,
      initialFlipped: props.initialFlipped,
      currentViewMode: viewMode.value
    })

    if (newIconIndex >= 0 && props.expanded) {
      console.log('*** WATCHER CONDITIONS MET ***')
      const iconItems = props.mindslot.iconItems || [null, null, null]
      const itemId = iconItems[newIconIndex]

      if (itemId) {
        console.log('*** WATCHER SETTING UP ITEM CONTENT ***', {
          oldViewMode: viewMode.value,
          willSetTo: 'itemContent'
        })
        currentIconIndex.value = newIconIndex
        viewMode.value = 'itemContent'
        await store.dispatch('mindspace/setItemId', itemId)
        await nextTick()
        isFlipped.value = props.initialFlipped  // Respect the initialFlipped prop
        console.log('*** WATCHER COMPLETED ***', {
          finalViewMode: viewMode.value,
          finalIsFlipped: isFlipped.value
        })
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

  // Enhanced styling for large icon grid custom icons
  .large-custom-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: rgb(255, 86, 56);

    svg {
      width: 80%;
      height: 80%;
      max-width: 96px;
      max-height: 96px;
      stroke: currentColor;
      fill: none;
    }
  }

  // Ensure consistent icon appearance across views
  .custom-icon,
  .large-custom-icon {
    svg {
      stroke: rgb(255, 86, 56);
      fill: none;
    }
  }

  .slot-content {
    /* Prevent all text selection and touch defaults */
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
    touch-action: manipulation;

    /* Prevent highlighting on tap */
    -webkit-tap-highlight-color: transparent;
  }

  .slot-content.long-pressing {
    transform: scale(1.02) translateZ(0);
    filter: brightness(0.95);
    box-shadow:
      0 4px 12px rgba(0,0,0,0.08),
      inset 0 2px 4px rgba(0,0,0,0.06);
    transition: all 0.15s cubic-bezier(0.2, 0.0, 0.6, 1);
    opacity: 0.9;
  }

  // Label wrapper for iOS compatibility
  .slot-content-label {
    display: block;
    width: 100%;
    height: 100%;
    position: relative;
    cursor: pointer;
  }

  // Upload prompt overlay
  .upload-prompt-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    animation: fadeIn 0.3s ease;
  }

  .upload-prompt-content {
    text-align: center;
    padding: 20px;

    svg {
      color: rgb(255, 86, 56);
      margin-bottom: 12px;
    }

    p {
      color: #333;
      font-size: 16px;
      font-weight: 500;
      margin: 0;
    }
  }

  // Mobile upload button (alternative approach)
  .mobile-upload-button {
    position: absolute;
    top: 60px;
    right: 12px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgb(50, 50, 50);
    opacity: 50%;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 5;

    &:hover {
      background: #f8f8f8;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    svg {
      color: rgb(255, 255, 255);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
