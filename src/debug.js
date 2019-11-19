/**
 * This module is only included in development builds
 * - expose utility modules
 * - enable advanced source-map support
 * - hot swap css
 */
window.stdlog = require('./util/log')
window.util = require('./util/helpers')
window.Bluebird = require('./util/promise')
window.request = require('./api/request').default
window.api = require('./api').default
window.connect = require('rum').connect
window.disconnect = require('rum').disconnect

require('source-map-support').install()

require('rum').on('reload', function (files) {
  for (let index = 0; index < files.length; ++index) {
    if (!/\.(?:scss|css)$/.test(files[index])) return location.reload(true)
  }
  reloadCSS('/index.css')
})

function reloadCSS(href) {
  let links = document.getElementsByTagName('link')
  let index = links.length
  let cur = null
  while (cur = links[--index]) {
    if (cur.getAttribute('href') === href) {
      cur.href = ''
      cur.href = href
      console.warn(`"${href}" reloaded`)
      break
    }
  }
}
