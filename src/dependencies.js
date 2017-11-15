/* eslint-env node, es6 */
/* eslint func-style: ["error", "expression"] */
'use strict'
const {
  exists,
  isArray,
  isString,
  getFile
} = require('./utilities.js')
const LE = '\n'
const {
    dirname,
    join,
    resolve
} = require('path')
let exportExp = /\n?\s*export default ([^;\n]+)[\n;]+/
const licenseExp = /(\/\*\*[\s\S]+@license[\s\S]+?(?=\*\/)\*\/)/
const expJavaScriptComment = /(\/\*[\s\S]*?(.*)\*\/)|(\/\/.*)/gm

/**
 * Test if theres is a match between
 * @param  {RegExp} regex The regex to test for
 * @param  {string} str   The string to test against
 * @returns {bool}       Returns true if a match is found, false if no match or bad arguments provided.
 */
const regexTest = (regex, str) => (regex instanceof RegExp) && regex.test(str)

/**
 * Get the result from the first capture group of a regex execution.
 * @param  {RegExp} regex The regex to execute
 * @param  {string} str   The string to match against
 * @returns {string|null}       The result from the capture group or null
 */
const regexGetCapture = (regex, str) => regexTest(regex, str) ? regex.exec(str)[1] : null

const isImportStatement = string => (
    isString(string) && /^import.*'.*'/.test(string)
)

