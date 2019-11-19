import React from 'react'
import PropTypes from 'prop-types'
import {Info, Button} from './misc'
import Modal from './Modal'
import {REGX_EMAIL} from '../util/helpers'
import Select from './Select'
import PageButtons from './PageButtons'
import Form from './Form'
import {toDateString} from '../util/datetime'

const PAGE_SIZE = 20
const ROLES = ['instructor', 'admin', 'scan']
const ROLES_INFO = (
  <div className='alert alert-info'>
    <ul>
      <li>{'Users with the "admin" role have full access to all resources within an organization.'}</li>
      <li>{'Users with the "instructor" role may create courses and invite assistants to those courses.'}</li>
      <li>{'Users with the "scan" role may search for courses and upload scanned answer sheets.'}</li>
    </ul>
  </div>
)

/**
 * Add/remove users to an organization
 * TODO encapsulate page cursor stack in <PageButtons> component
 */
export default class UserManager extends React.Component {
  constructor(props) {
    super(props)
    this._pending = null
    this.state = {
      // clone before modifying (i.e. immutable stack)
      pages: [],

      next: null,
      err: null,
      data: null, // [{role, name, email, added}, ...]
      loading: true,
      editing: -1,
      removing: -1,
    }
    this.remove = (evt) => {
      let index = parseInt(evt.currentTarget.getAttribute('data-index'))
      let users = this.state.data.slice(0)
      let email = users[index].email
      users.splice(index, 1)
      this._pending = this.props.onSubmitDrop(email).then(() => {
        this.setState({removing: -1, err: null, data: users})
      }).catch(err => {
        this.setState({removing: -1, err})
      })
      this.setState({removing: index})
    }
    this.add = (user) => {
      return this.props.onSubmitAdd([user]).then(res => {
        let data = this.state.data ? res.users.concat(this.state.data) : res.users
        this.setState({data})
      })
    }
    this.edit = user => {
      let {editing} = this.state
      return this.props.onSubmitUpdate(user).then(user => {
        let data = this.state.data.slice(0)
        data[editing] = {...data[editing], ...user}
        // data.splice(editing, 1, user)
        this.setState({editing: -1, data})
      })
    }
    this.load = (pages, after) => {
      return this.props.onLoad({first: PAGE_SIZE, after}).then(res => {
        this.setState({
          loading: false,
          err: null,
          pages: pages,
          next: res.next,
          data: res.users
        })
      }).catch(err => {
        this.setState({loading: false, err})
      })
    }
    this.loadPage = dir => {
      let {pages, next} = this.state
      if (dir > 0) {
        pages = pages.slice(0)
        pages.push(next)
      }
      else {
        pages = pages.slice(0)
        pages.shift()
        next = pages[0]
      }
      this._pending = this.load(pages, next)
      this.setState({loading: true})
    }
    this.toggleEditor = evt => {
      let index = evt && parseInt(evt.currentTarget.getAttribute('data-index'))
      if (isNaN(index)) return this.setState({editing: -1})
      this.setState({editing: index})
    }
  }
  componentDidMount() {
    this._pending = this.load(this.state.pages)
  }
  componentWillUnmount() {
    if (this._pending) this._pending.cancel()
  }
  renderContent() {
    let {loading, err, removing, data, pages, next} = this.state
    let canRemove = removing === -1
    let rows = data && data.map((user, index) => (
      <tr key={index}>
        <td className='remove'>
          <button type='button'
            onClick={canRemove ? this.remove : undefined}
            data-index={index}>
            {removing === index
              ? <i className='fa fa-lg fa-spin fa-spinner'/>
              : <i className='fa fa-lg fa-user-times'/>}
          </button>
        </td>
        <td>
          <button type='button' className='btn btn-link'
            onClick={this.toggleEditor}
            data-index={index}>
            {user.role}
          </button>
        </td>
        <td className='email'>{user.email}</td>
        <td className='name'>{user.name}</td>
        <td>{toDateString(new Date(user.added))}</td>
      </tr>
    ))
    return (
      <div>
        <div className='table-responsive'>
          <table className='table table-hover table-condensed' summary='User management table'>
            <thead>
              <tr>
                <th></th>
                <th>{'Role'}</th>
                <th>{'Email'}</th>
                <th>{'Name'}</th>
                <th>{'Added'}</th>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
        </div>
        {err && <Info>{err.message}</Info>}
        <PageButtons onChange={this.loadPage} loading={loading} less={pages.length > 0} more={next != null}/>
      </div>
    )
  }
  render() {
    let {onClose} = this.props
    let {editing, data} = this.state
    if (editing !== -1) {
      return <UserEditor {...data[editing]} onClose={this.toggleEditor} onSubmit={this.edit}/>
    }
    return (
      <Modal isOpen className='user-manager -large' onRequestClose={onClose}>
        <h4 className='header' aria-level='2'>{'User Management'}</h4>
        <div className='body'>
          <UserAdder onSubmit={this.add}/>
          {this.renderContent()}
        </div>
        <div className='footer'>
          <div className='btn-group pull-right'>
            <Button label='Close' onClick={onClose}/>
          </div>
          <div style={{clear: 'both'}}/>
        </div>
      </Modal>
    )
  }
}

