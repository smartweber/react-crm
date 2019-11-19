import React from 'react'
import PropTypes from 'prop-types'
import {loadJS} from '../util/helpers'
import {Info} from './misc'
import Promise from '../util/promise'

let stripe = null
const STRIPE_JS = 'https://js.stripe.com/v3'
const STRIPE_PUBLIC_KEY = process.env.STRIPE_PUBLIC_KEY
const STRIPE_CLASSES = {
  base: 'stripe-container',
  complete: '-complete',
  empty: '-empty',
  focus: '-focus',
  invalid: '-invalid',
  webkitAutofill: '-webkit-autofill'
}

/**
 * Wraps the Stripe.js api for collecting payment info
 * <script src="https://js.stripe.com/v3"></script>
 * https://stripe.com/docs/elements/reference
 */
export default class StripeCard extends React.Component {
  constructor(props) {
    super(props)
    this.state = {loading: !stripe, err: null, value: null}
    this.init = this.init.bind(this)
    this.tokenize = this.tokenize.bind(this)
  }

  /**
   * @public
   * @param {object} billingAddress
   */
  tokenize(info) {
    info = info ? Object.assign(info, this.state.value) : this.state.value
    info = {
      name: info.name,
      address_line1: info.line1,
      address_line2: info.line2,
      address_city: info.city,
      address_state: info.state,
      address_zip: info.postalCode,
      address_country: info.country,
    }
    // Convert from whatever promise implementation Stripe is using
    // and split the {error, token} object into reject/resolve values
    return Promise.resolve(stripe.createToken(this.card, info)).then(res => {
      if (res.error) throw new Error(res.error.message || res.error.type)
      return res.token.id
    })
  }

  init(stripeContainer) {
    if (!stripeContainer) return null
    this.card = stripe.elements().create('card', {
      classes: STRIPE_CLASSES,
      hidePostalCode: !this.props.zip,
      iconStyle: 'solid',
      style: this.props.style
    })
    this.card.on('change', (evt) => {
      this.setState({value: evt.value})
      if (this.props.onChange) this.props.onChange(evt.complete && evt.value)
    })
    this.card.mount(stripeContainer)
  }

  componentDidMount() {
    if (!stripe) loadJS(STRIPE_JS)
    .then(() => {
      if (!window.Stripe) throw new Error('stripe library not found')
      stripe = window.Stripe(STRIPE_PUBLIC_KEY)
      this.setState({loading: false})
    })
    .catch(err => {
      this.setState({loading: false, err})
    })
  }
  render() {
    return this.state.loading
      ? null
      : this.state.err ? <Info>{'failed to load stripe'}</Info>
      : <div ref={this.init}></div>
  }
  componentWillUnmount() {
    if (this.card) this.card.unmount()
  }
}

StripeCard.propTypes = {
  style: PropTypes.object,
  zip: PropTypes.bool,

  // ({postalCode}) => null
  onChange: PropTypes.func
}

StripeCard.defaultProps = {
  style: {
    base: {
      fontSize: '16px'
    }
  }
}
