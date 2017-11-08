'use strict'
const {
  describe,
  it
} = require('mocha')
const expect = require('chai').expect
const defaults = require('../src/utilities.js')

describe('utilities.js', () => {
  describe('exported properties', () => {
    it('has export default', () => {
      expect(defaults).to.have.property('createDirectory')
              .that.is.a('function')
      expect(defaults).to.have.property('debug')
              .that.is.a('function')
      expect(defaults).to.have.property('exists')
              .that.is.a('function')
      expect(defaults).to.have.property('getFile')
              .that.is.a('function')
      expect(defaults).to.have.property('removeDirectory')
              .that.is.a('function')
      expect(defaults).to.have.property('removeFile')
              .that.is.a('function')
      expect(defaults).to.have.property('writeFile')
              .that.is.a('function')
    })
  })
})
