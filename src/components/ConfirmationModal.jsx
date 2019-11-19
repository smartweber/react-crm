import React from 'react'
import PropTypes from 'prop-types'
import Modal from './Modal'
import {Info, Button} from './misc'

/**
 * Use this to confirm dangerous actions, like deleting a course or exam.
 * props.onSubmit() must return a Promise. If rejected, the error message is displayed.
 * If resolved, it's up to you to hide the modal.
 * props.children will be rendered in the modal body
 */
export default class ConfirmationModal extends React.Component {
  constructor(props) {
    super(props)
    this.state = {loading: false, err: null}
    this.submit = this.submit.bind(this)
    this._pending = null
  }
  componentWillUnmount() {
    if (this._pending) this._pending.cancel()
  }
  submit() {
    if (this._pending) this._pending.cancel()
    this._pending = this.props.onSubmit().catch(err => {
      this.setState({loading: false, err})
    })
    this.setState({loading: true})
  }
  render() {
    let {err, loading} = this.state
    let {children, onClose} = this.props
    return (
      <Modal className='-confirm' isOpen onRequestClose={onClose}>
        <div className='body'>
          {children}
          {err ? <Info>{err.message}</Info> : null}
        </div>
        <div className='footer'>
          <div className='btn-group'>
            <Button label='Cancel' onClick={onClose}/>
            <Button className='btn-danger' label='Confirm' loading={loading} onClick={this.submit}/>
          </div>
        </div>
      </Modal>
    )
  }
}

ConfirmationModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
}
