import React from 'react'
import {render} from 'react-dom'
import App from './components/APISpec'

let content = React.createElement(App, {
  api: window.RAML_JSON
})
render(content, document.getElementById('app'))
