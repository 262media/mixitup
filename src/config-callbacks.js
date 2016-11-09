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
    mixitup.Base.call(this);

    this.callActions('beforeConstruct');

    /**
     * A callback function invoked at the start of all operations, before animation
     * has ocurred. Both the current state and the "future state" are passed to the
     * function as arguments.
     *
     * @example <caption>Example: Adding an `onMixStart` callback function</caption>
     * var mixer = mixitup(containerEl, {
     *     callbacks: {
     *         onMixStart: function(state, futureState) {
     *              console.log('Starting operation...');
     *         }
     *     }
     * });
     *
     * @name        onMixStart
     * @memberof    mixitup.Config.callbacks
     * @instance
     * @type        {function}
     * @default     null
     */

    this.onMixStart = null;

    /**
     * A callback function invoked if an operation is requested while queueing is disabled
     * or the queue is full.
     *
     * @example <caption>Example: Adding an `onMixBusy` callback function</caption>
     * var mixer = mixitup(containerEl, {
     *     callbacks: {
     *         onMixBusy: function(state) {
     *              console.log('Mixer busy');
     *         }
     *     }
     * });
     *
     * @name        onMixBusy
     * @memberof    mixitup.Config.callbacks
     * @instance
     * @type        {function}
     * @default     null
     */

    this.onMixBusy  = null;

    /**
     * A callback function invoked whenever an operation completes.
     *
     * @example <caption>Example: Adding an `onMixEnd` callback function</caption>
     * var mixer = mixitup(containerEl, {
     *     callbacks: {
     *         onMixBusy: function(state) {
     *              console.log('Operation complete');
     *         }
     *     }
     * });
     *
     * @name        onMixEnd
     * @memberof    mixitup.Config.callbacks
     * @instance
     * @type        {function}
     * @default     null
     */

    this.onMixEnd   = null;

    /**
     * A callback function invoked whenever an operation "fails", meaning no targets
     * were found matching the requested filter.
     *
     * @example <caption>Example: Adding an `onMixFail` callback function</caption>
     * var mixer = mixitup(containerEl, {
     *     callbacks: {
     *         onMixFail: function(state) {
     *              console.log('No items could be found matching the requested filter');
     *         }
     *     }
     * });
     *
     * @name        onMixFail
     * @memberof    mixitup.Config.callbacks
     * @instance
     * @type        {function}
     * @default     null
     */

    this.onMixFail  = null;

    /**
     * A callback function invoked whenever a control is clicked. The clicked element is
     * assigned to the `this` keyword within the function. The original click event is
     * passed to the function as the second argument, which can be useful if using `<a>`
     * tags as controls where the default behavior needs to be prevented.
     *
     * @example <caption>Example 1: Adding an `onMixClick` callback function</caption>
     * var mixer = mixitup(containerEl, {
     *     callbacks: {
     *         onMixClick: function(state, originalEvent) {
     *              console.log('The control "' + this.innerText + '" was clicked');
     *         }
     *     }
     * });
     *
     * @example <caption>Example 2: Using `onMixClick` to manipulate the original click event</caption>
     * var mixer = mixitup(containerEl, {
     *     callbacks: {
     *         onMixClick: function(state, originalEvent) {
     *              // Prevent original click event from bubbling up:
     *              originalEvent.stopPropagation();
     *
     *              // Prevent default behavior of clicked element:
     *              originalEvent.preventDefault();
     *         }
     *     }
     * });
     *
     * @name        onMixClick
     * @memberof    mixitup.Config.callbacks
     * @instance
     * @type        {function}
     * @default     null
     */

    this.onMixClick = null;

    this.callActions('afterConstruct');

    h.seal(this);
};

mixitup.BaseStatic.call(mixitup.ConfigCallbacks);

mixitup.ConfigCallbacks.prototype = Object.create(mixitup.Base.prototype);

mixitup.ConfigCallbacks.prototype.constructor = mixitup.ConfigCallbacks;