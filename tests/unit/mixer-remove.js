'use strict';

require('jsdom-global')();

const chai    = require('chai');
const dom     = require('../mock/dom');
const mixitup = require('../../dist/mixitup.js');

chai.use(require('chai-shallow-deep-equal'));
chai.use(require('chai-as-promised'));

describe('mixitup.Mixer', () => {
    describe('#remove()', () => {
        it('should accept an element as an argument', () => {
            let container = dom.getContainer();
            let mixer = mixitup(container);
            let toRemove = container.children[3];

            return mixer.remove(toRemove)
                .then(state => {
                    chai.assert.notEqual(state.show[3].id, '4');
                    chai.assert.equal(state.show[3].id, '5');
                    chai.assert.equal(state.totalShow, '5');
                });
        });

        it('should accept a collection of elements as an argument', () => {
            let container = dom.getContainer();
            let mixer = mixitup(container);
            let toRemove = [container.children[3], container.children[0]];

            return mixer.remove(toRemove)
                .then(state => {
                    chai.assert.equal(state.show[0].id, '2');
                    chai.assert.equal(state.show[3].id, '6');
                    chai.assert.equal(state.totalShow, '4');
                });
        });

        it('should accept an index as an argument', () => {
            let container = dom.getContainer();
            let mixer = mixitup(container);

            return mixer.remove(3)
                .then(state => {
                    chai.assert.equal(state.show[3].id, '5');
                    chai.assert.equal(state.totalShow, '5');
                });
        });

        it('should accept a selector as an argument', () => {
            let container = dom.getContainer();
            let mixer = mixitup(container);

            return mixer.remove('.category-a')
                .then(state => {
                    chai.assert.equal(state.totalShow, '3');
                });
        });

        it('should allow no elements to be removed with a warning', () => {
            let container = dom.getContainer();
            let mixer = mixitup(container);

            return mixer.remove()
                .then(state => {
                    chai.assert.equal(state.totalShow, '6');
                });
        });
    });
});