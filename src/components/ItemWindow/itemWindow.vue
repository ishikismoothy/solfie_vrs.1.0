<template>
    
    <div v-if="isOpen" class="item-window-overlay">
        <div class="item-window">
            <div class="page-container">
                
                <input 
                    v-model="editedContent"
                    class="edit-input"
                    type="text" v-if="onNameEdit"
                    ref="editInput"
                    @blur="triggerNameEdit"
                    >
                
                <p
                    @click = "triggerNameEdit"
                    v-else
                >{{ currentItemName }}</p>

                <button @click="close" class="icon-button close-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                
                <div class="controls mb-4">
                    <button @click="addNewBlock('title-block')" class="btn">Add Title</button>
                    <button @click="addNewBlock('body-block')" class="btn">Add Body</button>
                    <button @click="addNewBlock('image-block')" class="btn">Add Image</button>
                    <button @click="addNewBlock('line-block')" class="btn">Add Line</button>
                    <button @click="addNewBlock('todo-block')" class="btn">Add Todo</button>
                </div>
        
                <div class="blocks-container">
                    <block-wrapper
                    v-for="(block, index) in blocks"
                    :key="block.id"
                    :block="block"
                    :index="index"
                    :total-blocks="blocks.length"
                    @edit="handleBlockEdit"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { computed, onMounted, watch, ref } from 'vue';
import { useStore } from 'vuex';
import BlockWrapper from './blockWrapper.vue';

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
        BlockWrapper
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

        const close = () => {
            emit('close');
            onNameEdit.value = false;
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

        const triggerNameEdit = () => {
            console.log("[triggerNameEdit/itemContentsWindow.vue] Input: ", editedContent.value);
            if(!onNameEdit.value){
                onNameEdit.value = true;
                editedContent.value = currentItemName.value;
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


        return {
            blocks,
            close,
            addNewBlock,
            handleBlockEdit,
            currentItemName,
            onNameEdit,
            triggerNameEdit,
            editedContent,
        };
    }
};
</script>

<style lang="scss">
@import '@/assets/itemWindowStyle.scss';
</style>
  