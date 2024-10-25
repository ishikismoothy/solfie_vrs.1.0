<template>

  <router-view/>

  <!-- uncomment the following lines to use the FirestoreTest component -->

  <!-- <div id="app">
    <FirestoreTest />
  </div> -->

</template>

<style lang="scss">

@import './assets/dockStyle.scss';

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>

<script>
// uncomment the following lines to use the FirestoreTest component

// import FirestoreTest from './components/firestoreTest.vue'; // Adjust path if needed

// export default {
//   name: 'App',
//   components: {
//     FirestoreTest
//   }
// }
</script>
