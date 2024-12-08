<!-- DeleteButton.vue -->
<template>
  <button
    class="delete-button"
    @touchstart.stop="handleTouchStart"
    @touchend.stop="handleTouchEnd"
    @touchmove.stop.prevent="void 0"
  >
    <div class="delete-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </div>
    <div class="touch-ripple" :class="{ active: isPressed }"></div>
  </button>
</template>

<script>
export default {
  name: 'DeleteButton',
  data() {
    return {
      isPressed: false,
      touchStarted: false
    }
  },
  methods: {
    handleTouchStart(event) {
      event.stopPropagation();
      this.touchStarted = true;
      this.isPressed = true;
    },
    handleTouchEnd(event) {
      event.stopPropagation();
      this.isPressed = false;
      
      // Only emit delete if the touch interaction started on this element
      if (this.touchStarted) {
        this.$emit('delete');
      }
      this.touchStarted = false;
    }
  }
}
</script>