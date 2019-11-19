const React = require('react')
const PropTypes = require('prop-types')

// So we don't get a 'window is undefined' error with server-side rendering
let Chartist = null
let BarLabelsPluginOptions = null
let BarLabelDefaultOptions = null
let isProcessAnimations = [false, false, false]
let chartIndex = -1
if (typeof window !== 'undefined') {
  Chartist = require('chartist')

  BarLabelDefaultOptions = {
    // The class name so you can style the text
    labelClass: 'ct-bar-label',
  
    // Use this to get the text of the data and you can return your own
    // formatted text. For example, for a percentage: 
    // {
    //  labelInterpolationFnc: function (text) { return text + '%' }
    // }
    labelInterpolationFnc: Chartist.noop,
  
    // Depending on your font size you may need to tweak these
    labelOffset: {
      x: 0,
      y: 0
    },
  
    // If labelOffset doesn't work for you and you need more custom positioning
    // you can use this. You can set position.x and position.y to functions and
    // instead of centering + labelOffset. This will _completely_ override the
    // built in positioning so labelOffset will no longer do anything. It will
    // pass the bar `data` back as the first param.
    //
    // Example:
    // Chartist.plugins.ctBarLabels({
    //   position: {
    //     x: function (data) {
    //       return data.x1 + 50; // align left with 50px of padding
    //     }
    //   }
    // });
    position: {
      x: null,
      y: null
    }
  }
}

const AxisDefaults = {
  axisTitle: '',
  axisClass: 'ct-axis-title',
  offset: {
    x: 0,
    y: 0
  },
  textAnchor: 'middle',
  flipTitle: false
}

const AxisDefaultOptions = {
  axisX: AxisDefaults,
  axisY: AxisDefaults
}

/**
 * This component wraps the Chartist.js API for simple, responsive, charts
 * @see https://github.com/gionkunz/chartist-js
 */
class Chart extends React.PureComponent {
  constructor(props) {
    super(props)
    this.container = null
    BarLabelsPluginOptions = null
    chartIndex = -1
    isProcessAnimations = [false, false, false]

    this.setContainerElement = el => this.container = el
  }
  componentDidMount() {
    this.updateChart()
  }
  componentWillUnmount() {
    this.chartist.detach()
  }
  componentDidUpdate() {
    this.updateChart()
  }
  updateChart() {
    let {type, data, options, responsiveOptions, axisOptions, barLabelsOptions, onDrawed, isAnimation, chartKey} = this.props
    chartIndex = chartKey
    isProcessAnimations[chartIndex] = isAnimation
    if (barLabelsOptions) {
      BarLabelsPluginOptions = Chartist.extend({}, BarLabelDefaultOptions, barLabelsOptions)
    }
    if (this.chartist) {
      this.chartist.update(data, options, responsiveOptions)
    }
    else {
      this.chartist = new Chartist[type](this.container, data, options, responsiveOptions)
      drawChart(this.chartist, chartIndex)
      createdChart(this.chartist, axisOptions, onDrawed)
    }
    // TODO this.chartist.on(eventName, fn)
    // created, draw, optionsChanged, data, animationBegin, animationEnd
  }
  render() {
    return (
      <div className='chart-container' ref={this.setContainerElement} aria-hidden='true'>
        {this.props.children}
      </div>
    )
  }
}

Chart.propTypes = {
  chartKey: PropTypes.number,
  data: PropTypes.object,
  options: PropTypes.object,
  responsiveOptions: PropTypes.array,
  axisOptions: PropTypes.object,
  barLabelsOptions: PropTypes.object,
  type: PropTypes.oneOf(['Line', 'Bar', 'Pie']).isRequired,
  isAnimation: PropTypes.bool,
  onDrawed: PropTypes.func,
}

function getTitle(title) {
  if (title instanceof Function) {
    return title()
  }
  return title
}

function getClasses(classes) {
  if (classes instanceof Function) {
    return classes()
  }
  return classes
}

function positionX(data) {
  if (BarLabelsPluginOptions && BarLabelsPluginOptions.position.x) {
    return BarLabelsPluginOptions.position.x(data)
  }

  return ((data.x1 + data.x2) / 2) + BarLabelsPluginOptions.labelOffset.x;
}

function positionY(data) {
  if ((BarLabelsPluginOptions && BarLabelsPluginOptions.position.y)) {
    return BarLabelsPluginOptions.position.y(data)
  }

  return ((data.y1 + data.y2) / 2) + BarLabelsPluginOptions.labelOffset.y
}

