<!-- src/views/SharedDashboardView.vue -->
<template>
  <div class="shared-dashboard-view">
    <!-- Loading State -->
    <LoadingScreen v-model="loading" />

    <!-- Error State -->
    <div v-if="error && !loading" class="error-container">
      <div class="error-icon">
        <svg v-if="error.type === 'expired'" viewBox="0 0 24 24" width="64" height="64" fill="#ff9800">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
        </svg>
        <svg v-else-if="error.type === 'invalid'" viewBox="0 0 24 24" width="64" height="64" fill="#f44336">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" width="64" height="64" fill="#f44336">
          <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
        </svg>
      </div>
      <h2>{{ error.title }}</h2>
      <p>{{ error.message }}</p>
      
      <div class="error-actions">
        <button @click="retryLoading" class="retry-btn">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
          Try Again
        </button>
        <button @click="goHome" class="home-btn">Go to Homepage</button>
      </div>
    </div>

    <!-- Success State -->
    <div v-else-if="dashboardData && !loading" class="dashboard-container">
      <!-- Only show our header if DashboardView is not being used -->
      <div v-if="!isFullDashboardView" class="shared-header">
        <div class="header-left">
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
            <span class="owner-label">Shared by</span>
            <span class="owner-name">{{ ownerName }}</span>
          </div>
        </div>

        <div class="header-actions">
          <!-- Show edit controls for editors and co-creators -->
          <div v-if="canEdit" class="edit-controls">
            <button @click="toggleEditMode" class="edit-toggle" :disabled="!currentUser">
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
              Sign in to edit
            </button>
          </div>
        </div>
      </div>

      <!-- Share Info Bar for full dashboard view -->
      <div v-if="isFullDashboardView" class="share-info-bar">
        <div class="info-content">
          <div class="access-info">
            <div class="access-badge mini" :class="`access-${access}`">
              <svg v-if="access === 'view'" viewBox="0 0 24 24" width="14" height="14">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
              <svg v-else-if="access === 'editor'" viewBox="0 0 24 24" width="14" height="14">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" width="14" height="14">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              {{ getAccessLabel() }}
            </div>
            <span class="separator">•</span>
            <span class="owner-text">Shared by {{ ownerName }}</span>
          </div>
          
          <div class="info-actions">
            <button v-if="canEdit && !currentUser" @click="showLoginModal = true" class="mini-login-btn">
              Sign in to edit
            </button>
            <button v-if="canEdit && currentUser" @click="toggleEditMode" class="mini-edit-btn" :class="{ active: editMode }">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path v-if="editMode" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                <path v-else d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Dashboard Content Wrapper -->
      <div class="shared-dashboard-content" :class="{ 
        'view-only': !canEdit || !editMode,
        'with-info-bar': isFullDashboardView,
        'editable': canEdit && editMode
      }">
        <DashboardView v-if="isFullDashboardView" />
        <Dashboard v-else />
      </div>

      <!-- Mobile Bottom Bar for view-only users -->
      <div v-if="!canEdit && isMobile" class="mobile-bottom-bar">
        <button @click="showShareInfo = true" class="info-btn">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
          View Info
        </button>
        <button @click="copyShareLink" class="share-btn">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
          </svg>
          Share
        </button>
      </div>

      <!-- Floating Action Button for Mobile with edit permissions -->
      <div v-if="canEdit && isMobile" class="fab-container">
        <button @click="toggleEditMode" class="fab" :class="{ 'edit-active': editMode }" :disabled="!currentUser">
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
        <button @click="showLoginModal = false" class="modal-close-btn">&times;</button>
        <h2>Sign in to {{ canEdit ? 'edit' : 'continue' }}</h2>
        <p>{{ canEdit ? 'Sign in to start editing this dashboard' : 'Sign in to save your changes and collaborate' }}</p>
        
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

    <!-- Mobile Share Info Modal -->
    <div v-if="showShareInfo && isMobile" class="modal-overlay" @click.self="showShareInfo = false">
      <div class="info-modal">
        <div class="info-modal-header">
          <h3>Dashboard Information</h3>
          <button @click="showShareInfo = false" class="modal-close-btn">&times;</button>
        </div>
        <div class="info-modal-content">
          <div class="info-row">
            <span class="info-label">Access Level:</span>
            <div class="access-badge" :class="`access-${access}`">
              {{ getAccessLabel() }}
            </div>
          </div>
          <div class="info-row">
            <span class="info-label">Shared by:</span>
            <span class="info-value">{{ ownerName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Share Link:</span>
            <button @click="copyShareLink" class="copy-link-btn">
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseInit';
import DashboardView from '@/views/DashboardView.vue';
import Dashboard from '@/components/DashBoard/dashboard.vue';
import LoadingScreen from '@/components/loadingScreen.vue';
import emitter from '@/eventBus';

export default {
  name: 'SharedDashboardView',
  components: {
    DashboardView,
    Dashboard,
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
    const showShareInfo = ref(false);
    const hasUnsavedChanges = ref(false);
    const isFullDashboardView = ref(true); // Use full DashboardView by default

    const currentUser = computed(() => store.state.user?.user);
    const canEdit = computed(() => ['editor', 'co-creator'].includes(access.value));
    const isMobile = computed(() => store.state.user?.user?.isMobile || window.innerWidth < 768);

    // Track changes in the mindspace store
    const trackChanges = () => {
      if (canEdit.value && editMode.value && currentUser.value) {
        hasUnsavedChanges.value = true;
      }
    };

    // Watch for changes in mindspace data
    watch(() => store.state.mindspace.mindSpacePages, trackChanges, { deep: true });
    watch(() => store.state.mindspace.itemBlocks, trackChanges, { deep: true });

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

        // Use a dedicated action for setting shared mindspace
        await store.dispatch('mindspace/setSharedMindspace', {
          ownerId: result.ownerId,
          themeId: result.themeId,
          mindspaceId: result.mindspaceId
        });

        // Load owner information
        await loadOwnerInfo(result.ownerId);

        // Show login modal immediately for editor/co-creator access
        if (!currentUser.value && canEdit.value) {
          showLoginModal.value = true;
        }

        // Set edit mode based on access
        store.dispatch('mindspace/setIsEditMode', false);

      } catch (err) {
        console.error('Error loading shared dashboard:', err);
        
        if (err.message.includes('expired')) {
          error.value = {
            type: 'expired',
            title: 'Link Expired',
            message: 'This share link has expired. Please request a new link from the dashboard owner.'
          };
        } else if (err.message.includes('Invalid')) {
          error.value = {
            type: 'invalid',
            title: 'Invalid Link',
            message: 'This share link is invalid or has been revoked.'
          };
        } else {
          error.value = {
            type: 'error',
            title: 'Access Error',
            message: 'Unable to access this shared dashboard. Please check your connection and try again.'
          };
        }
      } finally {
        loading.value = false;
      }
    };

    const loadOwnerInfo = async (ownerId) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', ownerId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          ownerName.value = userData.displayName || userData.email || 'Anonymous User';
        } else {
          ownerName.value = 'Unknown User';
        }
      } catch (err) {
        console.error('Error loading owner info:', err);
        ownerName.value = 'Unknown User';
      }
    };

    const toggleEditMode = () => {
      if (!currentUser.value) {
        showLoginModal.value = true;
        return;
      }

      if (hasUnsavedChanges.value && editMode.value) {
        if (!confirm('You have unsaved changes. Do you want to discard them?')) {
          return;
        }
      }
      
      editMode.value = !editMode.value;
      store.dispatch('mindspace/setIsEditMode', editMode.value);
      
      if (!editMode.value) {
        hasUnsavedChanges.value = false;
      }
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
      router.push({
        path: '/login',
        query: { redirect: route.fullPath }
      });
    };

    const goHome = () => {
      router.push('/');
    };

    const retryLoading = async () => {
      error.value = null;
      loading.value = true;
      await loadSharedDashboard();
    };

    const copyShareLink = async () => {
      const url = window.location.href;
      try {
        await navigator.clipboard.writeText(url);
        // You can add a toast notification here
        console.log('Share link copied to clipboard');
      } catch (err) {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    };

    // Clean up store on unmount
    const cleanupStore = () => {
      store.dispatch('mindspace/clearSharedState');
      // Remove event listeners
      emitter.off('dataChanged', trackChanges);
    };

    // Warn before leaving with unsaved changes
    const beforeUnloadHandler = (e) => {
      if (hasUnsavedChanges.value && editMode.value) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    // Listen for data changes
    emitter.on('dataChanged', trackChanges);

    onMounted(() => {
      loadSharedDashboard();
      window.addEventListener('beforeunload', beforeUnloadHandler);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      cleanupStore();
    });

    return {
      loading,
      error,
      dashboardData,
      access,
      ownerName,
      editMode,
      showLoginModal,
      showShareInfo,
      currentUser,
      canEdit,
      isMobile,
      isFullDashboardView,
      toggleEditMode,
      getAccessLabel,
      loginWithEmail,
      goHome,
      retryLoading,
      copyShareLink
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

  .error-icon {
    margin-bottom: 24px;
    animation: pulse 2s ease-in-out infinite;
  }

  h2 {
    margin: 0 0 12px;
    color: #333;
    font-size: 24px;
  }

  p {
    color: #666;
    margin-bottom: 32px;
    max-width: 400px;
  }
}

.error-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;

  &:hover {
    background: #357abd;
    transform: translateY(-1px);
  }

  svg {
    fill: currentColor;
  }
}

.home-btn {
  padding: 12px 24px;
  background: white;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
    border-color: #999;
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

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.access-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;

  &.mini {
    padding: 4px 10px;
    font-size: 12px;
  }

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
  display: flex;
  flex-direction: column;
  gap: 2px;

  .owner-label {
    font-size: 12px;
    color: #999;
  }

  .owner-name {
    font-size: 14px;
    color: #333;
    font-weight: 500;
  }
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
  transition: all 0.2s;
  font-size: 14px;

  &:hover:not(:disabled) {
    background: #e0e0e0;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

/* Share Info Bar */
.share-info-bar {
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  padding: 8px 16px;
  position: sticky;
  top: 50px;
  z-index: 99;
}

.info-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
}

.access-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #666;
}

.separator {
  color: #ccc;
}

.info-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-login-btn,
.mini-edit-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
    border-color: #999;
  }

  &.active {
    background: #4a90e2;
    color: white;
    border-color: #4a90e2;

    svg {
      fill: white;
    }
  }

  svg {
    fill: #666;
  }
}

