import React from 'react'
import PropTypes from 'prop-types'
import {CopyToClipboard} from 'react-copy-to-clipboard'

/**
 * Display a list of search results
 * - with pagination
 */
export default class SecretInput extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      input: this.props.value,
      name: this.props.name,
      copied: false
    }
    this.onChange = this.onChange.bind(this)
    this.onCopy = this.onCopy.bind(this)
  }
  componentWillReceiveProps(nextProps) {
    this.setState({
      input: nextProps.value,
      name: nextProps.name,
      copied: false
    })
  }

  onChange({target: {value}}) {
    this.props.onSecretInputChange({[this.state.name]: value})
    this.setState({copied: false})
  }
  onCopy() {
    this.setState({copied: true})
  }

  render() {
    const {label, readOnly, copyTxtTabIndex, ariaLabel} = this.props
    let {input} = this.state
    return <div className='form-group'>
        <label>{label}</label>
        <div className='clipboard-container'>
          <input type='text' className='form-control'
            value={input}
            readOnly={readOnly}
            aria-label={ariaLabel ? ariaLabel : null}
            aria-required='true'
            onChange={this.onChange}
          />
          <CopyToClipboard text={this.state.input} onCopy={this.onCopy}>
            <a aria-label='Copy text for shared secret' tabIndex={copyTxtTabIndex ? copyTxtTabIndex : null}>
              <i className='fa fa-clipboard' aria-hidden='true'></i> copy text
            </a>
          </CopyToClipboard>
        </div>
    </div>
  }
}

SecretInput.propTypes = {
  // Input value
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  name: PropTypes.string,
  ariaLabel: PropTypes.string,
  copyTxtTabIndex: PropTypes.string,
  onSecretInputChange: PropTypes.func,
}
