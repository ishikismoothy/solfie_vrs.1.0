<!-- src/components/ShareDashboard.vue -->
<template>
  <div class="share-dashboard">
    <!-- Share Button -->
    <button @click="showShareModal = true" class="icon-button">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
      </svg>
    </button>

    <!-- Share Modal -->
    <div v-if="showShareModal" class="modal-overlay" @click.self="closeModal">
      <div class="share-modal">
        <div class="modal-header">
          <h2>Share Dashboard</h2>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>

        <div class="modal-body">
          <!-- Step 1: Choose Access Level -->
          <div v-if="step === 1" class="access-levels">
            <h3>Choose access level</h3>
            
            <div 
              v-for="level in accessLevels" 
              :key="level.type"
              @click="selectAccessLevel(level.type)"
              :class="['access-option', { selected: selectedAccess === level.type }]"
            >
              <div class="access-icon">
                <svg v-if="level.type === 'view'" viewBox="0 0 24 24" width="24" height="24">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
                <svg v-else-if="level.type === 'editor'" viewBox="0 0 24 24" width="24" height="24">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" width="24" height="24">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              </div>
              <div class="access-info">
                <h4>{{ level.name }}</h4>
                <p>{{ level.description }}</p>
              </div>
              <div class="access-select">
                <svg v-if="selectedAccess === level.type" viewBox="0 0 24 24" width="20" height="20" fill="#4a90e2">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
            </div>

            <button 
              @click="step = 2" 
              :disabled="!selectedAccess"
              class="continue-btn"
            >
              Continue
            </button>
          </div>

          <!-- Step 2: Configure & Generate Link -->
          <div v-if="step === 2" class="link-config">
            <button @click="step = 1" class="back-btn">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              Back
            </button>

            <h3>Configure share settings</h3>

            <!-- Expiry Settings -->
            <div class="config-section">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="hasExpiry"
                > 
                <span>Set expiration date</span>
              </label>
              
              <div v-if="hasExpiry" class="expiry-options">
                <select v-model="expiryDays" class="expiry-select">
                  <option :value="1">1 day</option>
                  <option :value="7">7 days</option>
                  <option :value="30">30 days</option>
                  <option :value="90">90 days</option>
                </select>
              </div>
            </div>

            <!-- Generate Link Button -->
            <button 
              @click="generateShareLink" 
              class="generate-btn"
              :disabled="generating"
            >
              <svg v-if="!generating" viewBox="0 0 24 24" width="20" height="20">
                <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
              </svg>
              <span v-if="generating">Generating...</span>
              <span v-else>Generate Share Link</span>
            </button>
          </div>

          <!-- Step 3: Share Link Generated -->
          <div v-if="step === 3" class="link-generated">
            <div class="success-icon">
              <svg viewBox="0 0 24 24" width="64" height="64" fill="#4caf50">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            
            <h3>Share link created!</h3>
            <p>Anyone with this link can {{ getAccessDescription() }} your dashboard</p>

            <div class="link-display">
              <input 
                :value="generatedLink" 
                readonly 
                ref="linkInput"
                @click="selectLink"
              >
              <button @click="copyLink" class="copy-btn">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path v-if="!copied" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  <path v-else d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#4caf50"/>
                </svg>
                {{ copied ? 'Copied!' : 'Copy' }}
              </button>
            </div>

            <div class="share-options">
              <button @click="shareViaEmail" class="share-method">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                Email
              </button>
              <button @click="shareViaWhatsApp" class="share-method">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M16.75 13.96c.25.13.41.2.46.3.06.11.04.61-.21 1.18-.2.56-1.24 1.1-1.7 1.12-.46.02-.47.36-2.96-.73-2.49-1.09-3.99-3.75-4.11-3.92-.12-.17-.96-1.38-.92-2.61.05-1.22.69-1.8.95-2.04.24-.26.51-.29.68-.26h.47c.15 0 .36-.06.55.45l.69 1.87c.06.13.1.28.01.44l-.27.41-.39.42c-.12.12-.26.25-.12.5.12.26.62 1.09 1.32 1.78.91.88 1.71 1.17 1.95 1.3.24.14.39.12.54-.04l.81-.94c.19-.25.35-.19.58-.11l1.67.88M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10c-1.97 0-3.8-.57-5.35-1.55L2 22l1.55-4.65A9.969 9.969 0 0 1 2 12 10 10 0 0 1 12 2m0 2a8 8 0 0 0-8 8c0 1.72.54 3.31 1.46 4.61L4.5 19.5l2.89-.96A7.95 7.95 0 0 0 12 20a8 8 0 0 0 8-8 8 8 0 0 0-8-8z"/>
                </svg>
                WhatsApp
              </button>
              <button @click="generateQR" class="share-method">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM17 17h2v2h-2zM19 19h2v2h-2zM15 19h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2z"/>
                </svg>
                QR Code
              </button>
            </div>

            <button @click="createAnother" class="secondary-btn">
              Create another link
            </button>
          </div>

          <!-- Existing Links Management -->
          <div v-if="step === 4" class="manage-links">
            <h3>Manage share links</h3>
            
            <div v-if="existingLinks.length === 0" class="no-links">
              <p>No active share links</p>
            </div>

            <div v-else class="links-list">
              <div 
                v-for="link in existingLinks" 
                :key="link.id"
                class="link-item"
                :class="{ 'inactive': !link.active }"
              >
                <div class="link-content">
                  <div class="link-header">
                    <div class="link-type-badge" :class="`type-${link.type}`">
                      <svg v-if="link.type === 'view'" viewBox="0 0 24 24" width="16" height="16">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                      </svg>
                      <svg v-else-if="link.type === 'editor'" viewBox="0 0 24 24" width="16" height="16">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                      </svg>
                      <svg v-else viewBox="0 0 24 24" width="16" height="16">
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                      </svg>
                      <span>{{ link.type }}</span>
                    </div>
                    <div class="link-status" :class="{ 'active': link.active }">
                      <span class="status-dot"></span>
                      {{ link.active ? 'Active' : 'Inactive' }}
                    </div>
                  </div>
                  
                  <div class="link-details">
                    <div class="link-url">
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                      </svg>
                      <code>{{ getShareUrl(link) }}</code>
                      <button @click="copyLinkUrl(link)" class="copy-mini-btn" :title="'Copy link'">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                      </button>
                    </div>
                    
                    <div class="link-meta">
                      <span class="meta-item">
                        <svg viewBox="0 0 24 24" width="14" height="14">
                          <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                        </svg>
                        Created {{ formatDate(link.createdAt) }}
                      </span>
                      <span v-if="link.expiresAt" class="meta-item expire-item" :class="{ 'expired': isExpired(link.expiresAt) }">
                        <svg viewBox="0 0 24 24" width="14" height="14">
                          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                        </svg>
                        {{ isExpired(link.expiresAt) ? 'Expired' : 'Expires' }} {{ formatDate(link.expiresAt) }}
                      </span>
                      <span class="meta-item">
                        <svg viewBox="0 0 24 24" width="14" height="14">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                        Used {{ link.usageCount }} {{ link.usageCount === 1 ? 'time' : 'times' }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div class="link-actions">
                  <label class="toggle-switch">
                    <input 
                      type="checkbox" 
                      :checked="link.active"
                      @change="toggleLinkStatus(link)"
                    >
                    <span class="toggle-slider"></span>
                  </label>
                  
                  <button 
                    @click="deleteLink(link)" 
                    class="delete-btn"
                    title="Delete link permanently"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="step = 4" class="manage-links-btn">
            Manage existing links
          </button>
        </div>
      </div>
    </div>

    <!-- QR Code Modal -->
    <div v-if="showQRModal" class="modal-overlay" @click="showQRModal = false">
      <div class="qr-modal" @click.stop>
        <h3>Scan to access dashboard</h3>
        <div class="qr-container">
          <canvas ref="qrCanvas"></canvas>
        </div>
        <button @click="showQRModal = false" class="close-qr-btn">Close</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import QRCode from 'qrcode';

export default {
  name: 'ShareDashboard',
  setup() {
    const store = useStore();
    const showShareModal = ref(false);
    const showQRModal = ref(false);
    const step = ref(1);
    const selectedAccess = ref('');
    const hasExpiry = ref(false);
    const expiryDays = ref(7);
    const generating = ref(false);
    const generatedLink = ref('');
    const copied = ref(false);
    const qrCanvas = ref(null);

    const existingLinks = computed(() => store.getters['sharing/getShareLinks']);

    const accessLevels = [
      {
        type: 'view',
        name: 'View Only',
        description: 'Can view your dashboard but cannot make any changes'
      },
      {
        type: 'editor',
        name: 'Editor',
        description: 'Can view and edit content in your dashboard'
      },
      {
        type: 'co-creator',
        name: 'Co-creator',
        description: 'Full access to view, edit, and manage the dashboard'
      }
    ];

    const selectAccessLevel = (type) => {
      selectedAccess.value = type;
    };

    const generateShareLink = async () => {
      generating.value = true;
      try {
        const result = await store.dispatch('sharing/createShareLink', {
          accessType: selectedAccess.value,
          expiryDays: hasExpiry.value ? expiryDays.value : null
        });
        
        generatedLink.value = result.url;
        step.value = 3;
        
        // Show success message if you have a toast system
        console.log('Share link created successfully!');
      } catch (error) {
        console.error('Failed to create share link:', error);
      } finally {
        generating.value = false;
      }
    };

    const copyLink = async () => {
      const url = generatedLink.value;
      
      // Check if clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(url);
          console.log('Link copied to clipboard');
          // You can add a toast notification here
          return;
        } catch (err) {
          console.error('Clipboard API failed:', err);
          // Fall through to fallback method
        }
      }
      
      // Fallback method for older browsers or non-HTTPS contexts
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        console.log('Link copied to clipboard (fallback)');
        // You can add a toast notification here
      } catch (err) {
        console.error('Failed to copy link:', err);
        // As a last resort, you could show a prompt with the URL
        prompt('Copy this link:', url);
      } finally {
        document.body.removeChild(textArea);
      }
    };

    const selectLink = (event) => {
      event.target.select();
    };

    const shareViaEmail = () => {
      const subject = encodeURIComponent('Shared Dashboard Access');
      const body = encodeURIComponent(`I've shared my dashboard with you. Access it here: ${generatedLink.value}`);
      window.open(`mailto:?subject=${subject}&body=${body}`);
    };

    const shareViaWhatsApp = () => {
      const text = encodeURIComponent(`I've shared my dashboard with you. Access it here: ${generatedLink.value}`);
      window.open(`https://wa.me/?text=${text}`);
    };

    const generateQR = async () => {
      showQRModal.value = true;
      // Wait for modal to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (qrCanvas.value) {
        try {
          await QRCode.toCanvas(qrCanvas.value, generatedLink.value, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
        } catch (err) {
          console.error('Error generating QR code:', err);
        }
      }
    };

    const getAccessDescription = () => {
      const level = accessLevels.find(l => l.type === selectedAccess.value);
      return level ? level.name.toLowerCase() : '';
    };

    const createAnother = () => {
      step.value = 1;
      selectedAccess.value = '';
      hasExpiry.value = false;
      generatedLink.value = '';
    };

    const closeModal = () => {
      showShareModal.value = false;
      step.value = 1;
      selectedAccess.value = '';
      hasExpiry.value = false;
      generatedLink.value = '';
    };
    
    // Watch for modal opening to load existing links
    watch(showShareModal, async (newValue) => {
      if (newValue) {
        await loadExistingLinks();
      }
    });

    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    };

    const isExpired = (date) => {
      if (!date) return false;
      return new Date(date) < new Date();
    };

    const getShareUrl = (link) => {
      if (link.url) return link.url;
      // Use a safer way to get the origin
      const origin = window?.location?.origin || 'https://solfie-398005.web.app';
      return `${origin}/shared/${link.accessKey}`;
    };

    const copyLinkUrl = async (link) => {
      const url = getShareUrl(link);
      
      // Check if clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(url);
          console.log('Link copied to clipboard');
          // You can add a toast notification here
          return;
        } catch (err) {
          console.error('Clipboard API failed:', err);
          // Fall through to fallback method
        }
      }
      
      // Fallback method for older browsers or non-HTTPS contexts
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        console.log('Link copied to clipboard (fallback)');
        // You can add a toast notification here
      } catch (err) {
        console.error('Failed to copy link:', err);
        // As a last resort, you could show a prompt with the URL
        prompt('Copy this link:', url);
      } finally {
        document.body.removeChild(textArea);
      }
    };

    const toggleLinkStatus = async (link) => {
      try {
        if (link.active) {
          // Deactivate the link
          await store.dispatch('sharing/revokeShareLink', link.accessKey);
          console.log('Link deactivated successfully');
        } else {
          // Reactivate the link
          await store.dispatch('sharing/reactivateShareLink', link.accessKey);
          console.log('Link reactivated successfully');
        }
        // Reload the links
        await loadExistingLinks();
      } catch (error) {
        console.error('Failed to toggle link status:', error);
        // Reload to restore correct state
        await loadExistingLinks();
      }
    };

    const deleteLink = async (link) => {
      if (confirm('Are you sure you want to permanently delete this link? This action cannot be undone.')) {
        try {
          await store.dispatch('sharing/deleteShareLink', link.id);
          console.log('Link deleted successfully');
        } catch (error) {
          console.error('Failed to delete link:', error);
        }
      }
    };

    const loadExistingLinks = async () => {
      try {
        console.log('Current mindspaceId:', store.state.mindspace.currentMindSpaceId);
        console.log('Current userId:', store.state.user.user.uid);
        await store.dispatch('sharing/loadShareLinks');
        console.log('Existing links loaded:', existingLinks.value);
      } catch (error) {
        console.error('Failed to load existing links:', error);
      }
    };

    const revokeLink = async (link) => {
      // This function is now replaced by toggleLinkStatus
      await toggleLinkStatus(link);
    };
    
    // Also watch for step changes to load links when going to step 4
    watch(step, async (newStep) => {
      if (newStep === 4) {
        await loadExistingLinks();
      }
    });

    onMounted(() => {
      // Links will be loaded when modal opens or step 4 is selected
    });

    return {
      showShareModal,
      showQRModal,
      step,
      selectedAccess,
      hasExpiry,
      expiryDays,
      generating,
      generatedLink,
      copied,
      existingLinks,
      accessLevels,
      qrCanvas,
      selectAccessLevel,
      generateShareLink,
      copyLink,
      selectLink,
      shareViaEmail,
      shareViaWhatsApp,
      generateQR,
      getAccessDescription,
      createAnother,
      closeModal,
      formatDate,
      isExpired,
      getShareUrl,
      copyLinkUrl,
      toggleLinkStatus,
      deleteLink,
      loadExistingLinks,
      revokeLink
    };
  }
};
</script>

