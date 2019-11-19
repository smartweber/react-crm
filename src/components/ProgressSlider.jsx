import React from 'react'
import PropTypes from 'prop-types'

/**
 * It's a progress-bar with buttons!
 * [<]=====____[>]
 */
export default class ProgressSlider extends React.PureComponent {
  constructor(props) {
    super(props)
    this.click = (evt) => {
      let value = parseInt(evt.currentTarget.getAttribute('data-value'))
      this.props.onClick(value)
    }
  }
  renderBar() {
    let value = Math.ceil(this.props.value * 100)
    if (value > 100) value = 100
    else if (value < 0) value = 0
    return (
      <div className='outerbar'>
        <div className='innerbar' role='progressbar'
          aria-valuemin={0} aria-valuemax={100}
          aria-valuenow={value}
          style={{width: value + '%'}}
        ></div>
      </div>
    )
  }
  render() {
    if (!this.props.onClick) return (
      <div className='progress-slider'>{this.renderBar()}</div>
    )
    return (
      <div className='progress-slider'>
        <button type='button' className='btn btn-default'
        data-value={-1}
        onClick={this.click}>
          <i aria-hidden='true' className='fa fa-chevron-left'/>
          <span className='sr-only'>{'previous item'}</span>
        </button>
        {this.renderBar()}
        <button type='button' className='btn btn-default'
        data-value={1}
        onClick={this.click}>
          <i aria-hidden='true' className='fa fa-chevron-right'/>
          <span className='sr-only'>{'next item'}</span>
        </button>
      </div>
    )
  }
}

ProgressSlider.propTypes = {
  // called with 1 param, a direction: -1 / 1
  onClick: PropTypes.func,

  // a real number 0 <= n <= 1
  value: PropTypes.number,
}
