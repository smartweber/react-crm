import createRequest from './create-request'
import {mapValues} from 'lodash'
import usersConfig from './users'
import orgsConfig from './orgs'
import coursesConfig from './courses'
import examsConfig from './exams'

export default {
  users: mapValues(usersConfig, createRequest),
  orgs: mapValues(orgsConfig, createRequest),
  courses: mapValues(coursesConfig, createRequest),
  exams: mapValues(examsConfig, createRequest),
}
