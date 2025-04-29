<template>

  <router-view/>

  <!-- uncomment the following lines to use the FirestoreTest component -->

  <!-- <div id="app">
    <FirestoreTest />
  </div> -->

</template>

<style lang="scss">
@import './assets/layerStyle.scss';
@import './assets/loadingScreenStyle.scss';
@import './assets/globalIconStyle.scss';
@import './assets/globalModalStyle.scss';

#app {
  font-family: Helvetica, Avenir, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

</style>

<script>
import { defineComponent, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { 
  updateViewThemeHistory,
  updateViewMindspaceHistory,
} from '@/firebase/firebaseFirestore';

export default defineComponent({
  name: 'DashboardView',

  setup() {
    const store = useStore();
    const userId = computed(() => store.state.user.user.uid);
    const currentThemeId = computed(() => store.state.themeSpace.currentThemeId);
    const currentMindSpaceId = computed(() => store.state.mindspace.currentMindSpaceId);
    
    onMounted(async () => {
      if (!userId.value) {
        await store.dispatch('user/setUserId');
        console.log("[App.vue/onMounted -> store/user] Assigned uid: ",userId.value);
      }
    })
    watch(
    [ () => currentThemeId.value, () => currentMindSpaceId.value],([newValue1,newValue2]) => {
        if (newValue1) {
          updateViewThemeHistory(userId.value, currentThemeId.value);
        }
        if (newValue2) {
          updateViewMindspaceHistory(userId.value, currentMindSpaceId.value);
        }
      }
    );
  }
})
// uncomment the following lines to use the FirestoreTest component

// import FirestoreTest from './components/firestoreTest.vue'; // Adjust path if needed

// export default {
//   name: 'App',
//   components: {
//     FirestoreTest
//   }
// }
</script>
