<!-- DeleteButton.vue -->
<template>
    <button
      class="delete-button"
      @click.stop.prevent="$emit('delete')"
      @touchstart.prevent="handleTouchStart"
      @touchend.prevent="handleTouchEnd"
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
        isPressed: false
      }
    },
    methods: {
      handleTouchStart() {
        this.isPressed = true;
      },
      handleTouchEnd() {
        this.isPressed = false;
      }
    }
  }
  </script>