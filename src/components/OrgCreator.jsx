import React from 'react'
import PropTypes from 'prop-types'
import Form from './Form'
import {Info, Button} from './misc'
import api from '../api'

// Display mode enums
const TEACHER = false
const UNIVERSITY = true

export default class OrgCreator extends React.Component {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired
  }
  constructor(props) {
    super(props)
    this.state = {mode: TEACHER}
    this.toggle = this.toggle.bind(this)
  }
  renderBtn(label, expected, actual) {
    return (
      <button type='button' className={expected === actual ? 'btn btn-primary' : 'btn btn-default'}
        onClick={expected === actual ? null : this.toggle}
      >{label}</button>
    )
  }
  toggle() {
    this.setState({mode: !this.state.mode})
  }
  render() {
    return (
      <main className='container form-container --md'>
        <h3>
          <span style={{display: 'inline-block', margin: '0 12px 12px 0'}}>{'New organization'}</span>
          <div className='btn-group'>
            {this.renderBtn('Teacher', TEACHER, this.state.mode)}
            {this.renderBtn('University', UNIVERSITY, this.state.mode)}
          </div>
        </h3>
        {this.state.mode === TEACHER
          ? <TeacherOrgForm onSubmit={this.props.onSubmit}/>
          : <UniversityOrgForm onSubmit={this.props.onSubmit}/>}
      </main>
    )
  }
}

export class OrgForm extends Form {
  constructor(props, formConfig) {
    super(props, formConfig)
    this.state.loading = false
    this.state.err = null
  }
  submit() {
    let fields = this.validate()
    if (fields) {
      this.setState({loading: true})
      api.orgs.create(fields)
      .then(org => {
        this.setState({loading: false, err: null})
        this.props.onSubmit(org)
      })
      .catch(err => {
        this.setState({loading: false, err})
      })
    }
  }
}

export class TeacherOrgForm extends OrgForm {
  constructor(props) {
    super(props, {
      shortName: {
        type: 'text',
        label: 'Your Name',
        extras: {placeholder: 'e.g. Mr. Escalante'},
        maxLength: 80,
        required: true,
      },
      name: {
        type: 'text',
        label: 'School Name',
        extras: {placeholder: 'e.g. Garfield High'},
        maxLength: 255,
        required: true,
      },
    })
  }
  render() {
    let {err, loading} = this.state
    return (
      <form onKeyUp={this.keyup}>
        {err ? <Info>{err.message}</Info> : null}
        {this.renderFormGroups()}
        <p>{'Students can access answer sheets and exam results for free. Purchase a teacher license to create larger exams.'}</p>
        <Button className='btn-primary' onClick={this.submit} loading={loading}
          label='Create organization'/>
      </form>
    )
  }
}

export class UniversityOrgForm extends OrgForm {
  constructor(props) {
    super(props, {
      name: {
        type: 'text',
        label: 'University or school name',
        extras: {placeholder: 'e.g. University, Irvine'},
        maxLength: 255,
        required: true,
      },
      shortName: {
        type: 'text',
        label: 'Abbreviation',
        extras: {placeholder: 'e.g. GUI'},
        maxLength: 80,
        required: true,
      },
    })
  }
  render() {
    let {err, loading} = this.state
    return (
      <form onKeyUp={this.keyup}>
        {err ? <Info>{err.message}</Info> : null}
        {this.renderFormGroups()}
        <p>{'By default, students must purchase a subscription to access answer sheets. Campus-wide licenses are available for scalable services to faculty and students.'}</p>
        <p className='bold'>{'Contact '}<a href='mailto:sales@a.com'>{'sales@a.com'}</a>{' for a campus-wide license.'}</p>
        <Button className='btn-primary' onClick={this.submit} loading={loading}
          label='Create organization'/>
      </form>
    )
  }
}
