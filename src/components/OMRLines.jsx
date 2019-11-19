import React from 'react'

/**
 * @example
 * <OMRLines>
 *   <OMRLine/>
 *   <OMRLine/>
 *   <OMRLine/>
 * </OMRLines>
 */
export function OMRLines(props) {
  let count = React.Children.toArray(props.children).filter(Boolean)
  if (count < 1) return null
  return (
    <div className='omr-lines'>
      <div className='header'>
        <div/>
        <div className='opt'>{'A'}</div>
        <div className='opt'>{'B'}</div>
        <div className='opt'>{'C'}</div>
        <div className='opt'>{'D'}</div>
        <div className='opt'>{'E'}</div>
        {props.op && <div className='opt'/>}
      </div>
      <div className='body'>{props.children}</div>
    </div>
  )
}

/**
 * Models a multiple-choice question that you'd find on an exam
 * props.index: number?
 * props.label: string
 * props.value: string e.g. "C"
 * props.onChange(value, index)
 */
export class OMRLine extends React.Component {
  constructor(props) {
    super(props)
    this.change = evt => {
      let letter = evt.target.value
      let value = evt.target.checked
        ? (this.props.value + letter).split('').sort().join('')
        : this.props.value.replace(letter, '')
      this.props.onChange(value, this.props.index, this.props.op)
    }
    this.toggleMode = () => {
      this.props.onChange(this.props.value, this.props.index,
        this.props.op === 'AND' ? 'OR' : 'AND')
    }
  }
  shouldComponentUpdate(nextProps) {
    // {index, onChange} don't affect rendering
    return this.props.value !== nextProps.value || this.props.label !== nextProps.label
      || this.props.op !== nextProps.op
  }
  renderOption(letter) {
    let ariaLabel = `Question ${this.props.label}.${letter}`
    return (
      <label className='opt'>
        <input type='checkbox' className='sr-only'
          value={letter}
          onChange={this.change}
          aria-label={ariaLabel}
          checked={this.props.value.indexOf(letter) !== -1}/>
        <i aria-hidden='true' className='fa fa-times'></i>
      </label>
    )
  }
  render() {
    return (
      <div className='options'>
        <label>{this.props.label}</label>
        {this.renderOption('A')}
        {this.renderOption('B')}
        {this.renderOption('C')}
        {this.renderOption('D')}
        {this.renderOption('E')}
        {this.props.op &&
          <button type='button' className='op-btn' onClick={this.toggleMode}>
            {this.props.op === 'AND' ? '&' : '*'}
          </button>
        }
      </div>
    )
  }
}
