import React from 'react'
import PropTypes from '../util/prop-types'
import * as dateutil from '../util/datetime'

/**
 * Inline component for choosing a specific year/month/day
 * TODO keyboard arrow keys
 * TODO better keyboard focus
 * TODO review ARIA attributes
 * TODO add aria label to each cell e.g. "Tuesday, January 03 2017"
 */
export default class DatePicker extends React.PureComponent {
  static propTypes = {
    value: PropTypes.dateString,
    onChange: PropTypes.func.isRequired,
  }
  constructor(props) {
    super(props)
    this.state = {
      decade: null,
      displayDate: dateutil.parseDateString(props.value),
      mode: 'days' // months, years
    }

    // Avoid any accidental rollovers when changing the month and while date is 31
    this.state.displayDate.setDate(1)

    this.isToday = createTodayChecker(new Date())
    this.isSelected = createTodayChecker(dateutil.parseDateString(props.value))
    this.clickArrow = this.clickArrow.bind(this)
    this.clickDay = this.clickDay.bind(this)
    this.keyboardDay = onEnterKey(this.clickDay, this)
    this.clickMonth = this.clickMonth.bind(this)
    this.keyboardMonth= onEnterKey(this.clickMonth, this)
    this.clickYear = this.clickYear.bind(this)
    this.keyboardYear = onEnterKey(this.clickYear, this)
    this.up = this.up.bind(this)
  }
  clickArrow(evt) {
    let dir = parseInt(evt.currentTarget.getAttribute('data-value'), 10)
    let {mode, displayDate} = this.state
    if (mode === 'days') {
      let nextValue = dateutil.clone(displayDate)
      nextValue.setMonth(nextValue.getMonth() + dir)
      this.setState({displayDate: nextValue})
    }
    else if (mode === 'months') {
      let nextValue = dateutil.clone(displayDate)
      nextValue.setYear(nextValue.getFullYear() + dir)
      this.setState({displayDate: nextValue})
    }
    else if (mode === 'years') {
      this.setState({decade: this.state.decade + dir * 10})
    }
  }
  up() {
    if (this.state.mode === 'days') {
      this.setState({mode: 'months'})
    }
    else if (this.state.mode === 'months') {
      this.setState({mode: 'years', decade: dateutil.getDecade(this.state.displayDate)})
    }
  }
  clickDay(evt) {
    let nextValue = dateutil.clone(this.state.displayDate)
    nextValue.setDate(evt.currentTarget.getAttribute('data-value'))
    this.props.onChange(dateutil.toDateString(nextValue))
  }
  clickMonth(evt) {
    let nextValue = dateutil.clone(this.state.displayDate)
    nextValue.setMonth(evt.currentTarget.getAttribute('data-value'))
    this.setState({mode: 'days', displayDate: nextValue})
  }
  clickYear(evt) {
    let nextValue = dateutil.clone(this.state.displayDate)
    nextValue.setYear(evt.currentTarget.innerText)
    this.setState({mode: 'months', displayDate: nextValue})
  }
  renderArrows() {
    let {mode, displayDate, decade} = this.state
    let centerLabel
    if (mode === 'days') {
      let monthName = dateutil.MONTHS[displayDate.getMonth()]
      let year = displayDate.getFullYear()
      centerLabel = `${monthName} ${year}`
    }
    else if (mode === 'months') {
      centerLabel = displayDate.getFullYear()
    }
    else if (mode === 'years') {
      centerLabel = `${decade} - ${decade + 9}`
    }
    return (
      <div className='arrows'>
        <button type='button' className='btn btn-default side'
          aria-label='back'
          data-value={-1}
          onClick={this.clickArrow}>
          <i aria-hidden='true' className='fa fa-angle-left'/>
        </button>
        <button type='button' className='btn btn-default mid'
          disabled={mode === 'years'}
          onClick={this.up}>
          {centerLabel}
        </button>
        <button type='button' className='btn btn-default side'
          aria-label='forward'
          data-value={1}
          onClick={this.clickArrow}>
          <i aria-hidden='true' className='fa fa-angle-right'/>
        </button>
      </div>
    )
  }
  renderDays() {
    let displayDate = this.state.displayDate
    let year = displayDate.getFullYear()
    let month = displayDate.getMonth()
    let startValue = -(new Date(year, month, 1).getDay() - 1)
    if (startValue > 0) startValue = -6
    let total = dateutil.getDaysPerMonth(month, year)
    let days = new Array(6*7)
    for (let index = 0; index < days.length; index++) {
      let dayValue = index + startValue
      let props = {
        'aria-selected': false,
        'data-value': dayValue,
        tabIndex: 0,
        className: 'cell',
        key: index,
        onKeyUp: this.keyboardDay,
        onClick: this.clickDay,
      }
      let label = dayValue
      if (dayValue < 1) {
        props.className += ' -out'
        label = dayValue + dateutil.getDaysPerMonth(month - 1, year)
      }
      else if (dayValue > total) {
        props.className += ' -out'
        label = dayValue - total
      }
      else {
        props['aria-selected'] = this.isSelected(year, month, dayValue)
      }
      if (this.isToday(year, month, dayValue)) {
        props.className += ' -today'
      }
      days[index] = React.createElement('div', props, label)
    }
    let lines = new Array(6)
    for (let index = 0; index < lines.length; index++) {
      lines[index] = React.createElement('div', {
        className: 'line',
        key: index
      }, days.slice(index * 7, (index * 7) + 7))
    }
    return (
      <div className='cells'>
        <div className='cell -header'>{'Su'}</div>
        <div className='cell -header'>{'Mo'}</div>
        <div className='cell -header'>{'Tu'}</div>
        <div className='cell -header'>{'We'}</div>
        <div className='cell -header'>{'Th'}</div>
        <div className='cell -header'>{'Fr'}</div>
        <div className='cell -header'>{'Sa'}</div>
        {days}
      </div>
    )
  }
  renderMonth(label, index) {
    return <div className='cell' key={index}
      tabIndex={0}
      data-value={index}
      onClick={this.clickMonth}
      onKeyUp={this.keyboardMonth}
      >{label}
    </div>
  }
  renderMonths() {
    return <div className='cells -big'>
      {dateutil.MONTHS_SHORT.map(this.renderMonth, this)}
    </div>
  }
  renderYear(value, index) {
    return <div className='cell' key={index}
      tabIndex={0}
      onClick={this.clickYear}
      onKeyUp={this.keyboardYear}
      >{value}
    </div>
  }
  renderYears() {
    let startYear = this.state.decade - 1
    let years = new Array(12)
    for (let index = 0; index < 12; index++) {
      years[index] = startYear + index
    }
    return (
      <div className='cells -big'>
        {years.map(this.renderYear, this)}
      </div>
    )
  }
  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value) {
      let displayDate = dateutil.parseDateString(this.props.value)
      this.isSelected = createTodayChecker(dateutil.clone(displayDate))
      displayDate.setDate(1)
      this.setState({displayDate})
    }
  }
  render() {
    let content
    if (this.state.mode === 'days') {
      content = this.renderDays()
    }
    else if (this.state.mode === 'months') {
      content = this.renderMonths()
    }
    else if (this.state.mode === 'years') {
      content = this.renderYears()
    }
    return (
      <div className='date-picker'>
        {this.renderArrows()}
        {content}
      </div>
    )
  }
}

export class ExpandableDatePicker extends React.Component {
  constructor(props) {
    super(props)
    this.change = this.change.bind(this)
    this.toggle = this.toggle.bind(this)
    this.state = {visible: false}
  }
  change(val) {
    this.toggle()
    this.props.onChange(val)
  }
  toggle() {
    this.setState({visible: !this.state.visible})
  }
  render() {
    let content = this.state.visible
      ? <DatePicker value={this.props.value} onChange={this.change}/>
      : <button type='button' className='btn btn-default' onClick={this.toggle}>
        <i style={{marginRight: '1em'}} aria-hidden='true' className='fa fa-calendar'></i>
        {this.props.value}
      </button>
    return (
      <div className='expandable-date-picker'>
        <label>{this.props.label}</label>
        {content}
      </div>
    )
  }
}

function createTodayChecker(today) {
  let todayYear = today.getFullYear()
  let todayMonth = today.getMonth()
  let todayDate = today.getDate()
  return (year, month, day) => {
    return day === todayDate && month === todayMonth && year === todayYear
  }
}

function onEnterKey(fn) {
  return (evt) => {
    if (evt.keyCode === 13 || evt.key === 'Enter') fn.call(this, evt)
  }
}
