import React from 'react'
import util from 'util'
import {omit} from 'lodash'

/**
 * Pretty print a tree of React Elements
 * @example inspectElement(React.createElement('div')) === '<div></div>'
 * @param {React.Element} el
 * @return {string}
 */
export default function inspectElement(el) {
  return inspectElement_(el, 0)
}

function inspectElement_(node, depth) {
  if (!React.isValidElement(node)) {
    let childInspected = util.inspect(node)
    return depth > 0 ? '{' + childInspected + '}' : childInspected
  }
  let props = node.props || {}
  let propNames = Object.keys(omit(props, 'children'))
  let propsText = propNames.length && propNames
    .map(propName => inspectProp(propName, props[propName]))
    .filter(Boolean)
    .join(' ')
  let childrenText
  if (props.children) {
    let childrenInspected = []
    React.Children.forEach(props.children, (node) => {
      childrenInspected.push(inspectElement_(node, depth + 1))
    })
    childrenText = childrenInspected.join('\n')
  }
  let nodeText = '<'
  nodeText += inspectType(node.type)
  if (propsText) nodeText += ' ' + propsText
  if (childrenText) {
    nodeText += '>\n'
    nodeText += indentString(childrenText, '  ', 1)
    nodeText += '\n</' + inspectType(node.type) + '>'
  }
  else nodeText += ' />'
  return nodeText
}

function inspectProp(propName, propValue) {
  if (propValue == null) return null
  if (typeof propValue == 'boolean') return propValue ? propName : null
  if (typeof propValue == 'string') return `${propName}='${propValue}'`
  if (typeof propValue == 'function') return `${propName}={...}`
  return propName + '={' + util.inspect(propValue) + '}'
}

function inspectType(type) {
  if (!type) return '' + type
  return typeof type == 'string' ? type : type.name || type.displayName
}

function indentString(str, indent, count) {
  return str.replace(/^(?!\s*$)/mg, indent.repeat(count))
}
