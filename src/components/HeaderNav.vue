<!-- Header.vue -->
<template>
  <header class="header-container">
    <div class="left-section">
      <div class="globe-icon">
        <button class="icon-button">
         <img src="../assets/icons/utility/globeIcon.svg" alt="globe" />
        </button>
      </div>
      <span class="app-name">mindspace 1</span>
    </div>
    <div class="center-section">
      <h1 class="page-title">自分が満たされる働き方</h1>
    </div>
    <div class="right-section">
      <button class="icon-button">
        <img src="../assets/icons/utility/eyeIcon.svg" alt="view" />
      </button>
      <button class="icon-button">
        <img src="../assets/icons/utility/shareIcon.svg" alt="share" />
      </button>
      <button class="icon-button">
        <img src="../assets/icons/utility/moreIcon.svg" alt="more options" />
      </button>
    </div>
  </header>
</template>

<script>

export default {
  name: 'HeaderNav'
}

</script>

<style scoped>
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  
}

.left-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.globe-icon img {
  width: 20px;
  height: 20px;
}

.app-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.center-section {
  flex: 1;
  text-align: center;
}

.page-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.right-section {
  display: flex;
  gap: 16px;
}

.icon-button {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-button img {
  width: 20px;
  height: 20px;
}

.icon-button:hover {
  opacity: 0.8;
}
</style>