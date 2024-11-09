<template>
  <Transition name="slide">
    <div v-if="isOpen" class="menu-container">
      <div class="menu-header">
        <div class="header-left">
          <button @click="close" class="back-button">
            <span class="back-icon">&#8249;</span>
            Home
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
                <img src="../assets/icons/utility/globeIcon.svg" class="globe-default" alt="globe" />
                <img src="../assets/icons/utility/globeIcon_active.svg" class="globe-active" alt="globe-active" />
              </div>
              <span>{{ mindspace.name }}</span>
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
  <div v-if="isOpen" class="menu-overlay" ></div>
</template>
  
  <script>
  import { ref, computed } from 'vue';
  import { useStore } from 'vuex';
  import createMindSpacePopUp from '@/components/createMindSpace.vue';
  import { deleteMindspace, setDefaultMindspace, duplicateMindspace, setPrivacyMindspace } from '@/firebase/firebaseMindSpace';
  
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
    },
    emits: ['close'],
    setup(props, { emit }) {
      const store = useStore();
      const activeSettingsId = ref(null);
      const showCreateMindspace = ref(false);
      
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

      const closeSettings = (id) => {
        console.log("[mindSpaceMenu.vue/closeSettings] closing: ",id);
        activeSettingsId.value = null;
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
        // Implement duplicate dialog logic
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
        toggleSettings,
        closeSettings,
        toggleFavourite,
        togglePrivacy,
        openShareDialog,
        openDuplicateDialog,
        openDeleteDialog,
        openSettings,
      };
    }
  };
  </script>
  
  <style lang="scss">
  .menu-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.521);
    backdrop-filter: blur(5px);
    z-index: 1000;
  }
  
  .menu-container {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 70%;
    background: white;
    box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
    z-index: 1001;
    padding: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    //padding: 5px 16px;
    //border-bottom: 1px solid #eee;
    background-color: white;
    margin-bottom: 10px;
  }
  .header-left {
    display: flex;
    align-items: center;
  }

  .header-right {
    display: flex;
    gap: 8px;
  }

  .back-button {
    display: flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    font-size: 0.9em;
    color: #333;
    cursor: pointer;
    padding: 8px 0; 
  }
  .back-icon {
    font-size: 1.4em;
    line-height: 1;
  }

  .icon-button {
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
    color: #333;
    border-radius: 4px;
    
    &:hover {
      background-color: #f5f5f5;
    }
  }

  //Menu-Content
  .menu-content {
    padding: 16px 0 32px;
    //border-bottom: 1px solid #eee;
    
  }

  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .content-title {
    flex: 1;
    font-size: 16px;
    font-weight: 500;
    margin: 0;
    text-align: left;
    padding: 0 12px;
  }

  .more-button {
    padding: 4px;
    margin-right: 10px;
    
    svg {
      display: block;
    }
  }

  .add-button {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    background: none;
    border: 1px solid #ddd;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #333;
    padding: 0;
    
    &:hover {
      background-color: #f5f5f5;
    }
  }

  .members-count {
    font-size: 14px;
    color: #666;
    display: flex;
    align-items: center;
    gap: 4px;
    //margin-left: 40px; // Aligns with the title
    padding: 0 12px;
  }

  .lock-icon {
    font-size: 12px;
  }

  //MINDSPACE LIST
  
  .mindspaces-list {
    flex: 1;
    overflow-y: auto;
  }
  
  .mindspace-item {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 12px 12px;
    //border-bottom: 1px solid #eee;
  }

  .mindspace-content {
    display: flex;
    align-items: center;
    padding: 12px 12px;
    z-index: 1;
  }
  
  .globe-icon {
    position: relative;
    margin-right: 12px;
    width: 20px;
    height: 20px;
  }
  
  .globe-icon img {
    position: absolute;
    top: 0;
    left: 0;
    transition: opacity 0.2s ease;
  }

  .globe-active {
    opacity: 0;
  }

  .globe-default {
    opacity: 1;
  }

  .globe-icon.is-favourite .globe-active {
    opacity: 1;
  }

  .globe-icon.is-favourite .globe-default {
    opacity: 0;
  }
  
  .more-options {
    margin-left: auto;
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
  }
  
  .more-options img {
    width: 16px;
    height: 16px;
  }

  .space-setting-area {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(225, 225, 225, 0.5);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 12px;
    opacity: 1;
    transform: translateX(0);
    backdrop-filter: blur(5px);
    z-index: 2;
  }
  
  .settings-icons {
    display: flex;
    gap: 5px;
    
    .icon-button {
      padding: 6px;
      border-radius: 4px;
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.05);
      }
      
      svg {
        display: block;
      }

      //Privacy-active and privacy-default is aligned vertical, but I wan it to overwrap each other
      .icon-swap-container {
        position: relative;
        display: inline-block;
        width: 18px;
        height: 18px;
        
        svg {
          position: absolute;
          top: 0;
          left: 0;
          transition: opacity 0.2s ease;
        }
        
        //Favourite
        .favourite-active{
            opacity: 0;
        }

        .favourite-default{
            opacity: 1;
        }

        &.is-favourite {
          .favourite-active{
            opacity: 1;
          }

          .favourite-default{
            opacity: 0;
          }
        }

        //Privacy
        .privacy-active {
          opacity: 0;
        }
        
        .privacy-default {
          opacity: 1;
        }
        
        &.is-private {
          .privacy-active {
            opacity: 1;
          }
          
          .privacy-default {
            opacity: 0;
          }
        }
      }
    }
  }
  
  /* Transition animations */
  // Slide Menu
  .slide-enter-active,
  .slide-leave-active {
    transition: transform 0.3s ease;
  }
  
  .slide-enter-from,
  .slide-leave-to {
    transform: translateX(-100%);
  }

  // MindSpaceList MindSpace-Setting-area
  .animate-settings-enter {
    animation: settingsEnter 0.2s ease-out;
  }

  .animate-settings-leave {
    animation: settingsLeave 0.2s ease-in;
  }

  @keyframes settingsEnter {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes settingsLeave {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(-10px);
    }
  }

  // Make icons fade in slightly delayed
  .settings-icons {
    display: flex;
    gap: 5px;
    animation: iconsAppear 0.2s ease-out 0.1s both;
  }

  @keyframes iconsAppear {
    from {
      opacity: 0;
      transform: translateX(-5px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .loading {
    text-align: center;
    padding: 20px;
    color: #666;
  }
  </style>