import request from './request'
const BASE_URL = process.env.API_ORIGIN

/**
 * Login, update account info, or change your password
 */
export default {
  getPayment: {
    example: process.env.MOCK_PAYMENT && (() => ({
      body: {
        last4: '4242',
        brand: 'Visa',
        year: 2040,
        month: 7,
      }
    })),
    method: 'GET',
    url: () => `${BASE_URL}/payment`
  },
  setPayment: {
    example: process.env.MOCK_PAYMENT && ((stripeToken) => ({
      body: stripeToken && {
        last4: '4242',
        brand: 'Visa',
        year: 2040,
        month: 7,
      }
    })),
    method: 'PUT',
    body: ['stripeToken'],
    url: () => `${BASE_URL}/payment`
  },
  resetPW: {
    method: 'POST',
    body: ['email'],
    url: () => `${BASE_URL}/auth/reset`
  },
  logout: {
    method: 'POST',
    url: () => `${BASE_URL}/auth/logout`
  },
  updatePasswd: {
    method: 'POST',
    body: ['email', 'passwd', 'passwdNext'],
    url: () => `${BASE_URL}/auth/update-passwd`
  },
  updateEmail: {
    method: 'POST',
    body: ['email', 'passwd'],
    url: () => `${BASE_URL}/auth/update-email`
  },
  register: {
    method: 'POST',
    body: ['email', 'name', 'nickname'],
    url: () => `${BASE_URL}/auth/register`
  },
  verify: {
    method: 'POST',
    body: ['token', 'pass'],
    url: () => `${BASE_URL}/auth/verify`
  },
  me: {
    transformResponse: process.env.MOCK_PAYMENT && (res => ({
      ...res.body,
      license: 'annual',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date(2020, 0, 1).toISOString(),
      organizations: (res.body.organizations || []).map(org => ({
        ...org,
        license: 'open',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: new Date(2020, 0, 1).toISOString(),
      }))
    })),
    url: () => `${BASE_URL}/users/me`
  },
  update: {
    method: 'PATCH',
    body: ['name', 'nickname', 'license'],
    url: () => `${BASE_URL}/users/me`
  },
  uploadIcon: {
    method: 'POST',
    serialize: 'noop',
    body: opt => opt.blob,
    url: `${BASE_URL}/content/users.icon`
  }
}
