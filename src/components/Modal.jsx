import React from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import cx from 'classnames/dedupe'
import cn from 'classnames'
import {findFocusable} from '../util/helpers'
const REACT_APP_CONTAINER_SELECTOR = '#app'

/**
 * Create a floating modal box in the center of the screen.
 * - Useful when content can't easily be inlined
 * @example
 *   <Modal>
 *     <div className='header'>
 *       <h4>Hello, Modals!</h4>
 *     </div>
 *     <div className='body'>
 *       ...
 *     </div>
 *     <div className='footer'>
 *       ..
 *     </div>
 *   </Modal>
 */
export default class Modal extends React.Component {
  constructor(props) {
    super(props)
    this.state = {portal: null}
    this._content = null
    this.reactAppContainer = typeof window === 'undefined'
      ? true // not running in a browser
      : document.querySelector(REACT_APP_CONTAINER_SELECTOR)
    if (!this.reactAppContainer) {
      throw new Error('reactAppContainer not found; did the selector change?')
    }
    this.overlayClick = this.overlayClick.bind(this)
    this.keyDown = this.keyDown.bind(this)
    this.setContentRef = this.setContentRef.bind(this)
  }
  overlayClick(evt) {
    if (evt.target === evt.currentTarget) {
      this.props.onRequestClose()
    }
  }
  keyDown(evt) {
    if (evt.keyCode === 9) { // TAB
      scopedTab(this._content, evt)
    }
    if (evt.keyCode === 27) { // ESC
      evt.preventDefault()
      this.props.onRequestClose()
    }
  }
  setContentRef(el) {
    this._content = el
    if (el) el.focus()
  }
  renderModalBox() {
    let {ltiLaunchActive, loading, className, children} = this.props
    let overlay = `modal-overlay${ltiLaunchActive ? ' lti-launch' : ''}`;
    if (loading) return (
      <div className={overlay} onClick={this.overlayClick}>
        <div className='modal-loader'>
          <i className='fa fa-5x fa-spin fa-spinner'/>
        </div>
      </div>
    )
    let boxClassName = cn('modal-box', className)
    return <div className={overlay} onClick={this.overlayClick}>
      <div className={boxClassName} tabIndex='-1' ref={this.setContentRef} onKeyDown={this.keyDown} role='dialog'>
        {children}
      </div>
    </div>
  }
  componentDidMount() {
    let portal = document.createElement('div')
    portal.className = 'modal-portal'
    document.body.appendChild(portal)
    toggleBodyClass(true)
    this.reactAppContainer.setAttribute('aria-hidden', true)
    this.setState({portal})
  }
  render() {
    return this.state.portal && ReactDOM.createPortal(this.renderModalBox(), this.state.portal)
  }
  componentWillUnmount() {
    toggleBodyClass(false)
    if (this.state.portal) {
      document.body.removeChild(this.state.portal)
    }
    document.querySelector('#app').removeAttribute('aria-hidden')
  }
}

function toggleBodyClass(state) {
  document.body.className = cx(document.body.className, {'-modal-open': state})
}

/**
 * Ensure that only elements within a container may be activated when using the TAB key
 * @param {DOMElement} container
 * @param {DOMEvent} evt The original keyDown event when TAB is pressed
 */
export function scopedTab(container, evt) {
  let tabbable = findFocusable(container)
  if (!tabbable.length) {
    evt.preventDefault()
    return
  }
  let finalTabbable = tabbable[evt.shiftKey ? 0 : tabbable.length - 1]
  let leavingFinalTabbable = finalTabbable === document.activeElement
    || container === document.activeElement // shift+tab after opening with mouse
  if (!leavingFinalTabbable) return
  evt.preventDefault()
  let target = tabbable[evt.shiftKey ? tabbable.length - 1 : 0]
  target.focus()
}

Modal.propTypes = {
  onRequestClose: PropTypes.func.isRequired,
}
