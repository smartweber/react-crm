'use strict'
const yaml = require('js-yaml')
const fs = require('fs')
const libpath = require('path')
const pick = require('lodash/pick')
const map = require('lodash/map')
const mark2html = require('marked')
const CWD = process.cwd()
const SCALAR_TYPES = /^(any|string|number|boolean|datetime|date-only|time-only)$/
const BUILTIN_TYPES = /^(any|array|boolean|datetime|date-only|time-only|number|object|string|union)$/

/**
 * This module operates on a modified subset of RAML 1.0
 * https://github.com/raml-org/raml-spec/blob/31952bbf9ba1c3f14a925f401250a3bb18526033/versions/raml-10/raml-10.md
 * Notable differences:
 * - optional properties are defined with the question mark in the typedef rather than the key name
 * - no support for nested paths, traits, security schemas, overlays or libraries
 */

/**
 * @param {string} entryFile
 * @return {object} Combined POJO form of the API spec
 */
function parse(entryFile) {
  let fileStack = []

  /**
   * @example !include ./types/index.yml
   * Imports are relative to the current file, just like nodejs
   */
  const importer = new yaml.Type('!include', {
    kind: 'scalar',
    construct: load,
    resolve: value => typeof value == 'string',
  })
  const RAML_SCHEMA = new yaml.Schema({
    include: [yaml.JSON_SCHEMA],
    explicit: [importer]
  })

  /**
   * @param {string} file Literal value of the !include directive
   */
  function load(file) {
    let parentFile = fileStack[fileStack.length - 1]
    if (parentFile) {
      file = libpath.resolve(libpath.dirname(parentFile), file)
    }
    let text = fs.readFileSync(file, 'utf8')
    let extension = libpath.extname(file)
    if (extension === '.yml' || extension === '.yaml') {
      fileStack.push(libpath.resolve(file))
      let pojo = yaml.load(text, {
        filename: libpath.relative(CWD, file),
        schema: RAML_SCHEMA,
      })
      fileStack.pop()
      return pojo
    }
    return text
  }

  let raw = load(entryFile)
  let res = pick(raw, [
    'baseUri',
    'mediaType',
    'title',
    'version',
  ])
  let defaultMediaType = Array.isArray(raw.mediaType) ? raw.mediaType[0] : raw.mediaType
  if (!defaultMediaType) {
    throw new Error('default mediaType not specified')
  }
  res.description = mark2html(raw.description || '')
  let types = transformTypes(raw.types)
  res.routes = transformRoutes(raw, types, defaultMediaType)
  return res
}

/**
 * Grammar
 * <expr> : (<expr>)[<arr>]
 *        | <type> [| <expr>]
 * <type> : <id>[?][<arr>]
 * <arr>  : [][?][<arr>]
 * <id>   : [a-zA-Z][a-zA-Z0-9_]*
 *
 * Example
 *   string[] | number[]
 *   (Person | Employee)[]
 *   boolean?
 */
class TypeExpressionParser {
  constructor(types, expr) {
    this.index = -1
    this.original = JSON.stringify(expr)
    this.src = expr.replace(/\s/g, '')
    this.customTypes = types
  }
  peek() {
    return this.src.charAt(this.index + 1)
  }
  next() {
    return this.src.charAt(++this.index)
  }
  parseExpr() {
    let ch = this.peek()
    let node = null
    if (ch === '(') {
      ch = this.next()
      node = this.parseExpr()
      ch = this.next()
      if (ch !== ')') {
        throw new SyntaxError(`unclosed "(" in ${this.original}`)
      }
      node = this.parseArr(node)
    }
    else {
      node = this.parseType()
    }
    ch = this.peek()
    if (ch === '|') {
      this.index += 1
      let sibling = this.parseExpr()
      if (node.type === 'union' && sibling.type === 'union') return {
        type: 'union',
        required: node.required || sibling.required,
        oneOf: node.oneOf.concat(sibling.oneOf)
      }
      else if (node.type === 'union') return {
        type: 'union',
        required: node.required,
        oneOf: [...node.oneOf, sibling]
      }
      else if (sibling.type === 'union') return {
        type: 'union',
        required: sibling.required,
        oneOf: [node, ...sibling.oneOf]
      }
      else return {
        type: 'union',
        required: true,
        oneOf: [node, sibling]
      }
    }
    else if (ch === ')') {
      return node
    }
    else if (ch === '') {
      return this.mergeCustomTypes(node)
    }
    else {
      throw new SyntaxError(`unexpected character "${ch}" in ${this.original}`)
    }
  }
  parseType() {
    let id = this.parseId()
    return this.parseArr({type: id, required: true})
  }
  parseArr(baseType) {
    let ch = this.peek()
    if (ch === '?') {
      this.index += 1
      let tmp = baseType
      do tmp.required = false; while (tmp = tmp.items)
      return this.parseArr(baseType)
    }
    else if (ch === '[') {
      this.index += 1
      ch = this.next()
      if (ch !== ']') {
        throw new SyntaxError(`unclosed "[" in ${this.original}`)
      }
      return this.parseArr({type: 'array', required: true, items: baseType})
    }
    else {
      return baseType
    }
  }
  parseId() {
    let id = this.src.substring(this.index).match(/[a-zA-Z][a-zA-Z0-9_-]*/)
    id = id && id[0]
    if (!id) {
      throw new SyntaxError(`missing type name in ${this.original}`)
    }
    this.index += id.length
    return id
  }
  mergeCustomTypes(node) {
    if (node.items) node.items = this.mergeCustomTypes(node.items)
    else if (node.oneOf) node.oneOf = node.oneOf.map(this.mergeCustomTypes, this)
    if (BUILTIN_TYPES.test(node.type)) {
      return node
    }
    if (!this.customTypes.hasOwnProperty(node.type)) {
      throw new SyntaxError(`custom type "${node.type}" in expression ${this.original} not found`)
    }
    if (!node.required) {
      node = Object.assign({}, this.customTypes[node.type])
      node.required = false
      return node
    }
    else {
      return Object.assign({}, this.customTypes[node.type])
    }
  }
}

