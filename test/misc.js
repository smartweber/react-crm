import assert from 'assert'
import {outdent, joinTemplateString} from '../src/util/helpers'

describe('util/helpers joinTemplateString()', function () {
  it('inserts params in the correct order', () => {
    let actual = joinTemplateString(['q', 'e', 't'], ['w', 'r'])
    assert.equal(actual, 'qwert')
  })
})

describe('util/helpers outdent()', function () {
  it('trims extra indentation', () => {
    assert.equal(
      outdent`
      vision never dies
      never ending wheel
      `,
      'vision never dies\nnever ending wheel',
      'basic case'
    )
    assert.equal(
      outdent`
      down too long
        in the
      midnight sea
      `,
      'down too long\n  in the\nmidnight sea',
      'retains nested indentation'
    )
  })
})
