import React from 'react'
import PropTypes from 'prop-types'
import Chart from './Chart'
import Modal from './Modal'
import {TabContainer, TabMenu, TabPanel, Tab} from './TabContainer'
import Select from './Select'
import ItemAnalysis from './ItemAnalysis'
import ItemMatrix from './ItemMatrix'
import ItemMatrixChart  from './ItemMatrixChart'
import ItemAnalysisChart from './ItemAnalysisChart'
import {Info, Button} from './misc'
import {
  toCanvasCSV,
  toBlackboardCSV,
  toMoodleCSV,
  toD2LCSV,
  toItemAnalysisCSV,
  toResponseAnalysisCSV
} from '../util/csv'
import {saveAs} from '../util/helpers'

let Chartist = null
if (typeof window !== 'undefined') {
  Chartist = require('chartist')
}

const CHART_OPT = {
  low: 0,
  showArea: true,
  showPoint: false,
  fullWidth: true,
  chartPadding: {
    right: 30,
    left: 0,
    top: 20,
    bottom: 0,
  },
  lineSmooth: 'monotoneCubic'
}
const BUCKET_RANGE = 0.1
const BUCKET_TOTAL = 10
const EXPORT_FORMATS = [{
  label: 'Blackboard',
  ext: 'bb',
  fn: toBlackboardCSV
}, {
  label: 'Canvas/Instructure',
  ext: 'canvas',
  fn: toCanvasCSV
}, {
  label: 'Desire2Learn',
  ext: 'd2l',
  fn: toD2LCSV
}, {
  label: 'Moodle',
  ext: 'md',
  fn: toMoodleCSV
}, {
  label: 'Item Analysis',
  ext: 'items',
  fn: toItemAnalysisCSV
}, {
  label: 'Response Analysis',
  ext: 'responses',
  fn: toResponseAnalysisCSV
}]

/**
 * Visualize various statistics concerning the results of an exam:
 * - student scores density plot
 * - reliability score
 * - mean/std
 * - percentiles table
 */
