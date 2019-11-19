export {default as tmatch} from './object-match'
export {default as inspectElement} from './inspect-element'
export * from './assert-render'

import ShallowRenderer from 'react-test-renderer/shallow'

/**
 * (element, context?) => {type, key, props}
 * @example (<Checkbox value={true}/>) => {type: 'input', key: null, props: {type: 'checkbox', checked: true}}
 */
export function shallowRender(...args) {
  return new ShallowRenderer().render(...args)
}
