<!-- mindSlotCard.vue -->
<template>
  <div
    class="mind-slot-card"
    :class="{ expanded: expanded, flipped: expanded && isFlipped }"
    @click="toggleFlip"
  >
    <div class="front">
      <!-- Slot Header -->
      <div class="slot-header">
        <input
          v-if="isEditing"
          v-model="editingName"
          @blur="saveSlotName(index)"
          @keyup.enter="saveSlotName(index)"
          class="slot-name-input"
        />
        <h3 v-else class="slot-name" @click.stop="startEditing">
          {{ mindslot.name }}
        </h3>
        <button @click.stop="$emit('delete', index)" class="delete-btn">×</button>
      </div>

      <!-- Slot Content -->
      <div
        class="slot-content"
        :style="{ backgroundImage: getItemImage(mindslot.item) }"
      >
        <div v-if="getItemName(mindslot.item)" class="item-content">
          {{ getItemName(mindslot.item) }}
        </div>
        <div v-else class="empty-slot">
          Click to select item
        </div>
      </div>
    </div>

    <div class="back" v-if="isFlipped">
      <div>Loading item with ID: {{ currentItemId }}</div>
      <ItemWindow
        :itemId="props.mindslot.item"
        :isOpen="true"
        :key="itemWindowKey"
      />
    </div>
  </div>
</template>

<script setup>
  import { ref, watch, defineEmits, defineProps, computed } from 'vue'
  import ItemWindow from '../ItemWindow/itemWindow.vue'
  import { useStore } from 'vuex'

  const store = useStore()

  // Props & emits
  const props = defineProps({
    mindslot: {
      type: Object,
      default: () => ({ name: 'New Slot', item: null })
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
    flipped: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['delete', 'select', 'name-change', 'click'])

  // Local state for editing name
  const isEditing = ref(false)
  const editingName = ref(props.mindslot.name || 'New Slot')

  // Flip state
  const isFlipped = ref(false)

  const itemWindowKey = computed(() => {
    // Use the actual item ID from props instead of store
    const itemId = props.mindslot?.item || 'no-item';
    return `${itemId}-${isFlipped.value ? 'flipped' : 'notflipped'}`;
  });

  // const itemWindowKey = computed(() => {
  //   return `${currentItemId.value}-${isFlipped.value ? 'flipped' : 'notflipped'}`
  // })

  async function toggleFlip() {
    const newItemId = props.mindslot.item;
    console.log('Flipping card for item:', newItemId);

    // If there's no item (empty slot), clear the store data
    if (!newItemId || newItemId === null || newItemId === undefined) {
      console.log('Empty slot detected, clearing store data');

      // Clear the store data for empty slots
      store.commit('mindspace/SET_ITEM_ID', null);
      store.commit('mindspace/SET_ITEM_NAME', 'Empty Slot');
      store.commit('mindspace/SET_BLOCKS', []);
    } else {
      // Use the action for items with data
      await store.dispatch('mindspace/setItemId', newItemId);
    }

    isFlipped.value = true;
    emit('click', props.index);
  }
  // Watch when editing starts
  watch(isEditing, (newVal) => {
    if (newVal) editingName.value = props.mindslot.name || 'New Slot'
  })

  watch(() => props.mindslot?.name, (newName) => {
    if (newName) {
      editingName.value = newName;
    }
  })

  const currentItemId = computed(() => store.getters['mindspace/getItemId'])

  watch(currentItemId, (newId) => {
    console.log('Current item ID changed:', newId)
    // You can react to currentItemId changes here if needed
  })

  // Name edit handlers
  function startEditing() {
    isEditing.value = true
    editingName.value = props.mindslot?.name || 'New Slot'
  }

  function saveSlotName(index) {
    isEditing.value = false
    if (editingName.value.trim() !== props.mindslot.name || '') {
      emit('name-change', { index, newName: editingName.value });
    }
  }


</script>

<style lang="scss" scoped>
@import '@/assets/mindSlotCardStyle.scss';
</style>
