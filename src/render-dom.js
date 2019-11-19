import React from 'react'
import {render} from 'react-dom'
import {Provider} from 'react-redux'
import App from './components/App'
import {initStore} from './model'
import Router from 'react-router/Router'
import createBrowserHistory from 'history/createBrowserHistory'

const hist = createBrowserHistory()
const content =
  React.createElement(Router, {history: hist},
    React.createElement(Provider, {store: initStore(hist)},
      React.createElement(App)))
render(content, document.getElementById('app'))

import px from './util/px'
if (window.performance) {
  window.addEventListener('load', () => {
    let perf = window.performance.timing
    px('pageloads', {
      complete: perf.domComplete - perf.requestStart,
    })
  })
}
