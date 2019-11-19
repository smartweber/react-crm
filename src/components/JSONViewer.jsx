import React from 'react'
import PropTypes from 'prop-types'
import {size, map} from 'lodash'

/**
 * Looks like the object inspector in Chrome's javascript console, but more limited
 * - <shift> + click to show grandchildren
 * - <cmd> + click to expand the full (sub)tree
 * @example <JSONViewer value={{id: 1, name: 'cody'}}/>
 */
export default class JSONViewer extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      expandChildren: this.props.expand - 1,
      collapsed: !this.props.expand
    }
    this.renderChild = this.renderChild.bind(this)
    this.toggle = this.toggle.bind(this)
  }
  toggle(evt) {
    this.setState({
      expandChildren: evt.shiftKey ? 1
        : (evt.metaKey || evt.ctrlKey) ? -1 : 0,
      collapsed: !this.state.collapsed
    })
  }
  renderScalar(value) {
    let className = 'value -' + (typeof value)
    return (
      <div className='json-viewer'>
        <span className={className}>{JSON.stringify(value)}</span>
      </div>
    )
  }
  renderChild(value, key) {
    return (
      <div key={key} className='child'>
        <span className='key'>{key + ':'}</span>
        <JSONViewer expand={this.state.expandChildren} value={value}/>
      </div>
    )
  }
  renderComplex(openBracket, closeBracket, data) {
    let length = size(data)
    if (this.props.label) {
      openBracket = this.props.label + openBracket
    }
    if (!length) return (
      <div className='json-viewer'>
        <span className='bracket'>{openBracket + closeBracket}</span>
      </div>
    )
    if (this.state.collapsed) return (
      <div className='json-viewer'>
        <div className='expando' onClick={this.toggle}>
          <i className='fa fa-caret-right'/>
          <span className='bracket'>{openBracket + length + closeBracket}</span>
        </div>
      </div>
    )
    return (
      <div className='json-viewer'>
        <div className='expando' onClick={this.toggle}>
          <i className='fa fa-caret-down'/>
          <span className='bracket'>{openBracket}</span>
        </div>
        <div className='children'>{map(data, this.renderChild)}</div>
        <span className='bracket'>{closeBracket}</span>
      </div>
    )
  }
  render() {
    let value = this.props.value
    if (Array.isArray(value)) {
      return this.renderComplex('[', ']', value)
    }
    if (value == null) {
      return this.renderScalar(null)
    }
    if (typeof value == 'object') {
      return this.renderComplex('{', '}', value)
    }
    return this.renderScalar(value)
  }
}

JSONViewer.propTypes = {
  // 0/undefined, The component starts in the collapsed state
  // -1, All properties are expanded by default
  // 1, Expand the component
  // 2, Expand children
  // *, Expand to depth
  expand: PropTypes.number,

  // Attach a label to the opening brace of an object/array
  label: PropTypes.string,

  // The structure to display, should be a JSON serializable object, array, or primitive
  value: PropTypes.any,
}
