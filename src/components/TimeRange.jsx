import React from 'react'
import PropTypes from '../util/prop-types'
import TimePicker from './TimePicker'
import * as dateutil from '../util/datetime'

/**
 * Compact input-component for selecting a time range
 */
export default class TimeRange extends React.Component {
  constructor(props) {
    super(props)
    this.changeStartTime = value => {
      this.props.onChange([dateutil.toTimeString(value), this.props.value[1]])
    }
    this.changeEndTime = value => {
      this.props.onChange([this.props.value[0], dateutil.toTimeString(value)])
    }
  }
  render() {
    return (
      <div className='time-range'>
        <TimePicker
          value={dateutil.parseTimeString(this.props.value[0])}
          onChange={this.changeStartTime}/>
        <span>{'to'}</span>
        <TimePicker
          value={dateutil.parseTimeString(this.props.value[1])}
          onChange={this.changeEndTime}/>
      </div>
    )
  }
}

TimeRange.propTypes = {
  // [start, end]
  value: PropTypes.arrayOf(PropTypes.timeString).isRequired,

  onChange: PropTypes.func.isRequired,
}
