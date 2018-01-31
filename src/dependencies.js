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
const IND = '    '
const {
    dirname,
    join,
    resolve
} = require('path')

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

const getLicenseBlock = (txt) => {
  let result = ''
  const searchMiddle = '@license'
  const searchStart = '/**'
  const searchEnd = '*/'
  if (isString(txt)) {
    const searchMiddleIndex = txt.indexOf(searchMiddle)
    if (searchMiddleIndex > -1) {
      const start = txt.slice(0, searchMiddleIndex)
      const end = txt.slice(searchMiddleIndex)
      const startIndex = start.lastIndexOf(searchStart)
      const endIndex = end.indexOf(searchEnd)
      if (startIndex > -1 && endIndex > -1) {
        result = txt.slice(
          startIndex,
          searchMiddleIndex + endIndex + searchEnd.length
        )
      }
    }
  }
  return result
}

/**
 * Checks wether a given position in a string is inside a single line comment.
 * @param {String} str The string to check within
 * @param {Number} pos The position to check if is inside comment
 * @returns {Boolean} Returns true if inside a comment
 */
const isInsideSingleComment = (str, pos) => {
  const indexComment = str.lastIndexOf('//', pos)
  const indexNewLine = str.lastIndexOf('\n', pos)
  return (
    // There is a comment in before index
    indexComment > -1 &&
    // There is not a newline before the comment
    indexNewLine < indexComment
  )
}

/**
 * Checks wether a given position in a string is inside a block comment.
 * @param {String} str The string to check within
 * @param {Number} pos The position to check if is inside comment
 * @returns {Boolean} Returns true if inside a comment
 */
const isInsideBlockComment = (str, pos) => {
  const start = '/*' // Start of block comment
  const end = '*/' // End of block comment
  let indexStart = pos
  let indexEnd = -1
  let doSearch = true
  while (doSearch) {
    indexStart = str.lastIndexOf(start, indexStart)
    doSearch = indexStart > -1 && isInsideSingleComment(str, indexStart)
    if (doSearch) {
      // Search before the last entry found
      indexStart -= 1
    }
  }
  if (indexStart > -1) {
    doSearch = true
    indexEnd = indexStart + start.length
    while (doSearch) {
      indexEnd = str.indexOf(end, indexEnd)
      doSearch = indexEnd > -1 && isInsideSingleComment(str, indexEnd)
    }
  }
  return indexStart > -1 && (indexEnd === -1 || pos < (indexEnd + end.length))
}

/**
 * Returns a tuple with module name and export name from an import statement.
 * @param {String} str The import statement
 * @returns {Array} Returns a tuple ['module-name', 'export-name']
 */
const getImportInfo = (str) => {
  const char = str.includes(`'`) ? `'` : `"`
  const start = str.indexOf(char)
  const end = str.lastIndexOf(char)
  const moduleName = str.substring(start + 1, end)
  const indexFrom = str.indexOf('from ' + char)
  const exportName = (
    (indexFrom > -1)
    ? str.substring('import '.length, indexFrom - 1)
    : null
  )
  return [moduleName, exportName]
}

/**
 * Returns a list of tuples ['module-name', 'export-name'] from import
 * statements.
 * @param {String} content The string to look in for the statements.
 * @returns {Array} List of tuples ['module-name', 'export-name'].
 */
