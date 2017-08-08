'use strict'
import { describe, it } from 'mocha'
import { expect } from 'chai'
import defaults from '../src/process.js'

describe('process.js', () => {
  it('has export default', () => {
    expect(defaults).to.have.property('getFunction')
            .that.is.a('function')
    expect(defaults).to.have.property('getPalette')
            .that.is.a('function')
    expect(defaults).to.have.property('preProcess')
            .that.is.a('function')
    expect(defaults).to.have.property('printPalette')
            .that.is.a('function')
    expect(defaults).to.have.property('transpile')
            .that.is.a('function')
  })
})