/* Dashboard Content */
.shared-dashboard-content {
  position: relative;
  
  &.with-info-bar {
    // Adjust for the info bar height
    min-height: calc(100vh - 49px);
  }

  &.view-only:not(.editable) {
    // Allow interactions for view-only mode
    .mind-grid-item,
    .item-content,
    a,
    button:not([disabled]) {
      pointer-events: auto;
    }

    // Disable edit-specific actions
    .edit-button,
    .delete-button,
    .add-button {
      display: none;
    }
  }
}

/* Mobile Bottom Bar */
.mobile-bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 8px;
  display: flex;
  gap: 8px;
  z-index: 90;
}

.info-btn,
.share-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #f8f9fa;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;

  &:active {
    background: #e0e0e0;
  }

  svg {
    fill: #666;
  }
}

/* Floating Action Button */
.fab-container {
  position: fixed;
  bottom: 80px; // Adjust for mobile bottom bar
  right: 24px;
  z-index: 89;
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

  &:hover:not(:disabled) {
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* Modals */
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
  animation: fadeIn 0.2s ease;
}

.login-modal,
.info-modal {
  background: white;
  padding: 32px;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  position: relative;
  animation: slideUp 0.3s ease;
}

.modal-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
    color: #666;
  }
}

.login-modal {
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

/* Info Modal */
.info-modal {
  text-align: left;
  padding: 0;
  overflow: hidden;
}

.info-modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    margin: 0;
    font-size: 18px;
    color: #333;
  }
}

.info-modal-content {
  padding: 24px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  font-size: 14px;
  color: #666;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.copy-link-btn {
  padding: 6px 16px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    background: #357abd;
  }
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Responsive */
@media (max-width: 768px) {
  .shared-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    width: 100%;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .share-info-bar {
    padding: 8px 12px;
    
    .info-content {
      gap: 8px;
      //align-items: flex-start;
    }
  }

  .error-actions {
    flex-direction: column;
    width: 100%;

    .retry-btn,
    .home-btn {
      width: 100%;
    }
  }
}
</style>