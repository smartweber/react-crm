import {assign} from 'lodash'
import React from 'react'
import PropTypes from 'prop-types'
import DatePicker from './DatePicker'
import {Button} from './misc'
import DayPicker from './DayPicker'
import TimeRange from './TimeRange'
import Select from './Select'
import cn from 'classnames'
import {REGX_EMAIL} from '../util/helpers'
const DEFAULT_VALUES = {
  checkbox: false,
  date: new Date().toISOString().substring(0, 10),
  days: 0,
  email: '',
  number: '',
  password: '',
  select: null,
  text: '',
  timeRange: ['07:00:00', '08:00:00'],
}

/**
 * @abstract Extend with a config object for a complete Form component
 * @example class LoginForm extends Form {
 *   constructor(props) {
 *     super(props, {
 *       user: {type: 'text', label: 'Username', defaultValue: 'cody'},
 *       pass: {type: 'text', label: 'Password', defaultValue: ''}
 *     })
 *     this.state.formValues.user === 'cody'
 *     this.state.formValues.pass === ''
 *   }
 * }
 * @param {string} config[name].type One of: `['text', 'date', 'days']`
 * @param {string} config[name].label
 * @param {any} config[name].defaultValue
 * @param {bool} config[name].required
 * @param {bool} config[name].uppercase Force a `text` value to uppercase, with no whitespace
 * @param {object?} config[name].extras These props are merged into the inner `<input/>`
 * @see Form#render()
 */
export default class Form extends React.PureComponent {
  /**
   * @param {object} props Like a standard React.Component
   * @param {object} config
   */
  constructor(props, config) {
    super(props)
    this.formConfig = config
    this.state = {
      formErrors: {},
      formValues: this.getInitialFormValues(),
    }
    this.createFormValidator(config)
    this.reset = this.reset.bind(this)
    this.submit = this.submit.bind(this)
    this.keyup = this.keyup.bind(this)
  }

  /**
   * Subclasses will likely override this
   */
  render() {
    return (
      <form className={this.props.className} onKeyUp={this.keyup} onSubmit={this.preventDefault}>
        {this.renderFormGroups()}
        <div className='btn-group'>
          <Button className='btn-primary' label='Submit' onClick={this.submit}/>
          <Button className='btn-success' label='Reset' onClick={this.reset}/>
        </div>
      </form>
    )
  }

  /**
   * @public
   * Subclasses will likely override this
   */
  submit(evt) {
    let fields = this.validate()
    if (fields) {
      this.props.onSubmit(fields)
    }
    evt.preventDefault()
  }

  /**
   * @public
   * Return the form to its default state
   */
  reset() {
    this.setState({
      formErrors: {},
      formValues: this.getInitialFormValues()
    })
  }

  /**
   * @public
   * Most people expect the Enter key to sumbit a form
   * - usage with a custom render func: <form onKeyUp={this.keyup}>
   */
  keyup(evt) {
    if (evt.keyCode === 13 && evt.target.tagName === 'INPUT') {
      switch (evt.target.type) {
      case 'email':
      case 'number':
      case 'password':
      case 'tel':
      case 'text':
        this.submit()
      }
    }
  }

  /**
   * @public
   * Generate all the configured <input> components
   */
  renderFormGroups() {
    let config = this.formConfig
    let groups = []
    for (let name in config) if (config.hasOwnProperty(name)) {
      groups.push(this.renderFormGroup(name, config[name]))
    }
    return groups
  }

  preventDefault(evt) {
    evt.preventDefault()
  }

  createFormValidator(config) {
    /**
     * @public
     * Use this as part of the `submit` handler.
     * Returns a map of all the form fields or `null` if invalid.
     * @return {object|null}
     */
    let validateAll = () => {
      let isValid = true
      let errors = {}
      for (let name in config) if (config.hasOwnProperty(name)) {
        let val = this.state.formValues[name]
        if (!this.state.formErrors[name]) {
          if (config[name].required && !val) {
            errors[name] = 'required'
            isValid = false
          }
          if (config[name].minLength != null && val.length < config[name].minLength) {
            errors[name] = `length should be at least ${config[name].minLength}`
            isValid = false
          }
          if (config[name].maxLength != null && val.length > config[name].maxLength) {
            errors[name] = `length should be at most ${config[name].maxLength}`
            isValid = false
          }
          if (config[name].pattern && val && !config[name].pattern.value.test(val)) {
            errors[name] = config[name].pattern.label
            isValid = false
          }
          if (config[name].type === 'email' && val && (!REGX_EMAIL.test(val) || val.length > 255)) {
            errors[name] = 'invalid email format'
            isValid = false
          }
        }
        if (this.state.formErrors[name]) {
          isValid = false
        }
      }
      if (isValid) {
        return this.state.formValues
      }
      this.setFormError(errors)
      return null
    }
    let validateInput = {}
    for (let name in config) if (config.hasOwnProperty(name)) {
      validateInput[name] = this.createInputHandler(name, config[name])
    }
    this.validateInput = validateInput
    this.validate = validateAll
  }

