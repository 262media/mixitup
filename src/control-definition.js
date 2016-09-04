/* global mixitup, h */

/**
 * @constructor
 * @memberof    mixitup
 * @private
 * @since       3.0.0
 * @param       {string}        method
 * @param       {string}        selector
 * @param       {boolean}       [live]
 * @param       {string}        [parent]
 *     An optional string representing the name of the mixer.dom property containing a reference to a parent element.
 */

mixitup.ControlDefinition = function(method, selector, live, parent) {
    mixitup.Base.call(this);

    this.execAction('construct', 0);

    this.method             = method;
    this.selector           = selector;
    this.live               = live || false;
    this.parent             = parent || '';

    this.execAction('construct', 1);

    h.freeze(this);
    h.seal(this);
};

mixitup.BaseStatic.call(mixitup.ControlDefinition);

mixitup.ControlDefinition.prototype = Object.create(mixitup.Base.prototype);

mixitup.ControlDefinition.prototype.constructor = mixitup.ControlDefinition;

mixitup.controlDefinitions = [];

mixitup.controlDefinitions.push(new mixitup.ControlDefinition('multiMix', '[data-filter][data-sort]'));
mixitup.controlDefinitions.push(new mixitup.ControlDefinition('filter', '[data-filter]'));
mixitup.controlDefinitions.push(new mixitup.ControlDefinition('sort', '[data-sort]'));
mixitup.controlDefinitions.push(new mixitup.ControlDefinition('toggle', '[data-toggle]'));