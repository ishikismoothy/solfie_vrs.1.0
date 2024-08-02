<!-- <template>
  <signingUp v-if="!isAuthenticated"/>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png">
  </div>
  <LogoutButton v-if="isAuthenticated" />
</template>

<script>
import signingUp from '@/components/signingUp.vue'
import LogoutButton from '@/components/logoutButton.vue'
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'HomeView',
  components: {

    signingUp,
    LogoutButton,
  },
  setup() {
    const store = useStore();

    const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);

    return {
      isAuthenticated
    };
  }
}
</script> -->
