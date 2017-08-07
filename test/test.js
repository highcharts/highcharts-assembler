'use strict';
import './build.js';
import './dependencies.js';
import './process.js';
import './utilities.js';
import { expect } from 'chai';
import main from '../index.js';

describe('index.js', () => {
    it('has a primary entry point', () => {
        expect(main).to.be.a('function');
        expect(main.name).to.equal('build');
    });
});
