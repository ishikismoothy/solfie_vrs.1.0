<template>
  <div class="add-item-popup">
    <button @click="$emit('add', 'item')">New Item</button>
    <button v-if="!isInFolder" @click="$emit('add', 'folder')">New Folder</button>
    <button @click="$emit('close')">Cancel</button>
  </div>
</template>

<script>
export default {
  name: 'AddItemPopup',
  props: {
    isInFolder: {
      type: Boolean,
      default: false
    }
  },
  emits: ['add', 'close']
}
</script>
