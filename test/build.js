'use strict';
import { expect } from 'chai';
import build from '../src/build.js';

describe('build.js', () => {
    it('export default', () => {
        expect(build).to.have.property('build')
            .that.is.a('function');
        expect(build).to.have.property('buildModules')
            .that.is.a('function');
        expect(build).to.have.property('getFilesInFolder')
            .that.is.a('function');
    });
});