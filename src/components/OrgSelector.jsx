import React from 'react'
import {Link} from 'react-router-dom'
import PopoverTrigger from './Popover'
import LocalStorage from '../util/local-storage'

export default class OrgSelector extends React.Component {
  constructor(props) {
    super(props)
    this.renderOptions = this.renderOptions.bind(this)
    this.renderPopover = this.renderPopover.bind(this)
  }
  setDefaultOrg(org) {
    return () => {
      LocalStorage.set('App:defaultOrg', org.id)
    }
  }
  renderOptions(org, index) {
    let className = org === this.props.value ? 'item checked' : 'item'
    let dest = `/view/${org.id}`
    return (
      <Link key={index} className={className} to={dest} onClick={this.setDefaultOrg(org)}>
        <i aria-hidden='true' className='fa fa-check'/>
        {org.shortName}
      </Link>
    )
  }
  renderPopover(props) {
    let className = props.className + ' org-selector-menu'
    return (
      <div {...props} className={className}>
        <div className='header'>{'Switch organization'}</div>
        {this.props.orgs.map(this.renderOptions)}
      </div>
    )
  }
  render() {
    let org = this.props.value
    return (
      <PopoverTrigger render={this.renderPopover}>
        <button type='button' className='btn btn-default popover-btn org-selector-btn'
          aria-label='Current organization'>
          <i aria-hidden='true' className='fa fa-university icon'/>
          {org.shortName}
          <i aria-hidden='true' className='fa fa-caret-down'/>
        </button>
      </PopoverTrigger>
    )
  }
}
