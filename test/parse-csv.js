import assert from 'assert'
import {toObjects, toCSV} from '../src/util/csv'

describe('toCSV()', function () {
  it('adds a header line', () => {
    let actual = toCSV([{x: '1', y: '2', z: '3'}], ['x', 'y', 'z'])
    assert.equal(actual, 'x,y,z\r\n1,2,3')
  })
  it('quotes values with a comma', () => {
    let actual = toCSV([{x: '1', y: 'foo,bar', z: '3'}], ['x', 'y', 'z'])
    assert.equal(actual, 'x,y,z\r\n1,"foo,bar",3')
  })
  it('escapes any quotes', () => {
    let actual = toCSV([{x: '"shifty" powers', y: 'hello, "world"', z: '3'}], ['x', 'y', 'z'])
    assert.equal(actual, 'x,y,z\r\n"""shifty"" powers","hello, ""world""",3')
  })
})

describe('csv.toObjects()', function () {
  it('can parse one line', () => {
    let actual = toObjects('id,first,last\r\n1111,kitten,mittens')
    assert.deepEqual(actual, [
      {id: '1111', first: 'kitten', last: 'mittens'}
    ])
  })
  it('can parse multiple lines', () => {
    let actual = toObjects('id,first,last\r\n1,kitten,mittens\r\n2,holy,diver')
    assert.deepEqual(actual, [
      {id: '1', first: 'kitten', last: 'mittens'},
      {id: '2', first: 'holy', last: 'diver'},
    ])
  })
  it('can parse quoted fields', () => {
    let actual = toObjects('id,first,last\r\n1,"kitten mittens",charlie\r\n"2","holy","diver"')
    assert.deepEqual(actual, [
      {id: '1', first: 'kitten mittens', last: 'charlie'},
      {id: '2', first: 'holy', last: 'diver'},
    ])
  })
  it('can parse quoted newlines', () => {
    let actual = toObjects('id,first,last\r\n1,"kitten\r\nmittens",charlie\r\n"2","holy","diver"')
    assert.deepEqual(actual, [
      {id: '1', first: 'kitten\r\nmittens', last: 'charlie'},
      {id: '2', first: 'holy', last: 'diver'},
    ])
  })
  it('can parse escaped quotes', () => {
    let actual = toObjects('id,first,last\r\n1,"kitten ""mittens""",charlie\r\n"2","holy","diver"')
    assert.deepEqual(actual, [
      {id: '1', first: 'kitten "mittens"', last: 'charlie'},
      {id: '2', first: 'holy', last: 'diver'},
    ])
  })
  it('can parse commas inside quotes', () => {
    let actual = toObjects('foo,bar,baz\r\n1,"2,3,4",5')
    assert.deepEqual(actual, [
      {foo: '1', bar: '2,3,4', baz: '5'}
    ])
  })
  it('ignores blank lines', () => {
    let actual = toObjects('x,y,z\r\n1,2,3\r\n\r\n\r\n4,5,6')
    assert.deepEqual(actual, [
      {x: '1', y: '2', z: '3'},
      {x: '4', y: '5', z: '6'},
    ])
    actual = toObjects(',,,,,', ['x', 'y', 'z'])
    assert.equal(actual.length, 0)
  })
  it('handles a space before quotes', () => {
    let actual = toObjects('id, name\n1234, "The Count"')
    assert.deepEqual(actual, [{id: '1234', name: 'The Count'}])
  })
})
