'use strict'
const {
  describe,
  it
} = require('mocha')
const expect = require('chai').expect
const defaults = require('../src/utilities.js')

describe('utilities.js', () => {
  describe('exported properties', () => {
    const functions = [
      'createDirectory',
      'debug',
      'exists',
      'getFile',
      'isString',
      'removeDirectory',
      'removeFile',
      'writeFile'
    ]
    it('should have a default export', () => {
      functions.forEach((name) => {
        expect(defaults).to.have.property(name)
          .that.is.a('function')
      })
    })
    it('should not have unexpected properties', () => {
      const exportedProperties = Object.keys(defaults)
      expect(exportedProperties).to.deep.equal(functions)
    })
  })
  describe('isString', () => {
    const isString = defaults.isString
    it('should return true when string', () => {
      expect(isString('')).to.equal(true)
    })
    it('should return false when boolean', () => {
      expect(isString(true)).to.equal(false)
    })
    it('should return false when undefined', () => {
      expect(isString(undefined)).to.equal(false)
    })
    it('should return false when null', () => {
      expect(isString(null)).to.equal(false)
    })
    it('should return false when object', () => {
      expect(isString({})).to.equal(false)
    })
    it('should return false when array', () => {
      expect(isString([])).to.equal(false)
    })
    it('should return false when number', () => {
      expect(isString(1)).to.equal(false)
    })
    it('should return false when function', () => {
      expect(isString(function () {})).to.equal(false)
    })
  })
})