const getFileImports = (content) => {
  let result = []
  if (isString(content)) {
    let substr = content
    const word = 'import '
    let index = 0
    // While there is
    while (substr.includes(word, index)) {
      index = substr.indexOf(word, index)
      const isValidStatement = (
        !isInsideSingleComment(content, index) &&
        !isInsideBlockComment(content, index)
        // TODO isInsideString
      )
      if (isValidStatement) {
        const indexFirstChar = content.indexOf(`'`, index)
        const indexLastChar = content.indexOf(`'`, indexFirstChar + 1)
        const importInfo = getImportInfo(
          content.substring(index, indexLastChar + 1)
        )
        result.push(importInfo)
      }
      index += word.length
    }
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
  return [
    '\'use strict\';',
    '(function (root, factory) {',
    IND + 'if (typeof module === \'object\' && module.exports) {',
    IND.repeat(2) + 'module.exports = root.document ?',
    IND.repeat(2) + 'factory(root) : ',
    IND.repeat(2) + 'factory;',
    IND + '} else {',
    IND.repeat(2) + 'root.' + name + ' = factory(root);',
    IND + '}',
    '}(typeof window !== \'undefined\' ? window : this, function (win) {',
    IND + content.split('\n').join('\n' + IND),
    '}));'
  ].join(LE)
}

const applyModule = content => {
  return [
    '\'use strict\';',
    '(function (factory) {',
    IND + 'if (typeof module === \'object\' && module.exports) {',
    IND.repeat(2) + 'module.exports = factory;',
    IND + '} else {',
    IND.repeat(2) + 'factory(Highcharts);',
    IND + '}',
    '}(function (Highcharts) {',
    IND + content.split('\n').join('\n' + IND),
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
  const header = getLicenseBlock(str)
  return (isString(header) ? header : '') + content
}

/**
 * Removes a license code block from a string.
 * @param  {string} content Module content.
 * @returns {string} Returns module content without license header.
 */
const removeLicenseHeader = content => {
  return content.replace(
    getLicenseBlock(content),
    ''
  )
}

const removeStatement = (str, statement) => {
  let result
  let start = str.indexOf(statement)
  let end = start + statement.length
  // Remove following semi colon
  if (str[end] === ';') {
    end += 1
  }
  // Check wether there is multiple statements on the same line.
  const isLineEndAfter = str.indexOf('\n', end) > -1
  const lineEndAfter = (
    isLineEndAfter
    ? str.indexOf('\n', end) + 1
    : str.length
  )
  const lineEndBefore = (
    str.lastIndexOf('\n', start) > -1
    ? str.lastIndexOf('\n', start) + 1
    : 0
  )
  const isEmptyAfter = str.substring(end, lineEndAfter).trim().length === 0
  const isEmptyBefore = str.substring(lineEndBefore, start).trim().length === 0
  if (isEmptyAfter && isEmptyBefore) {
    start = lineEndBefore
    // If no line ending after, then trim the line ending before
    if (!isLineEndAfter) {
      ['\n', '\r'].forEach((char) => {
        if (str[start - 1] === char) {
          start -= 1
        }
      })
    }
    end = lineEndAfter
    result = str.substring(0, start) + str.substring(end)
  } else if (isEmptyBefore) {
    result = str.substring(0, start) + str.substring(end).trimLeft()
  } else {
    /* If the statement is in the middle of multiple statements, or at the end
       of a line */
    result = str.substring(0, start).trimRight() + str.substring(end)
  }
  return result
}

/**
 * Removes a list of statements from a string
 * @param {String} str The string to operate on.
 * @param {Array} statements A list of statements to remove.
 * @returns Returns a string without the given statements
 */
const removeStatements = (str, statements) => {
  let result = false
  if (isString(str)) {
    if (isArray(statements)) {
      result = statements.reduce(
        (prev, statement) => removeStatement(prev, statement),
        str
      )
    } else {
      result = str
    }
  }
  return result
}

/**
 * Returns the export statements in a given string.
 * @param {String} content The string to look in.
 * @returns {Array} List of export statements.
 */
const getExportStatements = (content) => {
  let result = []
  const word = 'export default '
  const start = content.indexOf(word)
  if (start > -1) {
    let endChar
    if (!content.includes('\n', start)) {
      endChar = ';'
    } else if (!content.includes(';', start)) {
      endChar = '\n'
    } else {
      endChar = (
        content.indexOf('\n', start) < content.indexOf(';', start)
        ? '\n'
        : ';'
      )
    }
    const end = (
      content.includes(endChar, start)
      ? content.indexOf(endChar, start)
      : content.length
    )
    result.push(content.substring(start, end))
  }
  return result
}

const getExportedVariables = (content) => {
  const statements = getExportStatements(content)
  // TODO support named exports.
  // TODO support having multiple exports in the same file.
  return (
    isString(statements[0])
    ? statements[0].replace('export default ', '')
    : null
  )
}

/**
 * Get tuples of all the imported variables for each module.
 * @param  {[string]} dependencies Dependecies array. List of paths to modules, ordered.
 * @param  {[string]} exported     List of names for variables exported by a module.
 * @returns {[string, [string, string]]} List of all the module parameters and its inserted parameters
 */
const getImports = (pathModule, content, mapOfPathToExported) => {
  let imports = getFileImports(content)
  return imports.reduce((arr, t) => {
    const param = t[1]
    if (param) {
      // TODO check if import is of object structure and not just default
      const path = join(dirname(pathModule), t[0])
      const mParam = mapOfPathToExported[path]
      arr[1].push([param, mParam])
    }
    return arr
  }, [pathModule, []])
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
  const {
    arr,
    exclude = [],
    exported,
    i,
    imported,
    path
  } = options
  const doExclude = (
    isArray(exclude)
    ? exclude.includes(path)
    : regexTest(exclude, path)
  )
  let params = imported.map(m => m[0]).join(', ')
  let mParams = imported.map(m => m[1]).join(', ')
    // Remove license headers from modules
  content = removeLicenseHeader(content)
    // Remove use strict from modules
  content = content.replace(/'use strict';\r?\n/, '')
    // Remove import statements
    // @todo Add imported variables to the function arguments. Reuse getImports for this
  content = content.replace(/import\s[^\n]+\n/g, '')
  const exportStatements = getExportStatements(content)
  content = removeStatements(content, exportStatements)
  if (doExclude) {
    content = ''
  } else if (i === arr.length - 1) {
    // @notice Do not remove line below. It is for when we have more advanced master files.
    // content = (r ? 'return = ' : '') + '(function () {' + LE + content + (r ? LE + 'return ' + r + ';': '') + LE + '}());';
    content = (exported ? 'return ' + exported : '')
  } else {
    // @notice The result variable gets the same name as the one returned by the module, but when we have more advanced modules it could probably benefit from using the filename instead.
    const middle = content + (exported ? LE + 'return ' + exported + ';' : '')
    content = [
      (exported ? 'var ' + exported + ' = ' : '') + '(function (' + params + ') {',
      IND + middle.split('\n').join('\n' + IND),
      '}(' + mParams + '));'
    ].join(LE)
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
  const entry = options.entry
  const dependencies = getOrderedDependencies(entry)
  const mapOfPathToExported = {}
  const mapTransform = (path, i, arr) => {
    const content = getFile(path)
    const exported = getExportedVariables(content)
    mapOfPathToExported[path] = exported
    const imported = getImports(path, dependencies, mapOfPathToExported)
    const moduleOptions = Object.assign({}, options, {
      path: path,
      imported: imported,
      exported: exported,
      i: i,
      arr: arr
    })
    return moduleTransform(content, moduleOptions)
  }
  const modules = dependencies
        .map(mapTransform)
        .filter(m => m !== '')
        .join(LE)
  return fileTransform(modules, options)
}

module.exports = {
  cleanPath,
  compileFile,
  getExportStatements,
  getFileImports,
  getImportInfo,
  getListOfFileDependencies,
  getOrderedDependencies,
  isImportStatement,
  isInsideBlockComment,
  isInsideSingleComment,
  regexGetCapture,
  removeStatement,
  removeStatements
}
