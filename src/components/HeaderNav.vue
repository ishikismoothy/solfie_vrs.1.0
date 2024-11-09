<!-- Header.vue -->
<template>
  <header class="header-container">
    <div class="left-section">
      <div class="globe-icon">
        <button class="icon-button" 
          @click="toggleMenu"
        >
          <img src="../assets/icons/utility/globeIcon.svg" alt="globe" />
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
        <img src="../assets/icons/utility/eyeIcon.svg" alt="view" />
      </button>
      <button class="icon-button">
        <img src="../assets/icons/utility/shareIcon.svg" alt="share" />
      </button>
      <button class="icon-button">
        <img src="../assets/icons/utility/moreIcon.svg" alt="more options" />
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

<style scoped>
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  
}

.left-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.globe-icon img {
  width: 20px;
  height: 20px;
}

.mindspace-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.center-section {
  flex: 1;
  text-align: center;
}

.theme-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.right-section {
  display: flex;
  gap: 16px;
}

.icon-button {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-button img {
  width: 20px;
  height: 20px;
}

.icon-button:hover {
  opacity: 0.8;
}
</style>