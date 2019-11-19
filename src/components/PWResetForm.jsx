import React from 'react'
import Form from './Form'
import {Info, Button} from './misc'
import api from '../api'

/**
 */
export default class PWResetForm extends Form {
  constructor(props) {
    super(props, {
      email: {
        type: 'email',
        label: "Enter your email address and we'll send you a link to reset your password",
        required: true
      }
    })
    this.state.err = null
    this.state.loading = false
    this.state.finished = false
    this.submit = this.submit.bind(this)
  }
  submit(evt) {
    let formData = this.validate()
    if (formData) {
      this.setState({err: null, loading: true, finished: false})
      api.users.resetPW(formData).then(
        () => this.setState({err: null, loading: false, finished: true})
      ).catch(
        (err) => this.setState({err: err, loading: false, finished: false})
      )
    }
    evt.preventDefault()
  }
  render() {
    let {err, loading, finished} = this.state
    if (finished) return (
      <form className='form-container'>
        <img className='logo' src='/static/logo.png' alt='home a logo' aria-label='home a logo'/>
        <p className='complete'>
          {'Email sent! Check your inbox to complete the process.'}
          <i aria-hidden='true' className='fa fa-envelope-o'/>
        </p>
      </form>
    )
    return (
      <form className='form-container' onSubmit={this.submit}>
        <img className='logo' src='/static/logo.png' alt='home a logo' aria-label='home a logo'/>
        {err ? 
        <Info>
          <div className='text-center'>
            {'Sorry, we could not find an account with that email address, please try again.'}
          </div>
        </Info> : 
        null}
        <div className='box'>
          {this.renderFormGroups()}
          <Button className='btn-primary' onClick={this.submit} loading={loading}
            label='Send'/>
        </div>
      </form>
    )
  }
}

PWResetForm.propTypes = null
