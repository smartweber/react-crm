import React from 'react'
import Select from './Select'
import Modal from './Modal'
import FileInput from './FileInput'
import {Info, Button} from './misc'
import {toObjects} from '../util/csv'
import update from '../util/update'
import Table from './Table'

/**
 * @abstract
 * @see RosterImporter
 * Should define:
 * - this.title
 * - this.previewColumns
 * - this.placeholder
 * - this.help
 * - this.validate(items)
 * - this.transform(data, mapFrom)
 * - this.previewRow(item, index)
 */
export default class CSVImporter extends React.Component {
  constructor(props, opt) {
    super(props)
    this.state = {
      saving: false,
      editing: true,
      isCSVHeader: true,
      err: null,
      active: false,
      data: null, // [{}]
      text: null,
      fieldMapOptions: [{label: 'ignored'}].concat(opt),
      fields: null // [{label: '', mapTo: 0}]
    }
    this._initialOpts = this.state.fieldMapOptions
    this._inputElement = null
    this.setInputElement = el => this._inputElement = el
    this.ignore = this.ignore.bind(this)
    this.back = this.back.bind(this)
    this.next = this.next.bind(this)
    this.dragEnter = this.dragEnter.bind(this)
    this.dragLeave = this.dragLeave.bind(this)
    this.drop = this.drop.bind(this)
    this.replaceTextContent = this.replaceTextContent.bind(this)
    this.changeFieldMap = this.changeFieldMap.bind(this)
    this.submit = this.submit.bind(this)
    this.changeCSVHeader = this.changeCSVHeader.bind(this)
  }

  /**
   * @abstract
   * @return {object[] | Error}
   * If the imported items fail validation, then return the Error
   * Otherwise return the items
   */
  validate(items) {
    return items
  }
  /**
   * @abstract
   */
  transform(data, mapFrom) {}
  /**
   * @abstract
   * Map a row of imported data to an array of values for preview
   * @return {string[]}
   */
  previewRow(item, index) {}

