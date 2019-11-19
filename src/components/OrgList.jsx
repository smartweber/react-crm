import React from 'react'
import PropTypes from 'prop-types'
import {Link} from 'react-router-dom'
import {Info} from './misc'
import ConfirmationModal from './ConfirmationModal'
import SettingsModal from './SettingsModal'

/**
 * @see <ProfileManager>
 */
export default class OrgList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      dropping: -1,
      settings: -1
    }
    this.toggleConfirm = (evt) => {
      let index = parseInt(evt && evt.currentTarget.getAttribute('data-index'))
      this.setState({dropping: isNaN(index) ? -1 : index})
    }
    this.drop = () => {
      let index = this.state.dropping
      let org = this.props.orgs[index]
      return this.props.onDrop(org).then(() => this.toggleConfirm())
    }
    this.toggleSettings = (index) => {
      this.setState({settings: this.state.settings > -1 ? -1 : index})
    }
  }
  renderOrg(org, index) {
    let {settings} = this.state
    let license = org.license === 'active' ? 'org license'
      : org.license === 'trial' ? 'trial license'
      : null
    return (
      <div key={index} className='org'>
        <div className='orgbody'>
          <i className='fa fa-5x fa-university'/>
          <div className='name'>{org.name}</div>
          <div className='labels'>
            <span className='label label-info'>{org.role}</span>
            <span className='label label-info'>{license}</span>
          </div>
        </div>
        <div className='orgactions'>
          <Link to={'/view/' + org.id} className='btn btn-default'>{'View'}</Link>
          <button type='button' className='btn btn-default' data-index={index} onClick={this.toggleConfirm}>
            {'Leave'}
          </button>
          {org.role === 'admin' && <button type='button' className='btn btn-default' data-index={index} onClick={() =>this.toggleSettings(index)}>
            {'Settings'}
          </button>}
        </div>
        {settings === index && <SettingsModal
          orgId={org.id}
          onClose={() => this.toggleSettings(index)}
        />}
      </div>
    )
  }
  renderConfirm() {
    return (
      <ConfirmationModal onClose={this.toggleConfirm} onSubmit={this.drop}>
        <p>
          <strong>{'This is dangerous. Are you sure?'}</strong>
          {' You will lose access to any courses and exam results in this organization.'}
        </p>
      </ConfirmationModal>
    )
  }
  render() {
    let {orgs} = this.props
    let {err} = this.state
    let isDropping = this.state.dropping !== -1
    return (
      <div className='org-list'>
        <h4>{'My Organizations'}</h4>
        {err && <Info>{err.message}</Info>}
        <div className='orgs'>{orgs && orgs.map(this.renderOrg, this)}</div>
        <Link to='/settings/orgs/new'>{'Add Organization'}</Link>
        {isDropping && this.renderConfirm()}
      </div>
    )
  }
}
OrgList.propTypes = {
  orgs: PropTypes.arrayOf(PropTypes.object),
  onDrop: PropTypes.func.isRequired,
}
