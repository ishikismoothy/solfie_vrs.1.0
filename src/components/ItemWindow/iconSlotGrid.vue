<!-- Enhanced IconSlotGrid.vue with correct imports -->
<template>
  <div class="icon-slot-grid" :class="{ expanded: expanded }">
    <template v-for="(icon, index) in 3" :key="index">
      <div
        v-if="getItem(index)"
        :class="['icon-slot', 'has-item', {
          'clickable': true,
          'expanded-view': expanded
        }]"
        @click="handleIconClick(index)"
        @contextmenu.prevent="handleRightClick($event, index)"
        @touchstart="handleTouchStart($event, index)"
        @touchend="handleTouchEnd"
      >
        <!-- Custom Icon Display (if set) -->
        <div v-if="getCustomIcon(index)" class="custom-icon" v-html="getCustomIcon(index)"></div>

        <!-- Display item name if available and no custom icon -->
        <div v-else-if="getItemName" class="icon-item-name">
          {{ getItemName(getItem(index)) }}
        </div>

        <!-- Click indicator for expanded items -->
        <div v-if="expanded" class="click-indicator">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>

      <!-- Empty slot with right-click/long-press capability -->
      <div
        v-else
        :class="['icon-slot', 'empty-slot']"
        @contextmenu.prevent="handleRightClick($event, index)"
        @touchstart="handleTouchStart($event, index)"
        @touchend="handleTouchEnd"
      >
        <div class="empty-slot-placeholder">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </div>
      </div>
    </template>
  </div>

  <!-- Icon Selector Component - Teleported to body -->
  <Teleport to="body">
    <IconSelector
      :isVisible="showIconSelector"
      :position="selectorPosition"
      :hasCurrentIcon="hasCurrentIcon"
      @close="closeIconSelector"
      @select-icon="handleIconSelection"
    />
  </Teleport>
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue'
import IconSelector from './IconSelector.vue'

const props = defineProps({
  initialIcons: {
    type: Array,
    default: () => [null, null, null]
  },
  iconItems: {
    type: Array,
    default: () => [null, null, null]
  },
  customIcons: {
    type: Array,
    default: () => [null, null, null] // Array of custom icon SVG strings
  },
  getItemName: {
    type: Function,
    default: null
  },
  clickable: {
    type: Boolean,
    default: false
  },
  expanded: {
    type: Boolean,
    default: false
  }
})

  const emit = defineEmits(['icons-changed', 'icon-clicked', 'custom-icon-changed', 'click'])

// Icon selector state
const showIconSelector = ref(false)
const selectorPosition = ref({ x: 0, y: 0 })
const currentSlotIndex = ref(-1)
const hasCurrentIcon = ref(false)

// Touch handling for long press
let touchTimer = null
const longPressDelay = 500 // 500ms for long press

// Get item at index
const getItem = (index) => {
  return props.iconItems?.[index] || null
}

// Get custom icon at index
const getCustomIcon = (index) => {
  return props.customIcons?.[index] || null
}

// Handle icon click
const handleIconClick = (index) => {
  const item = getItem(index)
  console.log('IconSlotGrid: Icon clicked', index, 'item:', item)

  // Always emit the click - let parent decide what to do
  emit('icon-clicked', index)
}

// Handle right click for icon selection
const handleRightClick = (event, index) => {
  event.preventDefault()
  openIconSelector(event, index)
}

// Handle touch start for long press
const handleTouchStart = (event, index) => {
  touchTimer = setTimeout(() => {
    openIconSelector(event.touches[0], index)
  }, longPressDelay)
}

// Handle touch end
const handleTouchEnd = () => {
  if (touchTimer) {
    clearTimeout(touchTimer)
    touchTimer = null
  }
}

// Open icon selector
const openIconSelector = (event, index) => {
  currentSlotIndex.value = index
  hasCurrentIcon.value = !!getCustomIcon(index)

  // Position doesn't matter now since we center it, but keeping for compatibility
  selectorPosition.value = {
    x: 0,
    y: 0
  }

  showIconSelector.value = true
}

// Close icon selector
const closeIconSelector = () => {
  showIconSelector.value = false
  currentSlotIndex.value = -1
  hasCurrentIcon.value = false
}

// Handle icon selection
const handleIconSelection = (selectedIcon) => {
  console.log('handleIconSelection called with:', selectedIcon) // Debug
  if (currentSlotIndex.value >= 0) {
    const newCustomIcons = [...(props.customIcons || [null, null, null])]

    if (selectedIcon === null) {
      // Remove custom icon - explicitly set to null
      newCustomIcons[currentSlotIndex.value] = null
      console.log('Removing icon at index:', currentSlotIndex.value) // Debug
    } else {
      // Set new custom icon - ensure it's a string, not undefined
      const svgContent = selectedIcon.svg || null
      newCustomIcons[currentSlotIndex.value] = svgContent
      console.log('Setting icon at index:', currentSlotIndex.value, 'SVG length:', svgContent?.length) // Debug
    }

    // Ensure no undefined values in the array
    const safeCustomIcons = newCustomIcons.map(icon => icon === undefined ? null : icon)
    console.log('Emitting custom-icon-changed with:', safeCustomIcons) // Debug

    emit('custom-icon-changed', safeCustomIcons)
  }
}

</script>

<style lang="scss">
@import '@/assets/itemWindowStyle.scss';
</style>
