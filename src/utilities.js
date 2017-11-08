/* eslint-env node, es6 */
/* eslint func-style: ["error", "expression"] */
'use strict'
const {
    dirname
} = require('path')

const isUndefined = x => (typeof x === 'undefined')

const isString = string => (typeof string === 'string')

const isBool = x => (typeof x === 'boolean')

const isArray = x => Array.isArray(x)

const isNull = x => x === null

const isObject = x => ((typeof x === 'object') && !isArray(x) && !isNull(x))

const debug = (d, text) => {
  if (d) {
        /* eslint-disable no-console */
    console.log(text)
        /* eslint-enable no-console */
  }
}

/**
 * Check wether a file path exists or not.
 * @param  {string} path Path to file or directory
 * @returns {boolean} True if path exists, false if not.
 */
const exists = path => {
  const fs = require('fs')
  let e = true
  try {
    fs.statSync(path)
  } catch (err) {
    e = false
  }
  return e
}

/**
 * Get content of file.
 * @param  {string} path Path to file.
 * @returns {string|null} Returns content of file as a string. Returns null if file is not found.
 */
const getFile = path => {
  const fs = require('fs')
  return (exists(path) ? fs.readFileSync(path, 'utf8') : null)
}

/**
 * Takes a folder path and creates all the missing folders
 * @param  {string} path Path to directory
 * @returns {undefined} Returns nothing
 */
const createDirectory = path => {
  const fs = require('fs')
  const folders = path.split('/')
  folders.reduce((base, name) => {
    const p = base + name
    try {
      fs.statSync(p)
    } catch (err) {
      fs.mkdirSync(p)
    }
    return p + '/'
  }, '')
}

/**
 * Removes a file.
 * Creates a promise which resolves when the file is deleted.
 * Promise is rejected if the file does not exist.
 * @param  {string} path Path to file
 * @returns {Promise} Returns a promise which resolves when the file is deleted.
 */
const removeFile = path => new Promise((resolve, reject) => {
  const fs = require('fs')
  if (exists(path)) {
    fs.unlink(path, () => {
      resolve(true)
    })
  } else {
    reject(new Error('File does not exist: ' + path))
  }
})

/**
 * Removes a directory.
 * Creates a promise which resolves when the directory is deleted.
 * Promise is rejected if the file does not exist.
 * @param  {string} path Path to file
 * @returns {Promise} Returns a promise which resolves when the file is deleted.
 */
const removeDirectory = path => new Promise((resolve, reject) => {
  const fs = require('fs')
  if (exists(path)) {
    const files = fs.readdirSync(path)
    const promises = files.map(file => path + '/' + file)
            .map(itemPath => (fs.statSync(itemPath).isDirectory()) ? removeDirectory(itemPath) : removeFile(itemPath))
    Promise.all(promises).then(() => {
      fs.rmdirSync(path)
      resolve(true)
    })
        .catch(err => reject(new Error(err.message + '\n\r' + err.stack)))
  } else {
    reject(new Error('Directory does not exist: ' + path))
  }
})

const writeFile = (path, content) => {
  const fs = require('fs')
  createDirectory(dirname(path))
  fs.writeFileSync(path, content)
}

module.exports = {
  createDirectory,
  debug,
  exists,
  getFile,
  isArray,
  isBool,
  isNull,
  isObject,
  isString,
  isUndefined,
  removeDirectory,
  removeFile,
  writeFile
}