<style lang="scss" scoped>
.share-button {
  background: #4a90e2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  transition: background 0.2s;

  &:hover {
    background: #357abd;
  }

  svg {
    fill: currentColor;
  }
}

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

.share-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
    font-size: 20px;
    color: #333;
  }
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;

  &:hover {
    background: #f5f5f5;
  }
}

.modal-body {
  padding: 20px;
}

.access-levels h3,
.link-config h3,
.link-generated h3,
.manage-links h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #333;
}

.access-option {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 2px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 12px;
  transition: all 0.2s;

  &:hover {
    border-color: #4a90e2;
    background: #f8f9fa;
  }

  &.selected {
    border-color: #4a90e2;
    background: #f0f7ff;
  }

  svg {
    fill: #4a90e2;
  }
}

.access-icon {
  font-size: 24px;
  margin-right: 16px;
  color: #4a90e2;
}

.access-info {
  flex: 1;

  h4 {
    margin: 0 0 4px 0;
    font-size: 16px;
    color: #333;
  }

  p {
    margin: 0;
    color: #666;
    font-size: 14px;
  }
}

.access-select {
  width: 20px;
  height: 20px;
}

.continue-btn,
.generate-btn {
  width: 100%;
  padding: 12px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 20px;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover:not(:disabled) {
    background: #357abd;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  svg {
    fill: currentColor;
  }
}

