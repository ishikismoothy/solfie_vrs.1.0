<!-- Enhanced IconSlotGrid.vue - With item names beneath icons -->
<template>
  <div class="icon-slot-grid" :class="{ expanded: expanded }">
    <template v-for="index in 3" :key="`slot-${index-1}`">
      <!-- Wrapper for each slot position -->
      <div class="slot-wrapper">
        <div
          v-if="getItem(index-1)"
          :class="['icon-slot', 'has-item', {
            'clickable': clickable,
            'expanded-view': expanded
          }]"
          @click="handleIconClick(index-1)"
          @contextmenu.prevent="handleRightClick($event, index-1)"
          @touchstart="handleTouchStart($event, index-1)"
          @touchend="handleTouchEnd"
        >
          <!-- Icon display area -->
          <div class="icon-display-area">
            <!-- Custom Icon Display from global store (if set) -->
            <div v-if="getGlobalCustomIcon(index-1)" class="custom-icon unified-icon" v-html="getGlobalCustomIcon(index-1)"></div>
            <!-- Default item name display when no custom icon -->
            <div v-else class="icon-item-name">
              {{ getItemName(index-1) }}
            </div>
            <!-- Click indicator for expanded items -->
            <!-- <div v-if="expanded && clickable" class="click-indicator">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div> -->
          </div>
        </div>

        <!-- Empty slot with unified mindspace styling -->
        <div
          v-else
          :class="['icon-slot', 'empty-slot', 'mindspace-style']"

          @contextmenu.prevent="handleRightClick($event, index-1)"
          @touchstart="handleTouchStart($event, index-1)"
          @touchend="handleTouchEnd"
        >
          <div class="empty-slot-placeholder">
            <!-- Optional: Add a subtle "+" icon for better UX -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.4;">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
        </div>

        <!-- Item name beneath the icon - always show when item exists -->
        <div v-if="getItem(index-1) && getItemName(index-1)" class="slot-item-name">
          {{ getItemName(index-1) }}
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
  import { defineProps, defineEmits } from 'vue'
  import { useStore } from 'vuex'

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
      default: () => [null, null, null]
    },
    items: {
      type: Object,
      default: () => ({})
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

  const emit = defineEmits(['icons-changed', 'icon-clicked', 'custom-icon-changed', 'click', 'icon-right-click', 'empty-slot-clicked'])

  const store = useStore()

  // Touch handling for long press
  let touchTimer = null
  const longPressDelay = 500

  // Get item at index
  const getItem = (index) => {
    if (!props.iconItems || index < 0 || index >= props.iconItems.length) {
      return null
    }
    return props.iconItems[index] || null
  }

  // Get custom icon from global store using item ID
  const getGlobalCustomIcon = (index) => {
    const itemId = getItem(index)
    if (!itemId) return null

    try {
      return store.getters['user/getItemCustomIcon'](itemId)
    } catch (error) {
      console.warn('Error getting custom icon:', error)
      return null
    }
  }

  // Get item name at index
  const getItemName = (index) => {
    const itemId = getItem(index)
    if (!itemId) return null

    try {
      // First try to get from props.items
      if (props.items && props.items[itemId]) {
        const item = props.items[itemId]
        return item?.name || item?.title || null
      }

      // If not found in props, try the store getter
      if (store.getters['user/getItemName']) {
        return store.getters['user/getItemName'](itemId)
      }

      return null
    } catch (error) {
      console.warn('Error getting item name:', error)
      return null
    }
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
    emit('icon-right-click', index, event)
  }

  // Handle touch start for long press
  const handleTouchStart = (event, index) => {
    if (touchTimer) {
      clearTimeout(touchTimer)
    }

    touchTimer = setTimeout(() => {
      emit('icon-right-click', index, event.touches ? event.touches[0] : event)
    }, longPressDelay)
  }

  // Handle touch end
  const handleTouchEnd = () => {
    if (touchTimer) {
      clearTimeout(touchTimer)
      touchTimer = null
    }
  }

</script>

<style lang="scss">
  @import '@/assets/itemWindowStyle.scss';
</style>
