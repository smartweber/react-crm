import React from 'react'
import {find} from 'lodash'
import {connectWith} from '../model'
import {Redirect} from 'react-router'
import UnknownRoute from './UnknownRoute'
import {Button} from './misc'
import {Link} from 'react-router-dom'
import CourseCreator from './CourseCreator'
import UserManager from './UserManager'
import CourseList from './CourseList'
import api from '../api'
import TagManager from './TagManager'
import TrialOrgAlert from './TrialOrgAlert'
import TrialStudentAlert from './TrialStudentAlert'
import OrgSelector from './OrgSelector'
import {getPermissions} from '../util/helpers'

const COURSE_PAGE_SIZE = 20

/**
 * View & manage a single organization, including:
 * - a course list
 * - user management
 */
export class OrgViewer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      creating: false,
      viewingUsers: false,
      viewingTags: false,
    }

    // eslint-disable-next-line eqeqeq
    this.isAdmin = (this.props.org && this.props.org.role === 'admin')
    this.isInstructor = (this.props.org && this.props.org.role === 'instructor')
    this.loadTags = this.loadTags.bind(this)
    this.toggleTags = this.toggleTags.bind(this)
    this.updateTag = this.updateTag.bind(this)
    this.toggleCourseCreator = () => this.setState({creating: !this.state.creating})
    this.toggleUsers = () => this.setState({viewingUsers: !this.state.viewingUsers})
    this.loadUsers = ({first, after}) => {
      let {orgId} = this.props.match.params
      return api.orgs.listUsers({orgId, first, after})
    }
    this.updateUser = user => {
      let {orgId} = this.props.match.params
      return api.orgs.updateUser({...user, orgId})
    }
    this.addUsers = users => {
      let {orgId} = this.props.match.params
      return api.orgs.addUsers({orgId, users})
    }
    this.dropUser = email => {
      let {orgId} = this.props.match.params
      return api.orgs.removeUser({orgId, email})
    }
    this.loadCourses = () => {
      let {orgId} = this.props.match.params
      return api.courses.list({orgId, first: COURSE_PAGE_SIZE, after: null})
    }
    this.createCourse = (fields) => {
      let {orgId} = this.props.match.params
      return api.courses.create({...fields, orgId}).then(course => {
        this.props.gotoCourse(course)
        return null
      })
    }
  }
  loadTags() {
    return api.courses.listTags({orgId: this.props.org.id})
  }
  toggleTags() {
    this.setState({viewingTags: !this.state.viewingTags})
  }
  updateTag(label, prev) {
    return api.courses.updateTag({orgId: this.props.org.id, label, prev})
  }
  renderAdminButtons(permissions) {
    // <Button icon='fa-fw fa-users' label='Manage Students' disabled/>
    return (
      <div className='btn-group-vertical action-panel'>
        {permissions.isMultiUser
          ? <Link className='btn btn-default' to={'/scan/' + this.props.org.id}>
            <i aria-hidden='true' className='fa fa-fw fa-barcode'/>
            {' Scan Station'}
          </Link>
          : <Button icon='fa-fw fa-barcode' label='Scan Station' disabled/>
        }
        <Button icon='fa-fw fa-tag' label='Manage Depts' onClick={this.toggleTags}
          disabled={!permissions.isMultiUser}/>
        <Button icon='fa-fw fa-user' label='Manage Users' onClick={this.toggleUsers}
          disabled={!permissions.isMultiUser}/>
        <Button icon='fa-fw fa-plus' label='Create Course' onClick={this.toggleCourseCreator}/>
      </div>
    )
  }
  renderInstructorButtons() {
    return (
      <div className='btn-group-vertical action-panel'>
        <Button icon='fa-fw fa-plus' label='Create Course' onClick={this.toggleCourseCreator}/>
      </div>
    )
  }
  render() {
    let {user, org} = this.props
    if (!org) return <UnknownRoute/>
    if (org.role === 'scan') return <Redirect to={'/scan/' + org.id}/>
    let {creating, viewingUsers, viewingTags} = this.state
    let permissions = getPermissions(org, user)
    return (
      <main className='container org-viewer'>
        <h4 className='header'>{org.name}</h4>
        <OrgSelector orgs={this.props.orgs} value={this.props.org}/>
        {permissions.isUnlicensedStudent ?
          org.license === 'deferred' && org.role !== 'student' ? null : <TrialStudentAlert/>
          : permissions.isTrialOrg && permissions.isAdmin ? <TrialOrgAlert/> : null}
        {this.isAdmin ? this.renderAdminButtons(permissions) : this.isInstructor ? this.renderInstructorButtons() : null}
        <CourseList orgId={org.id} onLoadAuthStatus={this.props.onLoadAuthStatus} onLoad={this.loadCourses}/>
        {creating && <CourseCreator
          onClose={this.toggleCourseCreator}
          onSubmit={this.createCourse}
          onListTags={this.loadTags}
        />}
        {viewingUsers && <UserManager
          onLoad={this.loadUsers}
          onClose={this.toggleUsers}
          onSubmitUpdate={this.updateUser}
          onSubmitAdd={this.addUsers}
          onSubmitDrop={this.dropUser}
        />}
        {viewingTags && <TagManager
          onClose={this.toggleTags}
          onLoad={this.loadTags}
          onSubmit={this.updateTag}
        />}
      </main>
    )
  }
}

export default connectWith(OrgViewer, {
  user: 'auth.data',
  orgs: 'auth.data.organizations',
  org: (state, props) => {
    let orgs = state.auth.data && state.auth.data.organizations
    let orgId = props.match.params.orgId
    // eslint-disable-next-line eqeqeq
    return find(orgs, org => org.id == orgId)
  }
}, {
  gotoCourse: 'gotoCourse',
  onLoadAuthStatus: 'loadAuthStatus',
})
