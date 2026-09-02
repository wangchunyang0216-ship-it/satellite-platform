const pxToViewport = require('postcss-px-to-viewport')

module.exports = {
  plugins: [
    // 移除 sass 编译产物里的 @charset，避免 "@charset must be the first rule" 告警（原 vite.config.js 内联插件）
    {
      postcssPlugin: 'internal:charset-removal',
      AtRule: {
        charset: (atRule) => {
          if (atRule.name === 'charset') {
            atRule.remove()
          }
        }
      }
    },
    pxToViewport({
      unitToConvert: 'px',
      viewportWidth: 1920,
      unitPrecision: 5,
      propList: ['*', '!border', '!border-width', '!box-shadow'],
      viewportUnit: 'vw',
      fontViewportUnit: 'vw',
      selectorBlackList: [
        '.ignore-px2vw',
        '.el-',
        '.cesium-',
        '.leaflet-',
        '.mapbox-',
        '.nprogress'
      ],
      minPixelValue: 1,
      mediaQuery: false,
      replace: true,
      exclude: [
        /node_modules/i,
        /src[\\/]assets[\\/]styles[\\/](element-ui|btn|mixin|global|index|ruoyi|sidebar|variables|variables\.module)\.scss/i,
        /src[\\/]components[\\/](AjCaptcha|Verifition|Crontab|ImagePreview|ImageUpload|IconSelect|SvgIcon|iFrame)[\\/]/i,
        /src[\\/]layout[\\/]/i,
        /src[\\/]views[\\/](monitor|system|tool|error)[\\/]/i
      ],
      landscape: false
    })
  ]
}