function createdChart(chart, options, onDrawed, processAnimation) {
  chart.on('created', (data) => {
    if (options) {
      options = Chartist.extend({}, AxisDefaultOptions, options)

      if (!options.axisX.axisTitle && !options.axisY.axisTitle) {
        throw new Error(
        'ctAxisTitle plugin - You must provide at least one axis title'
        )
      } else if (!data.axisX && !data.axisY) {
        throw new Error(
        'ctAxisTitle plugin can only be used on charts that have at least one axis'
        )
      }

      var xPos,
      yPos,
      title,
      chartPadding = Chartist.normalizePadding(data.options.chartPadding) // normalize the padding in case the full padding object was not passed into the options
  
      //position axis X title
      if (options.axisX.axisTitle && data.axisX) {
  
        xPos = (data.axisX.axisLength / 2) + data.options.axisY.offset + chartPadding.left
        yPos = chartPadding.top
  
        if (data.options.axisY.position === 'end') {
          xPos -= data.options.axisY.offset
        }
  
        if (data.options.axisX.position === 'end') {
          yPos += data.axisY.axisLength
        }
  
        title = new Chartist.Svg('text')
        title.addClass(getClasses(options.axisX.axisClass))
        title.text(getTitle(options.axisX.axisTitle))
        title.attr({
          x: xPos + options.axisX.offset.x,
          y: yPos + options.axisX.offset.y,
          'text-anchor': options.axisX.textAnchor
        })
  
        data.svg.append(title, true)
      }
  
      //position axis Y title
      if (options.axisY.axisTitle && data.axisY) {
        xPos = 0
        yPos = (data.axisY.axisLength / 2) + chartPadding.top
  
        if (options.axisY.flipTitle && options.axisY.fontSize) {
          xPos = options.axisY.fontSize
        }
  
        if (data.options.axisX.position === 'start') {
          yPos += data.options.axisX.offset
        }
  
        if (data.options.axisY.position === 'end') {
          xPos = data.axisX.axisLength
        }
  
        var transform = 'rotate(' + (options.axisY.flipTitle ? -
        90 : 90) + ', ' + xPos + ', ' + yPos + ')'
  
        title = new Chartist.Svg('text')
        title.addClass(getClasses(options.axisY.axisClass))
        title.text(getTitle(options.axisY.axisTitle))
        title.attr({
          x: xPos + options.axisY.offset.x,
          y: yPos + options.axisY.offset.y,
          transform: transform,
          'text-anchor': options.axisY.textAnchor
        })
        data.svg.append(title, true)
      }
    }

    if (onDrawed) {
      onDrawed()
    }

    if (processAnimation) {
      processAnimation()
    }
  })
}

function drawChart(chart, chartIndex) {
  chart.on('draw', (data) => {
    if (isProcessAnimations[chartIndex]) {
      if (data.type === 'line' || data.type === 'area') {
        data.element.animate({
          d: {
            begin: 2000 * data.index,
            dur: 2000,
            from: data.path.clone()
              .scale(1, 0)
              .translate(0, data.chartRect.height())
              .stringify(),
            to: data.path.clone().stringify(),
            easing: 'easeOutQuint'
          }
        })
      } else if (data.type === 'bar') {
        if (isNaN(data.value.x)) {
          data.element.animate({
            y2: {
              dur: 2000,
              from: data.y1,
              to: data.y2,
              easing: 'easeOutQuint'
            }
          })
        } else {
          data.element.animate({
            x2: {
              dur: 2000,
              from: data.x1,
              to: data.x2,
              easing: 'easeOutQuint'
            }
          })
        }
      }
    }

    if(data.type === 'bar') {
      const serieItem = data.series[data.index]
      if (serieItem && serieItem.colorCustomization) {
        data.element.addClass(serieItem.className)
      }
    }

    if (BarLabelsPluginOptions) {
      if(data.type === 'bar') {
        if (data.value && data.value.x) {
          if (data.value.x < 0.15) {
            data.element.attr({
              style: 'stroke-width: 20px; stroke: #d0021b;'
            })
          } else if (data.value.x < 0.3) {
            data.element.attr({
              style: 'stroke-width: 20px; stroke: #f4c842;'
            })
          } else {
            data.element.attr({
              style: 'stroke-width: 20px'
            })
          }
        }
        data.group.elem('text', {
          // This gets the middle point of the bars and then adds the
          // optional offset to them
          x: positionX(data),
          y: positionY(data),
          style: 'text-anchor: middle; font-size: 12px;',
          fill: '#fff'
        }, BarLabelsPluginOptions.labelClass)
          .text(
            BarLabelsPluginOptions.labelInterpolationFnc(
            // If there's not x (horizontal bars) there must be a y
            data.value.x || data.value.y
          )
        )
      }
    }
  })
}

module.exports = Chart
