<!-- HeroIcon.vue -->

<!-- This component is globally registered in main.js -->
<!-- Use it directly in any component without importing: -->
 <!-- Close buttons (X) -->
<!-- <HeroIcon name="x-mark" class="w-4 h-4" /> -->
 <!-- Edit/pencil -->
<!-- <HeroIcon name="pencil-square" class="w-6 h-6" /> -->
 <!-- Delete/trash -->
<!-- <HeroIcon name="trash" class="w-6 h-6" /> -->
 <!-- Move item (box/folder) -->
<!-- <HeroIcon name="archive-box-arrow-down" class="w-6 h-6" /> -->
 <!-- Duplicate -->
<!-- <HeroIcon name="document-duplicate" class="w-6 h-6" /> -->
 <!-- Back arrow -->
<!-- <HeroIcon name="arrow-uturn-left" class="w-6 h-6" /> -->
 <!-- Down arrow -->
<!-- <HeroIcon name="arrow-down" class="w-6 h-6" /> -->
 <!-- Up arrow -->
<!-- <HeroIcon name="arrow-up" class="w-6 h-6" /> -->

<template>
  <component :is="iconComponent" :class="className" v-if="iconComponent" />
  <svg
    v-else-if="customIcon"
    :class="className"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <component
      v-for="(element, index) in customIcon"
      :key="index"
      :is="element.type"
      v-bind="element.attrs"
    />
  </svg>
</template>

<script setup>
import { computed, defineProps } from 'vue';
import * as outline from '@heroicons/vue/24/outline';
import * as solid from '@heroicons/vue/24/solid';
import * as mini from '@heroicons/vue/20/solid';

const customIcons = {
  'custom-duplicate-icon': [
    { type: 'rect', attrs: { x: '9', y: '9', width: '13', height: '13', rx: '2', ry: '2' } },
    { type: 'path', attrs: { d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' } }
  ],
};

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'outline',
    validator: (value) => ['outline', 'solid', 'mini'].includes(value)
  },
  class: {
    type: String,
    default: 'w-6 h-6'
  }
});

const customIcon = computed(() => customIcons[props.name] || null);

const iconComponent = computed(() => {
  if (customIcons[props.name]) {
    return null;
  }

  const pascalName = props.name
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('') + 'Icon';

  const iconSet = props.type === 'solid' ? solid : props.type === 'mini' ? mini : outline;

  return iconSet[pascalName] || null;
});

const className = computed(() => props.class);
</script>
