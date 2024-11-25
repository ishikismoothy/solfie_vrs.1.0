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
      required: true,
      default: '' // Add default empty string
    },
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
      // Add null check and ensure text is a string
      const safeText = this.text || '';
      
      if (safeText.length <= this.currentMaxLength) {
        return safeText;
      }
      return `${safeText.slice(0, this.currentMaxLength)}...`;
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