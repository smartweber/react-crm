import React from 'react'
import {renderToString as render} from 'react-dom/server'
import Parser from './raml-parser'
import App from './components/APISpec'
const api = Parser.parse('./doc/api.yml')
const content = render(React.createElement(App, {api}, null))

process.stdout.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="initial-scale=1, user-scalable=no"/>
    <link rel="stylesheet" href="spec.css"/>
    <script>window.RAML_JSON = ${JSON.stringify(api)}</script>
    <script defer src="spec.js"></script>
    <title>${api.title}</title>
  </head>
  <body>
    <div id="app">${content}</div>
  </body>
</html>
`)
