import honeybee from 'honeybee'
import Promise from '../util/promise'
export default honeybee.withBindings(Promise, {
  withCredentials: true,
  parseError: (req, res) => {
    var payload = honeybee.parseJSON(res.body.toString())
    let message = payload && payload.message
    // Use a better message if we can't get one from the server
    if (!message && res.statusCode === 401) {
      message = 'unable to access this resource (insufficient permission); are you logged out?'
    }
    return new honeybee.Error(res.statusCode, message)
  },
  headers: {
    accept: 'application/vnd.v1+json'
  }
})
