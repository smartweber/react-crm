const BASE_URL = process.env.API_ORIGIN

/**
 * Manage or view your courses
 */
export default {
  list: {
    method: 'GET',
    required: ['orgId'],
    query: ['first', 'after', 'filter', 'includeInactive'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/courses`
  },
  create: {
    method: 'POST',
    required: ['orgId'],
    body: ['id', 'name', 'shortName', 'days', 'timeStart', 'timeEnd', 'term', 'year', 'tag'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/courses`
  },
  get: {
    required: ['orgId', 'courseId'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/courses/${opt.courseId}`
  },
  update: {
    method: 'PATCH',
    required: ['orgId', 'courseId'],
    body: ['tag', 'aides', 'name', 'shortName', 'days', 'timeStart', 'timeEnd', 'term', 'year'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/courses/${opt.courseId}`
  },
  listTags: {
    method: 'GET',
    required: ['orgId'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/course-tags`,
    example: process.env.ENABLE_SCAN_STATION === 'true' ? process.env.MOCK_USAGE_REPORT === 'true' ? (props => ({
      body: {
        orgId: props.orgId,
        tags: ['Biology', 'Physics']
      }
    })) : null : (props => ({
      body: {
        orgId: props.orgId,
        tags: []
      }
    })),
  },
  updateTag: {
    method: 'PATCH',
    required: ['orgId'],
    body: ['label', 'prev'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/course-tags`,
    example: process.env.MOCK_USAGE_REPORT === 'true' && (props => ({
      body: {
        label: props.label
      }
    }))
  },
  remove: {
    method: 'DELETE',
    required: ['orgId', 'courseId'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/courses/${opt.courseId}`
  },
  listStudents: {
    method: 'GET',
    required: ['orgId', 'courseId'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/courses/${opt.courseId}/students`
  },
  addStudents: {
    method: 'POST',
    required: ['orgId', 'courseId'],
    body: ['students'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/courses/${opt.courseId}/students`
  },
  removeStudent: {
    method: 'DELETE',
    required: ['orgId', 'courseId', 'studentId'],
    url: opt => `${BASE_URL}/organizations/${opt.orgId}/courses/${opt.courseId}/students/${opt.studentId}`
  },
}