.back-btn {
  background: none;
  border: none;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
  transition: color 0.2s;

  &:hover {
    color: #333;
  }

  svg {
    fill: currentColor;
  }
}

.config-section {
  margin-top: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 16px;
  color: #333;

  input[type="checkbox"] {
    margin-right: 8px;
  }
}

.expiry-options {
  margin-top: 12px;
}

.expiry-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  background: white;
}

.success-icon {
  text-align: center;
  margin-bottom: 20px;
}

.link-generated {
  text-align: center;

  p {
    color: #666;
    margin-bottom: 20px;
  }
}

.link-display {
  display: flex;
  gap: 8px;
  margin: 20px 0;

  input {
    flex: 1;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-family: monospace;
    font-size: 14px;
    background: #f9f9f9;
  }
}

.copy-btn {
  padding: 12px 20px;
  background: #f0f0f0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
  white-space: nowrap;

  &:hover {
    background: #e0e0e0;
  }

  svg {
    fill: currentColor;
  }
}

.share-options {
  display: flex;
  gap: 12px;
  margin: 20px 0;
  justify-content: center;
}

.share-method {
  flex: 1;
  padding: 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  font-size: 14px;

  &:hover {
    background: #f5f5f5;
    border-color: #999;
  }

  svg {
    fill: #666;
  }
}

