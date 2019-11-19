import React from 'react'
import FileInput from './FileInput'
import {Info, Button} from './misc'
import api from '../api'
import PDFUploader from './PDFUploader'
import ExamEditor from './ExamEditor'
import AnswerEditor from './AnswerEditor'
import ExamReport from './ExamReport'
import PrintInstructions from './PrintInstructions'
import ExamGrader from './ExamGrader'
import StudentCorrections from './StudentCorrections'
import MyGrade from './MyGrade'
import ResponseVerifier from './ResponseVerifier'
import UploadStatusTable from './UploadStatusTable'
import Modal from './Modal'

const TRIAL_MAX_QUESTIONS = parseInt(process.env.TRIAL_MAX_QUESTIONS)
const TEACH_MAX_QUESTIONS = parseInt(process.env.TEACH_MAX_QUESTIONS)
const MAX_UPLOAD_BYTES = parseInt(process.env.MAX_UPLOAD_BYTES)
const MAX_UPLOAD_MB = Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)
const DEFAULT_STATE = {
  examDetailPending: null,
  examBatchesPending: null,
  preloadPdfPending: null,
  pendingUpload: null,
  loadedExamDetail: false,
  loadedExamBatches: false,
  editing: false,
  editingAnswers: false,
  analyzing: false,
  myGrade: false,
  correcting: false,
  printing: false,
  grading: false,
  verifying: false,
  expanded: false,
  showPdfAlert: false,
  err: null,
  files: null,
  pdfErrorMsg: '',
  uploads: [],
  loadExamTimerHandler: null,
  data: {answerKeys: {}, gradingScale: null, unverified: 0, verified: 0, duplicates: 0}
}

