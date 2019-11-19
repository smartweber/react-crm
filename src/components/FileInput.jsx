import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
const ACTIVE_CLASSNAME = '--active'

/**
 * Wraps the standard input[type=file] element
 * Supports drag & drop
 */
export default class FileInput extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {active: false}
    this.setContainer = el => this._container = el
    this.dragEnter = this.dragEnter.bind(this)
    this.dragLeave = this.dragLeave.bind(this)
    this.drop = this.drop.bind(this)
    this.open = () => this.input.click()
    this.setInputRef = (el) => this.input = el
    this.change = (evt) => this.submit(evt.target.files)
  }
  submit(files) {
    files = Array.prototype.slice.call(files, 0)
    for (let index = 0; index < files.length; index++) {
      files[index].sizeHuman = bytesToHuman(files[index].size)
    }
    this.props.onChange(this.props.multiple ? files : files[0])
  }
  ignore(evt) {
    evt.preventDefault()
    evt.stopPropagation()
  }
  dragEnter(evt) {
    this.ignore(evt)
    if (!this.state.active) {
      this.setState({active: true})
    }
  }
  dragLeave(evt) {
    this.ignore(evt)
    if (!this._container.contains(evt.relatedTarget)) {
      this.setState({active: false})
    }
  }
  drop(evt) {
    this.ignore(evt)
    this.setState({active: false})
    this.submit(evt.dataTransfer.files)
  }
  render() {
    let classes = cn(
      this.state.active && ACTIVE_CLASSNAME,
      this.props.className || 'btn btn-default')
    return (
      <button type='button' className={classes}
        ref={this.setContainer}
        onDragOver={this.ignore}
        onDragEnter={this.dragEnter}
        onDragLeave={this.dragLeave}
        onDrop={this.drop}
        onClick={this.open}>
        {this.props.children || ' Browse file(s)...'}
        <input type='file' className='hidden'
          accept={this.props.accept}
          multiple={this.props.multiple}
          ref={this.setInputRef}
          onChange={this.change}/>
      </button>
    )
  }
}

export const DragnDrop = props => (
  <FileInput className='file-input' {...props}>
    <div className='detail'>
      <i aria-hidden='true' className='fa fa-upload'/>
      <div>{'Click to browse for files. Or drag & drop from another window.'}</div>
    </div>
  </FileInput>
)

FileInput.propTypes = {
  // @param {File} files - {name, size, sizeHuman, type}
  // An array of Files if multiple: true
  // these can be used with XmlHttpRequest.send()
  onChange: PropTypes.func,

  // Allow more than one file
  multiple: PropTypes.bool,

  // Comma separated list of content type specifiers (e.g.):
  // - '.xls,.xlsx,.csv'
  // - '.jpg,.png,.gif'
  // Or a valid MIME type (e.g.):
  // - 'audio/*'
  // - 'video/*'
  // - 'image/*'
  // - 'text/csv'
  accept: PropTypes.string
}

const SIZES = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
function bytesToHuman(bytes) {
  if (!bytes) return '0B'
  let base = 1000
  let exponent = Math.floor(Math.log(bytes) / Math.log(base))
  return parseFloat((bytes / Math.pow(base, exponent)).toFixed(1)) + ' ' + SIZES[exponent]
}