.secondary-btn {
  background: none;
  border: 1px solid #4a90e2;
  color: #4a90e2;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: #f0f7ff;
  }
}

.no-links {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.links-list {
  max-height: 300px;
  overflow-y: auto;
}

.links-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 4px;
}

.link-item {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  margin-bottom: 12px;
  background: white;
  transition: all 0.2s;

  &:hover {
    border-color: #d0d0d0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  &.inactive {
    opacity: 0.6;
    background: #f9f9f9;
  }
}

.link-content {
  flex: 1;
  min-width: 0; // Allow content to shrink
}

.link-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.link-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;

  svg {
    fill: currentColor;
  }

  &.type-view {
    background: #e3f2fd;
    color: #1976d2;
  }

  &.type-editor {
    background: #fff3e0;
    color: #f57c00;
  }

  &.type-co-creator {
    background: #f3e5f5;
    color: #7b1fa2;
  }
}

.link-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ccc;
  }

  &.active .status-dot {
    background: #4caf50;
  }
}

.link-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link-url {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: 12px;

  svg {
    fill: #666;
    flex-shrink: 0;
  }

  code {
    flex: 1;
    font-family: monospace;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.copy-mini-btn {
  padding: 4px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  svg {
    fill: #666;
  }
}

.link-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;

  svg {
    fill: currentColor;
  }

  &.expire-item.expired {
    color: #f44336;
  }
}

.link-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-left: 16px;
  border-left: 1px solid #e0e0e0;
  margin-left: 16px;
}

// Toggle switch styles
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .toggle-slider {
      background-color: #4caf50;
    }

    &:checked + .toggle-slider:before {
      transform: translateX(24px);
    }
  }
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .3s;
  border-radius: 24px;

  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .3s;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

.delete-btn {
  padding: 8px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #ffebee;
    border-color: #f44336;

    svg {
      fill: #f44336;
    }
  }

  svg {
    fill: #666;
    transition: fill 0.2s;
  }
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: center;
}

.manage-links-btn {
  background: none;
  border: none;
  color: #4a90e2;
  cursor: pointer;
  font-size: 14px;
  text-decoration: underline;

  &:hover {
    color: #357abd;
  }
}

.qr-modal {
  background: white;
  padding: 24px;
  border-radius: 12px;
  text-align: center;

  h3 {
    margin: 0 0 20px 0;
    font-size: 18px;
    color: #333;
  }
}

.qr-container {
  margin: 20px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;

  canvas {
    border: 1px solid #eee;
    border-radius: 8px;
  }
}

.close-qr-btn {
  padding: 10px 24px;
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

// Responsive
@media (max-width: 768px) {
  .share-options {
    flex-direction: column;
  }
  
  .share-method {
    width: 100%;
  }
}
</style>