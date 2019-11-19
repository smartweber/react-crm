import assert from 'assert'
import Promise from '../src/util/promise'

describe('Promise.last()', function () {
  it('resolves with the latest in-progress value', () => {
    let fn = val => Promise.resolve(val)
    fn = Promise.last(fn)
    let p1 = fn('first').then(val => assert.equal(val, 'second'))
    let p2 = fn('second').then(val => assert.equal(val, 'second'))
    return Promise.all([p1, p2])
  })
})
