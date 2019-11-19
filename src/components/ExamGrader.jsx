import React from 'react'
import {Info, Button} from './misc'
import Modal from './Modal'
import update from '../util/update'
import api from '../api'

const GRADING_SCALE_EXTENDED = [
  {value: '97.0', label: 'A+'},
  {value: '93.0', label: 'A'},
  {value: '90.0', label: 'A-'},
  {value: '87.0', label: 'B+'},
  {value: '83.0', label: 'B'},
  {value: '80.0', label: 'B-'},
  {value: '77.0', label: 'C+'},
  {value: '73.0', label: 'C'},
  {value: '70.0', label: 'C-'},
  {value: '67.0', label: 'D+'},
  {value: '63.0', label: 'D'},
  {value: '60.0', label: 'D-'},
  {value: '0.0', label: 'F'},
]

/**
 * TODO move this into the ExamReport, replacing the distribution table, updating the density plot (debounced)
 * TODO Confirm submit
 * This component allows a teacher to release student scores/grades
 */
export default class ExamGrader extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      saving: false,
      loading: true,
      err: null,
      students: null,
      gradingScale: transformScaleIn(props.data)
    }
    this.pending = null
    this.reportPending = null
    this.submitPending = null
    this.changeMode = (evt) => {
      if (evt.currentTarget.value === 'raw') {
        this.setState({err: null, gradingScale: null})
      }
      else {
        this.setState({err: null, gradingScale: GRADING_SCALE_EXTENDED})
      }
    }
    this.change = (evt) => {
      let index = evt.target.getAttribute('data-index')
      let key = evt.target.name
      let val = evt.target.value
      this.setState({
        gradingScale: update(this.state.gradingScale, {[index]: {[key]: {$set: val}}})
      })
    }
    this.clear = () => {
      this.setState({gradingScale: transformScaleIn([])})
    }
    this.submitReleaseGrades = (gradingScale, gradeReleaseFormat) => {
      if (this.submitPending) {
        this.submitPending.cancel()
      }
      this.submitPending = this.props.onSubmit({gradingScale, gradeReleaseFormat})
      .catch(err => {
        this.setState({saving: false, err})
      })
    }
    this.submit = () => {
      let gradingScale = transformScaleOut(this.state.gradingScale)
      let {orgId, courseId, examId, ltiLaunchActive} = this.props
      if (gradingScale instanceof Error) {
        this.setState({err: gradingScale})
        return
      }
      let gradeReleaseFormat = gradingScale ? 'Standard/Custom' : 'Raw Score'
      if (ltiLaunchActive) {
        this.reportPending = api.exams.lmsReport({orgId, courseId, examId})
        .then(() => {
          this.submitReleaseGrades(gradingScale, gradeReleaseFormat)
        })
        .catch(() => {
          let err = {
            message: 'LMS report api error.'
          }
          this.setState({saving: false, err})
        })
      } else {
        this.submitReleaseGrades(gradingScale, gradeReleaseFormat)
      }
      this.setState({saving: true})
    }
  }
  componentDidMount() {
    this.pending = this.props.onLoad().then(data => {
      this.setState({loading: false, students: data.students})
    }).catch(err => {
      this.setState({loading: false, err})
    })
  }
  componentWillUnmount() {
    this.pending.cancel()
    if (this.reportPending) {
      this.reportPending.cancel()
    }
    if (this.submitPending) {
      this.submitPending.cancel()
    }
  }
  renderFields(gradingScale, students) {
    let rows = new Array(GRADING_SCALE_EXTENDED.length)
    students = students || []
    let total = students.length
    for (let index = 0; index < rows.length; index++) {
      let item = gradingScale[index]
      let prev = students.length
      let bound = parseFloat(item.value)
      let result = '-'
      if (bound <= 100 && bound >= 0) {
        bound = bound / 100
        students = students.filter(stu => stu.score < bound)
        let count = prev - students.length
        result = `${count} (${(count / total * 100).toFixed(1)}%)`
      }
      rows[index] = (
        <tr key={index}>
          <td>
            <input type='text' className='form-control'
              data-index={index}
              aria-label={`${index + 1}.Grade is ${item.label}`}
              name='label'
              id={`label_${index+1}`}
              onChange={this.change}
              value={item.label}
            />
          </td>
          <td><input type='number' className='form-control'
            min='0.0'
            max='100.0'
            data-index={index}
            aria-label={`${index + 1}.Start % is ${item.value}`}
            name='value'
            onChange={this.change}
            value={item.value}
          /></td>
          <td>
            <a href='javascript:void(0)' className='text' aria-label={`${index + 1}.students is ${result}`} role='Presentation' tabIndex='-1'>
              {result}
            </a>
          </td>
        </tr>
      )
    }
    return (
      <div>
        <Button className='btn-default btn-sm' label='Clear' onClick={this.clear}/>
        <table className='table table-condensed' summary='Exam grader table'>
          <thead>
            <tr>
              <th>{'Grade'}</th>
              <th>{'Start %'}</th>
              <th>{'Students'}</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    )
  }
  renderRawMessage() {
    return <p>
      {'Instead of assigning grades, only raw scores will be sent to students.'}
    </p>
  }
  render() {
    let {ltiLaunchActive, onClose} = this.props
    let {saving, loading, err, gradingScale, students} = this.state
    let isRaw = gradingScale == null
    if (loading) return <Modal isOpen loading onRequestClose={onClose}/>
    return (
      <Modal isOpen ltiLaunchActive={ltiLaunchActive} className='exam-grader' onRequestClose={onClose}>
        <h4 className='header' aria-level='2'>{'Grading Scale'}</h4>
        <div className='body'>
          <div className='radio'>
            <label>
              <input type='radio' value='raw' onChange={this.changeMode} checked={isRaw}/>
              {'Raw/No Grade'}
            </label>
          </div>
          <div className='radio'>
            <label>
              <input type='radio' value='custom' onChange={this.changeMode} checked={!isRaw}/>
              {'Standard/Custom'}
            </label>
          </div>
          {isRaw ? this.renderRawMessage() : this.renderFields(gradingScale, students)}
          <div className='alert alert-info'>
            <i className='fa fa-lg fa-info-circle'/>
            {' Once you Release Grades, raw scores will be synced to your grade book and students will receive their scores.'}
          </div>
          {err && <Info>{err.message}</Info>}
        </div>
        <div className='footer'>
          <div className='btn-group pull-right'>
            <Button label='Cancel' onClick={onClose}/>
            <Button className='btn-primary' label='Release Grades' loading={saving} onClick={this.submit}/>
          </div>
          <div style={{clear: 'both'}}/>
        </div>
      </Modal>
    )
  }
}

