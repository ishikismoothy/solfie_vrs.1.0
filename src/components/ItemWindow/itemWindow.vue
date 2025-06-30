<!-- itemWindow.vue -->
<template>
  <div
    class="mind-slot-card"
    :class="{
      expanded: expanded,
      flipped: isFlipped,
      'full-screen': expanded && isFlipped
    }"
    @click="handleCardClick"
  >
    <!-- Card Front: Slot Display -->
    <div class="card-face front">
      <div class="slot-header">
        <input
          v-if="isEditingName"
          v-model="editingName"
          @blur="saveSlotName"
          @keyup.enter="saveSlotName"
          @click.stop
          class="slot-name-input"
          ref="nameInput"
        />
        <h3 v-else class="slot-name" @click.stop="startEditingName">
          {{ mindslot.name || 'New Slot' }}
        </h3>
        <!-- render a close button when expanded -->
        <button
          v-if="expanded"
          @click.stop="handleClose"
          class="icon-button close-button"
        >×</button>

        <!-- render a delete button when not expanded -->
        <button
          v-else
          @click.stop="$emit('delete', index)"
          class="delete-btn"
        >×</button>
      </div>

      <div
        class="slot-content"
        :style="{ backgroundImage: getItemImage(mindslot.item) }"
      >
        <div v-if="getItemName(mindslot.item)" class="item-content">
          {{ getItemName(mindslot.item) }}
        </div>
        <div v-else class="empty-slot-wrapper">
          <div class="empty-slot-text">Click to select item</div>
          <IconSlotGrid
            :initialIcons="mindslot.slotIcons || [null, null, null]"
            @icons-changed="handleIconsChanged"
            @click.stop
          />
        </div>
      </div>

      <!-- Flip indicator when expanded -->
      <div v-if="expanded && mindslot.item" class="flip-indicator">
        Click to view item details →
      </div>
    </div>

    <!-- Card Back: Item Details -->
    <div class="card-face back">
      <div class="item-window-content">
        <!-- Empty Slot View -->
        <div v-if="!currentItemId" class="empty-slot-view">
          <div class="empty-slot-header">
            <h3 class="empty-slot-title">Empty Slot</h3>
            <button @click.stop="handleClose" class="icon-button close-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div class="empty-slot-content">
            <div class="empty-slot-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h4>This slot is empty</h4>
            <p>Select an item from your mindspace to fill this slot, or close this window and choose a different slot.</p>
          </div>
        </div>

        <!-- Regular Item View -->
        <div v-else class="regular-item-view">
          <!-- Item Header with controls -->
          <div class="item-header">
            <div class="item-title-section">
              <input
                v-if="isEditingItemName"
                v-model="editedItemName"
                class="edit-input-name"
                type="text"
                ref="itemNameInput"
                @blur="saveItemName"
                @keyup.enter="saveItemName"
                @click.stop
              />
              <h3 v-else @click.stop="startEditingItemName">
                {{ currentItemName }}
              </h3>
            </div>

            <div class="header-controls">
              <button @click.stop="flipToSlot" class="icon-button back-button">
                ← Back
              </button>
              <button @click.stop="handleClose" class="icon-button close-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          <!-- Item Action Buttons -->
          <div class="block-option-container">
            <button
              class="icon-button editBlock-button"
              @click.stop="toggleEditBlock"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75 1.84-1.83z"/>
                <path d="M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z"/>
              </svg>
            </button>

            <!-- Show these buttons only when NOT opened from mindslot -->
            <template v-if="!openedFromMindslot">
              <button class="icon-button moveItem-button" @click.stop="openMoveItemModal">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/>
                  <path d="M3 6l2-4h3l2 4"/>
                  <path d="M8 14h8M16 14l-3 3M16 14l-3-3"/>
                </svg>
              </button>

              <button class="icon-button duplicateBlock-button" @click.stop="openDuplicateDialog">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>

              <button class="icon-button" @click.stop="openDeleteDialog">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>

              <button class="icon-button" @click.stop="triggerAddMindslot">
                +MIND
              </button>
            </template>

            <!-- Show this button only when opened from mindslot -->
            <button v-if="openedFromMindslot" class="icon-button remove-mind-button" @click.stop="triggerRemoveMindslot">
              -MIND
            </button>
          </div>

          <!-- Item Content (Blocks) -->
          <div class="blocks-container">
            <AddBlockButton
              :index="0"
              :is-block-edit="isBlockEdit"
              @add="handleAddBlock"
              @add-image="handleImageUpload"
              v-if="isBlockEdit"
            />
            <template v-for="(block, index) in blocks" :key="block.id">
              <block-wrapper
                :block="block"
                :index="index"
                :total-blocks="blocks.length"
                @edit="handleBlockEdit"
              />
              <AddBlockButton
                :index="index + 1"
                :is-block-edit="isBlockEdit"
                @add="handleAddBlock"
                @add-image="handleImageUpload"
                v-if="isBlockEdit"
              />
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, watch, nextTick, defineEmits, defineProps } from 'vue'
  import { useStore } from 'vuex'
  import BlockWrapper from '../ItemWindow/blockWrapper.vue'
  import AddBlockButton from '../ItemWindow/addBlockButton.vue'
  import emitter from '@/eventBus'
  import IconSlotGrid from '@/./components/ItemWindow/iconSlotGrid.vue'

  // Props
  const props = defineProps({
    mindslot: {
      type: Object,
      default: () => ({ name: 'New Slot', item: null })
    },
    index: {
      type: Number,
      required: true
    },
    getItemImage: {
      type: Function,
      default: () => () => null
    },
    getItemName: {
      type: Function,
      default: () => () => null
    },
    expanded: {
      type: Boolean,
      default: false
    },
    // New prop to control initial flip state
    initialFlipped: {
      type: Boolean,
      default: false
    },
    openedFromMindslot: {
      type: Boolean,
      default: false
    }
  })

  // Emits
  const emit = defineEmits([
    'delete',
    'name-change',
    'click',
    'close',
    'item-updated',
    'slot-icons-changed'
  ])

  const store = useStore()

  // Reactive state
  const isFlipped = ref(props.initialFlipped)
  const isEditingName = ref(false)
  const editingName = ref(props.mindslot.name || 'New Slot')
  const nameInput = ref(null)

  // Item editing state
  const isEditingItemName = ref(false)
  const editedItemName = ref('')
  const itemNameInput = ref(null)

  // Computed properties from store
  const currentItemId = computed(() => store.getters['mindspace/getItemId'])
