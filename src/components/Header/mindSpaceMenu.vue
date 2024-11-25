<template>
  <Transition name="slide">
    <div v-if="isOpen" class="menu-container">
      <div class="menu-header">
        <div class="header-left">
          <button 
            @click="$router.push('/themespace')" class="back-button">
            <span class="back-icon">&#8249;</span>
             Back to Theme
          </button>
        </div>
        <div class="header-right">
          <button class="icon-button search-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
          <button @click="close" class="icon-button close-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
        
      <div class="menu-content">
        <div class="content-header">
          <h2 class="content-title">{{ themeName }}</h2>
          <button class="icon-button more-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>
          <button 
            class="add-button"
            @click="showCreateMindspace = true"
          >+</button>
        </div>
        <div class="members-count">1 member <span class="lock-icon">🔒</span></div>
      </div>

      <!-- Pop Overlay For Mind Space Creation -->
      <createMindSpacePopUp
        v-model:isVisible="showCreateMindspace"
        :theme-id="themeId"
        :user-id="userId"
        @mindspace-created="handleMindspaceCreated"
      />
        
      <div class="mindspaces-list">
        <div v-if="isLoading" class="loading">Loading mindspaces...</div>
        <template v-else>
          <div 
            v-for="mindspace in mindspaces" 
            :key="mindspace.id"
            class="mindspace-item"
            :class="{ 'has-overlay': activeSettingsId === mindspace.id }"
          >
            <div class="mindspace-content">
              <div class="globe-icon" :class="{ 'is-favourite': defaultMindSpaceId === mindspace.id }">
                <button
                  class = "icon-button" 
                  @click="toggleSetMindSpace(mindspace.id)"
                >
                <img src="@//assets/icons/utility/globeIcon.svg" class="globe-default" alt="globe" />
                <img src="@//assets/icons/utility/globeIcon_active.svg" class="globe-active" alt="globe-active" />
              </button>

              </div>
              
              <TruncateText
                :text="mindspace.name"
                :mobile-cutoff="20"
                :tablet-cutoff="25"
                :desktop-cutoff="30"
              />
              
              <button 
                class="icon-button more-options"
                @click="toggleSettings(mindspace.id)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </button>

            </div>

            <!-- Globe Icon Overlay -->
            <Transition 
              enter-active-class="animate-settings-enter"
              leave-active-class="animate-settings-leave"
              :duration="{ enter: 200, leave: 200 }"
            >
              <div
                v-if="activeSetMindSpaceId === mindspace.id" 
                class="space-setMindSpace-area"
                :class="{ 'favorite-background': defaultMindSpaceId === mindspace.id }"
              >
                <!-- Center text button -->
                <button 
                  class="set-active-button"
                  @click="toggleFavourite(mindspace)"
                >
                  {{ defaultMindSpaceId === mindspace.id ? 'ACTIVATED' : 'SET TO ACTIVE' }}
                </button>

                <div class="settings-icons">
                  <button class="icon-button" @click.stop="closeSettings(mindspace.id)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </Transition>
            
            <!-- Settings Overlay with Transition -->
            <Transition
              enter-active-class="animate-settings-enter"
              leave-active-class="animate-settings-leave"
            >
              <!-- Settings Overlay -->
              <div 
                v-if="activeSettingsId === mindspace.id" 
                class="space-setting-area"
              >
                <div class="settings-icons">
                  <button 
                    class="icon-button"
                    @click="openEditNameDialog(mindspace)"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75 1.84-1.83z"/>
                      <path d="M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z"/>
                    </svg>
                  </button>
                  <!--
                  <button class="icon-button" @click="toggleFavourite(mindspace)">
                    <div class="icon-swap-container" :class="{ 'is-favourite': defaultMindSpaceId === mindspace.id }">
                      
                      <svg 
                        class="favourite-default"
                        xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>

                      <svg 
                        class="favourite-active"
                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="currentColor"/>
                      </svg>

                    </div> 
                  </button>
                  -->
                  <button class="icon-button" @click="togglePrivacy(mindspace)">
                    <div class="icon-swap-container" :class="{ 'is-private': mindspace.privacy }">
                      
                      <svg 
                        class="privacy-default"
                        xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>

                      <svg 
                        class="privacy-active"
                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <defs>
                          <mask id="eye-mask">
                            <rect width="24" height="24" fill="white"/>
                            <circle cx="12" cy="12" r="4" fill="black"/>
                          </mask>
                        </defs>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" fill="currentColor" mask="url(#eye-mask)"/>
                      </svg>

                    </div>
                  </button>
                  <button class="icon-button" @click="openShareDialog(mindspace)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                      <polyline points="16 6 12 2 8 6"></polyline>
                      <line x1="12" y1="2" x2="12" y2="15"></line>
                    </svg>
                  </button>
                  <button class="icon-button" @click="openDuplicateDialog(mindspace.id)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                  <button class="icon-button" @click="openDeleteDialog(mindspace.id)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                  <button class="icon-button" @click="openSettings(mindspace)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                  </button>
                  <button class="icon-button" @click="closeSettings(mindspace.id)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </template>
      </div>
    </div>
  </Transition>

  <!-- Edit MindSpace Name Dialog -->
  <div v-if="isOpen" class="menu-overlay" ></div>
  <RenameDialog
    v-model="showRenameDialog"
    :initial-name="selectedMindspace?.name"
    @confirm="handleRename"
  />

</template>
  
<script>
  import { ref, computed } from 'vue';
  import { useStore } from 'vuex';
  import createMindSpacePopUp from '@/components/Header/createMindSpace.vue';
  import RenameDialog from './renameDialog.vue'
  import TruncateText from '../TruncateText/truncateSpanText.vue';
  import { updateMindSpaceName, deleteMindspace, setDefaultMindspace, duplicateMindspace, setPrivacyMindspace } from '@/firebase/firebaseMindSpace';
  
  export default {
    name: 'SlideMenu',
    props: {
      isOpen: {
        type: Boolean,
        required: true
      },
      themeId: {
        type: String,
        required: true
      },
      userId: {
        type: String,
        required: true
      },
      isLoading: {
        type: Boolean,
        required: true
      }
    },
    components: {
      createMindSpacePopUp,
      RenameDialog,
      TruncateText,
    },
    emits: ['close'],
    setup(props, { emit }) {
      const store = useStore();
      const activeSettingsId = ref(null);
      const activeSetMindSpaceId = ref(null);
      const showCreateMindspace = ref(false);
      const showRenameDialog = ref(false);
      const selectedMindspace = ref(null);
      
      const defaultMindSpaceId = computed(() => store.getters['mindspace/getMindSpaceId']);
      const mindspaces = computed(() => store.getters['mindspace/getMindSpaceList']);
      const loading = ref(true);
      
      const themeName = computed(() => store.getters['mindspace/getThemeName']);
      const close = () => {
        emit('close');
      };

      const handleMindspaceCreated = (mindspaceId) => {
        console.log('New mindspace created:', mindspaceId);
        console.log('[mindSpaceMenu.vue]: userId', props.userId);
        console.log('[mindSpaceMenu.vue]: themeId', props.themeId);
        // Handle the newly created mindspace
      };

      const toggleSettings = (id) => {
        activeSettingsId.value = activeSettingsId.value === id ? null : id;
      };

      const toggleSetMindSpace = (id) => {
        // Close settings overlay if open
        activeSettingsId.value = null;
        // Toggle globe overlay
        activeSetMindSpaceId.value = activeSetMindSpaceId.value === id ? null : id;
        console.log('Globe overlay toggled for:', activeSetMindSpaceId.value);
      };

      const closeSettings = (id) => {
        console.log("[mindSpaceMenu.vue/closeSettings] closing: ",id);
        activeSettingsId.value = null;
        activeSetMindSpaceId.value = null;
      };

      // Add the openEditNameDialog implementation
      const openEditNameDialog = (mindspace) => {
        selectedMindspace.value = mindspace;
        showRenameDialog.value = true;
      };
      // Add the handleRename method
      const handleRename = async (newName) => {
        if (selectedMindspace.value) {
          try {
            // Implement your rename API call here
            const result = await updateMindSpaceName(selectedMindspace.value.id, newName);
            if (result.success) {
              await store.dispatch('mindspace/setMindSpaceList');
            } else {
              console.error(result.error);
            }
            closeSettings();
          } catch (error) {
            console.error('Error renaming mindspace:', error);
          }
        }
      };

      const toggleFavourite = async (mindSpace) => {
        console.log("[mindSpaceMenu.vue/toggleFavourite]",mindSpace.id);
        closeSettings();

        // Implement favorite toggle logic
        const result = await setDefaultMindspace(props.themeId, mindSpace.id);

        if (result.success) {
          console.log("[mindSpaceMenu.vue]",result.message)
          await store.dispatch('mindspace/setMindSpaceId');
        }else{
          console.log(result.error);
        } 
      };

      const togglePrivacy = async (mindspace) => {
        console.log(mindspace.id);
        closeSettings();

        // Implement visibility toggle logic
        const result = await setPrivacyMindspace(mindspace.id);
        if (result.success) {
          console.log("[mindSpaceMenu.vue/togglePrivacy]",result.message)
          await store.dispatch('mindspace/setMindSpaceId');
        }else{
          console.log("[mindSpaceMenu.vue/togglePrivacy]",result.message);
          console.log("[mindSpaceMenu.vue/togglePrivacy]",result.error);
        } 
      };

      const openShareDialog = (mindspace) => {
        console.log(mindspace);
        // Implement share dialog logic
      };

      const openDuplicateDialog = async (mindspaceId) => {
        console.log(mindspaceId);
        // Optional: Add confirmation dialog
        if (!confirm('Are you sure you want to duplicate this item?')) {
          return;
        }

        closeSettings(mindspaceId);

        const result = await duplicateMindspace(mindspaceId);
        console.log ("[mindSpaceMenu.vue/openDuplicateDialog] Reading: ",mindspaceId)
        if (result.success) {
          console.log("[mindSpaceMenu.vue/openDuplicateDialog]: ", result.newId, " ",result.message);
          await store.dispatch('mindspace/setMindSpaceList');
        }else{
          console.log(result.error);
        }
      };

      const openDeleteDialog = async (mindspaceId) => {
        console.log(mindspaceId);

        // Optional: Add confirmation dialog
        if (!confirm('Are you sure you want to delete this item?')) {
          return;
        }

        const result = await deleteMindspace(mindspaceId);
        if (result.success) {
          await store.dispatch('mindspace/setMindSpaceList');
        }else{
          console.log(result.error);
        } 
      };

      const openSettings = (mindspace) => {
        console.log(mindspace);
        // Implement settings page navigation
      };
  
      return {
        defaultMindSpaceId,
        mindspaces,
        loading,
        themeName,
        close,

        //Head Content
        handleMindspaceCreated,
        showCreateMindspace,

        //MindSpaceList-Settings
        activeSettingsId,
        activeSetMindSpaceId,
        showRenameDialog,
        selectedMindspace,

        toggleSettings,
        toggleSetMindSpace,
        closeSettings,
        toggleFavourite,
        togglePrivacy,
        openShareDialog,
        openDuplicateDialog,
        openDeleteDialog,
        openSettings,
        openEditNameDialog,
        handleRename,
      };
    }
  };
</script>
