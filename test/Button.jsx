import React from 'react'
import assert from 'assert'
import {Button} from '../src/components/misc'
import {shallowRender, containsElement} from './util'

describe('<Button>', function () {
  it('supports icons', () => {
    let element = shallowRender(<Button icon='fa-cloud' />)
    assert.equal(element.type, 'button')
    containsElement(element, <i className='fa fa-cloud' />)
  })
})
