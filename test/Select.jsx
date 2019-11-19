import React from 'react'
import assert from 'assert'
import Select from '../src/components/Select'
import {containsElement, findElementsByType, shallowRender} from './util'

const colors = ['red', 'blue', 'green']

describe('<Select>', function () {
  it('supports basic options', () => {
    let handleChange = (selected) => {
      assert.equal(selected, 'green', 'invokes callback with value at index')
    }
    let tree = shallowRender(<Select opt={colors} onChange={handleChange} />)
    containsElement(tree, <select value={0} />, 'default value')
    for (let index = 0; index < colors.length; ++index) {
      containsElement(tree, <option value={index}>{colors[index]}</option>)
    }

    // Simulate user selecting a different color
    findElementsByType(tree, 'select')[0].props.onChange({target: {value: '2'}})
  })

  it('supports a null option', () => {
    let handleChange = (item) => {
      assert.equal(item, null, 'invokes callback with null value')
    }
    let tree = shallowRender(<Select
      nullable='empty'
      opt={colors}
      onChange={handleChange}
    />)
    containsElement(tree, <select value={-1} />, 'default value')
    containsElement(tree, <option value={-1}>{'empty'}</option>, 'contains null option')

    // Simulate user selecting "empty"
    findElementsByType(tree, 'select')[0].props.onChange({target: {value: '-1'}})
  })

  it('supports a labeler func', () => {
    let toLabel = (item) => item + ' hair'
    let tree = shallowRender(<Select
      labeler={toLabel}
      opt={colors}
      onChange={Function.prototype}
    />)
    containsElement(tree, <option value={1}>{'blue hair'}</option>, 'proper label')
  })

  it('supports a labeler prop name', () => {
    let tree = shallowRender(<Select
      labeler='length'
      opt={colors}
      onChange={Function.prototype}
    />)
    containsElement(tree, <option value={1}>{4}</option>, 'proper label')
  })

  it('supports a labeler path string', () => {
    let widgets = [
      {foo: {id: 'zero'}},
      {foo: {id: 'one'}},
      {foo: {id: 'two'}},
    ]
    let tree = shallowRender(<Select
      labeler='foo.id'
      opt={widgets}
      onChange={Function.prototype}
    />)
    containsElement(tree, <option value={1}>{'one'}</option>, 'proper label')
  })

  it('supports multi-selection', () => {
    let getColors = (items) => {
      assert.deepEqual(items, ['red', 'green'], 'invoked callback with multi values')
    }
    let tree = shallowRender(<Select
      opt={colors}
      onChange={getColors}
      value={[]}
    />)

    // Simulate user selecting two colors
    findElementsByType(tree, 'select')[0].props.onChange({target: {options: [
      {value: '0', selected: true},
      {value: '1', selected: false},
      {value: '2', selected: true},
    ]}})
  })
})
