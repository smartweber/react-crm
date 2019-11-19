import React from 'react'
import {Redirect} from 'react-router-dom'
import Form from './Form'
import {Info, Button} from './misc'
import api from '../api'

export default class PWChangeForm extends Form {
  constructor(props) {
    super(props, {
      pass: {
        type: 'password',
        label: 'New password',
        minLength: 8,
        required: true
      },
      pass2: {
        type: 'password',
        label: 'Confirm new password',
        required: true
      }
    })
    this.state.err = null
    this.state.continued = false
    this.state.loading = false
    this.state.finished = false
    this.submit = this.submit.bind(this)
    this.logout = this.logout.bind(this)
  }
  logout() {
    let done = () => {
      this.setState({err: null, loading: false, continued: true})
    }
    api.users.logout().then(done, done)
    this.setState({loading: true})
  }
  submit(evt) {
    evt.preventDefault()
    let formData = this.validate()
    if (formData) {
      if (formData.pass !== formData.pass2) {
        this.setFormError('pass2', 'password does not match')
        return
      }
      this.setState({err: null, loading: true, finished: false})
      api.users.verify({
        token: this.props.token,
        pass: formData.pass
      }).then(
        () => this.setState({err: null, loading: false, finished: true})
      ).catch(
        (err) => this.setState({err: err, loading: false, finished: false})
      )
    }
  }
  render() {
    let {err, loading, finished, continued} = this.state
    if (finished) return <Redirect to='/'/>
    if (this.props.auth.loading) return (
      <form className='form-container'>
        <img className='logo' src='/static/logo.png' alt='home a logo' aria-label='home a logo'/>
        <div className='loader'><i className='fa fa-2x fa-spin fa-spinner'/></div>
      </form>
    )
    if (this.props.auth.data && !continued) return (
      <form className='form-container'>
        <img className='logo' src='/static/logo.png' alt='home a logo' aria-label='home a logo'/>
        {err ? <Info>{err.message}</Info> : null}
        <div className='box'>
          <p>{'You must log out before continuing.'}</p>
          <Button className='btn-primary' loading={loading}
            onClick={this.logout}
            label='Log out'/>
        </div>
      </form>
    )
    return (
      <form className='form-container' onSubmit={this.submit}>
        <img className='logo' src='/static/logo.png' alt='home a logo' aria-label='home a logo'/>
        {err ? <Info>{err.message}</Info> : null}
        <div className='box'>
          {this.renderFormGroups()}
          <Button className='btn-primary' loading={loading}
            type='submit'
            label='Update password'/>
        </div>
      </form>
    )
  }
}

PWChangeForm.propTypes = null
