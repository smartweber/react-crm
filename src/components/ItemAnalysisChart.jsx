import React from 'react'
import PropTypes from 'prop-types'
import Chart from './Chart'

const CHART_OPT = {
  low: 0,
  showArea: true,
  showPoint: false,
  fullWidth: true,
  lineSmooth: 'monotoneCubic'
}

export default class ItemAnalysisChart extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isConsiderEvaluate: false,
      chartHeight: 0,
      isAnimation: true,
    }
    this.chartEle = null
    this.chartDrawedCount = 0
    this.isDrawChart = false
    this.onChart0Drawed = this.onChart0Drawed.bind(this)
    this.onChart1Drawed = this.onChart1Drawed.bind(this)
    this.onChart2Drawed = this.onChart2Drawed.bind(this)
  }

  componentWillReceiveProps(nextProps) {
    this.checkConsider(nextProps)
  }

  componentDidUpdate() {
    this.drawedChart()
  }

  shouldComponentUpdate(nextProps) {
    if (
      ( this.props.answerKeys !== nextProps.answerKeys ) ||
      ( this.props.selectedAnalysisIndex !== nextProps.selectedAnalysisIndex )
    ) {
      return true;
    } else {
      return false;
    }
  }

  checkConsider(props) {
    let {selectedKeyIndex, selectedAnalysisIndex, answerKeys} = props
    let questionLength = answerKeys[selectedKeyIndex].questions ? answerKeys[selectedKeyIndex].questions.length : 0
    if (questionLength === 0) {
      return null
    }

    const selectedQuestion = answerKeys[selectedKeyIndex].questions[selectedAnalysisIndex]
    if (selectedQuestion.rpb < 0.150) {
      if (!this.state.isConsiderEvaluate) {
        this.setState({isConsiderEvaluate: true})
      }
    } else {
      if (this.state.isConsiderEvaluate) {
        this.setState({isConsiderEvaluate: false})
      }
    }
  }

  drawedChart() {
    if (this.chartDrawedCount === 3) {
      if (this.state.chartHeight !== this.chartEle.clientHeight) {
        const chartHeight = this.chartEle.clientHeight
        this.setState({chartHeight})
        this.props.onDetectItemAnalysisSize(chartHeight)
        this.isDrawChart = true
      }

      if (this.state.isAnimation) {
        this.setState({isAnimation: false})
      }
    }
  }

  onChart0Drawed() {
    if (this.isDrawChart) {
      return
    }
    this.chartDrawedCount ++
    this.drawedChart()
  }

  onChart1Drawed() {
    if (this.isDrawChart) {
      return
    }
    this.chartDrawedCount ++
    this.drawedChart()
  }

  onChart2Drawed() {
    if (this.isDrawChart) {
      return
    }
    this.chartDrawedCount ++
    this.drawedChart()
  }

  render() {
    let {selectedKeyIndex, selectedAnalysisIndex, answerKeys} = this.props
    const {isConsiderEvaluate, isAnimation} = this.state
    let questionLength = answerKeys[selectedKeyIndex].questions ? answerKeys[selectedKeyIndex].questions.length : 0
    if (questionLength === 0) {
      return null
    }

    const selectedQuestion = answerKeys[selectedKeyIndex]['questions'][selectedAnalysisIndex]
    const selectedCountOfResponses = answerKeys[selectedKeyIndex]['countOfResponses'][selectedAnalysisIndex]
    const highest = Math.max.apply(null, selectedQuestion.frequency)
    const letters = ['A', 'B', 'C', 'D', 'E']
    let highestXAxis = 0
    for (let index = 0; index < letters.length; index++) {
      const letter = letters[index];
      if (selectedCountOfResponses && selectedCountOfResponses.top27 && selectedCountOfResponses.top27[letter]) {
        if (selectedCountOfResponses.top27[letter] > highestXAxis) {
          highestXAxis = selectedCountOfResponses.top27[letter]
        }
      }

      if (selectedCountOfResponses && selectedCountOfResponses.lower27 && selectedCountOfResponses.lower27[letter]) {
        if (selectedCountOfResponses.lower27[letter] > highestXAxis) {
          highestXAxis = selectedCountOfResponses.lower27[letter]
        }
      }
    }

    const series = selectedQuestion['frequency'].map((serie, index) => {
      return {
        colorCustomization: true,
        value: serie * questionLength,
        className: selectedQuestion.expected.indexOf(letters[index]) !== -1 ? 'ct-correct'
        : selectedQuestion.frequency[index] >= highest ? 'ct-wrong'
        : 'ct-normal'
      }
    })
    const responseData = {
      labels: letters,
      series: [series]
    }
    let responseOptions = Object.assign({}, CHART_OPT)
    responseOptions['chartPadding'] = {
      left: 10,
      right: 30,
      top: 0,
      bottom: 30
    }
    responseOptions['height'] = 220
    const responseAxisOptions = {
      axisX: {
        axisTitle: 'Response',
        axisClass: 'ct-axis-title',
        offset: {
          x: 0,
          y: 50
        },
        textAnchor: 'middle',
        fontSize: 14
      },
      axisY: {
        axisTitle: 'Count of Response',
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
    let upperOptions = Object.assign({}, CHART_OPT)
    upperOptions['horizontalBars'] = true
    upperOptions['height'] = 110
    upperOptions['high'] = highestXAxis
    upperOptions['chartPadding'] = {
      left: 0,
      right: 30,
      top: 10,
      bottom: 0
    }
    const upperAxisOptions = {
      axisY: {
        axisTitle: 'Upper 27%',
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
    const upperSeries = selectedQuestion['frequency'].map((serie, index) => {
      return {
        colorCustomization: true,
        value: selectedCountOfResponses && selectedCountOfResponses.top27 ?
        selectedCountOfResponses.top27[letters[index]] ? selectedCountOfResponses.top27[letters[index]] : null
        : null,
        className: selectedQuestion.expected.indexOf(letters[index]) !== -1 ? 'ct-correct'
        : selectedQuestion.frequency[index] >= highest ? 'ct-wrong'
        : 'ct-normal'
      }
    })
    const upperData = {
      labels: letters,
      series: [upperSeries]
    }
    let lowerOptions = Object.assign({}, CHART_OPT)
    lowerOptions['horizontalBars'] = true
    lowerOptions['height'] = 110
    lowerOptions['high'] = highestXAxis
    lowerOptions['chartPadding'] = {
      left: 0,
      right: 30,
      top: 10,
      bottom: 0
    }
    const lowerAxisOptions = {
      axisY: {
        axisTitle: 'Lower 27%',
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
    const lowerSeries = selectedQuestion['frequency'].map((serie, index) => {
      return {
        colorCustomization: true,
        value: selectedCountOfResponses && selectedCountOfResponses.lower27 ?
        selectedCountOfResponses.lower27[letters[index]] ? selectedCountOfResponses.lower27[letters[index]] : null
        : null,
        className: selectedQuestion.expected.indexOf(letters[index]) !== -1 ? 'ct-correct'
        : selectedQuestion.frequency[index] >= highest ? 'ct-wrong'
        : 'ct-normal'
      }
    })
    const lowerData = {
      labels: ['A', 'B', 'C', 'D', 'E'],
      series: [lowerSeries]
    }
    return (
      <div className='wrapper' ref={ (divEle) => this.chartEle = divEle}>
        <h4><strong>{`Question ${selectedAnalysisIndex + 1}`}</strong></h4>
        {isConsiderEvaluate && <h5 style={{fontStyle: 'italic'}}>
          {'Consider reevaluating this question for future exams'}
        </h5>}
        <div className='item-analysis-graph-container'>
          <div>
            <Chart
              key={0}
              chartKey={0}
              type='Bar'
              options={responseOptions}
              data={responseData}
              axisOptions={responseAxisOptions}
              isAnimation={isAnimation}
              onDrawed={this.onChart0Drawed}
            />
          </div>

          <div>
            <Chart
              key={1}
              chartKey={1}
              type='Bar'
              options={upperOptions}
              data={upperData}
              axisOptions={upperAxisOptions}
              isAnimation={isAnimation}
              onDrawed={this.onChart1Drawed}
            />
            <Chart
              key={2}
              chartKey={2}
              type='Bar'
              options={lowerOptions}
              data={lowerData}
              axisOptions={lowerAxisOptions}
              isAnimation={isAnimation}
              onDrawed={this.onChart2Drawed}
            />
          </div>
        </div>
      </div>
    )
  }
}

ItemAnalysisChart.propTypes = {
  answerKeys: PropTypes.array.isRequired,
  selectedKeyIndex: PropTypes.number.isRequired,
  selectedAnalysisIndex: PropTypes.number.isRequired,
  onDetectItemAnalysisSize: PropTypes.func.isRequired,
}
