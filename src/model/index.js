import {property as toGetter, mapValues} from 'lodash'
import {createStore, applyMiddleware} from 'redux'
import {connect} from 'react-redux'
import {createStructuredSelector} from 'reselect'
import stdlog from '../util/log'
import INITIAL_STATE, * as reducers from './reducers'
import * as actions from '../actions'

const hasOwn = Object.hasOwnProperty

const routerMiddleware = (history) => (/*store*/) => (next) => (action) => {
  if (action.type === 'ROUTER')
    return history[action.method](action.path)
  return next(action)
}

// let boundActions = null

function initStore(history) {
  let store = createStore(rootReducer, applyMiddleware(
    routerMiddleware(history)
  ))

  // Creating this list of pre-bound function can save a lot of gc churn
  // boundActions = mapValues(actions, bind => bind(store.dispatch))

  return store
}

/**
 * Global store reducer
 * @see http://rackt.org/redux/docs/api/Store.html
 * @param {object} state See initial state
 * @param {object} action See action creators
 * @return {object} The new state
 */
function rootReducer(state, action) {
  if (!state) return INITIAL_STATE
  if (hasOwn.call(reducers, action.type)) {
    stdlog.debug(action, 'ACTION')
    return reducers[action.type](state, action)
  }
  else {
    stdlog.warn(`unhandled action "${action.type}"`)
    return state
  }
}

/**
 * Populate a Component's props from a slice of the data store
 * @example connectWith(WrappedComponent, {
 *     // this.props.widgets === store.getState().products.gadgets.widgets
 *     widgets: 'products.gadgets.widgets'
 *   }, {
 *     // this.props.onClick === actions.refreshList(store.dispatch)
 *     onClick: 'refreshList'
 *   })
 * @param {React.Component} base
 * @param {object?} stateMap propName: 'path.to.value' | fn(state, props)
 * @param {object?} actionMap propName: 'actionName'
 * @return {React.Component}
 */
function connectWith(base, stateMap, actionMap) {
  const mapStateToProps = stateMap && createStructuredSelector(mapValues(stateMap, src => {
    if (typeof src === 'string') return toGetter(src)
    return src
  }))

  // Memoized dispatchers
  // var dispatchers, mapDispatchToProps
  // if (actionMap) {
  //   dispatchers = mapValues(actionMap, name => boundActions[name])
  //   mapDispatchToProps = () => dispatchers
  // }

  // Dynamic dispatchers
  const mapDispatchToProps = (dispatch) => mapValues(actionMap, (name) => actions[name](dispatch))

  return connect(mapStateToProps, mapDispatchToProps)(base)
}

export {initStore, connectWith}
