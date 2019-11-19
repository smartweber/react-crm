import React from 'react'
import PropTypes from 'prop-types'
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer'
import MultiGrid from 'react-virtualized/dist/commonjs/MultiGrid'
import Modal from './Modal'
import Select from './Select'
import {OMRLines, OMRLine} from './OMRLines'
import {Info, Button} from './misc'
import {mean, variance} from '../util/helpers'
import update from '../util/update'
import findIndex from 'lodash/findIndex'
/* eslint react/jsx-key: off */

const EXTRA_COLUMNS = 5 // id, name, points, zscore, keyId
const COLUMN_STUDENT_NAME = 1
const BLANK_ANSWERS = new Array(100).fill({value: ''})
const FILTERS = [{
  label: 'Blank Answers',
  predicate(student) {
    // has blank answers
    if (!student.responseId) return true
    for (let index = 0; index < student.answers.length; index++) {
      if (!student.answers[index].value) return true
    }
    return false
  }
}, {
  label: 'Multiple Marks',
  predicate(student, answerKey) {
    if (student.responseId) for (let index = 0; index < student.answers.length; index++) {
      let item = student.answers[index]
      if (!item.correct && answerKey && answerKey.questions[index].op !== 'AND' && item.value && item.value.length > 1)
        return true
    }
    return false
  }
}, {
  label: 'No Answer Key',
  predicate(student) {
    return !student.responseId || !student.keyId
  }
}]

/**
 * This component allows an instructor/aide to make corrections to student responses
 */
