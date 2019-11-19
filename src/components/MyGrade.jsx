import React from 'react'
import PropTypes from 'prop-types'
import Modal from './Modal'
import {Info, Button} from './misc'
import Chart from './Chart'
let Chartist = null
if (typeof window !== 'undefined') {
  Chartist = require('chartist')
}

const renderIdiotWarning = () => (
  <small style={{display: 'block', textAlign: 'center'}}>{'Click '}<i aria-hidden='true' className='fa fa-file-pdf-o'></i>{' to download blank answer sheets'}</small>
)
const CHART_OPT = {
  low: 0,
  showArea: true,
  showPoint: false,
  fullWidth: true,
  chartPadding: {
    right: 30,
    left: 0,
    top: 0,
    bottom: 0,
  },
  lineSmooth: 'monotoneCubic'
}
const BUCKET_RANGE = 0.1
const BUCKET_TOTAL = 10

/**
 * As a student, see how you did on an exam
 */
export default class MyGrade extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      err: null,
      report: null,
      isPercentileChartAnimation: true
    }
    this.onChartAnimate = this.onChartAnimate.bind(this)
  }
  componentDidMount() {
    let pending = this.props.onLoad().then(report => {
      report.distinctScores = toDistinctScores(report.scores)
      this.setState({loading: null, report})
    }).catch(err => {
      this.setState({loading: null, err})
    })
    this.setState({loading: pending})
  }
  componentWillUnmount() {
    if (this.state.loading && typeof this.state.loading == 'object') this.state.loading.cancel()
  }
  onChartAnimate() {
    if (this.state.isPercentileChartAnimation) {
      this.setState({
        isPercentileChartAnimation: false
      })
    }
  }
  renderReport(name, report) {
    let {autoReleaseGrades, gradeReleaseFormat} = report
    let myScore = (report.me.points / report.totalQuestions).toFixed(3)
    let gradeAlert = gradeReleaseFormat
      ? null
      : autoReleaseGrades ?
        <Info>{'This is a raw score. Letter grades have not been released and may need to be corrected or finalized. You may need to check back later.'}</Info>
        : <Info>{'Your exam results have been scored and will be displayed when your instructor releases grades. Please check back later'}</Info>
    let grade = report.me.grade && gradeReleaseFormat === 'Standard/Custom'
      ? <p className='grade-wrapper'>
        <label>{'Grade: '}</label>
        <div className='grade'>{report.me.grade}</div>
      </p>
      : null
    let chart = !autoReleaseGrades && !gradeReleaseFormat
      ? null
      : <div className='responsive-chart'>
        <h4 style={{textAlign: 'center'}}>{'Student scores density'}</h4>
        {this.renderPercentilesChart(report)}
      </div>
    let incorrect = gradeReleaseFormat && report.me.incorrect && report.me.incorrect.length > 0 && (
      <div>
        <label>{'Incorrect Responses:'}</label>
        <p>{report.me.incorrect.join(', ')}</p>
      </div>
    )
    return (
      <div className='my-grade'>
        <h3 className='text-center'>{name}</h3>
        {gradeReleaseFormat && <p><label>{'Your Score:'}</label>{` ${report.me.points}/${report.totalQuestions} (${myScore})`}</p>}
        {grade}
        {gradeReleaseFormat && <p><label>{'Average Score:'}</label>{' ' + report.mean.toFixed(3)}</p>}
        {incorrect}
        {gradeAlert}
        {chart}
      </div>
    )
  }
  renderPercentilesChart(report) {
    const {isPercentileChartAnimation} = this.state
    const len = report.distinctScores.length
    let labels = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
    let series = new Array(len - 1)
    for (let index = 0; index < len; index ++) {
      const item = report.distinctScores[index]
      series[len - index - 1] = {
        x: item.score, y: item.count
      }
    }
    // check and insert zero and 100% items
    if (series.length === 0 || series[series.length - 1].x !== 1) {
      series.push({x: 1, y: 0})
    }

    if (series.length === 0 || series[0].x !== 1) {
      series.unshift({x: 0, y: 0})
    }
    const data = {
      series: [series]
    }
    const options = Object.assign({}, CHART_OPT)
    options['height'] = 300
    options['showPoint'] = true
    options['chartPadding']['bottom'] = 20
    options['chartPadding']['left'] = 10
    options['chartPadding']['right'] = 40
    options['chartPadding']['top'] = 10
    options['showLine'] = true
    options['lineSmooth'] = true
    options['axisY'] = {
      onlyInteger: true
    }
    options['axisX'] = {
      type: Chartist ? Chartist.FixedScaleAxis : null,
      ticks: labels,
      labelInterpolationFnc: (value, index) => { 
        return value * 100 + '%'
      }
    }
    const axisOptions = {
      axisX: {
        axisTitle: 'Percent score',
        axisClass: 'ct-axis-title',
        offset: {
          x: 0,
          y: 50
        },
        textAnchor: 'middle',
        fontSize: 14
      },
      axisY: {
        axisTitle: 'Students',
        axisClass: 'ct-axis-title',
        offset: {
          x: -7,
          y: 0
        },
        textAnchor: 'middle',
        flipTitle: true,
        fontSize: 14
      }
    }
    return (
      <Chart
        chartKey={0}
        type='Line'
        options={options}
        data={data}
        axisOptions={axisOptions}
        isAnimation={isPercentileChartAnimation}
        onDrawed={() => this.onChartAnimate()}
      />
    )
  }
  render() {
    let {err, loading, report} = this.state
    let {onClose, name, ltiLaunchActive} = this.props
    if (loading) return <Modal isOpen loading onRequestClose={onClose}/>
    return (
      <Modal isOpen ltiLaunchActive={ltiLaunchActive} onRequestClose={onClose}>
        <h4 className='header' aria-level='2'>{'Exam Results'}</h4>
        <div className='body'>
          {err ? <Info>{'Sorry, it looks like your instructor has not uploaded your answer sheet yet.'}</Info> : this.renderReport(name, report)}
          {err && renderIdiotWarning()}
        </div>
        <div className='footer'>
          <div className='btn-group pull-right'>
            <Button label='Close' onClick={onClose}/>
          </div>
          <div style={{clear: 'both'}}/>
        </div>
      </Modal>
    )
  }
}

MyGrade.propTypes = {
  onClose: PropTypes.func.isRequired,

  // () => Promise(report)
  onLoad: PropTypes.func.isRequired,
}

function fillArray(arr, val) {
  for (let index = 0; index < arr.length; index++) {
    arr[index] = val
  }
  return arr
}

function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

function toDistinctScores(scores) {
  const distinctScores = scores
    .sort((a, b) => a < b ? 1 : -1)
    .reduce((acc, score, index) => {
      if (index > 0 && acc[acc.length - 1].score === score) {
        acc[acc.length - 1].count += 1
      }
      else {
        acc.push({score: score, count: 1})
      }
      return acc
    }, [])

  // let buckets = fillArray(new Array(total + 1), 0)
  // for (let i = 0; i < scores.length; i++) {
  //   let j = total + 1

  //   while (j-- > 0) {
  //     const e = round(j * 0.1, 4)
  //     if (scores[i] >= e) {
  //       buckets[j] += 1
  //       break
  //     }
  //   }
  // }

  return distinctScores
}