  getInitialFormValues() {
    let config = this.formConfig
    let defaultValues = {}
    for (let name in config) if (config.hasOwnProperty(name)) {
      defaultValues[name] = config[name].defaultValue || DEFAULT_VALUES[config[name].type]
    }

    // optimize after the first run, since this.formConfig must be immutable
    this.getInitialFormValues = () => defaultValues

    return defaultValues
  }

  renderFormGroup(name, props) {
    let err = this.state.formErrors[name] || ''
    let className = cn('form-group', {
      'has-error': err
    })
    // TODO aria-labeledby
    // TODO aria-describedby
    return (
      <div className={className} key={name}>
        {props.type === 'checkbox' ? null : <label>{props.label}</label>}
        {this.renderFormInput(name, props)}
        <span className='help-block'>{err}</span>
      </div>
    )
  }

  renderFormInput(name, props) {
    switch (props.type) {
    case 'checkbox': return <div className='checkbox'>
      <label className={`checkbox-wrapper ${this.state.formValues[name] ? 'checked' : ''}`}>
        <input type='checkbox'
          className='sr-only'
          name={name}
          checked={this.state.formValues[name]}
          onChange={this.validateInput[name]}
          {...props.extras}/>
        <i className="fa fa-check" aria-hidden="true"></i>
      </label>
      {props.label}
    </div>
    case 'password':
    case 'number':
    case 'email':
    case 'text': return <input
      className='form-control'
      type={props.type}
      name={name}
      value={this.state.formValues[name]}
      onChange={this.validateInput[name]}
      {...props.extras}/>
    case 'date': return <DatePicker
      name={name}
      value={this.state.formValues[name]}
      onChange={this.validateInput[name]}
      {...props.extras}/>
    case 'days': return <DayPicker
      name={name}
      value={this.state.formValues[name]}
      onChange={this.validateInput[name]}
      {...props.extras}/>
    case 'timeRange': return <TimeRange
      name={name}
      value={this.state.formValues[name]}
      onChange={this.validateInput[name]}
      {...props.extras}/>
    case 'select': return <Select
      name={name}
      value={this.state.formValues[name]}
      onChange={this.validateInput[name]}
      {...props.extras}/>
    case 'static': return <p className='form-control-static'>{this.state.formValues[name]}</p>
    }
  }

  /**
   * @return {func} onChange handler for the given input field
   */
  createInputHandler(name, config) {
    switch (config.type) {
    case 'checkbox': return evt => {
      let value = evt.target.checked
      this.setFormValue(name, value)
    }
    case 'number': return evt => {
      // TODO config.integer
      if (this.state.formErrors[name]) {
        this.setFormError(name, null)
      }
      let value = Number(evt.target.value)
      let max = config.extras.max
      let min = config.extras.min
      if (min != null && value < min) {
        value = min
      }
      else if (max != null && value > max) {
        value = max
      }
      else if (isNaN(value)) {
        value = this.state.formValues[name]
      }
      this.setFormValue(name, value)
    }
    case 'password':
    case 'email':
    case 'text': return evt => {
      if (this.state.formErrors[name]) {
        this.setFormError(name, null)
      }
      let value = evt.target.value
      if (config.uppercase) value = value.toUpperCase().replace(/\s/g, '')
      this.setFormValue(name, value)
    }
    case 'timeRange': return value => {
      if (value[0] >= value[1]) {
        this.setFormError(name, 'invalid time range')
      }
      else if (this.state.formErrors[name]) {
        this.setFormError(name, null)
      }
      this.setFormValue(name, value)
    }
    case 'select':
    case 'days':
    case 'date':
    default: return value => {
      if (this.state.formErrors[name]) {
        this.setFormError(name, null)
      }
      this.setFormValue(name, value)
    }
    }
  }

  setFormValue(name, value) {
    let formValues = assign({}, this.state.formValues)
    formValues[name] = value
    this.setState({formValues})
  }

  /**
   * @param {string|object} name
   * @param {string?} msg
   */
  setFormError(name, msg) {
    if (typeof name == 'object') {
      let formErrors = assign({}, this.state.formErrors, name)
      this.setState({formErrors})
      return
    }
    if (this.state.formErrors[name] === msg) return
    let formErrors = assign({}, this.state.formErrors)
    formErrors[name] = msg
    this.setState({formErrors})
  }
}

Form.propTypes = {
  /**
   * @param {object} formValues
   */
  onSubmit: PropTypes.func.isRequired,
}