export default class StudentCorrections extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      err: null,
      report: null,
      answerKeys: null,
      grid: null,
      showNames: true,
      editing: null,
      editingKey: null,
      selectedFilter: null,
      filteredStudents: []
    }
    this.pending = null
    this.renderCell = this.renderCell.bind(this)
    this.renderGrid = this.renderGrid.bind(this)
    this.toggleCorrection = this.toggleCorrection.bind(this)
    this.toggleKeyCorrection = this.toggleKeyCorrection.bind(this)
    this.changeKey = this.changeKey.bind(this)
    this.changeAnswer = this.changeAnswer.bind(this)
    this.changeFilter = this.changeFilter.bind(this)
    this.setGridRef = el => this.gridRef = el
    this.toggleNames = () => this.setState({showNames: !this.state.showNames})
    this.getColumnWidth = info => {
      if (info.index === COLUMN_STUDENT_NAME) return 200
      if (info.index < EXTRA_COLUMNS - 1) return 100
      return 60
    }
  }
  toggleCorrection(evt) {
    if (!evt) {
      return this.setState({editing: null})
    }
    let studentId = evt.target.getAttribute('data-id')
    let questionIndex = parseInt(evt.target.getAttribute('data-qi'))
    if (!studentId) {
      return this.setState({editing: null})
    }
    let report = this.state.report
    let studentIndex = findIndex(report.students, student => student.id === studentId)
    let student = report.students[studentIndex]
    let answerKey = this.state.answerKeys[student.keyId]
    let question = answerKey && answerKey.questions[questionIndex]
    let answer = student.answers[questionIndex]
    let data = {
      expected: formatExpectedAnswer(question),
      value: answer.value,
      studentIndex, questionIndex
    }
    this.setState({editing: data})
  }
  toggleKeyCorrection(evt) {
    if (!evt) {
      return this.setState({editingKey: null})
    }
    let studentId = evt.target.getAttribute('data-id')
    if (!studentId) {
      return this.setState({editingKey: null})
    }
    let report = this.state.report
    let studentIndex = findIndex(report.students, student => student.id === studentId)
    let student = report.students[studentIndex]
    let data = {
      value: student.keyId,
      studentIndex
    }
    this.setState({editingKey: data})
  }
  changeKey(id) {
    let {studentIndex} = this.state.editingKey
    let report = this.state.report
    let student = report.students[studentIndex]
    let answerKey = this.state.answerKeys[id]
    let answers = student.answers.map((item, index) => ({
      correct: isCorrect(answerKey && answerKey.questions[index], item.value),
      value: item.value
    }))
    let points = answers.reduce((acc, item) => acc + item.correct, 0)
    let score = points / report.totalQuestions
    report = update(this.state.report, {
      students: {
        [studentIndex]: {$merge: {
          keyId: id,
          points: points,
          score: score,
          answers: answers
        }}
      }
    })
    return this.recompute(report, report.students[studentIndex])
  }
  changeAnswer(value) {
    let {studentIndex, questionIndex} = this.state.editing
    let report = this.state.report
    let student = report.students[studentIndex]
    let answerKey = this.state.answerKeys[student.keyId]
    let wasCorrect = student.answers[questionIndex].correct
    let correct = isCorrect(answerKey && answerKey.questions[questionIndex], value)
    let points = student.points
    if (wasCorrect && !correct) points += -1
    else if (!wasCorrect && correct) points += 1
    // else no change
    let score = points / report.totalQuestions
    report = update(this.state.report, {
      students: {
        [studentIndex]: {
          points: {$set: points},
          score: {$set: score},
          answers: {
            [questionIndex]: {$set: {value, correct}}
          }
        }
      }
    })
    return this.recompute(report, report.students[studentIndex])
  }
  recompute(report, student) {
    let scores = report.students
      .filter(student => student.points > 0)
      .sort((a, b) => a.points !== b.points ? a.points < b.points ? 1 : -1 : 0)
      .map(student => student.score)
    report.sigma = Math.sqrt(variance(scores))
    report.mean = mean(scores)
    report.students.forEach(student => {
      student.zscore = report.sigma === 0 ? 0 : (student.score - report.mean) / report.sigma
    })
    // student = report.students[studentIndex]
    let answers = copyArrayAndFill(student.answers.map(item => item.value), 100, '')
    return this.props.onSubmit(student.responseId, student.id, student.keyId, answers).then(() => {
      this.setState({
        grid: this.toGrid(report, this.state.selectedFilter, false),
        report: report,
        editing: null,
        editingKey: null
      })
    })
  }
  changeFilter(value) {
    this.setState({
      selectedFilter: value,
      grid: this.toGrid(this.state.report, value)
    })
  }
  componentDidMount() {
    this.pending = this.props.onLoad().then(report => {
      // Fill in the points for any students who are missing an answer sheet
      // This avoids any null-pointer-exceptions
      report.students = report.students.filter(stu => {
        return stu.responseId
      })

      this.setState({
        loading: false,
        report: report,
        grid: this.toGrid(report, this.state.selectedFilter),
        answerKeys: keyById(report.answerKeys),
      })
    }).catch(err => {
      this.setState({loading: false, err})
    })
  }
  componentWillUnmount() {
    this.pending.cancel()
  }
  componentDidUpdate(prevProps, prevState) {
    if (this.gridRef) {
      if (prevState.grid !== this.state.grid) {
        this.gridRef.forceUpdateGrids()
      }
      if (prevState.showNames !== this.state.showNames) {
        this.gridRef.recomputeGridSize()
      }
    }
  }
  toGrid(report, selectedFilter, isFilter = true) {
    let students = report.students
    if (isFilter) {
      if (selectedFilter) students = students.filter(student => {
        return selectedFilter.predicate(student, this.state.answerKeys[student.keyId])
      })
      let filteredStudents = students.map(student => {
        return student.id
      })
      this.setState({filteredStudents: filteredStudents})
    } else {
      if (selectedFilter) students = students.filter(student => {
        return this.state.filteredStudents.indexOf(student.id) >= 0
      })
    }
    let grid = students.map(this.renderGridRow, this)
    let header = [this.renderIdHeader(), 'Name', 'Points', 'Z-Score', 'Key', ...range(report.totalQuestions)]
    grid.unshift(header)
    return grid
  }
  renderIdHeader() {
    return (
      <button type='button' onClick={this.toggleNames}>{'Student '}<i className={'fa fa-plus'}/></button>
    )
  }
  renderAnswerCell(studentId, responseId) {
    return (item, questionIndex) => {
      let className = item.correct ? 'answer' : 'answer wrong'
      let incorrectString = !item.correct ? ' Incorrect' : ''
      return <a
        href='javascript:void(0)'
        role='button'
        className={className}
        onClick={this.toggleCorrection}
        data-id={studentId}
        data-qi={questionIndex}
        disabled={!responseId}
        aria-label={`${studentId} id and ${questionIndex + 1} question index value is ${item.value}${incorrectString}`}
      >{item.value || '-'}</a>
    }
  }
  renderKeyCell(studentId, keyId, responseId) {
    return <a
      href='javascript:void(0)'
      role='button'
      className='text'
      aria-label={`${studentId} id's key is ${keyId}`}
      onClick={this.toggleKeyCorrection}
      data-id={studentId}
      disabled={!responseId}
    >{keyId || '-'}</a>
  }
  renderGridRow(student) {
    const score = isNaN(student.score) ? 0 : student.score.toFixed(3)
    const zscore = isNaN(student.zscore) ? 0 : student.zscore.toFixed(2)
    return [
      <div className='studentid'>{student.id}</div>,
      // <a className='studentname' target='_blank' aria-label={`${student.id} id's name is ${student.name}`} href='https://api.dev.com/v1/snippets/batches/324bbe8f/verify/196_805700000.png'>{student.name}</a>,
      <a className='studentname' aria-label={`${student.id} id's name is ${student.name}`}>{student.name}</a>,
      <a href='javascript:void(0)' className='text' aria-label={`${student.id} id's points is ${score}`}>
        {student.points + ' (' + score + ')'}
      </a>,
      <a href='javascript:void(0)' className='text' aria-label={`${student.id} id's z-score is ${zscore}`}>
        {zscore}
      </a>,
      this.renderKeyCell(student.id, student.keyId, student.responseId),
      ...student.answers.map(this.renderAnswerCell(student.id, student.responseId))
    ]
  }
  renderCell({rowIndex, columnIndex, key, style}) {
    let content = null
    let className
    if (rowIndex >= this.state.grid.length) return null
    if (rowIndex === 0) className = 'cell head'
    else if (rowIndex % 2 === 0) className = 'cell even'
    else className = 'cell'
    content = this.state.grid[rowIndex][columnIndex]
    return <div key={key} className={className} style={style}>{content}</div>
  }
  renderGrid({width}) {
    let {report, showNames} = this.state
    let columnCount = EXTRA_COLUMNS + report.totalQuestions
    return React.createElement(MultiGrid, {
      ref: this.setGridRef,
      rowCount: 1 + report.students.length, // one extra row for a header
      columnCount: columnCount,
      height: window.innerHeight > 834 ? 600 : (window.innerHeight - 234) > 100 ? window.innerHeight - 234 : 100,
      width: width,
      rowHeight: 30,
      columnWidth: this.getColumnWidth,
      fixedRowCount: 1,
      fixedColumnCount: showNames ? 2 : 1,
      cellRenderer: this.renderCell,
    })
  }
  render() {
    let {ltiLaunchActive, onClose} = this.props
    let {selectedFilter, showNames, editing, editingKey} = this.state
    let {loading, err} = this.state
    if (loading) return <Modal isOpen loading onRequestClose={onClose}/>
    return (
      <Modal isOpen ltiLaunchActive={ltiLaunchActive} className='student-corrections -large' onRequestClose={onClose}>
        <h4 className='header' aria-level='2'>{'Student Corrections'}</h4>
        <div className='body'>
          <div className='filter'>
            <label>{'Filter by'}</label>
            <Select nullable=' -- '
              labeler='label'
              opt={FILTERS}
              value={selectedFilter}
              onChange={this.changeFilter}/>
          </div>
          <div className='sr-only'>
            {'The below table is not accessible as a table layout for screen reader users. To access the table information, please download the csv file from \'Analyze Results > Summary > Export to > Response analysis\''}
          </div>
          {err ? <Info>{'The exam\'s report data was not fully received, please try again'}</Info> : <AutoSizer showNames={showNames} disableHeight>{this.renderGrid}</AutoSizer>}
        </div>
        <div className='footer'>
          <div className='btn-group pull-right'>
            <Button label='Close' onClick={onClose}/>
          </div>
          <div style={{clear: 'both'}}/>
        </div>
        {editing && <CorrectionModal {...editing} ltiLaunchActive={ltiLaunchActive} title='Change Answer' onClose={this.toggleCorrection} onSubmit={this.changeAnswer}/>}
        {editingKey && <CorrectionModal {...editingKey} ltiLaunchActive={ltiLaunchActive} title='Change Key' onClose={this.toggleKeyCorrection} onSubmit={this.changeKey}/>}
      </Modal>
    )
  }
}

