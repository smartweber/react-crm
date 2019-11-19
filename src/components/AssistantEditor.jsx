import React from 'react'
import PropTypes from 'prop-types'
import {Info, Button} from './misc'
import Modal from './Modal'
import {REGX_EMAIL} from '../util/helpers'

/**
 * Add/remove assistants or co-instructors to a course
 */
export default class AssistantEditor extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      err: null,
      data: null,
      removing: -1,
      adding: false
    }
    this.pending = null
    this.remove = (evt) => {
      let index = parseInt(evt.currentTarget.getAttribute('data-index'))
      let aides = this.props.data.slice(0)
      aides.splice(index, 1)
      this.pending = this.props.onSubmit({aides}).then(() => {
        this.setState({removing: -1, err: null})
      }).catch(err => {
        this.setState({removing: -1, err})
      })
      this.setState({removing: index})
    }
    this.add = () => {
      let aides = this.props.data || []
      let email = this.inputRef.value.toLowerCase().trim()
      if (!email) {
        return
      }
      if (!REGX_EMAIL.test(email)) {
        this.setState({err: new Error('Invalid email address')})
        return
      }
      if (aides.indexOf(email) !== -1) {
        this.setState({err: new Error('Already invited')})
        return
      }
      aides = [...aides, email]
      this.pending = this.props.onSubmit({aides}).then(() => {
        this.inputRef.value = ''
        this.setState({adding: false, err: null})
      }).catch(err => {
        this.setState({adding: false, err})
      })
      this.setState({adding: true})
    }
    this.setInputRef = el => this.inputRef = el
    this.keyboard = (evt) => {
      if (evt.keyCode === 13) this.add()
    }
  }
  componentWillUnmount() {
    if (this.pending) this.pending.cancel()
  }
  renderContent(emails) {
    emails = emails || []
    let {removing, adding} = this.state
    let canRemove = removing === -1
    let items = emails.map((email, index) => (
      <div className='line' key={index}>
        <button type='button' className='remove' onClick={canRemove && this.remove} data-index={index}>
          {removing === index
            ? <i className='fa fa-lg fa-spin fa-spinner'/>
            : <i className='fa fa-lg fa-times'/>}
        </button>
        <span className='email'>{email}</span>
      </div>
    ))
    return (
      <div className='assistants'>
        {items}
        <div className='input-group'>
          <input type='email'
            className='form-control'
            placeholder='somebody@example.com'
            ref={this.setInputRef}
            onKeyUp={this.keyboard}/>
          <span className='input-group-btn'>
            <Button className='btn-primary' loading={adding} disabled={!canRemove} onClick={this.add} label='Invite Assistant'/>
          </span>
        </div>
      </div>
    )
  }
  render() {
    let {onClose, data} = this.props
    let {err} = this.state
    return (
      <Modal isOpen className='assistant-editor' onRequestClose={onClose}>
        <h4 className='header' aria-level='2'>{'Class Assistants'}</h4>
        <div className='body'>
          {this.renderContent(data)}
          <div className='alert alert-info'>
            <i className='fa fa-lg fa-info-circle'/>
            {' Assistants have nearly full access to this course (except for deleting the course, or adding other assistants) including: Manage Students, Create & Edit exams/answer keys, Verify Marks, Manage Duplicates, Apply Corrections, Analyze Results, and Release Grades.'}
          </div>
          {err && <Info>{err.message}</Info>}
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

AssistantEditor.propTypes = {
  // ['person@example.com', 'somebody@somewhere.com']
  data: PropTypes.arrayOf(PropTypes.string),

  // onSubmit({aides}) => Promise
  onSubmit: PropTypes.func.isRequired,

  onClose: PropTypes.func.isRequired,
}
