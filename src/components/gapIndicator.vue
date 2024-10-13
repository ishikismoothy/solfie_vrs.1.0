<template>
  <div 
    class="gap-indicator" 
    :class="{ 'highlight': isHighlighted }" 
    @mouseover="highlight" 
    @mouseleave="unhighlight"
  ></div>
</template>

<script>
export default {
  props: ['leftIndex', 'rightIndex', 'pageIndex'],
  data() {
    return {
      isHighlighted: false
    }
  },
  methods: {
    highlight() {
      this.isHighlighted = true;
      this.$emit('gap-hover', {
        pageIndex: this.pageIndex,
        leftIndex: this.leftIndex,
        rightIndex: this.rightIndex
      });
    },
    unhighlight() {
      this.isHighlighted = false;
      this.$emit('gap-leave');
    }
  }
}
</script>

<style scoped>
.gap-indicator {
  width: 10px;
  height: 100%;
  background-color: transparent;
  transition: background-color 0.3s;
}
.gap-indicator.highlight {
  background-color: rgba(0, 0, 255, 0.2);
}
</style>