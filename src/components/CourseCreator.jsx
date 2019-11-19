import React from 'react'
import PropTypes from 'prop-types'
import Modal from './Modal'
import Form from './Form'
import {Info, Button} from './misc'
import {REGX_COURSE_ID} from '../util/helpers'

export default class CourseCreator extends Form {
  constructor(props) {
    super(props, {
      id: {
        label: 'Unique Course ID / Section Code',
        type: 'text',
        required: true,
        extras: {
          placeholder: 'e.g. A1234-567'
        },
        pattern: {
          value: REGX_COURSE_ID,
          label: 'allowed characters: a-z, A-Z, 0-9, "-", "_"'
        }
      },
      shortName: {
        label: 'Short Name',
        type: 'text',
        required: true,
        uppercase: true,
        pattern: {
          value: REGX_COURSE_ID,
          label: 'allowed characters: a-z, A-Z, 0-9, "-", "_"'
        },
        extras: {
          placeholder: 'e.g. ECON101'
        }
      },
      name: {
        label: 'Full Name',
        type: 'text',
        required: true,
        maxLength: 255,
        extras: {
          placeholder: 'e.g. Principles of Economics'
        }
      },
      term: {
        label: 'Term',
        type: 'select',
        defaultValue: (() => {
          let mm = new Date().getMonth()
          return mm < 3 ? 'Winter' : mm < 6 ? 'Spring' : mm < 9 ? 'Summer' : 'Fall'
        })(),
        extras: {
          opt: ['Winter', 'Spring', 'Summer', 'Fall']
        }
      },
      year: {
        label: 'Year',
        type: 'select',
        defaultValue: new Date().getFullYear(),
        extras: {
          opt: (() => {
            let cur = new Date().getFullYear()
            return [cur - 1, cur, cur + 1, cur + 2]
          })()
        }
      },
      days: {
        label: 'Days',
        type: 'days',
        required: true,
      },
      time: {
        label: 'Time',
        type: 'timeRange',
        defaultValue: ['07:00:00', '08:00:00'],
      },
      tag: {
        label: 'Department (required for scan-station reports)',
        type: 'select',
        defaultValue: null,
        extras: {
          nullable: '<none>',
          // See onListTags()
          opt: []
        }
      }
    })
    this.state.loading = false
    this.state.err = null
    this._pending = null
  }

  /**
   * @override
   */
  submit() {
    let {onSubmit} = this.props
    let fields = this.validate()
    if (this._pending) {
      this._pending.cancel()
    }
    if (fields) {
      this.setState({loading: true})
      this._pending = onSubmit({
        ...fields,
        timeStart: fields.time[0],
        timeEnd: fields.time[1]
      })
      .catch(err => {
        this._pending = null
        this.setState({loading: false, err})
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
    if (this._pending) this._pending.cancel()
    if (this.state.loadingTags) this.state.loadingTags.cancel()
  }

  render() {
    let {onClose} = this.props
    let {err, loading} = this.state
    return (
      <Modal isOpen onRequestClose={onClose}>
        <h4 className='header' aria-level='2'>{'New Course'}</h4>
        <form className='body' onKeyUp={this.keyup} onSubmit={this.preventDefault}>
          {this.renderFormGroups()}
          {err ? <Info>{err.message}</Info> : null}
        </form>
        <div className='footer'>
          <div className='btn-group pull-right'>
            <Button className='btn-default' label='Cancel' onClick={onClose}/>
            <Button className='btn-info' label='Reset' onClick={this.reset}/>
            <Button className='btn-primary' label='Create' onClick={this.submit} loading={loading}/>
          </div>
          <div className='clearfix'/>
        </div>
      </Modal>
    )
  }
}

CourseCreator.propTypes = {
  // Invoked when the modal should be closed
  onClose: PropTypes.func,

  // @param {object} formFields
  onSubmit: PropTypes.func.isRequired,

  onListTags: PropTypes.func.isRequired,
}
