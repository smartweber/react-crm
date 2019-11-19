const BASE_URL = process.env.API_ORIGIN
import EXAMPLE_REPORT from '../sample-report.json'

/**
 * Manage or view your exams
 */
export default {
  list: {
    required: ['orgId', 'courseId'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/courses/${opt.courseId}/exams`
  },
  create: {
    method: 'POST',
    required: ['orgId', 'courseId'],
    body: ['name', 'date'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/courses/${opt.courseId}/exams`
  },
  get: {
    required: ['orgId', 'courseId', 'examId'],
    transformResponse: res => {
      // convert keys to uppercase
      if (res.body.answerKeys) {
        let tmp = {}
        for (let id in res.body.answerKeys) {
          tmp[id.toUpperCase()] = res.body.answerKeys[id]
        }
        res.body.answerKeys = tmp
      }

      if (process.env.MOCK_UNVERIFIED === 'true') {
        res.body.unverified = 2
      }

      if (process.env.MOCK_REPORT === 'true') {
        res.body.verified = 1
      }

      return res.body
    },
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/courses/${opt.courseId}/exams/${opt.examId}`
  },
  update: {
    method: 'PUT',
    required: ['orgId', 'courseId', 'examId'],
    body: ['name', 'date', 'answerKeys', 'gradingScale', 'gradeReleaseFormat'],
    transformRequest: props => {
      // server expects lowercase keys
      if (props.answerKeys) {
        let tmp = {}
        for (let id in props.answerKeys) {
          tmp[id.toLowerCase()] = props.answerKeys[id]
        }
        props.answerKeys = tmp
      }
      return props
    },
    transformResponse: res => {
      // convert keys to uppercase
      if (res.body.answerKeys) {
        let tmp = {}
        for (let id in res.body.answerKeys) {
          tmp[id.toUpperCase()] = res.body.answerKeys[id]
        }
        res.body.answerKeys = tmp
      }

      return res.body
    },
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/courses/${opt.courseId}/exams/${opt.id}`
  },
  getSheetsURL: (opt) => {
    let url = `${BASE_URL}/organizations/${opt.orgId}/courses/${opt.courseId}/exams/${opt.examId}/sheets`
    if (opt.studentId) {
      url += '/' + opt.studentId
    }
    if (opt.filled) {
      url = url + '?filled=true'
    }
    return url
  },
  checkSheetsUrl: {
    url: opt => opt.url,
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
    }
  },
  uploadResponses: {
    method: 'POST',
    serialize: 'noop',
    body: opt => {
      let data = new FormData()
      data.append('file', opt.blob)
      return data
    },
    example: process.env.MOCK_UPLOAD === 'true'
      && (() => new Promise(resolve => setTimeout(() => resolve({body: null}), 2000))),
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/courses/${opt.courseId}/exams/${opt.examId}/sheets`
  },
  getDuplicates: {
    required: ['orgId', 'courseId', 'examId'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/courses/${opt.courseId}/exams/${opt.examId}/duplicates`
  },
  setPreferredDuplicate: {
    method: 'POST',
    required: ['orgId', 'courseId', 'examId'],
    body: ['studentId', 'id'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/courses/${opt.courseId}/exams/${opt.examId}/duplicates`
  },
  getUnverified: {
    required: ['orgId', 'courseId', 'examId'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/courses/${opt.courseId}/exams/${opt.examId}/unverified`,
    transformResponse: res => {
      // Expand snippet urls
      if (process.env.MOCK_UNVERIFIED !== 'true' && res.body.unverified) {
        res.body.unverified.forEach(item => {
          if (!/^https?:/.test(item.headContent)) {
            item.headContent = BASE_URL + '/snippets/' + item.headContent
          }
        })
      }
      if (res.body.unverified) res.body.unverified.forEach(item => {
        if (!item.bodyContent) {
          item.bodyContent = item.headContent && item.headContent.replace('_101.', '.')
        }
      })
      return res.body
    },
    example: process.env.MOCK_UNVERIFIED === 'true' && ((props) => ({
      body: {
        orgId: props.orgId,
        courseId: props.courseId,
        examId: props.examId,
        unverified: [{
          id: 1,
          studentId: null,
          answerKeyId: null,
          answers: [
            'A', null, 'C', 'D', 'E',
            null, null, 'A', 'B', 'C'
          ],
          headContent: '/static/snippet_101.png',
          bodyContent: '/static/snippet_full.png',
          created: new Date().toISOString()
        }, {
          id: 2,
          studentId: null,
          answerKeyId: 'A',
          answers: [null, 'A', 'C', 'D', 'E', 'AB', 'BE', 'A', 'B', 'C'],
          headContent: '/static/snippet2_101.png',
          bodyContent: '/static/snippet2_full.png',
          created: new Date().toISOString()
        }]
      }
    }))
  },
  verify: {
    method: 'POST',
    required: ['orgId', 'courseId', 'examId'],
    body: ['studentId', 'id', 'answerKeyId', 'answers', 'preferred'],
    example: process.env.MOCK_UNVERIFIED === 'true'
      ? props => ({body: props})
      : null,
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/courses/${opt.courseId}/exams/${opt.examId}/unverified`
  },
  getReport: {
    required: ['orgId', 'courseId', 'examId'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/courses/${opt.courseId}/exams/${opt.examId}/report`,
    example: process.env.MOCK_REPORT === 'true'
      && (() => ({body: Object.assign({}, EXAMPLE_REPORT)}))
  },
  remove: {
    method: 'DELETE',
    required: ['orgId', 'courseId', 'examId'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/courses/${opt.courseId}/exams/${opt.examId}`
  },
  getBatches: {
    required: ['orgId', 'courseId', 'examId'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/courses/${opt.courseId}/exams/${opt.examId}/batches`
  },
  resumeBatch: {
    method: 'PUT',
    required: ['batchId'],
    url: opt => `${BASE_URL}/batch/${opt.batchId}/release`
  },
  lmsReport: {
    required: ['orgId', 'courseId', 'examId'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/courses/${opt.courseId}/exams/${opt.examId}/report/lms`
  }
}