UserManager.propTypes = {
  // ({filter, first, after}) => Promise
  onLoad: PropTypes.func.isRequired,

  // (users) => Promise({orgId, users})
  onSubmitAdd: PropTypes.func.isRequired,

  // ({email, role}) => Promise(user)
  onSubmitUpdate: PropTypes.func.isRequired,

  // (email) => Promise
  onSubmitDrop: PropTypes.func.isRequired,

  onClose: PropTypes.func.isRequired,
}

class UserEditor extends Form {
  constructor(props) {
    super(props, {
      email: {
        type: 'static',
        label: 'Email',
        defaultValue: props.email
      },
      name: {
        type: 'static',
        label: 'Name',
        defaultValue: props.name
      },
      role: {
        type: 'select',
        label: 'Role',
        defaultValue: props.role,
        extras: {opt: ROLES}
      },
    })
    this.state.loading = false
    this.state.err = null
    this._pending = null
    this.submit = () => {
      let fields = this.validate()
      if (fields) {
        this._pending = this.props.onSubmit(fields).catch(err => {
          this.setState({loading: false, err})
        })
        this.setState({loading: true})
      }
    }
  }
  componentWillUnmount() {
    if (this._pending) this._pending.cancel()
  }
  render() {
    let {onClose} = this.props
    let {err, loading} = this.state
    return (
      <Modal className='-small' isOpen onRequestClose={onClose}>
        <h4 className='header' aria-level='2'>{'Edit User'}</h4>
        <form className='body' onKeyUp={this.keyup} onSubmit={this.preventDefault}>
          {this.renderFormGroups()}
          {err ? <Info>{err.message}</Info> : null}
        </form>
        <div className='footer'>
          <div className='btn-group pull-right'>
            <Button className='btn-default' label='Cancel' onClick={onClose}/>
            <Button className='btn-primary' label='Save' onClick={this.submit} loading={loading}/>
          </div>
          <div className='clearfix'/>
        </div>
      </Modal>
    )
  }
}

class UserAdder extends React.Component {
  constructor(props) {
    super(props)
    this.state = {adding: false, err: null, role: ROLES[0]}
    this._pending = null
    this.change = value => this.setState({role: value})
    this._setInputRef = el => this._inputRef = el
    this.keyboard = (evt) => {
      if (evt.keyCode === 13) this.submit()
    }
    this.submit = () => {
      let role = this.state.role
      let email = this._inputRef.value.toLowerCase().trim()
      if (email.length < 3 || !REGX_EMAIL.test(email)) {
        this.setState({err: new Error('invalid email address')})
        return
      }
      this._pending = this.props.onSubmit({role, email}).then(() => {
        this.setState({adding: false, err: null})
        this._inputRef.value = null
      }).catch(err => {
        this.setState({adding: false, err})
      })
      this.setState({adding: true})
    }
  }
  componentWillUnmount() {
    if (this._pending) this._pending.cancel()
  }
  render() {
    let {err, adding, role} = this.state
    return (
      <div className='user-adder'>
        <div className='input-group'>
          <Select opt={ROLES} value={role} onChange={this.change}/>
          <input type='email'
            className='form-control'
            placeholder='somebody@example.com'
            ref={this._setInputRef}
            onKeyUp={this.keyboard}/>
          <span className='input-group-btn'>
            <Button className='btn-primary' loading={adding} onClick={this.submit} label='Invite User'/>
          </span>
        </div>
        {err && <Info>{err.message}</Info>}
        {ROLES_INFO}
      </div>
    )
  }
}
