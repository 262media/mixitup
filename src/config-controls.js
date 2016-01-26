/* global mixitup, h */

/**
 * @constructor
 * @memberof    mixitup.Config
 * @name        controls
 * @namespace
 * @public
 * @since       2.0.0
 */

mixitup.ConfigControls = function() {
    this.execAction('construct', 0);

    this.enable         = true;
    this.live           = false;
    this.toggleLogic    = 'or';
    this.toggleDefault  = 'all';
    this.activeClass    = 'active';

    this.execAction('construct', 1);

    h.seal(this);
};

mixitup.ConfigControls.prototype = Object.create(new mixitup.BasePrototype());

mixitup.ConfigControls.prototype.constructor = mixitup.ConfigControls;