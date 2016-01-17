/* global mixitup, h */

/**
 * @constructor
 * @memberof    mixitup
 * @private
 * @since       3.0.0
 */

mixitup.StyleData = function() {
    this._execAction('_constructor', 0);

    this.x              = 0;
    this.y              = 0;
    this.width          = 0;
    this.height         = 0;
    this.marginRight    = 0;
    this.marginBottom   = 0;
    this.opacity        = 0;
    this.display        = '';
    this.scale          = new mixitup.TransformData();
    this.translateX     = new mixitup.TransformData();
    this.translateY     = new mixitup.TransformData();
    this.translateZ     = new mixitup.TransformData();
    this.rotateX        = new mixitup.TransformData();
    this.rotateY        = new mixitup.TransformData();
    this.rotateZ        = new mixitup.TransformData();

    this._execAction('_constructor', 1);

    h.seal(this);
};

mixitup.StyleData.prototype = Object.create(mixitup.basePrototype);

h.extend(mixitup.StyleData.prototype, {
    _actions: {},
    _filters: {}
});