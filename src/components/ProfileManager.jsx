import React from 'react'
import {findIndex} from 'lodash'
import {connectWith} from '../model'
import api from '../api'
import AccountSecurity from './AccountSecurity'
import AccountInfo from './AccountInfo'
import OrgList from './OrgList'
import StudentBillingOverview from './StudentBillingOverview'

/**
 * Here you can change your Full Name, Nickname, email & password
 * as well as list the Organizations of which you're a member.
 * TODO list & destroy browser sessions
 */
export class ProfileManager extends React.Component {
  updatePayment = (data) => {
    return api.users.setPayment(data)
  }
  loadPayment = () => {
    return api.users.getPayment().catch(err => {
      if (err.statusCode === 404) return null
      else throw err
    })
  }
  updateAccountInfo = (fields) => {
    return api.users.update(Object.assign({}, this.props.user, fields)).then(user => {
      this.props.onUpdateProfile(user)
      return null
    })
  }
  updatePasswd = (fields) => {
    return api.users.updatePasswd(fields)
  }
  updateEmail = (fields) => {
    return api.users.updateEmail(fields).then(user => {
      this.props.onUpdateProfile(user)
      return null
    })
  }
  dropOrg = (org) => {
    let organizations = this.props.user.organizations
    let index = organizations.indexOf(org)
    let orgId = organizations[index].id
    organizations = organizations.slice(0)
    organizations.splice(index, 1)
    return api.orgs.removeUser({orgId, email: 'me'}).then(() => {
      this.props.onUpdateProfile({organizations})
      return null
    })
  }
  updateOrg = (orgId, license) => {
    return api.orgs.update({orgId, license})
    .then(res => {
      let organizations = this.props.user.organizations.slice(0)
      let index = findIndex(organizations, org => org.id === res.id)
      organizations.splice(index, 1, res)
      this.props.onUpdateProfile({organizations})
    })
  }

  render() {
    let {user} = this.props
    return (
      <main className='container profile-manager'>
        <h4 className='header'>
          {'My Account Settings'}
        </h4>
        <div className='body'>
          {!user.ltiLaunchActive &&
          <AccountInfo user={user} onSubmit={this.updateAccountInfo}/>}
          {!user.ltiLaunchActive &&
          <AccountSecurity user={user}
          onSubmitPasswd={this.updatePasswd} onSubmitEmail={this.updateEmail}/>
          }
        </div>
        {process.env.ENABLE_BILLING &&
        <StudentBillingOverview
          onUpdateOrg={this.updateOrg}
          onLoadPayment={this.loadPayment}
          onUpdatePayment={this.updatePayment}
          onUpdate={this.updateAccountInfo}
          user={user}/>
        }
        {!user.ltiLaunchActive &&
        <OrgList orgs={user.organizations} onDrop={this.dropOrg}/>
        }
      </main>
    )
  }
}

export default connectWith(ProfileManager, {
  // mapStateToProps
  user: 'auth.data' // {name, nickname, email, organizations}
}, {
  // mapActionsToProps
  onUpdateProfile: 'updateProfile',
})
