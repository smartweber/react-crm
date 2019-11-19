import React from 'react'
import DayPicker, {formatDays} from '../src/components/DayPicker'
import assert from 'assert'
import {findElements, shallowRender} from './util'

describe('<DayPicker>', function () {
  it('formatDays()', () => {
    let actual = formatDays(0b0101010)
    assert.equal(actual, 'Mo We Fr')
  })
  it('invokes the onChange callback', () => {
    let called = false
    let captureChange = bits => {
      assert.equal(bits, 0b0101000)
      called = true
    }
    let element = shallowRender(<DayPicker value={0b0100000} onChange={captureChange}/>)
    element.props.onClick({
      target: {
        type: 'button',
        getAttribute: () => 0b0001000
      }
    })
    assert(called)
  })
  it('activates inputs based on props.value', () => {
    let element = shallowRender(<DayPicker value={0b0100010} onChange={Function.prototype}/>)
    let selected = findElements(element, el => el.type === 'button' && el.props['aria-pressed'])
    assert.equal(selected.length, 2)
    assert.equal(selected[0].props['data-value'], 0b0100000)
    assert.equal(selected[1].props['data-value'], 0b0000010)
  })
})
