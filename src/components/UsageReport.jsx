import React from 'react'
import PropTypes from 'prop-types'
import Modal from './Modal'
import {ExpandableDatePicker} from './DatePicker'
import {parseDateString} from '../util/datetime'
import LocalStorage from '../util/local-storage'
import {Info, Button} from './misc'
import Table from './Table'
import {createCSV} from '../util/csv'
import {saveAs} from '../util/helpers'

export default class UsageReport extends React.Component {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
  }
  constructor(props) {
    super(props)
    this.submit = this.submit.bind(this)
    this.changeStart = this.changeStart.bind(this)
    this.changeEnd = this.changeEnd.bind(this)
    this.viewDept = this.viewDept.bind(this)
    this.updatePrice = this.updatePrice.bind(this)
    this.download = this.download.bind(this)
    this.state = {
      timeStart: LocalStorage.get('UsageReport:timeStart') || new Date().toISOString().substring(0, 8) + '01',
      timeEnd: LocalStorage.get('UsageReport:timeEnd') || new Date().toISOString().substring(0, 10),
      centsPerPage: LocalStorage.get('UsageReport:centsPerPage') || 0,
      pending: null,
      err: null,
      data: null,
      selectedGroup: null
    }
  }
  componentWillUnmount() {
    if (this.state.pending)
      this.state.pending.cancel()
  }
  toTimeStamp(dateString) {
    return parseDateString(dateString).toISOString().replace('.000', '')
  }
  download() {
    let timeStart = this.toTimeStamp(this.state.timeStart)
    let timeEnd = this.toTimeStamp(this.state.timeEnd)
    saveAs(flattenReport(this.state.data, this.state.centsPerPage),
      'text/csv;charset=utf-8', `${timeStart}_${timeEnd}.csv`)
  }
  submit() {
    let timeStart = this.toTimeStamp(this.state.timeStart)
    let timeEnd = this.toTimeStamp(this.state.timeEnd)
    let pending = this.props.onSubmit(timeStart, timeEnd)
      .then(data => {
        this.setState({pending: null, err: null, data: data, selectedGroup: null})
      })
      .catch(err => {
        this.setState({pending: null, err: err, data: null, selectedGroup: null})
      })
    this.setState({pending})
  }
  updatePrice(evt) {
    let value = parseInt(evt.currentTarget.value)
    if (value < 0 || Number.isNaN(value)) value = 0
    LocalStorage.set('UsageReport:centsPerPage', value)
    this.setState({centsPerPage: value})
    evt.currentTarget.value = value
  }
  changeStart(timeStart) {
    this.changeRange(timeStart, this.state.timeEnd)
  }
  changeEnd(timeEnd) {
    this.changeRange(this.state.timeStart, timeEnd)
  }
  changeRange(timeStart, timeEnd) {
    if (timeEnd <= timeStart) {
      this.setState({timeStart, timeEnd, err: {message: 'invalid date range'}})
    }
    else {
      LocalStorage.set('UsageReport:timeStart', timeStart)
      LocalStorage.set('UsageReport:timeEnd', timeEnd)
      this.setState({timeStart, timeEnd, err: null})
    }
  }
  viewDept(evt) {
    let index = parseInt(evt.currentTarget.getAttribute('data-id'))
    this.setState({selectedGroup: this.state.data.groups[index]})
  }
  renderDeptLink(name, index) {
    return <button type='button' className='btn-link'
      data-id={index} onClick={this.viewDept}>{name}</button>
  }
  renderDepts() {
    if (this.state.selectedGroup) return this.renderUsers()
    const COL_NAMES_DEPT = [['Dept', 'Page count', 'Cost ($)']]
    let rows = this.state.data.groups.map((item, index) => [
      this.renderDeptLink(item.id || '<none>', index),
      item.pages,
      (item.pages * this.state.centsPerPage / 100).toFixed(2)
    ])
    let total = (this.state.data.totalPages * this.state.centsPerPage / 100).toFixed(2)
    let foot = [[null, this.state.data.totalPages, total]]
    return <Table header={COL_NAMES_DEPT} body={rows} footer={foot} summary='Dept table'/>
  }
  renderUsers() {
    const COL_NAMES_USER = [['Name', 'Email', 'Pages', 'Cost ($)']]
    let group = this.state.selectedGroup
    let rows = group.users.map(item => [
      item.name,
      item.email,
      item.pages,
      (item.pages * this.state.centsPerPage / 100).toFixed(2)
    ])
    let totalCost = (group.pages * this.state.centsPerPage / 100).toFixed(2)
    let foot = [[null, null, group.pages, totalCost]]
    return (
      <React.Fragment>
        <button type='button' className='btn btn-sm btn-default' onClick={this.viewDept}>
          {group.id}
          <i aria-hidden='true' className='fa fa-fw fa-times'/>
        </button>
        <Table header={COL_NAMES_USER} body={rows} footer={foot} summary='Users table'/>
      </React.Fragment>
    )
  }
  render() {
    let {onClose} = this.props
    let {err, pending, data} = this.state
    return (
      <Modal isOpen onRequestClose={onClose}>
        <h4 className='header' aria-level='2'>{'Usage Report'}</h4>
        <div className='body usage-report'>
          <ExpandableDatePicker label='From' value={this.state.timeStart} onChange={this.changeStart}/>
          <ExpandableDatePicker label='To' value={this.state.timeEnd} onChange={this.changeEnd}/>
          <div className='form-group'>
            <label>{'¢ per page '}</label>
            <input className='form-control' type='text' defaultValue={this.state.centsPerPage} onBlur={this.updatePrice}/>
          </div>
          <div className='form-group'>
            <label></label>
            <Button className='btn-primary submit' label='View Report'
              loading={!!pending} onClick={this.submit}/>
          </div>
          {err && <Info>{err.message}</Info>}
          {data && this.renderDepts()}
        </div>
        <div className='footer'>
          <Button label='Export' disabled={!(data && data.groups)} onClick={this.download}/>
          <div className='btn-group pull-right'>
            <Button label='Close' onClick={onClose}/>
          </div>
          <div className='clearfix'/>
        </div>
      </Modal>
    )
  }
}

function flattenReport(data, centsPerPage) {
  let rows = []
  data.groups.forEach(group => {
    group.users.forEach(user => {
      rows.push({
        group: group.id,
        name: user.name,
        email: user.email,
        pages: user.pages,
        cost: (user.pages * centsPerPage / 100).toFixed(2)
      })
    })
  })
  return createCSV([
    ['DEPT', 'group'],
    ['USER NAME', 'name'],
    ['USER EMAIL', 'email'],
    ['PAGES', 'pages'],
    ['COST', 'cost'],
  ], rows)
}
