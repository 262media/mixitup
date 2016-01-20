/* global mixitup, h */

/**
 * @constructor
 * @memberof    mixitup
 * @namespace
 * @public
 * @since       2.0.0
 */

mixitup.ConfigControls = function() {
    this._execAction('constructor', 0);

    this.enable         = true;
    this.live           = false;
    this.toggleLogic    = 'or';
    this.toggleDefault  = 'all';
    this.activeClass    = 'active';

    this._execAction('constructor', 1);

    h.seal(this);
};

mixitup.ConfigControls.prototype = new mixitup.BasePrototype();