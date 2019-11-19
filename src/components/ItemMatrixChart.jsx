import React from 'react'
import PropTypes from 'prop-types'
import Chart from './Chart'

const CHART_OPT = {
  low: 0,
  showArea: true,
  showPoint: false,
  fullWidth: true,
  horizontalBars: true,
  chartPadding: {
    right: 30,
    left: 10,
    top: 20,
    bottom: 20,
  },
  lineSmooth: 'monotoneCubic'
}

export default class ItemMatrixChart extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isAnimation: true,
    }
    this.chartEle = null
    this.createdChart0 = false
    this.createdChart1 = false
    this.onChart0Drawed = this.onChart0Drawed.bind(this)
    this.onChart1Drawed = this.onChart1Drawed.bind(this)
  }

  drawedChart() {
    if (this.createdChart0 && this.createdChart1) {
      if (this.chartEle) {
        const height = this.chartEle.clientHeight
        if (this.props.itemMatrixChartHeight !== height) {
          this.props.onDetectItemMatrixSize(height)
        }
      }

      if (this.state.isAnimation) {
        this.setState({isAnimation: false})
      }
    }
  }

  componentDidMount() {
    this.drawedChart()
  }

  componentDidUpdate() {
    this.drawedChart()
  }

  shouldComponentUpdate(nextProps) {
    if (this.props.questions === nextProps.questions) {
      return false;
    } else {
      return true;
    }
  }

  onChart0Drawed() {
    this.createdChart0 = true
    this.drawedChart()
  }

  onChart1Drawed() {
    this.createdChart1 = true
    this.drawedChart()
  }

  render() {
    let {questions} = this.props
    const {isAnimation} = this.state
    questions = questions.map((item, index) => {
      item['questionNumber'] = index + 1
      return item
    })
    let maxQuestions = questions.sort((a, b) => {
      return b.rpb - a.rpb
    }).filter((item) => {
      return item.rpb > 0.3
    }).slice(0, 5).sort((a, b) => {
      return a.rpb - b.rpb
    })
    let minQuestions = questions.sort((a, b) => {
      return a.rpb - b.rpb
    }).filter((item) => {
      return item.rpb < 0.3
    }).slice(0, 5)
    let highestLabels = []
    let highestSeries = []
    if (maxQuestions && maxQuestions.length > 0) {
      for (let index = 0; index < maxQuestions.length; index++) {
        const element = maxQuestions[index];
        highestLabels.push(element['questionNumber'])
        highestSeries.push(element['rpb'])
      }
    }
    const highestChartData = {
      labels: highestLabels,
      series: [highestSeries]
    }
    let lowestLabels = []
    let lowestSeries = []
    if (minQuestions && minQuestions.length > 0) {
      for (let index = 0; index < minQuestions.length; index++) {
        const element = minQuestions[index];
        lowestLabels.push(element['questionNumber'])
        lowestSeries.push(element['rpb'])
      }
    }
    const lowestChartData = {
      labels: lowestLabels,
      series: [lowestSeries]
    }
    let lowValueLowest = Math.min.apply(null, lowestSeries)
    let topValueLowest = Math.max.apply(null, lowestSeries)
    let highestOptions = Object.assign({}, CHART_OPT)
    highestOptions['height'] = highestLabels.length > 1 ? highestLabels.length * 50 : 100
    const axisOptions = {
      axisX: {
        axisTitle: 'Point biserial',
        axisClass: 'ct-axis-title',
        offset: {
          x: 0,
          y: 50
        },
        textAnchor: 'middle',
        fontSize: 14
      },
      axisY: {
        axisTitle: 'Item number',
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

    let lowestOptions = Object.assign({}, CHART_OPT)
    lowestOptions['height'] = lowestLabels.length > 1 ? lowestLabels.length * 50 : 100
    if (lowValueLowest < 0) {
      lowestOptions['low'] = Math.round(lowValueLowest * 1000 - 1) / 1000
      if (topValueLowest < 0) {
        lowestOptions['high'] = 0
      }
    }

    if (lowValueLowest === 0 && topValueLowest === 0) {
      lowestOptions['low'] = 0
      lowestOptions['high'] = 1
    }

    const barLabelsOptions = {
      position: {
        x: (data) => {
          if (data.value.x < 0) {
            return data.x2 + 20  
          }
          return data.x2 - 20
        }
      },
      labelOffset: {
        y: 5
      },
      labelInterpolationFnc: (text) => {
        if (!text) {
          return ''
        }
        return text.toFixed(3)
      }
    }

    return (
      <div
        className='wrapper'
        ref={ (div) => this.chartEle = div }
      >
        <h4><strong>Highest performing questions</strong></h4>
        <Chart
          key={0}
          chartKey={0}
          type='Bar'
          options={highestOptions}
          data={highestChartData}
          barLabelsOptions = {barLabelsOptions}
          axisOptions={axisOptions}
          isAnimation={isAnimation}
          onDrawed={this.onChart0Drawed}
        />
        <h4><strong>Questions to reevaluate</strong></h4>
        <div>
          <Chart
            key={1}
            chartKey={1}
            type='Bar'
            options={lowestOptions}
            data={lowestChartData}
            axisOptions={axisOptions}
            barLabelsOptions = {barLabelsOptions}
            isAnimation={isAnimation}
            onDrawed={this.onChart1Drawed}
          />
        </div>
      </div>
    )
  }
}

ItemMatrixChart.propTypes = {
  questions: PropTypes.array.isRequired,
  itemMatrixChartHeight: PropTypes.number,
  onDetectItemMatrixSize: PropTypes.func.isRequired,
}
