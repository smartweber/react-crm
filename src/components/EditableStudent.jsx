import React from 'react'
import {Info} from './misc'

/**
 * For use by RosterEditor
 */
export default class EditableStudent extends React.Component {
  constructor(props) {
    super(props)
    this.state = {loading: false, err: null}
    this.setEmailElement = el => {
      this.emailElement = el
      if (el) el.focus()
    }
    this.setNameElement = el => this.nameElement = el
    this.submit = () => {
      let email = this.emailElement.value
      let name = this.nameElement.value
      this.props.onSubmit(email, name).catch(err => {
        setTimeout(() => {
          this.setState({err: null})
        }, 3000)
        this.setState({loading: false, err})
      })
      this.setState({loading: true})
    }
  }
  render() {
    let {onClose, data} = this.props
    let {loading, err} = this.state
    let actions = null
    if (loading) actions = (
      <td>
        <i aria-hidden='true' className='fa fa-lg fa-spin fa-spinner'/>
        <span className='sr-only'>{'loading'}</span>
      </td>
    )
    else if (err) return (
      <tr>
        <td colSpan='4'>
          <Info>{'update failed'}</Info>
        </td>
      </tr>
    )
    else actions = (
      <td>
        <button type='button' className='btn-link' onClick={onClose}>
          <i aria-hidden='true' className='fa fa-lg fa-ban'/>
          <span className='sr-only'>{'cancel'}</span>
        </button>
        <button type='button' className='btn-link' onClick={this.submit}>
          <i aria-hidden='true' className='fa fa-lg fa-check'/>
          <span className='sr-only'>{'save'}</span>
        </button>
      </td>
    )
    return (
      <tr>
        {actions}
        <td className='sid'>{data.id}</td>
        <td className='email'>
          <input type='email' ref={this.setEmailElement} defaultValue={data.email}/>
        </td>
        <td className='name'>
          <input type='text' ref={this.setNameElement} defaultValue={data.name}/>
        </td>
      </tr>
    )
  }
}
