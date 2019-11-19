import React from 'react'
import PropTypes from 'prop-types'
import {toDateString} from '../util/datetime'
import StripeCard from './StripeCard'
import OrgBilling from './OrgBilling'
import {Button, Info} from './misc'

/**
 * Student License value may be: null, "trial", "semi", "annual"
 * Org License value: null, "deferred", "annual", "custom"
 */
export default class StudentBillingOverview extends React.Component {
  static propTypes = {
    user: PropTypes.object.isRequired,
    onUpdate: PropTypes.func.isRequired,
    onUpdatePayment: PropTypes.func.isRequired,
    onLoadPayment: PropTypes.func.isRequired,
    onUpdateOrg: PropTypes.func.isRequired,
  }
  state = {
    pending: null,
    licenseEditing: false, licenseError: null, licenseLoading: false,
    paymentEditing: false, card: null, paymentLoading: true, paymentError: null,
  }

  setCardElement = el => this.card = el
  changePlan = () => this.setState({
    licenseEditing: !this.state.licenseEditing,
    licenseError: null,
  })
  editPayment = () => this.setState({
    paymentEditing: !this.state.paymentEditing,
    paymentError: null,
  })
  deletePayment = () => {
    let pending = this.props.onUpdatePayment().then(() => {
      this.setState({pending: null, paymentLoading: false, paymentError: null, card: null})
    }).catch(err => {
      this.setState({pending: null, paymentLoading: false, paymentError: err})
    })
    this.setState({pending, paymentLoading: true})
  }
  endSubscription = () => {
    this.submitLicenseChange(null, null, true)
  }
  submitLicenseChange = (_, __, cancelAtPeriodEnd) => {
    let license = cancelAtPeriodEnd ? null
      : document.querySelector('.student-billing-overview .planinfo input:checked').value
    let pending = this.props.onUpdate({license}).then(() => {
      this.setState({pending: null, licenseError: null, licenseLoading: false, licenseEditing: false})
    }).catch(err => {
      this.setState({pending: null, licenseError: err, licenseLoading: false})
    })
    this.setState({pending, licenseLoading: true})
  }
  activateFreeTrial = () => {
    let pending = this.props.onUpdate({license: 'trial'}).then(() => {
      this.setState({pending: null, licenseError: null, licenseLoading: false, licenseEditing: false})
    }).catch(err => {
      this.setState({pending: null, licenseError: err, licenseLoading: false})
    })
    this.setState({pending, licenseLoading: true})
  }
  submitPayment = () => {
    let pending = this.card.tokenize().then(stripeToken => {
      return this.props.onUpdatePayment({stripeToken})
    }).then(res => {
      this.setState({pending: null, paymentLoading: false, paymentError: null, paymentEditing: false, card: res})
    }).catch(err => {
      this.setState({pending: null, paymentLoading: false, paymentError: err})
    })
    this.setState({pending, paymentLoading: true})
  }

