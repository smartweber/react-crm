import React from 'react'
import PropTypes from 'prop-types'
import {assignWith, pick} from 'lodash'
import {Info, Button} from './misc'
import Modal from './Modal'
import update from '../util/update'
import Select from './Select'
import AnswerImporter from './AnswerImporter'
import {OMRLines, OMRLine} from './OMRLines'
import AKITable from './AKITable'
import {saveAs} from '../util/helpers'
import Promise from '../util/promise'

const DEFAULT_ANSWER = {
  value: '',
  op: 'OR',
  weight: '',
  penalty: '',
  ec: false,
  pc: {A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 0.0}
}
const LETTERS = ['A', 'B', 'C', 'D', 'E']

export default class AnswerEditor extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    maxQuestions: PropTypes.number,
    maxKeys: PropTypes.number,
  }
  static defaultProps = {
    maxQuestions: 100,
    maxKeys: 5
  }

  constructor(props) {
    super(props)
    this.state = {
      importing: false,
      loading: false,
      advanced: false,
      err: null,
      data: null,
      selectedKey: 'A'
    }
    this.state.data = assignWith(
      {A: [], B: [], C: [], D: [], E: []},
      props.data,
      (prev, next) => next || prev
    )
    this.state.data = pick(this.state.data, LETTERS.slice(0, props.maxKeys))
    this.pending = null
    this.submit = this.submit.bind(this)
    this.changeAnswer = this.changeAnswer.bind(this)
    this.changeAnswerNew = this.changeAnswerNew.bind(this)
    this.toggleAdvanced = this.toggleAdvanced.bind(this)
    this.toggleImportWizard = this.toggleImportWizard.bind(this)
    this.updateFromImport = this.updateFromImport.bind(this)
    this.saveExport = this.saveExport.bind(this)
    this.getKeyLabel = (id) => `Key "${id}"`
    this.changeKey = (selectedKey) => {
      this.refactorData(selectedKey)
    }
    this.clear = () => {
      let {selectedKey} = this.state
      this.setState(update(this.state, {
        data: {[selectedKey]: {$set: []}}
      }))
    }
  }
  componentDidMount() {
    this.refactorData(this.state.selectedKey)
  }
  refactorData(selectedKey) {
    if (this.state.data[selectedKey] && this.state.data[selectedKey].length > 0) {
      let answers = this.state.data[selectedKey];
      for (let index = 0; index < answers.length; index ++) {
        if (!answers[index]['pc']) {
          answers[index]['pc'] = {A: 0, B: 0, C: 0, D: 0, E: 0}
        }
      }
      this.setState(update(this.state, {
        data: {[selectedKey]: {$set: answers}}
      }))
    }
    this.setState({selectedKey})
  }
  toggleImportWizard() {
    this.setState({importing: !this.state.importing})
  }
  saveExport() {
    let id = this.state.selectedKey
    saveAs(AnswerImporter.serialize(this.state.data[id]),
      'text/csv;charset=utf-8', `Answer Key - ${id}.csv`)
  }
  validate(data) {
    let validAnswerKeys = {}
    for (let id in data) if (data.hasOwnProperty(id)) {
      let last = -1
      for (let index = data[id].length - 1; index >= 0; index--) {
        let answer = data[id][index]
        if (last === -1 && answer && answer.value) {
          last = index
        }
        else if (last !== -1 && (!answer || !answer.value)) {
          // check for gaps
          this.setState({err: new Error(`Blank answers are not allowed. Looks like you skipped one. See #${id}-${index + 1}`)})
          return
        }
        if (answer.pc) {
          for (const key in answer.pc) {
            if (answer.pc.hasOwnProperty(key)) {
              if (!answer.pc[key]) {
                answer.pc[key] = 0.0
              }
            }
          }
        } else {
          answer.pc = {A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 0.0}
        }
      }
      if (last !== -1) {
        // trim blank answers and keys
        validAnswerKeys[id] = data[id].slice(0, last + 1)
      }
    }
    // check for mismatched number of answers
    let prev = -1
    for (let id in validAnswerKeys) if (data.hasOwnProperty(id)) {
      if (prev === -1) {
        prev = validAnswerKeys[id].length
      }
      else if (prev !== validAnswerKeys[id].length) {
        this.setState({err: new Error('Ensure all answer keys have the same number of questions')})
        return
      }
    }
    return validAnswerKeys
  }
  updateFromImport(questions) {
    let id = this.state.selectedKey
    questions = questions.slice(0, this.props.maxQuestions).map(item => ({
      value: item.value,
      op: (item.type === '&' ? 'AND' : 'OR'),
      weight: isNaN(Number(item.weight)) ? null : Number(item.weight),
      penalty: isNaN(Number(item.penalty)) ? null : Number(item.penalty),
      ec: (item.ec === 'true' ? true : false),
      pc: {
        A: isNaN(Number(item.A)) ? 0.0 : Number(item.A),
        B: isNaN(Number(item.B)) ? 0.0 : Number(item.B),
        C: isNaN(Number(item.C)) ? 0.0 : Number(item.C),
        D: isNaN(Number(item.D)) ? 0.0 : Number(item.D),
        E: isNaN(Number(item.E)) ? 0.0 : Number(item.E)
      }
    }))
    let state = update(this.state, {
      importing: {$set: false},
      data: {[id]: {$set: questions}}
    })
    this.setState(state)
    this.validate(state.data)
    return Promise.resolve()
  }
  submit() {
    let data = this.validate(this.state.data)
    if (data) {
      this.setState({loading: true})
      this.pending = this.props.onSubmit({answerKeys: data}).catch(err => {
        this.setState({loading: false, err})
      })
    }
  }
  changeAnswer(value, index, op) {
    let id = this.state.selectedKey
    this.setState(update(this.state, {
      data: {[id]: {[index]: {$set: {value, op}}}}
    }))
  }
  renderQuestions(start, end) {
    let answers = this.state.data[this.state.selectedKey] || []
    let total = (end - start) + 1
    let lines = new Array(total)
    for (let index = 0; index < total; index++) {
      let answer = answers[start + index] || DEFAULT_ANSWER
      lines[index] = (
        <OMRLine key={index} index={index} label={index + 1}
          value={answer.value}
          op={answer.op}
          onChange={this.changeAnswer}/>
      )
    }
    return <OMRLines op={true}>{lines}</OMRLines>
  }
  toggleAdvanced() {
    this.setState({
      advanced: !this.state.advanced
    })
  }
  changeAnswerNew(value, index, type, property = null) {
    let id = this.state.selectedKey
    if (this.state.data[id][index]) {
      if (type === 'pc') {
        if (property) {
          if (this.state.data[id][index]['pc']) {
            this.setState(update(this.state, {
              data: {[id]: {[index]: {'pc' : {$merge: {
                [property]: value
              }}}}}
            }))
          } else {
            this.setState(update(this.state, {
              data: {[id]: {[index]: {'pc' : {$set: {
                [property]: value
              }}}}}
            }))
          }
        }
      } else {
        this.setState(update(this.state, {
          data: {[id]: {[index]: {$merge: {
            [type]: value
          }}}}
        }))
      }
    } else {
      let newAnswer = update(DEFAULT_ANSWER, {$merge: {[type]: value}})
      newAnswer['weight'] = 1
      this.setState(update(this.state, {
        data: {[id]: {[index]: {$set: newAnswer}}}
      }))
    }
  }
  renderQuestionsNew(start, end) {
    let {ltiLaunchActive} = this.props
    let {advanced} = this.state
    let id = this.state.selectedKey
    let answers = this.state.data[id] || []
    return <AKITable
      ltiLaunchActive={ltiLaunchActive}
      answers={answers}
      start={start}
      end={end}
      advanced={advanced}
      onToggleAdvanced={this.toggleAdvanced}
      onChange={this.changeAnswerNew}></AKITable>
  }
  render() {
    let {onClose, maxQuestions, ltiLaunchActive} = this.props
    let {importing, err, loading, data, selectedKey, advanced} = this.state
    let ids = Object.keys(data)
    const markUp = !advanced ?
    'For each exam question, enter the letter (i.e., A,B,C,D, or E) that corresponds to the correct response. Select + for advanced scoring options (e.g., multiple correct answers, no credit, penalties, and extra and partial credit).' :
    'Advanced options include multiple correct answers, zero or weighted points (+), penalties for incorrect answers (-) , and extra and partial credit. Click the "*" to change a correct response from a single to multiple answers required for the correct response (e.g., A & B). Points values "+" can be zero for no credit or enter a value to weight the question.  Enter point values for penalties for incorrect responses and partial values. Select the "extra" box for extra credit. To return to the collapsed view select the "-" in Advanced -.'
    if (importing) return (
      <AnswerImporter ltiLaunchActive={ltiLaunchActive} onClose={this.toggleImportWizard} onSubmit={this.updateFromImport}/>
    )
    return (
      <Modal isOpen ltiLaunchActive={ltiLaunchActive} className='answer-editor' onRequestClose={onClose}>
        <h4 className='header' aria-level='2'>{'Answer Keys'}</h4>
        <div className='body'>
          <p>{markUp}</p>
          <div className='text-center'>
            <div className='btn-group'>
              <button type='button' className='btn btn-default' onClick={this.toggleImportWizard}>
                <i aria-hidden='true' className='fa fa-upload'></i>{' Import'}
              </button>
              <button type='button' className='btn btn-default' onClick={this.saveExport}>
                <i aria-hidden='true' className='fa fa-download'></i>{' Export'}
              </button>
            </div>
          </div>
          {this.renderQuestionsNew(0, maxQuestions - 1)}
          <div style={{clear: 'both'}}/>
          {err && <Info noAttribute>{err.message}</Info>}
        </div>
        <div className='footer'>
          <Select
            opt={ids}
            value={selectedKey}
            ariaLabel='Answer Keys'
            role='listbox'
            labeler={this.getKeyLabel}
            onChange={this.changeKey}/>
          <div className='btn-group pull-right'>
            <div className='sr-only' role='alert' aria-live='assertive'>
              {'Answer keys has been cleared.'}
            </div>
            <div className='sr-only' role='alert' aria-live='assertive'>
              {'Answer keys has been saved.'}
            </div>
            <Button className='btn-default' label='Cancel' onClick={onClose}/>
            <Button className='btn-default' label='Clear' onClick={this.clear}/>
            <Button className='btn-primary' label='Save' loading={loading} onClick={this.submit}/>
          </div>
          <div style={{clear: 'both'}}/>
        </div>
      </Modal>
    )
  }
}
