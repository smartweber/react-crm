import React from 'react'
import PropTypes from 'prop-types'
import {map} from 'lodash'
import JSONViewer from './JSONViewer'
const SCALAR_TYPES = ['any', 'string', 'number', 'boolean', 'datetime', 'date-only', 'time-only']
const COMPLEX_TYPES = ['array', 'object', 'union']
const BUILTIN_TYPES = SCALAR_TYPES.concat(COMPLEX_TYPES)

function Markdown(props) {
  if (!props.value) return null
  return <div className='description' dangerouslySetInnerHTML={{__html: props.value}}/>
}

/**
 * Inspect a RAML type spec
 * @example <RAMLSchemaViewer value={{type: 'number', description: 'Hello, RAML!'}}/>
 */
export default class RAMLSchemaViewer extends JSONViewer {
  renderChild(value, key) {
    return (
      <div key={key} className='child'>
        <span className='key'>{key + ':'}</span>
        <RAMLSchemaViewer expand={this.state.expandChildren} value={value}/>
      </div>
    )
  }
  renderComplex(data) {
    let className = this.props.className ? 'json-viewer ' + this.props.className : 'json-viewer'
    let openBracket = '{'
    let closeBracket = '}'
    let hasChildren = data.items || data.properties || data.oneOf
    if (data.type === 'array' || data.type === 'union') {
      openBracket = '['
      closeBracket = ']'
    }
    if (this.props.label) {
      openBracket = this.props.label + openBracket
    }
    else if (data.type === 'union') {
      openBracket = 'oneOf' + openBracket
    }
    if (!hasChildren) return (
      <div className={className}>
        <span className='bracket'>{openBracket + closeBracket}</span>
      </div>
    )
    if (this.state.collapsed) return (
      <div className={className}>
        <div className='expando' onClick={this.toggle}>
          <i className='fa fa-caret-right'/>
          <span className='bracket'>{openBracket + closeBracket}</span>
        </div>
      </div>
    )
    let children = null
    if (data.type === 'array') {
      children = <RAMLSchemaViewer expand={this.state.expandChildren} value={data.items}/>
    }
    else if (data.type === 'object') {
      children = map(data.properties, this.renderChild)
    }
    else if (data.type === 'union') {
      children = map(data.oneOf, this.renderChild)
    }
    return (
      <div className={className}>
        <div className='expando' onClick={this.toggle}>
          <i className='fa fa-caret-down'/><span className='bracket'>{openBracket}</span>
        </div>
        <div className='children'>
          <Markdown value={data.description}/>
          {children}
        </div>
        <span className='bracket'>{closeBracket}</span>
      </div>
    )
  }
  renderScalar(data) {
    let className = this.props.className ? 'json-viewer ' + this.props.className : 'json-viewer'
    let expandable = data.examples || data.description || data.enum || typeof data.default != 'undefined'
    let collapsed = this.state.collapsed
    let requiredElement = data.required
      ? <span className='required'>{'*'}</span>
      : null
    if (!expandable) return (
      <div className={className}>
        <span className='value -type'>{data.type}</span>
        {requiredElement}
      </div>
    )
    if (collapsed) return (
      <div className={className}>
        <div className='expando' onClick={this.toggle}>
          <i className='fa fa-caret-right'/>
          <span className='value -type'>{data.type}</span>
          {requiredElement}
        </div>
      </div>
    )

    // else if expanded
    let defaultValueElement = null
    let defaultValueType = typeof data.default
    let exampleElements = null
    if (typeof data.examples !== 'undefined') {
      exampleElements = new Array(data.examples.length)
      for (let index = 0; index < data.examples.length; index++) {
        let value = data.examples[index].value
        exampleElements[index] = (
          <div className='description' key={index}>
            {'example: ' }
            <span className={'value -' + typeof value}>{JSON.stringify(value)}</span>
          </div>
        )
      }
    }
    if (defaultValueType !== 'undefined') defaultValueElement = (
      <div className='description'>
        {'default: '}
        <span className={'value -' + defaultValueType}>{JSON.stringify(data.default)}</span>
      </div>
    )
    let enumElement = data.enum
      ? <JSONViewer expand={this.state.expandChildren} label='Enum' value={data.enum}/>
      : null
    return (
      <div className={className}>
        <div className='expando' onClick={this.toggle}>
          <i className='fa fa-caret-down'/>
          <span className='value -type'>{data.type}</span>
          {requiredElement}
        </div>
        <div className='children'>
          <Markdown value={data.description}/>
          {defaultValueElement}
          {exampleElements}
          {enumElement}
        </div>
      </div>
    )
  }
  render() {
    let value = this.props.value
    if (COMPLEX_TYPES.indexOf(value.type) !== -1) {
      return this.renderComplex(value)
    }
    return this.renderScalar(value)
  }
}

RAMLSchemaViewer.propTypes = {
  /**
   *  0/undefined, The component starts in the collapsed state
   * -1, All properties are expanded by default
   *  1, Expand the component
   *  2, Expand children
   *  .., Expand to depth
   */
  expand: PropTypes.number,

  // Attach a label to the opening brace of an object/array
  label: PropTypes.string,

  /**
   * The type schema to display
   */
  value: PropTypes.shape({
    type: PropTypes.oneOf(BUILTIN_TYPES).isRequired,
    description: PropTypes.string,
    default: PropTypes.any,
    enum: PropTypes.array,
    required: PropTypes.bool,

    // type=object
    // properties: PropTypes.objectOf(PropTypes.object), // recursive

    // type=array
    // items: PropTypes.object, // recursive
  })
}
