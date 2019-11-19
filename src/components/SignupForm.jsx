import React from 'react'
import Form from './Form'
import {Info, Button} from './misc'
import api from '../api'

export default class SignupForm extends Form {
  constructor(props) {
    super(props, {
      name: {type: 'text', label: 'Full name', required: true, maxLength: 255},
      nickname: {type: 'text', label: 'Nickname (optional)', maxLength: 255},
      email: {type: 'email', label: 'Email', required: true},
      terms: {
        type: 'checkbox',
        label: (
          <span>
            {'I agree to '}
            <a rel='noopener noreferrer' target='_blank'
              href='http://a.com/terms-and-conditions'>{'terms and conditions'}</a>
          </span>
        )
      },
    })
    this.state.err = null
    this.state.loading = false
    this.state.finished = false
    this.submit = this.submit.bind(this)
  }
  submit() {
    let formData = this.validate()
    if (formData && !formData.terms) {
      this.setState({err: new Error('You must accept the terms & conditions')})
      return
    }
    if (formData) {
      this.setState({err: null, loading: true, finished: false})
      api.users.register(formData).then(
        () => this.setState({err: null, loading: false, finished: true})
      ).catch((err) => {
        if (err.statusCode === 409) {
          err.message = 'account already exists; did you forget your password?'
        }
        this.setState({err: err, loading: false, finished: false})
      })
    }
  }
  render() {
    let {err, loading, finished} = this.state
    if (finished) return (
      <form className='form-container'>
        <img className='logo' src='/static/logo.png' alt='home a logo' aria-label='home a logo'/>
        <p className='complete'>
          {'Verification email sent! Check your inbox to complete the signup process.'}
          <i aria-hidden='true' className='fa fa-envelope-o'/>
        </p>
      </form>
    )
    return (
      <form className='form-container'>
        <img className='logo' src='/static/logo.png' alt='home a logo' aria-label='home a logo'/>
        {err ? <Info>{err.message}</Info> : null}
        <div className='box'>
          {this.renderFormGroups()}
          <p>{"You'll need to verify control of your email address before setting a password and gaining access to any exams."}</p>
          <Button className='btn-primary' onClick={this.submit} loading={loading}
            label='Send email verification link'/>
        </div>
      </form>
    )
  }
}

SignupForm.propTypes = null
