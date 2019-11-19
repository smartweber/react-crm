import React from 'react'
import PropTypes from 'prop-types'
import {Button, Info} from './misc'
import {toDateString} from '../util/datetime'

/**
 * Display or change the current usage plan of an organization
 */
export default class OrgBilling extends React.Component {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
    card: PropTypes.object,
    org: PropTypes.object.isRequired
  }
  state = {pending: null, saving: false, active: false, err: null}

  toggle = () => {
    this.setState({err: null, active: !this.state.active})
  }
  submit = (evt) => {
    let license = evt.currentTarget.getAttribute('data-id')
    if (license === 'teacher' && !this.props.card) {
      this.setState({err: new Error('Payment method required')})
      return
    }
    let pending = this.props.onSubmit(this.props.org.id, license)
    .then(() => {
      this.setState({pending: null, saving: false, err: null, active: false})
    })
    .catch(err => {
      this.setState({pending: null, saving: false, err})
    })
    this.setState({pending, saving: license})
  }

  componentWillUnmount() {
    if (this.state.pending) this.state.pending.cancel()
  }

  renderOptions() {
    let {license, cancelAtPeriodEnd} = this.props.org
    let {err, saving} = this.state
    if (license && cancelAtPeriodEnd) {
      license = null
    }
    return (
      <div className='org-billing'>
        <p>
          <strong>{'Choose your usage plan.'}</strong>
          <button type='button' className='btn btn-link btn-sm'
            onClick={this.toggle}>{'Cancel'}</button>
        </p>
        {err && <Info>{err.message}</Info>}
        <div className='cards'>
          <div className='card'>
            <div className='title'>{'Free'}</div>
            <div className='price'>{'$ 0'}</div>
            <div className='desc'>
              <center>{'Try things out. For free.'}</center>
              <ul>
                <li>{'Limited to 1 answer key'}</li>
                <li>{'Limited to 20 questions per exam'}</li>
                <li>{'Limited to 40 students per class'}</li>
                <li>{'No student subscriptions required'}</li>
                <li>{'Single user'}</li>
              </ul>
            </div>
            <Button className='btn-primary'
              disabled={!license} loading={saving == null}
              onClick={this.submit}>{'Activate'}</Button>
          </div>

          <div className='card'>
            <div className='title'>{'Teacher'}</div>
            <div className='price'>{'$ 150 / year'}</div>
            <div className='desc'>
              <center>{'Great for small classes.'}</center>
              <ul>
                <li>{'Limited to 100 questions per exam'}</li>
                <li>{'Limited to 40 students per class'}</li>
                <li>{'No student subscriptions required'}</li>
                <li>{'Single user'}</li>
              </ul>
            </div>
            <Button type='button' className='btn-primary'
              disabled={license === 'teacher'}
              loading={saving === 'teacher'}
              data-id='teacher'
              onClick={this.submit}>{'Buy Now (one click)'}</Button>
          </div>

          <div className='card'>
            <div className='title'>{'Students'}</div>
            <div className='price'>{'$ 0'}</div>
            <div className='desc'>
              <center>{'Students must purchase a subscription.'}</center>
              <ul>
                <li>{'Limited to 100 questions per exam'}</li>
                <li>{'Unlimited students'}</li>
                <li>{'Student Plan required to download blank sheets, or to view results.'}</li>
                <li>{'Multi-user management'}</li>
              </ul>
            </div>
            <Button type='button' className='btn btn-primary'
              disabled={license === 'deferred'}
              loading={saving === 'deferred'}
              data-id='deferred'
              onClick={this.submit}>{'Activate'}</Button>
          </div>

          <div className='card'>
            <div className='title'>{'Campus'}</div>
            <a className='price' href='https://a.com/contact'
              target='_blank' rel='noopener noreferrer'>{'contact us'}</a>
            <div className='desc'>
              <center>{'Flexible pricing for large organizations.'}</center>
              <ul>
                <li>{'Limited to 100 questions per exam'}</li>
                <li>{'Unlimited students'}</li>
                <li>{'No student subscriptions required'}</li>
                <li>{'Multi-user management'}</li>
              </ul>
            </div>
            <a className='price' href='https://a.com/contact'
              target='_blank' rel='noopener noreferrer'>{'contact us'}</a>
          </div>
        </div>
      </div>
    )
  }
  renderStatus() {
    let {license, cancelAtPeriodEnd, currentPeriodEnd, shortName} = this.props.org
    let licenseName = license === 'deferred' ? 'Students'
      : license === 'teacher' ? 'Teacher' + (cancelAtPeriodEnd ? ' (cancelled)' : '')
      : license === 'custom' ? 'Campus'
      : 'Free'
    let btn = license
      ? <Button className='btn-link btn-sm' label='Change' onClick={this.toggle}/>
      : <Button className='btn-primary btn-sm' label='Upgrade Now' onClick={this.toggle}/>
    let dateText = (cancelAtPeriodEnd ? 'Expires: ' : 'Next Billing Cycle: ') + toDateString(new Date(currentPeriodEnd))
    return (
      <div className='planinfo'>
        <label>{'Org Plan'}</label>
        <strong className='text'>{licenseName}</strong>
        {btn}
        <small className='date'>{shortName}</small>
        {license === 'teacher' && <small className='date'>{dateText}</small>}
      </div>
    )
  }
  render() {
    return this.state.active ? this.renderOptions() : this.renderStatus()
  }
}
