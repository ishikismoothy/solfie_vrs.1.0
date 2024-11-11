<!-- Header.vue -->
<template>
  <header class="header-container">
    <div class="left-section">
      <div class="globe-icon">
        <button class="icon-button" 
          @click="toggleMenu"
        >
          <img src="@//assets/icons/utility/globeIcon.svg" alt="globe" />
        </button>
      </div>
      <span class="mindspace-name" v-if="!isLoading">{{mindSpaceName}}</span>
      <span class="mindspace-name" v-else>Loading...</span>
    </div>
    <div class="center-section">
      <h1 class="theme-title" v-if="!isLoading">{{themeName}}</h1>
      <h1 class="theme-title" v-else>Loading...</h1>
    </div>
    <div class="right-section">
      <button class="icon-button">
        <img src="@/assets/icons/utility/bellIcon.svg" alt="view" />
      </button>
      <span class="notification-count">{{ user.notifications }}</span>
      <button class="icon-button">
        <img src="@//assets/icons/utility/shareIcon.svg" alt="share" />
      </button>
      <button class="icon-button">
        <img src="@//assets/icons/utility/moreIcon.svg" alt="more options" />
      </button>
    </div>
  </header>

  <SlideMenu 
      :is-open="isMenuOpen"
      :user-id="userId"
      :theme-id="themeId"
      :is-loading="isLoading"
      @close="closeMenu"
  />
</template>

<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import SlideMenu from './mindSpaceMenu.vue';

export default {
  name: 'HeaderNav',
  components: {
    SlideMenu
  },
  setup() {
    const store = useStore();
    const isMenuOpen = ref(false);
    const user = computed(() => store.state.user.user || {});
    
    const themeName = computed(() => store.getters['mindspace/getThemeName']);
    const mindSpaceName = computed(() => store.getters['mindspace/getMindSpaceName']);
    const isLoading = computed(() => store.getters['mindspace/isLoading']);
    const themeId = computed(() => store.getters['mindspace/getThemeId']);
    const userId = computed(() => store.getters['mindspace/getUserId']);

    console.log("[HeaderNav.vue] Reading",userId.value);

    const toggleMenu = () => {
      isMenuOpen.value = !isMenuOpen.value;
    };

    const closeMenu = () => {
      isMenuOpen.value = false;
    };

    return {
      user,
      isLoading,
      themeName,
      mindSpaceName,
      userId,
      themeId,
      isMenuOpen,
      toggleMenu,
      closeMenu
    };
  }
};
</script>

<style lang="scss">

@mixin responsive($breakpoint) {
  @if $breakpoint == tablet {
    @media (min-width: 768px) { @content; }
  } @else if $breakpoint == desktop {
    @media (min-width: 1024px) { @content; }
  }
}

@import '@/assets/headerNavStyle.scss';
@import '@/assets/mindSpaceMenuStyle.scss';
</style>
