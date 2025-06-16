<!-- IconSlotGrid.vue -->
<template>
  <div class="icon-slot-grid">
    <div
      v-for="(slot, index) in iconSlots"
      :key="index"
      class="icon-slot"
      :class="{ 'filled': slot.icon, 'empty': !slot.icon }"
      @click="openIconLibrary(index)"
    >
      <i v-if="slot.icon" :class="slot.icon" class="slot-icon"></i>
      <div v-else class="empty-slot-indicator">+</div>
    </div>

    <!-- Icon Library Modal -->
    <div v-if="showIconLibrary" class="icon-library-overlay" @click="closeIconLibrary">
      <div class="icon-library-modal" @click.stop>
        <div class="library-header">
          <h3>Choose an Icon</h3>
          <button @click="closeIconLibrary" class="close-btn">×</button>
        </div>

        <div class="library-content">
          <div class="icon-categories">
            <button
              v-for="category in iconCategories"
              :key="category.name"
              @click="selectedCategory = category.name"
              :class="{ 'active': selectedCategory === category.name }"
              class="category-btn"
            >
              {{ category.name }}
            </button>
          </div>

          <div class="icons-grid">
            <div
              v-for="icon in currentCategoryIcons"
              :key="icon"
              @click="selectIcon(icon)"
              class="icon-option"
            >
              <i :class="icon" class="preview-icon"></i>
            </div>
          </div>

          <div class="library-actions">
            <button @click="clearSlot" class="clear-btn" v-if="selectedSlotIndex !== null && iconSlots[selectedSlotIndex].icon">
              Clear Icon
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

const props = defineProps({
  initialIcons: {
    type: Array,
    default: () => [null, null, null]
  }
})

const emit = defineEmits(['icons-changed'])

// Icon slots state
const iconSlots = ref([
  { icon: props.initialIcons[0] },
  { icon: props.initialIcons[1] },
  { icon: props.initialIcons[2] }
])

// Modal state
const showIconLibrary = ref(false)
const selectedSlotIndex = ref(null)
const selectedCategory = ref('General')

// Icon library - you can expand this
const iconCategories = ref([
  {
    name: 'General',
    icons: [
      'fas fa-star',
      'fas fa-heart',
      'fas fa-home',
      'fas fa-user',
      'fas fa-cog',
      'fas fa-bell',
      'fas fa-envelope',
      'fas fa-phone',
      'fas fa-camera',
      'fas fa-music',
      'fas fa-book',
      'fas fa-calendar'
    ]
  },
  {
    name: 'Activities',
    icons: [
      'fas fa-running',
      'fas fa-swimming-pool',
      'fas fa-dumbbell',
      'fas fa-bicycle',
      'fas fa-gamepad',
      'fas fa-paint-brush',
      'fas fa-guitar',
      'fas fa-utensils',
      'fas fa-coffee',
      'fas fa-pizza-slice',
      'fas fa-cocktail',
      'fas fa-wine-glass'
    ]
  },
  {
    name: 'Work',
    icons: [
      'fas fa-briefcase',
      'fas fa-laptop',
      'fas fa-chart-bar',
      'fas fa-clipboard',
      'fas fa-folder',
      'fas fa-file-alt',
      'fas fa-pen',
      'fas fa-calculator',
      'fas fa-code',
      'fas fa-database',
      'fas fa-server',
      'fas fa-bug'
    ]
  },
  {
    name: 'Nature',
    icons: [
      'fas fa-tree',
      'fas fa-leaf',
      'fas fa-sun',
      'fas fa-moon',
      'fas fa-cloud',
      'fas fa-rainbow',
      'fas fa-snowflake',
      'fas fa-fire',
      'fas fa-water',
      'fas fa-mountain',
      'fas fa-seedling',
      'fas fa-flower'
    ]
  },
  {
    name: 'Travel',
    icons: [
      'fas fa-plane',
      'fas fa-car',
      'fas fa-train',
      'fas fa-ship',
      'fas fa-bus',
      'fas fa-motorcycle',
      'fas fa-map',
      'fas fa-compass',
      'fas fa-suitcase',
      'fas fa-passport',
      'fas fa-globe',
      'fas fa-map-marker-alt'
    ]
  }
])

const currentCategoryIcons = computed(() => {
  const category = iconCategories.value.find(cat => cat.name === selectedCategory.value)
  return category ? category.icons : []
})

// Methods
function openIconLibrary(slotIndex) {
  selectedSlotIndex.value = slotIndex
  showIconLibrary.value = true
}

function closeIconLibrary() {
  showIconLibrary.value = false
  selectedSlotIndex.value = null
}

function selectIcon(iconClass) {
  if (selectedSlotIndex.value !== null) {
    iconSlots.value[selectedSlotIndex.value].icon = iconClass
    emitIconsChanged()
    closeIconLibrary()
  }
}

function clearSlot() {
  if (selectedSlotIndex.value !== null) {
    iconSlots.value[selectedSlotIndex.value].icon = null
    emitIconsChanged()
    closeIconLibrary()
  }
}

function emitIconsChanged() {
  const icons = iconSlots.value.map(slot => slot.icon)
  emit('icons-changed', icons)
}
</script>

<style scoped>
.icon-slot-grid {
  display: flex;
  gap: 8px;
  padding: 12px;
  justify-content: center;
  align-items: center;
}

.icon-slot {
  width: 32px;
  height: 32px;
  border: 2px dashed #ccc;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.7);
}

.icon-slot.empty {
  border-color: #ddd;
}

.icon-slot.empty:hover {
  border-color: #4a90e2;
  background: rgba(74, 144, 226, 0.1);
}

.icon-slot.filled {
  border: 2px solid #4a90e2;
  background: rgba(74, 144, 226, 0.1);
}

.icon-slot.filled:hover {
  background: rgba(74, 144, 226, 0.2);
  transform: scale(1.05);
}

.slot-icon {
  font-size: 16px;
  color: #4a90e2;
}

.empty-slot-indicator {
  font-size: 14px;
  color: #999;
  font-weight: bold;
}

/* Modal Styles */
.icon-library-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.icon-library-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.library-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #ff4444;
}

.library-content {
  padding: 20px;
  max-height: calc(80vh - 80px);
  overflow-y: auto;
}

.icon-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.category-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.category-btn:hover {
  background: #f0f0f0;
}

.category-btn.active {
  background: #4a90e2;
  color: white;
  border-color: #4a90e2;
}

.icons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.icon-option {
  width: 50px;
  height: 50px;
  border: 1px solid #ddd;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.icon-option:hover {
  border-color: #4a90e2;
  background: rgba(74, 144, 226, 0.1);
  transform: scale(1.05);
}

.preview-icon {
  font-size: 20px;
  color: #333;
}

.library-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.clear-btn {
  padding: 10px 20px;
  border: 1px solid #ff4444;
  border-radius: 6px;
  background: white;
  color: #ff4444;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #ff4444;
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .icon-library-modal {
    width: 95%;
    max-height: 85vh;
  }

  .icons-grid {
    grid-template-columns: repeat(auto-fill, minmax(45px, 1fr));
    gap: 8px;
  }

  .icon-option {
    width: 45px;
    height: 45px;
  }

  .preview-icon {
    font-size: 18px;
  }
}
</style>
