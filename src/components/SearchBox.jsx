import React from 'react'
import PropTypes from 'prop-types'
import {Button} from './misc'

/**
 * Text input field combined with a search button
 * - hit the ENTER key or click the button to submit
 */
export default class SearchBox extends React.PureComponent {
  constructor(props) {
    super(props)
    this.enter = this.enter.bind(this)
    this.submit = this.submit.bind(this)
  }

  submit() {
    let {loading, disabled, onSubmit} = this.props
    let value = this.refs.text.value
    if (!loading && !disabled && value.length >= 1) onSubmit(value.trim())
  }

  enter(evt) {
    if (evt.key === 'Enter') this.submit(evt)
  }

  render() {
    let {loading, isError, disabled, autoFocus} = this.props
    return (
      <div className='input-group search-box'>
        <input className={`form-control ${isError?'error':''}`}
          type='text'
          ref='text'
          disabled={loading || disabled}
          onKeyUp={this.enter}
          autoFocus={autoFocus}
        />
        <div className='input-group-btn'>
          <Button className='btn-primary'
            onClick={this.submit}
            disabled={loading || disabled}
            icon={loading ? 'fa-spinner fa-spin' : 'fa-search'}
          />
        </div>
      </div>
    )
  }
}

SearchBox.propTypes = {
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  autoFocus: PropTypes.bool,

  // @param {string} value Trimmed
  onSubmit: PropTypes.func.isRequired,
}
