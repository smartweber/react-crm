import React from 'react'
import PropTypes from 'prop-types'
import {property as createGetter, identity} from 'lodash'

/**
 * Extends the native <select> element to allow a list of generic objects
 * plus other goodies. This is intended to be wrapped by a stateful component.
 *
 * @example <Select opt={['red', 'blue', 'green']} value='red' />
 *
 * Unused props are passed through, e.g. className
 */
export default class Select extends React.PureComponent {
  constructor(props) {
    super(props)
    this.change = this.change.bind(this)
  }

  change(evt) {
    const {onChange, value, opt} = this.props
    if (Array.isArray(value)) onChange(Array.prototype.slice.call(evt.target.options, 0)
      .filter(el => el.selected)
      .map(el => opt[el.value]))
    else onChange(opt[evt.target.value] || null, parseInt(evt.target.value))
  }

  render() {
    let {opt, value, labeler, nullable, disabled, className, ariaLabel, role} = this.props
    let multiSelect = Array.isArray(value)
    let selectedIndex = multiSelect ? value.map(item => opt.indexOf(item))
      : (value || nullable) ? opt.indexOf(value) : 0
    if (typeof labeler === 'string') {
      labeler = createGetter(labeler)
    }
    else if (typeof labeler !== 'function') {
      labeler = identity
    }
    className = (className || '') + ' select-box'
    return (
      <div className={className}>
        <select
          disabled={disabled}
          aria-label={ariaLabel ? ariaLabel : null}
          role={role ? role: null}
          multiple={multiSelect}
          onChange={this.change}
          value={selectedIndex}>
          {!nullable ? null
            : <option disabled={multiSelect} value={-1}>{nullable}</option>}
          {opt.map((item, index) =>
            <option key={index} disabled={item.disabled} value={index}>{labeler(item, index)}</option>)}
        </select>
        <i className='fa fa-caret-down'/>
      </div>
    )
  }
}

Select.propTypes = {
  disabled: PropTypes.bool,

  // If a list of objects was provided, then you'll need a way to label them
  labeler: PropTypes.oneOfType([
    PropTypes.string, // a property name or path, e.g. 'name' or 'a.b.c'
    PropTypes.func // (item) => string
  ]),

  // The label for a null option
  nullable: PropTypes.string,
  ariaLabel: PropTypes.string,
  role: PropTypes.string,

  // List of objects or strings to choose from
  opt: PropTypes.array.isRequired,

  /**
   * @param {any} selected A single value or an array, depending on the inital value
   */
  onChange: PropTypes.func.isRequired,

  // The selected element, an array (for multi-select), or null/undefined
  value: PropTypes.any,
}
