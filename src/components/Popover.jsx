import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import {shallowEqual, isTabbingOut} from '../util/helpers'
import Popper from 'popper.js'

const FLIPPED_CLASSNAME = ' --flip'
const POPOVER_CLASSNAME = 'popover-menu'
const INITIAL_STYLE = {position: 'absolute', pointerEvents: 'none', opacity: 0}

/**
 * Wrapper around PopperJS which is a positioning engine for tooltips, dropdowns, and popovers.
 * - Click the trigger element to show the menu
 * - Trigger element is rendered without a wrapping element
 * - The menu is focused when opened
 * - Use focusable menu items to support keyboard navigation
 * - Press Esc, or Tab from the final element, to close the menu
 *
 * <PopoverTrigger render={props => {
 *   <div {...props}>
 *     <a className='item' href='#'>Item 1</a>
 *     ...
 *   </div>
 * }>
 *   <button>Trigger element</button>
 * </PopoverTrigger>
 *
 */
export default class PopoverTrigger extends React.Component {
  constructor(props) {
    super(props)
    this.state = {expand: props.startExpanded}
    this._trigger = null
    this.toggle = (evt) => {
      if (evt.currentTarget === this._trigger) evt.stopPropagation()
      this.setState({expand: !this.state.expand})
    }
    this.setTriggerElement = el => this._trigger = el
    this.getTriggerElement = () => this._trigger
  }
  render() {
    // TODO wrap onClick() and ref() instead of overwriting
    let trigger = React.Children.toArray(this.props.children)[0]
    return [
      React.cloneElement(trigger, {
        'aria-haspopup': 'true',
        onClick: this.toggle,
        key: '1',
        ref: this.setTriggerElement
      }),
      this.state.expand && <PopoverInner key='2'
        onGetTriggerElement={this.getTriggerElement}
        onExternalClick={this.toggle}
        placement={this.props.placement}
        render={this.props.render}/>
    ]
  }
}

PopoverTrigger.propTypes = {
  // 'auto | top | right | bottom | left [-start | -end]'
  placement: PropTypes.string,
  startExpanded: PropTypes.bool,
  render: PropTypes.func.isRequired
}

PopoverTrigger.defaultProps = {
  placement: 'bottom-start',
  startExpanded: false,
}

// props: render(), placement
class PopoverInner extends React.Component {
  constructor(props) {
    super(props)
    this.state = {portal: null, popperData: null}
    this._popper = null
    this._container = null
    this.keydown = this.keydown.bind(this)
    this.applyStyleReact = this.applyStyleReact.bind(this)
    this.createPopper = this.createPopper.bind(this)
  }
  keydown(evt) {
    if (evt.keyCode === 27) { // Escape
      this.toggle()
      this._trigger.focus()
    }
    if (evt.keyCode === 9) { // Tab
      if (isTabbingOut(evt, this._container)) {
        evt.preventDefault()
        this.toggle()
        this._trigger.focus()
      }
    }
  }
  applyStyleReact(nextPopperData) {
    let {popperData} = this.state
    if (!popperData || !shallowEqual(nextPopperData.offsets.popper, popperData.offsets.popper)) {
      this.setState({popperData: nextPopperData})
    }
    return nextPopperData
  }
  getPopperStyle(popperData) {
    if (!popperData) return INITIAL_STYLE
    let {top, left, position} = popperData.offsets.popper
    return {
      position: position,
      top: 0,
      left: 0,
      transform: `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`,
      willChange: 'transform',
      ...popperData.styles
    }
  }
  createPopper(container) {
    container = ReactDOM.findDOMNode(container)
    if (container) {
      this._container = container
      this._popper = new Popper(this.props.onGetTriggerElement(), container, {
        placement: this.props.placement,
        eventsEnabled: true,
        modifiers: {
          applyStyle: {enabled: false},
          applyStyleReact: {
            enabled: true,
            order: 900,
            fn: this.applyStyleReact
          }
        }
      })
    }
  }
  renderContent() {
    let {popperData} = this.state
    return this.props.render({
      onKeyDown: this.keydown,
      ref: this.createPopper,
      style: this.getPopperStyle(popperData),
      role: 'menu',
      tabIndex: '-1',
      className: popperData && popperData.flipped
        ? (POPOVER_CLASSNAME + FLIPPED_CLASSNAME)
        : POPOVER_CLASSNAME
    })
  }
  componentDidMount() {
    let portal = document.createElement('div')
    portal.className = 'popper-portal'
    document.body.appendChild(portal)
    window.addEventListener('click', this.props.onExternalClick)
    window.addEventListener('tap', this.props.onExternalClick)
    this.setState({portal})
  }
  componentWillUnmount() {
    window.removeEventListener('click', this.props.onExternalClick)
    window.removeEventListener('tap', this.props.onExternalClick)
    if (this._popper) {
      this._popper.destroy()
    }
    if (this.state.portal) {
      document.body.removeChild(this.state.portal)
    }
  }
  componentDidUpdate(prevProps, prevState) {
    if (this._popper) this._popper.scheduleUpdate()

    // Focus the new element only when it first becomes properly positioned
    if (this.state.popperData && !prevState.popperData) this._container.focus()
  }
  render() {
    return this.state.portal && ReactDOM.createPortal(this.renderContent(), this.state.portal)
  }
}
