<template>
    <Transition name="fade">
      <div v-if="modelValue" class="loading-screen">
        <div class="content">
          <h1 class="title">Solfie</h1>
          <p class="preparing">
          Solfieがマインドスペースを準備中
          <span class="dots">
            <span></span>
            <span></span>
            <span></span>
          </span>
          </p>
          
          <div class="tips-section">
            <h2 class="tips-title">Tips</h2>
            <p class="tips-text">
              {{ currentTip }}
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </template>
  
  <script>
  export default {
    name: 'LoadingScreen',
    props: {
      modelValue: {
        type: Boolean,
        required: true
      }
    },
    data() {
      return {
        tips: [
          'Solfieは、よりよい人生の選択に気づくために、「日々意識したいこと」の整理と振り返りをサポートします。',
          '毎日の小さな意識づけが、より良い未来への一歩となります。',
          '自分の素直な想いの理解を深めることで、より確かな判断ができるようになります。',
          'マインドスペースで頭を整理することで、意思決定が明確になります。',
          '日々のマインドスペースの振り返りは、よりよい人生の選択への近道です。',
          '意識したいことがあれば、マインドスペースに記録しましょう。',
          '定期的な振り返りで、新しい発見があるかもしれません。',
          '意識の整理は、より良い決断につながります。'
        ],
        currentTip: ''
      }
    },
    created() {
      this.setRandomTip()
    },
    methods: {
      setRandomTip() {
        const randomIndex = Math.floor(Math.random() * this.tips.length)
        this.currentTip = this.tips[randomIndex]
      }
    },
    watch: {
      modelValue(newValue) {
        if (newValue) {
          this.setRandomTip()
        }
      }
    }
  }
  </script>
  



  tips: [
          'Solfieは、よりよい人生の選択に気づくために、「日々意識したいこと」の整理と振り返りをサポートします。',
          '毎日の小さな意識づけが、より良い未来への一歩となります。',
          '自分の素直な想いの理解を深めることで、より確かな判断ができるようになります。',
          'マインドスペースで頭を整理することで、意思決定が明確になります。',
          '日々のマインドスペースの振り返りは、よりよい人生の選択への近道です。',
          '意識したいことがあれば、マインドスペースに記録しましょう。',
          '定期的な振り返りで、新しい発見があるかもしれません。',
          '意識の整理は、より良い決断につながります。'
        ],