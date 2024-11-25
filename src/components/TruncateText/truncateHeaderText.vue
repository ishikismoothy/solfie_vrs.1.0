<!-- TruncateText.vue -->
<template>
    <h1 :title="text" class="truncate-header-text" ref="textElement">{{ truncatedText }}</h1>
</template>
  
  <script>
  export default {
    name: 'TruncateText',
    props: {
      text: {
        type: String,
        required: true
      },
      // Default max lengths for different screen sizes
      mobileCutoff: {
        type: Number,
        default: 15
      },
      tabletCutoff: {
        type: Number,
        default: 25
      },
      desktopCutoff: {
        type: Number,
        default: 35
      }
    },
    data() {
      return {
        currentMaxLength: this.desktopCutoff,
        windowWidth: window.innerWidth
      }
    },
    computed: {
      truncatedText() {
        if (this.text.length <= this.currentMaxLength) {
          return this.text;
        }
        return `${this.text.slice(0, this.currentMaxLength)}...`;
      }
    },
    methods: {
      handleResize() {
        this.windowWidth = window.innerWidth;
        this.updateMaxLength();
      },
      updateMaxLength() {
        // Mobile first approach
        if (this.windowWidth < 768) { // Mobile devices
          this.currentMaxLength = this.mobileCutoff;
        } else if (this.windowWidth < 1024) { // Tablets
          this.currentMaxLength = this.tabletCutoff;
        } else { // Desktop
          this.currentMaxLength = this.desktopCutoff;
        }
      }
    },
    mounted() {
      this.updateMaxLength();
      window.addEventListener('resize', this.handleResize);
    },
    beforeUnmount() {
      window.removeEventListener('resize', this.handleResize);
    }
  }
  </script>
  
  <style scoped>
  @import '@/assets/truncateText.scss';
  
  </style>