import React from 'react'
import {renderToStaticMarkup as render} from 'react-dom/server'
import {Provider} from 'react-redux'
import Router from 'react-router/StaticRouter'
import {initStore} from './model'
import App from './components/App'
import {URL} from 'url'
const API_ORIGIN = new URL(process.env.API_ORIGIN).origin

const app = render(
  React.createElement(Router, {location: '/login', context: {}},
    React.createElement(Provider, {store: initStore()},
      React.createElement(App)
    )
  )
)

// Can't set the Content-Security-Policy header through cloudfront
/* eslint quotes: off */
const CSP = [
  "default-src 'self'",
  `connect-src 'self' https://api.stripe.com https://a.instructure.com ${API_ORIGIN}`,
  "frame-src https://js.stripe.com https://a.instructure.com",
  "script-src 'self' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src *",
  "font-src 'self' data:"
].join('; ')

process.stdout.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta http-equiv="Content-Security-Policy" content="${CSP}">
    <meta name="viewport" content="initial-scale=1, user-scalable=no"/>
    <link rel="stylesheet" href="/index.css"/>
    <script defer src="/index.js"></script>
    <title>a</title>
  </head>
  <body>
    <div id="app">${app}</div>
  </body>
</html>
`)
