import {REGX_EMAIL, REGX_STUDENT_ID} from '../util/helpers'
import CSVImporter from './CSVImporter'
import {createCSV} from '../util/csv'

const HELP_TEXT = `
You can bulk-import students to this course.
Type, paste, or drag & drop a CSV file (comma separated values), one student per line.
Columns should include the student name, email, and ID. The exact column names don't matter.
The ID must be a unique number (leading zeros are preserved) with at most 10 digits.`

const EXPORTED_COLUMNS = [
  ['STUDENT ID', 'id'],
  ['EMAIL', 'email'],
  ['NAME', 'name']
]

export default class RosterImporter extends CSVImporter {
  static serialize(students) {
    return createCSV(EXPORTED_COLUMNS, students)
  }
  constructor(props) {
    super(props, [{
      label: '<id>',
      disabled: false,
      value: 'id'
    }, {
      label: '<email>',
      disabled: false,
      value: 'email'
    }, {
      label: '<full name>',
      disabled: false,
      value: 'fullName'
    }, {
      label: '<first name>',
      disabled: false,
      value: 'firstName'
    }, {
      label: '<last name>',
      disabled: false,
      value: 'lastName'
    }, {
      label: '<last name, first name>',
      disabled: false,
      value: 'reversedName'
    }])
    this.title = 'Import Students'
    this.previewColumns = ['Student ID', 'Email', 'Name']
    this.placeholder = 'STUDENT ID, EMAIL, NAME'
    this.help = HELP_TEXT
    this.validate = VALIDATE_ITEMS.bind(this)
  }
  previewRow(item) {
    return [item.id, item.email, item.name]
  }
  transform(data, mapFrom) {
    let getName = Function.prototype
    if (mapFrom.fullName) {
      getName = row => row[mapFrom.fullName]
    }
    else if (mapFrom.reversedName) {
      getName = row => row[mapFrom.reversedName].split(',').map(str => str.trim()).reverse().join(' ')
    }
    else if (mapFrom.firstName || mapFrom.lastName) {
      getName = row => ((row[mapFrom.firstName] || '') + ' ' + (row[mapFrom.lastName] || '')).trim()
    }
    return data.map(row => {
      let item = {
        id: row[mapFrom.id],
        email: row[mapFrom.email],
        name: getName(row)
      }
      if (!item.id && !item.email && !item.name)
        return false
      return item
    }).filter(Boolean)
  }
}

function VALIDATE_ITEMS(items) {
  let existingStudents = toSet(this.props.students)
  let incomingStudents = {ids: new Set(), emails: new Set()}
  let maxStudents = this.props.maxStudents
  items = items.filter(student => !existingStudents.ids.has(student.id))
  for (let index = 0; index < items.length; index++) {
    let student = items[index]
    if (incomingStudents.ids.has(student.id)) {
      return new Error(`duplicate ID ${student.id}`)
    }
    if (!student.id) {
      return new Error(`missing ID for ${JSON.stringify(student.name || student.email)}`)
    }
    if (!REGX_STUDENT_ID.test(student.id)) {
      return new Error(`invalid ID ${JSON.stringify(student.id)}`)
    }
    if (process.env.ENABLE_ROSTER_EMAIL_CHECK === 'true') {
      if (!student.email) {
        return new Error(`missing email for ${JSON.stringify(student.name || student.id)}`)
      }
      if (!REGX_EMAIL.test(student.email)) {
        return new Error(`invalid email ${JSON.stringify(student.email)}`)
      }
    }
    if (existingStudents.emails.has(student.email) || incomingStudents.emails.has(student.email)) {
      return new Error(`duplicate email ${JSON.stringify(student.email)}`)
    }
    incomingStudents.ids.add(student.id)
    if (student.email) incomingStudents.emails.add(student.email)
  }
  if (maxStudents > 0 && items.length + existingStudents.ids.size > maxStudents) {
    return new Error(`too many students; this organization only allows ${maxStudents} students per course`)
  }
  return items
}

/**
 * IE11 does not support new Set(iterable)
 * so we must build the set manually
 */
function toSet(students) {
  let ids = new Set()
  let emails = new Set()
  students.forEach(student => {
    if (student.id) ids.add(student.id)
    if (student.email) emails.add(student.email)
  })
  return {ids, emails}
}
