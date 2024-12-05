<template>

<nav class="sticky-nav-container" :class="{ expanded: isChatBoxExpanded }">
      <div class="nav-icons" v-if="!isChatBoxExpanded">
        <a href="#" class="nav-icon">
          <img src="../assets/icons/journalIcon.svg" alt="Journal" />
          <span class="icon-label">Solfie Journal</span>
        </a>
        <a href="#" class="nav-icon">
          <img src="../assets/icons/eventIcon.svg" alt="Event" />
          <span class="icon-label">Solfie Events</span>
        </a>
        <a href="#" class="nav-icon">
          <img src="../assets/icons/squareIcon.svg" alt="Square" />
          <span class="icon-label">Solfie Square</span>
        </a>
        <a href="#" class="nav-icon">
          <img src="../assets/icons/statusIcon.svg" alt="Status" />
          <span class="icon-label">Status</span>
        </a>
      </div>
      <button class="chatbox-button" @click="toggleChatBox" v-if="!isChatBoxExpanded">
        <span class="chat-text">Chat with Solfie AI</span>
        <div class="icon-group">
          <span class="clip-icon">📎</span>
          <span class="paper-plane-icon">✈️</span>
        </div>
      </button>
      <div class="expanded-chat-box" v-if="isChatBoxExpanded" >
        <div class="header">
          <div class="header-content">
            <span class="solfie-ai-label">Solfie AI</span>
            <button class="close-icon" @click="toggleChatBox">×</button>
          </div>
        </div>
        <div class="chat-messages" ref="chatMessagesContainer">
          <div v-for="(message, index) in chatMessages" :key="index"
              class="message-container"
              :class="{ 'user-message': message.sender === 'user', 'ai-message': message.sender === 'ai' }">
              <div class="sender-name">{{ message.sender === 'user' ? 'You' : 'Solfie AI' }}</div>
            <div class="chat-bubble">
              <p v-for="(line, lineIndex) in message.text.split('\n')" :key="lineIndex">
                {{ line }}
              </p>
            </div>
            <div class="timestamp">{{ formatDate(message.timestamp) }}</div>
          </div>
        </div>
        <div class="chat-messages-example" v-if="!hasUserMessages">
          <div
            v-for="(messageExample, index) in chatMessagesExample"
            :key="index"
            class="messageExample"
            @click="copyToTextarea(messageExample)"
          >
            {{ messageExample }}
          </div>
        </div>
        <div class="chat-input-field">
          <textarea v-model="chatInput" placeholder="Type a message..."></textarea>
          <div class="chat-actions">
            <button class="file-upload-button">
              <span class="clip-icon">📎</span>
            </button>
            <button class="send-button" @click="sendMessage">✈️</button>
          </div>
        </div>
      </div>
    </nav>


</template>

<script>
import { defineComponent, ref, computed, watch, nextTick } from 'vue';
import { useStore } from 'vuex';
import { formatDate } from '../utility/dateUtils';

export default defineComponent({
  setup() {
    const store = useStore();
    const user = computed(() => store.state.user.user || {});
    const stats = computed(() => store.state.user.stats || {});
    const chatMessagesContainer = ref(null);

    const selectedImage = ref({
      title: 'Title',
      date: '2024/01/01',
    });

    const toggleChatBox = () => {
        isChatBoxExpanded.value = !isChatBoxExpanded.value;
      };

    const isChatBoxExpanded = ref(false);

    const chatInput = ref('');
    const chatMessages = ref(store.state.chat.chatMessages);

    watch(
      () => store.state.chat.chatMessages,
      (newMessages) => {
        console.log('Chat messages updated:', newMessages);
        chatMessages.value = newMessages;
        nextTick(() => {
          scrollToBottom();
        });
      },
      { deep: true, immediate: true }
    );

    const chatMessagesExample = computed(() => store.getters['chat/chatMessagesExample']);

    const copyToTextarea = (message) => {
      chatInput.value = message;
    };

    const hasUserMessages = ref(false);

    const sendingMessage = ref(false);

    const sendMessage = async () => {
      if (chatInput.value.trim() && !sendingMessage.value) {
        const formattedMessage = chatInput.value.replace(/\n/g, '\n');
        chatInput.value = ''; // Clear input immediately

        sendingMessage.value = true; // Disable sending
        hasUserMessages.value = true; // Update message state immediately

        try {
          await store.dispatch('chat/startConversation', formattedMessage);
        } catch (error) {
          console.error('Failed to start conversation:', error);
        } finally {
          sendingMessage.value = false; // Re-enable sending
       }
      }
    };

    const scrollToBottom = () => {
      nextTick(() => {
        console.log('Scrolling to bottom');
        if (chatMessagesContainer.value) {
          chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight;
        }
      });
    };

    watch(chatMessages, (newMessages) => {
      console.log('Updated Chat Messages:', newMessages);
      scrollToBottom();
    }, { immediate: true });

    return {
      //USER DATA FUNCTION
      user,
      stats,
      selectedImage,

      //CHAT FUNCTION
      isChatBoxExpanded,
      chatInput,
      chatMessagesExample,
      copyToTextarea,
      chatMessages,
      formatDate,
      toggleChatBox,
      sendMessage,
      hasUserMessages,
      chatMessagesContainer,
      scrollToBottom
    };
  },
});
</script>