/**
 * Transforms report.gradingScale so we can avoid "index out of range" type errors
 * and so we can mirror input values. This will have be be transformed back before submitting.
 * @param {object[]} data
 * @example [{label: 'A', value: 0.9}, ...] => [{label: 'A', value: '90.0'}]
 */
function transformScaleIn(data) {
  if (!data) return data
  let norm = new Array(GRADING_SCALE_EXTENDED.length)
  let index = 0
  for (; index < data.length; index++) {
    norm[index] = {
      label: data[index].label,
      value: (data[index].value * 100).toFixed(1)
    }
  }
  for (; index < norm.length; index++) {
    norm[index] = {label: '', value: ''}
  }
  return norm
}

/**
 * This is the inverse of tranformScaleIn() plus some input validation
 * @return {Error|object[]}
 */
function transformScaleOut(data) {
  if (!data) return data
  data = data.map(item => {
    let val = parseFloat(item.value)
    if (val <= 100 && val >= 0) {
      return {label: item.label, value: val / 100}
    }
    return null
  }).filter(Boolean)
  if (data.length < 1) {
    return new Error('You must define at least one bracket')
  }
  for (let index = 0; index < data.length; index++) {
    if (!data[index].label) {
      return new Error('Missing a label for ' + (data[index].value * 100).toFixed(1))
    }
  }
  if (data[data.length - 1].value !== 0) {
    return new Error('The final bracket should start at 0, to catch all the remaining scores')
  }
  return data
}
