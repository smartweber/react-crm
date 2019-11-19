/**
 * This module contains a few pure components, too small for their own file.
 */
import React from 'react'
import ReactDOM from 'react-dom'
import cn from 'classnames'

export const Info = (props) => (
  <div
    className='alert alert-info text-center'
    role={!props.noAttribute ? 'alert' : null}
    aria-live={!props.noAttribute ? 'assertive' : null}
  >
    <i aria-hidden='true' className='fa fa-lg fa-info-circle'/>
    {' '}{props.children}
  </div>
)

export class Alert extends React.Component {
  constructor(props) {
    super(props)
    this.show = el => {
      if (el) ReactDOM.findDOMNode(el).scrollIntoView()
    }
  }
  render() {
    let {isIcon} = this.props
    return (
      <div ref={this.show} role='alert' className='alert alert-danger'>
        {isIcon ? <i aria-hidden='true' className='fa fa-lg fa-exclamation-triangle'/> : ''}
        {' '}{this.props.children}
      </div>
    )
  }
}

export class NormalAlert extends React.Component {
  render() {
    return (
      <div className='alert-normal'>
        {this.props.children}
      </div>
    )
  }
}

export const Checkbox = (props) => (
  <div className='checkbox'>
    <label>
      <input type='checkbox' checked={props.checked} onChange={props.onChange}/>
      {props.children}
    </label>
  </div>
)

/**
 * Utility wrapper around the native <button>
 * @param {string?} props.icon className of a font-awesome icon, e.g. fa-cloud
 * @param {string?} props.label Text after the icon
 * @param {bool} props.loading Show a loading spinner and disable click events
 */
export function Button({children, label, icon, className, disabled, loading, onClick, ...rest}) {
  var iconElement = icon ? <i aria-hidden='true' className={cn('fa', icon)}></i> : null
  if (loading) {
    onClick = null
  }
  let btnclass = cn('btn', className || 'btn-default', {
    'btn-loading': loading
  })
  return (
    <button type='button' {...rest}
      className={btnclass}
      disabled={disabled}
      onClick={disabled || loading ? null : onClick}>
      {iconElement}{' '}{label || children}
    </button>
  )
}

export default function ActionIcon(props) {
  return (
    <button type='button' className='action-icon' onClick={props.onClick}>
      <i aria-hidden='true' className={'fa ' + props.icon}></i>
      <span className='sr-only'>{props.label}</span>
    </button>
  )
}
