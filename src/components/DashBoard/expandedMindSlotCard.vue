<!-- expandedMindSlotCard.vue -->
<template>
  <div class="expanded-card-container" :class="{ flipped: showItem }">
    <!-- Front side - Mind Slot Card -->
    <div class="card-side front">
      <mind-slot-card
        :mindslot="mindslot"
        :index="index"
        :getItemImage="getItemImage"
        :getItemName="getItemName"
        :expanded="true"
        @delete="$emit('delete', index)"
        @name-change="$emit('name-change', $event)"
        @click="flipToItem"
        class="expanded-slot-card"
      />
    </div>

    <!-- Back side - Item Display -->
    <div class="card-side back">
      <div class="item-display">
        <div class="item-header">
          <button @click="flipToSlot" class="back-button">← Back to Slot</button>
          <button @click="$emit('close')" class="close-button">×</button>
        </div>

        <div class="item-content">
          <div v-if="itemData" class="item-details">
            <div class="item-image" v-if="itemData.image">
              <img :src="itemData.image" :alt="itemData.name" />
            </div>
            <h2 class="item-name">{{ itemData.name }}</h2>
            <div class="item-description" v-if="itemData.description">
              {{ itemData.description }}
            </div>
            <!-- Add any other item properties you want to display -->
          </div>
          <div v-else class="no-item">
            <p>No item selected for this slot</p>
            <button @click="$emit('select-item', index)" class="select-item-btn">
              Select an Item
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, defineEmits, defineProps } from 'vue'
import MindSlotCard from './mindSlotCard.vue'

const props = defineProps({
  mindslot: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  getItemImage: Function,
  getItemName: Function,
  items: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['delete', 'name-change', 'close', 'select-item'])

const showItem = ref(false)

// Get full item data
const itemData = computed(() => {
  if (!props.mindslot.item || !props.items.value) return null
  return props.items.value[props.mindslot.item] || null
})

// Flip functions
function flipToItem() {
  if (props.mindslot.item) {
    showItem.value = true
  } else {
    // If no item, emit event to select one
    emit('select-item', props.index)
  }
}

function flipToSlot() {
  showItem.value = false
}

// Reset flip state when mindslot changes
watch(() => props.mindslot, () => {
  showItem.value = false
})
</script>

<style scoped>
.expanded-card-container {
  position: relative;
  width: 100%;
  height: 100%;
  perspective: 1000px;
}

.card-side {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  transition: transform 0.6s;
  border-radius: 8px;
  background-color: white;
}

.front {
  transform: rotateY(0deg);
}

.back {
  transform: rotateY(180deg);
}

.expanded-card-container.flipped .front {
  transform: rotateY(-180deg);
}

.expanded-card-container.flipped .back {
  transform: rotateY(0deg);
}

.expanded-slot-card {
  height: 100%;
}

.item-display {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.back-button, .close-button {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
}

.back-button:hover, .close-button:hover {
  background-color: #f0f0f0;
}

.item-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.item-details {
  text-align: center;
}

.item-image img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.item-name {
  font-size: 24px;
  margin-bottom: 15px;
  color: #333;
}

.item-description {
  font-size: 16px;
  line-height: 1.6;
  color: #666;
}

.no-item {
  text-align: center;
  padding: 40px 20px;
}

.select-item-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 15px;
}

.select-item-btn:hover {
  background-color: #0056b3;
}
</style>
