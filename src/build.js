/* eslint-env node, es6 */
/* eslint func-style: ["error", "expression"] */
'use strict'
const defaultOptions = require('./defaultOptions.js')
const {
  compileFile
} = require('./dependencies')
const {
  getPalette,
  preProcess,
  printPalette,
  transpile
} = require('./process.js')
const {
  debug,
  getFile,
  isArray,
  isFunction,
  isObject,
  isString,
  writeFile,
  writeFilePromise
} = require('./utilities.js')
const fs = require('fs')
const {
  join,
  resolve,
  sep
} = require('path')

/**
 * [getFilesInFolder description]
 * @param  {[type]} base              [description]
 * @param  {[type]} includeSubfolders [description]
 * @param  {[type]} path              [description]
 * @returns {[type]}                   [description]
 */
const getFilesInFolder = (base, includeSubfolders, path) => {
  let filenames = []
  let pathSubFolder = isString(path) ? path : ''
  fs.readdirSync(join(base, pathSubFolder)).forEach((filename) => {
    let filepath = join(base, pathSubFolder, filename)
    let isDirectory = fs.lstatSync(filepath).isDirectory()
    let isSystemFile = filename.indexOf('.') === 0
    if (isDirectory && includeSubfolders) {
      filenames = filenames.concat(
        getFilesInFolder(base, includeSubfolders, join(pathSubFolder, filename))
      )
    } else if (!isDirectory && !isSystemFile) {
      filenames.push(join(pathSubFolder, filename).split(sep).join('/'))
    }
  })
  return filenames
}

/**
 * Left pad a string
 * @param  {string} str    The string we want to pad.
 * @param  {string} char   The character we want it to be padded with.
 * @param  {number} length The length of the resulting string.
 * @returns {string}        The string with padding on left.
 */
const leftPad = (str, char, length) => char.repeat(length - str.length) + str

const getDate = () => {
  const date = new Date()
  const pad = (str) => leftPad(str, '0', 2)
  return ['' + date.getFullYear(), pad('' + (date.getMonth() + 1)), pad('' + date.getDate())].join('-')
}

const getTypes = (type) => (
  isArray(type) ? type : type === 'both' ? ['classic', 'css'] : [type]
)

const getProcess = palette => ({
  classic: {
    assembly: true,
    classic: true,
    palette: palette
  },
  css: {
    classic: false,
    palette: palette
  }
})

/**
 * Get options foreach individual
 * @param  {object} options General options for all files
 * @returns {[object]}       Array of indiviual file options
 */
const getIndividualOptions = ({
  base,
  cb,
  date,
  exclude,
  files,
  fileOptions = {},
  namespace,
  output,
  palette,
  product,
  type,
  umd,
  version,
  assetPrefix
}) => {
  const process = getProcess(palette)
  return files.reduce((arr, filename) => {
    const options = fileOptions[filename] || {}

    // Pick exclude, product and umd from fileOptions if defined.
    const obj = ['exclude', 'product', 'umd'].reduce((obj, key) => {
      obj[key] = options.hasOwnProperty(key) ? options[key] : obj[key]
      return obj
    }, {
      base,
      cb,
      date,
      entry: resolve(join(base, filename)),
      exclude,
      namespace,
      product,
      umd,
      version,
      assetPrefix
    })

    // Create a set of options for each type
    const typeOptions = getTypes(type).map(type => Object.assign({
      build: process[type],
      outputPath: resolve(
        join(output, (type === 'classic' ? '' : 'js/'), filename)
      )
    }, obj))

    // Add new options sets to the list
    return arr.concat(typeOptions)
  }, [])
}

const getESModuleOptions = (
  { base, date, output, files, namespace, palette, product, types, version, assetPrefix }
) => {
  const process = getProcess(palette)
  return files.reduce((arr, filename, i) => {
    const entry = resolve(join(base, filename))
    const typeOptions = types.map(type => ({
      date,
      process: process[type],
      entry,
      namespace,
      outputPath: resolve(join(
        output,
        (type === 'classic' ? '' : 'js/'),
        'es-modules',
        filename
      )),
      product,
      version,
      assetPrefix
    }))
    return arr.concat(typeOptions)
  }, [])
}

