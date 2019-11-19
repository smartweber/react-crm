const WEBROOT = './dist'
const serveStatic = require('connect-gzip-static')(WEBROOT)
const parseURL = require('url').parse
const extname = require('path').extname

/**
 * This is just for testing production builds locally
 * $ npm run prod
 * $ node src/server.js
 */
require('http').createServer()
.on('request', function (req, res) {
  if (!extname(parseURL(req.url).pathname)) {
    req.url = '/'
  }
  serveStatic(req, res, () => {
    res.statusCode = 404
    res.end('Not found')
  })
})
.on('listening', function () {
  console.log(`Serving ${WEBROOT} on http://localhost:${this.address().port}`)
})
.listen()
