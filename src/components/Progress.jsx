import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

/**
 * Utility wrapper for an animated progress bar
 */
export default function Progress(props) {
  let {value, disabled, aura, className} = props
  let innerClassName = cn('progress-bar', {
    'progress-bar-striped active': !disabled,
  })
  if (aura) {
    innerClassName += 'progress-bar-' + aura
  }
  return (
    <div className={cn(className, 'progress')}>
      <div className={innerClassName}
        role='progressbar'
        aria-valuenow={value}
        aria-valuemin='0'
        aria-valuemax='100'
        style={{width: value + '%'}}
        ><span className='sr-only'>{value + '% complete'}</span>
      </div>
    </div>
  )
}

Progress.propTypes = {
  aura: PropTypes.oneOf(['success', 'info', 'warning', 'danger']),
  disabled: PropTypes.bool, // Toggle stripes & animation
  value: PropTypes.number.isRequired // 0-100
}
