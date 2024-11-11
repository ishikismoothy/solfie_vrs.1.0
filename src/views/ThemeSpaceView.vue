<template>
  <div class="theme-space-container" v-if="isInitialized">
    <div class="theme-gallery">
      <!-- Header -->
      <header>
        <div class="logo-section">
          <h1>Solfie</h1>
          <span class="plan-type">{{planType}}</span>
        </div>
        <button class="avatar-button">
          <img src="/avatar-placeholder.png" alt="Avatar"/>
        </button>
      </header>

      <!-- Search and Create Section -->
      <div class="search-section">
        <div class="search-container">
          <input 
            type="text" 
            placeholder="Search" 
            v-model="searchQuery"
            @input="handleSearch"
          />
          <span class="search-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>

        <button class="create-button" @click="showCreateThemeModal">
          Create New Theme
        </button>
      </div>

      <ThemeCreateModal
        v-model="showCreateModal"
        @create="addTheme"
      />

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        Loading themes...
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        {{ error }}
      </div>

      <!-- Theme Grid -->
      <div v-else class="theme-grid">
        <div 
          v-for="theme in themes" 
          :key="theme.id" 
          class="theme-card"
        >
          <div class="image-container"
            @click="selectTheme(theme.id)"
          >
            <img 
              :src="theme.imageUrl" 
              :alt="theme.name"
            />
            <div class="overlay-icons">
              <button class="icon-button star-button">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
              <div class="dropdown-container">
                <button 
                  class="icon-button more-button" 
                  @click.stop="toggleDropdown(theme.id)"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                <div 
                  v-if="openDropdownId === theme.id" 
                  class="dropdown-menu"
                  @click.stop
                >
                  <button @click="renameTheme(theme.id)" class="dropdown-item">
                    <svg class="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Rename
                  </button>
                  <button @click="deleteTheme(theme.id)" class="dropdown-item delete">
                    <svg class="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                  <button @click="openSettings(theme.id)" class="dropdown-item">
                    <svg class="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="theme-info">
            <h3>{{ theme.name }}</h3>
            <p class="updated-time">{{ formatDate(theme.updatedAt) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router'; // Add this import at the top
import ThemeCreateModal from '@/components/ThemeSpace/themeCreateModal.vue';
import debounce from 'lodash/debounce';

export default {
  name: 'ThemeSpace',
  components: {
    ThemeCreateModal
  },
  setup() {
    // Store setup
    const store = useStore();
    const router = useRouter(); // Get router instance

    // Reactive state
    const isInitialized = ref(false);
    const planType = ref('{{Plan Type}}');
    const searchQuery = ref('');

    // Computed properties
    const userId = computed(() => store.getters['mindspace/getUserId']);
    const themes = computed(() => store.getters['themeSpace/getThemes'], userId.value);
    const loading = computed(() => store.getters['themeSpace/isLoading']);
    const error = computed(() => store.getters['themeSpace/getError']);

    

    // Methods
    const fetchThemes = async () => {
      try {
        await store.dispatch('themeSpace/fetchThemes',userId.value);
      } catch (error) {
        console.error('Error fetching themes:', error);
      }
    };

    const showCreateModal = ref(false);
    const showCreateThemeModal= () => {
      showCreateModal.value = true;
    }

    const addTheme = async ({ theme, topic, combinedValue }) => {
      console.log('Creating new theme:', { theme, topic, combinedValue });
      
      const themeData = {
        name: combinedValue,  // This will be the document name
        theme: theme,         // Original theme value
        topic: topic,         // Original topic value
        // Add any other fields you want to store
      };

      try {
        await store.dispatch('themeSpace/addTheme', { 
          themeData,
          userId: userId.value 
        });
      } catch (error) {
        console.error('Error in addTheme:', error);
        // Handle error appropriately
      }
    };

    const openDropdownId = ref(null);
    const toggleDropdown = (themeId) => {
      openDropdownId.value = openDropdownId.value === themeId ? null : themeId
    }

    const closeDropdown = () => {
      openDropdownId.value = null
    }

    // Add click event listener to close dropdown when clicking outside
    if (typeof window !== 'undefined') {
      window.addEventListener('click', closeDropdown)
    }

    const renameTheme = (themeId) => {
      // Implement rename logic here
      console.log('Rename theme:', themeId)
      closeDropdown()
    }

    const openSettings = (themeId) => {
      // Implement settings logic here
      console.log('Open settings:', themeId)
      closeDropdown()
    }

    const deleteTheme = async (themeId) => {
      // Implement delete logic here
      if (!confirm('Are you sure you want to delete this theme?')) {
          return;
      }

      try {
        await store.dispatch('themeSpace/deleteTheme', { themeId: themeId, 
          userId: userId.value });
        console.log('Delete theme:', themeId)
        closeDropdown()
      } catch (error) {
        console.error('Error deleting theme:', error);
      }
      
    }
    /*

    const updateTheme = async (payload) => {
      try {
        await store.dispatch('themeSpace/updateTheme', payload);
      } catch (error) {
        console.error('Error updating theme:', error);
      }
    };
    */

    const clearThemes = () => {
      try {
        store.dispatch('themeSpace/clearThemes');
      } catch (error) {
        console.error('Error clearing themes:', error);
      }
    };

    const handleSearch = debounce(async () => {
      try {
        if (searchQuery.value) {
          await store.dispatch('themeSpace/searchThemes', { searchTerm: searchQuery.value, uid: userId });
        } else {
          await fetchThemes();
        }
      } catch (error) {
        console.error('Error during search:', error);
      }
    }, 300);
    

    const formatDate = (date) => {
      try {
        const options = { 
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        };

        if (date && typeof date.toDate === 'function') {
          return date.toDate().toLocaleDateString('en-US', options);
        }
        return new Date(date).toLocaleDateString('en-US', options);
      } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
      }
    };

    const initializeThemes = async () => {
      try {
        if (userId.value) {
          await fetchThemes();
        }
      } catch (error) {
        console.error('Error initializing themes:', error);
      } finally {
        isInitialized.value = true;
      }
    };

    const selectTheme = async (id) => {
      try {
        await store.dispatch('mindspace/changeThemeId', id);
        router.push('/dashboard');  // Add navigation
      } catch (error) {
        console.log(error.message);
      }
    }

    // Watchers
    watch(userId, async (newUserId) => {
      try {
        if (newUserId) {
          await fetchThemes();
        } else {
          clearThemes();
        }
      } catch (error) {
        console.error('Error in userId watcher:', error);
      }
    }, { immediate: true });

    // Lifecycle hooks
    onMounted(async () => {
      try {
        console.log('Store state:', store.state);
        await store.dispatch('mindspace/setUserId');
        console.log('uid:', userId.value);
        await initializeThemes();
      } catch (error) {
        console.error('Error in onMounted:', error);
      }
    });

    // Debug logging
    console.log('Initial store state:', {
      themes: store.state.themes,
      mindspace: store.state.mindspace
    });

    return {
      isInitialized,
      planType,
      searchQuery,
      userId,
      themes,
      loading,
      error,
      formatDate,

      selectTheme,  
      fetchThemes,
      addTheme,
      deleteTheme,
      clearThemes,
      /*
      updateTheme,*/
      handleSearch,
      

      //DropDown
      openDropdownId,
      toggleDropdown,
      renameTheme,
      openSettings,

      showCreateModal,
      showCreateThemeModal,
    };
  }
};
</script>

<style lang="scss">
//SIZE MANAGEMENT
@mixin responsive($breakpoint) {
  @if $breakpoint == tablet {
    @media (min-width: 768px) { @content; }
  } @else if $breakpoint == desktop {
    @media (min-width: 1024px) { @content; }
  }
}

@import '../assets/themeSpaceStyle.scss';
@import '../assets/themeCreateModalStyle.scss';
</style>