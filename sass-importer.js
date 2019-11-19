'use strict'
const stdpath = require('path')
const CWD = process.cwd()

/**
 * Ensures that any particular stylesheet is only included once, omitting duplicates.
 * - never use the extension (.scss .css .sass) when importing files
 * - @import './foo/bar'
 * SHOULD ALWAYS BE THE FIRST HANDLER
 */
function importOnceFactory() {
  const importedFiles = new Set()
  return function importOnce(file, parent) {
    if (file.charAt(0) === '.') {
      // Determine absolute path
      // if the file doesn't start with "./file-name" then assume it's in node_modules or bower_components
      file = stdpath.resolve(stdpath.dirname(parent), file)
    }

    if (importedFiles.has(file)) {
      console.error(`omitted duplicate import: ${stdpath.relative(CWD, file)}\n  in ${stdpath.relative(CWD, parent)}`)
      // This will skip further import handlers as well
      return {contents: ''}
    }

    // continue importing the file
    importedFiles.add(file)
    return null
  }
}

/**
 * Array of custom SASS importer functions: handler(file, parent, done)
 * @warn Write to stderr when debugging, since stdout may go to a file
 * @param {string} file The import path as-is, e.g. @import 'foo/bar';
 * @param {string?} parent Absolute path of the parent file, (useful for relative path resolution)
 * @param {function?} done({file, contents}) Only necessary for async ops
 * @return {object} file, contents
 */
module.exports = [importOnceFactory()]
