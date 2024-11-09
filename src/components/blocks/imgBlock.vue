// ImageBlock.vue
<template>
  <div class="image-block">
    <img 
      :src="block.image" 
      :alt="'Image for block ' + block.id"
      class="image-item"
    >
  </div>
</template>

<script>
export default {
  name: 'ImageBlock',
  props: {
    block: {
      type: Object,
      required: true
    }
  }
}
</script>