const getFileImports = content => {
  let result = []
  if (isString(content)) {
    // Remove all comments for simplicity.
    let string = content.replace(expJavaScriptComment, '')
    // Split by newline and parse import statements
    result = string.split('\n').reduce((arr, line) => {
      if (isImportStatement(line)) {
        arr.push([
          regexGetCapture(/['"]([^']+)['"]/, line), // path
          regexGetCapture(/import (.+) from/, line) // variable
        ])
      }
      return arr
    }, [])
  }
  return result
}

const getListOfFileDependencies = (pathFile) => {
  let result = false
  if (exists(pathFile)) {
    const content = getFile(pathFile)
    result = getFileImports(content)
  }
  return result
}

const cleanPath = path => {
  let parts = path.split('/')
    .reduce((arr, piece) => {
      if (piece !== '.' || arr.length === 0) {
        arr.push(piece)
      }
      return arr
    }, [])
    .reduce((arr, piece) => {
      if (piece === '..') {
        if (arr.length === 0) {
          arr.push(piece)
        } else {
          let popped = arr.pop()
          if (popped === '.') {
            arr.push(piece)
          } else if (popped === '..') {
            arr.push(popped)
            arr.push(piece)
          }
        }
      } else {
        arr.push(piece)
      }
      return arr
    }, [])
  return parts.join('/')
}

const getOrderedDependencies = (file, parent, dependencies) => {
  const filePath = isString(parent) ? join(dirname(parent), file) : file
  const content = getFile(filePath)
  let dep = isArray(dependencies) ? dependencies : []
  if (content === null) {
    throw new Error([
      `File ${filePath} does not exist. Listed dependency in ${parent}.`,
      `Full path: ${resolve(filePath)}.`
    ].join('\n'))
  }
  if (isString(parent)) {
    dep.splice(dep.indexOf(parent), 0, filePath)
  } else {
    dep.unshift(filePath)
  }
  const imports = getFileImports(content)
  return imports.reduce((arr, d) => {
    let module = d[0]
    const pathModule = join(dirname(filePath), module)
    if (arr.indexOf(pathModule) === -1) {
      arr = getOrderedDependencies(module, filePath, arr)
    }
    return arr
  }, dep)
}

const applyUMD = content => {
  let name = 'Highcharts'
  return ['\'use strict\';',
    '(function (root, factory) {',
    'if (typeof module === \'object\' && module.exports) {',
    'module.exports = root.document ?',
    'factory(root) : ',
    'factory;',
    '} else {',
    'root.' + name + ' = factory(root);',
    '}',
    '}(typeof window !== \'undefined\' ? window : this, function (win) {',
    content,
    '}));'
  ].join(LE)
}

const applyModule = content => {
  return ['\'use strict\';',
    '(function (factory) {',
    'if (typeof module === \'object\' && module.exports) {',
    'module.exports = factory;',
    '} else {',
    'factory(Highcharts);',
    '}',
    '}(function (Highcharts) {',
    content,
    '}));'
  ].join(LE)
}

/**
 * Adds a license header to the top of a distribution file.
 * License header is collected from the "masters" file.
 * @param  {string} content Content of distribution file.
 * @param  {object} o Object containing all build options.
 * @returns {string} Returns the distribution file with a header.
 */
const addLicenseHeader = (content, o) => {
  const str = getFile(o.entry)
  let header = regexGetCapture(licenseExp, str)
  return (isString(header) ? header : '') + content
}

/**
 * Removes a license code block from a string.
 * @param  {string} content Module content.
 * @returns {string} Returns module content without license header.
 */
const removeLicenseHeader = content => content.replace(licenseExp, '')

/**
 * List of names for the exported variable per module.
 * @param  {[string]} dependencies Dependencies array. List of paths, ordered.
 * @returns {[?string]}  Path of module and name of its exported variable.
 */
const getExports = dependencies => {
  return dependencies.map(d => {
    let content = getFile(d)
    let exported = regexGetCapture(exportExp, content)
    return [d, exported]
  })
}

/**
 * Get tuples of all the imported variables for each module.
 * @param  {[string]} dependencies Dependecies array. List of paths to modules, ordered.
 * @param  {[string]} exported     List of names for variables exported by a module.
 * @returns {[string, [string, string]]} List of all the module parameters and its inserted parameters
 */
const getImports = (dependencies, exported) => {
  return dependencies.map(d => {
    let content = getFile(d)
    let imports = getFileImports(content)
    return imports.reduce((arr, t) => {
      let path
      let mParam
      let param = t[1]
      if (param) {
                // @todo check if import is of object structure and not just default
        path = join(dirname(d), t[0])
        mParam = exported.find(e => e[0] === path)[1]
        arr[1].push([param, mParam])
      }
      return arr
    }, [d, []])
  })
}

/**
 * Transform a module into desired structure
 * @param  {string} content  Content of the module
 * @param  {object} options Options object
 * @param  {string} options.path     Path to the module file
 * @param  {[string, string]} options.imported Parameters which the module imports
 * @param  {string} options.exported    The name of the default variable exported by the module
 * @param  {number} options.i        Index in dependencies array.
 * @param  {[string]} options.arr      Dependencies array
 * @returns {string} The module content after transformation
 */
const moduleTransform = (content, options) => {
  let path = options.path
  let imported = options.imported
  let r = options.exported
  let i = options.i
  let arr = options.arr
  let exclude = options.exclude
  let params = imported.map(m => m[0]).join(', ')
  let mParams = imported.map(m => m[1]).join(', ')
    // Remove license headers from modules
  content = removeLicenseHeader(content)
    // Remove use strict from modules
  content = content.replace(/'use strict';\r?\n/, '')
    // Remove import statements
    // @todo Add imported variables to the function arguments. Reuse getImports for this
  content = content.replace(/import\s[^\n]+\n/g, '')
        .replace(exportExp, '') // Remove exports statements
  if (regexTest(exclude, path)) {
    content = ''
  } else if (i === arr.length - 1) {
        // @notice Do not remove line below. It is for when we have more advanced master files.
        // content = (r ? 'return = ' : '') + '(function () {' + LE + content + (r ? LE + 'return ' + r + ';': '') + LE + '}());';
    content = (r ? 'return ' + r : '')
  } else {
        // @notice The result variable gets the same name as the one returned by the module, but when we have more advanced modules it could probably benefit from using the filename instead.
    content = (r ? 'var ' + r + ' = ' : '') + '(function (' + params + ') {' + LE + content + (r ? LE + 'return ' + r + ';' : '') + LE + '}(' + mParams + '));'
  }
  return content
}

/**
 * Apply transformation to the compiled file content.
 * @param  {string} content Content of file
 * @param  {object} options fileOptions
 * @returns {string}         Content of file after transformation
 */
const fileTransform = (content, options) => {
  let umd = options.umd
  let result = umd ? applyUMD(content) : applyModule(content)
  result = addLicenseHeader(result, options)
  result = result.replace(/@product.name@/g, options.product)
        .replace(/@product.version@/g, options.version)
        .replace(/@product.date@/g, options.date)
  return result
}

const compileFile = options => {
  let entry = options.entry
  let dependencies = getOrderedDependencies(entry)
  let exported = getExports(dependencies)
  let imported = getImports(dependencies, exported)
  let mapTransform = (path, i, arr) => {
    let content = getFile(path)
    let moduleOptions = Object.assign({}, options, {
      path: path,
      imported: imported.find(val => val[0] === path)[1],
      exported: exported.find(val => val[0] === path)[1],
      i: i,
      arr: arr
    })
    return moduleTransform(content, moduleOptions)
  }
  let modules = dependencies
        .map(mapTransform)
        .filter(m => m !== '')
        .join(LE)
  return fileTransform(modules, options)
}

module.exports = {
  cleanPath,
  compileFile: compileFile,
  expJavaScriptComment,
  getFileImports,
  getListOfFileDependencies,
  getOrderedDependencies,
  isImportStatement,
  regexGetCapture: regexGetCapture
}
