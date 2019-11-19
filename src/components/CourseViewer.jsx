import React from 'react'
import Link from 'react-router-dom/Link'
import {find, findIndex} from 'lodash'
import Promise from '../util/promise'
import {connectWith} from '../model'
import api from '../api'
import update from '../util/update'
import {formatTimeRange} from './DayPicker'
import ExamCreator from './ExamCreator'
import ExamViewer from './ExamViewer'
import CourseEditor from './CourseEditor'
import RosterEditor from './RosterEditor'
import AssistantEditor from './AssistantEditor'
import {Info, Button} from './misc'
import TrialOrgAlert from './TrialOrgAlert'
import TrialStudentAlert from './TrialStudentAlert'
import {getPermissions} from '../util/helpers'

const TRIAL_MAX_STUDENTS = parseInt(process.env.TRIAL_MAX_STUDENTS)
const TEACH_MAX_STUDENTS = parseInt(process.env.TEACH_MAX_STUDENTS)
const EXAM_SORT_PREDICATE = (a, b) => (a.date < b.date) ? -1 : (b.date < a.date) ? 1 : 0

/**
 * Manage a specific course, including things like:
 * - listing exams
 * - updating course details
 * - managing students and assistants
 */
export class CourseViewer extends React.Component {
  constructor(props) {
    super(props)
    this._pending = null
    this.state = {
      loading: true,
      err: null,
      course: null,
      exams: null,
      creating: false,
      editing: false,
      editingAssistants: false,
      viewingExamId: null,
      upcomingExamId: null
    }
    this.loadTags = this.loadTags.bind(this)
    this.toggleAssistants = () => {
      this.setState({editingAssistants: !this.state.editingAssistants})
    }
    this.toggleExamCreator = () => {
      this.setState({creating: !this.state.creating})
    }
    this.toggleCourseEditor = () => {
      this.setState({editing: !this.state.editing})
    }
    this.toggleRoster = () => {
      this.setState({editingRoster: !this.state.editingRoster})
    }
    this.updateCourse = (fields) => {
      let {orgId, courseId} = this.props.match.params
      return api.courses.update({
        ...fields, orgId, courseId,
        timeStart: fields.time && fields.time[0],
        timeEnd: fields.time && fields.time[1],
      })
      .then(course => {
        this.setState({editing: false, course})
      })
    }
    this.deleteCourse = () => {
      let {orgId, courseId} = this.props.match.params
      return api.courses.remove({orgId, courseId}).then(() => {
        this.props.gotoOrg(orgId, courseId)
        return null
      })
    }
    this.createExam = (fields) => {
      let {orgId, courseId} = this.props.match.params
      return api.exams.create({...fields, orgId, courseId})
      .then(exam => {
        let exams = update(this.state.exams, {$unshift: [exam]})
        this.setState({creating: false, viewingExamId: exam.id, exams})
        this.calculateUpcomingExam()
      })
    }
    this.deleteExam = () => {
      let {orgId, courseId} = this.props.match.params
      let {viewingExamId} = this.state
      let index = findIndex(this.state.exams, exam => exam.id === viewingExamId)
      return api.exams.remove({orgId, courseId, examId: viewingExamId}).then(() => {
        let exams = update(this.state.exams, {$splice: [[index, 1]]})
        this.setState({exams})
        this.calculateUpcomingExam()
      })
    }
    this.updateExam = (fields) => {console.log(fields)
      let {orgId, courseId} = this.props.match.params
      let {viewingExamId} = this.state
      let index = findIndex(this.state.exams, exam => exam.id === viewingExamId)
      return api.exams.update({
        ...fields,
        orgId,
        courseId,
        examId: viewingExamId
      })
      .then(exam => {
        let exams = update(this.state.exams, {[index]: {$set: exam}})
        this.setState({exams})
        return exam
      })
    }
    this.toggleExamViewer = (viewingExamId) => {
      if (viewingExamId === this.state.viewingExamId) {
        viewingExamId = null
      }
      this.setState({viewingExamId})
    }
    this.deleteStudent = (studentId) => {
      let {orgId, courseId} = this.props.match.params
      return api.courses.removeStudent({orgId, courseId, studentId})
    }
    this.addStudents = (students) => {
      let {orgId, courseId} = this.props.match.params
      return api.courses.addStudents({orgId, courseId, students})
    }
    this.listStudents = () => {
      let {orgId, courseId} = this.props.match.params
      return api.courses.listStudents({orgId, courseId})
    }
  }
  loadTags() {
    return api.courses.listTags({orgId: this.props.match.params.orgId})
  }
  forceTimezoneToUTC(date) {
    return new Date(new Date(date).getTime() + (new Date().getTimezoneOffset() * 60 * 1000))
  }
  calculateUpcomingExam() {
    let {exams} = this.state
    let upcomingId = null
    let upcommingDate = null
    let today = new Date()

    if (exams) {
      for(let i = 0; i < exams.length; i ++) {
        let date = this.forceTimezoneToUTC(exams[i].date)
        let minWindowDate = this.forceTimezoneToUTC(exams[i].date)
        let maxWindowDate = this.forceTimezoneToUTC(exams[i].date)
        minWindowDate = new Date(new Date(minWindowDate.setDate(minWindowDate.getDate() - 1)).setHours(20))
        maxWindowDate = new Date(maxWindowDate.setHours(20))

        if (today >= minWindowDate && today <= maxWindowDate) {
          upcomingId = exams[i].id
          break
        } else if (date > today) {
          if (!upcomingId) {
            upcomingId = exams[i].id
            upcommingDate = exams[i].date
          } else if (new Date(exams[i].date) < new Date(upcommingDate)) {
            upcomingId = exams[i].id
            upcommingDate = exams[i].date
          }
        }
      }
    }

    this.setState({upcomingExamId: upcomingId})
  }
  componentDidMount() {
    let {orgId, courseId, examId} = this.props.match.params
    let examPromise = examId ? api.exams.get({orgId, courseId, examId}) : api.exams.list({orgId, courseId})
    this._pending = Promise.all([
      api.courses.get({orgId, courseId}),
      examPromise,
    ]).then(res => {
      this._pending = null
      let exams = []
      if (examId) {
        let {date, id, name} = res[1]
        exams = [{date, id, name}]
      } else {
        exams = res[1].exams
      }
      this.setState({loading: false, course: res[0], exams})
      this.calculateUpcomingExam()
    }).catch(err => {
      if (err.statusCode === 401) {
        this.props.onLoadAuthStatus()
        return null
      }
      this._pending = null
      this.setState({loading: false, err})
    })
  }
  componentWillUnmount() {
    if (this._pending) this._pending.cancel()
  }
  renderAdminButtons(org, course, permissions) {
    let {creating, editing, editingRoster, editingAssistants} = this.state
    let {aides} = this.state.course
    return (
      <div className='btn-group-vertical action-panel'>
        <Link className='btn btn-default' to={'/view/' + org.id}>
          <i aria-hidden='true' className='fa fa-fw fa-university'/>
          {' Your Courses'}
        </Link>
        <Button icon='fa-fw fa-plus' label='Create Exam' onClick={this.toggleExamCreator}/>
        <Button icon='fa-fw fa-users' label='Manage Students' onClick={this.toggleRoster}/>
        <Button icon='fa-fw fa-user-plus' label='Manage Assistants' onClick={this.toggleAssistants}/>
        <Button icon='fa-fw fa-edit' label='Edit Course' onClick={this.toggleCourseEditor}/>
        {editingAssistants && <AssistantEditor
          onClose={this.toggleAssistants}
          onSubmit={this.updateCourse}
          data={aides}
        />}
        {!creating ? null : <ExamCreator
          onClose={this.toggleExamCreator}
          onSubmit={this.createExam}
        />}
        {!editing ? null : <CourseEditor
          data={course}
          onClose={this.toggleCourseEditor}
          onSubmit={this.updateCourse}
          onDelete={this.deleteCourse}
          onListTags={this.loadTags}
        />}
        {!editingRoster ? null : <RosterEditor
          maxStudents={permissions.isTrialOrg ? TRIAL_MAX_STUDENTS
            : permissions.isTeacherOrg ? TEACH_MAX_STUDENTS
            : void 0}
          onDeleteStudent={this.deleteStudent}
          onAddStudents={this.addStudents}
          onListStudents={this.listStudents}
          onClose={this.toggleRoster}
        />}
      </div>
    )
  }
  renderStudentButtons(org) {
    return (
      <div className='btn-group-vertical action-panel'>
        <Link className='btn btn-default' to={'/view/' + org.id}>
          <i aria-hidden='true' className='fa fa-fw fa-university'/>
          {' Your Courses'}
        </Link>
      </div>
    )
  }
  renderError(message) {
    return (
      <main className='container' style={{textAlign: 'center', paddingTop: '50px'}}>
        <Info>{message}</Info>
      </main>
    )
  }
  renderExams(org, course, permissions) {
    let {user} = this.props
    let {viewingExamId, upcomingExamId, exams} = this.state
    if (!exams || exams.length < 1) return (
      <div className='exams'>
        <h5>{'No exams found'}</h5>
        <div className='list'>
          <div className='listitem'>
            <p>{'Any exams added to this course will be listed here.'}</p>
          </div>
        </div>
      </div>
    )
    return (
      <div className='exams'>
        <h5 aria-level="2">
          {user.ltiLaunchActive ? null : 'Exams '}
          <small>select <i aria-hidden='true' className='fa fa-file-pdf-o'/> to download answer sheets{user.ltiLaunchActive ? null : ' for the upcoming exam'}</small>
        </h5>
        <div className='list'>
          {exams.sort(EXAM_SORT_PREDICATE).map(row => (
            <ExamViewer
              {...row}
              key={row.id}
              orgId={org.id}
              orgRole={org.role}
              courseId={course.id}
              isUpcomingExam={row.id === upcomingExamId}
              permissions={permissions}
              ltiLaunchActive={user.ltiLaunchActive}
              onToggle={this.toggleExamViewer}
              expanded={row.id === viewingExamId}
              onUpdate={this.updateExam}
              onDelete={this.deleteExam}
            />
          ))}
        </div>
      </div>
    )
  }
  render() {
    let {err, loading, course} = this.state
    let {user, org} = this.props
    if (loading) return CourseViewer.LOADING_PLACEHOLDER
    if (err) return this.renderError(err.message)
    let permissions = getPermissions(org, user, course)
    return (
      <main className='container course-viewer'>
        {user.ltiLaunchActive ? null :
          <h4 className='header'>
            <span>{course.shortName + ' ' + course.name}</span>
            <div>
              <small>{course.term + ' ' + course.year}</small>
              <small>{formatTimeRange(course.days, course.timeStart, course.timeEnd)}</small>
            </div>
            <div>
              <small>{'ID ' + course.id}</small>
            </div>
          </h4>}
        {permissions.isUnlicensedStudent ?
          org.license === 'deferred' && org.role !== 'student' ? null : <TrialStudentAlert/>
          : permissions.isTrialOrg && permissions.isAdmin ? <TrialOrgAlert/> : null}
        {user.ltiLaunchActive ? null : permissions.isAdmin ? this.renderAdminButtons(org, course, permissions) : this.renderStudentButtons(org)}
        {this.renderExams(org, course, permissions)}
      </main>
    )
  }
}

