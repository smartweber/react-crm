import React from 'react'
import PropTypes from '../util/prop-types'
import * as dateutil from '../util/datetime'

/**
 * Date/Time picker component inspired by "YouCanBookMe/react-datetime"
 */
export default class TimePicker extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {}
    this.incHour = this.changeValue(dateutil.addHours, 1)
    this.decHour = this.changeValue(dateutil.addHours, -1)
    this.incMinute = this.changeValue(dateutil.addMinutes, 1)
    this.decMinute = this.changeValue(dateutil.addMinutes, -1)
    this.swapPeriod = this.changeValue(dateutil.addHours, 12)
  }
  changeValue(helper, amt) {
    return () => {
      let nextValue = helper(this.props.value, amt)
      this.props.onChange(nextValue)
    }
  }
  render() {
    let value = this.props.value
    return <div className='time-picker'>
      <div className='chunk'>
        <button type='button' className='up' onClick={this.incHour} aria-label='add 1 hour'>
          <i aria-hidden='true' className='fa fa-caret-up'/>
        </button>
        <span>{dateutil.getHour(value)}</span>
        <button type='button' className='down' onClick={this.decHour} aria-label='subtract 1 hour'>
          <i aria-hidden='true' className='fa fa-caret-down'/>
        </button>
      </div>
      <div className='chunk'>{':'}</div>
      <div className='chunk'>
        <button type='button' className='up' onClick={this.incMinute} aria-label='add 1 minute'>
          <i aria-hidden='true' className='fa fa-caret-up'/>
        </button>
        <span>{dateutil.getMinute(value)}</span>
        <button type='button' className='down' onClick={this.decMinute} aria-label='subtract 1 minute'>
          <i aria-hidden='true' className='fa fa-caret-down'/>
        </button>
      </div>
      <div className='chunk'>
        <button type='button' onClick={this.swapPeriod}>{dateutil.getPeriod(value)}</button>
      </div>
    </div>
  }
}

TimePicker.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.date,
}
