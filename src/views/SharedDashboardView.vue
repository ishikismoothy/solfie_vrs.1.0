<!-- src/views/SharedDashboardView.vue -->
<template>
  <div class="shared-dashboard-view">
    <!-- Loading State -->
    <LoadingScreen v-model="loading" />

    <!-- Error State -->
    <div v-if="error && !loading" class="error-container">
      <div class="error-icon">
        <svg viewBox="0 0 24 24" width="64" height="64" fill="#f44336">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      </div>
      <h2>{{ error.title }}</h2>
      <p>{{ error.message }}</p>
      <button @click="goHome" class="home-btn">Go to Homepage</button>
    </div>

    <!-- Success State -->
    <div v-else-if="dashboardData && !loading" class="dashboard-container">
      <!-- Header with Access Info -->
      <div class="shared-header">
        <div class="access-badge" :class="`access-${access}`">
          <svg v-if="access === 'view'" viewBox="0 0 24 24" width="16" height="16">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
          <svg v-else-if="access === 'editor'" viewBox="0 0 24 24" width="16" height="16">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" width="16" height="16">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
          {{ getAccessLabel() }} Access
        </div>
        
        <div class="owner-info">
          Shared by {{ ownerName }}
        </div>

        <div class="header-actions">
          <!-- Show edit controls for editors and co-creators -->
          <div v-if="canEdit" class="edit-controls">
            <button @click="toggleEditMode" class="edit-toggle">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path v-if="editMode" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                <path v-else d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              {{ editMode ? 'View Mode' : 'Edit Mode' }}
            </button>
          </div>

          <!-- Login prompt for anonymous users -->
          <div v-if="!currentUser && canEdit" class="login-prompt">
            <button @click="showLoginModal = true" class="login-btn">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              Sign in to save changes
            </button>
          </div>
        </div>
      </div>

      <!-- Dashboard Content Wrapper -->
      <div class="shared-dashboard-content" :class="{ 'view-only': !canEdit || !editMode }">
        <!-- Override edit mode for view-only access -->
        <DashboardView />
      </div>

      <!-- Floating Action Button for Mobile -->
      <div v-if="canEdit && isMobile" class="fab-container">
        <button @click="toggleEditMode" class="fab" :class="{ 'edit-active': editMode }">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
            <path v-if="editMode" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            <path v-else d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Login Modal -->
    <div v-if="showLoginModal" class="modal-overlay" @click.self="showLoginModal = false">
      <div class="login-modal">
        <h2>Sign in to continue</h2>
        <p>Sign in to save your changes and collaborate on this dashboard</p>
        
        <div class="login-options">
          <button @click="loginWithEmail" class="login-option email">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            Continue with Email
          </button>
        </div>

        <button @click="showLoginModal = false" class="cancel-btn">
          Continue as Guest
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import DashboardView from '@/views/DashboardView.vue';
import LoadingScreen from '@/components/loadingScreen.vue';

