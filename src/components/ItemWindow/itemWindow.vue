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
                
                <button 
                    class="icon-button editBlock-button"
                    @click="toggleEditBlock"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75 1.84-1.83z"/>
                      <path d="M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z"/>
                    </svg>
                </button>

                <button @click="close" class="icon-button close-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
        
                <div class="blocks-container">
                    <AddBlockButton 
                        :index="0"
                        :is-block-edit="isBlockEdit"
                        @add="handleAddBlock"
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

        //const isBlockEdit = ref(true); // Add this or use your existing implementation

        const handleAddBlock = ({ type, index }) => {
            const newBlock = {
                id: 'e-' + generateRandomId(),
                type,
                content: getDefaultContent(type),
                createdBy: currentUid.value,
                editedBy: [currentUid.value],
                createdAt: new Date().toISOString(),
                editedAt: new Date().toISOString()
            };

            // Add new action to your store
            store.dispatch('mindspace/addBlockAtIndex', { block: newBlock, index });
        };

        const isBlockEdit = computed(() => store.state.user.itemWindow.isBlockEdit);
        const toggleEditBlock = () => {
            const newValue = !isBlockEdit.value;
            store.dispatch('user/setIsBlockEdit', newValue);
        }


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
        };
    }
};
</script>

<style lang="scss">
@import '@/assets/itemWindowStyle.scss';
</style>
  