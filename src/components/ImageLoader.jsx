import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

export default class ImageLoader extends React.Component {
  static propTypes = {
    src: PropTypes.string.isRequired,
    alt: PropTypes.string,
    useCredentials: PropTypes.bool,
    onFail: PropTypes.func,
  }
  static defaultProps = {
    alt: ' ',
    useCredentials: false
  }
  static initialState = {
    loading: true,
    err: false
  }

  constructor(props) {
    super(props)
    this.state = ImageLoader.initialState
    this.fail = this.fail.bind(this)
    this.done = this.done.bind(this)
  }
  componentDidUpdate(prevProps) {
    if (prevProps.src !== this.props.src) {
      this.setState(ImageLoader.initialState)
    }
  }
  fail() {
    this.setState({loading: false, err: true})
    if (typeof this.props.onFail == 'function') {
      this.props.onFail(this.props)
    }
  }
  done() {
    this.setState({loading: false, err: false})
  }
  renderWarning() {
    return (
      <i className='fa fa-lg fa-exclamation-triangle'/>
    )
  }
  render() {
    let containerClass = cn('image-loader', {
      '-load': this.state.loading,
      '-ready': !this.state.loading && !this.state.err,
      '-fail': this.state.err,
    })
    return (
      <div className={containerClass}>
        <img src={this.props.src} alt={this.props.alt} onError={this.fail} onLoad={this.done}
          crossOrigin={this.props.useCredentials ? 'use-credentials' : undefined}/>
      </div>
    )
  }
}
