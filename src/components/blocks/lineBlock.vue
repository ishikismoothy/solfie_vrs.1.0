// LineBlock.vue
<template>
  <div class="line-block">
    <hr class="section-line">
  </div>
</template>

<script>
export default {
  name: 'LineBlock',
  props: {
    block: {
      type: Object,
      required: true
    }
  }
}
</script>