'use strict'
import { describe, it } from 'mocha'
import { expect } from 'chai'
import defaults from '../src/utilities.js'

describe('utilities.js', () => {
  it('has export default', () => {
    expect(defaults).to.have.property('createDirectory')
            .that.is.a('function')
    expect(defaults).to.have.property('debug')
            .that.is.a('function')
    expect(defaults).to.have.property('exists')
            .that.is.a('function')
    expect(defaults).to.have.property('folder')
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
