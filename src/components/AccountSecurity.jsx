import React from 'react'
import PropTypes from 'prop-types'
import {Info, Button} from './misc'
import {REGX_EMAIL} from '../util/helpers'

/**
 * @see ProfileManager
 * Use this to change your account email/password
 */
export default class AccountSecurity extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      changePasswd: true,
      saving: false,
      err: null,
    }
    this._pending = null
    this._inputNickname = null
    this._inputName = null
    this.setPasswdInput = el => this._inputPasswd = el
    this.setEmailInput = el => this._inputEmail = el
    this.setPasswdNextInput = el => this._inputPasswdNext = el
    this.setPasswdNextInput2 = el => this._inputPasswdNext2 = el
    this.keyboard = (evt) => {
      if (evt.keyCode === 13) this.submit()
    }
    this.toggle = () => {
      this.setState({err: null, changePasswd: !this.state.changePasswd})
      if (this.state.changePasswd) {
        this._inputPasswd.value = ''
        this._inputPasswdNext = ''
        this._inputPasswdNext2 = ''
      }
      else {
        this._inputPasswd.value = ''
        this._inputEmail.value = ''
      }
    }
    this.submit = () => {
      if (this.state.changePasswd) {
        this.submitPasswd()
      }
      else {
        this.submitEmail()
      }
    }
    this.submitPasswd = () => {
      let passwd = this._inputPasswd.value
      let passwdNext = this._inputPasswdNext.value
      let passwdNext2 = this._inputPasswdNext2.value
      if (passwd.length < 1) {
        this.setState({err: new Error('Your old password is required')})
        return
      }
      if (passwdNext !== passwdNext2) {
        this.setState({err: new Error('Confirmation password does not match')})
        return
      }
      if (passwdNext.length < 8) {
        this.setState({err: new Error('New password must be at least 8 characters')})
        return
      }
      // TODO check entropy
      this._pending = this.props.onSubmitPasswd({passwd, passwdNext})
        .then(() => {
          this._inputPasswd.value = ''
          this._inputPasswdNext.value = ''
          this._inputPasswdNext2.value = ''
          this.setState({saving: false, err: null})
        })
        .catch(err => {
          this.setState({saving: false, err})
        })
      this.setState({saving: true})
    }
    this.submitEmail = () => {
      let passwd = this._inputPasswd.value
      let email = this._inputEmail.value.trim().toLowerCase()
      if (email.length < 5 || !REGX_EMAIL.test(email)) {
        this.setState({err: new Error('Invalid email address')})
        return
      }
      if (passwd.length < 1) {
        this.setState({err: new Error('Your password is required')})
        return
      }
      this._inputEmail.value = email
      this._pending = this.props.onSubmitEmail({passwd, email})
        .then(() => {
          this._inputPasswd.value = ''
          this.setState({saving: false, err: null})
        })
        .catch(err => {
          this.setState({saving: false, err})
        })
      this.setState({saving: true})
    }
  }
  componentWillUnmount() {
    if (this._pending) this._pending.cancel()
  }
  renderEmail({err, email, saving}) {
    return (
      <div className='accountinfo'>
        <h5>{'Security'}</h5>
        <div className='form-group'>
          <label>{'Email'}</label>
          <input key='00' type='text' className='form-control' defaultValue={email} ref={this.setEmailInput} onKeyUp={this.keyboard}/>
        </div>
        <div className='form-group'>
          <label>{'Password'}</label>
          <input type='password' className='form-control' ref={this.setPasswdInput} onKeyUp={this.keyboard}/>
        </div>
        {err && <Info>{err.message}</Info>}
        <Button className='btn-primary' label='Update Email' loading={saving} onClick={this.submit}/>
        <Button className='btn-link btn-sm' label='Change password' onClick={this.toggle}/>
      </div>
    )
  }
  renderPasswd({err, saving}) {
    return (
      <div className='accountinfo'>
        <h5>{'Security'}</h5>
        <div className='form-group'>
          <label>{'Password'}</label>
          <input type='password' className='form-control' ref={this.setPasswdInput} onKeyUp={this.keyboard}/>
        </div>
        <div className='form-group'>
          <label>{'New Password'}</label>
          <input type='password' className='form-control' ref={this.setPasswdNextInput} onKeyUp={this.keyboard}/>
        </div>
        <div className='form-group'>
          <label>{'Confirm New Password'}</label>
          <input type='password' className='form-control' ref={this.setPasswdNextInput2} onKeyUp={this.keyboard}/>
        </div>
        {err && <Info>{err.message}</Info>}
        <Button className='btn-primary' label='Update Password' loading={saving} onClick={this.submit}/>
        {/* <Button className='btn-link btn-sm' label='Change email' onClick={this.toggle}/> */}
      </div>
    )
  }
  render() {
    return this.renderPasswd(this.state)
    // return this.state.changePasswd
    //   ? this.renderPasswd(this.state)
    //   : this.renderEmail({...this.state, email: this.props.user.email})
  }
}
AccountSecurity.propTypes = {
  user: PropTypes.object.isRequired,

  // ({passwd, email}) => Promise
  onSubmitEmail: PropTypes.func.isRequired,

  // ({passwd, passwdNext}) => Promise
  onSubmitPasswd: PropTypes.func.isRequired,
}