  componentDidMount() {
    let pending = this.props.onLoadPayment().then(res => {
      this.setState({pending: null, paymentLoading: false, paymentError: null, card: res})
    }).catch(err => {
      this.setState({pending: null, paymentLoading: false, paymentError: err})
    })
    this.setState({pending})
  }
  componentWillUnmount() {
    if (this.state.pending) this.state.pending.cancel()
  }
  renderLicenseInfo() {
    let {license, cancelAtPeriodEnd, currentPeriodEnd, organizations} = this.props.user
    let openOrgs = organizations.filter(org => org.license === 'deferred' && org.role === 'student')
      .map(org => org.shortName)
      .join(', ')
    var plan, btn, dateText
    switch (license) {
    case 'semi':
    case 'annual':
      plan = cancelAtPeriodEnd ? ' Active (cancelled)' : ' Active '
      btn = <Button className='btn-link btn-sm' label='Change' onClick={this.changePlan}/>
      dateText = (cancelAtPeriodEnd ? 'Expires: ' : 'Next Billing Cycle: ') + toDateString(new Date(currentPeriodEnd))
      break
    case 'trial':
      if (Date.parse(currentPeriodEnd) > Date.now()) {
        plan = ' Trial '
        dateText = `Expires: ${toDateString(new Date(currentPeriodEnd))}`
      }
      else {
        plan = ' Free '
      }
      btn = <Button className='btn-primary btn-sm' label='Upgrade Now' onClick={this.changePlan}/>
      break
    default:
      plan = ' Free '
      btn = <Button className='btn-primary btn-sm' label='Activate 14-day Trial' onClick={this.activateFreeTrial}/>
    }
    return (
      <div className='planinfo'>
        <label>{'Student Plan'}</label>
        <strong className='text'>{plan}</strong>
        {btn}
        {dateText && <small className='date'>{dateText}</small>}
        {openOrgs && <small className='date'>{`Required by ${openOrgs}`}</small>}
      </div>
    )
  }
  renderLicensePicker() {
    let {card} = this.state
    let {license, cancelAtPeriodEnd} = this.props.user
    let cancellable = (license === 'semi' || license === 'annual') && !cancelAtPeriodEnd
    license = license || 'semi'
    return (
      <div className='planinfo'>
        <label>{'Student Plan'}</label>
        <div className='plans'>
          <Info>{' Some organizations may require a subscription before you can download answer sheets or view exam results as a student'}</Info>
          <p><strong>{'How should we bill you?'}</strong></p>
          <div className='radio'>
            <label>
              <input type='radio' value='semi' name='license'
                defaultChecked={license === 'semi'}/>
              {' $7.99 / 6 months'}
            </label>
          </div>
          <div className='radio'>
            <label>
              <input type='radio' value='annual' name='license'
                defaultChecked={license === 'annual'}/>
              {' $12.99 / 12 months'}
            </label>
          </div>
          {!card && <Info>{'Payment method required'}</Info>}
        </div>
        <div className='btns'>
          <Button className='btn-link btn-sm' label='Cancel'
            onClick={this.changePlan}/>
          <Button className='btn-primary btn-sm' label='Submit'
            disabled={!card}
            onClick={this.submitLicenseChange}
            loading={this.state.licenseLoading}/>
          {cancellable && <Button className='btn-danger btn-sm pull-right'
            label='End Subscription'
            onClick={this.endSubscription}/>}
        </div>
      </div>
    )
  }
  renderPaymentInfo() {
    let {card, paymentLoading} = this.state
    if (paymentLoading) return (
      <div className='paymentinfo'>
        <label>{'Payment'}</label>
      </div>
    )
    if (!card) return (
      <div className='paymentinfo'>
        <label>{'Payment'}</label>
        <Button className='btn-link btn-sm' label='Add payment method'
          onClick={this.editPayment}/>
      </div>
    )
    return (
      <div className='paymentinfo'>
        <label>{'Payment'}</label>
        <div className='text'>
          {' '}
          <i aria-hidden='true' className='fa fa-credit-card-alt'/>
          {` ${card.brand} *${card.last4} ${card.month}/${card.year} `}
        </div>
        <div className='btns'>
          <Button className='btn-link btn-sm icon' icon='fa-lg fa-trash'
            onClick={this.deletePayment}/>
          <Button className='btn-link btn-sm icon' icon='fa-lg fa-pencil'
            onClick={this.editPayment}/>
        </div>
      </div>
    )
  }
  renderPaymentEditor() {
    let {paymentLoading} = this.state
    return (
      <div className='paymentedit'>
        <label>{'Payment'}</label>
        <div className='text'>
          <StripeCard zip ref={this.setCardElement}/>
        </div>
        <div className='btns'>
          <Button label='Cancel' className='btn-link btn-sm' onClick={this.editPayment}/>
          <Button label='Submit' className='btn-primary btn-sm'
            loading={paymentLoading} onClick={this.submitPayment}/>
        </div>
      </div>
    )
  }
  shouldShowStudentLicense(user) {
    // you have an active student license
    if (user.license === 'semi' || user.license === 'annual') {
      return true
    }

    // member of at least one "deferred" org where you're not "admin" or "instructor"
    let len = user.organizations && user.organizations.length
    for (let index = 0; index < len; index++) {
      let org = user.organizations[index]
      if (org.license === 'deferred' && org.role !== 'admin' && org.role !== 'instructor') {
        return true
      }
    }
    return false
  }
  render() {
    let {card, paymentError, paymentEditing, licenseEditing, licenseError} = this.state
    let showStudent = this.shouldShowStudentLicense(this.props.user)
    let administeredOrgs = this.props.user.organizations.filter(org => org.role === 'admin')
      .map((org, index)=> (
        <OrgBilling key={index} onSubmit={this.props.onUpdateOrg} card={card} org={org}/>
      ))
    return (
      <div className='student-billing-overview'>
        <h4>{'Billing Overview'}</h4>
        {paymentEditing ? this.renderPaymentEditor() : this.renderPaymentInfo()}
        {paymentError && <Info>{paymentError.message}</Info>}
        {showStudent ? licenseEditing ? this.renderLicensePicker() : this.renderLicenseInfo() : null}
        {licenseError && <Info>{licenseError.message}</Info>}
        {administeredOrgs}
      </div>
    )
  }
}
