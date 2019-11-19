import React from 'react'
import {find} from 'lodash'
import api from '../api'
import {connectWith} from '../model'
import {REGX_COURSE_ID} from '../util/helpers'
import Promise from '../util/promise'
import SearchBox from './SearchBox'
import {formatTimeRange} from './DayPicker'
import Select from './Select'
import FileInput from './FileInput'
import UnknownRoute from './UnknownRoute'
import PDFUploader from './PDFUploader'
import UsageReport from './UsageReport'
import {Info} from './misc'

const MAX_UPLOAD_BYTES = parseInt(process.env.MAX_UPLOAD_BYTES)
const MAX_UPLOAD_MB = Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)
const ALLOWED_ROLES = ['admin', 'scan']

export class ScannerHome extends React.Component {
  constructor(props) {
    super(props)
    this.toggleReport = this.toggleReport.bind(this)
    this.loadReport = this.loadReport.bind(this)
    this.search = this.search.bind(this)
    this.change = this.change.bind(this)
    this.upload = this.upload.bind(this)
    this.state = {
      pending: null,
      pendingUpload: null,
      err: null,
      course: null,
      exams: null,
      selected: null,
      files: null,
      analyzing: false
    }
  }
  toggleReport() {
    this.setState({analyzing: !this.state.analyzing})
  }
  loadReport(timeStart, timeEnd) {
    return api.orgs.report({orgId: this.props.org.id, timeStart, timeEnd})
  }
  search(query) {
    if (!REGX_COURSE_ID.test(query)) {
      this.setState({err: {message: 'invalid course ID'}})
      return
    }
    if (this.state.pending) {
      this.state.pending.cancel()
    }
    if (this.state.pendingUpload) {
      this.state.pendingUpload.cancel()
    }
    let params = {orgId: this.props.org.id, courseId: query}
    let pending = Promise.join(
      api.courses.get(params),
      api.exams.list(params)
    ).then(([course, {exams}]) => {
      this.setState({
        pending: null,
        err: null,
        course: course,
        exams: exams,
        selected: exams && exams[0]
      })
    }).catch(err => {
      this.setState({pending: null, err: err, course: null, exams: null, selected: null})
    })
    this.setState({pending: pending, pendingUpload: null, files: null})
  }
  change(exam) {
    this.setState({selected: exam})
  }
  upload(nextFiles) {
    let [files, pendingUpload] = PDFUploader.upload({
      orgId: this.props.org.id,
      courseId: this.state.course.id,
      examId: this.state.selected.id,
      prevUpload: this.state.pendingUpload,
      prevFiles: this.state.files,
      files: nextFiles,
      element: this
    })
    pendingUpload.catch(err => {
      this.setState({err})
    })
    this.setState({files, pendingUpload})
  }
  componentWillUnmount() {
    if (this.state.pending) {
      this.state.pending.cancel()
    }
    if (this.state.pendingUpload) {
      this.state.pendingUpload.cancel()
    }
  }
  renderExamPicker() {
    if (!this.state.selected) return (
      <p>{'No exams found for this course.'}</p>
    )
    return (
      <div className='picker'>
        <Select opt={this.state.exams} value={this.state.selected}
          labeler='name'
          onChange={this.change}/>
        <FileInput className='file-input' multiple accept='application/pdf' onChange={this.upload}>
          <div className='detail'>
            <p>{'Upload student answer sheets. Click to browse for files. Or just drag & drop.'}</p>
            <i aria-hidden='true' className='fa fa-upload'/>
            <div>
              {' Each file should be a'}
              <strong>{` 200 dpi, black & white, PDF in US letter dimensions, less than ${MAX_UPLOAD_MB} MB.`}</strong>
            </div>
          </div>
        </FileInput>
      </div>
    )
  }
  renderCourse() {
    let {course} = this.state
    return (
      <div className='course'>
        <div className='details'>
          <div className='name'>{course.shortName + ' ' + course.name}</div>
          <small className='time'>{formatTimeRange(course.days, course.timeStart, course.timeEnd)}</small>
          <small className='term'>{course.term + ' ' + course.year}</small>
          <small className='owner'>{course.owner}</small>
        </div>
        {this.renderExamPicker()}
      </div>
    )
  }
  renderAlert() {
    let {selected} = this.state
    return(
      <div className='exam-alert'>
        <Info>
          <strong>{'Are you uploading to the correct exam?'}</strong>
          <div>
            {'Please ensure that the Exam ID is '}
            <strong>{selected.id}</strong>
            {' for all answer sheets.'}
            {' If the Exam ID is different, please select the correct exam to upload the answer sheets.'}
          </div>
        </Info>
      </div>
    )
  }
  render() {
    let org = this.props.org
    if (!org || ALLOWED_ROLES.indexOf(org.role) === -1) return <UnknownRoute/>
    return (
      <div className='scanner-home container'>
        <h2 className='title'>{'Find a course by ID'}</h2>
        <SearchBox autoFocus loading={!!this.state.pending} isError={this.state.err?true:false} onSubmit={this.search}/>
        <div className='action-container'>
          <div className='alert-wrapper'>
            {this.state.err && <Info>{"Sorry, we couldn't find that course ID. Please double check and try again."}</Info>}
          </div>
          <button type='button' className='btn btn-default report' onClick={this.toggleReport}>
            <i aria-hidden='true' className='fa fa-fw fa-bar-chart'/>
            {'Usage Report'}
          </button>
        </div>
        {this.state.course && this.renderCourse()}
        {this.state.files && <PDFUploader.Files scanStation={true} orgRole={org.role} files={this.state.files}/>}
        {this.state.course && !this.state.files && this.state.selected && this.renderAlert()}
        {this.state.analyzing && <UsageReport
          onSubmit={this.loadReport}
          onClose={this.toggleReport}
        />}
      </div>
    )
  }
}

export default connectWith(ScannerHome, {
  org: (state, props) => {
    let orgs = state.auth.data && state.auth.data.organizations
    let orgId = props.match.params.orgId
    // eslint-disable-next-line eqeqeq
    return find(orgs, org => org.id == orgId)
  }
})