// Prior to 2020-11-18, palette was replaced inline in supercode
const usePaletteModule = options => {
  const filePath = [options.base, '..', 'ts', 'Core']
  return (
    fs.existsSync(join(...filePath, 'Color', 'Palette.ts')) ||
        fs.existsSync(join(...filePath, 'Palette.ts'))
  )
}

/**
 * Function which gathers all dependencies, merge options and build the final distribution file.
 * @param  {object|undefined} userOptions Build options set by the user
 * @returns {undefined} No return value
 */
const build = userOptions => {
  // userOptions is an empty object by default
  userOptions = isObject(userOptions) ? userOptions : {}
  // Merge the userOptions with defaultOptions
  let options = Object.assign({}, defaultOptions, userOptions)
  // Check if required options are set
  if (options.base) {
    // After refactoring, we're no longer replacing the palette in supercode
    if (!usePaletteModule(options)) {
      options.palette = (options.palette)
        ? options.palette
        : getPalette(
          (options.jsBase
            ? options.jsBase
            : options.base + '../'
          ) + '../css/highcharts.css'
        )
      printPalette(options.output + 'palette.html', options.palette)
    }

    options.date = options.date ? options.date : getDate()
    options.files = (options.files) ? options.files : getFilesInFolder(options.base, true)
    getIndividualOptions(options)
      .forEach((o, i, arr) => {
        let file = compileFile(o)
        file = preProcess(file, o)
        if (o.transpile) {
          file = transpile(file)
        }
        writeFile(o.outputPath, file)
        debug(o.debug, [
          'Completed ' + (i + 1) + ' of ' + arr.length,
          '- type: ' + o.type,
          '- entry: ' + o.entry,
          '- output: ' + o.outputPath
        ].join('\n'))
      })
  } else {
    debug(true, 'Missing required option! The options \'base\' is required for the script to run')
  }
}

const buildModules = userOptions => {
  // userOptions is an empty object by default
  userOptions = isObject(userOptions) ? userOptions : {}
  // Merge the userOptions with defaultOptions
  let options = Object.assign({}, defaultOptions, userOptions)

  // Make sure types is an array.
  options.types = getTypes(options.type)

  // Check if required options are set
  if (options.base) {
    if (!usePaletteModule(options)) {
      options.palette = (options.palette)
        ? options.palette
        : getPalette(
          (
            isString(options.pathPalette)
              ? options.pathPalette
              : options.base + '../css/highcharts.css'
          )
        )
    }
    options.date = options.date ? options.date : getDate()
    options.files = (
      isArray(options.files)
        ? options.files
        : getFilesInFolder(options.base, true).filter(path => path.endsWith('.js'))
    )
    getESModuleOptions(options)
      .forEach(({ entry, outputPath, process, date, version, product, assetPrefix }) => {
        const content = preProcess(
          getFile(entry),
          { build: process, date, product, version, assetPrefix }
        )
        writeFile(outputPath, content)
      })
  } else {
    debug(true, 'Missing required option! The options \'base\' is required for the script to run')
  }
}

const buildDistFromModules = (userOptions) => {
  let result
  const message = {
    errBase: 'Missing required option! The options \'base\' is required for the script to run'
  }
  // userOptions is an empty object by default
  userOptions = isObject(userOptions) ? userOptions : {}
  // Merge the userOptions with defaultOptions
  let options = Object.assign({}, defaultOptions, userOptions)
  // Check if required options are set
  if (options.base) {
    options.files = (
      isArray(options.files)
        ? options.files
        : getFilesInFolder(options.base, true)
    )
    const promises = getIndividualOptions(options)
      .map((o) => Promise.resolve(compileFile(o))
        .then((content) => writeFilePromise(o.outputPath, content))
        .then(() => isFunction(o.cb) ? o.cb(o.outputPath) : undefined)
      )
    result = Promise.all(promises)
  } else {
    result = Promise.reject(new Error(message.errBase))
  }
  return result
}

module.exports = {
  build,
  buildDistFromModules,
  buildModules,
  getFilesInFolder
}
