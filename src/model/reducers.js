import update from '../util/update'
const INITIAL_STATE = {
  auth: {loading: true, err: null, data: null},
}

export default INITIAL_STATE

/**
 * Factory for a generic reducer of an async actions
 * Whether or not this factory is used, all async actions should have 3 props:
 * - loading (bool), the operation is in progress
 * - err (Error | null), the operation failed
 * - data (object | array | null), the return value of a successful operation
 * @see createAsyncAction()
 * @param {string} key Which slice of the store to update
 * @param {func?} cb
 */
const createAsyncReducer = (key, cb) => (state, props) => {
  let data = state[key].data
  return update(state, {
    [key]: {$set: {
      loading: props.loading || false,
      err: props.loading ? state[key].err : (props.err || null),
      data: cb ? cb(state, props, data) : props.loading ? data : (props.data || null)
    }}
  })
}

/**
 * Assuming there is a ITEMS_LIST action and a ITEMS_CREATE action,
 * use this to create the reducer for ITEMS_CREATE.
 * This will update state[formKey] with loading/error status
 * and will update state[listKey].data with the new item.
 */
const createAsyncListReducer = (formKey, listKey) => (state, props) => {
  if (props.loading) return update(state, {
    [formKey]: {$set: {
      loading: true,
      err: state[formKey].err
    }}
  })
  else if (props.err) return update(state, {
    [formKey]: {$set: {
      loading: false,
      err: props.err
    }}
  })
  return update(state, {
    [formKey]: {$set: INITIAL_STATE[formKey]},
    [listKey]: {data: {$push: [props.data]}}
  })
}

export const RESET = () => INITIAL_STATE

export const AUTH_STATUS = createAsyncReducer('auth')

export const PROFILE_UPDATE = (state, props) => {
  return update(state, {
    auth: {data: {$merge: props.data}}
  })
}

export const ORG_CREATE = (state, props) => update(state, {
  auth: {data: {organizations: {
    // 2017-01-06 fix missing role on org creation
    $push: [Object.assign({role: 'admin'}, props.data)]
  }}}
})
