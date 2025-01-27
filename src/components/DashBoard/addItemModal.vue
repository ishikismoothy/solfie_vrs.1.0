<template>
  <div class="add-item-popup">
    <button @click="$emit('add', 'item')" class="button-style">New Item</button>
    <button v-if="!isInFolder" @click="$emit('add', 'folder')" class="button-style">New Folder</button>
    <button @click="$emit('close')" class="button-style">Cancel</button>
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

<style scoped lang="scss">

@mixin responsive($breakpoint) {
  @if $breakpoint == tablet {
    @media (min-width: 768px) { @content; }
  } @else if $breakpoint == desktop {
    @media (min-width: 1024px) { @content; }
  }
}

@import '@/assets/headerNavStyle.scss';

</style>
