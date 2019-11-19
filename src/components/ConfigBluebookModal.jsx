import React from 'react'
import PropTypes from 'prop-types'
import Modal from './Modal'
import Button from './Button'
const MAX_QUESTIONS = 100
const INITIAL_STATE = {
  err: null,
  start: 1,
  total: 1,
  sizes: [0]
}

/**
 * Configure the size and number of "bluebook" (open response) type questions for an exam
 */
export default class ConfigBluebookModal extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = INITIAL_STATE
    this.clickSizeToggle = this.clickSizeToggle.bind(this)
    this.submit = this.submit.bind(this)
    this.reset = this.reset.bind(this)
    this.validateStart = this.validateStart.bind(this)
    this.validateTotal = this.validateTotal.bind(this)
  }
  submit() {
    let {total, sizes, start, err} = this.state
    if (err) return
    for (let index = 0; index < total; index++) {
      let cur = sizes[index]
      if (cur !== 1 && cur !== 2 && cur !== 3) {
        this.setState({err: 'select a size for each question'})
        return
      }
    }
    this.props.onSubmit({start, questions: sizes.map(value => ({value, maxPoints: 3}))})
  }
  reset() {
    this.setState(INITIAL_STATE)
  }
  validateStart(evt) {
    this.setState({
      start: constrainNumber(parseInt(evt.target.value), this.state.start, 1, MAX_QUESTIONS)
    })
  }
  validateTotal(evt) {
    let value = constrainNumber(parseInt(evt.target.value), this.state.total, 1, MAX_QUESTIONS)
    this.setState({
      total: value,
      sizes: resizeArray(0, this.state.sizes, value)
    })
  }
  clickSizeToggle(evt) {
    let [index, value] = evt.currentTarget.getAttribute('data-value').split(',')
    let sizes = this.state.sizes.slice(0) // clone, since this is a PureComponent
    sizes[index] = parseInt(value)
    this.setState({
      err: null,
      sizes: sizes
    })
  }
  renderSizeToggle(selectedSize, index) {
    return (
      <div className='form-group' key={index}>
        <label className='label-margin'>{index + this.state.start}</label>
        <div className='btn-group' role='group'>
          <button type='button' className='btn btn-default'
            aria-pressed={selectedSize === 1}
            title='full page'
            data-value={index + ',' + 1}
            onClick={this.clickSizeToggle}
            ><i aria-hidden={true} className='fa fa-square'/>
          </button>
          <button type='button' className='btn btn-default'
            aria-pressed={selectedSize === 2}
            title='half page'
            data-value={index + ',' + 2}
            onClick={this.clickSizeToggle}
            ><i aria-hidden={true} className='fa fa-pause fa-rotate-90'/>
          </button>
          <button type='button' className='btn btn-default'
            aria-pressed={selectedSize === 3}
            title='1/3 page'
            data-value={index + ',' + 3}
            onClick={this.clickSizeToggle}
            ><i aria-hidden={true} className='fa fa-bars'/>
          </button>
        </div>
      </div>
    )
  }
  render() {
    let toggles = this.state.sizes.map(this.renderSizeToggle, this)
    return (
      <Modal className='-small' isOpen={this.props.open} onRequestClose={this.props.onClose}>
        <h4 className='header' aria-level='2'>{'Bluebook Questions'}</h4>
        <form className='body'>
          <div className='form-group'>
            <label>{'Begins at question #'}</label>
            <input type='number' className='form-control'
              value={this.state.start}
              onChange={this.validateStart}
            />
          </div>
          <div className='form-group'>
            <label>{'Number of open response questions'}</label>
            <input type='number' className='form-control'
              value={this.state.total}
              onChange={this.validateTotal}
            />
          </div>
          {toggles}
          <div className='form-group has-error'>
            <span className='help-block'>{this.state.err}</span>
          </div>
        </form>
        <div className='footer'>
          <div className='btn-group pull-right'>
            <Button className='btn-default' label='Cancel' onClick={this.props.onClose}/>
            <Button className='btn-info' label='Reset' onClick={this.reset}/>
            <Button className='btn-primary' label='Create' onClick={this.submit}/>
          </div>
          <div className='clearfix'/>
        </div>
      </Modal>
    )
  }
}

ConfigBluebookModal.propTypes = {
  // True if the modal should be visible
  open: PropTypes.bool,

  // Invoked when the modal should be closed
  onClose: PropTypes.func,

  /**
   * @param {object} formData
   */
  onSubmit: PropTypes.func.isRequired,
}

function resizeArray(fillValue, arr, size) {
  if (size !== arr.length) {
    let tmp = new Array(size)
    for (let index = 0; index < size; index++) {
      tmp[index] = arr[index] || fillValue
    }
    return tmp
  }
  return arr
}

function constrainNumber(value, prev, min, max) {
  if (value < min) return min
  if (value > max) return max
  if (isNaN(value)) return prev
  return value
}
