import React from 'react'
import PropTypes from 'prop-types'
import {Info, Button} from './misc'
import Modal from './Modal'
import update from '../util/update'
import ConfirmationModal from './ConfirmationModal'
import RosterImporter from './RosterImporter'
import EditableStudent from './EditableStudent'
import {saveAs} from '../util/helpers'

/**
 * View and manage all the students in a course
 * TODO sort by id/name
 * TODO hide email/name column
 */
export default class RosterEditor extends React.Component {
  static propTypes = {
    onDeleteStudent: PropTypes.func.isRequired,
    onAddStudents: PropTypes.func.isRequired,
    onListStudents: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    maxStudents: PropTypes.number,
  }
  static defaultProps = {
    maxStudents: -1
  }

  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      importing: false,
      err: null,
      data: null,
      editing: null,
      dropping: null
    }
    this.pending = null
    this.toggleImport = () => this.setState({importing: !this.state.importing})
    this.toggleDropConfirm = (evt) => {
      let index = null
      if (evt) {
        // evt is undefined when the modal is cancelled
        index = evt.currentTarget.parentNode.parentNode.getAttribute('data-index')
      }
      this.setState({dropping: index})
    }
    this.dropStudent = () => {
      let index = this.state.dropping
      let student = this.state.data[index]
      return this.props.onDeleteStudent(student.id)
      .then(() => {
        this.setState({
          data: update(this.state.data, {$splice: [[index, 1]]}),
          dropping: null
        })
      })
    }
    this.addStudents = (students) => {
      return this.props.onAddStudents(students)
      .then(() => {
        // TODO data: res.students (returns a 204 right now)
        this.setState({data: this.state.data.concat(students), importing: false})
      })
    }
    this.export = () => {
      let text = RosterImporter.serialize(this.state.data)
      saveAs(text, 'text/csv;charset=utf-8', 'roster.csv')
    }
  }
  componentDidMount() {
    this.props.onListStudents()
    .then(res => {
      this.setState({loading: false, err: null, data: res.students})
    })
    .catch(err => {
      this.setState({loading: false, err})
    })
  }
  renderStudent(actions, student, index) {
    return (
      <tr key={student.id} data-index={index}>
        {actions}
        <td className='sid'>{student.id}</td>
        <td className='email'>{student.email || null}</td>
        <td className='name'>{student.name || null}</td>
      </tr>
    )
  }
  renderList() {
    let {err, data} = this.state
    let {maxStudents} = this.props
    if (err) return (
      <Info>{err.message}</Info>
    )
    if (!data || data.length < 1) return (
      <p>{'No students have yet been added to the course.'}</p>
    )
    let actions = (
      <td>
        <button type='button' className='btn-link' onClick={this.toggleDropConfirm}>
          <i aria-hidden='true' className='fa fa-lg fa-times'/>
          <span className='sr-only'>{'drop student'}</span>
        </button>
      </td>
    )
    let rows = data.map((student, index) => this.renderStudent(actions, student, index))
    return (
      <div>
        <p style={{fontWeight: 'bold', textAlign: 'center'}}>
          {maxStudents > 0
            ? `Total students: ${data.length}/${maxStudents}`
            : `Total students: ${data.length}`}
        </p>
        <div className='table-responsive'>
          <table className='table table-condensed' summary='Roster table'>
            <thead>
              <tr>
                <th/>
                <th>{'ID'}</th>
                <th>{'Email'}</th>
                <th>{'Name'}</th>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
        </div>
      </div>
    )
  }
  renderFooter() {
    return (
      <div className='footer'>
        <div className='btn-group pull-right'>
          <Button className='btn-default' label='Close' onClick={this.props.onClose}/>
        </div>
        <div style={{clear: 'both'}}/>
      </div>
    )
  }
  render() {
    let {onClose, maxStudents} = this.props
    let {err, loading, data, importing} = this.state
    if (loading) return <Modal isOpen loading={true} onRequestClose={onClose}/>
    let canExport = !err && data.length > 0
    if (this.state.dropping) return (
      <ConfirmationModal onClose={this.toggleDropConfirm} onSubmit={this.dropStudent}>
        <p>
          <strong>{'Are you sure?'}</strong>
          {' You will lose all test data in this course related to the student.'}
        </p>
      </ConfirmationModal>
    )
    if (importing) return (
      <RosterImporter maxStudents={maxStudents}
        onClose={this.toggleImport} onSubmit={this.addStudents} students={data}/>
    )
    return (
      <Modal isOpen className='roster-editor -large' onRequestClose={onClose}>
        <h4 className='header' aria-level='2'>{'Class Roster'}</h4>
        <div className='body'>
          <div className='text-center'>
            <div className='btn-group'>
              <Button icon='fa-upload' label='Import' onClick={this.toggleImport}/>
              <Button icon='fa-download' label='Export' disabled={!canExport} onClick={this.export}/>
            </div>
          </div>
          {this.renderList()}
        </div>
        {this.renderFooter()}
      </Modal>
    )
  }
}
