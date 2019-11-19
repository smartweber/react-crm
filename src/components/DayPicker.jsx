import React from 'react'
import PropTypes from 'prop-types'
const BIT_MAP = {
  Su: 0b1000000,
  Mo: 0b0100000,
  Tu: 0b0010000,
  We: 0b0001000,
  Th: 0b0000100,
  Fr: 0b0000010,
  Sa: 0b0000001,
}
const DAYS = Object.keys(BIT_MAP)
const toDayString = bits => label => (bits & BIT_MAP[label]) === BIT_MAP[label] ? label : null

/**
 * Convert the DayPicker value into a human readable string
 * @example (0b0101010) => 'M W F'
 */
function formatDays(bits) {
  return DAYS.map(toDayString(bits)).filter(Boolean).join(' ')
}

function formatHours(time) {
  let [hours, minutes] = time.split(':')
  let period = hours < 12 ? 'AM' : 'PM'
  return `${hours}:${minutes} ${period}`
}

function formatTimeRange(days, start, end) {
  return `${formatDays(days)} ${formatHours(start)} - ${formatHours(end)}`
}

/**
 * Compact input-component for selecting certain days of the week
 */
class DayPicker extends React.PureComponent {
  constructor(props) {
    super(props)
    this.tick = this.tick.bind(this)
  }
  tick(evt) {
    if (evt.target.type === 'button') {
      let mask = parseInt(evt.target.getAttribute('data-value'))
      this.props.onChange(this.props.value ^ mask)
    }
  }
  renderBox(label, title) {
    let mask = BIT_MAP[label]
    let isActive = (this.props.value & mask) === mask
    return <button type='button' className='btn'
      aria-pressed={isActive}
      aria-label={title}
      data-value={mask}
      >{label}
    </button>
  }
  render() {
    return (
      <div className='day-picker' role='group' onClick={this.tick}>
        {this.renderBox('Su', 'Sunday')}
        {this.renderBox('Mo', 'Monday')}
        {this.renderBox('Tu', 'Tuesday')}
        {this.renderBox('We', 'Wednesday')}
        {this.renderBox('Th', 'Thursday')}
        {this.renderBox('Fr', 'Friday')}
        {this.renderBox('Sa', 'Saturday')}
      </div>
    )
  }
}

DayPicker.defaultProps = {
  value: 0
}

DayPicker.propTypes = {
  /**
   * Bitstring representing 7 days of the week,
   * starting with Sunday at the most significant bit (0b1000000)
   */
  value: PropTypes.number.isRequired,

  /**
   * @param {number} value
   */
  onChange: PropTypes.func.isRequired,
}

export {
  DayPicker as default,
  formatDays, formatHours, formatTimeRange,
  BIT_MAP,
}
