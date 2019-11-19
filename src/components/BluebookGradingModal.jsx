import React from 'react'
import PropTypes from 'prop-types'
import Modal from './Modal'
import Button from './Button'
import Select from './Select'
import ProgressSlider from './ProgressSlider'
import update from '../util/update'
import {autobind} from '../util/helpers'
import {find, findIndex} from 'lodash'

export default class BluebookGradingModal extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      questionIndex: 0,
      studentIndex: 0,
      isComplete: false,
      isConfigOpen: false,
    }
    autobind(this, [
      'changeIndex',
      'changeStudentIndex',
      'addCriterion',
      'getQuestionLabel',
      'next',
      'prev',
      'focusNewCriterion',
      'applyCriterion',
      'changeLabel',
      'changePointValue',
      'changeMaxPoints',
      'toggleConfig',
      'changeComment',
    ])
    this.focus = false
  }
  next() {
    let studentIndex = this.state.studentIndex + 1
    let questionIndex = this.state.questionIndex
    let isComplete = false
    if (studentIndex >= this.props.info.students.length) {
      studentIndex = 0
      questionIndex = questionIndex + 1
    }
    if (questionIndex >= this.props.info.questions.length) {
      questionIndex = 0
      isComplete = true
    }
    this.setState({studentIndex, questionIndex, isComplete})
  }
  prev() {
    let studentIndex = this.state.studentIndex - 1
    let questionIndex = this.state.questionIndex
    if (studentIndex < 0) {
      studentIndex = this.props.info.students.length - 1
      questionIndex = questionIndex - 1
    }
    if (questionIndex < 0) {
      questionIndex = this.props.info.questions.length - 1
    }
    this.setState({studentIndex, questionIndex})
  }
  getQuestionLabel(value, index) {
    return `Question ${index + this.props.info.start}`
  }
  getStudentLabel(value, index) {
    return `Student ${index + 1}`
  }
  changeIndex(question, questionIndex) {
    this.setState({questionIndex})
  }
  changeStudentIndex(student, studentIndex) {
    this.setState({studentIndex})
  }
  focusNewCriterion(el) {
    if (el && this.focus) {
      el.focus()
      el.select()
    }
  }
  addCriterion() {
    let info = update(this.props.info, {criteria: {$push: [{
      id: puid(),
      questionIndex: this.state.questionIndex,
      value: 0,
      label: '',
      appliedTo: []
    }]}})
    this.focus = true
    this.props.onChange(info)
  }
  applyCriterion(evt) {
    let {criteria, students} = this.props.info
    let id = evt.target.getAttribute('data-id')
    let index = findIndex(criteria, item => item.id === id)
    let studentId = students[this.state.studentIndex].id
    let appliedTo = toggleArrayElement(criteria[index].appliedTo, studentId)
    let info = update(this.props.info, {criteria: {[index]: {appliedTo: {$set: appliedTo}}}})
    this.props.onChange(info)
  }
  changeLabel(evt) {
    let {criteria} = this.props.info
    let id = evt.target.getAttribute('data-id')
    let value = evt.target.value
    let index = findIndex(criteria, item => item.id === id)
    let info = update(this.props.info, {criteria: {[index]: {label: {$set: value}}}})
    this.props.onChange(info)
  }
  changePointValue(evt) {
    let value = evt.target.value
    if (!value || !isFinite(value)) return
    value = Number(value)
    let {criteria} = this.props.info
    let id = evt.target.getAttribute('data-id')
    let index = findIndex(criteria, item => item.id === id)
    let info = update(this.props.info, {criteria: {[index]: {value: {$set: value}}}})
    this.props.onChange(info)
  }
  changeMaxPoints(evt) {
    let value = evt.target.value
    if (!value || !isFinite(value)) return
    value = Number(value)
    let {questionIndex} = this.state
    let info = update(this.props.info, {questions: {[questionIndex]: {maxPoints: {$set: value}}}})
    this.props.onChange(info)
  }
  changeComment(evt) {
    let value = evt.target.value
    let {studentIndex, questionIndex} = this.state
    let {students, comments} = this.props.info
    let studentId = students[studentIndex].id
    let index = findIndex(comments,
      item => item.studentId === studentId && item.questionIndex === questionIndex
    )
    if (index === -1) {
      let info = update(this.props.info, {comments: {$push: [{
        value,
        studentId,
        questionIndex,
      }]}})
      this.props.onChange(info)
    }
    else {
      let info = update(this.props.info, {comments: {[index]: {value: {$set: value}}}})
      this.props.onChange(info)
    }
  }
  toggleConfig() {
    this.setState({isConfigOpen: !this.state.isConfigOpen})
  }
  renderCriterion(item, index, list) {
    // TODO delete criteria
    // TODO reorder criteria
    let studentId = this.props.info.students[this.state.studentIndex].id
    let checked = item.appliedTo.indexOf(studentId) !== -1
    let ref = (index === list.length - 1) ? this.focusNewCriterion : null
    return <div className='check' key={index}>
      <input type='checkbox' checked={checked}
        data-id={item.id} onChange={this.applyCriterion}/>
      <input className='editable-text points' type='number' step={0.5} ref={ref}
        defaultValue={item.value}
        data-id={item.id}
        onChange={this.changePointValue}/>
      <input className='editable-text description' type='text' value={item.label}
        placeholder='Criterion description'
        data-id={item.id}
        onChange={this.changeLabel}/>
    </div>
  }
  renderConfigButton() {
    let caretClass = this.state.isConfigOpen ? 'fa fa-caret-down' : 'fa fa-caret-right'
    return (
      <button type='button' className='btn btn-default pull-right' onClick={this.toggleConfig}>
        <i aria-hidden={true} className='fa fa-cog'/>
        {' '}
        <i aria-hidden={true} className={caretClass}/>
        <span className='sr-only'>{'toggle configuration menu'}</span>
      </button>
    )
  }
  renderConfig() {
    let selectedQuestion = this.props.info.questions[this.state.questionIndex]
    return (
      <div className='config'>
        <div className='form-group'>
          <label>{'Total points'}</label>
          <input type='number' step={1}
            className='form-control'
            onChange={this.changeMaxPoints}
            defaultValue={selectedQuestion.maxPoints}/>
        </div>
      </div>
    )
  }
  renderLeftSide() {
    // TODO zoom on fragment
    let {studentIndex, questionIndex} = this.state
    return (
      <div className='left'>
        <img className='img-responsive center-block'
          alt='scanned student response'
          src={`static/ex-bluebook-fragment-${studentIndex % 3}-${questionIndex % 3}.png`}
        />
      </div>
    )
  }
  renderRightSide() {
    let {questionIndex, studentIndex} = this.state
    let {students, comments, questions, criteria} = this.props.info
    let selectedStudent = students[studentIndex]
    let comment = find(comments,
      comment => comment.studentId === selectedStudent.id && comment.questionIndex === questionIndex
    )
    comment = comment ? comment.value : ''
    let selectedQuestion = questions[questionIndex]
    let maxPoints = selectedQuestion ? selectedQuestion.maxPoints : 0
    criteria = criteria.filter(item => item.questionIndex === questionIndex)
    let points = maxPoints + criteria
      .filter(item => item.appliedTo.indexOf(selectedStudent.id) !== -1)
      .map(item => item.value)
      .reduce((acc, value) => acc + value, 0)
    if (points < 0) points = 0
    return (
      <div className='right'>
        <Select opt={questions}
          className='questions'
          value={selectedQuestion}
          labeler={this.getQuestionLabel}
          onChange={this.changeIndex}/>
        <Select opt={students}
          className='students'
          labeler={this.getStudentLabel}
          value={selectedStudent}
          onChange={this.changeStudentIndex}/>
        <div className='total'>
          <span>{`${points} / ${maxPoints} points `}</span>
          {this.renderConfigButton()}
        </div>
        {this.state.isConfigOpen ? this.renderConfig() : null}
        <div className='criteria'>
          {criteria.map(this.renderCriterion, this)}
        </div>
        <Button className='btn-info' label='+ Add Criterion' onClick={this.addCriterion}/>
        <textarea className='form-control' placeholder='Comments to student...'
          value={comment}
          onChange={this.changeComment}
        />
      </div>
    )
  }
  render() {
    // TODO save changes
    let {studentIndex, questionIndex} = this.state
    let {students, questions, name} = this.props.info
    let totalQuestions = students.length * questions.length
    let gradedQuestions = studentIndex + (students.length * questionIndex)
    let hasPrevious = studentIndex + questionIndex === 0
    return (
      <Modal className='-huge bluebook-grades' isOpen={this.props.open} onRequestClose={this.props.onClose}>
        <h4 className='header' aria-level='2'>{`Grading ${name}`}</h4>
        <div className='body'>
          <img className='left'
            alt='scanned student response'
            src={`static/ex-bluebook-fragment-${studentIndex % 3}-${questionIndex % 3}.png`}
          />
          {this.renderRightSide()}
        </div>
        <div className='footer'>
          <a className='pdf' href={`static/ex-bluebook-${studentIndex % 3}.pdf`} target='_blank'>
            <i aria-hidden={true} className='fa fa-file-pdf-o fa-2x'/>
            <span className='sr-only'>{'download full pdf'}</span>
          </a>
          <ProgressSlider value={gradedQuestions / totalQuestions}/>
          <div className='btn-group'>
            <Button className='btn-default' label='Close'
              onClick={this.props.onClose}/>
            <Button className='btn-info' icon='fa-angle-left' label=' Prev'
              disabled={hasPrevious}
              onClick={this.prev}/>
            <Button className='btn-primary' prefix='Next ' icon='fa-angle-right'
              onClick={this.next}/>
          </div>
        </div>
      </Modal>
    )
  }
  componentDidUpdate() {
    if (this.prevFocus) {
      this.focus = false
    }
    this.prevFocus = this.focus
  }
}

BluebookGradingModal.propTypes = {
  // True if the modal should be visible
  open: PropTypes.bool,

  // Invoked when the modal should be closed
  onClose: PropTypes.func,

  onChange: PropTypes.func,
}

function toggleArrayElement(src, el) {
  let dest = src.slice(0)
  let index = src.indexOf(el)
  if (index === -1) {
    dest.push(el)
  }
  else {
    dest.splice(index, 1)
  }
  return dest
}

// pseudo-random unique id
// TODO this will be generated server-side
function puid() {
  return Math.floor(0xffffffff * Math.random()).toString(16) + Date.now().toString(16).substring(3)
}