CourseViewer.LOADING_PLACEHOLDER = (
  <main aria-hidden='true' className='container course-viewer --loading'>
    <h4 className='header'>
      <span>{'CS100 Introduction to Computing'}</span>
      <div><small>{'Spring 1970 Tu Th 8:00-9:00'}</small></div>
    </h4>
    <div className='btn-group-vertical action-panel'>
      <Button icon='fa-fw fa-university' label='Your Courses' disabled/>
    </div>
    <div className='exams'>
      <h5>{'Exams'}</h5>
      <div className='list'>
        <div className='listitem'>
          <span className='cell'></span>
          <span className='cell date'>{'1970-01-01'}</span>
          <span className='cell name'>{'Quiz 1'}</span>
          <i className='cell fa fa-caret-right'/>
        </div>
        <div className='listitem'>
          <span className='cell'></span>
          <span className='cell date'>{'1970-01-01'}</span>
          <span className='cell name'>{'Quiz 1'}</span>
          <i className='cell fa fa-caret-right'/>
        </div>
        <div className='listitem'>
          <span className='cell'></span>
          <span className='cell date'>{'1970-01-01'}</span>
          <span className='cell name'>{'Quiz 1'}</span>
          <i className='cell fa fa-caret-right'/>
        </div>
      </div>
    </div>
  </main>
)

export default connectWith(CourseViewer, {
  // From <Route>: match, location, history
  user: 'auth.data',
  orgs: 'auth.data.organizations',
  org: (state, props) => {
    let orgs = state.auth.data && state.auth.data.organizations
    let orgId = props.match.params.orgId
    // eslint-disable-next-line eqeqeq
    return find(orgs, org => org.id == orgId)
  }
}, {
  gotoOrg: 'gotoOrg',
  onLoadAuthStatus: 'loadAuthStatus',
})
