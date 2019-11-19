import React from 'react'
import PropTypes from 'prop-types'
import {Info, Button} from './misc'

export default class AccountInfo extends React.Component {
  constructor(props) {
    super(props)
    this.state = {saving: false, err: null}
    this._pending = null
    this._inputNickname = null
    this._inputName = null
    this.setNickInput = el => this._inputNickname = el
    this.setNameInput = el => this._inputName = el
    this.keyboard = (evt) => {
      if (evt.keyCode === 13) this.submit()
    }
    this.submit = () => {
      let name = this._inputName.value.trim()
      let nickname = this._inputNickname.value.trim()
      if (name.length < 3) {
        this.setState({err: new Error('Your full name is required')})
        return
      }
      // TODO update global state
      this._pending = this.props.onSubmit({name, nickname}).then(() => {
        this.setState({saving: false, err: null})
      }).catch(err => {
        this.setState({saving: false, err})
      })
      this.setState({saving: true, name, nickname})
    }
  }
  componentWillUnmount() {
    if (this._pending)
      this._pending.cancel()
  }
  render() {
    let {saving, err} = this.state
    let {name, nickname} = this.props.user
    return (
      <div className='accountinfo'>
        <h5>{'Account Info'}</h5>
        <div className='form-group'>
          <label>{'Full Name'}</label>
          <input type='text' className='form-control' defaultValue={name} ref={this.setNameInput} onKeyUp={this.keyboard}/>
        </div>
        <div className='form-group'>
          <label>{'Nickname'}</label>
          <input type='text' className='form-control' defaultValue={nickname} ref={this.setNickInput} onKeyUp={this.keyboard}/>
        </div>
        {err && <Info>{err.message}</Info>}
        <Button className='btn-primary' label='Update Info' loading={saving} onClick={this.submit}/>
      </div>
    )
  }
}
AccountInfo.propTypes = {
  user: PropTypes.object.isRequired,

  // ({name, nickname}) => Promise
  onSubmit: PropTypes.func.isRequired,
}
