'use strict'
const {
  describe,
  it
} = require('mocha')
const expect = require('chai').expect
const defaults = require('../src/dependencies.js')

describe('dependencies.js', () => {
  describe('exported properties', () => {
    it('has export default', () => {
      expect(defaults).to.have.property('cleanPath')
        .that.is.a('function')
      expect(defaults).to.have.property('compileFile')
        .that.is.a('function')
      expect(defaults).to.have.property('regexGetCapture')
        .that.is.a('function')
    })
  })
  describe('expJavaScriptComment', () => {
    const exp = defaults.expJavaScriptComment
    it('matches single line comments', () => {
      const string = `var test // single line`
      expect(string.replace(exp, '')).to.equal(`var test `)
    })
    it('matches single line comments, with multi line inside', () => {
      const string = `var test // single line /* and multi line */`
      expect(string.replace(exp, '')).to.equal(`var test `)
    })
    it('matches multi line comments', () => {
      const string = `var first /* comment line
        * comment line
        */ var second`
      expect(string.replace(exp, '')).to.equal(`var first  var second`)
    })
    it('matches multi line comments, with single line inside', () => {
      const string = `var test /* multi line // and single line */`
      expect(string.replace(exp, '')).to.equal(`var test `)
    })
  })
  describe('getFileImports', () => {
    const getFileImports = defaults.getFileImports
    it('returns empty array when input is not a string', () => {
      expect(getFileImports(undefined)).to.deep.equal([])
    })
    it('returns tuples of path to module, and the variable name', () => {
      const string = `import var1 from 'module1'
var something = var1.something
import var2 from 'module2'
// import notImport from 'module3'
import 'module4'`
      expect(getFileImports(string)).to.deep.equal([
        ['module1', 'var1'],
        ['module2', 'var2'],
        ['module4', null]
      ])
    })
  })
  describe('isImportStatement', () => {
    const isImportStatement = defaults.isImportStatement
    it('should return false when input is not a String', () => {
      expect(isImportStatement()).to.equal(false)
    })
    it(`should return false when input is // import 'module'`, () => {
      expect(isImportStatement(`// import 'module'`)).to.equal(false)
    })
    it(`should return false when input is /* import 'module' */`, () => {
      expect(isImportStatement(`/* import 'module' */`)).to.equal(false)
    })
    it(`should return true when input is import 'module'`, () => {
      expect(isImportStatement(`import 'module'`)).to.equal(true)
    })
    it(`should return true when input is import a from 'module'`, () => {
      expect(isImportStatement(`import a from 'module'`)).to.equal(true)
    })
    it(`should return true when input is import { a } from 'module'`, () => {
      expect(isImportStatement(`import { a } from 'module'`)).to.equal(true)
    })
  })
  describe('removeFirstBlockComment', () => {
    const removeFirstBlockComment = defaults.removeFirstBlockComment
    it('should remove first block comment', () => {
      expect(removeFirstBlockComment('/**/')).to.equal('')
      expect(removeFirstBlockComment('/* comment */')).to.equal('')
      expect(removeFirstBlockComment('const a = 1 /*/ comment not closed'))
        .to.equal('const a = 1 ')
      expect(removeFirstBlockComment('const a = 1 /* a comment */ const b = 2'))
        .to.equal('const a = 1  const b = 2')
      expect(removeFirstBlockComment('/* comment1 *//* comment2 */'))
        .to.equal('/* comment2 */')
      expect(removeFirstBlockComment('const a = 1')).to.equal('const a = 1')
    })
    it(`should return '' when input is not a string`, () => {
      expect(removeFirstBlockComment(undefined)).to.equal('')
      expect(removeFirstBlockComment(null)).to.equal('')
      expect(removeFirstBlockComment(false)).to.equal('')
      expect(removeFirstBlockComment(1)).to.equal('')
      expect(removeFirstBlockComment({})).to.equal('')
      expect(removeFirstBlockComment([])).to.equal('')
      expect(removeFirstBlockComment(function () {})).to.equal('')
    })
  })
})
