<template>
  <div class="indicator-wrapper">
    <div class="page-indicator-container">
    <!-- View switcher dot -->
    <span 
      class="view-switcher"
      :class="{ 'active': isAppView }"
      @click="switchView"
    ></span>

    <!-- Small separator -->
    <span class="separator"></span>

    <!-- Existing page dots from mindSpace -->
    <span 
      v-for="index in totalPages" 
      :key="index"
      :class="{ 'active': index - 1 === currentPage && !isAppView }"
      @click="selectPage(index - 1)"
    ></span>
    </div>
  </div>
</template>

<script>
import { useStore } from 'vuex';
import { computed } from 'vue';

export default {
  name: 'PageIndicator',
  props: {
    isAppView: {
      type: Boolean,
      required: true,
      default: true
    }
  },
  emits: ['page-selected', 'view-switch'],
  methods: {
    onPageSelect(index) {
      if (index >= 0 && index < this.totalPages) {
        this.$emit('page-selected', index);
      }
    },
    switchView() {
      this.$emit('view-switch');
    }
  },
  setup(props, { emit }) {
    const store = useStore();
    // Update page selection to use Vuex
    const selectPage = (index) => {
        store.dispatch('mindspace/setCurrentPage', index);

        //I WANT TO DO SOMETHING LIKE THIS...But doen't work
        if (props.isAppView){
          emit('view-switch');
        }
    };

    const totalPages = computed(() => store.getters['mindspace/getTotalPages']);
    const currentPage = computed(() => store.getters['mindspace/getCurrentPage']);

    return{
      selectPage,
      totalPages,
      currentPage
    };
  },
}
</script>