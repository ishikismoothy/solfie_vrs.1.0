<!-- ItemSelectionGrid.vue - Enhanced with theme filtering and proper refresh -->
<template>
  <div
    v-if="isVisible"
    class="icon-selector-overlay"
    :class="screenPositionClass"
    @click="closeSelector"
    @contextmenu.prevent
  >
    <div
      class="icon-selector-menu"
      @click.stop
    >
      <div class="icon-selector-header">
        <h4>{{ headerTitle }}</h4>
        <button @click="closeSelector" class="close-btn">×</button>
      </div>

      <!-- Selection Summary for Multi-select -->
      <div v-if="slotType === 'multi'" class="selection-summary">
        <div class="selection-count">
          Selected: {{ selectedItems.length }} / {{ maxItems }}
        </div>
        <div v-if="selectedItems.length > 0" class="selected-items-preview">
          <div
            v-for="(item, index) in selectedItems"
            :key="item.id"
            class="selected-item-badge"
          >
            <span class="item-order">{{ index + 1 }}</span>
            <span class="item-name">{{ getItemDisplayName(item) }}</span>
            <button
              @click="removeFromSelection(item.id)"
              class="remove-selection-btn"
            >×</button>
          </div>
        </div>
      </div>

      <div class="icon-grid">
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading items...</p>
        </div>

        <div v-else-if="availableItems.length === 0" class="empty-state">
          <div class="empty-slot-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </div>
          <h4>No Items Available</h4>
          <p>Create some items in your current theme first, then come back to fill your slots.</p>
        </div>

        <template v-else>
          <div
            v-for="item in availableItems"
            :key="item.id"
            :class="['icon-option', {
              'selected': isItemSelected(item.id),
              'disabled': !canSelectItem(item.id)
            }]"
            @click="handleItemClick(item)"
            :title="getItemDisplayName(item)"
          >
            <!-- Selection indicator -->
            <div v-if="isItemSelected(item.id)" class="selection-indicator">
              {{ getSelectionOrder(item.id) }}
            </div>

            <div class="icon-preview">
              <!-- Show custom icon if available -->
              <div v-if="getItemCustomIcon(item.id)" class="custom-icon" v-html="getItemCustomIcon(item.id)"></div>
              <!-- Show item name if no custom icon -->
              <div v-else class="icon-item-name">
                {{ getItemDisplayName(item) }}
              </div>
            </div>
            <span class="icon-name">{{ getItemDisplayName(item) }}</span>
          </div>
        </template>
      </div>

      <!-- Action Buttons -->
      <div class="selection-actions">
        <button
          v-if="slotType === 'single'"
          @click="confirmSelection"
          :disabled="selectedItems.length === 0"
          class="confirm-btn primary"
        >
          Select Item
        </button>

        <template v-else>
          <button
            @click="confirmSelection"
            :disabled="selectedItems.length === 0"
            class="confirm-btn primary"
          >
            Select {{ selectedItems.length }} Item{{ selectedItems.length !== 1 ? 's' : '' }}
          </button>
          <button
            @click="clearSelection"
            :disabled="selectedItems.length === 0"
            class="confirm-btn secondary"
          >
            Clear All
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineProps, defineEmits, watch } from 'vue'
import { useStore } from 'vuex'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  slotIndex: {
    type: Number,
    default: -1
  },
  slotType: {
    type: String,
    default: 'single', // 'single' or 'multi'
    validator: (value) => ['single', 'multi'].includes(value)
  },
  screenPosition: {
    type: String,
    default: 'left', // 'left', 'right', or 'center'
    validator: (value) => ['left', 'right', 'center'].includes(value)
  }
})

const emit = defineEmits(['close', 'select-item'])

const store = useStore()

// Reactive state
const isLoading = ref(false)
const selectedItems = ref([])
const maxItems = 3

// Compute the CSS class based on screen position
const screenPositionClass = computed(() => {
  if (props.screenPosition === 'left') return 'left-screen'
  if (props.screenPosition === 'right') return 'right-screen'
  return '' // center (default)
})

// Get current theme ID to filter items
const currentThemeId = computed(() => store.getters['mindspace/getThemeId'])

// Computed properties - FIXED: Filter by current theme and refresh properly
const items = computed(() => store.getters['user/getItems'])
const mindspacePages = computed(() => store.getters['mindspace/getMindSpacePages'])

const availableItems = computed(() => {
  console.log('🔍 [ItemSelectionGrid] Computing available items...')
  console.log('🔍 Current theme ID:', currentThemeId.value)
  console.log('🔍 All items count:', Object.keys(items.value).length)
  console.log('🔍 Mindspace pages:', mindspacePages.value?.length)

  if (!currentThemeId.value || !mindspacePages.value) {
    console.log('🔍 Missing theme ID or mindspace pages')
    return []
  }

  // Get all item IDs that exist in the current theme's mindspace
  const currentThemeItemIds = new Set()

  mindspacePages.value.forEach(page => {
    if (page?.items) {
      page.items.forEach(item => {
        if (item?.id) {
          currentThemeItemIds.add(item.id)
          // Also add items from folders if they exist
          if (item.items && Array.isArray(item.items)) {
            item.items.forEach(folderItem => {
              if (folderItem?.id) {
                currentThemeItemIds.add(folderItem.id)
              }
            })
          }
        }
      })
    }
  })

  console.log('🔍 Current theme item IDs:', Array.from(currentThemeItemIds))

  // Filter items to only include those in current theme
  const filteredItems = Object.entries(items.value)
    .filter(([itemId]) => currentThemeItemIds.has(itemId))
    .map(([id, item]) => ({
      id,
      ...item
    }))

  console.log('🔍 Filtered items for current theme:', filteredItems.length)

  return filteredItems
})