function transformTypes(types, allTypes) {
  let out = {}
  if (Array.isArray(types)) for (let index = 0; index < types.length; index++) {
    out[index] = transformTypedef(types[index], allTypes || out)
  }
  else for (let key in types) if (types.hasOwnProperty(key)) {
    out[key] = transformTypedef(types[key], allTypes || out)
  }
  return out
}

function transformTypedef(typedef, allTypes) {
  if (!typedef) {
    return {type: 'any', required: true}
  }
  if (typeof typedef == 'string') {
    return new TypeExpressionParser(allTypes, typedef).parseExpr()
  }
  if (!typedef.type) {
    if (typedef.properties) typedef.type = 'object'
    else if (typedef.items) typedef.type = 'array'
    else if (typedef.oneOf) typedef.type = 'union'
    else if (typedef.enum) typedef.type = 'string'
    else typedef.type = 'any'
  }

  // default required:true
  typedef.required = typedef.required !== false

  if (typedef.description) {
    typedef.description = mark2html(typedef.description)
  }

  // normalize examples
  if (typedef.example) {
    typedef.examples = [typedef.example]
    delete typedef.example
  }
  if (typedef.examples) {
    typedef.examples = map(typedef.examples, (ex) => {
      if (ex.value) return {description: mark2html(ex.description), value: ex.value}
      else return {value: ex}
    })
    typedef.examples.forEach(ex => {
      if (typeof ex.value != 'string') throw new Error('example must be a string: ' + JSON.stringify(ex.value, null, 2))
    })
  }

  // process any nested typedefs
  if (typedef.items) {
    typedef.items = transformTypedef(typedef.items, allTypes)
  }
  else if (typedef.properties) {
    typedef.properties = transformTypes(typedef.properties, allTypes)
  }
  else if (typedef.oneOf) {
    typedef.oneOf = transformTypes(typedef.oneOf, allTypes)
  }

  if (typeof typedef.type == 'object') {
    let parent = transformTypedef(typedef.type, allTypes)
    typedef = Object.assign({}, parent, typedef)
    typedef.type = parent.type
  }
  else if (!SCALAR_TYPES.test(typedef.type)) {
    let parent = new TypeExpressionParser(allTypes, typedef.type).parseExpr()
    typedef = Object.assign({}, parent, typedef)
    typedef.type = parent.type
  }
  return typedef
}

/**
 * @return {object[]}
 */
const VERBS = /^(GET|PUT|POST|PATCH|DELETE|OPTIONS|HEAD)$/
function transformRoutes(api, types, defaultMediaType) {
  let routes = []
  for (let name in api) if (api.hasOwnProperty(name)) {
    if (name.charAt(0) === '/') {
      let item = {
        path: name,
        description: mark2html(api[name].description || ''),
        verbs: {}
      }
      let uriParameters = api[name].uriParameters
      if (uriParameters) {
        uriParameters = {
          type: 'object',
          properties: transformTypes(uriParameters, types)
        }
      }
      for (let key in api[name]) if (api[name].hasOwnProperty(key)) {
        let method = key.toUpperCase()
        if (VERBS.test(method)) {
          let verb = api[name][key]
          verb.method = method
          if (uriParameters) {
            verb.uriParameters = uriParameters
          }
          if (verb.queryParameters) {
            verb.queryParameters = {
              type: 'object',
              properties: transformTypes(verb.queryParameters, types)
            }
          }
          item.verbs[method] = transformVerb(verb, types, defaultMediaType)
        }
      }
      routes.push(item)
    }
  }
  return routes
}

/**
 * Does the object have keys like: "application/json" or "text/html"
 */
function hasMediaTypes(obj) {
  let keys = Object.keys(obj)
  let index = 0
  for (; index < keys.length; keys++) {
    if (keys[index].indexOf('/') !== -1) break
  }
  return index === keys.length
}

function transformVerb(info, types, defaultMediaType) {
  if (info.description) {
    info.description = mark2html(info.description)
  }
  if (info.body) {
    if (typeof info.body == 'string' || !hasMediaTypes(info.body)) {
      info.body = {[defaultMediaType]: info.body}
    }
    info.body = map(info.body, (typedef, mediaType) => {
      typedef = transformTypedef(typedef, types)
      typedef.mediaType = mediaType
      return typedef
    })
  }
  if (info.responses) {
    for (let key in info.responses) if (info.responses.hasOwnProperty(key)) {
      info.responses[key] = transformVerb(info.responses[key], types, defaultMediaType)
    }
  }
  if (info.headers) {
    info.headers = transformTypedef({properties: info.headers}, types)
  }
  return info
}

module.exports = {
  parse,
  TypeExpressionParser,
}
