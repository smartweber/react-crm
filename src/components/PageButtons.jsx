import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

/**
 * Display pagination buttons for any kind of list
 */
export default class PageButtons extends React.PureComponent {
  constructor(props) {
    super(props)
    this.showPrev = () => this.props.onChange(-1)
    this.showNext = () => this.props.onChange(1)
  }
  render() {
    let {more, less, className, loading} = this.props
    let loadingclass = loading && 'btn-loading btn-info'
    return (
      <div className={cn('btn-group', className, loadingclass)} role='group' aria-label='...'>
        <button type='button' className='btn btn-sm btn-default'
          disabled={!less || loading}
          onClick={this.showPrev}>
          <i aria-hidden='true' className='fa fa-chevron-left'/>
          {' Prev'}
        </button>
        <button type='button' className='btn btn-sm btn-default'
          disabled={!more || loading}
          onClick={this.showNext}>
          {'Next '}
          <i aria-hidden='true' className='fa fa-chevron-right'/>
        </button>
      </div>
    )
  }
}

PageButtons.propTypes = {
  // @param {number} direction +1 or -1
  // onChange(direction)
  onChange: PropTypes.func.isRequired,
  more: PropTypes.bool,
  less: PropTypes.bool
}