StudentCorrections.propTypes = {
  onClose: PropTypes.func.isRequired,

  // @return {Promise} resolves with an ExamReport
  onLoad: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

function range(count) {
  let numbers = new Array(count)
  for (let index = 0; index < count; index++) {
    numbers[index] = index + 1
  }
  return numbers
}

/**
 * props.value
 * props.expected
 * props.onClose()
 * props.onSubmit(value) => Promise
 */
class CorrectionModal extends React.Component {
  constructor(props) {
    super(props)
    this.state = {saving: false, err: null, value: this.props.value}
    this.change = value => this.setState({value})
    this.submit = () => {
      this.props.onSubmit(this.state.value.replace(/[^ABCDE]/g, '')).catch(err => {
        this.setState({saving: false, err})
      })
      this.setState({saving: true})
    }
  }
  render() {
    let {onClose, expected, title, questionIndex, ltiLaunchActive} = this.props
    let {value, saving, err} = this.state
    let label = questionIndex == null || questionIndex + 1
    return (
      <Modal isOpen ltiLaunchActive={ltiLaunchActive} className='-confirm' onRequestClose={onClose}>
        <h4 className='header' aria-level='2'>{title}</h4>
        <div className='body'>
          {expected ? <p><i>{'Expected Answer: '}</i>{expected}</p> : null}
          <OMRLines>
            <OMRLine label={label} value={value} onChange={this.change}/>
          </OMRLines>
        </div>
        <div className='footer'>
          {err && <Info>{err.message}</Info>}
          <div className='btn-group pull-right'>
            <Button label='Close' onClick={onClose}/>
            <Button className='btn-primary' label='Confirm' loading={saving} onClick={this.submit}/>
          </div>
          <div style={{clear: 'both'}}/>
        </div>
      </Modal>
    )
  }
}

function formatExpectedAnswer(props) {
  if (!props) return props
  if (props.expected.length > 1)
    return (props.operator === 'AND' ? '&' : '*') + props.expected
  return props.expected
}

function isCorrect(question, answer) {
  if (!question) return false
  if (question.operator === 'AND') {
    return question.expected === answer
  }
  if (answer.length === 0) return false
  for (let index = 0; index < answer.length; index++) {
    if (question.expected.indexOf(answer.charAt(index)) === -1) return false
  }
  return true
}

function keyById(list) {
  let map = {}
  list.forEach(item => map[item.id] = item)
  return map
}

function computeStudentScore(answerKeys, maxPoints, keyId, student) {
  let answerKey = answerKeys[keyId]
  let answers = student.answers.map((item, index) => ({
    correct: isCorrect(answerKey && answerKey.questions[index], item.value),
    value: item.value
  }))
  let points = answers.reduce((acc, item) => acc + item.correct, 0)
  let score = points / maxPoints
  return {...student, keyId, points, score, answers}
}

function copyArrayAndFill(src, total, fill) {
  let dest = new Array(total)
  let index = 0
  for (; index < src.length && index < total; index++) {
    dest[index] = src[index]
  }
  while (index < total) {
    dest[index] = fill
    index += 1
  }
  return dest
}
