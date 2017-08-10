'use strict'
import { describe, it } from 'mocha'
import { expect } from 'chai'
import defaults from '../src/dependencies.js'

describe('dependencies.js', () => {
  it('has export default', () => {
    expect(defaults).to.have.property('cleanPath')
      .that.is.a('function')
    expect(defaults).to.have.property('compileFile')
      .that.is.a('function')
    expect(defaults).to.have.property('isString')
      .that.is.a('function')
    expect(defaults).to.have.property('regexGetCapture')
      .that.is.a('function')
  })
})

describe('isString', () => {
  const isString = defaults.isString
  it('returns true when string', () => {
    expect(isString('')).to.equal(true)
  })
  it('returns false when undefined', () => {
    expect(isString(undefined)).to.equal(false)
  })
  it('returns false when boolean', () => {
    expect(isString(true)).to.equal(false)
  })
  it('returns false when number', () => {
    expect(isString(1)).to.equal(false)
  })
  it('returns false when object', () => {
    expect(isString({})).to.equal(false)
  })
  it('returns false when array', () => {
    expect(isString([])).to.equal(false)
  })
  it('returns false when null', () => {
    expect(isString(null)).to.equal(false)
  })
  it('returns false when function', () => {
    expect(isString(function () {})).to.equal(false)
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