const headerTitle = computed(() => {
  if (props.slotType === 'single') {
    return 'Select Item for Single Slot'
  } else {
    return 'Select Items for Multi Slot'
  }
})

// Helper functions
const getItemDisplayName = (item) => {
  return item?.name || item?.title || 'Unnamed Item'
}

const getItemCustomIcon = (itemId) => {
  return store.getters['user/getItemCustomIcon'](itemId)
}

const isItemSelected = (itemId) => {
  return selectedItems.value.some(item => item.id === itemId)
}

const canSelectItem = (itemId) => {
  // For single slot, can always select (will replace current selection)
  if (props.slotType === 'single') return true

  // For multi slot, can select if not at max or if already selected
  return selectedItems.value.length < maxItems || isItemSelected(itemId)
}

const getSelectionOrder = (itemId) => {
  const index = selectedItems.value.findIndex(item => item.id === itemId)
  return index !== -1 ? index + 1 : ''
}

// Selection management
const handleItemClick = (item) => {
  if (props.slotType === 'single') {
    // Single slot: replace selection
    selectedItems.value = [item]
  } else {
    // Multi slot: toggle selection
    const existingIndex = selectedItems.value.findIndex(selected => selected.id === item.id)

    if (existingIndex !== -1) {
      // Remove from selection
      selectedItems.value.splice(existingIndex, 1)
    } else if (selectedItems.value.length < maxItems) {
      // Add to selection (maintain order)
      selectedItems.value.push(item)
    }
  }
}

const removeFromSelection = (itemId) => {
  selectedItems.value = selectedItems.value.filter(item => item.id !== itemId)
}

const clearSelection = () => {
  selectedItems.value = []
}

const confirmSelection = () => {
  if (selectedItems.value.length === 0) return

  // Emit the selection with item IDs in the order they were selected
  const selectedItemIds = selectedItems.value.map(item => item.id)

  emit('select-item', {
    itemIds: selectedItemIds,
    slotIndex: props.slotIndex,
    slotType: props.slotType
  })

  closeSelector()
}

const closeSelector = () => {
  selectedItems.value = []
  emit('close')
}

// FIXED: Load and refresh items properly
const refreshItems = async () => {
  isLoading.value = true
  try {
    const userId = store.state.user?.user?.uid
    if (userId) {
      console.log('🔄 [ItemSelectionGrid] Refreshing items for user:', userId)
      await store.dispatch('user/fetchItems', userId)

      // Also refresh mindspace pages to ensure we have the latest data
      if (currentThemeId.value) {
        await store.dispatch('mindspace/setMindSpacePages')
      }
    }
  } catch (error) {
    console.error('❌ [ItemSelectionGrid] Error refreshing items:', error)
  } finally {
    isLoading.value = false
  }
}

// Watch for visibility changes and refresh data
watch(() => props.isVisible, async (newValue) => {
  if (newValue) {
    selectedItems.value = [] // Reset selection when opening
    await refreshItems()
  }
})

// Watch for theme changes and refresh
watch(currentThemeId, async (newThemeId, oldThemeId) => {
  if (newThemeId && newThemeId !== oldThemeId && props.isVisible) {
    console.log('🔄 [ItemSelectionGrid] Theme changed, refreshing items')
    await refreshItems()
  }
})

// Close on escape key
const handleEscape = (event) => {
  if (event.key === 'Escape' && props.isVisible) {
    closeSelector()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style lang="scss">
@import "../../assets/styles/colors";
// Additional styles specific to item selection (using existing classes as base)
.icon-selector-overlay {
  // Ensure item selection modal appears above other modals
  z-index: 999999 !important;
}

.selection-summary {
  padding: 12px 16px;
  background: $background-white;
  border-radius: 8px;
  margin-bottom: 16px;
  // border: 1px solid $border-light;
}

.selection-count {
  font-size: 14px;
  font-weight: 600;
  color: $text-color;
  margin-bottom: 8px;
}

.selected-items-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.selected-item-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: $primary-sub-color;
  color: $white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;

  .item-order {
    background: rgba(255, 255, 255, 0.3);
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: bold;
  }

  .item-name {
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .remove-selection-btn {
    background: none;
    border: none;
    color: $white;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    padding: 0;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

.icon-option {
  position: relative;

  &.selected {
    background: $success-bg !important;
    border-color: $success-border !important;
    transform: translateY(1px);
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;

    &:hover {
      background: inherit !important;
      border-color: inherit !important;
      transform: none;
    }
  }

  &:hover:not(.disabled) {
    background: $success-bg !important;
    border-color: $success-border !important;
    transform: translateY(1px);
  }
}

.selection-indicator {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  background: $success-bg;
  color: $white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  z-index: 10;
  border: 2px solid $success-border;
}

.selection-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid $border-light;
}

.confirm-btn {
  flex: 1;
  padding: 12px 16px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.primary {
    background: $success-bg;
    color: $white;

    &:hover:not(:disabled) {
      background: #16a34a;
      transform: translateY(-1px);
    }
  }

  &.secondary {
    background: $gray-100;
    color: $text-secondary;
    border: 1px solid $border-color;

    &:hover:not(:disabled) {
      background: $gray-200;
      color: $text-color;
    }
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: $text-secondary;
  grid-column: 1 / -1;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid $gray-200;
  border-top: 3px solid $primary-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: $text-secondary;
  grid-column: 1 / -1;

  h4 {
    margin: 16px 0 8px 0;
    color: $text-color;
    font-size: 18px;
  }

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    max-width: 300px;
  }
}
</style>
