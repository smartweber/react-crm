import {REGX_LETTERS} from '../util/helpers'
import CSVImporter from './CSVImporter'
import {createCSV} from '../util/csv'

const HELP_TEXT = `
You can import answer keys (one at a time) to this course.
Type, paste, or drag & drop a CSV file (comma separated values), one question per line.
Columns should include the item #, expected answer, and (optionally) the item type: "*", "&".
The exact column names don't matter.`

export default class AnswerImporter extends CSVImporter {
  static serialize(questions) {
    return createCSV([
      ['ITEM #', (item, index) => index + 1],
      ['EXPECTED', 'value'],
      ['TYPE', item => item.op === 'AND' ? '&' : '*'],
      ['POINTS', 'weight'],
      ['PENALTIES', 'penalty'],
      ['EXTRA', 'ec'],
      ['A', item => item.pc && item.pc.A ? item.pc.A : 0],
      ['B', item => item.pc && item.pc.B ? item.pc.B : 0],
      ['C', item => item.pc && item.pc.C ? item.pc.C : 0],
      ['D', item => item.pc && item.pc.D ? item.pc.D : 0],
      ['E', item => item.pc && item.pc.E ? item.pc.E : 0]
    ], questions)
  }
  constructor(props) {
    super(props, [{
      label: '<item #>',
      disabled: false,
      value: null
    }, {
      label: '<expected value>',
      disabled: false,
      value: 'value'
    }, {
      label: '<type>',
      disabled: false,
      value: 'type'
    }, {
      label: '<points>',
      disabled: false,
      value: 'weight'
    }, {
      label: '<penalties>',
      disabled: false,
      value: 'penalty'
    }, {
      label: '<extra>',
      disabled: false,
      value: 'ec'
    }, {
      label: '<A>',
      disabled: false,
      value: 'A'
    }, {
      label: '<B>',
      disabled: false,
      value: 'B'
    }, {
      label: '<C>',
      disabled: false,
      value: 'C'
    }, {
      label: '<D>',
      disabled: false,
      value: 'D'
    }, {
      label: '<E>',
      disabled: false,
      value: 'E'
    }])
    this.title = 'Import Answer Key'
    this.previewColumns = ['Item #', 'Expected', 'Type', 'Points', 'Penalties', 'Extra', 'A', 'B', 'C', 'D', 'E']
    this.placeholder = 'ITEM #, EXPECTED VALUE, TYPE, POINTS, PENALTIES, EXTRA, A, B, C, D, E'
    this.help = HELP_TEXT
  }
  previewRow(item, index) {
    return [index + 1, item.value, item.type, item.weight, item.penalty, item.ec, item.A, item.B, item.C, item.D, item.E]
  }
  transform(data, mapFrom) {
    return data.map(row => {
      let value = row[mapFrom.value]
      if (value == null) return false
      value = value.toUpperCase()
      return {
        value: REGX_LETTERS.test(value) ? value : '',
        type: row[mapFrom.type] === '&' ? '&' : '*',
        weight: row[mapFrom.weight],
        penalty: row[mapFrom.penalty],
        ec: row[mapFrom.ec],
        A: row[mapFrom.A],
        B: row[mapFrom.B],
        C: row[mapFrom.C],
        D: row[mapFrom.D],
        E: row[mapFrom.E]
      }
    }).filter(Boolean)
  }
}