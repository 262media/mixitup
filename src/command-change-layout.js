/* global mixitup, h */

/**
 * @constructor
 * @memberof    mixitup
 * @private
 * @since       3.0.0
 */

mixitup.CommandChangeLayout = function() {
    mixitup.Base.call(this);

    this.callActions('beforeConstruct');

    this.containerClassname = '';

    this.callActions('afterConstruct');

    h.seal(this);
};

mixitup.BaseStatic.call(mixitup.CommandChangeLayout);

mixitup.CommandChangeLayout.prototype = Object.create(mixitup.Base.prototype);

mixitup.CommandChangeLayout.prototype.constructor = mixitup.CommandChangeLayout;