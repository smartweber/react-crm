import React from 'react'
import PropTypes from 'prop-types'
import URLSearchParams from 'url-search-params' // Polyfill
import Form from './Form'
import {Link} from 'react-router-dom'
import {Info} from './misc'
const API_ORIGIN = process.env.API_ORIGIN

export default class LoginForm extends Form {
  constructor(props) {
    super(props, {
      email: {
        type: 'email',
        label: 'Email',
        required: true,
      },
      passwd: {
        type: 'password',
        label: 'Password',
        minLength: 8,
        maxLength: 64,
        required: true,
      }
    })
    this.submit = this.submit.bind(this)
  }
  submit(evt) {
    if (!this.validate()) {
      evt.preventDefault()
    }
  }
  renderMain() {
    return (
      <div className='box'>
        {this.renderFormGroups()}
        <button type='submit' className='btn btn-primary'>{'Login'}</button>
        <Link to='/pwreset'>{'Reset password'}</Link>
      </div>
    )
  }
  renderSub() {
    return (
      <div className='box'>
        {"Don't have an account? "}
        <Link to='/signup'>{'Signup here.'}</Link>
      </div>
    )
  }
  render() {
    let {err, loading} = this.props
    let url = API_ORIGIN + '/auth/passwd'
    let queryError = new URLSearchParams(typeof window != 'undefined' && window.location.search).get('err')
    if (err == null && queryError) {
      err = new Error(queryError)
    }
    return (
      <form method='POST' action={url} className='form-container login-form' onSubmit={this.submit}>
        <img className='logo' src='/static/logo.png' alt='home logo' aria-label='home logo'/>
        {err && !loading ? 
        <Info>
          {'Sorry, we could not find an account with that email address and password, please try again or we can help you '}
          <Link className='reset-link' to='/pwreset'>{'recover your password.'}</Link>
        </Info> : 
        null}
        {loading ? <div className='loader'><i className='fa fa-2x fa-spin fa-spinner'/></div> : null}
        {loading ? null : this.renderMain()}
        {loading ? null : this.renderSub()}
        <input type='hidden' name='referer' value={typeof window != 'undefined' && window.location.href}/>
      </form>
    )
  }
}

LoginForm.propTypes = {
  ...Form.propTypes,
  loading: PropTypes.bool,
  err: PropTypes.object,
}