export default {
  name: 'SharedDashboardView',
  components: {
    DashboardView,
    LoadingScreen
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();

    const loading = ref(true);
    const error = ref(null);
    const dashboardData = ref(null);
    const access = ref('view');
    const ownerName = ref('');
    const editMode = ref(false);
    const showLoginModal = ref(false);
    const hasUnsavedChanges = ref(false);

    const currentUser = computed(() => store.state.user?.user);
    const canEdit = computed(() => ['editor', 'co-creator'].includes(access.value));
    const isMobile = computed(() => store.state.user?.user?.isMobile || window.innerWidth < 768);

    const loadSharedDashboard = async () => {
      try {
        const accessKey = route.params.accessKey;
        
        if (!accessKey) {
          throw new Error('Invalid share link');
        }

        // Access the shared dashboard
        const result = await store.dispatch('sharing/accessSharedContent', accessKey);

        dashboardData.value = result;
        access.value = result.access;

        // Set up the mindspace data in the store
        await store.dispatch('mindspace/setUserId', result.ownerId);
        await store.dispatch('mindspace/setSelectedThemeId', {
          uid: result.ownerId,
          themeId: result.themeId
        });
        
        // Override to load the specific shared mindspace
        await store.commit('mindspace/SET_MINDSPACE_ID', result.mindspaceId);
        await store.dispatch('mindspace/setMindSpacePages');

        // Load owner information
        await loadOwnerInfo(result.ownerId);

        // If not logged in and has edit access, show login prompt after delay
        if (!currentUser.value && canEdit.value) {
          setTimeout(() => {
            showLoginModal.value = true;
          }, 3000);
        }

        // Override edit mode based on access
        if (!canEdit.value) {
          store.dispatch('mindspace/setIsEditMode', false);
        }

      } catch (err) {
        console.error('Error loading shared dashboard:', err);
        
        if (err.message.includes('expired')) {
          error.value = {
            title: 'Link Expired',
            message: 'This share link has expired. Please request a new link from the dashboard owner.'
          };
        } else if (err.message.includes('Invalid')) {
          error.value = {
            title: 'Invalid Link',
            message: 'This share link is invalid or has been revoked.'
          };
        } else {
          error.value = {
            title: 'Access Error',
            message: 'Unable to access this shared dashboard. Please try again later.'
          };
        }
      } finally {
        loading.value = false;
      }
    };

    const loadOwnerInfo = async (/*ownerId*/) => {
      try {
        // You can fetch the actual user name from Firestore users collection
        // For now, using a placeholder
        ownerName.value = 'Dashboard Owner';
      } catch (err) {
        ownerName.value = 'Unknown User';
      }
    };

    const toggleEditMode = () => {
      if (hasUnsavedChanges.value) {
        if (!confirm('You have unsaved changes. Do you want to discard them?')) {
          return;
        }
      }
      editMode.value = !editMode.value;
      store.dispatch('mindspace/setIsEditMode', editMode.value);
    };

    const getAccessLabel = () => {
      const labels = {
        'view': 'View-Only',
        'editor': 'Editor',
        'co-creator': 'Co-Creator'
      };
      return labels[access.value] || 'View-Only';
    };

    const loginWithEmail = () => {
      // Navigate to email login page with redirect back to shared view
      router.push({
        path: '/login',
        query: { redirect: route.fullPath }
      });
    };

    const goHome = () => {
      router.push('/');
    };

    // Watch for changes in edit mode
    watch(() => store.state.mindspace.isEditMode, (newValue) => {
      // Track if there are unsaved changes
      if (newValue && canEdit.value) {
        hasUnsavedChanges.value = true;
      }
    });

    // Warn before leaving with unsaved changes
    const beforeUnloadHandler = (e) => {
      if (hasUnsavedChanges.value && editMode.value) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    onMounted(() => {
      loadSharedDashboard();
      window.addEventListener('beforeunload', beforeUnloadHandler);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
    });

    return {
      loading,
      error,
      dashboardData,
      access,
      ownerName,
      editMode,
      showLoginModal,
      currentUser,
      canEdit,
      isMobile,
      toggleEditMode,
      getAccessLabel,
      loginWithEmail,
      goHome
    };
  }
};
</script>

<style lang="scss" scoped>
.shared-dashboard-view {
  min-height: 100vh;
  background: #f5f5f5;
}

/* Error State */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  padding: 20px;

  h2 {
    margin: 20px 0 10px;
    color: #333;
  }

  p {
    color: #666;
    margin-bottom: 20px;
  }
}

.home-btn {
  margin-top: 20px;
  padding: 12px 24px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;

  &:hover {
    background: #357abd;
  }
}

/* Header */
.shared-header {
  background: white;
  padding: 16px 24px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
}

.access-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;

  svg {
    fill: currentColor;
  }

  &.access-view {
    background: #e3f2fd;
    color: #1976d2;
  }

  &.access-editor {
    background: #fff3e0;
    color: #f57c00;
  }

  &.access-co-creator {
    background: #f3e5f5;
    color: #7b1fa2;
  }
}

.owner-info {
  color: #666;
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.edit-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f0f0f0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 14px;

  &:hover {
    background: #e0e0e0;
  }

  svg {
    fill: #666;
  }
}

.login-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;

  &:hover {
    background: #357abd;
  }

  svg {
    fill: currentColor;
  }
}

/* Dashboard Content */
.shared-dashboard-content {
  &.view-only {
    pointer-events: none;
    user-select: none;
  }
}

/* Floating Action Button */
.fab-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 90;
}

.fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #4a90e2;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  transition: all 0.2s;

  &.edit-active {
    background: #ffa726;
  }

  &:hover {
    transform: scale(1.05);
  }
}

/* Login Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.login-modal {
  background: white;
  padding: 32px;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

  h2 {
    margin: 0 0 12px;
    color: #333;
  }

  p {
    color: #666;
    margin-bottom: 24px;
  }
}

.login-options {
  margin: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login-option {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 24px;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;

  &.email {
    background: #4a90e2;
    color: white;
    border: none;

    &:hover {
      background: #357abd;
    }
  }

  svg {
    fill: currentColor;
  }
}

.cancel-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  text-decoration: underline;
  font-size: 14px;

  &:hover {
    color: #333;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .shared-header {
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .owner-info {
    order: -1;
    width: 100%;
  }
}
</style>
