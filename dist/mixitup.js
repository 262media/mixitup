/**!
 * MixItUp v3.0.0-beta
 *
 * @copyright Copyright 2014-2016 KunkaLabs Limited.
 * @author    KunkaLabs Limited.
 * @link      https://kunkalabs.com/mixitup/
 *
 * @license   Commercial use requires a commercial license.
 *            https://kunkalabs.com/mixitup/licenses
 *
 *            Non-commercial use permitted under same terms as  license.
 *            http://creativecommons.org/licenses/by-nc/3.0/
 */

(function(window) {
    'use strict';

    var mixitup         = null,
        h               = null;

    /**
     * The `mixitup` factory function is the first entry point for the v3 API,
     * abstracting away the functionality of instantiating `Mixer` objects.
     *
     * @global
     * @namespace
     * @public
     * @kind        function
     * @since       3.0.0
     * @param       {(Element|Element[]|string)}        container
     * @param       {object}                            [config]
     * @param       {object}                            [foreignDoc]
     * @param       {boolean}                           [returnCollection]
     * @return      {mixitup.Mixer|mixitup.Collection}
     */

    mixitup = function(container, config, foreignDoc, returnCollection) {
        var el          = null,
            instance    = null,
            doc         = null,
            instances   = [],
            id          = '',
            name        = '',
            elements    = [],
            i           = -1;

        doc = foreignDoc || window.document;

        if (config && typeof config.extensions === 'object') {
            for (name in config.extensions) {
                // Call the extension's factory function, passing
                // the mixitup factory as a paramater

                config.extensions[name](mixitup);
            }
        }

        if (
            (
                !container ||
                (typeof container !== 'string' && typeof container !== 'object')
            ) &&
            h.canReportErrors(config)
        ) {
            throw new Error('[MixItUp] Invalid selector or element');
        }

        switch (typeof container) {
            case 'string':
                elements = doc.querySelectorAll(container);

                break;
            case 'object':
                if (h.isElement(container, doc)) {
                    elements = [container];
                } else if (container.length) {
                    elements = container;
                }

                break;
        }

        for (i = 0; el = elements[i]; i++) {
            if (!el.id) {
                id = 'MixItUp' + h.randomHexKey();

                el.id = id;
            } else {
                id = el.id;
            }

            if (typeof mixitup.Mixer.prototype._instances[id] === 'undefined') {
                instance = new mixitup.Mixer();

                instance._id            = id;
                instance._dom.document  = foreignDoc || window.document;

                instance._init(el, config);

                mixitup.Mixer.prototype._instances[id] = instance;
            } else if (mixitup.Mixer.prototype._instances[id] instanceof mixitup.Mixer) {
                instance = mixitup.Mixer.prototype._instances[id];

                if (config && h.canReportErrors(config)) {
                    console.warn(
                        '[MixItUp] This element already has an active instance.' +
                        'Config will be ignored.'
                    );
                }
            }

            instances.push(instance);
        }

        if (returnCollection) {
            return new mixitup.Collection(instances);
        } else {
            return instances[0];
        }
    };

    /**
     * Returns a mixitup.Collection of one or more instances
     * that can be operated on simultaneously, similar to a jQuery collection.
     * If the user specifically wants to control a collection, they should use this.
     *
     * @memberof    mixitup
     * @since       3.0.0
     * @param       {(Element|Element[]|string)}  container
     * @param       {object}                      [config]
     * @param       {object}                      [foreignDoc]
     * @return      {mixitup.Collection}
     */

    mixitup.all = function(container, config, foreignDoc) {
        var self = this;

        return self(container, config, foreignDoc, true);
    };

    /**
     * A small library of commonly-used helper functions. This is just a subset of
     * the complete "h" library, with some additional functions added specifically
     * for MixItUp.
     *
     * @author      Kunkalabs Limited
     * @global
     * @namespace
     * @private
     */

    h = {

        /**
         * @private
         * @since   3.0.0
         * @param   {Element}   el
         * @param   {string}    cls
         * @return  {boolean}
         */

        hasClass: function(el, cls) {
            return el.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
        },

        /**
         * @private
         * @since   3.0.0
         * @param   {Element}   el
         * @param   {string}    cls
         * @return  {void}
         */

        addClass: function(el, cls) {
            if (!this.hasClass(el, cls)) el.className += el.className ? ' ' + cls : cls;
        },

        /**
         * @private
         * @since   3.0.0
         * @param   {Element}   el
         * @param   {string}    cls
         * @return  {void}
         */

        removeClass: function(el, cls) {
            if (this.hasClass(el, cls)) {
                var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');

                el.className = el.className.replace(reg, ' ').trim();
            }
        },

        /**
         * @private
         * @since   3.0.0
         * @param   {object}    destination
         * @param   {object}    source
         * @return  {void}
         */

        extend: function(destination, source) {
            var property = '';

            for (property in source) {
                if (
                    typeof source[property] === 'object' &&
                    source[property] !== null &&
                    typeof source[property].length === 'undefined'
                ) {
                    destination[property] = destination[property] || {};

                    this.extend(destination[property], source[property]);
                } else {
                    destination[property] = source[property];
                }
            }
        },

        /**
         * @private
         * @since   3.0.0
         * @param   {Element}   el
         * @param   {string}    type
         * @param   {function}  fn
         * @param   {boolean}   useCapture
         * @return  {void}
         */

        on: function(el, type, fn, useCapture) {
            if (!el) return;

            if (el.attachEvent) {
                el['e' + type + fn] = fn;

                el[type + fn] = function() {
                    el['e' + type + fn](window.event);
                };

                el.attachEvent('on' + type, el[type + fn]);
            } else {
                el.addEventListener(type, fn, useCapture);
            }
        },

        /**
         * @private
         * @since   3.0.0
         * @param   {Element}   el
         * @param   {string}    type
         * @param   {function}  fn
         * @return  {void}
         */

        off: function(el, type, fn) {
            if (!el) return;

            if (el.detachEvent) {
                el.detachEvent('on' + type, el[type + fn]);
                el[type + fn] = null;
            } else {
                el.removeEventListener(type, fn, false);
            }
        },

        /**
         * @private
         * @param   {Element}   el
         * @param   {string}    eventName
         * @param   {object}    data
         * @param   {Document}  [doc]
         * @return  {void}
         */

        triggerCustom: function(el, eventName, data, doc) {
            var event = null;

            doc = doc || window.document;

            if (typeof window.CustomEvent === 'function') {
                event = new CustomEvent(eventName, {
                    detail: data
                });
            } else {
                event = doc.createEvent('CustomEvent');
                event.initCustomEvent(eventName, true, true, data);
            }

            el.dispatchEvent(event);
        },

        /**
         * @private
         * @since   3.0.0
         * @param   {Element}   el
         * @param   {string}    selector
         * @return  {Number}
         */

        index: function(el, selector) {
            var i = 0;

            while ((el = el.previousElementSibling) !== null) {
                if (!selector || el.matches(selector)) {
                    ++i;
                }
            }

            return i;
        },

        /**
         * @private
         * @since   2.0.0
         * @param   {string} str
         * @return  {string}
         */

        camelCase: function(str) {
            return str.replace(/-([a-z])/g, function(g) {
                return g[1].toUpperCase();
            });
        },

        /**
         * @private
         * @since   2.1.3
         * @param   {Element}   el
         * @param   {Document}  [doc]
         * @return  {boolean}
         */

        isElement: function(el, doc) {
            doc = doc || window.document;

            if (
                window.HTMLElement &&
                el instanceof HTMLElement
            ) {
                return true;
            } else if (
                doc.defaultView &&
                doc.defaultView.HTMLElement &&
                el instanceof doc.defaultView.HTMLElement
            ) {
                return true;
            } else {
                return (
                    el !== null &&
                    el.nodeType === 1 &&
                    el.nodeName === 'string'
                );
            }
        },

        /**
         * @private
         * @since   3.0.0
         * @param   {string}            htmlString
         * @param   {Document}          [doc]
         * @return  {DocumentFragment}
         */

        createElement: function(htmlString, doc) {
            var frag = null,
                temp = null;

            doc = doc || window.document;

            frag = doc.createDocumentFragment();
            temp = doc.createElement('div');

            temp.innerHTML = htmlString;

            while (temp.firstChild) {
                frag.appendChild(temp.firstChild);
            }

            return frag;
        },

        /**
         * @private
         * @since   3.0.0
         * @param   {Element}   el
         * @return  {void}
         */

        deleteElement: function(el) {
            if (el.parentElement) {
                el.parentElement.removeChild(el);
            }
        },

        /**
         * @private
         * @since   3.0.0
         * @param   {Array<*>}  a
         * @param   {Array<*>}  b
         * @return  {boolean}
         */

        isEqualArray: function(a, b) {
            var i = a.length;

            if (i !== b.length) return false;

            while (i--) {
                if (a[i] !== b[i]) return false;
            }

            return true;
        },

        /**
         * @private
         * @since   2.0.0
         * @param   {Array<*>}  oldArray
         * @return  {Array<*>}
         */

        arrayShuffle: function(oldArray) {
            var newArray    = oldArray.slice(),
                len         = newArray.length,
                i           = len,
                p           = -1,
                t           = [];

            while (i--) {
                p = ~~(Math.random() * len);
                t = newArray[i];

                newArray[i] = newArray[p];
                newArray[p] = t;
            }

            return newArray;
        },

        /**
         * @private
         * @since   3.0.0
         * @param   {function}  func
         * @param   {Number}    wait
         * @param   {boolean}   immediate
         * @return  {function}
         */

        debounce: function(func, wait, immediate) {
            var timeout;

            return function() {
                var self     = this,
                    args     = arguments,
                    callNow  = immediate && !timeout,
                    later    = null;

                later = function() {
                    timeout  = null;

                    if (!immediate) {
                        func.apply(self, args);
                    }
                };

                clearTimeout(timeout);

                timeout = setTimeout(later, wait);

                if (callNow) func.apply(self, args);
            };
        },

        /**
         * @private
         * @since   3.0.0
         * @param   {Element}   element
         * @return  {object}
         */

        position: function(element) {
            var xPosition       = 0,
                yPosition       = 0,
                offsetParent    = element;

            while (element) {
                xPosition -= element.scrollLeft;
                yPosition -= element.scrollTop;

                if (element === offsetParent) {
                    xPosition += element.offsetLeft;
                    yPosition += element.offsetTop;

                    offsetParent = element.offsetParent;
                }

                element = element.parentElement;
            }

            return {
                x: xPosition,
                y: yPosition
            };
        },

        /**
         * @private
         * @since   3.0.0
         * @param   {object}    node1
         * @param  {object}    node2
         * @return  {Number}
         */

        getHypotenuse: function(node1, node2) {
            var distanceX = node1.x - node2.x,
                distanceY = node1.y - node2.y;

            distanceX = distanceX < 0 ? distanceX * -1 : distanceX,
            distanceY = distanceY < 0 ? distanceY * -1 : distanceY;

            return Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
        },

        /**
         * @private
         * @since   3.0.0
         * @param   {object}        el
         * @param   {string}        selector
         * @param   {boolean}       [includeSelf]
         * @param   {Number}        [range]
         * @param   {Document}      [doc]
         * @return  {Element|null}
         */

        closestParent: function(el, selector, includeSelf, range, doc) {
            var parent  = el.parentNode,
                depth   = -1;

            doc     = doc || window.document;
            depth   = range || Infinity;

            if (includeSelf && el.matches(selector)) {
                return el;
            }

            while (depth && parent && parent != doc.body) {
                if (parent.matches && parent.matches(selector)) {
                    return parent;
                } else if (parent.parentNode) {
                    parent = parent.parentNode;
                } else {
                    return null;
                }

                if (range) {
                    depth--;
                }
            }

            return null;
        },

        /**
         * @private
         * @since   3.0.0
         * @param   {Element}   el
         * @param   {string}    selector
         * @param   {Document}  [doc]
         * @return  {NodeList}
         */

        children: function(el, selector, doc) {
            var children    = [],
                tempId      = '';

            doc = doc || window.doc;

            if (el) {
                if (!el.id) {
                    tempId = 'Temp' + this.randomHexKey();

                    el.id = tempId;
                }

                children = doc.querySelectorAll('#' + el.id + ' > ' + selector);

                if (tempId) {
                    el.removeAttribute('id');
                }
            }

            return children;
        },

        /**
         * @private
         * @since   3.0.0
         * @param   {Array<*>}  items
         * @param   {function}  callback
         * @return  {void}
         */

        forEach: function(items, callback) {
            var i       = -1,
                item    = null;

            for (i = 0; item = items[i]; i++) {
                (typeof callback === 'function') && callback.call(this, item);
            }
        },

        /**
         * @private
         * @since   3.0.0
         * @param   {Array<*>} originalArray
         * @return  {Array<*>}
         */

        clean: function(originalArray) {
            var cleanArray = [],
                i = -1;

            for (i = 0; i < originalArray.length; i++) {
                if (originalArray[i] !== '') {
                    cleanArray.push(originalArray[i]);
                }
            }

            return cleanArray;
        },

        /**
         * @private
         * @since  3.0.0
         * @param  {object}         libraries
         * @return {object|null}
         */

        getPromise: function(libraries) {
            var promise = {
                    promise: null,
                    resolve: null,
                    reject: null,
                    isResolved: false
                },
                defered = null;

            if (mixitup.Mixer.prototype._has._promises) {
                promise.promise     = new Promise(function(resolve, reject) {
                    promise.resolve = resolve;
                    promise.reject  = reject;
                });
            } else if (libraries.q && typeof libraries.q === 'function') {
                defered = libraries.q.defer();

                promise.promise = defered.promise;
                promise.resolve = defered.resolve;
                promise.reject  = defered.reject;
            } else {
                console.warn('[MixItUp] WARNING: No available Promises implementations were found');

                return null;
            }

            return promise;
        },

        /**
         * @private
         * @since   3.0.0
         * @param   {object}  [config]
         * @return  {boolean}
         */

        canReportErrors: function(config) {
            if (!config || !config.debug) {
                return true;
            } else {
                return config.debug.enable;
            }
        },

        /**
         * @private
         * @since   2.0.0
         * @param   {Element}   el
         * @param   {string}    property
         * @param   {String[]}  vendors
         * @return  {string}
         */

        getPrefix: function(el, property, vendors) {
            var i       = -1,
                prefix  = '';

            if (property.toLowerCase() in el.style) return '';

            for (i = 0; prefix = vendors[i]; i++) {
                if (prefix + property in el.style) {
                    return prefix.toLowerCase();
                }
            }

            return 'unsupported';
        },

        /**
         * @private
         * @since   3.0.0
         * @return  {string}
         */

        randomHexKey: function() {
            return (
                '00000' +
                (Math.random() * 16777216 << 0).toString(16)
            )
                .substr(-6)
                .toUpperCase();
        },

        /**
         * @private
         * @since   3.0.0
         * @param   {Document}  [doc]
         * @return  {object}
         */

        getDocumentState: function(doc) {
            doc = doc || window.document;

            return {
                scrollTop: window.pageYOffset,
                scrollLeft: window.pageXOffset,
                docHeight: doc.documentElement.scrollHeight
            };
        },

        /**
         * @private
         * @since   3.0.0
         * @param   {object}    obj
         * @param   {function}  fn
         * @return  {function}
         */

        bind: function(obj, fn) {
            return function() {
                return fn.apply(obj, arguments);
            };
        },

        /**
         * @private
         * @since   3.0.0
         * @param   {Element}   el
         * @return  {boolean}
         */

        isVisible: function(el) {
            var styles = null;

            if (el.offsetParent) return true;

            styles = window.getComputedStyle(el);

            if (
                styles.position === 'fixed' &&
                styles.visibility !== 'hidden' &&
                styles.opacity !== '0'
            ) {
                // Fixed elements report no offsetParent,
                // but may still be invisible

                return true;
            }

            return false;
        },

        /**
         * @private
         * @since   3.0.0
         * @param   {object}    obj
         */

        seal: function(obj) {
            if (typeof Object.seal === 'function') {
                Object.seal(obj);
            }
        },

        /**
         * @private
         * @since   3.0.0
         * @param   {string}    control
         * @param   {string}    specimen
         * @return  {boolean}
         */

        compareVersions: function(control, specimen) {
            var controlParts    = control.split('.'),
                specimenParts   = specimen.split('.'),
                controlPart     = -1,
                specimenPart    = -1,
                i               = -1;

            for (i = 0; i < controlParts.length; i++) {
                controlPart     = parseInt(controlParts[i]);
                specimenPart    = parseInt(specimenParts[i] || 0);

                if (specimenPart < controlPart) {
                    return false;
                } else if (specimenPart > controlPart) {
                    return true;
                }
            }

            return true;
        }
    };

    /**
     * The BasePrototype class exposes a set of static methods which all other MixItUp
     * classes inherit as a means of integrating extensions via the addition of new
     * methods and/or actions and hooks.
     *
     * @constructor
     * @namespace
     * @memberof    mixitup
     * @public
     * @since       3.0.0
     */

    mixitup.BasePrototype = function() {
        this._actions = {};
        this._filters = {};
    };

    mixitup.BasePrototype.prototype =
    /** @lends mixitup.BasePrototype */
    {
        constructor: mixitup.BasePrototype,

        /**
         * Performs a shallow extend on the class's prototype, enabling the addition of
         * multiple new members to the class in a single operation.
         *
         * @memberof    mixitup.BasePrototype
         * @public
         * @static
         * @since       2.1.0
         * @param       {object} extension
         * @return      {void}
         */

        extend: function(extension) {
            var key = '';

            // TODO: make the h extend helper method more robust with deep/shallow flag,
            // and call here as shallow

            for (key in extension) {
                if (extension[key]) {
                    this[key] = extension[key];
                }
            }
        },

        /**
         * Registers an action function to be executed at a predefined hook.
         *
         * @memberof    mixitup.BasePrototype
         * @public
         * @static
         * @since       2.1.0
         * @param       {string}    hook
         * @param       {string}    name
         * @param       {function}  func
         * @param       {number}    priority
         * @return      {void}
         */

        addAction: function(hook, name, func, priority) {
            this._addHook('_actions', hook, name, func, priority);
        },

        /**
         * Registers a filter function to be executed at a predefined hook.
         *
         * @memberof    mixitup.BasePrototype
         * @public
         * @static
         * @since       2.1.0
         * @param       {string}    hook
         * @param       {string}    name
         * @param       {function}  func
         * @return      {void}
         */

        addFilter: function(hook, name, func) {
            this._addHook('_filters', hook, name, func);
        },

        /**
         * Registers a filter or action to be executed at a predefined hook. The
         * lower-level call used by `addAction` and `addFiler`.
         *
         * @memberof    mixitup.BasePrototype
         * @private
         * @static
         * @since       2.1.0
         * @param       {string}    type
         * @param       {string}    hook
         * @param       {string}    name
         * @param       {function}  func
         * @param       {number}    priority
         * @return      {void}
         */

        _addHook: function(type, hook, name, func, priority) {
            var collection  = this[type],
                obj         = {};

            priority = (priority === 1 || priority === 'post') ? 'post' : 'pre';

            obj[hook]                   = {};
            obj[hook][priority]         = {};
            obj[hook][priority][name]   = func;

            h.extend(collection, obj);
        },

        /**
         * Executes any registered actions for the respective hook.
         *
         * @memberof    mixitup.BasePrototype
         * @private
         * @static
         * @since       2.0.0
         * @param       {string}    methodName
         * @param       {boolean}   isPost
         * @param       {Array<*>}  args
         * @return      {void}
         */

        _execAction: function(methodName, isPost, args) {
            var self    = this,
                key     = '',
                context = isPost ? 'post' : 'pre';

            if (!self._actions.isEmptyObject && self._actions.hasOwnProperty(methodName)) {
                for (key in self._actions[methodName][context]) {
                    self._actions[methodName][context][key].call(self, args);
                }
            }
        },

        /**
         * Executes any registered filters for the respective hook.
         *
         * @memberof    mixitup.BasePrototype
         * @private
         * @static
         * @since       2.0.0
         * @param       {string}    methodName
         * @param       {*}         value
         * @param       {Array<*>}  args
         * @return      {*}
         */

        _execFilter: function(methodName, value, args) {
            var self    = this,
                key     = '';

            if (!self._filters.isEmptyObject && self._filters.hasOwnProperty(methodName)) {
                for (key in self._filters[methodName].pre) {
                    return self._filters[methodName].pre[key].call(self, value, args);
                }
            } else {
                return value;
            }
        }
    };

    /**
     * The `mixitup.Mixer` class is used to construct discreet user-configured
     * instances of MixItUp around the provided container element(s). Other
     * than the intial `mixitup()` factory function call, which returns an
     * instance of a mixer, all other public API functionality is performed
     * on mixer instances.
     *
     * @constructor
     * @namespace
     * @memberof    mixitup
     * @public
     * @since       3.0.0
     */

    mixitup.Mixer = function() {
        var self = this;

        self._execAction('_constructor', 0);

        h.extend(self, {
            selectors: {
                target: '.mix',
                filter: '.filter',
                filterToggle: '.filter-toggle',
                multiMix: '.multi-mix',
                sort: '.sort'
            },

            animation: {
                enable: true,
                effects: 'fade scale',
                effectsIn: '',
                effectsOut: '',
                duration: 600,
                easing: 'ease',
                perspectiveDistance: '3000',
                perspectiveOrigin: '50% 50%',
                queue: true,
                queueLimit: 3,
                animateChangeLayout: false,
                animateResizeContainer: true,
                animateResizeTargets: false,
                staggerSequence: null,
                reverseOut: false,
                nudgeOut: true
            },

            callbacks: {
                onMixLoad: null,
                onMixStart: null,
                onMixBusy: null,
                onMixEnd: null,
                onMixFail: null,
                onMixClick: null
            },

            controls: {
                enable: true,
                live: false,
                toggleLogic: 'or',
                toggleDefault: 'all',
                activeClass: 'active'
            },

            layout: {
                allowNestedTargets: false,
                display: 'inline-block',
                containerClass: '',
                containerClassFail: 'fail'
            },

            load: {
                filter: 'all',
                sort: 'default:asc'
            },

            libraries: {
                q: null
            },

            debug: {
                enable: true
            },

            document: null,
            extensions: null,

            _dom: {
                document: null,
                body: null,
                container: null,
                targets: [],
                parent: null,
                sortButtons: [],
                filterButtons: [],
                filterToggleButtons: [],
                multiMixButtons: [],
                allButtons: []
            },

            _id: '',
            _isMixing: false,
            _isClicking: false,
            _isLoading: true,
            _targets: [],
            _origOrder: [],
            _toggleArray: [],
            _toggleString: '',
            _staggerDuration: 0,
            _incPadding: true,
            _targetsMoved: 0,
            _targetsImmovable: 0,
            _targetsBound: 0,
            _targetsDone: 0,
            _userPromise: null,
            _userCallback: null,
            _effectsIn: null,
            _effectsOut: null,
            _transformIn: [],
            _transformOut: [],
            _queue: [],
            _handler: null,
            _state: null,
            _lastOperation: null,
            _lastClicked: null,
            _vendor: ''
        });

        self._execAction('_constructor', 1);

        h.seal(this);
        h.seal(this.selectors);
        h.seal(this.animation);
        h.seal(this.callbacks);
        h.seal(this.controls);
        h.seal(this.layout);
        h.seal(this.load);
        h.seal(this.libraries);
        h.seal(this.debug);
        h.seal(this._dom);
    };

    mixitup.Mixer.prototype = new mixitup.BasePrototype();

    h.extend(mixitup.Mixer.prototype,
    /** @lends mixitup.Mixer */
    {
        constructor: mixitup.Mixer,

        _transformProp: 'transform',
        _transformRule: 'transform',
        _transitionProp: 'transition',
        _perspectiveProp: 'perspective',
        _perspectiveOriginProp: 'perspectiveOrigin',

        _tweenable: [
            'opacity',
            'width', 'height',
            'marginRight', 'marginBottom',
            'x', 'y',
            'scale',
            'translateX', 'translateY', 'translateZ',
            'rotateX', 'rotateY', 'rotateZ'
        ],

        _transformDefaults: {
            scale: {
                value: 0.01,
                unit: ''
            },
            translateX: {
                value: 20,
                unit: 'px'
            },
            translateY: {
                value: 20,
                unit: 'px'
            },
            translateZ: {
                value: 20,
                unit: 'px'
            },
            rotateX: {
                value: 90,
                unit: 'deg'
            },
            rotateY: {
                value: 90,
                unit: 'deg'
            },
            rotateZ: {
                value: 180,
                unit: 'deg'
            }
        },

        _is: {},
        _has: {},

        _instances: {},

        _handled: {
            _filterToggle: {},
            _multiMix: {},
            _filter: {},
            _sort: {}
        },

        _bound: {
            _filterToggle: {},
            _multiMix: {},
            _filter: {},
            _sort: {}
        },

        /**
         * Performs all neccessary feature detection on the first evalulation of
         * the library.
         *
         * @private
         * @static
         * @since 2.0.0
         */

        _featureDetect: function() {
            var self                = this,
                testEl              = document.createElement('div'),
                vendorsTrans        = ['Webkit', 'Moz', 'O', 'ms'],
                vendorsRAF          = ['webkit', 'moz'],
                transitionPrefix    = h.getPrefix(testEl, 'Transition', vendorsTrans),
                transformPrefix     = h.getPrefix(testEl, 'Transform', vendorsTrans),
                i                   = -1;

            self._execAction('_featureDetect', 0);

            self._vendor = transformPrefix; // TODO: this is only used for box-sizing, make a seperate test

            mixitup.Mixer.prototype._has._promises      = typeof Promise === 'function';
            mixitup.Mixer.prototype._has._transitions   = transitionPrefix !== 'unsupported';
            mixitup.Mixer.prototype._is._crapIe         = window.atob ? false : true;

            mixitup.Mixer.prototype._transitionProp =
                transitionPrefix ? transitionPrefix + 'Transition' : 'transition';

            mixitup.Mixer.prototype._transformProp =
                transformPrefix ? transformPrefix + 'Transform' : 'transform';

            mixitup.Mixer.prototype._transformRule =
                transformPrefix ? '-' + transformPrefix + '-transform' : 'transform';

            mixitup.Mixer.prototype._perspectiveProp =
                transformPrefix ? transformPrefix + 'Perspective' : 'perspective';

            mixitup.Mixer.prototype._perspectiveOriginProp =
                transformPrefix ? transformPrefix + 'PerspectiveOrigin' : 'perspectiveOrigin';

            // Apply polyfills:

            // window.requestAnimationFrame

            for (i = 0; i < vendorsRAF.length && !window.requestAnimationFrame; i++) {
                window.requestAnimationFrame = window[vendorsRAF[i] + 'RequestAnimationFrame'];
            }

            // Element.nextElementSibling

            if (typeof testEl.nextElementSibling === 'undefined') {
                Object.defineProperty(Element.prototype, 'nextElementSibling', {
                    get: function() {
                        var el = this.nextSibling;

                        while (el) {
                            if (el.nodeType === 1) {
                                return el;
                            }

                            el = el.nextSibling;
                        }

                        return null;
                    }
                });
            }

            // Element.matches

            (function(ElementPrototype) {
                ElementPrototype.matches =
                    ElementPrototype.matches ||
                    ElementPrototype.machesSelector ||
                    ElementPrototype.mozMatchesSelector ||
                    ElementPrototype.msMatchesSelector ||
                    ElementPrototype.oMatchesSelector ||
                    ElementPrototype.webkitMatchesSelector ||
                    function (selector) {
                        var nodes = (this.parentNode || this.doc).querySelectorAll(selector),
                            i = -1;

                        while (nodes[++i] && nodes[i] != this) {
                            return !!nodes[i];
                        }
                    };
            })(Element.prototype);

            self._execAction('_featureDetect', 1);
        },

        /**
         * @private
         * @instance
         * @since   2.0.0
         * @param   {Element}   el
         * @param   {object}    config
         * @return  {void}
         */

        _init: function(el, config) {
            var self        = this,
                state       = new mixitup.State(),
                operation   = new mixitup.Operation();

            self._execAction('_init', 0, arguments);

            config && h.extend(self, config);

            self._cacheDom(el);

            self.layout.containerClass && h.addClass(el, self.layout.containerClass);

            self.animation.enable = self.animation.enable && mixitup.Mixer.prototype._has._transitions;

            self._indexTargets();

            state.activeFilter = self.load.filter === 'all' ?
                self.selectors.target :
                self.load.filter === 'none' ?
                    '' :
                    self.load.filter;

            state.activeSort = self.load.sort;
            state.activeContainerClass = self.layout.containerClass;
            state.activeDisplay = self.layout.display;

            if (state.activeSort) {
                // Perform a syncronous sort without an operation

                operation.startSortString   = 'default:asc';
                operation.startOrder        = self._targets;
                operation.newSort           = self._parseSort(state.activeSort);
                operation.newSortString     = state.activeSort;

                self._sort(operation);

                self._printSort(false, operation);

                self._targets = operation.newOrder;
            }

            self._updateControls({
                filter: state.activeFilter,
                sort: state.activeSort
            });

            self._parseEffects();

            self._bindEvents();

            self._state = state;

            if (self._dom.filterToggleButtons.length) {
                // TODO: what about live toggles? is it worth trawling the dom?

                self._buildToggleArray();
            }

            self._execAction('_init', 1, arguments);
        },

        /**
         * Caches references of DOM elements neccessary for the mixer's functionality.
         *
         * @private
         * @instance
         * @since   3.0.0
         * @param   {Element} el
         * @return  {void}
         */

        _cacheDom: function(el) {
            var self = this;

            self._execAction('_cacheDom', 0, arguments);

            self._dom.body      = self._dom.document.getElementsByTagName('body')[0];
            self._dom.container = el;
            self._dom.parent    = el;

            self._dom.sortButtons =
                Array.prototype.slice.call(self._dom.document.querySelectorAll(self.selectors.sort));

            self._dom.filterButtons =
                Array.prototype.slice.call(self._dom.document.querySelectorAll(self.selectors.filter));

            self._dom.filterToggleButtons =
                Array.prototype.slice.call(self._dom.document.querySelectorAll(self.selectors.filterToggle));

            self._dom.multiMixButtons =
                Array.prototype.slice.call(self._dom.document.querySelectorAll(self.selectors.multiMix));

            self._dom.allButtons = self._dom.filterButtons
                .concat(self._dom.sortButtons)
                .concat(self._dom.filterToggleButtons)
                .concat(self._dom.multiMixButtons);

            self._execAction('_cacheDom', 1, arguments);
        },

        /**
         * Indexes all child elements of the mixer matching the `selectors.target`
         * selector, instantiating a mixitup.Target for each one.
         *
         * @private
         * @instance
         * @since   3.0.0
         * @return  {void}
         */

        _indexTargets: function() {
            var self    = this,
                target  = null,
                el      = null,
                i       = -1;

            self._execAction('_indexTargets', 0, arguments);

            self._dom.targets = self.layout.allowNestedTargets ?
                self._dom.container.querySelectorAll(self.selectors.target) :
                h.children(self._dom.container, self.selectors.target, self._dom.document);

            self._dom.targets = Array.prototype.slice.call(self._dom.targets);

            // TODO: allow querying of all descendants via config option, allowing for nested parent

            self._targets = [];

            if (self._dom.targets.length) {
                for (i = 0; el = self._dom.targets[i]; i++) {
                    target = new mixitup.Target();

                    target.init(el, self);

                    self._targets.push(target);
                }

                self._dom.parent = self._dom.targets[0].parentElement.isEqualNode(self._dom.container) ?
                    self._dom.container :
                    self._dom.targets[0].parentElement;
            }

            self._origOrder = self._targets;

            self._execAction('_indexTargets', 1, arguments);
        },

        /**
         * @private
         * @instance
         * @since   3.0.0
         * @return  {void}
         */

        _bindEvents: function() {
            var self            = this,
                proto           = mixitup.Mixer.prototype,
                filterToggles   = proto._bound._filterToggle,
                multiMixs       = proto._bound._multiMix,
                filters         = proto._bound._filter,
                sorts           = proto._bound._sort,
                button          = null,
                i               = -1;

            self._execAction('_bindEvents', 0);

            self._handler = function(e) {
                return self._eventBus(e);
            };

            if (self.controls.live) {
                h.on(window, 'click', self._handler);
            } else {
                for (i = 0; button = self._dom.allButtons[i]; i++) {
                    h.on(button, 'click', self._handler);
                }
            }

            // For each mixitup.Mixer instance, increment the bound value for each button type

            // TODO: could be much DRYer

            filterToggles[self.selectors.filterToggle] =
                (typeof filterToggles[self.selectors.filterToggle] === 'undefined') ?
                    1 : filterToggles[self.selectors.filterToggle] + 1;

            multiMixs[self.selectors.multiMix] =
                (typeof multiMixs[self.selectors.multiMix] === 'undefined') ?
                    1 : multiMixs[self.selectors.multiMix] + 1;

            filters[self.selectors.filter] =
                (typeof filters[self.selectors.filter] === 'undefined') ?
                    1 : filters[self.selectors.filter] + 1;

            sorts[self.selectors.sort] =
                (typeof sorts[self.selectors.sort] === 'undefined') ?
                    1 : sorts[self.selectors.sort] + 1;

            self._execAction('_bindEvents', 1);
        },

        /**
         * @private
         * @instance
         * @since   3.0.0
         * @return  {void}
         */

        _unbindEvents: function() {
            var self    = this,
                button  = null,
                i       = -1;

            self._execAction('_unbindEvents', 0);

            h.off(window, 'click', self._handler);

            for (i = 0; button = self._dom.allButtons[i]; i++) {
                h.on(button, 'click', self._handler);
            }

            self._execAction('_unbindEvents', 1);
        },

        /**
         * @private
         * @instance
         * @param   {object}            e
         * @return  {(Boolean|void)}
         */

        _eventBus: function(e) {
            var self = this;

            switch(e.type) {
                case 'click':
                    return self.handleClick(e);
            }
        },

        /**
         * @private
         * @instance
         * @since   3.0.0
         * @param   {Event}  e
         * @return  {void}
         *
         * Determines the type of operation needed and the
         * appropriate parameters when a button is clicked
         */

        handleClick: function(e) {
            var self            = this,
                selectors       = [],
                command         = {},
                toggleSeperator = '',
                filterString    = '',
                sortString      = '',
                selector        = '',
                method          = '',
                key             = '',
                isTogglingOff   = false,
                button          = null,
                el              = null,
                i               = -1;

            self._execAction('handleClick', 0, arguments);

            toggleSeperator = self.controls.toggleLogic === 'or' ? ',' : '';

            if (
                self._isMixing &&
                (!self.animation.queue || self._queue.length >= self.animation.queueLimit)
            ) {
                if (h.canReportErrors(self)) {
                    console.warn(
                        '[MixItUp] An operation was requested but the MixItUp ' +
                        'instance was busy. The operation was rejected because ' +
                        'queueing is disabled or the queue is full.'
                    );
                }

                return;
            }

            for (key in self.selectors) {
                selectors.push(self.selectors[key]);
            }

            selector = selectors.join(',');

            button = h.closestParent(
                e.target,
                selector,
                true,
                Infinity,
                self._dom.document
            );

            if (!button) return;

            if (typeof self.callbacks.onMixClick === 'function') {
                self.callbacks.onMixClick.call(button, self._state, self);

                // TODO: trigger event
            }

            if (
                self._isMixing &&
                (!self.animation.queue || self._queue.length >= self.animation.queueLimit)
            ) {
                if (typeof self.callbacks.onMixBusy === 'function') {
                    self.callbacks.onMixBusy.call(self._dom.container, self._state, self);

                    // TODO: trigger event
                }

                self._execAction('handleClickBusy', 1, arguments);

                return;
            }

            self._isClicking = true;

            if (button.matches(self.selectors.sort)) {

                // sort

                sortString = button.getAttribute('data-sort');

                if (
                    !h.hasClass(button, self.controls.activeClass) ||
                    sortString.indexOf('random') > -1
                ) {
                    method = 'sort';

                    for (i = 0; el = self._dom.sortButtons[i]; i++) {
                        h.removeClass(el, self.controls.activeClass);
                    }

                    for (i = 0; el = self._dom.multiMixButtons[i]; i++) {
                        h.removeClass(el, self.controls.activeClass);
                    }

                    command = {
                        sort: sortString
                    };
                } else {
                    return;
                }
            } else if (button.matches(self.selectors.filter)) {

                // filter

                if (!h.hasClass(button, self.controls.activeClass)) {
                    method = 'filter';

                    for (i = 0; el = self._dom.filterButtons[i]; i++) {
                        h.removeClass(el, self.controls.activeClass);
                    }

                    for (i = 0; el = self._dom.filterToggleButtons[i]; i++) {
                        h.removeClass(el, self.controls.activeClass);
                    }

                    for (i = 0; el = self._dom.multiMixButtons[i]; i++) {
                        h.removeClass(el, self.controls.activeClass);
                    }

                    command = {
                        filter: button.getAttribute('data-filter')
                    };
                } else {
                    return;
                }
            } else if (button.matches(self.selectors.filterToggle)) {

                // filterToggle

                // TODO: there is an issue when multiple toggles are clicked
                // while an operation is in progress, the array is
                // reset to the last completed state each time. Needs
                // some thought.

                filterString    = button.getAttribute('data-filter');
                method          = 'filterToggle';

                for (i = 0; el = self._dom.filterButtons[i]; i++) {
                    h.removeClass(el, self.controls.activeClass);
                }

                for (i = 0; el = self._dom.multiMixButtons[i]; i++) {
                    h.removeClass(el, self.controls.activeClass);
                }

                // Build a toggle array from the last active filter

                self._buildToggleArray();

                // Add or remove filters as needed

                if (!h.hasClass(button, self.controls.activeClass)) {
                    self._toggleArray.push(filterString);
                } else {
                    self._toggleArray.splice(self._toggleArray.indexOf(filterString), 1);

                    isTogglingOff = true;
                }

                self._toggleArray = h.clean(self._toggleArray);

                self._toggleString = self._toggleArray.join(toggleSeperator);

                if (self._toggleString === '') {
                    self._toggleString = self.controls.toggleDefault;

                    command = {
                        filter: self._toggleString
                    };

                    self._updateControls(command);
                } else {
                    command = {
                        filter: self._toggleString
                    };
                }
            } else if (button.matches(self.selectors.multiMix)) {

                // multiMix

                if (!h.hasClass(button, self.controls.activeClass)) {
                    method = 'multiMix';

                    for (i = 0; el = self._dom.filterButtons[i]; i++) {
                        h.removeClass(el, self.controls.activeClass);
                    }

                    for (i = 0; el = self._dom.filterToggleButtons[i]; i++) {
                        h.removeClass(el, self.controls.activeClass);
                    }

                    for (i = 0; el = self._dom.sortButtons[i]; i++) {
                        h.removeClass(el, self.controls.activeClass);
                    }

                    for (i = 0; el = self._dom.multiMixButtons[i]; i++) {
                        h.removeClass(el, self.controls.activeClass);
                    }

                    command = {
                        sort: button.getAttribute('data-sort'),
                        filter: button.getAttribute('data-filter')
                    };

                    // Clear any active toggles

                    self._state.activeFilter = '';
                    self._buildToggleArray();

                    // Update any matching individual filter and sort
                    // controls to reflect the multiMix

                    self._updateControls(command);
                } else {
                    return;
                }
            }

            if (method) {
                self._trackClick(button, method, isTogglingOff);

                self.multiMix(command);
            }

            self._execAction('handleClick', 1, arguments);
        },

        /**
         * @private
         * @instance
         * @since   3.0.0
         * @param   {Element}   button
         * @param   {string}    method
         * @param   {boolean}   isTogglingOff
         * @return  {void}
         */

        _trackClick: function(button, method, isTogglingOff) {
            var self        = this,
                proto       = mixitup.Mixer.prototype,
                selector    = self.selectors[method];

            self._lastClicked = button;

            // Add the active class to a button only once
            // all mixitup.Mixer instances have handled the click

            method = '_' + method;

            proto._handled[method][selector] =
                (typeof proto._handled[method][selector] === 'undefined') ?
                    1 : proto._handled[method][selector] + 1;

            if (proto._handled[method][selector] === proto._bound[method][selector]) {
                if (isTogglingOff) {
                    h.removeClass(button, self.controls.activeClass);
                } else {
                    h.addClass(button, self.controls.activeClass);
                }

                delete proto._handled[method][selector];
            }
        },

        /**
         * Combines the selectors of active toggle controls into an array.
         *
         * @private
         * @instance
         * @since   2.0.0
         * @return  {void}
         */

        _buildToggleArray: function() {
            var self            = this,
                activeFilter    = '',
                filter          = '',
                i               = -1;

            self._execAction('_buildToggleArray', 0, arguments);

            activeFilter = self._state.activeFilter.replace(/\s/g, '');
            activeFilter = activeFilter === self.selectors.target ? '' : activeFilter;

            if (self.controls.toggleLogic === 'or') {
                self._toggleArray = activeFilter.split(',');
            } else {
                self._toggleArray = activeFilter.split('.');

                !self._toggleArray[0] && self._toggleArray.shift();

                for (i = 0; filter = self._toggleArray[i]; i++) {
                    self._toggleArray[i] = '.' + filter;
                }
            }

            self._toggleArray = h.clean(self._toggleArray);

            self._execAction('_buildToggleArray', 1, arguments);
        },

        /**
         * Updates controls to their active/inactive state based on the command or
         * current state of the mixer.
         *
         * @private
         * @instance
         * @since   2.0.0
         * @param   {object} command
         * @return  {void}
         */

        _updateControls: function(command) {
            var self                = this,
                filterToggleButton  = null,
                activeButton        = null,
                output              = null,
                button              = null,
                selector            = '',
                i                   = -1,
                j                   = -1;

            output = {
                filter: command && command.filter,
                sort: command && command.sort
            };

            self._execAction('_updateControls', 0, arguments);

            (typeof output.filter === 'undefined') && (output.filter = self._state.activeFilter);
            (typeof output.sort === 'undefined') && (output.sort = self._state.activeSort);
            (output.filter === self.selectors.target) && (output.filter = 'all');

            for (i = 0; button = self._dom.sortButtons[i]; i++) {
                h.removeClass(button, self.controls.activeClass);

                if (button.matches('[data-sort="' + output.sort + '"]')) {
                    h.addClass(button, self.controls.activeClass);
                }
            }

            for (i = 0; button = self._dom.filterButtons[i]; i++) {
                h.removeClass(button, self.controls.activeClass);

                if (button.matches('[data-filter="' + output.filter + '"]')) {
                    h.addClass(button, self.controls.activeClass);
                }
            }

            for (i = 0; button = self._dom.multiMixButtons[i]; i++) {
                h.removeClass(button, self.controls.activeClass);

                if (
                    button.matches('[data-sort="' + output.sort + '"]') &&
                    button.matches('[data-filter="' + output.filter + '"]')
                ) {
                    h.addClass(button, self.controls.activeClass);
                }
            }

            if (self._dom.filterToggleButtons.length) {
                for (i = 0; button = self._dom.filterToggleButtons[i]; i++) {
                    h.removeClass(button, self.controls.activeClass);

                    if (button.matches('[data-filter="' + output.filter + '"]')) {
                        h.addClass(button, self.controls.activeClass);
                    }
                }

                for (i = 0; selector = self._toggleArray[i]; i++) {
                    activeButton = null;

                    if (self.controls.live) {
                        activeButton = self._dom.document
                            .querySelector(self.selectors.filterToggle + '[data-filter="' + selector + '"]');
                    } else {
                        for (j = 0; filterToggleButton = self._dom.filterToggleButtons[j]; j++) {
                            if (filterToggleButton.matches('[data-filter="' + selector + '"]')) {
                                activeButton = filterToggleButton;
                            }
                        }
                    }

                    if (activeButton) {
                        h.addClass(activeButton, self.controls.activeClass);
                    }
                }
            }

            self._execAction('_updateControls', 1, arguments);
        },

        /**
         * @private
         * @instance
         * @since   3.0.0
         * @param   {object}        command
         * @param   {Operation}     operation
         * @return  {Promise.<mixitup.State>}
         */

        _insert: function(command, operation) {
            var self        = this,
                nextSibling = null,
                frag        = null,
                target      = null,
                el          = null,
                i           = -1;

            self._execAction('insert', 0, arguments);

            nextSibling = self._getNextSibling(command.index, command.sibling, command.position);
            frag        = self._dom.document.createDocumentFragment();

            if (command.targets) {
                for (i = 0; el = command.targets[i]; i++) {
                    if (self._dom.targets.indexOf(el) > -1) {
                        throw new Error('[MixItUp] An inserted element already exists in the container');
                    }

                    frag.appendChild(el);
                    frag.appendChild(self._dom.document.createTextNode(' '));

                    if (!h.isElement(el, self._dom.document) || !el.matches(self.selectors.target)) continue;

                    target = new mixitup.Target();

                    target.init(el, self);

                    self._targets.splice(command.index, 0, target);

                    command.index++;
                }

                self._dom.parent.insertBefore(frag, nextSibling);
            }

            // Since targets have been added, the original order must be updated

            operation.startOrder = self._origOrder = self._targets;

            self._execAction('insert', 1, arguments);
        },

        /**
         * @private
         * @instance
         * @since   3.0.0
         * @param   {Number}      [index]
         * @param   {Element}     [sibling]
         * @param   {string}      [position]
         */

        _getNextSibling: function(index, sibling, position) {
            var self = this;

            if (sibling) {
                if (position === 'before') {
                    return sibling;
                } else if (position === 'after') {
                    return sibling.nextElementSibling || null;
                }
            }

            if (self._targets.length && typeof index !== 'undefined') {
                return (index < self._targets.length || !self._targets.length) ?
                    self._targets[index].dom.el :
                    self._targets[self._targets.length - 1].dom.el.nextElementSibling;
            } else {
                return self._dom.parent.children.length ? self._dom.parent.children[0] : null;
            }
        },

        /**
         * @private
         * @instance
         * @since   2.0.0
         * @param   {Operation}     operation
         * @return  {void}
         */

        _filter: function(operation) {
            var self        = this,
                condition   = false,
                index       = -1,
                target      = null,
                i           = -1;

            self._execAction('_filter', 0, arguments);

            for (i = 0; target = operation.newOrder[i]; i++) {
                if (typeof operation.newFilter === 'string') {
                    // show via selector

                    condition = operation.newFilter === '' ?
                        false : target.dom.el.matches(operation.newFilter);

                    self._evaluateHideShow(
                        condition,
                        target,
                        false,
                        operation
                    );
                } else if (
                    typeof operation.newFilter === 'object' &&
                    h.isElement(operation.newFilter, self._dom.document)
                ) {
                    // show via element

                    self._evaluateHideShow(
                        target.dom.el === operation.newFilter,
                        target,
                        false,
                        operation
                    );
                } else if (
                    typeof operation.newFilter === 'object' &&
                    operation.newFilter.length
                ) {
                    // show via collection

                    self._evaluateHideShow(
                        operation.newFilter.indexOf(target.dom.el) > -1,
                        target,
                        false,
                        operation
                    );
                }
            }

            operation.matching = operation.show.slice();

            if (operation.toRemove.length) {
                for (i = 0; target = operation.show[i]; i++) {
                    if (operation.toRemove.indexOf(target) > -1) {
                        // If any shown targets should be removed, move them into the toHide array

                        operation.show.splice(i, 1);

                        if ((index = operation.toShow.indexOf(target)) > -1) {
                            operation.toShow.splice(index, 1);
                        }

                        operation.toHide.push(target);
                        operation.hide.push(target);

                        i--;
                    }
                }
            }

            self._execAction('_filter', 1, arguments);
        },

        /**
         * @private
         * @instance
         * @since   3.0.0
         * @param   {boolean}   condition
         * @param   {Element}   target
         * @param   {boolean}   isRemoving
         * @param   {Operation} operation
         * @return  {void}
         */

        _evaluateHideShow: function(condition, target, isRemoving, operation) {
            var self = this;

            if (condition) {
                if (isRemoving && typeof operation.startFilter === 'string') {
                    self._evaluateHideShow(
                        target.dom.el.matches(operation.startFilter),
                        target,
                        false,
                        operation
                    );
                } else {
                    operation.show.push(target);

                    !target.isShown && operation.toShow.push(target);
                }
            } else {
                operation.hide.push(target);

                target.isShown && operation.toHide.push(target);
            }
        },

        /**
         * @private
         * @instance
         * @since   2.0.0
         * @param   {Operation}     operation
         * @return  {void}
         */

        _sort: function(operation) {
            var self = this;

            self._execAction('_sort', 0, arguments);

            operation.startOrder = self._targets;

            switch (operation.newSort[0].sortBy) {
                case 'default':
                    operation.newOrder = self._origOrder.slice();

                    if (operation.newSort[0].order === 'desc') {
                        operation.newOrder.reverse();
                    }

                    break;
                case 'random':
                    operation.newOrder = h.arrayShuffle(operation.startOrder);

                    break;
                case 'custom':
                    operation.newOrder = operation.newSort[0].order;

                    break;
                default:
                    operation.newOrder = operation.startOrder
                        .slice()
                        .sort(function(a, b) {
                            return self._compare(a, b, 0, operation.newSort);
                        });
            }

            if (h.isEqualArray(operation.newOrder, operation.startOrder)) {
                operation.willSort = false;
            }

            self._execAction('_sort', 1, arguments);
        },

        /**
         * @private
         * @instance
         * @since   2.0.0
         * @param   {String|Number}     a
         * @param   {String|Number}     b
         * @param   {Number}            depth
         * @param   {ParsedSort}        sort
         * @return  {Number}
         */

        _compare: function(a, b, depth, sort) {
            depth = depth ? depth : 0;

            var self        = this,
                order       = sort[depth].order,
                attrA       = self._getAttributeValue(a, depth, sort),
                attrB       = self._getAttributeValue(b, depth, sort);

            // TODO: Can we read data-attributes before the compare algorithm is called?

            if (isNaN(attrA * 1) || isNaN(attrB * 1)) {
                attrA = attrA.toLowerCase();
                attrB = attrB.toLowerCase();
            } else {
                attrA = attrA * 1;
                attrB = attrB * 1;
            }

            if (attrA < attrB) {
                return order === 'asc' ? -1 : 1;
            }

            if (attrA > attrB) {
                return order === 'asc' ? 1 : -1;
            }

            if (attrA === attrB && sort.length > depth + 1) {
                return self._compare(a, b, depth + 1, sort);
            }

            return 0;
        },

        /**
         * Reads the values of any data attributes present the provided target element
         * which match the current sort command.
         *
         * @private
         * @instance
         * @since   3.0.0
         * @param   {Element}           target
         * @param   {number}            depth
         * @param   {ParsedSort}        [sort]
         * @return  {(String|Number)}
         */

        _getAttributeValue: function(target, depth, sort) {
            var self    = this,
                value   = '';

            sort = sort ? sort : self._newSort;

            value = target.dom.el.getAttribute('data-' + sort[depth].sortBy);

            if (value === null) {
                if (h.canReportErrors(self)) {
                    // Encourage users to assign values to all
                    // targets to avoid erroneous sorting when
                    // types are mixed

                    console.warn(
                        '[MixItUp] The sorting attribute "data-' +
                        sort[depth].sortBy +
                        '" was not present on one or more target elements'
                    );
                }
            }

            // If an attribute is not present, return 0 as a safety value

            return value || 0;
        },

        /**
         * Inserts elements into the DOM in the appropriate
         * order using a document fragment for minimal
         * DOM thrashing
         *
         * @private
         * @instance
         * @since   2.0.0
         * @param   {boolean}   isResetting
         * @param   {Operation} operation
         * @return  {void}
         */

        _printSort: function(isResetting, operation) {
            var self        = this,
                order       = isResetting ? operation.startOrder : operation.newOrder,
                targets     = h.children(self._dom.parent, self.selectors.target, self._dom.document),
                nextSibling = targets.length ? targets[targets.length - 1].nextElementSibling : null,
                frag        = self._dom.document.createDocumentFragment(),
                target      = null,
                whiteSpace  = null,
                el          = null,
                i           = -1;

            self._execAction('_printSort', 0, arguments);

            for (i = 0; el = targets[i]; i++) {
                // Empty the container

                whiteSpace = el.nextSibling;

                if (el.style.position === 'absolute') continue;

                if (whiteSpace && whiteSpace.nodeName === '#text') {
                    self._dom.parent.removeChild(whiteSpace);
                }

                self._dom.parent.removeChild(el);
            }

            for (i = 0; target = order[i]; i++) {
                // Add targets into a document fragment

                el = target.dom.el;

                frag.appendChild(el);
                frag.appendChild(self._dom.document.createTextNode(' '));
            }

            // Insert the document fragment into the container
            // before any other non-target elements

            nextSibling ?
                self._dom.parent.insertBefore(frag, nextSibling) :
                self._dom.parent.appendChild(frag);

            self._execAction('_printSort', 1, arguments);
        },

        /**
         * Parses user-defined sort commands (i.e. `default:asc`) into useable "rules".
         *
         * @private
         * @instance
         * @since   2.0.0
         * @param   {string}    sortString
         * @return  {String[]}
         */

        _parseSort: function(sortString) {
            var self        = this,
                rules       = typeof sortString === 'string' ? sortString.split(' ') : [sortString],
                newSort     = [],
                ruleObj     = null,
                rule        = [],
                i           = -1;

            for (i = 0; i < rules.length; i++) {
                rule = typeof sortString === 'string' ? rules[i].split(':') : ['custom', rules[i]];
                ruleObj = {
                    sortBy: h.camelCase(rule[0]),
                    order: rule[1] || 'asc'
                };

                newSort.push(ruleObj);

                if (ruleObj.sortBy === 'default' || ruleObj.sortBy === 'random') break;
            }

            return self._execFilter('_parseSort', newSort, arguments);
        },

        /**
         * Parses all effects out of the user-defined `animation.effects` string into
         * their respective properties and units.
         *
         * @private
         * @instance
         * @since   2.0.0
         * @return  {void}
         */

        _parseEffects: function() {
            var self            = this,
                transformName   = '',
                effectsIn       = self.animation.effectsIn || self.animation.effects,
                effectsOut      = self.animation.effectsOut || self.animation.effects;

            self._effectsIn      = new mixitup.StyleData();
            self._effectsOut     = new mixitup.StyleData();
            self._transformIn    = [];
            self._transformOut   = [];

            self._effectsIn.opacity = self._effectsOut.opacity = 1;

            self._parseEffect('fade', effectsIn, self._effectsIn, self._transformIn);
            self._parseEffect('fade', effectsOut, self._effectsOut, self._transformOut, true);

            for (transformName in self._transformDefaults) {
                self._parseEffect(transformName, effectsIn, self._effectsIn, self._transformIn);
                self._parseEffect(transformName, effectsOut, self._effectsOut, self._transformOut, true);
            }

            self._parseEffect('stagger', effectsIn, self._effectsIn, self._transformIn);
            self._parseEffect('stagger', effectsOut, self._effectsOut, self._transformOut, true);
        },

        /**
         * @private
         * @instance
         * @since   2.0.0
         * @param   {string}    effectName
         * @param   {string}    effectString
         * @param   {StyleData} effects
         * @param   {String[]}  transform
         * @param   {boolean}   [isOut]
         */

        _parseEffect: function(effectName, effectString, effects, transform, isOut) {
            var self        = this,
                re          = /\(([^)]+)\)/,
                propIndex   = -1,
                str         = '',
                match       = [],
                val         = '',
                units       = ['%', 'px', 'em', 'rem', 'vh', 'vw', 'deg'],
                unit        = '',
                i           = -1;

            if (!effectString || typeof effectString !== 'string') {
                throw new Error('[MixItUp] Invalid effects string');
            }

            if (effectString.indexOf(effectName) < 0) {
                // The effect is not present in the effects string

                return;
            }

            // The effect is present

            propIndex = effectString.indexOf(effectName + '(');

            // TODO: Can we improve the logic below for DRYness?

            if (propIndex > -1) {
                // The effect has a user defined value in parentheses

                // Extract from the first parenthesis to the end of string

                str = effectString.substring(propIndex);

                // Match any number of characters between "(" and ")"

                match = re.exec(str);

                val = match[1];

                switch (effectName) {
                    case 'fade':
                        effects.opacity = parseFloat(val);

                        break;
                    case 'stagger':
                        self._staggerDuration = parseFloat(val);

                        // NB: Currently stagger must be applied globally

                        break;
                    default:
                        // Transforms

                        for (i = 0; unit = units[i]; i++) {
                            if (val.indexOf(unit) > -1) {
                                effects[effectName].unit = unit;

                                break;
                            }
                        }

                        if (isOut && self.animation.reverseOut && effectName !== 'scale') {
                            effects[effectName].value = parseFloat(val) * -1;
                        } else {
                            effects[effectName].value = parseFloat(val);
                        }

                        transform.push(
                            effectName +
                            '(' +
                            effects[effectName].value +
                            effects[effectName].unit +
                            ')'
                        );
                }
            } else {
                // Else, use the default value for the effect

                switch (effectName) {
                    case 'fade':
                        effects.opacity = 0;

                        break;
                    case 'stagger':
                        self._staggerDuration = 100;

                        break;
                    default:
                        // Transforms

                        if (isOut && self.animation.reverseOut && effectName !== 'scale') {
                            effects[effectName].value = self._transformDefaults[effectName].value * -1;
                        } else {
                            effects[effectName].value = self._transformDefaults[effectName].value;
                        }

                        effects[effectName].unit = self._transformDefaults[effectName].unit;

                        transform.push(
                            effectName +
                            '(' +
                            effects[effectName].value +
                            effects[effectName].unit +
                            ')'
                        );
                }
            }
        },

        /**
         * @private
         * @instance
         * @since   2.0.0
         * @param   {Operation}     operation
         * @return  {State}
         */

        _buildState: function(operation) {
            var self        = this,
                state       = new mixitup.State(),
                target      = null,
                i           = -1;

            self._execAction('_buildState', 0);

            // Map target elements into state arrays.
            // the real target objects should never be exposed

            for (i = 0; target = self._targets[i]; i++) {
                if (!operation.toRemove.length || operation.toRemove.indexOf(target) < 0) {
                    state.targets.push(target.dom.el);
                }
            }

            for (i = 0; target = operation.matching[i]; i++) {
                state.matching.push(target.dom.el);
            }

            for (i = 0; target = operation.show[i]; i++) {
                state.show.push(target.dom.el);
            }

            for (i = 0; target = operation.hide[i]; i++) {
                if (!operation.toRemove.length || operation.toRemove.indexOf(target) < 0) {
                    state.hide.push(target.dom.el);
                }
            }

            state.activeFilter         = operation.newFilter;
            state.activeSort           = operation.newSortString;
            state.activeContainerClass = operation.newContainerClass;
            state.activeDisplay        = operation.newDisplay || self.layout.display;
            state.hasFailed            = !operation.matching.length && operation.newFilter !== '';
            state.totalTargets         = self._targets.length;
            state.totalShow            = operation.show.length;
            state.totalHide            = operation.hide.length;
            state.totalMatching        = operation.matching.length;
            state.triggerElement       = self._lastClicked;

            return self._execFilter('_buildState', state, arguments);
        },

        /**
         * @private
         * @instance
         * @since   2.0.0
         * @param   {boolean}   shouldAnimate
         * @param   {Operation} operation
         * @return  {void}
         */

        _goMix: function(shouldAnimate, operation) {
            var self            = this;

            self._execAction('_goMix', 0, arguments);

            // If the animation duration is set to 0ms,
            // Or the container is hidden
            // then abort animation

            if (
                !self.animation.duration ||
                !h.isVisible(self._dom.container)
            ) {
                shouldAnimate = false;
            }

            if (
                !operation.toShow.length &&
                !operation.toHide.length &&
                !operation.willSort &&
                !operation.willChangeLayout
            ) {
                // If nothing to show or hide, and not sorting or
                // changing layout

                shouldAnimate = false;
            }

            if (
                !operation.startState.show.length &&
                !operation.show.length
            ) {
                // If nothing currently shown, nothing to show

                shouldAnimate = false;
            }

            if (
                !self._userPromise ||
                self._userPromise.isResolved
            ) {
                // If no promise exists, then assign one

                self._userPromise = h.getPromise(self.libraries);
            }

            if (typeof self.callbacks.onMixStart === 'function') {
                self.callbacks.onMixStart.call(
                    self._dom.container,
                    operation.startState,
                    operation.newState,
                    self
                );
            }

            h.triggerCustom(self._dom.container, 'mixStart', {
                state: operation.startState,
                futureState: operation.newState,
                instance: self
            }, self._dom.document);

            if (shouldAnimate && mixitup.Mixer.prototype._has._transitions) {
                // If we should animate and the platform supports
                // transitions, go for it

                self._isMixing = true;

                if (window.pageYOffset !== operation.docState.scrollTop) {
                    window.scrollTo(operation.docState.scrollLeft, operation.docState.scrollTop);
                }

                self._dom.parent.style[mixitup.Mixer.prototype._perspectiveProp] =
                    self.animation.perspective;

                self._dom.parent.style[mixitup.Mixer.prototype._perspectiveOriginProp] =
                    self.animation.perspectiveOrigin;

                if (self.animation.animateResizeContainer) {
                    self._dom.parent.style.height = operation.startHeight + 'px';
                    self._dom.parent.style.width = operation.startWidth + 'px';
                }

                requestAnimationFrame(function() {
                    self._moveTargets(operation);
                });
            } else {
                // Abort

                self._cleanUp(operation);
            }

            self._execAction('_goMix', 1, arguments);

            return self._userPromise.promise;
        },

        /**
         * @private
         * @instance
         * @since   2.0.0
         * @param   {Operation}     operation
         * @return  {void}
         */

        _getStartMixData: function(operation) {
            var self        = this,
                parentStyle = window.getComputedStyle(self._dom.parent),
                parentRect  = self._dom.parent.getBoundingClientRect(),
                target      = null,
                data        = {},
                i           = -1,
                boxSizing   = parentStyle.boxSizing || parentStyle[self._vendor + 'BoxSizing'];

            self._incPadding = (boxSizing === 'border-box');

            self._execAction('_getStartMixData', 0);

            for (i = 0; target = operation.show[i]; i++) {
                data = target.getPosData();

                operation.showPosData[i] = {
                    startPosData: data
                };
            }

            for (i = 0; target = operation.toHide[i]; i++) {
                data = target.getPosData();

                operation.toHidePosData[i] = {
                    startPosData: data
                };
            }

            operation.startHeight = self._incPadding ?
                parentRect.height :
                parentRect.height -
                    parseFloat(parentStyle.paddingTop) -
                    parseFloat(parentStyle.paddingBottom) -
                    parseFloat(parentStyle.borderTop) -
                    parseFloat(parentStyle.borderBottom);

            operation.startWidth = self._incPadding ?
                parentRect.width :
                parentRect.width -
                    parseFloat(parentStyle.paddingLeft) -
                    parseFloat(parentStyle.paddingRight) -
                    parseFloat(parentStyle.borderLeft) -
                    parseFloat(parentStyle.borderRight);

            self._execAction('_getStartMixData', 1);
        },

        /**
         * @private
         * @instance
         * @since   2.0.0
         * @param   {Operation}     operation
         * @return  {void}
         */

        _setInter: function(operation) {
            var self    = this,
                target  = null,
                i       = -1;

            self._execAction('_setInter', 0);

            for (i = 0; target = operation.toShow[i]; i++) {
                target.show(operation.willChangeLayout ? operation.newDisplay : self.layout.display);
            }

            if (operation.willChangeLayout) {
                h.removeClass(self._dom.container, operation.startContainerClass);
                h.addClass(self._dom.container, operation.newContainerClass);
            }

            self._execAction('_setInter', 1);
        },

        /**
         * @private
         * @instance
         * @since   2.0.0
         * @param   {Operation}     operation
         * @return  {void}
         */

        _getInterMixData: function(operation) {
            var self    = this,
                target  = null,
                i       = -1;

            self._execAction('_getInterMixData', 0);

            for (i = 0; target = operation.show[i]; i++) {
                operation.showPosData[i].interPosData = target.getPosData();
            }

            for (i = 0; target = operation.toHide[i]; i++) {
                operation.toHidePosData[i].interPosData = target.getPosData();
            }

            self._execAction('_getInterMixData', 1);
        },

        /**
         * @private
         * @instance
         * @since   2.0.0
         * @param   {Operation}     operation
         * @return  {void}
         */

        _setFinal: function(operation) {
            var self    = this,
                target  = null,
                i       = -1;

            self._execAction('_setFinal', 0);

            operation.willSort && self._printSort(false, operation);

            for (i = 0; target = operation.toHide[i]; i++) {
                target.hide();
            }

            self._execAction('_setFinal', 1);
        },

        /**
         * @private
         * @instance
         * @since   2.0.0
         * @param   {Operation}     operation
         * @return  {void}
         */

        _getFinalMixData: function(operation) {
            var self        = this,
                parentStyle = null,
                parentRect  = self._dom.parent.getBoundingClientRect(),
                target      = null,
                i           = -1;

            if (!self._incPadding) {
                parentStyle = window.getComputedStyle(self._dom.parent);
            }

            self._execAction('_getFinalMixData', 0, arguments);

            for (i = 0; target = operation.show[i]; i++) {
                operation.showPosData[i].finalPosData = target.getPosData();
            }

            for (i = 0; target = operation.toHide[i]; i++) {
                operation.toHidePosData[i].finalPosData = target.getPosData();
            }

            operation.newHeight = self._incPadding ?
                parentRect.height :
                parentRect.height -
                    parseFloat(parentStyle.paddingTop) -
                    parseFloat(parentStyle.paddingBottom) -
                    parseFloat(parentStyle.borderTop) -
                    parseFloat(parentStyle.borderBottom);

            operation.newWidth = self._incPadding ?
                parentRect.width :
                parentRect.width -
                    parseFloat(parentStyle.paddingLeft) -
                    parseFloat(parentStyle.paddingRight) -
                    parseFloat(parentStyle.borderLeft) -
                    parseFloat(parentStyle.borderRight);

            if (operation.willSort) {
                self._printSort(true, operation);
            }

            for (i = 0; target = operation.toShow[i]; i++) {
                target.hide();
            }

            for (i = 0; target = operation.toHide[i]; i++) {
                target.show(self.layout.display);
            }

            if (operation.willChangeLayout && self.animation.animateChangeLayout) {
                h.removeClass(self._dom.container, operation.newContainerClass);
                h.addClass(self._dom.container, self.layout.containerClass);
            }

            self._execAction('_getFinalMixData', 1, arguments);
        },

        /**
         * @private
         * @instance
         * @since    3.0.0
         * @param    {Operation}     operation
         */

        _getTweenData: function(operation) {
            var self        = this,
                target      = null,
                posData     = null,
                effectNames = Object.getOwnPropertyNames(self._effectsIn),
                effectName  = '',
                effect      = null,
                i           = -1,
                j           = -1;

            for (i = 0; target = operation.show[i]; i++) {
                posData             = operation.showPosData[i];
                posData.posIn       = new mixitup.StyleData();
                posData.posOut      = new mixitup.StyleData();
                posData.tweenData   = new mixitup.StyleData();

                // Process x and y

                posData.posIn.x     = target.isShown ? posData.startPosData.x - posData.interPosData.x : 0;
                posData.posIn.y     = target.isShown ? posData.startPosData.y - posData.interPosData.y : 0;
                posData.posOut.x    = posData.finalPosData.x - posData.interPosData.x;
                posData.posOut.y    = posData.finalPosData.y - posData.interPosData.y;

                // Process display

                posData.posIn.display   = target.isShown ? self.layout.display : 'none';
                posData.posOut.display  = self.layout.display;

                // Process opacity

                posData.posIn.opacity       = target.isShown ? 1 : self._effectsIn.opacity;
                posData.posOut.opacity      = 1;
                posData.tweenData.opacity   = posData.posOut.opacity - posData.posIn.opacity;

                // Adjust x and y if not nudging

                if (!target.isShown && !self.animation.nudgeOut) {
                    posData.posIn.x = posData.posOut.x;
                    posData.posIn.y = posData.posOut.y;
                }

                posData.tweenData.x = posData.posOut.x - posData.posIn.x;
                posData.tweenData.y = posData.posOut.y - posData.posIn.y;

                // Process width, height, and margins

                if (self.animation.animateResizeTargets) {
                    posData.posIn.width     = posData.startPosData.width;
                    posData.posIn.height    = posData.startPosData.height;

                    if (posData.startPosData.width - posData.finalPosData.width) {
                        posData.posIn.marginRight =
                            -(posData.startPosData.width - posData.interPosData.width) +
                            (posData.startPosData.marginRight * 1);
                    } else {
                        posData.posIn.marginRight = posData.startPosData.marginRight;
                    }

                    if (posData.startPosData.height - posData.finalPosData.height) {
                        posData.posIn.marginBottom =
                            -(posData.startPosData.height - posData.interPosData.height) +
                            (posData.startPosData.marginBottom * 1);
                    } else {
                        posData.posIn.marginBottom = posData.startPosData.marginBottom;
                    }

                    posData.posOut.width    = posData.finalPosData.width;
                    posData.posOut.height   = posData.finalPosData.height;

                    posData.posOut.marginRight =
                        -(posData.finalPosData.width - posData.interPosData.width) +
                        (posData.finalPosData.marginRight * 1);

                    posData.posOut.marginBottom =
                        -(posData.finalPosData.height - posData.interPosData.height) +
                        (posData.finalPosData.marginBottom * 1);

                    posData.tweenData.width         = posData.posOut.width - posData.posIn.width;
                    posData.tweenData.height        = posData.posOut.height - posData.posIn.height;
                    posData.tweenData.marginRight   = posData.posOut.marginRight - posData.posIn.marginRight;
                    posData.tweenData.marginBottom  = posData.posOut.marginBottom - posData.posIn.marginBottom;
                }

                // Process transforms

                for (j = 0; effectName = effectNames[j]; j++) {
                    effect = self._effectsIn[effectName];

                    if (!(effect instanceof mixitup.TransformData) || !effect.value) continue;

                    posData.posIn[effectName].value     = effect.value;
                    posData.posOut[effectName].value    = 0;

                    posData.tweenData[effectName].value =
                        posData.posOut[effectName].value - posData.posIn[effectName].value;

                    posData.posIn[effectName].unit =
                        posData.posOut[effectName].unit =
                        posData.tweenData[effectName].unit =
                        effect.unit;
                }
            }

            for (i = 0; target = operation.toHide[i]; i++) {
                posData             = operation.toHidePosData[i];
                posData.posIn       = new mixitup.StyleData();
                posData.posOut      = new mixitup.StyleData();
                posData.tweenData   = new mixitup.StyleData();

                // Process x and y

                posData.posIn.x     = target.isShown ? posData.startPosData.x - posData.interPosData.x : 0;
                posData.posIn.y     = target.isShown ? posData.startPosData.y - posData.interPosData.y : 0;
                posData.posOut.x    = self.animation.nudgeOut ? 0 : posData.posIn.x;
                posData.posOut.y    = self.animation.nudgeOut ? 0 : posData.posIn.y;
                posData.tweenData.x = posData.posOut.x - posData.posIn.x;
                posData.tweenData.y = posData.posOut.y - posData.posIn.y;

                // Process display

                posData.posIn.display = self.layout.display;
                posData.posOut.display = 'none';

                // Process opacity

                posData.posIn.opacity       = 1;
                posData.posOut.opacity      = self._effectsOut.opacity;
                posData.tweenData.opacity   = posData.posOut.opacity - posData.posIn.opacity;

                // Process transforms

                for (j = 0; effectName = effectNames[j]; j++) {
                    effect = self._effectsOut[effectName];

                    if (!(effect instanceof mixitup.TransformData) || !effect.value) continue;

                    posData.posIn[effectName].value     = 0;
                    posData.posOut[effectName].value    = effect.value;

                    posData.tweenData[effectName].value =
                        posData.posOut[effectName].value - posData.posIn[effectName].value;

                    posData.posIn[effectName].unit =
                        posData.posOut[effectName].unit =
                        posData.tweenData[effectName].unit =
                        effect.unit;
                }
            }
        },

        /**
         * @private
         * @instance
         * @since   3.0.0
         * @param   {Operation}     operation
         * @return  {void}
         */

        _moveTargets: function(operation) {
            var self            = this,
                target          = null,
                posData         = null,
                hideOrShow      = '',
                willTransition  = false,
                staggerIndex    = -1,
                i               = -1,
                checkProgress   = h.bind(self, self._checkProgress);

            // TODO: this is an extra loop in addition to the calcs
            // done in getOperation, can we get around somehow?

            for (i = 0; target = operation.show[i]; i++) {
                posData = operation.showPosData[i];

                hideOrShow = target.isShown ? false : 'show'; // TODO: can we not mix types here?

                willTransition = self._willTransition(
                    hideOrShow,
                    operation.hasEffect,
                    posData.posIn,
                    posData.posOut
                );

                if (willTransition) {
                    // Prevent non-transitioning targets from incrementing the staggerIndex

                    staggerIndex++;
                }

                target.show(operation.willChangeLayout ? operation.newDisplay : self.layout.display);

                target.move({
                    posIn: posData.posIn,
                    posOut: posData.posOut,
                    hideOrShow: hideOrShow,
                    staggerIndex: staggerIndex,
                    operation: operation,
                    callback: willTransition ? checkProgress : null
                });
            }

            for (i = 0; target = operation.toHide[i]; i++) {
                posData = operation.toHidePosData[i];

                hideOrShow = 'hide';

                willTransition = self._willTransition(hideOrShow, posData.posIn, posData.posOut);

                target.move({
                    posIn: posData.posIn,
                    posOut: posData.posOut,
                    hideOrShow: hideOrShow,
                    staggerIndex: i,
                    operation: operation,
                    callback: willTransition ? checkProgress : null
                });
            }

            self._dom.parent.style.perspective = self.animation.perspectiveDistance + 'px';
            self._dom.parent.style.perspectiveOrigin = self.animation.perspectiveOrigin;

            if (self.animation.animateResizeContainer) {
                self._dom.parent.style[mixitup.Mixer.prototype._transitionProp] =
                    'height ' + self.animation.duration + 'ms ease, ' +
                    'width ' + self.animation.duration + 'ms ease, ';

                requestAnimationFrame(function() {
                    self._dom.parent.style.height = operation.newHeight + 'px';
                    self._dom.parent.style.width = operation.newWidth + 'px';
                });
            }

            if (operation.willChangeLayout) {
                h.removeClass(self._dom.container, self.layout.containerClass);
                h.addClass(self._dom.container, operation.newContainerClass);
            }
        },

        /**
         * @private
         * @instance
         * @return  {boolean}
         */

        hasEffect: function() {
            var self        = this,
                effectables = [
                    'scale',
                    'translateX', 'translateY', 'translateZ',
                    'rotateX', 'rotateY', 'rotateZ'
                ],
                effectName  = '',
                effect      = null,
                value       = -1,
                i           = -1;

            if (self._effectsIn.opacity !== 1) {
                return true;
            }

            for (i = 0; effectName = effectables[i]; i++) {
                effect  = self._effectsIn[effectName];
                value   = (typeof effect && effect.value !== 'undefined') ?
                    effect.value : effect;

                if (value !== 0) {
                    return true;
                }
            }

            return false;
        },

        /**
         * Determines if a target element will transition in
         * some fasion and therefore requires binding of
         * transitionEnd
         *
         * @private
         * @instance
         * @since   3.0.0
         * @param   {string}        hideOrShow
         * @param   {boolean}       hasEffect
         * @param   {StyleData}     posIn
         * @param   {StyleData}     posOut
         * @return  {boolean}
         */

        _willTransition: function(hideOrShow, hasEffect, posIn, posOut) {
            var self = this;

            if (!h.isVisible(self._dom.container)) {
                // If the container is not visible, the transitionEnd
                // event will not occur and MixItUp will hang

                return false;
            }

            // Check if opacity and/or translate will change

            if (
                (hideOrShow && hasEffect) ||
                posIn.x !== posOut.x ||
                posIn.y !== posOut.y
            ) {
                return true;
            } else if (self.animation.animateResizeTargets) {
                // Check if width, height or margins will change

                return (
                    posIn.width !== posOut.width ||
                    posIn.height !== posOut.height ||
                    posIn.marginRight !== posOut.marginRight ||
                    posIn.marginTop !== posOut.marginTop
                );
            } else {
                return false;
            }
        },

        /**
         * @private
         * @instance
         * @since   2.0.0
         * @param   {Operation}     operation
         * @return  {void}
         */

        _checkProgress: function(operation) {
            var self = this;

            self._targetsDone++;

            if (self._targetsBound === self._targetsDone) {
                self._cleanUp(operation);
            }
        },

        /**
         * @private
         * @instance
         * @since   2.0.0
         * @param   {Operation}     operation
         * @return  {void}
         */

        _cleanUp: function(operation) {
            var self        = this,
                target      = null,
                nextInQueue = null,
                i           = -1;

            self._isMixing = false;

            self._execAction('_cleanUp', 0);

            self._targetsMoved          =
                self._targetsImmovable  =
                self._targetsBound      =
                self._targetsDone       = 0;

            for (i = 0; target = operation.show[i]; i++) {
                target.cleanUp();

                target.show(operation.willChangeLayout ? operation.newDisplay : self.layout.display);
                target.isShown = true;
            }

            for (i = 0; target = operation.toHide[i]; i++) {
                target.cleanUp();

                target.hide();
                target.isShown = false;
            }

            if (operation.willSort) {
                self._printSort(false, operation);

                self._targets = operation.newOrder;
            }

            if (self.animation.animateResizeContainer) {
                self._dom.parent.style[mixitup.Mixer.prototype._transitionProp] = '';
                self._dom.parent.style.height = '';
                self._dom.parent.style.width = '';
            }

            self._dom.parent.style[mixitup.Mixer.prototype._perspectiveProp] = '';
            self._dom.parent.style[mixitup.Mixer.prototype._perspectiveOriginProp] = '';

            if (operation.willChangeLayout) {
                h.removeClass(self._dom.container, operation.startContainerClass);
                h.addClass(self._dom.container, operation.newContainerClass);
            }

            if (operation.toRemove.length) {
                for (i = 0; target = self._targets[i]; i++) {
                    if (operation.toRemove.indexOf(target) > -1) {

                        h.deleteElement(target.dom.el);

                        self._targets.splice(i, 1);

                        i--;
                    }
                }

                // Since targets have been removed, the original order must be updated

                self._origOrder = self._targets;
            }

            self._state = operation.newState;
            self._lastOperation = operation;

            self._dom.targets = self._state.targets;

            if (typeof self._userCallback === 'function') {
                self._userCallback.call(self._dom.el, self._state, self);
            }

            if (typeof self.callbacks.onMixEnd === 'function') {
                self.callbacks.onMixEnd.call(self._dom.el, self._state, self);
            }

            h.triggerCustom(self._dom.container, 'mixEnd', {
                state: self._state,
                instance: self
            }, self._dom.document);

            self._userPromise.resolve(self._state);

            self._userPromise.isResolved = true;

            if (self._queue.length) {
                self._execAction('_queue', 0);

                nextInQueue = self._queue.shift();

                self._userPromise = nextInQueue[3];

                self.multiMix.apply(self, nextInQueue);
            }

            self._execAction('_cleanUp', 1);
        },

        /**
         * @private
         * @instance
         * @since   2.0.0
         * @param   {Array<*>}  args
         * @return  {object}
         */

        _parseMultiMixArgs: function(args) {
            var self        = this,
                instruction = new mixitup.UserInstruction(),
                arg         = null,
                i           = -1;

            instruction.animate = self.animation.enable;

            for (i = 0; i < args.length; i++) {
                arg = args[i];

                if (arg !== null) {
                    if (typeof arg === 'object' || typeof arg === 'string') {
                        instruction.command = arg;
                    } else if (typeof arg === 'boolean') {
                        instruction.animate = arg;
                    } else if (typeof arg === 'function') {
                        instruction.callback = arg;
                    }
                }
            }

            return self._execFilter('_parseMultiMixArgs', instruction, arguments);
        },

        /**
         * @private
         * @instance
         * @since   2.0.0
         * @param   {Array<*>}  args
         * @return  {object}
         */

        _parseInsertArgs: function(args) {
            var self        = this,
                instruction = new mixitup.UserInstruction(),
                arg         = null,
                i           = -1;

            instruction.animate = self.animation.enable;

            instruction.command = {
                index: 0, // Index to insert at
                targets: [], // Element(s) to insert
                position: 'before', // Position relative to a sibling if passed
                sibling: null // A sibling element as a reference
            };

            for (i = 0; i < args.length; i++) {
                arg = args[i];

                if (typeof arg === 'number') {
                    // Insert index

                    instruction.command.index = arg;
                } else if (typeof arg === 'string' && ['before', 'after'].indexOf(arg) > -1) {
                    // 'before'/'after'

                    instruction.command.position = arg;
                } else if (typeof arg === 'string') {
                    // Markup

                    instruction.command.targets =
                        Array.prototype.slice.call(h.createElement(arg).children);
                } else if (typeof arg === 'object' && h.isElement(arg, self._dom.document)) {
                    // Single element

                    !instruction.command.targets.length ?
                        (instruction.command.targets = [arg]) :
                        (instruction.command.sibling = arg);
                } else if (typeof arg === 'object' && arg !== null && arg.length) {
                    // Multiple elements in array or jQuery collection

                    !instruction.command.targets.length ?
                        (instruction.command.targets = arg) :
                        instruction.command.sibling = arg[0];
                } else if (
                    typeof arg === 'object' &&
                    arg !== null &&
                    arg.childNodes &&
                    arg.childNodes.length
                ) {
                    // Document fragment

                    !instruction.command.targets.length ?
                        instruction.command.targets = Array.prototype.slice.call(arg.childNodes) :
                        instruction.command.sibling = arg.childNodes[0];
                } else if (typeof arg === 'boolean') {
                    instruction.animate = arg;
                } else if (typeof arg === 'function') {
                    instruction.callback = arg;
                }
            }

            if (!instruction.command.targets.length && h.canReportErrors(self)) {
                throw new Error('[MixItUp] No elements were passed to "insert"');
            }

            return self._execFilter('_parseInsertArgs', instruction, arguments);
        },

        /**
         * @private
         * @instance
         * @since   3.0.0
         * @param   {Array<*>}  args
         * @return  {object}
         */

        _parseRemoveArgs: function(args) {
            var self        = this,
                instruction = new mixitup.UserInstruction(),
                collection  = [],
                target      = null,
                arg         = null,
                i           = -1;

            instruction.animate = self.animation.enable;

            instruction.command = {
                targets: []
            };

            for (i = 0; i < args.length; i++) {
                arg = args[i];

                switch (typeof arg) {
                    case 'number':
                        if (self._targets[arg]) {
                            instruction.command.targets[0] = self._targets[arg];
                        }

                        break;
                    case 'string':
                        collection = Array.prototype.slice.call(self._dom.parent.querySelectorAll(arg));

                        break;
                    case 'object':
                        if (arg && arg.length) {
                            collection = arg;
                        } else if (h.isElement(arg, self._dom.document)) {
                            collection = [arg];
                        }

                        break;
                    case 'boolean':
                        instruction.animate = arg;

                        break;
                    case 'function':
                        instruction.callback = arg;

                        break;
                }
            }

            if (collection.length) {
                for (i = 0; target = self._targets[i]; i++) {
                    if (collection.indexOf(target.dom.el) > -1) {
                        instruction.command.targets.push(target);
                    }
                }
            }

            return self._execFilter('_parseRemoveArgs', instruction, arguments);
        },

        /**
         * @private
         * @instance
         * @since       3.0.0
         * @param       {Array<*>}                  args
         * @param       {mixitup.UserInstruction}   instruction
         * @return      {Promise.<mixitup.State>}
         */

        _deferMix: function(args, instruction) {
            var self    = this,
                promise = null;

            promise = h.getPromise(self.libraries);

            if (self.animation.queue && self._queue.length < self.animation.queueLimit) {
                args[3] = promise;

                self._queue.push(args);

                (self.controls.enable && !self._isClicking) && self._updateControls(instruction.command);

                self._execAction('multiMixQueue', 1, args);
            } else {
                if (h.canReportErrors(self)) {
                    console.warn(
                        '[MixItUp] An operation was requested but the MixItUp ' +
                        'instance was busy. The operation was rejected because ' +
                        'queueing is disabled or the queue is full.'
                    );
                }

                promise.resolve(self._state);
                promise.isResolved = true;

                if (typeof self.callbacks.onMixBusy === 'function') {
                    self.callbacks.onMixBusy.call(self._dom.container, self._state, self);
                }

                h.triggerCustom(self._dom.container, 'mixBusy', {
                    state: self._state,
                    instance: self
                });

                self._execAction('multiMixBusy', 1, args);
            }

            return promise.promise;
        },

        /**
         * @public
         * @instance
         * @since       3.0.0
         * @return      {Promise.<mixitup.State>}
         */

        init: function() {
            var self = this;

            return self.multiMix({
                filter: self._state.activeFilter
            });
        },

        /**
         * @public
         * @instance
         * @since       3.0.0
         * @return      {Promise.<mixitup.State>}
         */

        show: function() {
            var self = this;

            return self.filter('all');
        },

        /**
         * @public
         * @instance
         * @since       3.0.0
         * @return      {Promise.<mixitup.State>}
         */

        hide: function() {
            var self = this;

            return self.filter('none');
        },

        /**
         * @public
         * @instance
         * @since   2.0.0
         * @return  {boolean}
         */

        isMixing: function() {
            var self = this;

            return self._isMixing;
        },

        /**
         * @public
         * @instance
         * @since       2.0.0
         * @return      {Promise.<mixitup.State>}
         */

        filter: function() {
            var self = this,
                args = self._parseMultiMixArgs(arguments);

            self._isClicking && (self._toggleString = '');

            return self.multiMix({
                filter: args.command
            }, args.animate, args.callback);
        },

        /**
         * @public
         * @instance
         * @since       2.0.0
         * @return      {Promise.<mixitup.State>}
         */

        sort: function() {
            var self = this,
                args = self._parseMultiMixArgs(arguments);

            return self.multiMix({
                sort: args.command
            }, args.animate, args.callback);
        },

        /**
         * @public
         * @instance
         * @since       2.0.0
         * @return      {Promise.<mixitup.State>}
         */

        changeLayout: function() {
            // TODO: parse arguments, and map to multiMix
        },

        /**
         * @public
         * @instance
         * @since   3.0.0
         * @param   {Command}           command
         * @return  {Operation|null}
         */

        getOperation: function(command) {
            var self = this,
                sortCommand         = command.sort,
                filterCommand       = command.filter,
                changeLayoutCommand = command.changeLayout,
                removeCommand       = command.remove,
                insertCommand       = command.insert,
                operation           = new mixitup.Operation();

            operation.command       = command;
            operation.startState    = self._state;
            operation.id            = h.randomHexKey();

            self._execAction('getOperation', 0, operation);

            // TODO: passing the operation rather than arguments
            // to the action is non-standard here but essential as
            // we require a reference to original. Perhaps a "pre"
            // filter is the best alternative

            if (self._isMixing) {
                if (h.canReportErrors(self)) {
                    console.warn(
                        '[MixItUp] Operations cannot be requested while MixItUp is busy.'
                    );
                }

                return null;
            }

            if (insertCommand) {
                if (typeof insertCommand.targets === 'undefined') {
                    insertCommand = self._parseInsertArgs([insertCommand]).command;
                }

                self._insert(insertCommand, operation);
            }

            if (removeCommand) {
                if (typeof removeCommand.targets === 'undefined') {
                    removeCommand = self._parseRemoveArgs([removeCommand]).command;
                }

                operation.toRemove = removeCommand.targets;
            }

            if (sortCommand) {
                operation.startSortString   = operation.startState.activeSort;
                operation.newSort           = self._parseSort(sortCommand);
                operation.newSortString     = sortCommand;

                if (sortCommand !== operation.startState.activeSortString || sortCommand === 'random') {
                    operation.willSort = true;

                    self._sort(operation);
                }
            } else {
                operation.startSortString = operation.newSortString = operation.startState.activeSort;
                operation.startOrder = operation.newOrder = self._targets;
            }

            operation.startFilter = operation.startState.activeFilter;

            if (filterCommand) {
                operation.newFilter = filterCommand === 'all' ?
                    self.selectors.target :
                    filterCommand === 'none' ?
                        '' :
                        filterCommand;
            } else {
                operation.newFilter = operation.startState.activeFilter;
            }

            self._filter(operation);

            // TODO: we need a definitve object for filter operations,
            // which accomodates selectors, elements, hide vs show etc.

            if (typeof changeLayoutCommand !== 'undefined') {
                operation.startDisplay        = operation.startState.activeDisplay;
                operation.startContainerClass = operation.startState.activeContainerClass;
                operation.newDisplay          = changeLayoutCommand.display || operation.startDisplay;

                operation.newContainerClass   =
                    changeLayoutCommand.containerClass || operation.startContainerClass;

                if (
                    operation.newContainerClass !== operation.startContainerClass ||
                    operation.newDisplay !== operation.startDisplay
                ) {
                    operation.willChangeLayout = true;
                }
            }

            // Populate the operation's position data

            self._getStartMixData(operation);
            self._setInter(operation);

            operation.docState = h.getDocumentState();

            self._getInterMixData(operation);
            self._setFinal(operation);
            self._getFinalMixData(operation);

            self._parseEffects();

            operation.hasEffect = self.hasEffect();

            self._getTweenData(operation);

            operation.newState = self._buildState(operation);

            return self._execFilter('getOperation', operation, arguments);
        },

        /**
         * @public
         * @instance
         * @since       2.0.0
         * @return      {Promise.<mixitup.State>}
         */

        multiMix: function() {
            var self        = this,
                operation   = null,
                animate     = false,
                instruction = self._parseMultiMixArgs(arguments);

            self._execAction('multiMix', 0, arguments);

            if (!self._isClicking) {
                self._lastClicked = null;
            }

            if (!self._isMixing) {
                operation = self.getOperation(instruction.command);

                if (self.controls.enable && !self._isClicking) {
                    // Update controls for API calls

                    self._dom.filterToggleButtons.length && self._buildToggleArray();

                    // TODO: what about "live" toggles?

                    self._updateControls(operation.command);
                }

                (self._queue.length < 2) && (self._isClicking = false);

                self._userCallback = null;

                if (instruction.callback) self._userCallback = instruction.callback;

                self._execFilter('multiMix', operation, self);
                self._execAction('multiMix', 1, arguments);

                // Always allow the instruction to override the instance setting

                animate = (instruction.animate ^ self.animation.enable) ?
                    instruction.animate :
                    self.animation.enable;

                return self._goMix(animate, operation);
            } else {
                return self._deferMix(arguments, instruction);
            }
        },

        /**
         * @public
         * @instance
         * @since   3.0.0
         * @param   {Operation}     operation
         * @param   {Float}         multiplier
         * @return  {void}
         */

        tween: function(operation, multiplier) {
            var self            = this,
                target          = null,
                posData         = null,
                toHideIndex     = -1,
                i               = -1;

            multiplier = Math.min(multiplier, 1);
            multiplier = Math.max(multiplier, 0);

            for (i = 0; target = operation.show[i]; i++) {
                posData = operation.showPosData[i];

                target.applyTween(posData, multiplier);
            }

            for (i = 0; target = operation.hide[i]; i++) {
                if (target.dom.el.style.display) {
                    target.hide();
                }

                if ((toHideIndex = operation.toHide.indexOf(target)) > -1) {
                    posData = operation.toHidePosData[toHideIndex];

                    if (!target.dom.el.style.display) {
                        target.show(self.layout.display);
                    }

                    target.applyTween(posData, multiplier);
                }
            }
        },

        /**
         * @public
         * @instance
         * @since       2.0.0
         * @return      {Promise.<mixitup.State>}
         */

        insert: function() {
            var self = this,
                args = self._parseInsertArgs(arguments);

            return self.multiMix({
                insert: args.command
            }, args.animate, args.callback);
        },

        /**
         * @public
         * @instance
         * @since       3.0.0
         * @return      {Promise.<mixitup.State>}
         */

        insertBefore: function() {
            var self = this,
                args = self._parseInsertArgs(arguments);

            return self.insert(args.command.targets, 'before', args.command.sibling, args.animate, args.callback);
        },

        /**
         * @public
         * @instance
         * @since       3.0.0
         * @return      {Promise.<mixitup.State>}
         */

        insertAfter: function() {
            var self = this,
                args = self._parseInsertArgs(arguments);

            return self.insert(args.command.targets, 'after', args.command.sibling, args.animate, args.callback);
        },

        /**
         * @public
         * @instance
         * @since       2.0.0
         * @return      {Promise.<mixitup.State>}
         */

        prepend: function() {
            var self = this,
                args = self._parseInsertArgs(arguments);

            return self.insert(0, args.command.targets, args.animate, args.callback);
        },

        /**
         * @public
         * @instance
         * @since       2.0.0
         * @return      {Promise.<mixitup.State>}
         */

        append: function() {
            var self = this,
                args = self._parseInsertArgs(arguments);

            return self.insert(self._state.totalTargets, args.command.targets, args.animate, args.callback);
        },

        /**
         * @public
         * @instance
         * @since       3.0.0
         * @return      {Promise.<mixitup.State>}
         */

        remove: function() {
            var self = this,
                args = self._parseRemoveArgs(arguments);

            return self.multiMix({
                remove: args.command
            }, args.animate, args.callback);
        },

        /**
         * @public
         * @instance
         * @since       2.0.0
         * @param       {string}    stringKey
         * @return      {*}
         */

        getOption: function(stringKey) {
            // TODO: requires stringKey parser helper
        },

        /**
         * @public
         * @instance
         * @since       2.0.0
         * @param       {object}    config
         */

        setOptions: function(config) {
            var self = this;

            self._execAction('setOptions', 0, arguments);

            // TODO (requires deep extend helper)

            self._execAction('setOptions', 1, arguments);
        },

        /**
         * @public
         * @instance
         * @since       2.0.0
         * @return      {State}
         */

        getState: function() {
            var self = this;

            // TODO: would be safer to build a new state on
            // each request so that users cannot override the state

            return self._execFilter('getState', self._state, self);
        },

        /**
         * @public
         * @instance
         * @since 2.1.2
         */

        forceRefresh: function() {
            var self = this;

            self._indexTargets();
        },

        /**
         * @public
         * @instance
         * @since   2.0.0
         * @param   {boolean}   hideAll
         * @return  {void}
         */

        destroy: function(hideAll) {
            var self    = this,
                target  = null,
                button  = null,
                i       = 0;

            self._execAction('destroy', 0, arguments);

            self._unbindEvents();

            for (i = 0; target = self._targets[i]; i++) {
                hideAll && target.hide();

                target.unbindEvents();
            }

            for (i = 0; button = self._dom.allButtons[i]; i++) {
                h.removeClass(button, self.controls.activeClass);
            }

            if (self._dom.container.id.indexOf('MixItUp') > -1) {
                // TODO: use a regex

                self._dom.container.removeAttribute('id');
            }

            delete mixitup.Mixer.prototype._instances[self._id];

            self._execAction('destroy', 1, arguments);
        }
    });

    /**
     * @constructor
     * @namespace
     * @memberof    mixitup
     * @private
     * @since       3.0.0
     */

    mixitup.Target = function() {
        var self = this;

        self._execAction('constructor', 0, arguments);

        h.extend(self, {
            sortString: '',
            mixer: null,
            callback: null,
            isShown: false,
            isBound: false,
            isExcluded: false,
            handler: null,
            operation: null,

            dom: {
                el: null
            }
        });

        self._execAction('constructor', 1, arguments);

        h.seal(this);
        h.seal(this.dom);
    };

    mixitup.Target.prototype = new mixitup.BasePrototype();

    h.extend(mixitup.Target.prototype, {
        constructor: mixitup.Target,

        /**
         * Initialises a newly instantiated Target.
         *
         * @private
         * @instance
         * @since   3.0.0
         * @param   {Element}   el
         * @param   {object}    mixer
         * @return  {void}
         */

        init: function(el, mixer) {
            var self = this;

            self._execAction('init', 0, arguments);

            self.mixer = mixer;

            self.cacheDom(el);

            self.bindEvents();

            !!self.dom.el.style.display && (self.isShown = true);

            self._execAction('init', 1, arguments);
        },

        /**
         * Caches references of DOM elements neccessary for the target's functionality.
         *
         * @private
         * @instance
         * @since   3.0.0
         * @param   {Element} el
         * @return  {void}
         */

        cacheDom: function(el) {
            var self = this;

            self._execAction('cacheDom', 0, arguments);

            self.dom.el = el;

            self._execAction('cacheDom', 1, arguments);
        },

        /**
         * @private
         * @instance
         * @since   3.0.0
         * @param   {string}    attributeName
         * @return  {void}
         */

        getSortString: function(attributeName) {
            var self    = this,
                value   = self.dom.el.getAttribute('data-' + attributeName) || '';

            self._execAction('getSortString', 0, arguments);

            value = isNaN(value * 1) ?
                value.toLowerCase() :
                value * 1;

            self.sortString = value;

            self._execAction('getSortString', 1, arguments);
        },

        /**
         * @private
         * @instance
         * @since   3.0.0
         * @param   {string}   display
         * @return  {void}
         */

        show: function(display) {
            var self = this;

            self._execAction('show', 0, arguments);

            if (!self.dom.el.style.display || self.dom.el.style.display !== display) {
                self.dom.el.style.display = display;
            }

            self._execAction('show', 1, arguments);
        },

        /**
         * @private
         * @instance
         * @since   3.0.0
         * @return  {void}
         */

        hide: function() {
            var self = this;

            self._execAction('hide', 0, arguments);

            self.dom.el.style.display = '';

            self._execAction('hide', 1, arguments);
        },

        /**
         * @private
         * @instance
         * @since   3.0.0
         * @param   {object}    options
         * @return  {void}
         */

        move: function(options) {
            var self = this;

            self._execAction('move', 0, arguments);

            if (!self.isExcluded) {
                self.mixer._targetsMoved++;
            }

            self.applyStylesIn({
                posIn: options.posIn,
                hideOrShow: options.hideOrShow
            });

            requestAnimationFrame(function() {
                self.applyStylesOut(options);
            });

            self._execAction('move', 1, arguments);
        },

        /**
         * @private
         * @instance
         * @since   3.0.0
         * @param   {object}    posData
         * @param   {number}    multiplier
         * @return  {void}
         */

        applyTween: function(posData, multiplier) {
            var self                    = this,
                propertyName            = '',
                tweenData               = null,
                posIn                   = posData.posIn,
                currentTransformValues  = [],
                currentValues           = new mixitup.StyleData(),
                i                       = -1;

            self._execAction('applyTween', 0, arguments);

            currentValues.display   = self.mixer.layout.display;
            currentValues.x         = posIn.x;
            currentValues.y         = posIn.y;

            if (multiplier === 0) {
                currentValues.display = 'none';

                posIn.display === currentValues.display && self.hide();
            } else if (!self.dom.el.style.display) {
                self.show(self.mixer.layout.display);
            }

            for (i = 0; propertyName = self.mixer._tweenable[i]; i++) {
                tweenData = posData.tweenData[propertyName];

                if (propertyName === 'x') {
                    if (!tweenData) continue;

                    currentValues.x = posIn.x + (tweenData * multiplier);
                } else if (propertyName === 'y') {
                    if (!tweenData) continue;

                    currentValues.y = posIn.y + (tweenData * multiplier);
                } else if (tweenData instanceof mixitup.TransformData) {
                    if (!tweenData.value) continue;

                    currentValues[propertyName].value =
                        posIn[propertyName].value + (tweenData.value * multiplier);

                    currentValues[propertyName].unit  = tweenData.unit;

                    currentTransformValues.push(
                        propertyName + '(' + currentValues[propertyName].value + tweenData.unit + ')'
                    );
                } else if (propertyName !== 'display') {
                    if (!tweenData) continue;

                    currentValues[propertyName] = posIn[propertyName] + (tweenData * multiplier);

                    self.dom.el.style[propertyName] = currentValues[propertyName];
                }
            }

            if (currentValues.x || currentValues.y) {
                currentTransformValues.unshift('translate(' + currentValues.x + 'px, ' + currentValues.y + 'px)');
            }

            if (currentTransformValues.length) {
                self.dom.el.style[mixitup.Mixer.prototype._transformProp] = currentTransformValues.join(' ');
            }

            self._execAction('applyTween', 1, arguments);
        },

        /**
         * Applies the initial styling to a target element before any transition
         * is applied.
         *
         * @private
         * @instance
         * @param   {object}    options
         * @return  {void}
         */

        applyStylesIn: function(options) {
            var self            = this,
                posIn           = options.posIn,
                isFading        = self.mixer._effectsIn.opacity !== 1,
                transformValues = [];

            self._execAction('applyStylesIn', 0, arguments);

            transformValues.push('translate(' + posIn.x + 'px, ' + posIn.y + 'px)');

            if (!options.hideOrShow && self.mixer.animation.animateResizeTargets) {
                self.dom.el.style.width        = posIn.width + 'px';
                self.dom.el.style.height       = posIn.height + 'px';
                self.dom.el.style.marginRight  = posIn.marginRight + 'px';
                self.dom.el.style.marginBottom = posIn.marginBottom + 'px';
            }

            isFading && (self.dom.el.style.opacity = posIn.opacity);

            if (options.hideOrShow === 'show') {
                transformValues = transformValues.concat(self.mixer._transformIn);
            }

            self.dom.el.style[mixitup.Mixer.prototype._transformProp] = transformValues.join(' ');

            self._execAction('applyStylesIn', 1, arguments);
        },

        /**
         * Applies a transition followed by the final styles for the element to
         * transition towards.
         *
         * @private
         * @instance
         * @param   {object}    options
         * @return  {void}
         */

        applyStylesOut: function(options) {
            var self            = this,
                transitionRules = [],
                transformValues = [],
                isResizing      = self.mixer.animation.animateResizeTargets,
                isFading        = typeof self.mixer._effectsIn.opacity !== 'undefined';

            self._execAction('applyStylesOut', 0, arguments);

            // Build the transition rules

            transitionRules.push(self.writeTransitionRule(
                mixitup.Mixer.prototype._transformRule,
                options.staggerIndex
            ));

            if (options.hideOrShow) {
                transitionRules.push(self.writeTransitionRule(
                    'opacity',
                    options.staggerIndex,
                    options.duration
                ));
            }

            if (
                self.mixer.animation.animateResizeTargets &&
                options.posOut.display
            ) {
                transitionRules.push(self.writeTransitionRule(
                    'width',
                    options.staggerIndex,
                    options.duration
                ));

                transitionRules.push(self.writeTransitionRule(
                    'height',
                    options.staggerIndex,
                    options.duration
                ));

                transitionRules.push(self.writeTransitionRule(
                    'margin',
                    options.staggerIndex,
                    options.duration
                ));
            }

            // If no callback was provided, the element will
            // not transition in any way so tag it as "immovable"

            if (!options.callback) {
                self.mixer._targetsImmovable++;

                if (self.mixer._targetsMoved === self.mixer._targetsImmovable) {
                    // If the total targets moved is equal to the
                    // number of immovable targets, the operation
                    // should be considered finished

                    self.mixer.cleanUp(options.operation);
                }

                return;
            }

            // If the target will transition in some fasion,
            // assign a callback function

            self.operation = options.operation;
            self.callback = options.callback;

            // As long as the target is not excluded, increment
            // the total number of targets bound

            !self.isExcluded && self.mixer._targetsBound++;

            // Tag the target as bound to differentiate from transitionEnd
            // events that may come from stylesheet driven effects

            self.isBound = true;

            // Apply the transition

            self.applyTransition(transitionRules);

            // Apply width, height and margin negation

            if (
                isResizing &&
                options.posOut.display
            ) {
                self.dom.el.style.width        = options.posOut.width + 'px';
                self.dom.el.style.height       = options.posOut.height + 'px';
                self.dom.el.style.marginRight  = options.posOut.marginRight + 'px';
                self.dom.el.style.marginBottom = options.posOut.marginBottom + 'px';
            }

            if (!self.mixer.animation.nudgeOut && options.hideOrShow === 'hide') {
                // If we're not nudging, the translation should be
                // applied before any other transforms to prevent
                // lateral movement

                transformValues.push('translate(' + options.posOut.x + 'px, ' + options.posOut.y + 'px)');
            }

            // Apply fade

            switch (options.hideOrShow) {
                case 'hide':
                    isFading && (self.dom.el.style.opacity = self.mixer._effectsOut.opacity);

                    transformValues = transformValues.concat(self.mixer._transformOut);

                    break;
                case 'show':
                    isFading && (self.dom.el.style.opacity = 1);
            }

            if (
                self.mixer.animation.nudgeOut ||
                (!self.mixer.animation.nudgeOut && options.hideOrShow !== 'hide')
            ) {
                // Opposite of above - apply translate after
                // other transform

                transformValues.push('translate(' + options.posOut.x + 'px, ' + options.posOut.y + 'px)');
            }

            // Apply transforms

            self.dom.el.style[mixitup.Mixer.prototype._transformProp] = transformValues.join(' ');

            self._execAction('applyStylesOut', 1, arguments);
        },

        /**
         * Combines the name of a CSS property with the appropriate duration and delay
         * values to created a valid transition rule.
         *
         * @private
         * @instance
         * @since   3.0.0
         * @param   {string}    rule
         * @param   {number}    staggerIndex
         * @param   {number}    [duration]
         * @return  {string}
         */

        writeTransitionRule: function(rule, staggerIndex, duration) {
            var self    = this,
                delay   = self.getDelay(staggerIndex),
                output  = '';

            output = rule + ' ' +
                (duration || self.mixer.animation.duration) + 'ms ' +
                delay + 'ms ' +
                (rule === 'opacity' ? 'linear' : self.mixer.animation.easing);

            return self._execFilter('writeTransitionRule', output, arguments);
        },

        /**
         * Calculates the transition delay for each target element based on its index, if
         * staggering is applied. If defined, A custom `animation.staggerSeqeuence`
         * function can be used to manipulate the order of indices to produce custom
         * stagger effects (e.g. for use in a grid with irregular row lengths).
         *
         * @private
         * @instance
         * @since   2.0.0
         * @param   {number}    index
         * @return  {number}
         */

        getDelay: function(index) {
            var self    = this,
                delay   = -1;

            if (typeof self.mixer.animation.staggerSequence === 'function') {
                index = self.mixer.animation.staggerSequence.call(self, index, self._state);
            }

            delay = !!self.mixer._staggerDuration ? index * self.mixer._staggerDuration : 0;

            return self._execFilter('getDelay', delay, arguments);
        },

        /**
         * @private
         * @instance
         * @since   3.0.0
         * @param   {string[]}  rules
         * @return  {void}
         */

        applyTransition: function(rules) {
            var self                = this,
                transitionString    = rules.join(', ');

            self._execAction('applyTransition', 0, arguments);

            self.dom.el.style[mixitup.Mixer.prototype._transitionProp] = transitionString;

            self._execAction('applyTransition', 1, arguments);
        },

        /**
         * @private
         * @instance
         * @since   3.0.0
         * @param   {Event} e
         * @return  {void}
         */

        handleTransitionEnd: function(e) {
            var self        = this,
                propName    = e.propertyName,
                canResize   = self.mixer.animation.animateResizeTargets;

            self._execAction('handleTransitionEnd', 0, arguments);

            if (
                self.isBound &&
                e.target.matches(self.mixer.selectors.target) &&
                (
                    propName.indexOf('transform') > -1 ||
                    propName.indexOf('opacity') > -1 ||
                    canResize && propName.indexOf('height') > -1 ||
                    canResize && propName.indexOf('width') > -1 ||
                    canResize && propName.indexOf('margin') > -1
                )
            ) {
                self.callback.call(self, self.operation);

                self.isBound = false;
                self.callback = null;
                self.operation = null;
            }

            self._execAction('handleTransitionEnd', 1, arguments);
        },

        /**
         * @private
         * @instance
         * @since   3.0.0
         * @param   {Event}     e
         * @return  {void}
         */

        eventBus: function(e) {
            var self = this;

            self._execAction('eventBus', 0, arguments);

            switch (e.type) {
                case 'webkitTransitionEnd':
                case 'transitionend':
                    self.handleTransitionEnd(e);
            }

            self._execAction('eventBus', 1, arguments);
        },

        /**
         * @private
         * @instance
         * @since   3.0.0
         * @return  {void}
         */

        unbindEvents: function() {
            var self = this;

            self._execAction('unbindEvents', 0, arguments);

            h.off(self.dom.el, 'webkitTransitionEnd', self.handler);
            h.off(self.dom.el, 'transitionEnd', self.handler);

            self._execAction('unbindEvents', 1, arguments);
        },

        /**
         * @private
         * @instance
         * @since   3.0.0
         * @return  {void}
         */

        bindEvents: function() {
            var self = this,
                transitionEndEvent = self.mixer._transitionPrefix === 'webkit' ?
                    'webkitTransitionEnd' :
                    'transitionend';

            self._execAction('bindEvents', 0, arguments);

            self.handler = function(e) {
                return self.eventBus(e);
            };

            h.on(self.dom.el, transitionEndEvent, self.handler);

            self._execAction('bindEvents', 1, arguments);
        },

        /**
         * @private
         * @instance
         * @since   3.0.0
         * @return  {PosData}
         */

        getPosData: function() {
            var self    = this,
                styles  = {},
                rect    = null,
                posData = new mixitup.StyleData();

            self._execAction('getPosData', 0, arguments);

            posData.x               = self.dom.el.offsetLeft;
            posData.y               = self.dom.el.offsetTop;
            posData.display         = self.dom.el.style.display || 'none';

            if (self.mixer.animation.animateResizeTargets) {
                rect    = self.dom.el.getBoundingClientRect();
                styles  = window.getComputedStyle(self.dom.el);

                posData.width   = rect.width;
                posData.height  = rect.height;

                posData.marginBottom    = parseFloat(styles.marginBottom);
                posData.marginRight     = parseFloat(styles.marginRight);
            }

            return self._execFilter('getPosData', posData, arguments);
        },

        /**
         * @private
         * @instance
         * @since       3.0.0
         * @return      {void}
         */

        cleanUp: function() {
            var self = this;

            self._execAction('cleanUp', 0, arguments);

            self.dom.el.style[mixitup.Mixer.prototype._transformProp]  = '';
            self.dom.el.style[mixitup.Mixer.prototype._transitionProp] = '';
            self.dom.el.style.opacity                                  = '';

            if (self.mixer.animation.animateResizeTargets) {
                self.dom.el.style.width        = '';
                self.dom.el.style.height       = '';
                self.dom.el.style.marginRight  = '';
                self.dom.el.style.marginBottom = '';
            }

            self._execAction('cleanUp', 1, arguments);
        }
    });

    /**
     * A jQuery-like wrapper object for one or more `mixitup.Mixer` instances
     * allowing simultaneous control of multiple instances.
     *
     * @constructor
     * @namespace
     * @memberof    mixitup
     * @public
     * @since       3.0.0
     * @param       {mixitup.Mixer[]}   instances
     */

    mixitup.Collection = function(instances) {
        var instance    = null,
            i           = -1;

        for (i = 0; instance = instances[i]; i++) {
            this[i] = instance;
        }

        this.length = instances.length;
    };

    /**
     * A jQueryUI-like API for calling a method on all instances in the collection
     * by passing the method name as a string followed by an neccessary parameters.
     *
     * @memberof    mixitup.Collection
     * @public
     * @instance
     * @since       3.0.0
     * @param       {string}            methodName
     * @return      {Promise}
     */

    mixitup.Collection.prototype.do = function(methodName) {
        var self        = this,
            instance    = null,
            args        = Array.prototype.slice.call(arguments),
            tasks       = [],
            q           = null,
            i           = -1;

        args.shift();

        for (i = 0; instance = self[i]; i++) {
            if (!q && instance.libraries.q) {
                q = instance.libraries.q;
            }

            tasks.push(instance[methodName].apply(instance, args));
        }

        if (q) {
            return q.all(tasks);
        } else if (mixitup.Mixer.prototype._has._promises) {
            return Promise.all(tasks);
        }
    };

    /**
     * `mixitup.Operation` objects contain all data neccessary to describe the full
     * lifecycle of any MixItUp operation. They can be used to compute and store an
     * operation for use at a later time (e.g. programmatic tweening).
     *
     * @constructor
     * @namespace
     * @memberof    mixitup
     * @public
     * @since       3.0.0
     */

    mixitup.Operation = function() {
        this._execAction('constructor', 0);

        this.id                  = '';

        this.args                = [];
        this.command             = null;
        this.showPosData         = [];
        this.toHidePosData       = [];

        this.startState          = null;
        this.newState            = null;
        this.docState            = null;

        this.willSort            = false;
        this.willChangeLayout    = false;
        this.hasEffect           = false;

        this.show                = [];
        this.hide                = [];
        this.matching            = [];
        this.toShow              = [];
        this.toHide              = [];
        this.toMove              = [];
        this.toRemove            = [];
        this.startOrder          = [];
        this.newOrder            = [];
        this.newSort             = null;
        this.startSortString     = '';
        this.newSortString       = '';
        this.startFilter         = null;
        this.newFilter           = null;
        this.startHeight         = 0;
        this.startWidth          = 0;
        this.newHeight           = 0;
        this.newWidth            = 0;
        this.startContainerClass = '';
        this.startDisplay        = '';
        this.newContainerClass   = '';
        this.newDisplay          = '';

        this._execAction('constructor', 1);

        h.seal(this);
    };

    mixitup.Operation.prototype = new mixitup.BasePrototype();

    /**
     * `mixitup.State` objects expose various pieces of data detailing the state of
     * a MixItUp instance. They are provided at the start and end of any operation via
     * callbacks and events, with the most recent state stored between operations
     * for retrieval at any time via the API.
     *
     * @constructor
     * @namespace
     * @memberof    mixitup
     * @public
     * @since       3.0.0
     */

    mixitup.State = function() {
        this._execAction('constructor', 0);

        /**
         * The currently active filter selector as set by a control click or the API
         * call.
         *
         * @name        activeFilter
         * @memberof    mixitup.State
         * @instance
         * @type        {string}
         * @default     ''
         */

        this.activeFilter = '';

        /**
         * The currently active sort as set by a control click or API call.
         *
         * @name        activeSort
         * @memberof    mixitup.State
         * @instance
         * @type        {string}
         * @default     ''
         */

        this.activeSort = '';

        /**
         * The currently active CSS display value for target elements as defined in the
         * configuration object.
         *
         * @name        activeDisplay
         * @memberof    mixitup.State
         * @instance
         * @type        {string}
         * @default     ''
         */

        this.activeDisplay = '';

        /**
         * The currently active containerClass, if applied.
         *
         * @name        activeContainerClass
         * @memberof    mixitup.State
         * @instance
         * @type        {string}
         * @default     ''
         */

        this.activeContainerClass = '';

        /**
         * An array of all target elements indexed by the mixer.
         *
         * @name        targets
         * @memberof    mixitup.State
         * @instance
         * @type        {Array.<Element>}
         * @default     []
         */

        this.targets = [];

        /**
         * An array of all target elements not matching the current filter.
         *
         * @name        hide
         * @memberof    mixitup.State
         * @instance
         * @type        {Array.<Element>}
         * @default     []
         */

        this.hide = [];

        /**
         * An array of all target elements matching the current filter and any additional
         * limits applied such as pagination.
         *
         * @name        show
         * @memberof    mixitup.State
         * @instance
         * @type        {Array.<Element>}
         * @default     []
         */

        this.show = [];

        /**
         * An array of all target elements matching the current filter irrespective of
         * any additional limits applied such as pagination.
         *
         * @name        matching
         * @memberof    mixitup.State
         * @instance
         * @type        {Array.<Element>}
         * @default     []
         */

        this.matching = [];

        /**
         * An integer representing the total number of target elements indexed by the
         * mixer. Equivalent to `state.targets.length`.
         *
         * @name        totalTargets
         * @memberof    mixitup.State
         * @instance
         * @type        {number}
         * @default     -1
         */

        this.totalTargets = -1;

        /**
         * An integer representing the total number of target elements matching the
         * current filter and any additional limits applied such as pagination.
         * Equivalent to `state.show.length`.
         *
         * @name        totalShow
         * @memberof    mixitup.State
         * @instance
         * @type        {number}
         * @default     -1
         */

        this.totalShow = -1;

        /**
         * An integer representing the total number of target elements not matching
         * the current filter. Equivalent to `state.hide.length`.
         *
         * @name        totalHide
         * @memberof    mixitup.State
         * @instance
         * @type        {number}
         * @default     -1
         */

        this.totalHide = -1;

        /**
         * An integer representing the total number of target elements matching the
         * current filter irrespective of any other limits applied such as pagination.
         * Equivalent to `state.matching.length`.
         *
         * @name        totalMatching
         * @memberof    mixitup.State
         * @instance
         * @type        {number}
         * @default     -1
         */

        this.totalMatching = -1;

        /**
         * A boolean indicating whether the last operation "failed", i.e. no targets
         * could be found matching the filter.
         *
         * @name        hasFailed
         * @memberof    mixitup.State
         * @instance
         * @type        {boolean}
         * @default     false
         */

        this.hasFailed = false;

        /**
         * The DOM element that was clicked if the last oepration was triggered by the
         * clicking of a control and not an API call.
         *
         * @name        triggerElement
         * @memberof    mixitup.State
         * @instance
         * @type        {Element|null}
         * @default     null
         */

        this.triggerElement = null;

        this._execAction('constructor', 1);

        h.seal(this);
    };

    mixitup.State.prototype = new mixitup.BasePrototype();

    /**
     * @constructor
     * @memberof    mixitup
     * @private
     * @since       3.0.0
     */

    mixitup.StyleData = function() {
        this._execAction('constructor', 0);

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

        this._execAction('constructor', 1);

        h.seal(this);
    };

    mixitup.StyleData.prototype = new mixitup.BasePrototype();

    /**
     * @constructor
     * @memberof    mixitup
     * @private
     * @since       3.0.0
     */

    mixitup.TransformData = function() {
        this._execAction('constructor', 0);

        this.value  = 0;
        this.unit   = '';

        this._execAction('cconstructor', 1);

        h.seal(this);
    };

    mixitup.TransformData.prototype = new mixitup.BasePrototype();

    /**
     * @constructor
     * @memberof    mixitup
     * @private
     * @since       3.0.0
     */

    mixitup.UserInstruction = function() {
        this._execAction('constructor', 0);

        this.command    = {};
        this.animate    = false;
        this.callback   = null;

        this._execAction('constructor', 1);

        h.seal(this);
    };

    mixitup.UserInstruction.prototype = new mixitup.BasePrototype();
    mixitup.Has = function() {
        this.transitions    = false;
        this.promises       = false;
    };

    mixitup.Is = function() {
        this.oldIe          = false;
    };

    mixitup.Features = function() {
        this.has                        = new mixitup.Has();
        this.is                         = new mixitup.Is();

        this.TRANSITION_PROP            = 'transition';
        this.TRANSFORM_PROP             = 'transform';
        this.PERSPECTIVE_PROP           = 'perspective';
        this.PERSPECTIVE_ORIGIN_PROP    = 'perspectiveOrigin';
        this.VENDORS_TRANSITION         = ['Webkit', 'Moz', 'O', 'ms'];
        this.VENDORS_RAF                = ['Webkit', 'moz'];

        this.transformPrefix            = '';
        this.transitionPrefix           = '';

        this.transformProp              = '';
        this.transformRule              = '';
        this.transitionProp             = '';
        this.perspectiveProp            = '';
        this.perspectiveOriginProp      = '';
    };

    mixitup.Features.prototype = new mixitup.BasePrototype();

    h.extend(mixitup.Features.prototype, {
        init: function() {
            var self    = this,
                canary  = document.createElement('div');

            self.transitionPrefix   = h.getPrefix(canary, 'Transition', self.VENDORS_TRANSITION);
            self.transformPrefix    = h.getPrefix(canary, 'Transformn', self.VENDORS_TRANSITION);

            // TODO: add box-sizing prefix test

            self.has.promises       = typeof Promise === 'function';
            self.has.transitions    = self.transitionPrefix !== 'unsupported';
            self.is.oldIe           = window.atob ? false : true;

            self.transitionProp = self.transitionPrefix ?
                self.transitionPrefix + h.camelCase(self.TRANSITION_PROP, true) : self.TRANSITION_PROP;

            self.transformProp = self.transitionPrefix ?
                self.transformPrefix + h.camelCase(self.TRANSFORM_PROP, true) : self.TRANSFORM_PROP;

            self.transformRule = self.transformPrefix ?
                self.transformPrefix + '-' + self.TRANSFORM_PROP : self.TRANSFORM_PROP;

            self.perspectiveProp = self.transformPrefix ?
                self.transformPrefix + h.camelCase(self.PERSPECTIVE_PROP, true) : self.PERSPECTIVE_PROP;

            self.perspectiveOriginProp = self.transformPrefix ?
                self.transformPrefix + h.camelCase(self.PERSPECTIVE_ORIGIN_PROP, true) :
                self.PERSPECTIVE_ORIGIN_PROP;

            // TODO: add polyfills
        }
    });

    mixitup.features = new mixitup.Features();

    mixitup.features.init();

    mixitup.CORE_VERSION    = '3.0.0-beta';
    mixitup.h               = h;

    mixitup.Mixer.prototype._featureDetect();

    if (typeof exports === 'object' && typeof module === 'object') {
        module.exports = mixitup;
    } else if (typeof define === 'function' && define.amd) {
        define(function() {
            return mixitup;
        });
    } else if (typeof window.mixitup === 'undefined' || typeof window.mixitup !== 'function') {
        window.mixitup = window.mixItUp = mixitup;
    }
})(window);