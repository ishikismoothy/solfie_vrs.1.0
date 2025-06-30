<!-- Simplified IconSlotGrid.vue -->
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
      >
        <!-- Display item name if available -->
        <div v-if="getItemName" class="icon-item-name">
          {{ getItemName(getItem(index)) }}
        </div>

        <!-- Remove button for items (when not expanded) -->
        <button
          v-if="!expanded"
          @click.stop="removeItem(index)"
          class="remove-item-btn"
        >
          ×
        </button>

        <!-- Click indicator for expanded items -->
        <div v-if="expanded" class="click-indicator">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  initialIcons: {
    type: Array,
    default: () => [null, null, null]
  },
  iconItems: {
    type: Array,
    default: () => [null, null, null]
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

const emit = defineEmits(['icons-changed', 'icon-clicked'])

// Get item at index
const getItem = (index) => {
  return props.iconItems?.[index] || null
}

// Handle icon click
const handleIconClick = (index) => {
  const item = getItem(index)
  console.log('IconSlotGrid: Icon clicked', index, 'item:', item)

  // Always emit the click - let parent decide what to do
  emit('icon-clicked', index)
}

// Remove item from icon slot
const removeItem = (index) => {
  console.log('Removing item at index:', index)
  emit('icons-changed', props.initialIcons.map((icon, i) => i === index ? null : icon))
}

</script>
