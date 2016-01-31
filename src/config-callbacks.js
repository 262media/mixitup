/* global mixitup, h */

/**
 * @constructor
 * @memberof    mixitup.Config
 * @name        callbacks
 * @namespace
 * @public
 * @since       2.0.0
 */

mixitup.ConfigCallbacks = function() {
    this.execAction('construct', 0);

    this.onMixStart = null;
    this.onMixBusy  = null;
    this.onMixEnd   = null;
    this.onMixFail  = null;
    this.onMixClick = null;

    this.execAction('construct', 1);

    h.seal(this);
};

mixitup.ConfigCallbacks.prototype = Object.create(new mixitup.BasePrototype());

mixitup.ConfigCallbacks.prototype.constructor = mixitup.ConfigCallbacks;