<!-- IconSelector.vue -->
<template>
  <div
    v-if="isVisible"
    class="icon-selector-overlay"
    @click="closeSelector"
    @contextmenu.prevent
  >
    <div
      class="icon-selector-menu"
      @click.stop
    >
      <div class="icon-selector-header">
        <h4>Select Icon</h4>
        <button @click="closeSelector" class="close-btn">×</button>
      </div>

      <div class="icon-grid">
        <div
          v-for="icon in availableIcons"
          :key="icon.name"
          class="icon-option"
          @click="selectIcon(icon)"
          :title="icon.name"
        >
          <div class="icon-preview" v-html="icon.svg"></div>
          <span class="icon-name">{{ icon.displayName }}</span>
        </div>

        <!-- Option to remove current icon -->
        <div
          v-if="hasCurrentIcon"
          class="icon-option remove-option"
          @click="selectIcon(null)"
          title="Remove Icon"
        >
          <div class="icon-preview">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
          <span class="icon-name">Remove</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted, defineProps, defineEmits } from 'vue'
  import { getManualIconList } from '@/utility/iconLoader'

  const props = defineProps({
    isVisible: {
      type: Boolean,
      default: false
    },
    position: {
      type: Object,
      default: () => ({ x: 0, y: 0 })
    },
    hasCurrentIcon: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['close', 'select-icon'])

  // Available icons - loaded from your assets folder
  const availableIcons = ref([])

  // Load icons on component mount
  const loadIcons = async () => {
    try {
      // Use the hardcoded manual icons
      console.log('Loading manual icons...')
      availableIcons.value = getManualIconList()
      console.log('Loaded icons:', availableIcons.value.length, 'icons')
    } catch (error) {
      console.error('Error loading icons:', error)
      // Minimal fallback if even that fails
      availableIcons.value = [
        {
          name: 'star',
          displayName: 'Star',
          svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                </svg>`
        }
      ]
    }
  }

  const selectIcon = (icon) => {
    emit('select-icon', icon)
    closeSelector()
  }

  const closeSelector = () => {
    emit('close')
  }

  // Close on escape key
  const handleEscape = (event) => {
    if (event.key === 'Escape' && props.isVisible) {
      closeSelector()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleEscape)
    loadIcons() // Load icons when component mounts
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
  })
</script>

<style lang="scss">
  @import '@/assets/itemWindowStyle.scss';
</style>