export default class ExamViewer extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = DEFAULT_STATE
    this.toggle = this.toggle.bind(this)
    this.upload = this.upload.bind(this)
    this.loadExamBatches = this.loadExamBatches.bind(this)
    this.loadExamData = this.loadExamData.bind(this)
    this.destoryLoadExam = this.destoryLoadExam.bind(this)
    this.toggleExamEditor = toggleFoo(this, 'editing')
    this.toggleAnswerEditor = toggleFoo(this, 'editingAnswers')
    this.toggleUploadStatusTable = toggleFoo(this, 'uploadStatusTable')
    this.toggleReport = toggleFoo(this, 'analyzing')
    this.toggleCorrections = toggleFoo(this, 'correcting')
    this.togglePrint = toggleFoo(this, 'printing')
    this.toggleGrading = toggleFoo(this, 'grading')
    this.toggleMyGrade = toggleFoo(this, 'myGrade')
    this.toggleVerifier = (evt, changed) => {
      this.setState({verifying: !this.state.verifying})
      if (changed && this.state.verifying) this.loadExamDetails()
    }
    this.loadUnverified = () => {
      let {orgId, courseId, id: examId} = this.props
      return api.exams.getUnverified({orgId, courseId, examId})
    }
    this.verifyResponses = (id, studentId, answerKeyId, answers) => {
      let {orgId, courseId, id: examId} = this.props
      return api.exams.verify({
        orgId, courseId, examId,
        id, studentId, answerKeyId, answers,
        preferred: true
      })
    }
    this.loadReport = () => {
      let {orgId, courseId, id: examId} = this.props
      return api.exams.getReport({orgId, courseId, examId})
    }
    this.updateDetails = (fields, fullUpdate) => {
      let {name, date, id} = this.props
      return this.props.onUpdate({id, name, date, ...this.state.data, ...fields})
      .then(data => {
        this.setState({data, editing: false, editingAnswers: false, grading: false})
        if (fullUpdate) this.props.onUpdate(data)
        return null
      })
    }
    this.downloadSheets = (filled) => {
      let {orgId, courseId, id: examId} = this.props
      let url = api.exams.getSheetsURL({orgId, courseId, examId, filled})
      let pdfWindowStuff = window.open('', '_blank')
      window.focus()
      let preloadPdfPending = api.exams.checkSheetsUrl({url})
      .then(() => {
        pdfWindowStuff.location.href = url
        this.setState({preloadPdfPending: null})
      })
      .catch(() => {
        const bodyStyle = 'display: flex;align-items: center;justify-content: center;';
        const pStyle = 'background-color: #d9edf7;border-color: #bce8f1;color: #31708f;padding: 15px;margin-bottom: 20px;border: 1px solid transparent;border-radius: 0;display: inline-block;'
        const helpMsg = 'The requested Answer Sheets aren\'t available yet. Please check again in 10 minutes & verify that the Course roster is not empty.'
        let documentContent = ('<html><head><title>Help Notification</title></head><body style="' + bodyStyle + '">')
        documentContent += ('<p style="' + pStyle + '">' + helpMsg + '</p>')
        documentContent += '</body></html>'
        pdfWindowStuff.document.write(documentContent)
        this.setState({
          preloadPdfPending: null
        })
      })
      this.setState({preloadPdfPending})
    }
    this.onClosePdfAlert = () => {
      this.setState({showPdfAlert: false})
    }
  }
  componentDidMount() {
    let {expanded} = this.props
    this.setState({expanded})
  }
  componentWillReceiveProps(nextProps) {
    let {expanded} = nextProps
    if (!expanded && this.state.expanded) {
      this.destoryLoadExam()
    }
    if(expanded && this.state.expanded) {
      this.setState({loadedExamDetail: true, loadedExamBatches: true})
    }
    this.setState({expanded})
  }
  componentWillUnmount() {
    if (this.state.pendingUpload) this.state.pendingUpload.cancel()
    this.destoryLoadExam()
  }
  destoryLoadExam(upload = false) {
    if (!upload) this.setState({loadedExamDetail: false, loadedExamBatches: false})
    if (this.state.examDetailPending) this.state.examDetailPending.cancel()
    if (this.state.examBatchesPending) this.state.examBatchesPending.cancel()
    if (this.state.preloadPdfPending) this.state.preloadPdfPending.cancel()
    if (this.state.loadExamTimerHandler) {
      clearInterval(this.state.loadExamTimerHandler)
      this.setState({loadExamTimerHandler: null})
    }
  }
  loadExamData(isRealTime = false) {
    if (!isRealTime || isRealTime && !this.state.examBatchesPending) this.loadExamBatches()
    if (!isRealTime || isRealTime && !this.state.examDetailPending) this.loadExamDetails()
  }
  loadExamBatches() {
    let {orgId, courseId, id: examId} = this.props
    if (this.state.examBatchesPending) this.state.examBatchesPending.cancel()
    let examBatchesPending = api.exams.getBatches({orgId, courseId, examId})
      .then(uploads => {
        if (!uploads) {
          uploads = []
        }
        this.setState({
          examBatchesPending: null,
          loadedExamBatches: true,
          uploads
        })
      })
      .catch(err => {
        this.setState({
          examBatchesPending: null,
          loadedExamBatches: true
        })
      })
      this.setState({examBatchesPending})
  }
  loadExamDetails() {
    let {orgId, courseId, id: examId} = this.props
    if (this.state.examDetailPending) this.state.examDetailPending.cancel()
    let examDetailPending = api.exams.get({orgId, courseId, examId})
    .then(exam => {
      this.setState({
        examDetailPending: null,
        err: null,
        loadedExamDetail: true,
        data: exam
      })
    })
    .catch(err => {
      this.setState({
        examDetailPending: null,
        loadedExamDetail: true
      })
    })
    this.setState({examDetailPending})
  }
  preventDefault(evt) {
    evt.preventDefault()
  }
  toggle(evt) {
    let {permissions, expanded, onToggle, id: examId} = this.props
    evt.preventDefault()
    if (permissions.isUnlicensed) {
      return
    }
    this.destoryLoadExam()
    if (expanded) {
      this.setState({
        examDetailPending: null
      })
      onToggle(this.props.id)
    }
    else if (permissions.isAdmin) {
      this.loadExamData()
      let loadExamTimerHandler = setInterval(()=> this.loadExamData(true), 10000)
      this.setState({loadExamTimerHandler})
      onToggle(examId)
    }
    else {
      this.toggleMyGrade()
    }
  }
  upload(nextFiles) {
    let [files, pendingUpload] = PDFUploader.upload({
      orgId: this.props.orgId,
      courseId: this.props.courseId,
      examId: this.props.id,
      prevUpload: this.state.pendingUpload,
      prevFiles: this.state.files,
      files: nextFiles,
      element: this
    })
    pendingUpload.catch(err => {
      this.setState({err})
    })
    pendingUpload.then(() => {
      this.destoryLoadExam(true)
      let loadExamTimerHandler = setInterval(() => this.loadExamData(true), 10000)
      this.setState({loadExamTimerHandler})
    })
    this.setState({files, pendingUpload})
  }
  renderDetails() {
    let {err, files, editing, editingAnswers, analyzing, grading, correcting, verifying, uploadStatusTable, uploads} = this.state
    let {orgRole, permissions, date, name, ltiLaunchActive, orgId, courseId, id} = this.props
    let {answerKeys, unverified, verified, gradingScale, autoReleaseGrades} = this.state.data
    if (err) return <Info>{err.message}</Info>
    let canViewReports = verified && (answerKeys && Object.keys(answerKeys).length)
    return (
      <div className='exam-view' title='Exam view'>
        <FileInput className='file-input' multiple accept='application/pdf,.pdf' onChange={this.upload}>
          <div className='detail'>
            <p>{'Upload student answer sheets. Click to browse for files. Or just drag & drop.'}</p>
            <i aria-hidden='true' className='fa fa-upload'/>
            <div>
              {' Each file should be a'}
              <strong>{` 200 dpi, black & white, PDF in US letter dimensions, less than ${MAX_UPLOAD_MB} MB.`}</strong>
              {' Following these guidelines will generally allow up to 50 pages per file.'}
            </div>
          </div>
        </FileInput>
        <div className='btn-group-vertical action-panel'>
          <Button icon='fa-fw fa-key' label='Edit Answer Keys' onClick={this.toggleAnswerEditor}/>
          <button type='button' className='btn btn-default' disabled={uploads.length === 0}  onClick={this.toggleUploadStatusTable}>
            <i aria-hidden='true' className='fa fa-fw fa-files-o'/>
            {' Upload Status '}
            {uploads.length > 0 ? <span className='badge'>{uploads.length}</span> : null}
          </button>
          <button type='button' className='btn btn-default' disabled={!unverified} onClick={this.toggleVerifier}>
            <i aria-hidden='true' className='fa fa-fw fa-search'/>
            {' Verify Responses '}
            <span className='badge'>{unverified || null}</span>
          </button>
          <Button icon='fa-fw fa-eraser' label='Analyze Students' disabled={!canViewReports} onClick={this.toggleCorrections}/>
          <Button icon='fa-fw fa-area-chart' label='Analyze Exam' disabled={!canViewReports} onClick={this.toggleReport}/>
          <Button icon='fa-fw fa-bar-chart' label='Assign Grades' disabled={!canViewReports} onClick={this.toggleGrading}/>
          {!ltiLaunchActive &&
            <Button icon='fa-fw fa-pencil-square-o' label='Edit Exam' onClick={this.toggleExamEditor}/>
          }
        </div>
        {files && <PDFUploader.Files scanStation={false} orgRole={orgRole} files={files}/>}
        {!files && this.renderAlert()}
        {verifying && <ResponseVerifier
          ltiLaunchActive={ltiLaunchActive}
          onLoad={this.loadUnverified}
          onSubmit={this.verifyResponses}
          onClose={this.toggleVerifier}
        />}
        {correcting && <StudentCorrections
          ltiLaunchActive={ltiLaunchActive}
          onLoad={this.loadReport}
          onClose={this.toggleCorrections}
          onSubmit={this.verifyResponses}
        />}
        {grading && <ExamGrader
          ltiLaunchActive={ltiLaunchActive}
          data={gradingScale}
          orgId={orgId}
          courseId={courseId}
          examId={id}
          onLoad={this.loadReport}
          onClose={this.toggleGrading}
          onSubmit={this.updateDetails}
        />}
        {analyzing && <ExamReport
          ltiLaunchActive={ltiLaunchActive}
          onLoad={this.loadReport}
          onClose={this.toggleReport}
        />}
        {!editingAnswers ? null : <AnswerEditor
          ltiLaunchActive={ltiLaunchActive}
          data={answerKeys}
          onClose={this.toggleAnswerEditor}
          onSubmit={this.updateDetails}
          maxKeys={permissions.isTrialOrg ? 1 : void 0}
          maxQuestions={permissions.isTrialOrg ? TRIAL_MAX_QUESTIONS
            : permissions.isTeacherOrg ? TEACH_MAX_QUESTIONS
            : void 0}
        />}
        {uploadStatusTable && <UploadStatusTable
          ltiLaunchActive={ltiLaunchActive}
          data={uploads}
          onClose={this.toggleUploadStatusTable}
        />}
        {!editing ? null : <ExamEditor
          ltiLaunchActive={ltiLaunchActive}
          data={{name, date, autoReleaseGrades}}
          onClose={this.toggleExamEditor}
          onDelete={this.props.onDelete}
          onSubmit={this.updateDetails}
        />}
      </div>
    )
  }
  renderPdfAlert() {
    let {pdfErrorMsg} = this.state
    let {ltiLaunchActive} = this.props
    return (
      <Modal className='-small' isOpen ltiLaunchActive={ltiLaunchActive} onRequestClose={this.onClosePdfAlert}>
        <h4 className='header' aria-level='2'>{'Help Notification'}</h4>
        <div className='body'>
          <Info>
            {pdfErrorMsg}
          </Info>
        </div>
        <div className='footer'>
          <div className='btn-group pull-right'>
            <Button label='Cancel' onClick={this.onClosePdfAlert}/>
          </div>
          <div style={{clear: 'both'}}/>
        </div>
      </Modal>
    )
  }
  renderAlert() {
    let {id} = this.props
    return(
      <div className='exam-alert'>
        <Info noAttribute>
          <strong>{'Are you uploading to the correct exam?'}</strong>
          <div>
            {'We will score all answer sheets as Exam ID '}
            <strong>{id}</strong>
            {'. If you intend to grade a different exam, please select and upload the file to the correct exam.'}
          </div>
        </Info>
      </div>
    )
  }
  render() {
    let {id, date, name, hasBlanks, expanded, uploadStatus, isUpcomingExam, permissions, ltiLaunchActive} = this.props
    let {printing, myGrade, loadedExamDetail, loadedExamBatches, showPdfAlert, preloadPdfPending} = this.state
    let icon = (loadedExamDetail && loadedExamBatches && expanded || !loadedExamDetail && !loadedExamBatches && !expanded) ? (expanded ? 'fa-caret-down' : 'fa-caret-right') : 'fa-spin fa-spinner'
    const ariaExpanded = loadedExamDetail && loadedExamBatches && expanded ? true : false
    if (!process.env.ENABLE_STATUS_ICONS) {
      hasBlanks = true
      uploadStatus = null
    }
    if (permissions.isUnlicensed) {
      hasBlanks = false
    }
    let statusIcon = permissions.isAdmin && uploadStatus === 'processing'
      ? <i aria-hidden='true' className='fa fa-lg fa-cloud-upload uploadstatus'/>
      : (isUpcomingExam ? <i aria-hidden='true' className='fa fa-lg fa-file-pdf-o blankstatus'/> : <i aria-hidden='true' className='fa fa-lg fa-file-pdf-o grey blankstatus'/>)
      return (
      <div className={`listitem ${ltiLaunchActive ? 'canvas-listitem' : ''}`}>
        <div className='cell date'>
          <a href='#' className='btn btn-link download' disabled={!hasBlanks}
            onClick={this.togglePrint}>
            <i className='sr-only'>{'Download blank answer-sheet PDF'}</i>
            {statusIcon}
          </a>
          <span>{date}</span>
        </div>
        <a
          href='#'
          className='cell name'
          aria-expanded={ariaExpanded}
          disabled={permissions.isUnlicensedStudent}
          onClick={permissions.isUnlicensedStudent ? this.preventDefault : this.toggle}>{name} {`(ID: ${id})`}</a>
        <div className='cell arrow'>
          <i aria-hidden='true' className={'fa ' + icon}/>
        </div>
        {loadedExamDetail && loadedExamBatches && expanded ? this.renderDetails() : null}
        {printing && !showPdfAlert && <PrintInstructions
          onClose={this.togglePrint}
          onSubmit={this.downloadSheets}
          preloadPdfPending={preloadPdfPending}
          ltiLaunchActive={ltiLaunchActive}
          canFill={permissions.isAdmin}
          isUpcomingExam={isUpcomingExam}
          canDownload={!permissions.isUnlicensedStudent}
        />}
        {showPdfAlert && this.renderPdfAlert()}
        {myGrade && <MyGrade
          name={name}
          ltiLaunchActive={ltiLaunchActive}
          onLoad={this.loadReport}
          onClose={this.toggleMyGrade}
        />}
      </div>
    )
  }
}

function toggleFoo(ctx, key) {
  return () => ctx.setState({[key]: !ctx.state[key]})
}
