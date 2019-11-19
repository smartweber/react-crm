import React from 'react'
import PropTypes from 'prop-types'
import Select from './Select'
import cn from 'classnames'
import {ReactDOM} from 'react-dom';

export default class ItemAnalysis extends React.PureComponent {
  constructor(props) {
    super(props)
    this.getLabel = key => `Answer Key "${key.id}"`
    this.isTableHover = false
    this.change = this.change.bind(this)
    this.handleHoverOn = this.handleHoverOn.bind(this)
    this.handleHoverOff = this.handleHoverOff.bind(this)
    this.fireOnScroll = this.fireOnScroll.bind(this)
  }
  componentDidMount() {
    this.refs.analysisElementToFire.addEventListener('scroll', this.fireOnScroll)
  }
  componentWillUnmount() {
    this.refs.analysisElementToFire.removeEventListener('scroll', this.fireOnScroll)
  }
  handleHoverOn = () => {
    this.refs.analysisElementToFire.focus()
    this.isTableHover = true
  }
  handleHoverOff = () => {
    this.isTableHover = false
  }
  fireOnScroll = (event) => {
    let answerKeys = this.props.data
    let {selectedKeyIndex} = this.props
    let questions = answerKeys[selectedKeyIndex].questions
    let {onChangeItemAnalysisIndex} = this.props
    let scrollHeight = 0
    let scrollStep = 0
    let questionLength = 0
    if (questions && questions.length > 0) {
      questionLength = questions.length
      scrollHeight = questionLength * 30 - 300
      scrollStep = scrollHeight / questionLength
    } else {
      scrollStep = 0
    }

    if (this.isTableHover && questionLength > 0) {
      let number = Math.floor(event.target.scrollTop / scrollStep)
      if (number >= questionLength) {
        number = questionLength - 1
      }
      onChangeItemAnalysisIndex(number)
    }
  }
  change = (key, index) => {
    this.props.onChangeSelectedKeyIndex(index)
  }
  renderRows(questions) {
    if (!questions && questions.length === 0) {
      return null
    }

    const rows = []
    for (let index = 0; index < questions.length; index ++) {
      rows.push(this.renderRow(questions[index], index))
    }
    return rows
  }
  renderRow(data, rowIndex) {
    let answerKeys = this.props.data
    let {selectedAnalysisIndex, onChangeItemAnalysisIndex} = this.props
    const {selectedKeyIndex} = this.props
    let highest = Math.max.apply(null, data.frequency)
    const rowClass = cn({
      'note': data.rpb < 0.150,
      'selected': rowIndex === selectedAnalysisIndex
    })
    const freq = (letter, colIndex) => {
      let className = data.expected.indexOf(letter) !== -1 ? 'cor'
        : data.frequency[colIndex] >= highest ? 'note'
        : null
      const info = data.expected.indexOf(letter) !== -1 ? 'Correct response'
      : data.frequency[colIndex] >= highest ? 'Incorrect response answered by most students'
      : null
      return <td className={className}  style={{width: '10%'}}>
        {info && <span className='sr-only'>{info}</span>}
        <a href='javascript:void(0)' className='text' aria-label={`${rowIndex + 1}.${letter} is ${data.frequency[colIndex].toFixed(3)}`} role='Presentation' tabIndex='-1'>
          {data.frequency[colIndex].toFixed(3)}
        </a>
      </td>
    }

    const alphaTextClass = cn('text', {
      'red-text': data.alpha > answerKeys[selectedKeyIndex].reliability
    })

    const highlightedRPD = data.alpha > answerKeys[selectedKeyIndex].reliability ?
      'Cronbach\'s Alpha with delete is higher than Cronbach\'s Alpha' :
      null
    
    const itemLowLabel = data.rpb < 0.150 ? 'Item with low point-biserial' : null

    return (
      <tr
        key={rowIndex}
        className={rowClass}
        onClick={() => onChangeItemAnalysisIndex(rowIndex)}>
        <td style={{width: '5%'}}>{rowIndex + 1}</td>
        {freq('A', 0)}
        {freq('B', 1)}
        {freq('C', 2)}
        {freq('D', 3)}
        {freq('E', 4)}
        <td style={{width: '10%'}}>
          {itemLowLabel && <span className='sr-only'>{itemLowLabel}</span>}
          <a href='javascript:void(0)' className='text' aria-label={`${rowIndex + 1}.rpb is ${data.rpb.toFixed(3)}`} role='Presentation' tabIndex='-1'>
            {data.rpb.toFixed(3)}
          </a>
        </td>
        <td style={{width: '15%'}}>
          {highlightedRPD && <span className='sr-only'>{highlightedRPD}</span>}
          <a href='javascript:void(0)' className={alphaTextClass} role='Presentation' tabIndex='-1'>
            {data.alpha.toFixed(3)}
          </a>
        </td>
        <td style={{width: '20%'}}>
          <a href='javascript:void(0)' className='text' aria-label={`${rowIndex + 1}.27% lo/hi is ${data.lower.toFixed(3) + ' / ' + data.upper.toFixed(3)}`} role='Presentation' tabIndex='-1'>
            {data.lower.toFixed(3) + ' / ' + data.upper.toFixed(3)}
          </a>
        </td>
      </tr>
    )
  }
  render() {
    let answerKeys = this.props.data
    let {selectedKeyIndex} = this.props
    let questions = answerKeys[selectedKeyIndex].questions
    const deltaAlpha = (answerKeys[selectedKeyIndex].reliability).toFixed(3)
    questions = questions.map((question, index) => {
      question['alpha'] = answerKeys[selectedKeyIndex]['deletedItemsAlpha'][index]
      return question
    })
    // legend:  correct answer (p-value) (bold)
    //          high frequency distractor (red text)
    //         rpb Point Biserial (highlight row)
    return (
      <div>
        <div className='table-responsive table-header'>
          <table className='table table-condensed' style={{margin: '0px'}} summary='Item analysis table'>
            <thead>
              <tr>
                <th style={{width: '5%'}}>{'#'}</th>
                <th style={{width: '10%'}}>{'A'}</th>
                <th style={{width: '10%'}}>{'B'}</th>
                <th style={{width: '10%'}}>{'C'}</th>
                <th style={{width: '10%'}}>{'D'}</th>
                <th style={{width: '10%'}}>{'E'}</th>
                <th style={{width: '10%'}}>{'r'}<sub>{'pb'}</sub></th>
                <th style={{width: '15%'}}>
                  <div>
                    <div>{`⍺ = ${deltaAlpha}`}</div>
                    <div>{'⍺-'}</div>
                  </div>
                </th>
                <th style={{width: '20%'}}>{'27% lo/hi'}</th>
              </tr>
            </thead>
          </table>
        </div>
        <div
          className='table-responsive table-body'
          ref='analysisElementToFire'
          onMouseEnter={this.handleHoverOn}
          onMouseLeave={this.handleHoverOff}
          aria-label='Item analysis table'
        >
          <table className='table table-condensed' summary='Item analysis table'>
            <tbody>{this.renderRows(questions)}</tbody>
          </table>
        </div>
        <div style={{margin: '1em 0'}}>
          <Select
            opt={answerKeys}
            value={answerKeys[selectedKeyIndex]}
            labeler={this.getLabel}
            onChange={this.change}
          />
        </div>
        <p>{'This item analysis contains response frequencies with the correct answers in '}<strong>{'bold'}</strong>{'. If a significant number of students got the question wrong, the response is '}<span className='note'>{'red'}</span>{". To analyze an item's quality, the table includes the point-biserial (r"}<sub>{'pb'}</sub>{'), Cronbach’s Alpha with delete (⍺-), and Lower 27% / Upper 27% for each item. Items with a low r'}<sub>{'pd'}</sub>{' are '}<span className='highlight'>{'highlighted.'}</span>{' Items with a ⍺- higher than Cronbach’s Alpha (⍺) are '}<span className='red-text'>{'red.'}</span></p>
        <div className='alert alert-info'>
          <i className='fa fa-lg fa-info-circle'/>
          <strong>{' r'}<sub>{'pb'}</sub></strong>
          <a href='https://en.wikipedia.org/wiki/Point-biserial_correlation_coefficient'>{' Point-biserial correlation coefficient'}</a>
          {' between student responses to a particular question and total scores. A value less than 0.150 means poor discrimination. A negative value means that the question may not be properly keyed since students who did well on the test overall still tend to get this question wrong.'}
          <div className='alert-cronbach'>{'⍺'}<strong>{'- Cronbach’s Alpha with delete'}</strong>{' is for the value that Cronbach’s alpha would be if that particular item was deleted from the exam.'}</div>
        </div>
      </div>
    )
  }
}

ItemAnalysis.propTypes = {
  selectedKeyIndex: PropTypes.number.isRequired,
  selectedAnalysisIndex: PropTypes.number.isRequired,
  data: PropTypes.array.isRequired,
  onChangeSelectedKeyIndex: PropTypes.func.isRequired,
  onChangeItemAnalysisIndex: PropTypes.func.isRequired
}