export default class ExamReport extends React.Component {
  constructor(props) {
    super(props)
    this.pending = null
    this.state = {
      loading: true,
      err: null,
      data: null,
      tabIndex: 0,
      selectedKeyIndex: 0,
      selectedAnalysisIndex: 0,
      itemMatrixChartHeight: 0,
      itemMatixAnalysisHeight: 0,
      isPercentileChartAnimation: true,
      isDistributionChartAnimation: true,
    }
    this.renderSummary = this.renderSummary.bind(this)
    this.renderDistributionTable = this.renderDistributionTable.bind(this)
    this.renderPercentileTable = this.renderPercentileTable.bind(this)
    this.renderItemMatrix = this.renderItemMatrix.bind(this)
    this.renderItemAnalysis = this.renderItemAnalysis.bind(this)
    this.renderMissing = this.renderMissing.bind(this)
    this.onSelectTab = this.onSelectTab.bind(this)
    this.onChangeSelectedKeyIndex = this.onChangeSelectedKeyIndex.bind(this)
    this.onChangeItemAnalysisIndex = this.onChangeItemAnalysisIndex.bind(this)
    this.onDetectItemMatrixSize = this.onDetectItemMatrixSize.bind(this)
    this.onDetectItemAnalysisSize = this.onDetectItemAnalysisSize.bind(this)
    this.onChartAnimate = this.onChartAnimate.bind(this)
    this.export = (format) => {
      let report = this.state.data
      let examName = this.state.data.examName
      let text = format.fn(report)
      let ext = format.ext
      saveAs(text, 'text/csv;charset=utf-8', `${examName}.${ext}.csv`)
    }
  }
  componentDidMount() {
    this.pending = this.props.onLoad()
    .then(data => {
      data.missing = data.students.filter(stu => !stu.responseId)
      data.students = data.students.filter(stu => stu.responseId)
      let buckets = bucketize(BUCKET_TOTAL, data.students)
      data.distinctScores = toDistinctScores(data)
      data.distributionTable = toDistributionTable(data, buckets)
      this.setState({loading: false, err: null, data})
    })
    .catch(err => {
      this.setState({loading: false, err})
    })
  }
  componentWillUnmount() {
    this.pending.cancel()
  }
  renderSummary(report) {
    let {ltiLaunchActive} = this.props
    const answerKeys = this.state.data.answerKeys
    const students = this.state.data.students
    let {selectedKeyIndex} = this.state
    let formats = EXPORT_FORMATS.slice();
    if (ltiLaunchActive) {
      formats = formats.splice(4, 6)
    }
    let rel = parseFloat(report.reliability).toFixed(3)
    const studentLength = students ? students.length : 0
    const questions = answerKeys[selectedKeyIndex].questions
    const questionLength = questions ? questions.length : 0
    const extraQuestions = questions.filter((question) => question.ec)
    const extraQuestionLength = extraQuestions ? extraQuestions.length : 0
    return (
      <div>
        <div className='summary-container'>
          <h4 className='student-info'>
            <div className='wrapper'>
              <div className='title' style={{width: '50%'}}>{'Number of students (N)'}</div>
              <div className='text-center value' style={{width: '25%'}}>{studentLength}</div>
              <div style={{width: '25%'}}></div>
            </div>
          </h4>
          <h4 className='student-info'>
            <div className='wrapper'>
              <div className='title' style={{width: '50%'}}>{'Number of exam questions'}</div>
              <div className='text-center value' style={{width: '25%'}}>{questionLength - extraQuestionLength}</div>
              <div style={{width: '25%'}}></div>
            </div>
          </h4>
          {extraQuestionLength !== 0 && <h4 className='student-info'>
            <div className='wrapper'>
              <div className='title' style={{width: '50%'}}>{'Number of extra credit questions'}</div>
              <div className='text-center value' style={{width: '25%'}}>{extraQuestionLength}</div>
              <div style={{width: '25%'}}></div>
            </div>
          </h4>
          }
          <div className='table-view'>
            <table className='table' summary='Summary table'>
              <thead>
                <tr>
                  <th className='text-left' style={{width: '50%'}}>Exam statistics</th>
                  <th style={{width: '25%'}}>Score</th>
                  <th style={{width: '25%'}}>%</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className='text-left'>{'Test reliability ( ⍺ )'}</td>
                  <td>{rel}</td>
                  <td></td>
                </tr>
                <tr>
                  <td className='text-left'>{'Median score ( Μ )'}</td>
                  <td>{(report.medianRaw).toFixed(2)}</td>
                  <td>{report.median.toFixed(3)}</td>
                </tr>
                <tr>
                  <td className='text-left'>{'Mean score ( μ )'}</td>
                  <td>{(report.meanRaw).toFixed(2)}</td>
                  <td>{report.mean.toFixed(3)}</td>
                </tr>
                <tr>
                  <td className='text-left'>{'Standard deviation ( σ )'}</td>
                  <td>{(report.sigmaRaw).toFixed(2)}</td>
                  <td>{report.sigma.toFixed(3)}</td>
                </tr>
                <tr>
                  <td className='text-left'>{'Lowest score'}</td>
                  <td>{(report.lowRaw).toFixed(2)}</td>
                  <td>{report.low.toFixed(3)}</td>
                </tr>
                <tr>
                  <td className='text-left'>{'Highest score'}</td>
                  <td>{(report.highRaw).toFixed(2)}</td>
                  <td>{report.high.toFixed(3)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Select className='exporter' nullable='Export to...'
            labeler='label' opt={formats} onChange={this.export}/>
        </div>
        <div className='alert alert-info'>
          <i className='fa fa-lg fa-info-circle'/>
          <strong>{' Test Reliability:'}</strong>
          {' Cronbach\'s Alpha (⍺) is a measure of the likelihood your test will produce consistent scores. Reliability coefficients theoretically range from zero (no reliability) to 1.00 (perfect). Generally speaking, classroom tests range from 0.50 to 0.95 depending on the intercorrelation of items, test length, and diversity of subject matter.'}
        </div>
      </div>
    )
  }
  renderDistributionTable() {
    let {data} = this.state
    const distributes = data.distributionTable.filter((distribute) => {
      return distribute.count > 0
    })

    let rows = distributes.map((data, index) => (
      <tr key={index}>
        <td>
          <a
            href='javascript:void(0)'
            className='text'
            aria-label={`Score is ${data.score}`}
            role='Presentation'
            tabIndex='-1'
          >{data.score}</a>
        </td>
        <td>
          <a
            href='javascript:void(0)'
            className='text'
            aria-label={`Points is ${data.points}`}
            role='Presentation'
            tabIndex='-1'
          >{data.points}</a>
        </td>
        <td>
          <a
            href='javascript:void(0)'
            className='text'
            aria-label={`Students are ${data.count} (${data.pofclass})`}
            role='Presentation'
            tabIndex='-1'
          >{`${data.count} (${data.pofclass})`}</a>
        </td>
      </tr>
    ))
    return (
      <div>
        <div className='responsive-chart'>
          {this.renderDistributionChart()}
        </div>
        <table className='table' summary='Distribution table'>
          <thead>
            <tr>
              <th>{'Score'}</th>
              <th>{'Points'}</th>
              <th>{'Students'}</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    )
  }
  renderPercentileTable(report) {
    return (
      <div>
        <div className='responsive-chart'>
          {this.renderPercentilesChart(report)}
        </div>
        <div className='table-responsive'>
          <table className='table' summary='Percentile table'>
            <thead>
              <tr>
                <th>{'Score'}</th>
                <th>{'Points'}</th>
                <th>{'Students'}</th>
                <th>{'Cumulative'}</th>
                <th>{'Percentile'}</th>
              </tr>
            </thead>
            <tbody>{renderPercentileRows(report)}</tbody>
          </table>
        </div>
      </div>
    )
  }
  renderItemMatrix() {
    let answerKeys = this.state.data.answerKeys
    let {selectedKeyIndex, itemMatrixChartHeight} = this.state
    let questions = answerKeys[selectedKeyIndex].questions
    return (
      <div>
        <div className='responsive-chart'>
          <div className='chart-3 analyze-chart' style={{height: itemMatrixChartHeight}}>
            <ItemMatrixChart
              questions={questions}
              itemMatrixChartHeight={itemMatrixChartHeight}
              onDetectItemMatrixSize={this.onDetectItemMatrixSize}
            />
          </div>
        </div>
        <ItemMatrix data={this.state.data.answerKeys} onChangeSelectedKeyIndex={this.onChangeSelectedKeyIndex}/>
      </div>
    )
  }
  renderItemAnalysis() {
    let {selectedAnalysisIndex, selectedKeyIndex, itemMatixAnalysisHeight} = this.state
    const answerKeys = this.state.data.answerKeys
    return (
      <div>
        <div className='responsive-chart'>
          <div className='chart-4 analyze-chart' style={{height: itemMatixAnalysisHeight}}>
            <ItemAnalysisChart
              answerKeys={answerKeys}
              selectedKeyIndex={selectedKeyIndex}
              selectedAnalysisIndex={selectedAnalysisIndex}
              onDetectItemAnalysisSize={this.onDetectItemAnalysisSize}
            />
          </div>
        </div>
        <ItemAnalysis
          selectedKeyIndex={selectedKeyIndex}
          selectedAnalysisIndex={selectedAnalysisIndex}
          data={answerKeys}
          onChangeSelectedKeyIndex={this.onChangeSelectedKeyIndex}
          onChangeItemAnalysisIndex={this.onChangeItemAnalysisIndex}
        />
      </div>
    )
  }
  renderMissing() {
    let rows = this.state.data.missing
      .map((stu, index) => (
        <tr key={index}>
          <td>
            {stu.id}
          </td>
          <td>
            {stu.email && <a href='javascript:void(0)' className='text' aria-label={`${stud.id}.email is ${stu.email}`}>
              {stu.email}
            </a>}
          </td>
          <td>
            {stu.name && <a href='javascript:void(0)' className='text' aria-label={`${stu.id}.name is ${stu.name}`}>
              {stu.name}
            </a>}
          </td>
        </tr>
      ))
    return (
      <div className='missing-responses'>
        <p>{'Answer sheets have not been uploaded for the following students.'}</p>
        <div className='table-responsive'>
          <table className='table' summary='Missing exam student table'>
            <thead>
              <tr>
                <th>{'ID'}</th>
                <th>{'Email'}</th>
                <th>{'Name'}</th>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
        </div>
      </div>
    )
  }
  onDetectItemMatrixSize(itemMatrixChartHeight) {
    this.setState({itemMatrixChartHeight})
  }
  onDetectItemAnalysisSize(itemMatixAnalysisHeight) {
    this.setState({itemMatixAnalysisHeight})
  }
  onSelectTab(tabIndex) {
    this.setState({
      tabIndex,
      isPercentileChartAnimation: true,
      isDistributionChartAnimation: true
    })
  }
  onChangeSelectedKeyIndex(selectedKeyIndex) {
    this.setState({selectedKeyIndex})
  }
  onChangeItemAnalysisIndex(selectedAnalysisIndex) {
    this.setState({selectedAnalysisIndex})
  }
  renderDistributionChart() {
    const {isDistributionChartAnimation} = this.state
    let {data} = this.state
    let labels = []
    let series = []
    if (data.distributionTable && data.distributionTable.length > 0) {
      for (let index = 0; index < data.distributionTable.length; index++) {
        const element = data.distributionTable[index];
        labels.push(element['chartScore'])
        series.push(element['count'])
      }
    }
    const chartData = {
      labels: labels,
      series: [series]
    }
    const options = Object.assign({}, CHART_OPT)
    options['chartPadding']['bottom'] = 30
    options['chartPadding']['left'] = 10
    options['height'] = 300
    const axisOptions = {
      axisX: {
        axisTitle: 'Score',
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
      <div className='chart-1 analyze-chart'>
        <div className='wrapper'>
          <Chart
            key={0}
            chartKey={0}
            type='Bar'
            options={options}
            data={chartData}
            axisOptions={axisOptions}
            isAnimation={isDistributionChartAnimation}
            onDrawed={() => this.onChartAnimate('isDistributionChartAnimation')}
          />
        </div>
      </div>
    )
  }
  onChartAnimate(animationName) {
    if (this.state[animationName]) {
      this.setState({
        [animationName]: false
      })
    }
  }
  renderPercentilesChart(report) {
    const {isPercentileChartAnimation} = this.state
    const len = report.distinctScores.length
    let maxPoints = 0
    if (len > 0) {
      maxPoints = report.distinctScores[0].points
    }
    const labelLen = 6
    let labels = new Array(labelLen + 1)
    let series = new Array(len)
    const axisOffset = Math.round(maxPoints / labelLen)
    for (let index = 0; index < len; index++) {
      const item = report.distinctScores[index]
      series[len - index] = {
        x: item.points, y: item.percentile
      }
    }
    for (let index = 0; index < labelLen; index++) {
      labels[index] = axisOffset * index
    }
    labels[labelLen] = maxPoints
    const data = {
      series: [series]
    }
    const options = Object.assign({}, CHART_OPT)
    options['height'] = 300
    options['showPoint'] = true
    options['seriesBarDistance'] = 10
    options['lineSmooth'] = true
    options['showLine'] = true
    options['axisY'] = {
      high: 100,
      onlyInteger: true,
      offset: 25
    }
    options['axisX'] = {
      onlyInteger: true,
      type: Chartist ? Chartist.FixedScaleAxis : null,
      low: labels.length > 0 ? labels[1] : 0,
      ticks: labels
    }
    options['chartPadding']['bottom'] = 30
    options['chartPadding']['left'] = 30
    const axisOptions = {
      axisX: {
        axisTitle: 'Scores',
        axisClass: 'ct-axis-title',
        offset: {
          x: 0,
          y: 50
        },
        textAnchor: 'middle',
        fontSize: 14
      },
      axisY: {
        axisTitle: 'Percentile',
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
      <div className='chart-2 analyze-chart'>
        <div className='wrapper'>
          <Chart
            key={1}
            chartKey={1}
            type='Line'
            options={options}
            data={data}
            axisOptions={axisOptions}
            isAnimation={isPercentileChartAnimation}
            onDrawed={() => this.onChartAnimate('isPercentileChartAnimation')}
          />
        </div>
      </div>
    )
  }
  renderBody(report) {
    let hasMissing = this.state.data.missing.length
    return (
      <div className='body'>
        <TabContainer onSelect={index => this.onSelectTab(index)}>
          <TabMenu>
            <Tab>{'Summary'}</Tab>
            <Tab>{'Distribution'}</Tab>
            <Tab>{'Percentiles'}</Tab>
            <Tab>{'Item Matrix'}</Tab>
            <Tab>{'Item Analysis'}</Tab>
            <Tab disabled={!hasMissing}>
              {'Missing '}
              {hasMissing ? <span className='badge'>{hasMissing}</span> : null}
            </Tab>
          </TabMenu>
          <TabPanel render={() => this.renderSummary(report)}/>
          <TabPanel render={this.renderDistributionTable}/>
          <TabPanel render={() => this.renderPercentileTable(report)}/>
          <TabPanel render={this.renderItemMatrix}/>
          <TabPanel render={this.renderItemAnalysis}/>
          <TabPanel render={this.renderMissing}/>
        </TabContainer>
      </div>
    )
  }
  render() {
    let {ltiLaunchActive, onClose} = this.props
    let {loading, err, data} = this.state
    if (loading) return <Modal isOpen loading onRequestClose={onClose}/>
    let errorMessage = ''
    if (err) {
      errorMessage = 'Sorry, the exam is not calculating. Sometimes this is due to there being no answer key. Please check your answer key and try again.'
    }
    return (
      <Modal ltiLaunchActive={ltiLaunchActive} className='exam-report' isOpen onRequestClose={onClose}>
        <h4 className='header' aria-level='2'>{'Analyze Results'}</h4>
        {err ? <div className='body'><Info>{errorMessage}</Info></div> : this.renderBody(data)}
        <div className='footer'>
          <div className='btn-group pull-right'>
            <Button className='btn-default' label='Close' onClick={onClose}/>
          </div>
          <div className='clearfix'/>
        </div>
      </Modal>
    )
  }
}

function formatPercent(num){ return (num * 100).toFixed(1) + '%' }

ExamReport.propTypes = {
  onLoad: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
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

/**
 * @param {number} range Range of values used to sort values into each bucket
 * @param {number} total Number of buckets to create
 * @param {number[]} students
 * @return {number[]} A count of values that fall within the range of each bucket
 */
function bucketize(total, students) {
  let buckets = fillArray(new Array(total), 0)
  let start = 0
  let end = total - 1
  for (let i = 0; i < students.length; i++) {
    const student = students[i]

    if (!student) {
      buckets[0] += 1
      continue
    }

    let j = total

    while (j-- > 0) {
      const e = round(j * 0.1, 4)
      if (student.score >= e) {
        buckets[j] += 1
        break
      }
    }
  }

  return {start, end, values: buckets}
}

function toDistinctScores(report) {
  const distinctScores = report.students
    .sort((a, b) => a.points < b.points ? 1 : -1)
    .reduce((acc, student, index) => {
      if (index > 0 && acc[acc.length - 1].points === student.points) {
        acc[acc.length - 1].count += 1
      }
      else {
        acc.push({
          points: student.points,
          score: student.score,
          count: 1,
          percentile: report.percentiles[student.points.toFixed(1)]
        })
      }
      return acc
    }, [])

    return distinctScores;
}

function toDistributionTable(report, buckets) {
  let totalStudents = report.students.length
  let rows = new Array(BUCKET_TOTAL)
  const table_labels = [
    '0%-9%',
    '10%-19%',
    '20%-29%',
    '30%-39%',
    '40%-49%',
    '50%-59%',
    '60%-69%',
    '70%-79%',
    '80%-89%',
    '90%-100%',
  ]
  const chart_labels = ['0%', '10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%']

  for (let index = 0; index < rows.length; index++) {
    let points
    if (index === rows.length - 1) {
      points = '>= ' + (report.maxScore * index * BUCKET_RANGE).toFixed(2)
    } else {
      points = (report.maxScore * index * BUCKET_RANGE).toFixed(2) + '-' + (report.maxScore * (index + 1) * BUCKET_RANGE - 0.01).toFixed(2)
    }
    rows[index] = {
      score: table_labels[index],
      chartScore: chart_labels[index],
      points: points,
      count: buckets.values[index],
      pofclass: formatPercent(buckets.values[index] / totalStudents)
    }
  }
  return rows
}

function renderPercentileRows(report) {
  let cumulativePercentageOfClass = 100
  let previous_count = 0
  return report.distinctScores.map((info, index) => {
    let percentile = info.percentile
    let percentageOfClass = info.count / report.students.length
    const score = isNaN(info.score) ? 0 : info.score.toFixed(3)
    cumulativePercentageOfClass -= previous_count
    previous_count = info.count / report.students.length * 100
    return (
      <tr key={index}>
        <td>
          <a href='javascript:void(0)' className='text' aria-label={`${index + 1}.score is ${Math.floor(score * 100)}`} role='Presentation' tabIndex='-1'>
            {Math.floor(score * 100)}%
          </a>
        </td>
        <td>
          <a href='javascript:void(0)' className='text' aria-label={`${index + 1}.points is ${info.points.toFixed(2)}`} role='Presentation' tabIndex='-1'>{info.points.toFixed(2)}</a>
        </td>
        <td>
          <a href='javascript:void(0)' className='text' aria-label={`${index + 1}.students is ${`${info.count} (${formatPercent(percentageOfClass)})`}`} role='Presentation' tabIndex='-1'>
            {`${info.count} (${formatPercent(percentageOfClass)})`}
          </a>
        </td>
        <td>
          <a href='javascript:void(0)' className='text' aria-label={`${index + 1}.cumulative is ${Math.round(cumulativePercentageOfClass)}`} role='Presentation' tabIndex='-1'>
            {Math.round(cumulativePercentageOfClass)}%
          </a>
        </td>
        <td>
          <a href='javascript:void(0)' className='text' aria-label={`${index + 1}.percentile is ${Math.round(percentile)}`} role='Presentation' tabIndex='-1'>
            {Math.round(percentile)}
          </a>
        </td>
      </tr>
    )
  })
}