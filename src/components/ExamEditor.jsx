import React from 'react'
import PropTypes from 'prop-types'
import Modal from './Modal'
import Form from './Form'
import {Info, Button} from './misc'
import ConfirmationModal from './ConfirmationModal'

export default class ExamEditor extends Form {
  constructor(props) {
    super(props, {
      name: {
        required: true,
        minLength: 2,
        maxLength: 255,
        label: 'Name',
        type: 'text',
        defaultValue: props.data.name
      },
      date: {
        required: true,
        label: 'Date',
        type: 'date',
        defaultValue: props.data.date
      },
      autoReleaseGrades: {
        type: 'checkbox',
        label: (
          <span>
            {'Automatically release student scores'}
          </span>
        ),
        defaultValue: props.data.autoReleaseGrades
      }
    })
    this.state.loading = false
    this.state.err = null
    this.state.confirming = false
    this.toggleConfirm = () => {
      this.setState({confirming: !this.state.confirming})
    }
  }

  /** @override */
  submit() {
    let fields = this.validate()
    if (fields) {
      this.setState({loading: true})
      this.props.onSubmit(fields, true)
      .catch(err => {
        this.setState({loading: false, err})
      })
    }
  }

  render() {
    let {ltiLaunchActive, onClose, onDelete} = this.props
    if (ltiLaunchActive) return null
    let {err, loading, confirming} = this.state
    if (confirming) return (
      <ConfirmationModal onClose={this.toggleConfirm} onSubmit={onDelete}>
        <p>
          <strong>{'Are you sure?'}</strong>
          {' You will lose all data associated with this exam, including results and reports.'}
        </p>
      </ConfirmationModal>
    )
    return (
      <Modal ltiLaunchActive={ltiLaunchActive} className='-small' isOpen onRequestClose={onClose}>
        <h4 className='header' aria-level='2'>{'Edit Exam'}</h4>
        <form className='body' onKeyUp={this.keyup} onSubmit={this.preventDefault}>
          {this.renderFormGroups()}
          {err ? <Info>{err.message}</Info> : null}
        </form>
        <div className='footer'>
          <Button className='btn btn-danger' label='Delete Exam' onClick={this.toggleConfirm}/>
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

ExamEditor.propTypes = {
  // The current exam fields
  data: PropTypes.object.isRequired,

  // @param {object} fields
  // @return {Promise}
  onSubmit: PropTypes.func.isRequired,

  onDelete: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
}
