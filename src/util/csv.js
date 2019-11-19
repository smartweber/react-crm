import {flatten, get} from 'lodash'

const DOUBLE_QUOTE = '"'
const QUAD_QUOTE = '""'
const COMMA = ','

function zip(columns, fields) {
  let dest = {}
  for (let index = 0; index < columns.length; index++) {
    dest[columns[index]] = fields[index] || ''
  }
  return dest
}

export function createCSV(columns, rows) {
  let header = new Array(columns.length)
  let mappers = columns.map((desc, index) => {
    if (typeof desc == 'string') {
      header[index] = desc
      return (item) => get(item, desc)
    }
    let [key, val] = desc
    header[index] = key
    if (typeof val == 'string') {
      return (item) => get(item, val)
    }
    if (typeof val == 'function') {
      return val
    }
  })
  let lines = rows.map((item, index) => {
    let cols = new Array(mappers.length)
    for (let ii = 0; ii < mappers.length; ii++) {
      cols[ii] = escapeCSV(mappers[ii](item, index))
    }
    return cols.join()
  })
  lines.unshift(header.join())
  return lines.join('\r\n')
}

export function escapeCSV(value) {
  if (typeof value == 'number') return '' + value
  if (value && (value.indexOf(COMMA) !== -1 || value.indexOf(DOUBLE_QUOTE) !== -1)) {
    value = DOUBLE_QUOTE + value.replace(/"/g, QUAD_QUOTE) + DOUBLE_QUOTE
  }
  return value
}

export function toCanvasCSV(report) {
  let lines = report.students.map(student => ([
    escapeCSV(student.name),
    null,
    student.id,
    escapeCSV(student.email),
    null,
    student.points.toFixed(2)
  ]).join())
  lines.unshift(['Points Possible', null, null, null, null, report.totalPoints].join())
  lines.unshift(['Student', 'ID', 'SIS User Id', 'SIS Login ID', 'Section', escapeCSV(report.examName)].join())
  return lines.join('\r\n')
}

export function toBlackboardCSV(report) {
  let lines = report.students.map(student => ([
    escapeCSV(student.name),
    null,
    student.id,
    student.points.toFixed(2)
  ]).join())
  lines.unshift(['Last Name', 'First Name', 'Username', escapeCSV(report.examName)].join())
  return lines.join('\r\n')
}

export function toMoodleCSV(report) {
  let lines = report.students.map(student => ([
    student.id,
    escapeCSV(student.email),
    escapeCSV(student.name),
    student.points.toFixed(2)
  ]).join())
  lines.unshift(['Student ID', 'Email', 'Student Name', escapeCSV(report.examName)].join())
  return lines.join('\r\n')
}

export function toD2LCSV(report) {
  let lines = report.students.map(student => ([
    student.id,
    student.points.toFixed(2),
    '#'
  ]).join())
  lines.unshift(['OrgDefinedID', escapeCSV(report.examName + ' Points Grade'), 'End-of-Line Indicator'].join())
  return lines.join('\r\n')
}

export function toItemAnalysisCSV(report) {
  let groups = report.answerKeys.map(key => {
    return key.questions.map((question, index) => [
      key.id,
      index + 1,
      question.frequency[0].toFixed(3),
      question.frequency[1].toFixed(3),
      question.frequency[2].toFixed(3),
      question.frequency[3].toFixed(3),
      question.frequency[4].toFixed(3),
      question.rpb.toFixed(3),
      question.upper.toFixed(3),
      question.lower.toFixed(3),
    ].join())
  })
  groups = flatten(groups)
  groups.unshift(['Key', '#', 'A', 'B', 'C', 'D', 'E', 'rpb', '27% hi', '27% lo'].join())
  return groups.join('\r\n')
}

export function toResponseAnalysisCSV(report) {
  let groups = report.students.map(student => ([
    student.id,
    escapeCSV(student.name),
    student.points.toFixed(2),
    student.score.toFixed(3),
    student.zscore.toFixed(2),
    student.keyId,
    ...student.answers.map(item => item.value)
  ]).join())
  groups.unshift(['id', 'name', 'points', 'score', 'zscore', 'key', ...range(report.totalQuestions)].join())
  return groups.join('\r\n')
}

export function toArrays(text) {
  if (!text) return []
  let pattern = /(\,|\r?\n|\r|^)(?: *"([^"]*(?:""[^"]*)*)"|([^"\,\r\n]*))/gi
  let data = [[]]
  let matches = null
  while (matches = pattern.exec(text)) {
    let matchedDelimiter = matches[1]
    if (matchedDelimiter.length && matchedDelimiter !== ',') {
      data.push([])
    }
    data[data.length - 1].push((matches[2] ? matches[2].replace(/""/g, '"') : matches[3]).trim())
  }
  return data.filter(line => {
    for (let index = 0; index < line.length; index++) {
      if (line[index]) return true
    }
  })
}

export function toObjects(text, isHeader = true) {
  let lines = toArrays(text)
  let columnNames = lines.length > 0 ? lines[0] : null
  if (isHeader) {
    columnNames = lines.length === 1
      ? lines[0].map((_, index) => 'Column ' + (index + 1))
      : lines.shift()
  }
  return lines.map(line => zip(columnNames, line))
}

function range(count) {
  let numbers = new Array(count)
  for (let index = 0; index < count; index++) {
    numbers[index] = index + 1
  }
  return numbers
}
