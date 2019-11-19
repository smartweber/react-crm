import React from 'react'
import PropTypes from 'prop-types'
import Modal from './Modal'
import Form from './Form'
import {Info, Button} from './misc'
import ConfirmationModal from './ConfirmationModal'
import {REGX_COURSE_ID} from '../util/helpers'

export default class CourseEditor extends Form {
  constructor(props) {
    super(props, {
      id: {
        label: 'Unique Course ID / Code',
        type: 'text',
        defaultValue: props.data.id,
        extras: {disabled: true}
      },
      shortName: {
        label: 'Short Name',
        type: 'text',
        pattern: {
          value: REGX_COURSE_ID,
          label: 'allowed characters: a-z, A-Z, 0-9, "-", "_"'
        },
        required: true,
        uppercase: true,
        defaultValue: props.data.shortName
      },
      name: {
        label: 'Full Name',
        type: 'text',
        required: true,
        maxLength: 255,
        defaultValue: props.data.name
      },
      term: {
        label: 'Term',
        type: 'select',
        defaultValue: props.data.term,
        extras: {
          opt: ['Winter', 'Spring', 'Summer', 'Fall']
        }
      },
      year: {
        label: 'Year',
        type: 'select',
        defaultValue: props.data.year,
        extras: {
          opt: (() => {
            let cur = props.data.year
            return [cur - 2, cur - 1, cur, cur + 1, cur + 2]
          })()
        }
      },
      days: {
        label: 'Days',
        type: 'days',
        required: true,
        defaultValue: props.data.days,
      },
      time: {
        label: 'Time',
        type: 'timeRange',
        defaultValue: [props.data.timeStart, props.data.timeEnd],
      },
      tag: {
        label: 'Department (used in scan-station reports)',
        type: 'select',
        defaultValue: props.data.tag,
        extras: {
          nullable: '<none>',
          // See onListTags()
          opt: typeof props.data.tag == 'string' ? [props.data.tag] : []
        }
      },
    })
    this.state.saving = false
    this.state.confirming = false
    this.state.err = null
    this.toggleConfirm = () => {
      this.setState({confirming: !this.state.confirming})
    }
  }

  /**
   * @override
   */
  submit() {
    let fields = this.validate()
    if (fields) {
      this.setState({saving: true})
      this.props.onSubmit(fields)
      .catch(err => {
        this.setState({saving: false, err})
      })
    }
  }
  componentDidMount() {
    let pending = this.props.onListTags().then(res => {
      this.formConfig.tag.extras.opt = res.tags
      this.setState({loadingTags: null})
    }).catch(() => {
      // just show the current value
      this.setState({loadingTags: null})
    })
    this.setState({loadingTags: pending})
  }
  componentWillUnmount() {
    if (this.state.loadingTags) this.state.loadingTags.cancel()
  }
  render() {
    let {onClose, onDelete} = this.props
    let {err, saving, confirming} = this.state
    if (confirming) return (
      <ConfirmationModal onClose={this.toggleConfirm} onSubmit={onDelete}>
        <p>
          <strong>{'Are you sure?'}</strong>
          {' You will lose all data associated with this course, including exams and reports.'}
        </p>
      </ConfirmationModal>
    )
    return (
      <Modal isOpen onRequestClose={onClose}>
        <h4 className='header' aria-level='2'>{'Edit Course'}</h4>
        <form className='body' onKeyUp={this.keyup} onSubmit={this.preventDefault}>
          {this.renderFormGroups()}
          {err ? <Info>{err.message}</Info> : null}
        </form>
        <div className='footer'>
          <Button className='btn btn-danger' label='Delete Course' onClick={this.toggleConfirm}/>
          <div className='btn-group pull-right'>
            <Button className='btn-default' label='Cancel' onClick={onClose}/>
            <Button className='btn-primary' label='Save' onClick={this.submit} loading={saving}/>
          </div>
          <div className='clearfix'/>
        </div>
      </Modal>
    )
  }
}

CourseEditor.propTypes = {
  // The existing course fields
  data: PropTypes.object.isRequired,

  // invoked with the new course fields
  onSubmit: PropTypes.func.isRequired,

  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
}
