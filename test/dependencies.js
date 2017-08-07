'use strict';
import { expect } from 'chai';
import defaults from '../src/dependencies.js';

describe('dependencies.js', () => {
    it('has export default', () => {
        expect(defaults).to.have.property('cleanPath')
            .that.is.a('function');
        expect(defaults).to.have.property('compileFile')
            .that.is.a('function');
        expect(defaults).to.have.property('regexGetCapture')
            .that.is.a('function');
    });
});