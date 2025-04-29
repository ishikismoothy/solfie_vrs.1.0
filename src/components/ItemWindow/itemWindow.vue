<template>

    <div v-if="isOpen" class="item-window-overlay">
        <div class="item-window">
            <div class="page-container">

              <input
                  v-model="editedContent"
                  class="edit-input-name"
                  type="text" v-if="onNameEdit"
                  ref="editInput"
                  @blur="triggerNameEdit"
              >

              <h3
                  @click = "triggerNameEdit"
                  v-else
              >{{ currentItemName }}</h3>

              <div class="block-option-container">
                  <button
                      class="icon-button editBlock-button"
                      @click="toggleEditBlock"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75 1.84-1.83z"/>
                      <path d="M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z"/>
                      </svg>
                  </button>
                  <button class="icon-button moveItem-button" @click="openMoveItemModal()">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M3 6h18v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/>
                          <path d="M3 6l2-4h3l2 4"/>
                          <path d="M8 14h8M16 14l-3 3M16 14l-3-3"/>
                      </svg>
                  </button>
                  <button class="icon-button duplicateBlock-button" @click="openDuplicateDialog()">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                  </button>

                  <button class="icon-button" @click="openDeleteDialog()">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                  </button>

                  <button @click="close" class="icon-button close-button">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                  </button>
              </div>

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
</template>

<script>
import { computed, onMounted, watch, ref, nextTick } from 'vue';
import { useStore } from 'vuex';
import BlockWrapper from './blockWrapper.vue';
import AddBlockButton from './addBlockButton.vue';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
// import { getFirestore, doc, updateDoc } from 'firebase/firestore';

// Move helper functions outside of setup
const generateRandomId = (length = 10) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const getDefaultContent = (type) => {
    switch (type) {
        case 'title-block':
            return 'New Title'
        case 'body-block':
            return 'New body text'
        case 'image-block':
            return '/path/to/default/image.jpg'
        case 'todo-block':
            return [{
                name: 'New todo item',
                tick: false,
                createdAt: new Date().toISOString(),
                due: new Date(Date.now() + 86400000).toISOString() // Tomorrow
            }]
        default:
            return null
    }
};

