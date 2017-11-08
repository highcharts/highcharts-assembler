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
      'isArray',
      'isBool',
      'isNull',
      'isObject',
      'isString',
      'isUndefined',
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
  describe('isArray', () => {
    const isArray = defaults.isArray
    it('should return true when array', () => {
      expect(isArray([])).to.equal(true)
    })
    it('should return false when boolean', () => {
      expect(isArray(false)).to.equal(false)
    })
    it('should return false when undefined', () => {
      expect(isArray(undefined)).to.equal(false)
    })
    it('should return false when null', () => {
      expect(isArray(null)).to.equal(false)
    })
    it('should return false when object', () => {
      expect(isArray({})).to.equal(false)
    })
    it('should return false when number', () => {
      expect(isArray(1)).to.equal(false)
    })
    it('should return false when string', () => {
      expect(isArray('')).to.equal(false)
    })
    it('should return false when function', () => {
      expect(isArray(function () {})).to.equal(false)
    })
  })
  describe('isBool', () => {
    const isBool = defaults.isBool
    it('should return true when boolean', () => {
      expect(isBool(false)).to.equal(true)
    })
    it('should return false when undefined', () => {
      expect(isBool(undefined)).to.equal(false)
    })
    it('should return false when null', () => {
      expect(isBool(null)).to.equal(false)
    })
    it('should return false when object', () => {
      expect(isBool({})).to.equal(false)
    })
    it('should return false when array', () => {
      expect(isBool([])).to.equal(false)
    })
    it('should return false when number', () => {
      expect(isBool(1)).to.equal(false)
    })
    it('should return false when string', () => {
      expect(isBool('')).to.equal(false)
    })
    it('should return false when function', () => {
      expect(isBool(function () {})).to.equal(false)
    })
  })
  describe('isNull', () => {
    const isNull = defaults.isNull
    it('should return true when null', () => {
      expect(isNull(null)).to.equal(true)
    })
    it('should return false when object', () => {
      expect(isNull({})).to.equal(false)
    })
    it('should return false when boolean', () => {
      expect(isNull(false)).to.equal(false)
    })
    it('should return false when undefined', () => {
      expect(isNull(undefined)).to.equal(false)
    })
    it('should return false when array', () => {
      expect(isNull([])).to.equal(false)
    })
    it('should return false when number', () => {
      expect(isNull(1)).to.equal(false)
    })
    it('should return false when string', () => {
      expect(isNull('')).to.equal(false)
    })
    it('should return false when function', () => {
      expect(isNull(function () {})).to.equal(false)
    })
  })
  describe('isObject', () => {
    const isObject = defaults.isObject
    it('should return true when object', () => {
      expect(isObject({})).to.equal(true)
    })
    it('should return false when boolean', () => {
      expect(isObject(false)).to.equal(false)
    })
    it('should return false when undefined', () => {
      expect(isObject(undefined)).to.equal(false)
    })
    it('should return false when null', () => {
      expect(isObject(null)).to.equal(false)
    })
    it('should return false when array', () => {
      expect(isObject([])).to.equal(false)
    })
    it('should return false when number', () => {
      expect(isObject(1)).to.equal(false)
    })
    it('should return false when string', () => {
      expect(isObject('')).to.equal(false)
    })
    it('should return false when function', () => {
      expect(isObject(function () {})).to.equal(false)
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
  describe('isUndefined', () => {
    const isUndefined = defaults.isUndefined
    it('should return true when undefined', () => {
      expect(isUndefined(undefined)).to.equal(true)
    })
    it('should return false when string', () => {
      expect(isUndefined('')).to.equal(false)
    })
    it('should return false when boolean', () => {
      expect(isUndefined(true)).to.equal(false)
    })
    it('should return false when null', () => {
      expect(isUndefined(null)).to.equal(false)
    })
    it('should return false when object', () => {
      expect(isUndefined({})).to.equal(false)
    })
    it('should return false when array', () => {
      expect(isUndefined([])).to.equal(false)
    })
    it('should return false when number', () => {
      expect(isUndefined(1)).to.equal(false)
    })
    it('should return false when function', () => {
      expect(isUndefined(function () {})).to.equal(false)
    })
  })
})
