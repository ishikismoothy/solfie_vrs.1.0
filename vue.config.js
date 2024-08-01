const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  chainWebpack: config => {
    config.plugin('define').tap(args => {
      if (args[0].__VUE_OPTIONS_API__ === undefined) {
        args[0].__VUE_OPTIONS_API__ = true;
      }
      if (args[0].__VUE_PROD_DEVTOOLS__ === undefined) {
        args[0].__VUE_PROD_DEVTOOLS__ = false;
      }
      if (args[0].__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ === undefined) {
        args[0].__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;
      }
      return args;
    })
  }
})