import React from 'react'
import PropTypes from 'prop-types'
import Modal from './Modal'
import Form from './Form'
import {Info, Button} from './misc'

/**
 * This form is used to add an Exam to a Course
 */
export default class ExamCreator extends Form {
  constructor(props) {
    super(props, {
      name: {
        required: true,
        minLength: 2,
        maxLength: 255,
        label: 'Name',
        type: 'text',
        extras: {
          placeholder: 'e.g. Quiz 1'
        }
      },
      date: {
        required: true,
        label: 'Date',
        type: 'date',
        defaultValue: new Date().toISOString().substring(0, 10)
      },
      autoReleaseGrades: {
        type: 'checkbox',
        label: (
          <span>
            {'Automatically release student scores'}
          </span>
        ),
        defaultValue: true
      }
    })
    this.state.loading = false
    this.state.releaseScore = true
    this.state.err = null
    this.changeReleaseScore = this.changeReleaseScore.bind(this)
  }
  submit() {
    let fields = this.validate()
    console.log(fields)
    if (fields) {
      this.setState({loading: true})
      this.props.onSubmit(fields)
      .catch(err => {
        this.setState({loading: false, err})
      })
    }
  }
  changeReleaseScore(evt) {
    this.setState({
      releaseScore : evt.target.checked
    })
  }
  render() {
    let {onClose} = this.props
    let {err, loading, releaseScore} = this.state
    return (
      <Modal className='-small' isOpen onRequestClose={onClose}>
        <h4 className='header' aria-level='2'>{'Add an exam or quiz'}</h4>
        <form className='body' onKeyUp={this.keyup} onSubmit={this.preventDefault}>
          {this.renderFormGroups()}
          <p>{"After creating the exam, you'll be able to set an answer key and download blank sheets. Depending on the size of your class, it can take a few minutes for the sheets to become available."}</p>
          {err ? <Info>{err.message + '; make sure you have uploaded a student roster'}</Info> : null}
        </form>
        <div className='footer'>
          <div className='btn-group pull-right'>
            <Button className='btn-default' label='Cancel' onClick={onClose}/>
            <Button className='btn-primary' label='Create' onClick={this.submit} loading={loading}/>
          </div>
          <div className='clearfix'/>
        </div>
      </Modal>
    )
  }
}

ExamCreator.propTypes = {
  // Invoked when the modal should be closed
  onClose: PropTypes.func,

  // @param {object} formFields
  // @return {Promise}
  onSubmit: PropTypes.func.isRequired,
}
