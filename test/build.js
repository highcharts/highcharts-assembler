'use strict'
import { describe, it } from 'mocha'
import { expect } from 'chai'
import defaults from '../src/build.js'
describe('build.js', () => {
  describe('exported properties', () => {
    it('has export default', () => {
      expect(defaults).to.have.property('build')
              .that.is.a('function')
      expect(defaults).to.have.property('buildModules')
              .that.is.a('function')
      expect(defaults).to.have.property('getFilesInFolder')
              .that.is.a('function')
    })
  })
})
