import React from 'react'
import {withRouter, Route, Redirect, Switch} from 'react-router'
import {connectWith} from '../model'
import {parseQueryString} from '../util/helpers'
import Navbar from './Navbar'
import LoginForm from './LoginForm'
import PWResetForm from './PWResetForm'
import PWChangeForm from './PWChangeForm'
import SignupForm from './SignupForm'
import UnknownRoute from './UnknownRoute'
import WelcomePage from './WelcomePage'
import OrgCreator from './OrgCreator'
import OrgList from './OrgList'
import OrgViewer from './OrgViewer'
import ProfileManager from './ProfileManager'
import CourseViewer from './CourseViewer'
import ScannerHome from './ScannerHome'
import IntegrationError from './IntegrationError'
import LocalStorage from '../util/local-storage'
import {find} from 'lodash'

export class App extends React.Component {
  constructor(props) {
    super(props)
    this.renderMain = this.renderMain.bind(this)
    this.renderWelcome = this.renderWelcome.bind(this)
  }
  componentDidMount() {
    this.props.onMount()
  }
  renderWelcome() {
    let orgs = this.props.auth.data.organizations
    if (orgs.length === 0) return <WelcomePage/>
    let id = LocalStorage.get('App:defaultOrg') || orgs[0].id
    // eslint-disable-next-line eqeqeq
    let defaultOrg = find(orgs, org => org.id == id)
    if (!defaultOrg) id = orgs[0].id
    return <Redirect to={'/view/' + id}/>
  }
  renderMain() {
    let {auth, location} = this.props
    if (!auth.data) {
      let current = location.pathname === '/' ? ''
        : '?to=' + encodeURIComponent(location.pathname + location.search)
      return <Redirect to={'/login' + current}/>
    }
    let orgs = this.props.auth.data.organizations
    return (
      <div>
        {auth.data.ltiLaunchActive ? null : <Navbar onLogout={this.props.onLogout} user={auth.data}/>}
        <Switch>
          <Route exact path='/settings/profile' component={ProfileManager}/>
          <Route exact path='/settings/orgs' render={
            () => <OrgList orgs={orgs}/>
          }/>
          <Route exact path='/settings/orgs/new' render={
            () => <OrgCreator onSubmit={this.props.onOrgCreate}/>
          }/>
          <Route exact path='/view/:orgId' component={OrgViewer}/>
          <Route exact path='/view/:orgId/:courseId' component={CourseViewer}/>
          <Route exact path='/view/:orgId/:courseId/:examId' component={CourseViewer}/>
          <Route exact path='/scan/:orgId' component={ScannerHome}/>
          <Route exact path='/' render={this.renderWelcome}/>
          <Route component={UnknownRoute}/>
        </Switch>
      </div>
    )
  }
  render() {
    let query = parseQueryString(this.props.location.search)
    return <Switch>
      <Route exact path='/login' render={
        () => this.props.auth.data
          ? <Redirect to={query.to || '/'}/>
          : <LoginForm onSubmit={this.props.onLoginWithPW} {...this.props.auth}/>
      }/>
      <Route exact path='/signup' render={
        () => this.props.auth.data
          ? <Redirect to='/'/>
          : <SignupForm />
      }/>
      <Route exact path='/pwreset' render={
        () => query.token != null
          ? <PWChangeForm auth={this.props.auth} token={query.token}/>
          : <PWResetForm/>
      }/>
      <Route exact path='/error/:errorId' render={
        () => <IntegrationError />
      }/>
      <Route render={this.renderMain}/>
    </Switch>
  }
}

export default withRouter(connectWith(App, {
  // from Router: match, location, history
  auth: 'auth',
}, {
  onMount: 'loadAuthStatus',
  onOrgCreate: 'createOrg',
  onLoginWithPW: 'loginWithPW',
  onLogout: 'logout',
}))
