import React from 'react'
import PropTypes from 'prop-types'
import Modal from './Modal'
import {OMRLines, OMRLine} from './OMRLines'
import ImageLoader from './ImageLoader'
import {toDateTimeString} from '../util/datetime'
import {REGX_STUDENT_ID} from '../util/helpers'
import {Info, Button} from './misc'
import update from '../util/update'

function collateAnswers(original, subset) {
  let answers = original.slice(0)
  subset.forEach(answer => {
    answers[answer.answerIndex] = answer.value
  })
  return answers
}

function toSnippetUrl(headContent, answerIndex) {
  let qnum = answerIndex + 1
  if (qnum < 10) qnum = '00' + qnum
  else if (qnum < 100) qnum = '0' + qnum
  return headContent && headContent.replace('101.', qnum + '.')
}

/**
 * Manually verify ambiguous student IDs & responses from uploaded answer sheets
 * TODO preferred checkbox
 * TODO progress bar
 */
export default class ResponseVerifier extends React.Component {
  constructor(props) {
    super(props)
    this._pending = null
    this.state = {
      errLoading: null,
      errSaving: null,
      index: 0,
      items: null,
      loading: true,
      saving: false,
      changed: false,
    }
    this.close = (evt) => {
      this.props.onClose(evt, this.state.changed)
    }
    this.next = () => {
      this.setState({errSaving: null, errLoading: null, index: this.state.index + 1})
    }
    this.back = () => {
      this.setState({errSaving: null, errLoading: null, index: this.state.index - 1})
    }
    this.submit = this.submit.bind(this)
    this.changeAnswer = this.changeAnswer.bind(this)
    this.changeId = this.changeId.bind(this)
    this.showImgError = this.showImgError.bind(this)
  }
  submit() {
    let {index, items} = this.state
    let {onSubmit} = this.props
    let item = items[index]
    let answers = collateAnswers(item.answers, item.unverifiedAnswers)
    if (!REGX_STUDENT_ID.test(item.studentId)) {
      this.setState({errSaving: new Error('invalid student id')})
      return
    }
    this._pending = onSubmit(item.id, item.studentId, item.answerKeyId, answers).then(() => {
      this.setState({changed: true, saving: false, errSaving: null, index: index + 1})
    }).catch(errSaving => {
      this.setState({saving: false, errSaving})
    })
    this.setState({saving: true})
  }
  showImgError() {
    this.setState({
      errLoading: {message: 'a is still processing your answer sheets; check back later'}
    })
  }
  changeAnswer(value, subsetIndex) {
    let {index, items} = this.state
    if (subsetIndex === -1) {
      this.setState({
        // items[index].answerkeyId = value
        items: update(items, {[index]: {answerKeyId: {$set: value}}})
      })
    }
    else {
      this.setState({
        // items[index].unverifiedAnswers[subsetIndex].value = value
        items: update(items, {[index]: {unverifiedAnswers: {[subsetIndex]: {value: {$set: value}}}}})
      })
    }
  }
  changeId(evt) {
    let {index, items} = this.state
    let value = evt.currentTarget.value.trim()
    this.setState({
      items: update(items, {[index]: {studentId: {$set: value}}})
    })
  }
  componentDidMount() {
    this._pending = this.props.onLoad().then(res => {
      if (!res.unverified) throw new Error('no items found')
      let items = res.unverified.map(cur => ({
        ...cur,
        created: toDateTimeString(new Date(cur.created)),
        hasUnverifiedKey: cur.answerKeyId == null,
        answerKeyId: cur.answerKeyId || '',
        hasUnverifiedId: cur.studentId == null,
        studentId: cur.studentId || '',
        unverifiedAnswers: cur.answers
          .map((value, answerIndex) => value != null ? null : {
            answerIndex: answerIndex,
            snippet: toSnippetUrl(cur.headContent, answerIndex),
            value: ''
          })
          .filter(Boolean)
      }))
      this.setState({loading: false, errLoading: null, items})
    }).catch(errLoading => {
      this.setState({loading: false, errLoading})
    })
  }
  componentWillUnmount() {
    if (this._pending) this._pending.cancel()
  }
  renderResponses(item) {
    return (
      <div className='responses'>
        <div className='snippets'>
          {item.unverifiedAnswers.map((ans, subsetIndex) =>
            <ImageLoader key={subsetIndex} src={ans.snippet}/>
          )}
        </div>
        <OMRLines>
          {item.hasUnverifiedKey && <OMRLine
            index={-1}
            label='Key'
            value={item.answerKeyId}
            onChange={this.changeAnswer}/>}
          {item.unverifiedAnswers.map((ans, subsetIndex) =>
            <OMRLine key={subsetIndex}
              label={ans.answerIndex + 1}
              index={subsetIndex}
              value={ans.value}
              onChange={this.changeAnswer}/>
          )}
        </OMRLines>
      </div>
    )
  }
  renderBody(saving, errSaving, items, index) {
    let item = items[index]
    return (
      <div className='body'>
        <div className='sheethead'>
          <ImageLoader src={item.headContent} onFail={this.showImgError}/>
          <a target='_blank' href={item.bodyContent}><small>{'view full answer sheet'}</small></a>
        </div>
        {item.hasUnverifiedId && <div className='form-group studentid'>
          <label>{'Student ID'}</label>
          <input type='text' className='form-control' value={item.studentId} onChange={this.changeId}/>
        </div>}
        {this.renderResponses(item)}
        <small className='datetime'>
          {'Sheet was originally processed on '}<code>{item.created}</code>
        </small>
        {errSaving && <Info>{'Sorry, we could not find that student ID, did you enter the correct ID?'}</Info>}
      </div>
    )
  }
  renderComplete() {
    return (
      <div className='body complete'>
        <div className='alert alert-info'>{'That\'s it! All ambiguous responses have been verified and you can now view reports and assign grades, or make any other corrections under "Analyze Students."'}</div>
      </div>
    )
  }
  render() {
    let {ltiLaunchActive} = this.props
    let {errLoading, errSaving, items, loading, saving, index} = this.state
    if (loading) return <Modal isOpen loading onRequestClose={this.close}/>
    let len = items != null ? items.length : 0
    let complete = index >= len
    return (
      <Modal isOpen ltiLaunchActive={ltiLaunchActive} className='response-verifier -large' onRequestClose={this.close}>
        <h4 className='header' aria-level='2'>{`Verify Responses ${index + 1} / ${len}`}</h4>
        {errLoading
          ? <div className='body'><Info>{errLoading.message}</Info></div>
          : complete ? this.renderComplete()
          : this.renderBody(saving, errSaving, items, index)}
        <div className='footer'>
          <div className='btn-group pull-right'>
            <Button label='Close' onClick={this.close}/>
            <Button label='Back' disabled={index === 0} onClick={this.back}/>
            <Button label='Skip' disabled={index >= len - 1} onClick={this.next}/>
            <Button className='btn-primary'
              disabled={complete} label='Confirm' loading={saving} onClick={this.submit}/>
          </div>
          <div style={{clear: 'both'}}/>
        </div>
      </Modal>
    )
  }
}

ResponseVerifier.propTypes = {
  // ({filter, first, after}) => Promise
  onLoad: PropTypes.func.isRequired,

  // (verified) => Promise
  onSubmit: PropTypes.func.isRequired,

  onClose: PropTypes.func.isRequired,
}
