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
      <span class="theme-title" v-if="!isLoading">{{themeName}}/</span>
      <TruncateText
        v-if="!isLoading"
        :text="mindSpaceName || ''"
        :mobile-cutoff="10"
        :tablet-cutoff="18"
        :desktop-cutoff="25"
        class="mindspace-name"
      />
      <span class="mindspace-name" v-else>Loading...</span>
    </div>
    <!--
    <div class="center-section">
      <h1 class="theme-title" v-if="!isLoading">{{themeName}}</h1>
      <h1 class="theme-title" v-else>Loading...</h1>
    </div>-->
    <div class="right-section">
      <button class="icon-button"
        v-if="!isEditMode"
      >
        <img src="@/assets/icons/utility/bellIcon.svg" alt="view" />
        <span v-if="!isEditMode"
        class="notification-count"
      >
        {{ user.notifications }}
      </span>
      </button>

      <button class="icon-button"
        v-if="!isEditMode"
      >
        <img src="@//assets/icons/utility/shareIcon.svg" alt="share" />
      </button>
      <button class="icon-button"
        v-if="!isEditMode"
        @click = "toggleDropdown"
      >
        <img src="@//assets/icons/utility/moreIcon.svg" alt="more options" />
      </button>

      <button
        class="icon-button"
        @click="exitEditMode"
        v-else
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

        <!-- Dropdown content here -->
      <div
        v-if="isDropdownOpen"
        class="dropdown-menu"
        ref="elementRef"
      >
        <LogoutButton class="dropdown-item" />
      </div>
        <!-- Dropdown content ends -->

    </div>
  </header>

  <SlideMenu
      :is-open="isMenuOpen"
      :user-id="user.uid"
      :theme-id="themeId || ''"
      :is-loading="isLoading"
      @close="closeMenu"
  />
</template>

<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import SlideMenu from './mindSpaceMenu.vue';
import TruncateText from '../TruncateText/truncateHeaderText.vue';
import LogoutButton from '@/components/logoutButton.vue';
import useClickOutside from '../composables/useClickOutside.js';

export default {
  name: 'HeaderNav',
  components: {
    SlideMenu,
    TruncateText,
    LogoutButton,
  },
  setup() {
    const store = useStore();
    const isMenuOpen = ref(false);
    const user = computed(() => store.state.user.user || {});

    const themeName = computed(() => store.state.mindspace.currentThemeName);
    const mindSpaceName = computed(() => store.state.mindspace.currentMindSpaceName);
    const isLoading = computed(() => store.state.mindspace.loading);
    const themeId = computed(() => store.state.mindspace.currentThemeId);
    //const userId = computed(() => store.state.user.user.uid);

    const isEditMode = computed(() => store.getters['mindspace/getIsEditMode']);

      // handle clicking outside the popup menu
    const isDropdownOpen = ref(false);
    const isButtonClicked = ref(false);
    const closeDropdown = () => {
      if (!isButtonClicked.value) {
        isDropdownOpen.value = false;
        console.log('Popup closed');
      }
      isButtonClicked.value = false;
    };
    const { elementRef } = useClickOutside(closeDropdown);
    const toggleDropdown = () => {
      isButtonClicked.value = true;
      isDropdownOpen.value = !isDropdownOpen.value;
      console.log('Toggling popup. Is open:', isDropdownOpen.value);
    };

    const toggleMenu = () => {
      isMenuOpen.value = !isMenuOpen.value;
    };

    const closeMenu = () => {
      isMenuOpen.value = false;
    };

    const  exitEditMode = async () => {
      console.log('[HeaderNav.vue/exitEditMode] Successfully exited edit mode and updated mindspace');
      try {
        await store.dispatch('mindspace/setIsEditMode', false);

        // First update the mindspace in Firestore
        await store.dispatch('mindspace/updateMindSpace');

        // Then refresh the pages from Firestore
        await store.dispatch('mindspace/setMindSpacePages');

        console.log('Successfully exited edit mode and updated mindspace');
      } catch (error) {
        console.error('Error exiting edit mode:', error);
        // Handle error (show message to user, etc.)
      }
    };



    return {
      user,
      isLoading,
      themeName,
      mindSpaceName,
      //userId,
      themeId,
      isMenuOpen,
      isDropdownOpen,
      toggleMenu,
      toggleDropdown,
      closeMenu,
      isEditMode,
      exitEditMode,
      elementRef,
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
@import '@/assets/mindSpaceRenameModalStyle.scss';
@import '@/assets/globalIconStyle.scss';

</style>
