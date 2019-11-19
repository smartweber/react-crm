import api from '../api'
import Promise from '../util/promise'

/**
 * Factory for a generic async action.
 * Dispatches the action in two stages, three formats:
 * - {loading: true}
 * - {data: ...} OR {err: ...}
 * @param {string} actionType
 * @param {bool?} safe Multiple in-progress actions are collapsed
 * @param {func} cb Should return a Promise, e.g. an HTTP request
 */
const createAsyncAction = (actionType, safe, cb) => {
  if (typeof safe == 'function') {
    cb = safe
    safe = false
  }
  if (safe) cb = Promise.last(cb)
  return (dispatch) => (...args) => {
    dispatch({type: actionType, loading: true})
    cb(...args).then(data => {
      dispatch({type: actionType, data})
      return null
    }).catch(err => {
      dispatch({type: actionType, err})
    })
  }
}

export const loginWithPW = createAsyncAction('AUTH_STATUS',
  (formData) => api.users.loginWithPW(formData).catch(err => {
    if (err.statusCode === 401) {
      err.message = 'login failed; incorrect username / password'
    }
    throw err
  })
)
export const loadAuthStatus = createAsyncAction('AUTH_STATUS',
  // This action does not have an error state
  () => api.users.me().catch(() => null)
)
export const updateProfile = (dispatch) => (data) => {
  dispatch({type: 'PROFILE_UPDATE', data})
}

export const logout = (dispatch) => () => {
  dispatch({type: 'AUTH_STATUS', loading: true})
  let done = () => {
    dispatch({type: 'AUTH_STATUS', data: null})
    dispatch({type: 'ROUTER', method: 'push', path: '/login'})
    return null
  }
  api.users.logout().then(done, done)
}

export const createOrg = (dispatch) => (org) => {
  dispatch({type: 'ORG_CREATE', data: org})
  dispatch({type: 'ROUTER', method: 'push', path: `/view/${org.id}`})
}

export const gotoCourse = (dispatch) => (course) => {
  dispatch({type: 'ROUTER', method: 'push', path: `/view/${course.orgId}/${course.id}`})
}
export const gotoOrg = (dispatch) => (orgId) => {
  dispatch({type: 'ROUTER', method: 'push', path: `/view/${orgId}`})
}
