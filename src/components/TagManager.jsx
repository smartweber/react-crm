import React from 'react'
import PropTypes from 'prop-types'
import Modal from './Modal'
import {Info, Button} from './misc'
import {REGX_COURSE_TAG} from '../util/helpers'

const HELP_TEXT = `
Department labels are used to group courses for the Scan Station Usage Report.
Only an administrator can modify these labels,
but instructors may apply a label when creating or editing a course.
`

export default class TagManager extends React.Component {
  static propTypes = {
    onClose: PropTypes.func.isRequired,
    onLoad: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
  }
  constructor(props) {
    super(props)
    this.state = {
      err: null,
      loading: null,
      saving: null,
      tags: null,
      selectedIndex: -1
    }
    this.submit = this.submit.bind(this)
    this.selectTag = this.selectTag.bind(this)
    this.add = this.add.bind(this)
  }
  componentDidMount() {
    let loading = this.props.onLoad().then(res => {
      this.setState({err: null, loading: null, tags: res.tags})
    }).catch(err => {
      this.setState({err: err, loading: null})
    })
    this.setState({loading})
  }
  componentWillUnmount() {
    if (this.state.loading) this.state.loading.cancel()
    if (this.state.saving) this.state.saving.cancel()
  }
  submit(index, prev, label) {
    if (typeof label == 'string' && !REGX_COURSE_TAG.test(label = label.trim())) {
      this.setState({err: {message: 'invalid label: "a-z", "A-Z", 2-16'}})
      return
    }
    if (!prev && !label) { // cancel new item
      let tags = this.state.tags.slice(0)
      tags.splice(index, 1)
      this.setState({selectedIndex: -1, tags})
      return
    }
    if (prev === label) { // no change
      this.setState({selectedIndex: -1})
      return
    }
    let saving = this.props.onSubmit(label, prev).then(() => {
      let tags = this.state.tags.slice(0)
      if (prev && !label) { // delete
        tags.splice(index, 1)
      }
      else { // create, rename
        tags.splice(index, 1, label)
      }
      this.setState({err: null, saving: null, selectedIndex: -1, tags: tags})
    }).catch(err => {
      this.setState({err: err, saving: null})
    })
    this.setState({saving: saving})
  }
  selectTag(evt) {
    if (this.state.saving) return // one at a time!
    let tags = this.state.tags
    if (this.state.selectedIndex !== -1 && !this.state.tags[this.state.selectedIndex]) {
      // cancel new item
      tags = this.state.tags.slice(0)
      tags.splice(this.state.selectedIndex, 1)
    }
    let selectedIndex = parseInt(evt.currentTarget.getAttribute('data-id'))
    this.setState({selectedIndex, tags})
  }
  add() {
    if (this.state.selectedIndex !== -1 && !this.state.tags[this.state.selectedIndex]) {
      return
    }
    let tags = this.state.tags.slice(0)
    let selectedIndex = tags.push(null) - 1
    this.setState({tags, selectedIndex})
  }
  renderTags() {
    /*
      TODO
      - final element is a +, click to add a new label, focus on the empty input box [CHECK | CANCEL]
    */
    let tags = this.state.tags
    if (!tags) return null
    let elements = tags.map((label, index) => {
      return <LabelGroup key={index} id={index} label={label}
        loading={this.state.saving}
        expand={this.state.selectedIndex === index}
        onClick={this.selectTag}
        onSubmit={this.submit}
      />
    })
    let add = (
      <button type='button' className='btn btn-default' onClick={this.add}>
        <i aria-hidden='true' className='fa fa-fw fa-plus'/>
        {'Add'}
      </button>
    )
    return <div className='tags'>{elements}{add}</div>
  }
  render() {
    let {err} = this.state
    if (this.state.loading) return <Modal isOpen loading onRequestClose={this.props.onClose}/>
    return (
      <Modal isOpen onRequestClose={this.props.onClose}>
        <h4 className='header' aria-level='2'>{'Manage Department Labels'}</h4>
        <div className='body tag-manager'>
          <Info>{HELP_TEXT}</Info>
          {this.renderTags()}
          {err ? <Info>{err.message}</Info> : null}
        </div>
        <div className='footer'>
          <div className='pull-right'>
            <Button className='btn-default' label='Close' onClick={this.props.onClose}/>
          </div>
          <div className='clearfix'/>
        </div>
      </Modal>
    )
  }
}

// id, label, expand, onClick(evt), onSubmit(index, prev, next)
class LabelGroup extends React.Component {
  constructor(props) {
    super(props)
    this.edit = this.edit.bind(this)
    this.trash = this.trash.bind(this)
    this.keycheck = this.keycheck.bind(this)
    this.updateRef = el => this._input = el
  }
  keycheck(evt) {
    if (!this.props.loading && evt.keyCode === 13)
      this.edit()
  }
  edit() {
    if (!this.props.loading)
      this.props.onSubmit(this.props.id, this.props.label, this._input.value)
  }
  trash() {
    if (!this.props.loading)
      this.props.onSubmit(this.props.id, this.props.label, null)
  }
  render() {
    if (this.props.expand) return (
      <div className='input-group' data-id={this.props.id}>
        <input type='text' className='form-control' autoFocus
          disabled={this.props.loading}
          ref={this.updateRef} defaultValue={this.props.label} onKeyUp={this.keycheck}/>
        <span className='input-group-btn'>
          <button type='button' className='btn btn-default' onClick={this.edit}>
            <i aria-hidden='true' className='fa fa-check'/>
            <span className='sr-only'>{'Edit'}</span>
          </button>
          <button type='button' className='btn btn-danger' onClick={this.trash}>
            <i aria-hidden='true' className='fa fa-trash'/>
            <span className='sr-only'>{'Delete'}</span>
          </button>
        </span>
      </div>
    )
    return (
      <button type='button' className='btn btn-default'
        data-id={this.props.id} onClick={this.props.onClick}>
        <i aria-hidden='true' className='fa fa-fw fa-tag'/>
        {this.props.label}
      </button>
    )
  }
}
