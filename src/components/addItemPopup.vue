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
  
<style scoped>
  .add-item-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    z-index: 1000;
  }
</style>