export default {
    name: 'ItemWindow',
    components: {
        BlockWrapper,
        AddBlockButton
    },
    props: {
      // coverImageUrl: String,
      isOpen: {
          type: Boolean,
          required: true
      }
    },
    emits: ['close'],
    setup(props, { emit }) {
        const store = useStore();
        const selectedItemId = computed(() => store.getters['mindspace/getItemId']);
        const currentItemName = computed(() => store.getters['mindspace/getItemName']);
        const currentUid = computed(() => store.getters['mindspace/getUserId']);
        const blocks = computed(() => store.getters['mindspace/getItemBlocks']);
        const editInput = ref(null);
        const coverImageUrl = ref('');

        const close = () => {
            emit('close');
            onNameEdit.value = false;
            store.dispatch('user/setIsBlockEdit', false);
        };

        const loadItemData = async () => {
            if (selectedItemId.value) {
                await store.dispatch('mindspace/setBlocks', selectedItemId.value);
            }
        };

        // Watch for changes in itemId to reload data
        watch(() => selectedItemId.value, async (newId) => {
            if (newId) {
                await loadItemData();
            }

        });
        onMounted(async () => {
            if (selectedItemId.value) {
                await loadItemData();
            }
        });

        const addNewBlock = (type) => {
            const newBlock = {
                id: 'e-' + generateRandomId(),
                type,
                content: getDefaultContent(type),
                createdBy: currentUid.value,
                editedBy: [currentUid.value],
                createdAt: new Date().toISOString(),
                editedAt: new Date().toISOString()
            };
            store.dispatch('mindspace/addBlock', newBlock);
            };

            const handleBlockEdit = (blockId) => {
            store.dispatch('mindspace/setEditingBlock', blockId);
        };

        const onNameEdit = ref(false);
        const editedContent = ref('');

        const triggerNameEdit = async () => {
            console.log("[triggerNameEdit/itemContentsWindow.vue] Input: ", editedContent.value);
            if(!onNameEdit.value){
                onNameEdit.value = true;
                editedContent.value = currentItemName.value;
                await nextTick();
                editInput.value.focus();
                editInput.value.select();
            }else{
                if (editedContent.value !== currentItemName.value) {
                    console.log("[triggerNameEdit/itemContentsWindow.vue] Detect change!")
                    store.dispatch('mindspace/setItemName', editedContent.value);
                    onNameEdit.value = false;
                }else{
                    console.log("[triggerNameEdit/itemContentsWindow.vue] Didn't detect change.")
                    onNameEdit.value = false;
                }
            }
        }
        const openMoveItemModal = () => {
            store.dispatch('user/triggerMoveItemWindow', true);
            close();
        };
        const openDuplicateDialog = async () => {
            console.log(selectedItemId.value);
            const currentFolder = store.state.mindspace.currentFolder;
            console.log("Current Folder:", currentFolder);

            // Optional: Add confirmation dialog
            if (!confirm('Are you sure you want to duplicate this item?')) {
                return;
            }

            // Check if currentFolder exists and has an id
            if (!currentFolder?.id) {
                console.log("[mindSpaceMenu.vue/openDuplicateDialog] Duplicating to page:", selectedItemId.value);
                store.dispatch('mindspace/duplicateItemToPage');
            } else {
                console.log("[mindSpaceMenu.vue/openDuplicateDialog] Duplicating to folder:", currentFolder.id);
                store.dispatch('mindspace/duplicateItemToFolder');
            }
            close();
        };

        const openDeleteDialog = async () => {
            console.log(selectedItemId.value);

            // Optional: Add confirmation dialog
            if (!confirm('Are you sure you want to delete this item?')) {
                return;
            }
            await store.dispatch('mindspace/deleteItem', selectedItemId.value);
            close();
        };

        const handleAddBlock = ({ type, index, content }) => {
            const newBlock = {
                id: 'e-' + generateRandomId(),
                type,
                content: content || getDefaultContent(type),
                createdBy: currentUid.value,
                editedBy: [currentUid.value],
                createdAt: new Date().toISOString(),
                editedAt: new Date().toISOString()
            };

            // Add new action to your store
            store.dispatch('mindspace/addBlockAtIndex', { block: newBlock, index });
        };

        const isBlockEdit = computed(() => store.state.user.editMonitor.isBlockEdit);
        const toggleEditBlock = () => {
            const newValue = !isBlockEdit.value;
            store.dispatch('user/setIsBlockEdit', newValue);
        }

      // Handle image upload
      const handleImageUpload = async ({ file, index }) => {
        console.log("Image upload triggered");
        // const file = event.target.files[0];
        if (!file) return;
        console.log("File selected:", file);
        const uid = currentUid.value;
        if (!uid) {
          console.error("No user ID found!");
          return;
        }

        const storage = getStorage();
        const storageReference = storageRef(storage, `images/${uid}/${file.name}`);

        const uploadTask = uploadBytesResumable(storageReference, file);

        uploadTask.on('state_changed',

          (snapshot) => {
              // Track progress
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log(`Upload is ${progress}% done`);

              switch (snapshot.state) {
                  case 'paused':
                      console.log('Upload is paused');
                      break;
                  case 'running':
                      console.log('Upload is running');
                      break;
              }
          },
          (error) => {
            console.error('Upload failed:', error);
          },
          () => {
            // Upload complete, get the file URL
            getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {

              handleAddBlock({ type: 'image-block', index, content: downloadURL });

            });
          }
        );
      };

        return {
            blocks,
            close,
            addNewBlock,
            handleBlockEdit,
            currentItemName,
            onNameEdit,
            triggerNameEdit,
            editedContent,
            editInput,
            handleAddBlock,
            isBlockEdit,
            toggleEditBlock,
            openDeleteDialog,
            openDuplicateDialog,
            openMoveItemModal,
            handleImageUpload,
            coverImageUrl,
        };
    }
};
</script>

<style lang="scss">
@import '@/assets/itemWindowStyle.scss';
</style>
