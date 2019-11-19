const BASE_URL = process.env.API_ORIGIN

/**
 * Manage or view your organizations AKA schools
 */
export default {
  create: {
    method: 'POST',
    body: ['name', 'shortName'],
    url: `${BASE_URL}/organizations`
  },
  update: {
    example: process.env.MOCK_UPDATE_ORG === 'true' && (props => ({
      body: {
        id: props.orgId,
        license: props.license,
        shortName: 'SAMPLE',
        name: 'Sample Organization',
        cancel: false,
        end: '2017-12-05T08:00:00Z'
      }
    })),
    method: 'PATCH',
    required: ['orgId'],
    body: ['license'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}`
  },
  remove: {
    method: 'DELETE',
    required: ['orgId'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}`
  },
  uploadBanner: {
    method: 'POST',
    serialize: 'noop',
    body: opt => opt.blob,
    query: ['orgId'],
    url: `${BASE_URL}/content/orgs.rectangularIcon`
  },
  uploadIcon: {
    method: 'POST',
    serialize: 'noop',
    body: opt => opt.blob,
    query: ['orgId'],
    url: `${BASE_URL}/content/orgs.squareIcon`
  },
  listStudents: {
    method: 'GET',
    required: ['orgId'],
    query: ['filter', 'after', 'first'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/students`
  },
  addStudents: {
    method: 'POST',
    required: ['orgId'],
    query: ['notify'],
    body: ['students'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/students`
  },
  removeStudents: {
    method: 'DELETE',
    required: ['orgId', 'studentId'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/students/${opt.studentId}`
  },
  listUsers: {
    method: 'GET',
    required: ['orgId'],
    query: ['filter', 'after', 'first'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/users`
  },
  addUsers: {
    method: 'POST',
    required: ['orgId'],
    body: ['users'],
    transformResponse: res => {
      // TODO remove this when the server returns dates
      let now = new Date().toISOString()
      res.body.users.forEach(user => {
        if (!user.added) user.added = now
      })
      return res.body
    },
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/users`
  },
  updateUser: {
    method: 'PATCH',
    required: ['orgId'],
    body: ['email', 'role'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/users`
  },
  removeUser: {
    method: 'DELETE',
    required: ['orgId', 'email'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/users`,
    body: ['email']
  },
  report: {
    method: 'GET',
    required: ['orgId'],
    query: ['timeStart', 'timeEnd'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/scan-report`,
    example: process.env.MOCK_USAGE_REPORT === 'true' && (props => ({
      body: {
        orgId: props.orgId,
        timeStart: props.timeStart,
        timeEnd: props.timeEnd,
        totalPages: 525,
        groups: [{
          id: 'SOC',
          pages: 400,
          users: [{
            name: 'Peanut Butter',
            email: 'peanutbutter@example.com',
            pages: 300
          }, {
            name: 'Strawberry Jelly',
            email: 'strawbelly@example.com',
            pages: 100
          }]
        }, {
          id: 'BIO',
          pages: 125,
          users: [{
            name: 'Sour Dough',
            email: 'sourdough@example.com',
            pages: 125
          }]
        }, {
          id: null,
          pages: 10,
          users: [{
            name: 'Peanut Butter',
            email: 'peanutbutter@example.com',
            pages: 10
          }]
        }]
      }
    })),
  },
  getLtiCredential: {
    method: 'GET',
    required: ['orgId'],
    url: opt => `${BASE_URL}/lti/organizations/${opt.orgId}/credentials`
  },
  generateLtiCredential: {
    method: 'POST',
    required: ['orgId'],
    url: opt => `${BASE_URL}/lti/organizations/${opt.orgId}/credentials`
  },
  getLtiIntegration: {
    method: 'GET',
    required: ['orgId', 'lmsType'],
    url: opt => `${BASE_URL}/lti/organizations/${opt.orgId}/integrations/${opt.lmsType}`
  },
  genrateLtiIntegration: {
    method: 'POST',
    required: ['orgId'],
    body: ['orgId', 'lmsType', 'clientId', 'secret', 'apiUrl'],
    url: opt => `${BASE_URL}/lti/organizations/${opt.orgId}/integrations`
  },
  getErrorMsg: {
    method: 'GET',
    required: ['errorId'],
    url: opt => `${BASE_URL}/errors/${opt.errorId}`
  },
}
