import React from 'react'
import PopoverTrigger from './Popover'
import {Link} from 'react-router-dom'

/**
 * Page header for the application, includes things like:
 * - a logo
 * - support links
 * - account management links
 */
export default class Navbar extends React.Component {
  constructor(props) {
    super(props)
    this.renderUserMenu = this.renderUserMenu.bind(this)
  }
  renderUserMenu(props) {
    return (
      <div {...props}>
        <Link to='/settings/profile' className='item'>{'Settings'}</Link>
        <a href='http://support.com' className='item' target="_blank">{'Help'}</a>
        <button type='button' className='btn-link item' onClick={this.props.onLogout}>{'Sign out'}</button>
      </div>
    )
  }
  render() {
    let user = this.props.user
    return (
      <nav className='nav-bar'>
        <div className='gradient'/>
        <div className='container'>
          <Link className='logo' to='/'><img src='/static/logo.png' alt='home logo' aria-label='home logo'/></Link>
          <PopoverTrigger placement='bottom-end' render={this.renderUserMenu}>
            <button type='button' className='btn popover-btn profile-btn' aria-label='User settings'>
              <span aria-hidden='true' className='fa-stack fa-lg'>
                <i className='fa fa-circle fa-stack-2x'></i>
                <i className='fa fa-user fa-stack-1x fa-inverse'></i>
              </span>
              <span className='name'>{user.nickname || user.email}</span>
              <i aria-hidden='true' className='fa fa-caret-down'/>
            </button>
          </PopoverTrigger>
        </div>
      </nav>
    )
  }
}
