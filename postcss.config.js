/**
 * PostCSS конфігурація
 * Автоматична обробка CSS з autoprefixer
 */

module.exports = {
  plugins: [
    require('autoprefixer')({
      overrideBrowserslist: [
        'last 2 versions',
        '> 1%',
        'not dead',
        'not ie 11'
      ],
      grid: 'autoplace',
      flexbox: 'no-2009'
    }),
    require('cssnano')({
      preset: ['default', {
        discardComments: {
          removeAll: true
        },
        normalizeWhitespace: false
      }]
    })
  ]
};