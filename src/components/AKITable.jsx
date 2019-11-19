import React from 'react'
import cn from 'classnames'
import EditableText from './EditableText'

const DEFAULT_ANSWER = {
  value: '',
  op: 'OR',
  weight: '',
  penalty: '',
  ec: false,
  pc: {A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 0.0}
}
const LETTERS = ['A', 'B', 'C', 'D', 'E']

/**
 * @Answer Key Instruction Table
 */
export default class AKITable extends React.PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      errorType: null,
      errorRow: -1,
      errorPatial: null
    }

    this.changeExtra = (evt, index) => {
      this.props.onChange(evt.target.checked, index, 'ec')
    }

    /**
     * example this.changeAnswer(event, {
        value: 'A',
        op: 'OR',
        weight: 1,
        penalty: 0,
        ec: false,
        pc: {A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 0.0}
      }, 1, 'penalty)
     */
    this.changeAnswer = (evt, answer, index, property) => {
      if (property === 'value') {
        if (evt.target.value.length < answer.value.length) {
          return this.props.onChange(evt.target.value.toUpperCase(), index, property)
        }

        let letter = evt.target.value.slice(-1).toUpperCase();

        if (LETTERS.indexOf(letter) !== -1 && answer.value.indexOf(letter) === -1) {
          return this.props.onChange(answer.value + letter, index, property)
        }
      } else {
        let value = evt.target.value ? evt.target.value : 0
        value = this.roundToTwo(value)
        if (!isNaN(value) && value >= 0) {
          if (property === 'weight') {
            if (answer.penalty <= value) {
              answer.pc = {A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 0.0}
              this.setState({
                errorType: null,
                errorRow: -1,
                errorPatial: null
              })
              return this.props.onChange(value, index, property)
            } else {
              return this.setState({
                errorType: 'weight',
                errorRow: index,
                errorPatial: null
              })
            }
          } else if (property === 'penalty') {
            if (answer.weight >= value) {
              this.setState({
                errorType: null,
                errorRow: -1,
                errorPatial: null
              })
              return this.props.onChange(value, index, property)
            } else {
              return this.setState({
                errorType: 'penalty',
                errorRow: index,
                errorPatial: null
              })
            }
          }
        }
      }
    }

    this.changeAnswerOP = (index, op) => {
      this.props.onChange(op === 'OR' ? 'AND' : 'OR', index, 'op')
    }

    this.changeAnswerPartialWeight = (event, answer, index, property) => {
      if (this.roundToTwo(event.target.value) > this.roundToTwo(answer.weight)) {
        return this.setState({
          errorType: 'partial',
          errorRow: index,
          errorPatial: property
        })
      }
      this.setState({
        errorType: null,
        errorRow: -1,
        errorPatial: null
      })
      return this.props.onChange(this.roundToTwo(event.target.value), index, 'pc', property)
    }
  }

  /**
   * example this.renderExtra(1, true)
   * @param {*} index of answer
   * @param {*} value of extra
   */
  renderExtra(index, value) {
    const ariaLabel = `Extra Points for Quesion${index + 1}`
    return (
      <label className='extra-checbox'>
        <input
          type='checkbox'
          className='sr-only'
          aria-label={ariaLabel}
          onChange={(event) => this.changeExtra(event, index)}
          checked={value ? value : false}/>
        <i aria-hidden='true' className='fa fa-times'></i>
      </label>
    )
  }

  /**
   * round to decimal 2
   * @param {*} num of number
   */
  roundToTwo(num) {
    return (Math.round(Number(num) * 100) / 100)
  }

  /**
   * example this.renderPartial(1, {
      value: 'A',
      op: 'OR',
      weight: 1,
      penalty: 0,
      ec: false,
      pc: {A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 0.0}
    }, 'A')
   * @param {*} index answer index
   * @param {*} answer answer data
   * @param {*} targetValue target answer value
   */
  renderPartial(index, answer, targetValue) {
    if (!answer.value) {
      return null
    }

    let {errorType, errorRow, errorPatial} = this.state
    const isError = (errorType === 'partial') &&
    (errorRow === index) &&
    (targetValue === errorPatial)

    if (answer.op === 'OR') {
      if (answer.value.indexOf(targetValue) !== -1) {
        return (
          <div className='value-wrapper weight'>
            {answer.weight ? answer.weight : '-'}
          </div>
        )
      } else {
        const className = cn('value-wrapper partial', {
          'error': isError
        })

        const value = answer.pc && answer.pc[targetValue] ? this.roundToTwo(answer.pc[targetValue]) : ''
        return <EditableText
          className={className}
          answer={answer}
          index={index}
          targetValue={targetValue}
          value={value}
          ariaLabel={`Positive Points for Answer ${targetValue}`}
          onChangeAnswerPartialWeight={this.changeAnswerPartialWeight}
        ></EditableText>
      }
    } else {
      const value = answer.pc && answer.pc[targetValue] ? this.roundToTwo(answer.pc[targetValue]) : ''
      const valueWrapperClass = cn('value-wrapper partial', {
        'response': answer.value.indexOf(targetValue) !== -1,
        'error': isError
      })
      return <EditableText
          className={valueWrapperClass}
          answer={answer}
          index={index}
          targetValue={targetValue}
          value={value}
          onChangeAnswerPartialWeight={this.changeAnswerPartialWeight}
        ></EditableText>
    }
  }

  /**
   * example this.render(1, {
      value: 'A',
      op: 'OR',
      weight: 1,
      penalty: 0,
      ec: false,
      pc: {A: 0.0, B: 0.0, C: 0.0, D: 0.0, E: 0.0}
    }, 'value')
   * @param {*} index answer index
   * @param {*} answer data
   * @param {*} property property
   */
  renderInput(index, answer, property) {
    let {errorType, errorRow} = this.state
    const isError = (errorType === property) && (index === errorRow) ? true : false
    const type = (property === 'value') ? 'text' : 'number'
    const className = cn({
      'answer-input': property === 'value',
      'point-input': property !== 'value',
      'error': isError
    })
    const pointLabelValue = `Positive Points for Answer ${answer.value}`
    const pointInputAriaLabel = property !== 'value' ? pointLabelValue : undefined
    let value = (answer[property] || answer[property] === 0) ? answer[property] : ''
    let refactorValue = value
    if (type === 'number' && value !== '') {
      refactorValue = value.toString().replace(/^0+(?=\d)/,'')
    }
    return (
      <input
        className={className ? className : undefined}
        aria-label={pointInputAriaLabel}
        type={type}
        value={refactorValue}
        onChange={(event) => this.changeAnswer(event, answer, index, property)}/>
    )
  }

  renderRow(answer, index, valueWidth, advancedWidth, advancedItemWidth) {
    let {advanced} = this.props
    let advancedIndex = advanced ? 7 : 4
    return (
      <tr key={index}>
        <td style={{width: '5%'}} scope='row' role='1'>{index + 1}</td>
        <td style={{width: '15%'}} scope='row' role='2'>
          <div className='answer-container'>
            {this.renderInput(index, answer, 'value')}
          </div>
        </td>
        {advanced && <td style={{width: advancedItemWidth + '%'}} scope='row' role='3'>
          <button className='op-btn' onClick={() => this.changeAnswerOP(index, answer.op)}>{answer.op === 'OR' ? '*' : '&'}</button>
        </td>}
        {advanced && <td style={{width: advancedItemWidth + '%'}} scope='row' role='4'>
          {this.renderInput(index, answer, 'weight')}
        </td>}
        {advanced && <td style={{width: advancedItemWidth + '%'}} scope='row' role='5'>
          {this.renderInput(index, answer, 'penalty')}
        </td>}
        {advanced && <td style={{width: advancedItemWidth + '%'}} scope='row' role='6'>
          <div className='extra-container'>{this.renderExtra(index, answer.ec)}</div>
        </td>}
        {!advanced && <td style={advancedWidth} scope='row' role='3'></td>}
        <td style={valueWidth} scope='row' role={advancedIndex}>
          {this.renderPartial(index, answer, LETTERS[0])}
        </td>
        <td style={valueWidth} scope='row' role={advancedIndex + 1}>
          {this.renderPartial(index, answer, LETTERS[1])}
        </td>
        <td style={valueWidth} scope='row' role={advancedIndex + 2}>
          {this.renderPartial(index, answer, LETTERS[2])}
        </td>
        <td style={valueWidth} scope='row' role={advancedIndex + 3}>
          {this.renderPartial(index, answer, LETTERS[3])}
        </td>
        <td style={valueWidth} scope='row' role={advancedIndex + 4}>
          {this.renderPartial(index, answer, LETTERS[4])}
        </td>
        <td style={valueWidth} scope='row' role={advancedIndex + 5}>
          <div className={`and-col${answer.op === 'AND' ? ' exist' : ''}`}>
            {answer.op === 'AND' ? answer.weight : null}
          </div>
        </td>
      </tr>
    )
  }

  render() {
    let {answers, start, end, ltiLaunchActive, advanced, onToggleAdvanced} = this.props
    let total = (end - start) + 1
    let lines = new Array(total)
    let advancedItemWidth = 8
    let valueWidth = advanced ? {width: advancedItemWidth + '%'} : {width: '12%'}
    let advancedWidth = advanced ? {width: advancedItemWidth * 4 + '%'} : {width: '8%'}
    for (let index = 0; index < total; index++) {
      let answer = answers[start + index] || DEFAULT_ANSWER
      lines[index] = this.renderRow(answer, index, valueWidth, advancedWidth, advancedItemWidth)
    }
    return(
      <div className={`aki-table-conainer${ltiLaunchActive ? ' lti-launch' : ''}`}>
        <div className='header-table'>
          <table summary='Answer key table'>
            <thead>
              <tr>
                <th rowSpan='2' style={{width: '5%'}} scope='col'></th>
                <th style={{width: '15%'}} scope='col'></th>
                <th colSpan={advanced ? 4 : 1} className={!advanced ? 'advanced-th' : undefined} scope='col'>
                  <div className='advanced-header-container' role='link' tabIndex='0' onClick={onToggleAdvanced}>
                    <div>Advanced</div>
                    <div>
                      {advanced ?
                      <i aria-hidden='true' className='fa fa-minus'></i> :
                      <i aria-hidden='true' className='fa fa-plus'></i>}
                    </div>
                  </div>
                </th>
                <th colSpan='6' className='pp-container' scope='colgroup'>Point / Partial Values</th>
              </tr>
              <tr>
                <th style={{width: '15%'}} scope='col'>
                  Answers(s)
                </th>
                {advanced &&<th style={valueWidth} scope='col'>Type</th>}
                {advanced &&<th colSpan='2' scope='colgroup'>
                  <div className='points-container'>
                    <div>Points</div>
                    <div className='weight-panelty'>
                      <div>
                        <span aria-hidden='true'>{'+'}</span>
                        <span className='sr-only'>{'Positive'}</span>
                      </div>
                      <div>
                        <span aria-hidden='true'>{'-'}</span>
                        <span className='sr-only'>{'Negative'}</span>
                      </div>
                    </div>
                  </div>
                </th>}
                {advanced &&<th style={valueWidth} scope='col'>Extra</th>}
                {!advanced &&<th style={advancedWidth} scope='col'></th>}
                <th style={valueWidth} scope='col' aria-label='Extra Points for Answer A'>A</th>
                <th style={valueWidth} scope='col' aria-label='Extra Points for Answer B'>B</th>
                <th style={valueWidth} scope='col' aria-label='Extra Points for Answer C'>C</th>
                <th style={valueWidth} scope='col' aria-label='Extra Points for Answer D'>D</th>
                <th style={valueWidth} scope='col' aria-label='Extra Points for Answer E'>E</th>
                <th style={valueWidth} scope='col'>&</th>
              </tr>
            </thead>
          </table>
        </div>
        <div className='body-table'>
          <table summary='Answer key table'>
            <tbody>
              {lines}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
}