const currentItemName = computed(() => {
  const name = store.getters['mindspace/getItemName'];
  console.log('[ItemWindow] Getting item name from store:', name, 'for item:', currentItemId.value);
  return name || 'Loading...';
});
  const currentUid = computed(() => store.getters['mindspace/getUserId'])
  const blocks = computed(() => store.getters['mindspace/getItemBlocks'])
  const isBlockEdit = computed(() => store.state.user.editMonitor.isBlockEdit)

  // Card interaction methods
  async function handleCardClick() {
    if (!props.expanded) {
      // Normal card click - emit to parent for expansion
      emit('click', props.index)
      return
    }

    // Expanded card click
    if (!isFlipped.value) {
      // Front side clicked - flip to show item
      await flipToItem()
    }
  }

  function handleIconsChanged(newIcons) {
    console.log('Icons changed for slot:', newIcons)
    emit('slot-icons-changed', {
      index: props.index,
      icons: newIcons
    })
  }

  async function flipToItem() {
    if (!props.mindslot.item) {
      console.log('No item to flip to')
      return
    }

    console.log('[ItemWindow] Flipping to item:', props.mindslot.item);

    // Load the item data and make sure name is loaded
    await store.dispatch('mindspace/setItemId', props.mindslot.item);

    // Give it a moment to load the name
    await nextTick();

    isFlipped.value = true;
  }

  function flipToSlot() {
    isFlipped.value = false
  }

  function handleClose() {
    emit('close')
  }

  // Name editing methods
  function startEditingName() {
    isEditingName.value = true
    editingName.value = props.mindslot.name || 'New Slot'
    nextTick(() => {
      nameInput.value?.focus()
      nameInput.value?.select()
    })
  }

  function saveSlotName() {
    isEditingName.value = false
    if (editingName.value.trim() !== props.mindslot.name) {
      emit('name-change', { index: props.index, newName: editingName.value.trim() })
    }
  }

  // Item name editing methods
  function startEditingItemName() {
    if (!currentItemId.value) return

    isEditingItemName.value = true
    editedItemName.value = currentItemName.value
    nextTick(() => {
      itemNameInput.value?.focus()
      itemNameInput.value?.select()
    })
  }

  function saveItemName() {
    isEditingItemName.value = false
    if (editedItemName.value !== currentItemName.value) {
      store.dispatch('mindspace/setItemName', editedItemName.value)
    }
  }

  // Item action methods
  function toggleEditBlock() {
    const newValue = !isBlockEdit.value
    store.dispatch('user/setIsBlockEdit', newValue)
  }

  function openMoveItemModal() {
    store.dispatch('user/triggerMoveItemWindow', true)
    emit('close')
  }

  function openDuplicateDialog() {
    if (!confirm('Are you sure you want to duplicate this item?')) return

    const currentFolder = store.state.mindspace.currentFolder
    if (!currentFolder?.id) {
      store.dispatch('mindspace/duplicateItemToPage')
    } else {
      store.dispatch('mindspace/duplicateItemToFolder')
    }
    emit('close')
  }

  function openDeleteDialog() {
    if (!confirm('Are you sure you want to delete this item?')) return

    store.dispatch('mindspace/deleteItem', currentItemId.value)
    emit('close')
  }

  function triggerAddMindslot() {
    emitter.emit('showMindslotModal', {
      itemId: currentItemId.value,
      title: currentItemName.value
    })
  }

  // Block management methods
  const generateRandomId = (length = 10) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
  }

  const getDefaultContent = (type) => {
    switch (type) {
      case 'title-block': return 'New Title'
      case 'body-block': return 'New body text'
      case 'image-block': return '/path/to/default/image.jpg'
      case 'todo-block': return [{
        name: 'New todo item',
        tick: false,
        createdAt: new Date().toISOString(),
        due: new Date(Date.now() + 86400000).toISOString()
      }]
      default: return null
    }
  }

  function handleBlockEdit(blockId) {
    store.dispatch('mindspace/setEditingBlock', blockId)
  }

  function handleAddBlock({ type, index, content }) {
    const newBlock = {
      id: 'e-' + generateRandomId(),
      type,
      content: content || getDefaultContent(type),
      createdBy: currentUid.value,
      editedBy: [currentUid.value],
      createdAt: new Date().toISOString(),
      editedAt: new Date().toISOString()
    }
    store.dispatch('mindspace/addBlockAtIndex', { block: newBlock, index })
  }

  async function handleImageUpload({ file, index }) {
    try {
      const downloadURL = await store.dispatch('mindspace/handleImageUpload', { file })
      if (downloadURL) {
        handleAddBlock({ type: 'image-block', index, content: downloadURL })
      }
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }

  function triggerRemoveMindslot() {
    emitter.emit('removeMindslot', {
      itemId: currentItemId.value,
      slotIndex: props.index
    })
    emit('close')
  }

  // Watchers
  watch(() => props.mindslot?.name, (newName) => {
    if (newName) {
      editingName.value = newName
    }
  })

  watch(() => props.initialFlipped, (newValue) => {
    isFlipped.value = newValue
  })

  // Add this watcher to see when the item name updates
  watch(currentItemName, (newName, oldName) => {
    console.log('[ItemWindow] Item name changed:', { oldName, newName, itemId: currentItemId.value });
  });

  watch(currentItemId, async (newId, oldId) => {
    console.log('[ItemWindow] Item ID changed:', { oldId, newId });
  });

  // Watch for item changes and load data when flipped
  watch([() => props.mindslot.item, isFlipped], async ([newItemId, flipped]) => {
    if (flipped && newItemId && newItemId !== currentItemId.value) {
      await store.dispatch('mindspace/setItemId', newItemId)
    }
  }, { immediate: true })

</script>

<style lang="scss">
  @import '@/assets/itemWindowStyle.scss';
  @import '@/assets/globalIconStyle.scss';
</style>