  guessColumns(label) {
    switch (label) {
    case 'Column 1': return 1
    case 'Column 2': return 2
    case 'Column 3': return 3
    default: return 0
    }
  }
  ignore(evt) {
    evt.preventDefault()
    evt.stopPropagation()
  }
  back() {
    if (this.state.editing) this.props.onClose()
    else this.setState({editing: true, fieldMapOptions: this._initialOpts})
  }
  next() {
    let text = this._inputElement.value
    let data = toObjects(text, this.state.isCSVHeader)
    if (data.length > 0) {
      let fields = Object.keys(data[0]).map(label => ({
        label: label,
        mapTo: this.guessColumns(label)
      }))
      this.setState({err: null, editing: false, fields, data, text})
    }
  }
  dragEnter(evt) {
    this.ignore(evt)
    if (!this.state.active) this.setState({active: true})
  }
  dragLeave(evt) {
    this.ignore(evt)
    if (this.state.active) this.setState({active: false})
  }
  drop(evt) {
    this.ignore(evt)
    this.replaceTextContent(evt.dataTransfer.files[0])
    this.setState({active: false})
  }
  replaceTextContent(file) {
    if (file && (file.type === 'text/csv' || /\.csv/i.test(file.name))) {
      let reader = new FileReader()
      reader.onload = () => {
        if (this._inputElement) {
          this._inputElement.value = reader.result
        }
      }
      reader.readAsText(file)
    }
  }
  changeFieldMap(field, opt) {
    let prevOptIndex = field.mapTo
    let optIndex = this.state.fieldMapOptions.indexOf(opt)
    let fieldIndex = this.state.fields.indexOf(field)
    this.setState(update(this.state, {
      fields: {
        [fieldIndex]: {
          $merge: {mapTo: optIndex}
        }
      },
      fieldMapOptions: {
        [optIndex]: {
          $merge: {disabled: optIndex > 0}
        },
        [prevOptIndex]: {
          $merge: {disabled: false}
        }
      }
    }))
  }
  changeCSVHeader(evt) {
    this.setState({
      isCSVHeader : evt.target.checked
    })
  }
  mapFrom() {
    let fields = this.state.fields
    let mapFrom = {} // destinationColumnLabel -> importedColumnLabel
    for (let index = 0; index < fields.length; index++) {
      let opt = this.state.fieldMapOptions[fields[index].mapTo]
      if (opt.value != null) {
        mapFrom[opt.value] = fields[index].label
      }
    }
    return mapFrom
  }
  submit() {
    let items = this.transform(this.state.data, this.mapFrom())
    items = this.validate(items)
    if (items instanceof Error) {
      this.setState({err: items})
    }
    else if (items.length > 0) {
      this.setState({saving: true})
      this.props.onSubmit(items).catch(err => {
        this.setState({saving: false, err})
      })
    }
  }
  renderMappings() {
    let {fieldMapOptions, fields} = this.state
    let inputGroups = fields.map(field => (
      <FieldMapper key={field.label}
        opt={fieldMapOptions} onChange={this.changeFieldMap} field={field}/>
    ))
    return <div className='fields'>
      <div className='alert alert-info'>
        <i aria-hidden='true' className='fa fa-lg fa-info-circle'/>
        {' Select the purpose of each CSV field, then preview the results before submitting.'}
      </div>
      {inputGroups}
      {this.renderPreview()}
    </div>
  }
  renderPreview() {
    let items = this.transform(this.state.data, this.mapFrom())
    if (items.length === 0) {
      return null
    }
    let rows = items.map(this.previewRow)
    return <Table header={[this.previewColumns]} body={rows} summary='CSV preview importer table'/>
  }
  renderTextArea() {
    let {active, text, isCSVHeader} = this.state
    return (
      <div className='intro'>
        <div className='alert alert-info'>
          <i className='fa fa-lg fa-info-circle'/>
          {this.help}
        </div>
        <div className='file-input-containter'>
          <div>
            <FileInput accept='text/csv,.csv' onChange={this.replaceTextContent}/>
          </div>
          <div className='checkbox'>
            <label className={`checkbox-wrapper ${isCSVHeader ? 'checked' : ''}`}>
              <input type='checkbox' className='sr-only'
                checked={isCSVHeader}
                onChange={this.changeCSVHeader}
              />
              <i className="fa fa-check" aria-hidden="true"></i>
            </label>
            {'My csv file has headers'}
          </div>
        </div>
        <textarea className={active ? 'csv active' : 'csv'}
          defaultValue={text}
          ref={this.setInputElement}
          onDragOver={this.ignore}
          onDragEnter={this.dragEnter}
          onDragLeave={this.dragLeave}
          onDrop={this.drop}
          placeholder={this.placeholder}/>
      </div>
    )
  }
  render() {
    let {onClose, ltiLaunchActive} = this.props
    let {err, editing, saving} = this.state
    return (
      <Modal isOpen ltiLaunchActive={ltiLaunchActive} className='csv-importer' onRequestClose={onClose}>
        <h4 className='header' aria-level='2'>{this.title}</h4>
        <div className='body'>
          {editing ? this.renderTextArea() : this.renderMappings()}
          {err ? <Info>{err.message}</Info> : null}
        </div>
        <div className='footer'>
          <div className='btn-group pull-right'>
            <Button label='Back' onClick={this.back}/>
            {editing
              ? <Button className='btn-primary' onClick={this.next}>
                {'Next '}
                <i aria-hidden='true' className='fa fa-chevron-right'/>
              </Button>
              : <Button className='btn-primary' label='Submit' loading={saving} onClick={this.submit}/>
            }
          </div>
          <div style={{clear: 'both'}}/>
        </div>
      </Modal>
    )
  }
}

// {onChange, opt, field} = props
class FieldMapper extends React.Component {
  constructor(props) {
    super(props)
    this.change = opt => {
      this.props.onChange(this.props.field, opt)
    }
  }
  render() {
    let {opt, field} = this.props
    return (
      <div className='input-group'>
        <div className='form-control form-control-static' disabled>{field.label}</div>
        <Select opt={opt} value={opt[field.mapTo]} onChange={this.change} labeler='label'/>
      </div>
    )
  }
}
