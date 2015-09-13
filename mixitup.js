/**!
 * MixItUp v3.0.0-beta
 *
 * @copyright Copyright 2014-2015 KunkaLabs Limited.
 * @author    KunkaLabs Limited.
 * @link      https://mixitup.kunkalabs.com
 *
 * @license   Commercial use requires a commercial license.
 *            https://mixitup.kunkalabs.com/licenses/
 *
 *            Non-commercial use permitted under terms of CC-BY-NC license.
 *            http://creativecommons.org/licenses/by-nc/3.0/
 */

(function(window, document, undf) {
    'use strict';

    var basePrototype   = null,
        TransformData   = null,
        Collection      = null,
        Operation       = null,
        StyleData       = null,
        MixItUp         = null,
        mixItUp         = null,
        Target          = null,
        State           = null,
        doc             = null,
        _h              = null;

    /* Helper Library
    ---------------------------------------------------------------------- */

    _h = {

        /**
         * hasClass
         * @since 3.0.0
         * @param {Element} el
         * @param {String} cls
         * @return {Boolean}
         */

        hasClass: function(el, cls) {
            return el.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
        },

        /**
         * addClass
         * @since 3.0.0
         * @param {Element} el
         * @param {String} cls
         * @void
         */

        addClass: function(el, cls) {
            if (!this.hasClass(el, cls)) el.className += el.className ? ' ' + cls : cls;
        },

        /**
         * removeClass
         * @since 3.0.0
         * @param {Element} el
         * @param {String} cls
         * @void
         */

        removeClass: function(el, cls) {
            if (this.hasClass(el, cls)) {
                var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');

                el.className = el.className.replace(reg, ' ').trim();
            }
        },

        /**
         * extend
         * @since 3.0.0
         * @param {Object} destination
         * @param {Object} source
         * @void
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
         * on
         * @since 3.0.0
         * @param {Element} el
         * @param {String} type
         * @param {Function} fn
         * @param {Boolean} useCapture
         * @void
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
         * off
         * @since 3.0.0
         * @param {Element} el
         * @param {String} type
         * @param {Function} fn
         * @void
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
         * trigger
         * @param {Element} element
         * @param {String} eventName
         * @param {Object} data
         * @void
         */

        trigger: function(el, eventName, data) {
            var event = null;

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
         * index
         * @since 3.0.0
         * @param {Element} el
         * @param {String} selector
         * @return {Number}
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
         * camelCase
         * @since 2.0.0
         * @param {String}
         * @return {String}
         */

        camelCase: function(string) {
            return string.replace(/-([a-z])/g, function(g) {
                return g[1].toUpperCase();
            });
        },

        /**
         * isElement
         * @since 2.1.3
         * @param {Element} el
         * @return {Boolean}
         */

        isElement: function(el) {
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
         * createElement
         * @since 3.0.0
         * @param {String} htmlString
         * @return {DocumentFragment}
         */

        createElement: function(htmlString) {
            var frag = doc.createDocumentFragment(),
                temp = doc.createElement('div');

            temp.innerHTML = htmlString;

            while (temp.firstChild) {
                frag.appendChild(temp.firstChild);
            }

            return frag;
        },

        /**
         * deleteElement
         * @since 3.0.0
         * @param {Element} el
         * @void
         */

        deleteElement: function(el) {
            if (el.parentElement) {
                el.parentElement.removeChild(el);
            }
        },

        /**
         * isEqualArray
         * @since 3.0.0
         * @param {Array} a
         * @param {Array} b
         * @return {Boolean}
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
         * arrayShuffle
         * @since 2.0.0
         * arrayShuffle
         * @param {Array} oldArray
         * @return {Array}
         */

        arrayShuffle: function(oldArray) {
            var newArray = oldArray.slice(),
                len = newArray.length,
                i = len,
                p = -1,
                t = [];

            while (i--) {
                p = parseInt(Math.random() * len);
                t = newArray[i];

                newArray[i] = newArray[p];
                newArray[p] = t;
            }

            return newArray;
        },

        /**
         * debounce
         * @since 3.0.0
         * @param {Function} func
         * @param {Number} wait
         * @param {Boolean} immediate
         * @return {Function}
         */

        debounce: function(func, wait, immediate) {
            var timeout;

            return function() {
                var context = this,
                    args = arguments,
                    later = function() {
                        timeout = null;

                        if (!immediate) {
                            func.apply(context, args);
                        }
                    },
                    callNow = immediate && !timeout;

                clearTimeout(timeout);

                timeout = setTimeout(later, wait);

                if (callNow) func.apply(context, args);
            };
        },

        /**
         * position
         * @since 3.0.0
         * @param {Element} element
         * @return {Object}
         */

        position: function(element) {
            var xPosition = 0,
                yPosition = 0,
                offsetParent = element;

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
         * getHypotenuse
         * @since 3.0.0
         * @param {Object} node1
         * @return {Object} node2
         * @return {Number}
         */

        getHypotenuse: function(node1, node2) {
            var distanceX = node1.x - node2.x,
                distanceY = node1.y - node2.y;

            distanceX = distanceX < 0 ? distanceX * -1 : distanceX,
            distanceY = distanceY < 0 ? distanceY * -1 : distanceY;

            return Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
        },

        /**
         * closestParent
         * @since 3.0.0
         * @param {Object} el
         * @param {String} selector
         * @param {Boolean} includeSelf
         * @param {Number} range
         * @return {Element}
         */

        closestParent: function(el, selector, includeSelf, range) {
            var parent = el.parentNode,
                depth = range || true;

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
         * children
         * @since 3.0.0
         * @param {Element} el
         * @param {String} selector
         * @return {NodeList}
         */

        children: function(el, selector) {
            var children = [],
                tempId = '';

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
         * forEach
         * @since 3.0.0
         * @param {Array} items
         * @param {Function} callback
         * @void
         */

        forEach: function(items, callback) {
            var i = -1,
                item = null;

            for (i = 0; item = items[i]; i++) {
                (typeof callback === 'function') && callback.call(this, item);
            }
        },

        /**
         * clean
         * @since 3.0.0
         * @param {Array} originalArray
         * @return {Array}
         */

        clean: function(originalArray) {
            var cleanArray = [],
                i = -1;

            for (i = 0; i < originalArray.length; i++) {
                if (originalArray[i]) {
                    cleanArray.push(originalArray[i]);
                }
            }

            return cleanArray;
        },

        /**
         * getPromise
         * @since 3.0.0
         * @return {Object} libraries
         * @return {Object}
         */

        getPromise: function(libraries) {
            var promise = {
                    promise: null,
                    resolve: null,
                    reject: null,
                    isResolved: false
                },
                defered = null;

            if (MixItUp.prototype._has._promises) {
                promise.promise = new Promise(function(resolve, reject) {
                    promise.resolve = resolve;
                    promise.reject = reject;
                });
            } else if (libraries.q && typeof libraries.q === 'function') {
                defered = libraries.q.defer();

                promise.promise = defered.promise;
                promise.resolve = defered.resolve;
                promise.reject = defered.reject;
            } else {
                console.warn('[MixItUp] WARNING: No available Promises implementations were found');

                return null;
            }

            return promise;
        },

        /**
         * canReportErrors
         * @since 3.0.0
         * @param [{Object}] config
         * @return {Boolean}
         */

        canReportErrors: function(config) {
            if (!config || config && !config.debug) {
                return true;
            } else if (config && config.debug && config.debug.enable === false) {
                return false;
            }
        },

        /**
         * getPrefix
         * @since 2.0.0
         * @param {Element} el,
         * @param {String} property
         * @param {String[]} vendors
         * @return {String | Boolean}
         */

        getPrefix: function(el, property, vendors) {
            var i = -1,
                prefix = '';

            if (property.toLowerCase() in el.style) return '';

            for (i = 0; prefix = vendors[i]; i++) {
                if (prefix + property in el.style) {
                    return prefix.toLowerCase();
                }
            }

            return false;
        },

        /**
         * negateValue
         * @param {String} value
         * @param {Boolean} invert
         * @return {String}
         */

        negateValue: function(value, invert) {
            if (invert) {
                return value.charAt(0) === '-' ?
                    value.substr(1, value.length) :
                    '-' + value;
            } else {
                return value;
            }
        },

        /**
         * randomHexKey
         * @return {String}
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
         * getDocumentState
         * @since 3.0.0
         * @return {Object}
         */

        getDocumentState: function() {
            return {
                scrollTop: window.pageYOffset,
                scrollLeft: window.pageXOffset,
                docHeight: doc.documentElement.scrollHeight
            };
        },

        /**
         * bind
         * @param {Object} obj
         * @param {Function} fn
         * @return {Function}
         */

        bind: function(obj, fn) {
            return function() {
                return fn.apply(obj, arguments);
            };
        },

        /**
         * isVisible
         * @param {Element} el
         * @return {Boolean}
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
         * seal
         * @param {Object} obj
         */

        seal: function(obj) {
            if (typeof Object.seal === 'function') {
                Object.seal(obj);
            }
        }
    };

    /* basePrototype
    ---------------------------------------------------------------------- */

    basePrototype = {

        /* Public Static Methods
        ---------------------------------------------------------------------- */

        /**
         * extend
         * @since 2.1.0
         * @param {Object} new properties/methods
         * @void
         *
         * Shallow extend the prototype with new methods
         */

        // TODO: make the extend helper method more robust with deep/shallow flag, and call here

        extend: function(extension) {
            var key = '',
                self = this;

            for (key in extension) {
                if (extension[key]) {
                    this[key] = extension[key];
                }
            }
        },

        /**
         * addAction
         * @since 2.1.0
         * @param {String} hook name
         * @param {String} name
         * @param {Function} func
         * @param {Number} priority
         * @extends {Object} MixItUp.prototype._actions
         * @void
         *
         * Register a named action hook on the prototype
         */

        addAction: function(hook, name, func, priority) {
            this._addHook('_actions', hook, name, func, priority);
        },

        /**
         * addFilter
         * @since 2.1.0
         * @param {String} hook
         * @param {String} name
         * @param {Function} func
         * @extends {Object} MixItUp.prototype._filters
         * @void
         *
         * Register a named action hook on the prototype
         */

        addFilter: function(hook, name, func) {
            this._addHook('_filters', hook, name, func);
        },

        /* Private Static Methods
        ---------------------------------------------------------------------- */

        /**
         * _addHook
         * @since 2.1.0
         * @param {String} type of hook
         * @param {String} hook name
         * @param {Function} function to execute
         * @param {Number} priority
         * @extends {Object} MixItUp.prototype._filters
         * @void
         *
         * Add a hook to the MixItUp prototype
         */

        _addHook: function(type, hook, name, func, priority) {
            var collection = this[type],
                obj = {};

            priority = (priority === 1 || priority === 'post') ? 'post' : 'pre';

            obj[hook] = {};
            obj[hook][priority] = {};
            obj[hook][priority][name] = func;

            _h.extend(collection, obj);
        },

        /* Private Instance Methods
        ---------------------------------------------------------------------- */

        /**
         * _execAction
         * @since 2.0.0
         * @param {String} methodName
         * @param {Boolean} isPost
         * @param {Array} args
         * @void
         */

        _execAction: function(methodName, isPost, args) {
            var self = this,
                key = '',
                context = isPost ? 'post' : 'pre';

            if (!self._actions.isEmptyObject && self._actions.hasOwnProperty(methodName)) {
                for (key in self._actions[methodName][context]) {
                    self._actions[methodName][context][key].call(self, args);
                }
            }
        },

        /**
         * _execFilter
         * @since 2.0.0
         * @param {String} methodName
         * @param {Mixed} value
         * @param {Array} args
         * @return {Mixed}
         * @void
         */

        _execFilter: function(methodName, value, args) {
            var self = this,
                key = '';

            if (!self._filters.isEmptyObject && self._filters.hasOwnProperty(methodName)) {
                for (key in self._filters[methodName].pre) {
                    return self._filters[methodName].pre[key].call(self, value, args);
                }
            } else {
                return value;
            }
        }
    };

    /* MixItUp
    ---------------------------------------------------------------------- */

    /**
     * MixItUp
     * @since 2.0.0
     * @constructor
     */

    // TODO: should this be called a Mixer?

    MixItUp = function() {
        var self = this;

        self._execAction('_constructor', 0);

        _h.extend(self, {

            /* Public Properties
            ---------------------------------------------------------------------- */

            selectors: {
                target: '.mix',
                filter: '.filter',
                filterToggle: '.filter-toggle',
                multiMix: '.multimix',
                sort: '.sort'
            },

            animation: {
                enable: true,
                effects: 'fade scale',
                duration: 600,
                easing: 'ease',
                perspectiveDistance: '3000',
                perspectiveOrigin: '50% 50%',
                queue: true,
                queueLimit: 1,
                animateChangeLayout: false,
                animateResizeContainer: true,
                animateResizeTargets: false,
                staggerSequence: false,
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
                toggleFilterButtons: false,
                toggleLogic: 'or',
                activeClass: 'active'
            },

            layout: {
                display: 'inline-block',
                containerClass: '',
                containerClassFail: 'fail'
            },

            load: {
                filter: 'all',
                sort: false
            },

            libraries: {
                q: null
            },

            debug: {
                enable: true
            },

            document: null,

            extensions: null,

            /* DOM
            ---------------------------------------------------------------------- */

            _dom: {
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

            /* Private Properties
            ---------------------------------------------------------------------- */

            _isMixing: false,
            _isClicking: false,
            _isLoading: true,
            _isRemoving: false,

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
            _vendor: ''
        });

        self._execAction('_constructor', 1);

        _h.seal(this);
        _h.seal(this.selectors);
        _h.seal(this.animation);
        _h.seal(this.callbacks);
        _h.seal(this.controls);
        _h.seal(this.layout);
        _h.seal(this.load);
        _h.seal(this.libraries);
        _h.seal(this.debug);
        _h.seal(this._dom);
    };

    /**
     * MixItUp.prototype
     * @since 2.0.0
     * @prototype
     * @extends prototype
     */

    MixItUp.prototype = Object.create(basePrototype);

    _h.extend(MixItUp.prototype, {
        constructor: MixItUp,

        /* Static Properties
        ---------------------------------------------------------------------- */

        _actions: {},
        _filters: {},

        _transformProp: 'transform',
        _transformRule: 'transform',
        _transitionProp: 'transition',

        _tweenable: [
            'opacity',
            'width', 'height',
            'marginRight', 'marginBottom',
            'x', 'y',
            'scale',
            'translateX', 'translateY', 'translateZ',
            'rotateX', 'rotateY', 'rotateZ'
        ],

        _transformDefaults: [
            {
                prop: 'scale',
                value: 0.01
            },
            {
                prop: 'translateX',
                value: 20,
                unit: 'px'
            },
            {
                prop: 'translateY',
                value: 20,
                unit: 'px'
            },
            {
                prop: 'translateZ',
                value: 20,
                unit: 'px'
            },
            {
                prop: 'rotateX',
                value: 90,
                unit: 'deg'
            },
            {
                prop: 'rotateY',
                value: 90,
                unit: 'deg'
            },
            {
                prop: 'rotateZ',
                value: 180,
                unit: 'deg'
            }
        ],

        _is: {},
        _has: {},

        _instances: {},

        _handled: {
            _filter: {},
            _sort: {}
        },

        _bound: {
            _filter: {},
            _sort: {}
        },

        /**
         * _featureDetect
         * @since 2.0.0
         *
         * Performs all neccessary feature detection on evalulation
         */

        _featureDetect: function() {
            var self = this,
                testEl = document.createElement('div'),
                vendorsTrans = ['Webkit', 'Moz', 'O', 'ms'],
                vendorsRAF = ['webkit', 'moz'],
                transitionPrefix = _h.getPrefix(testEl, 'Transition', vendorsTrans),
                transformPrefix = _h.getPrefix(testEl, 'Transform', vendorsTrans),
                i = -1;

            self._vendor = transformPrefix; // TODO: this is only used for box-sizing, make a seperate test

            MixItUp.prototype._has._promises = typeof Promise === 'function';
            MixItUp.prototype._has._transitions = transitionPrefix !== false;
            MixItUp.prototype._is._crapIe = window.atob ? false : true;

            MixItUp.prototype._transitionProp =
                transitionPrefix ? transitionPrefix + 'Transition' : 'transition';

            MixItUp.prototype._transformProp =
                transformPrefix ? transformPrefix + 'Transform' : 'transform';

            MixItUp.prototype._transformRule =
                transformPrefix ? '-' + transformPrefix + '-transform' : 'transform';

            /* Polyfills
            ---------------------------------------------------------------------- */

            /**
             * window.requestAnimationFrame
             */

            for (i = 0; i < vendorsRAF.length && !window.requestAnimationFrame; i++) {
                window.requestAnimationFrame = window[vendorsRAF[i] + 'RequestAnimationFrame'];
            }

            /**
             * Element.nextElementSibling
             */

            if (testEl.nextElementSibling === undf) {
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

            /**
             * Element.matches
             */

            (function(ElementPrototype) {
                ElementPrototype.matches =
                    ElementPrototype.matches ||
                    ElementPrototype.machesSelector ||
                    ElementPrototype.mozMatchesSelector ||
                    ElementPrototype.msMatchesSelector ||
                    ElementPrototype.oMatchesSelector ||
                    ElementPrototype.webkitMatchesSelector ||
                    function (selector) {
                        var node = this,
                            nodes = (node.parentNode || node.doc).querySelectorAll(selector),
                            i = -1;

                        while (nodes[++i] && nodes[i] != node) {
                            return !!nodes[i];
                        }
                    };
            })(Element.prototype);

            self._execAction('_featureDetect', 1);
        },

        /* Private Methods
        ---------------------------------------------------------------------- */

        /**
         * _init
         * @since 2.0.0
         * @param {Element} el
         * @param {Object} config
         * @void
         */

        _init: function(el, config) {
            var self = this,
                state = new State();

            self._execAction('_init', 0, arguments);

            config && _h.extend(self, config);

            self._cacheDom(el);

            self.layout.containerClass && _h.addClass(el, self.layout.containerClass);

            self.animation.enable = self.animation.enable && MixItUp.prototype._has._transitions;

            self._indexTargets(true);

            state.activeFilter = self.load.filter === 'all' ?
                self.selectors.target :
                self.load.filter === 'none' ?
                    '' :
                    self.load.filter;

            state.activeSort = self.load.sort;

            if (self._dom.filterToggleButtons.length) {
                // TODO: what about live toggles? is it worth trawling the dom?

                self._buildToggleArray();
            }

            self._updateControls({
                filter: self._activeFilter,
                sort: self._activeSortString
            });

            self._parseEffects();

            self._bindEvents();

            self._state = state;

            self._execAction('_init', 1, arguments);
        },

        /**
         * _cacheDom
         * @since 3.0.0
         * @void
         *
         * Cache references of all neccessary DOM elements
         */

        _cacheDom: function(el) {
            var self = this;

            self._execAction('_cacheDom', 0, arguments);

            self._dom.body = doc.getElementsByTagName('body')[0];
            self._dom.container = el;
            self._dom.parent = el;

            self._dom.sortButtons =
                Array.prototype.slice.call(doc.querySelectorAll(self.selectors.sort));

            self._dom.filterButtons =
                Array.prototype.slice.call(doc.querySelectorAll(self.selectors.filter));

            self._dom.filterToggleButtons =
                Array.prototype.slice.call(doc.querySelectorAll(self.selectors.filterToggle));

            self._dom.multiMixButtons =
                Array.prototype.slice.call(doc.querySelectorAll(self.selectors.multiMix));

            self._dom.allButtons = self._dom.filterButtons
                .concat(self._dom.sortButtons)
                .concat(self._dom.filterToggleButtons)
                .concat(self._dom.multiMixButtons);

            self._execAction('_cacheDom', 1, arguments);
        },

        /**
         * _indexTargets
         * @since 3.0.0
         * @void
         *
         * Index matching children of the container, and
         * instantiate Target instances for each one
         */

        _indexTargets: function() {
            var self = this,
                target = null,
                el = null,
                i = -1;

            self._execAction('_indexTargets', 0, arguments);

            self._dom.targets = _h.children(self._dom.container, self.selectors.target);

            // TODO: allow querying of all descendants via config option, allowing for nested parent

            self._targets = [];

            if (self._dom.targets.length) {
                for (i = 0; el = self._dom.targets[i]; i++) {
                    target = new Target();

                    target._init(el, self);

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
         * _bindEvents
         * @since 3.0.0
         * @void
         */

        _bindEvents: function() {
            var self = this,
                proto = MixItUp.prototype,
                filters = proto._bound._filter,
                sorts = proto._bound._sort,
                button = null,
                i = -1;

            self._execAction('_bindEvents', 0);

            self._handler = function(e) {
                return self._eventBus(e);
            };

            if (self.controls.live) {
                _h.on(window, 'click', self._handler);
            } else {
                for (i = 0; button = self._dom.allButtons[i]; i++) {
                    _h.on(button, 'click', self._handler);
                }
            }

            filters[self.selectors.filter] = (filters[self.selectors.filter] === undf) ?
                1 : filters[self.selectors.filter] + 1;

            sorts[self.selectors.sort] = (sorts[self.selectors.sort] === undf) ?
                1 : sorts[self.selectors.sort] + 1;

            self._execAction('_bindEvents', 1);
        },

        /**
         * _unbindEvents
         * @since 3.0.0
         * @void
         */

        _unbindEvents: function() {
            var self = this,
                button = null,
                i = -1;

            self._execAction('_unbindEvents', 0);

            _h.off(window, 'click', self._handler);

            for (i = 0; button = self._dom.allButtons[i]; i++) {
                _h.on(button, 'click', self._handler);
            }

            self._execAction('_unbindEvents', 1);

            delete self._handler;
        },

        /**
         * _eventBus
         * @param {Object} e
         * @return [{Boolean}]
         */

        _eventBus: function(e) {
            var self = this;

            switch(e.type) {
                case 'click':
                    return self._handleClick(e);
            }
        },

        /**
         * _handleClick
         * @since 3.0.0
         * @param {object} button
         * @param {string} type
         * @void
         *
         * Determines the type of operation needed and the
         * appropriate parameters when a button is clicked
         */

        _handleClick: function(e) {
            var self = this,
                selectors = [],
                selector = '',
                toggleSeperator = self.controls.toggleLogic === 'or' ? ',' : '',
                target = null,
                command = {},
                filterString = '',
                sortString = '',
                method = '',
                isTogglingOff = false,
                button = null,
                key = '',
                i = -1;

            self._execAction('_handleClick', 0, arguments);

            if (typeof self.callbacks.onMixClick === 'function') {
                self.callbacks.onMixClick.call(self._dom.container, self._state, self);
            }

            for (key in self.selectors) {
                selectors.push(self.selectors[key]);
            }

            selector = selectors.join(',');

            target = _h.closestParent(
                e.target,
                selector,
                true
            );

            if (!target) return;

            if (
                self._isMixing &&
                (!self.animation.queue || self._queue.length >= self.animation.queueLimit)
            ) {
                if (typeof self.callbacks.onMixBusy === 'function') {
                    self.callbacks.onMixBusy.call(self._dom.container, self._state, self);
                }

                self._execAction('_handleClickBusy', 1, arguments);

                return;
            }

            self._isClicking = true;

            if (target.matches(self.selectors.sort)) {

                // sort

                sortString = target.getAttribute('data-sort');

                if (
                    !_h.hasClass(target, self.controls.activeClass) ||
                    sortString.indexOf('random') > -1
                ) {
                    method = 'sort';

                    for (i = 0; button = self._dom.sortButtons[i]; i++) {
                        _h.removeClass(button, self.controls.activeClass);
                    }

                    command = {
                        sort: sortString
                    };
                } else {
                    return;
                }
            } else if (target.matches(self.selectors.filter)) {

                // filter

                if (!_h.hasClass(target, self.controls.activeClass)) {
                    method = 'filter';

                    for (i = 0; button = self._dom.filterButtons[i]; i++) {
                        _h.removeClass(button, self.controls.activeClass);
                    }

                    for (i = 0; button = self._dom.filterToggleButtons[i]; i++) {
                        _h.removeClass(button, self.controls.activeClass);
                    }

                    command = {
                        filter: target.getAttribute('data-filter')
                    };
                } else {
                    return;
                }
            } else if (target.matches(self.selectors.filterToggle)) {

                // filterToggle

                filterString = target.getAttribute('data-filter');
                method = 'filterToggle';

                self._buildToggleArray();

                if (!_h.hasClass(target, self.controls.activeClass)) {
                    self._toggleArray.push(filterString);
                } else {
                    self._toggleArray.splice(self._toggleArray.indexOf(filterString, 1));

                    isTogglingOff = true;
                }

                self._toggleArray = _h.clean(self._toggleArray);
                self._toggleArray = self._toggleArray.join(self.controls.toggleLogic === 'or' ? ',' : '');

                for (i = 0; button = self._dom.filterButtons[i]; i++) {
                    _h.removeClass(button, self.controls.activeClass);
                }

                for (i = 0; button = self._dom.multiMixButtons[i]; i++) {
                    _h.removeClass(button, self.controls.activeClass);
                }

                self._toggleString = self._toggleArray.join(seperator);

                command = {
                    filter: self._toggleString
                };
            } else if (target.matches(self.selectors.multiMix)) {

                // multiMix

                if (!_h.hasClass(target, self.controls.activeClass)) {
                    method = 'multiMix';

                    for (i = 0; button = self._dom.filterButtons[i]; i++) {
                        _h.removeClass(button, self.controls.activeClass);
                    }

                    for (i = 0; button = self._dom.filterToggleButtons[i]; i++) {
                        _h.removeClass(button, self.controls.activeClass);
                    }

                    for (i = 0; button = self._dom.sortButtons[i]; i++) {
                        _h.removeClass(button, self.controls.activeClass);
                    }

                    for (i = 0; button = self._dom.multiMixButtons[i]; i++) {
                        _h.removeClass(button, self.controls.activeClass);
                    }

                    command = {
                        sort: target.getAttribute('data-sort'),
                        filter: target.getAttribute('data-filter')
                    };
                } else {
                    return;
                }
            }

            if (method) {
                self._trackClick(target, method, isTogglingOff);

                self.multiMix(command);
            }

            self._execAction('_handleClick', 1, arguments);
        },

        /**
         * _trackClick
         * @since 3.0.0
         * @param {Element} button
         * @param {String} method
         * @param {Boolean} isTogglingOff
         * @void
         */

        _trackClick: function(button, method, isTogglingOff) {
            var self = this,
                proto = MixItUp.prototype,
                selector = self.selectors[method];

            method = '_' + method;

            proto._handled[method][selector] = (proto._handled[method][selector] === undf) ?
                1 :
                proto._handled[method][selector] + 1;

            if (
                proto._handled[method][selector] ===
                proto._bound[method][selector]
            ) {
                _h[(isTogglingOff ? 'remove' : 'add') + 'Class'](button, self.controls.activeClass);

                delete proto._handled[method][selector];
            }
        },

        /**
         * _buildToggleArray
         * @since 2.0.0
         * @void
         *
         * Combines the selectors of toggled buttons into an array
         */

        _buildToggleArray: function() {
            var self = this,
                activeFilter = self._activeFilter.replace(/\s/g, ''),
                filter = '',
                i = -1;

            self._execAction('_buildToggleArray', 0, arguments);

            if (self.controls.toggleLogic === 'or') {
                self._toggleArray = activeFilter.split(',');
            } else {
                self._toggleArray = activeFilter.split('.');

                !self._toggleArray[0] && self._toggleArray.shift();

                for (i = 0; filter = self._toggleArray[i]; i++) {
                    self._toggleArray[i] = '.' + filter;
                }
            }

            self._execAction('_buildToggleArray', 1, arguments);
        },

        /**
         * _updateControls
         * @since 2.0.0
         * @param {Object} command
         * @void
         *
         * Updates buttons to their active/deactive state based
         * on the current state of the instance
         */

        _updateControls: function(command) {
            var self = this,
                output = {
                    filter: command.filter,
                    sort: command.sort
                },
                filterToggleButton = null,
                activeButton = null,
                button = null,
                selector = '',
                i = -1,
                j = -1,
                k = -1;

            self._execAction('_updateControls', 0, arguments);

            (command.filter === undf) && (output.filter = self._activeFilter);
            (command.sort === undf) && (output.sort = self._activeSortString);
            (output.filter === self.selectors.target) && (output.filter = 'all');

            for (i = 0; button = self._dom.sortButtons[i]; i++) {
                _h.removeClass(button, self.controls.activeClass);

                if (button.matches('[data-sort="' + output.sort + '"]')) {
                    _h.addClass(button, self.controls.activeClass);
                }
            }

            for (i = 0; button = self._dom.filterButtons[i]; i++) {
                _h.removeClass(button, self.controls.activeClass);
            }

            for (i = 0; button = self._dom.multiMixButtons[i]; i++) {
                _h.removeClass(button, self.controls.activeClass);

                if (
                    button.matches('[data-sort="' + output.sort + '"]') &&
                    button.matches('[data-filter="' + output.filter + '"]')
                ) {
                    _h.addClass(button, self.controls.activeClass);
                }
            }

            if (self._toggleArray.length) {
                if (output.filter === 'none' || output.filter === '') {
                    for (i = 0; button = self._dom.filterToggleButtons[i]; i++) {
                        _h.removeClass(button, self.controls.activeClass);
                    }
                }

                for (j = 0; selector = self._toggleArray[j]; j++) {
                    activeButton = null;

                    if (self.controls.live) {
                        activeButton = doc
                            .querySelector(self.selectors.filterToggle + '[data-filter="' + selector + '"]');
                    } else {
                        for (k = 0; filterToggleButton = self._dom.filterToggleButtons[k]; k++) {
                            if (filterToggleButton.matches('[data-filter="' + selector + '"]')) {
                                activeButton = filterToggleButton;
                            }
                        }
                    }

                    _h.addClass(activeButton, self.controls.activeClass);
                }
            } else {
                for (i = 0; button = self._dom.filterButtons[i]; i++) {
                    if (button.matches('[data-filter="' + output.filter + '"]')) {
                        _h.addClass(button, self.controls.activeClass);
                    }
                }
            }

            self._execAction('_updateControls', 1, arguments);
        },

        /**
         * _filter
         * @since 2.0.0
         * @param {Operation} operation
         * @void
         */

        _filter: function(operation) {
            var self = this,
                condition = false,
                target = null,
                i = -1;

            self._execAction('_filter', 0, arguments);

            for (i = 0; target = self._targets[i]; i++) {
                if (typeof operation.startFilter === 'string') {
                    // show via selector

                    condition = operation.startFilter === '' ?
                        false : target._dom.el.matches(operation.startFilter);

                    self._evaluateHideShow(condition, target, false, operation);
                } else if (
                    typeof operation.startFilter === 'object' &&
                    _h.isElement(operation.startFilter)
                ) {
                    // show via element

                    self._evaluateHideShow(target._dom.el === operation.startFilter, target, false, operation);
                } else if (
                    typeof operation.startFilter === 'object' &&
                    operation.startFilter.length
                ) {
                    // show via collection

                    self._evaluateHideShow(operation.startFilter.indexOf(target._dom.el) > -1, target, false, operation);
                } else if (
                    typeof operation.startFilter === 'object' &&
                    typeof operation.startFilter.hide === 'string'
                ) {
                    // hide via selector

                    self._evaluateHideShow(!target._dom.el.matches(operation.startFilter.hide), target, true, operation);
                } else if (
                    typeof operation.startFilter.hide === 'object' &&
                    _h.isElement(operation.startFilter.hide)
                ) {
                    // hide via element

                    self._evaluateHideShow(target._dom.el !== operation.startFilter.hide, target, true, operation);
                } else if (
                    typeof operation.startFilter.hide === 'object' &&
                    operation.startFilter.hide !== null &&
                    operation.startFilter.hide.length
                ) {
                    // hide via collection

                    self._evaluateHideShow(operation.startFilter.hide.indexOf(target._dom.el) < 0, target, true, operation);
                }
            }

            operation.matching = operation.show.slice();

            self._execAction('_filter', 1, arguments);
        },

        /**
         * _evaluateHideShow
         * @since 3.0.0
         * @param {Boolean} condition
         * @param {Element} target
         * @param {Boolean} isRemoving
         * @param {Operation} operation
         * @void
         */

        _evaluateHideShow: function(condition, target, isRemoving, operation) {
            var self = this;

            if (condition) {
                if (isRemoving && typeof operation.startFilter === 'string') {
                    self._evaluateHideShow(target._dom.el.matches(operation.startFilter), target, false, operation);
                } else {
                    operation.show.push(target);

                    !target._isShown && operation.toShow.push(target);
                }
            } else {
                operation.hide.push(target);

                target._isShown && operation.toHide.push(target);
            }
        },

        /**
         * _sort
         * @since 2.0.0
         * @param {Operation} operation
         * @void
         */

        _sort: function(operation) {
            var self = this,
                target = null,
                i = -1;

            self._execAction('_sort', 0);

            operation.startOrder = [];

            for (i = 0; target = self._targets[i]; i++) {
                operation.currentOrder.push(target);
            }

            switch (operation.newSort[0].sortBy) {
                case 'default':
                    operation.newOrder = self._origOrder.slice();

                    if (operation.newSort[0].order === 'desc') {
                        operation.newOrder.reverse();
                    }

                    break;
                case 'random':
                    operation.newOrder = _h.arrayShuffle(operation.startOrder);

                    break;
                case 'custom':
                    operation.newOrder = operation.newSort[0].order;

                    break;
                default:
                    operation.newOrder = operation.startOrder
                        .slice()
                        .sort(function(a, b) {
                            return self._compare(a, b, operation.newSort);
                        });
            }

            if (_h.isEqualArray(operation.newOrder, operation.startOrder)) {
                operation.willSort = false;
            }

            self._execAction('_sort', 1);
        },

        /**
         * _compare
         * @algorithm
         * @since 2.0.0
         * @param {String|Number} a
         * @param {String|Number} b
         * @param {Number} depth (recursion)
         * @param {ParsedSort} sort
         * @return {Number}
         */

        _compare: function(a, b, depth, sort) {
            depth = depth ? depth : 0;
            sort = sort ? sort : self._newSort;

            var self = this,
                order = sort[depth].order,
                isString = false,
                attrA = self._getAttributeValue(a, depth, sort),
                attrB = self._getAttributeValue(b, depth, sort);

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
         * _getAttributeValue
         * @since 3.0.0
         * @param {Element} target
         * @param [{ParsedSort}] sort
         * @return {String|Number}
         *
         * Reads the values of sort attributes
         */

        _getAttributeValue: function(target, depth, sort) {
            var self = this,
                value = '';

            sort = sort ? sort : self._newSort;

            value = target._dom.el.getAttribute('data-' + sort[depth].sortBy);

            if (value === null) {
                if (_h.canReportErrors(self)) {
                    // Encourage users to assign values to all
                    // targets to avoid erroneous sorting when
                    // types are mixed

                    console.warn(
                        '[MixItUp] The attribute "data-' +
                        self._newSort[depth].sortBy +
                        '" was not present on one or more target elements'
                    );
                }
            }

            // If an attribute is not present, return 0 as a safety value

            return value || 0;
        },

        /**
         * _printSort
         * @since 2.0.0
         * @param {Boolean} isResetting
         * @param {Operation} operation
         * @void
         *
         * Inserts elements into the DOM in the appropriate
         * order using a document fragment for minimal
         * DOM thrashing
         */

        _printSort: function(isResetting, operation) {
            var self = this,
                order = isResetting ? self._currentOrder : self._newOrder,
                targets = _h.children(self._dom.parent, self.selectors.target),
                nextSibling = targets.length ? targets[targets.length - 1].nextElementSibling : null,
                frag = doc.createDocumentFragment(),
                target = null,
                whiteSpace = null,
                el = null,
                i = -1;

            if (operation) {
                // TODO: This will replace the above ^

                order = isResetting ? operation.startOrder : operation.newOrder;
            }

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

                el = target._dom.el;

                frag.appendChild(el);
                frag.appendChild(doc.createTextNode(' '));
            }

            // Insert the document fragment into the container
            // before any other non-target elements

            nextSibling ?
                self._dom.parent.insertBefore(frag, nextSibling) :
                self._dom.parent.appendChild(frag);

            self._execAction('_printSort', 1, arguments);
        },

        /**
         * _parseSort
         * @since 2.0.0
         * @param {String} sortString
         * @return {String[]}
         *
         * Parse user-defined sort strings into useable values
         * or "rules"
         */

        _parseSort: function(sortString) {
            var self = this,
                rules = typeof sortString === 'string' ? sortString.split(' ') : [sortString],
                newSort = [],
                ruleObj = null,
                rule = [],
                i = -1;

            for (i = 0; i < rules.length; i++) {
                rule = typeof sortString === 'string' ? rules[i].split(':') : ['custom', rules[i]];
                ruleObj = {
                    sortBy: _h.camelCase(rule[0]),
                    order: rule[1] || 'asc'
                };

                newSort.push(ruleObj);

                if (ruleObj.sortBy === 'default' || ruleObj.sortBy === 'random') break;
            }

            return self._execFilter('_parseSort', newSort, arguments);
        },

        /**
         * _parseEffects
         * @since 2.0.0
         * @void
         *
         * Parse the user-defined effects string into values
         * and units, and create transform strings
         */

        _parseEffects: function() {
            var self = this,
                transform = null,
                i = -1;

           self._effectsIn = new StyleData();
           self._effectsOut = new StyleData();
           self._transformIn = [];
           self._transformOut = [];

           self._parseEffect('fade');

           for (i = 0; transform = self._transformDefaults[i]; i++) {
               self._parseEffect(transform.prop, i);
           }

           self._parseEffect('stagger');
        },

        /**
         * _parseEffect
         * @since 2.0.0
         * @param {String} effect
         * @param [{Number}] transformIndex
         */

        _parseEffect: function(effect, transformIndex) {
            var self = this,
                re = /\(([^)]+)\)/,
                propIndex = -1,
                str = '',
                match = [],
                val = '',
                units = ['%', 'px', 'em', 'rem', 'vh', 'vw'],
                unit = '',
                i = -1;

            if (self.animation.effects.indexOf(effect) < 0) {
                // The effect is not present in the animation.effects string

                return;
            }

            // The effect is present

            propIndex = self.animation.effects.indexOf(effect + '(');

            // TODO: Can we improve the logic below for DRYness?

            if (propIndex > -1) {
                // The effect has a user defined value in parentheses

                // Extract from the first parenthesis to the end of string

                str = self.animation.effects.substring(propIndex);

                // Match any number of characters between "(" and ")"

                match = re.exec(str);

                val = match[1];

                switch (effect) {
                    case 'fade':
                        self._effectsIn.opacity = self._effectsOut.opacity = parseFloat(val);

                        break;
                    case 'stagger':
                        self._staggerDuration = parseFloat(val);

                        break;
                    default:
                        // Transforms

                        for (i = 0; unit = units[i]; i++) {
                            if (val.indexOf(unit) > -1) {
                                self._effectsIn[effect].unit = self._effectsOut[effect].unit = unit;
                                self._effectsIn[effect].value = parseFloat(val);
                            }

                            break;
                        }

                        self._effectsOut[effect].value = (self.animation.reverseOut && effect !== 'scale') ?
                            self._effectsIn[effect].value * -1 :
                            self._effectsIn[effect].value;

                        self._transformIn.push(effect + '(' + self._effectsIn[effect].value + self._effectsIn[effect].unit + ')');
                        self._transformOut.push(effect + '(' + self._effectsOut[effect].value + self._effectsOut[effect].unit + ')');
                }
            } else {
                // Else, use the default value for the effect

                switch (effect) {
                    case 'fade':
                        self._effectsIn.opacity = self._effectsOut.opacity = 0;

                        break;
                    case 'stagger':
                        self._staggerDuration = 100;

                        break;
                    default:
                        // Transforms

                        self._effectsIn[effect].value = self._transformDefaults[i].value;
                        self._effectsIn[effect].unit = self._effectsOut[effect].unit = self._transformDefaults[i].unit;

                        self._effectsOut[effect].value = (self.animation.reverseOut && effect !== 'scale') ?
                            self._effectsIn[effect].value * -1 :
                            self._effectsIn[effect].value;

                        self._transformIn.push(effect + '(' + self._effectsIn[effect].value + self._effectsIn[effect].unit + ')');
                        self._transformOut.push(effect + '(' + self._effectsOut[effect].value + self._effectsOut[effect].unit + ')');
                }
            }
        },

        /**
         * _buildState
         * @since 2.0.0
         * @param {Operation} operation
         * @return {State}
         */

        _buildState: function(operation) {
            var self = this,
                state = new State();

            self._execAction('_buildState', 0);

            state.activeFilter         = operation.newFilter;
            state.activeSort           = operation.newSortString;
            state.activeContainerClass = operation.newContainerClass;
            state.hasFailed            = !operation.matching.length && operation.newFilter !== '';
            state.targets              = self._targets;
            state.show                 = operation.show;
            state.hide                 = operation.hide;
            state.matching             = operation.matching;
            state.instance             = self;
            state.totalTargets         = self._targets.length;
            state.totalShow            = operation.show.length;
            state.totalHide            = operation.hide.length;
            state.totalMatching        = operation.matching.length;

            return self._execFilter('_buildState', state, arguments);
        },

        /**
         * _goMix
         * @since 2.0.0
         * @param {Boolean} shouldAnimate
         * @param {Operation} operation
         * @void
         */

        _goMix: function(shouldAnimate, operation) {
            var self = this,
                defered = null,
                resolvePromise = null,
                docState = null;

            self._execAction('_goMix', 0, arguments);

            // If the animation duration is set to 0ms,
            // Or the container is hidden
            // then abort animation

            if (
                !self.animation.duration ||
                !_h.isVisible(self._dom.container)
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
                // changing layout, then abort

                shouldAnimate = false;
            }

            if (
                !self._userPromise ||
                self._userPromise.isResolved
            ) {
                // If no promise exists, then assign one

                self._userPromise = _h.getPromise(self.libraries);
            }

            if (typeof self.callbacks.onMixStart === 'function') {
                self.callbacks.onMixStart.call(self._dom.container, operation.startState, operation.newState, self);
            }

            _h.trigger(self._dom.container, 'mixStart', {
                state: operation.startState,
                futureState: operation.newState,
                instance: self
            });

            if (shouldAnimate && MixItUp.prototype._has._transitions) {
                // If we should animate and the platform supports
                // transitions, go for it

                self._isMixing = true;

                if (window.pageYOffset !== operation.docState.scrollTop) {
                    window.scrollTo(operation.docState.scrollLeft, operation.docState.scrollTop);
                }

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
         * _getStartMixData
         * @since 2.0.0
         * @param {Operation} operation
         * @void
         */

        _getStartMixData: function(operation) {
            var self = this,
                parentStyle = window.getComputedStyle(self._dom.parent),
                target = null,
                data = {},
                i = -1,
                boxSizing = parentStyle.boxSizing || parentStyle[self._vendor + 'BoxSizing'];

            self._incPadding = (boxSizing === 'border-box');

            self._execAction('_getStartMixData', 0);

            for (i = 0; target = operation.show[i]; i++) {
                data = target._getPosData();

                operation.showPosData[i] = {
                    startPosData: data
                };
            }

            for (i = 0; target = operation.toHide[i]; i++) {
                data = target._getPosData();

                operation.toHidePosData[i] = {
                    startPosData: data
                };
            }

            operation.startHeight = self._incPadding ?
                self._dom.parent.offsetHeight :
                self._dom.parent.offsetHeight -
                    parseFloat(parentStyle.paddingTop) -
                    parseFloat(parentStyle.paddingBottom) -
                    parseFloat(parentStyle.borderTop) -
                    parseFloat(parentStyle.borderBottom);

            operation.startWidth = self._incPadding ?
                self._dom.parent.offsetWidth :
                self._dom.parent.offsetWidth -
                    parseFloat(parentStyle.paddingLeft) -
                    parseFloat(parentStyle.paddingRight) -
                    parseFloat(parentStyle.borderLeft) -
                    parseFloat(parentStyle.borderRight);

            self._execAction('_getStartMixData', 1);
        },

        /**
         * _setInter
         * @since 2.0.0
         * @param {Operation} operation
         * @void
         */

        _setInter: function(operation) {
            var self = this,
                target = null,
                i = -1;

            self._execAction('_setInter', 0);

            for (i = 0; target = operation.toShow[i]; i++) {
                target._show();
            }

            if (operation.willChangeLayout) {
                _h.removeClass(self._dom.container, self.layout.containerClass);
                _h.addClass(self._dom.container, operation.newContainerClass);
            }

            self._execAction('_setInter', 1);
        },

        /**
         * _getInterMixData
         * @since 2.0.0
         * @param {Operation} operation
         * @void
         */

        _getInterMixData: function(operation) {
            var self = this,
                target = null,
                i = -1;

            self._execAction('_getInterMixData', 0);

            if (operation) {
                for (i = 0; target = operation.show[i]; i++) {
                    operation.showPosData[i].interPosData = target._getPosData();
                }

                for (i = 0; target = operation.toHide[i]; i++) {
                    operation.toHidePosData[i].interPosData = target._getPosData();
                }

                self._execAction('_getInterMixData', 1);

                return;
            }

            for (i = 0; target = self._show[i]; i++) {
                target._interPosData = target._getPosData();
            }

            for (i = 0; target = self._toHide[i]; i++) {
                target._interPosData = target._getPosData();
            }
        },

        /**
         * _setFinal
         * @since 2.0.0
         * @param {Operation} operation
         * @void
         */

        _setFinal: function(operation) {
            var self = this,
                target = null,
                i = -1;

            self._execAction('_setFinal', 0);

            operation.willSort && self._printSort(false, operation);

            for (i = 0; target = operation.toHide[i]; i++) {
                target._hide();
            }

            self._execAction('_setFinal', 1);
        },

        /**
         * _getFinalMixData
         * @since 2.0.0
         * @param {Operation} operation
         * @void
         */

        _getFinalMixData: function(operation) {
            var self = this,
                parentStyle = window.getComputedStyle(self._dom.parent),
                target = null,
                i = -1;

            self._execAction('_getFinalMixData', 0);

            for (i = 0; target = operation.show[i]; i++) {
                operation.showPosData[i].finalPosData = target._getPosData();
            }

            for (i = 0; target = operation.toHide[i]; i++) {
                operation.toHidePosData[i].finalPosData = target._getPosData();
            }

            operation.newHeight = self._incPadding ?
                self._dom.parent.offsetHeight :
                self._dom.parent.offsetHeight -
                    parseFloat(parentStyle.paddingTop) -
                    parseFloat(parentStyle.paddingBottom) -
                    parseFloat(parentStyle.borderTop) -
                    parseFloat(parentStyle.borderBottom);

            operation.newWidth = self._incPadding ?
                self._dom.parent.offsetWidth :
                self._dom.parent.offsetWidth -
                    parseFloat(parentStyle.paddingLeft) -
                    parseFloat(parentStyle.paddingRight) -
                    parseFloat(parentStyle.borderLeft) -
                    parseFloat(parentStyle.borderRight);

            if (operation.willSort) {
                self._printSort(true, operation);
            }

            for (i = 0; target = operation.toShow[i]; i++) {
                target._hide();
            }

            for (i = 0; target = operation.toHide[i]; i++) {
                target._show();
            }

            if (operation.willChangeLayout && self.animation.animateChangeLayout) {
                _h.removeClass(self._dom.container, operation.newContainerClass);
                _h.addClass(self._dom.container, self.layout.containerClass);
            }

            self._execAction('_getFinalMixData', 1);
        },

        /**
         *  _getTweenData
         * since 3.0.0
         * @param {Operation} operation
         */

        _getTweenData: function(operation) {
            var self = this,
                target = null,
                posData = null,
                effectNames = Object.getOwnPropertyNames(self._effectsIn),
                effectName = '',
                effect = null,
                i = -1,
                j = -1;

            for (i = 0; target = operation.show[i]; i++) {
                posData             = operation.showPosData[i];
                posData.posIn       = new StyleData();
                posData.posOut      = new StyleData();
                posData.tweenData   = new StyleData();

                // Process x and y

                posData.posIn.x = target._isShown ? posData.startPosData.x - posData.interPosData.x : 0;
                posData.posIn.y = target._isShown ? posData.startPosData.y - posData.interPosData.y : 0;
                posData.posOut.x = posData.finalPosData.x - posData.interPosData.x;
                posData.posOut.y = posData.finalPosData.y - posData.interPosData.y;

                // Process display

                posData.posIn.display = target._isShown ? self.layout.display : 'none';
                posData.posOut.display = self.layout.display;

                // Process opacity

                posData.posIn.opacity = target._isShown ? 1 : self._effectsIn.opacity;
                posData.posOut.opacity = 1;
                posData.tweenData.opacity = posData.posOut.opacity - posData.posIn.opacity;

                // Adjust x and y if not nudging

                if (!target._isShown && !self.animation.nudgeOut) {
                    posData.posIn.x = posData.posOut.x;
                    posData.posIn.y = posData.posOut.y;
                }

                posData.tweenData.x = posData.posOut.x - posData.posIn.x;
                posData.tweenData.y = posData.posOut.y - posData.posIn.y;

                // Process width, height, and margins

                if (self.animation.animateResizeTargets) {
                    posData.posIn.width = posData.startPosData.width;
                    posData.posIn.height = posData.startPosData.height;

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

                    posData.posOut.width = posData.finalPosData.width;
                    posData.posOut.height = posData.finalPosData.height;

                    posData.posOut.marginRight =
                        -(posData.finalPosData.width - posData.interPosData.width) +
                        (posData.finalPosData.marginRight * 1);

                    posData.posOut.marginBottom =
                        -(posData.finalPosData.height - posData.interPosData.height) +
                        (posData.finalPosData.marginBottom * 1);

                    posData.tweenData.width = posData.posOut.width - posData.posIn.width;
                    posData.tweenData.height = posData.posOut.height - posData.posIn.height;
                    posData.tweenData.marginRight = posData.posOut.marginRight - posData.posIn.marginRight;
                    posData.tweenData.marginBottom = posData.posOut.marginBottom - posData.posIn.marginBottom;
                }

                // Process transforms

                for (j = 0; effectName = effectNames[j]; j++) {
                    effect = self._effectsIn[effectName];

                    if (!(effect instanceof TransformData) || !effect.value) continue;

                    posData.posIn[effectName].value = effect.value;
                    posData.posOut[effectName].value = 0;
                    posData.tweenData[effectName].value = posData.posOut[effectName].value - posData.posIn[effectName].value;

                    posData.posIn[effectName].unit =
                        posData.posOut[effectName].unit =
                        posData.tweenData[effectName].unit =
                        effect.unit;
                }
            }

            for (i = 0; target = operation.toHide[i]; i++) {
                posData             = operation.toHidePosData[i];
                posData.posIn       = new StyleData();
                posData.posOut      = new StyleData();
                posData.tweenData   = new StyleData();

                // Process x and y

                posData.posIn.x = target._isShown ? posData.startPosData.x - posData.interPosData.x : 0;
                posData.posIn.y = target._isShown ? posData.startPosData.y - posData.interPosData.y : 0;
                posData.posOut.x = self.animation.nudgeOut ? 0 : posData.posIn.x;
                posData.posOut.y = self.animation.nudgeOut ? 0 : posData.posIn.y;
                posData.tweenData.x = posData.posOut.x - posData.posIn.x;
                posData.tweenData.y = posData.posOut.y - posData.posIn.y;

                // Process display

                posData.posIn.display = self.layout.display;
                posData.posOut.display = 'none';

                // Process opacity

                posData.posIn.opacity = 1;
                posData.posOut.opacity = self._effectsOut.opacity;
                posData.tweenData.opacity = posData.posOut.opacity - posData.posIn.opacity;

                // Process transforms

                for (j = 0; effectName = effectNames[j]; j++) {
                    effect = self._effectsOut[effectName];

                    if (!(effect instanceof TransformData) || !effect.value) continue;

                    posData.posIn[effectName].value = 0;
                    posData.posOut[effectName].value = effect.value;
                    posData.tweenData[effectName].value = posData.posOut[effectName].value - posData.posIn[effectName].value;

                    posData.posIn[effectName].unit =
                        posData.posOut[effectName].unit =
                        posData.tweenData[effectName].unit =
                        effect.unit;
                }
            }
        },

        /**
         * _moveTargets
         * @since 3.0.0
         * @param {Operation} operation
         * @void
         */

        _moveTargets: function(operation) {
            var self = this,
                target = null,
                posData = null,
                checkProgress = function() {
                    // TODO: Can we find an alternative to this? _h.bind doesn't
                    // allow the passing of an argument and we don't want to
                    // make a function within the loops below. Even this
                    // nested function will cause a perf hit.

                    self._checkProgress(operation);
                },
                i = -1;

            // TODO: this is an extra loop in addition to the calcs
            // done in getOperation, can we get around somehow?

            for (i = 0; target = operation.show[i]; i++) {
                posData = operation.showPosData[i];

                target._show();

                target._move({
                    posIn: posData.posIn,
                    posOut: posData.posOut,
                    hideOrShow: target._isShown ? false : 'show', // TODO: can we not mix types here?
                    staggerIndex: i,
                    callback: checkProgress
                });
            }

            for (i = 0; target = operation.toHide[i]; i++) {
                posData = operation.toHidePosData[i];

                target._move({
                    posIn: posData.posIn,
                    posOut: posData.posOut,
                    hideOrShow: 'hide',
                    staggerIndex: i,
                    callback: checkProgress
                });
            }

            if (self.animation.animateResizeContainer) {
                self._dom.parent.style[MixItUp.prototype._transitionProp] =
                    'height ' + self.animation.duration + 'ms ease, ' +
                    'width ' + self.animation.duration + 'ms ease, ';

                requestAnimationFrame(function() {
                    self._dom.parent.style.height = operation.newHeight + 'px';
                    self._dom.parent.style.width = operation.newWidth + 'px';
                });
            }

            if (operation.willChangeLayout) {
                _h.removeClass(self._dom.container, self.layout.containerClass);
                _h.addClass(self._dom.container, operation.newContainerClass);
            }
        },

        /**
         * _checkProgress
         * @since 2.0.0
         * @param {Operation} operation
         * @void
         */

        _checkProgress: function(operation) {
            var self = this;

            self._targetsDone++;

            if (self._targetsBound === self._targetsDone) {
                self._cleanUp(operation);
            }
        },

        /**
         * _cleanUp
         * @since 2.0.0
         * @param {Operation} operation
         * @void
         */

        _cleanUp: function(operation) {
            var self = this,
                target = null,
                firstInQueue = null,
                i = -1;

            self._isMixing = false;

            self._execAction('_cleanUp', 0);

            self._targetsMoved = 0;
            self._targetsImmovable = 0;
            self._targetsBound = 0;
            self._targetsDone = 0;

            for (i = 0; target = operation.show[i]; i++) {
                target._cleanUp();

                target._show();
                target._isShown = true;
            }

            for (i = 0; target = operation.toHide[i]; i++) {
                target._cleanUp();

                target._hide();
                target._isShown = false;
            }

            if (operation.willSort) {
                self._printSort(operation);
            }

            if (self.animation.animateResizeContainer) {
                self._dom.parent.style[MixItUp.prototype._transitionProp] = '';
                self._dom.parent.style.height = '';
                self._dom.parent.style.width = '';
            }

            if (operation.willChangeLayout) {
                _h.removeClass(self._dom.container, operation.startContainerClass);
                _h.addClass(self._dom.container, operation.newContainerClass);
            }

            self._isRemoving = false;

            self._state = operation.newState;
            self._lastOperation = operation;

            if (typeof self.callbacks.onMixEnd === 'function') {
                self.callbacks.onMixEnd.call(self._dom.el, self._state, self);
            }

            _h.trigger(self._dom.container, 'mixEnd', {
                state: self._state,
                instance: self
            });

            if (self._queue.length) {
                self._execAction('_queue', 0);

                firstInQueue = self._queue.shift();

                self._userPromise = firstInQueue[3];

                self.multiMix.apply(self, firstInQueue);
            }

            self._userPromise.resolve(self._state);
            self._userPromise.isResolved = true;

            self._execAction('_cleanUp', 1);
        },

        /**
         * _getDelay
         * @since 2.0.0
         * @param {Number} index
         * @return {Number}
         *
         * Allow for the manipulation of target indices via a user specified function
         */

        _getDelay: function(index) {
            var self = this,
                delay = -1;

            if (typeof self.animation.staggerSequence === 'function') {
                index = self.animation.staggerSequence.call(self, index, self._state);
            }

            delay = !!self._staggerDuration ? index * self.animation.staggerDuration : 0;

            return self._execFilter('_getDelay', delay, arguments);
        },

        /**
         * _parseMultiMixArgs
         * @since 2.0.0
         * @param {Array} args
         * @return {Object}
         */

        _parseMultiMixArgs: function(args) {
            var self = this,
                output = {
                    command: null,
                    animate: self.animation.enable,
                    callback: null
                },
                arg = null,
                i = -1;

            for (i = 0; i < args.length; i++) {
                arg = args[i];

                if (arg !== null) {
                    if (typeof arg === 'object' || typeof arg === 'string') {
                        output.command = arg;
                    } else if (typeof arg === 'boolean') {
                        output.animate = arg;
                    } else if (typeof arg === 'function') {
                        output.callback = arg;
                    }
                }
            }

            return self._execFilter('_parseMultiMixArgs', output, arguments);
        },

        /**
         * _parseInsertArgs
         * @since 2.0.0
         * @param {Array} args
         * @return {Object}
         */

        _parseInsertArgs: function(args) {
            var self = this,
                output = {
                    index: 0,
                    collection: [],
                    multiMix: {
                        filter: self._state.activeFilter
                    },
                    position: '',
                    sibling: null,
                    callback: null
                },
                arg = null,
                i = -1;

            for (i = 0; i < args.length; i++) {
                arg = args[i];

                if (typeof arg === 'number') {
                    output.index = arg;
                } else if (typeof arg === 'string') {
                    output.position = arg;
                } else if (typeof arg === 'object' && _h.isElement(arg)) {
                    !output.collection.length ?
                        (output.collection = [arg]) :
                        (output.sibling = arg);
                } else if (typeof arg === 'object' && arg !== null && arg.length) {
                    !output.collection.length ?
                        (output.collection = arg) :
                        output.sibling = arg[0];
                } else if (
                    typeof arg === 'object' &&
                    arg !== null &&
                    arg.childNodes &&
                    arg.childNodes.length
                ) {
                    !output.collection.length ?
                        output.collection = Array.prototype.slice.call(arg.childNodes) :
                        output.sibling = arg.childNodes[0];
                } else if (typeof arg === 'object' && arg !== null) {
                    output.multiMix = arg;
                } else if (typeof arg === 'boolean' && !arg) {
                    output.multiMix = false;
                } else if (typeof arg === 'function') {
                    output.callback = arg;
                }
            }

            if (!output.collection.length && _h.canReportErrors(self)) {
                throw new Error('[MixItUp] No elements were passed to "insert"');
            }

            return self._execFilter('_parseInsertArgs', output, arguments);
        },

        /**
         * _parseRemoveArgs
         * @since 3.0.0
         * @param {Array} args
         * @return {Object}
         */

        _parseRemoveArgs: function(args) {
            var self = this,
                output = {
                    index: -1,
                    selector: '',
                    collection: [],
                    callback: null
                },
                arg = null,
                i = -1;

            for (i = 0; i < args.length; i++) {
                arg = args[i];

                switch (typeof arg) {
                    case 'number':
                        output.index = arg;

                        break;
                    case 'string':
                        output.selector = arg;

                        break;
                    case 'object':
                        if (arg && arg.length) {
                            output.collection = arg;
                        } else if (_h.isElement(arg)) {
                            output.collection = [arg];
                        }

                        break;
                    case 'function':
                        output.callback = arg;

                        break;
                }
            }

            return self._execFilter('_parseRemoveArgs', output, arguments);
        },

        /**
         * _deferMix
         * @since 3.0.0
         * @param {Mixed[]} args
         * @param {Object} parsedArgs
         * @return {Promise} -> {State}
         */

        _deferMix: function(args, parsedArgs) {
            var self = this;

            self._userPromise = _h.getPromise(self.libraries);

            if (self.animation.queue && self._queue.length < self.animation.queueLimit) {
                args[3] = self._userPromise;

                self._queue.push(args);

                (self.controls.enable && !self._isClicking) && self._updateControls(parsedArgs.command);

                self._execAction('multiMixQueue', 1, args);
            } else {
                self._userPromise.resolve(self._state); // TODO: include warning that was busy in state?
                self._userPromise.isResolved = true;

                if (typeof self.callbacks.onMixBusy === 'function') {
                    self.callbacks.onMixBusy.call(self._dom.container, self._state, self);
                }

                _h.trigger(self._dom.container, 'mixBusy', {
                    state: self._state,
                    instance: self
                });

                self._execAction('multiMixBusy', 1, args);
            }

            return self._userPromise.promise;
        },

        /* Public Methods
        ---------------------------------------------------------------------- */

        /**
         * init
         * @since 3.0.0
         * @return {Promise} -> {State}
         */

        init: function() {
           var self = this;

           return self.filter(self._state.activeFilter);
        },

        /**
         * show
         * @since 3.0.0
         * @return {Promise} -> {State}
         */

        show: function() {
            var self = this;

            return self.filter('all');
        },

        /**
         * hide
         * @since 3.0.0
         * @return {Promise} -> {State}
         */

        hide: function() {
            var self = this;

            return self.filter('none');
        },

        /**
         * isMixing
         * @since 2.0.0
         * @return {Boolean}
         */

        isMixing: function() {
            var self = this;

            return self._isMixing;
        },

        /**
         * filter
         * @since 2.0.0
         * @shorthand self.multiMix
         * @param {Array} arguments
         * @return {Promise} -> {State}
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
         * sort
         * @since 2.0.0
         * @shorthand self.multiMix
         * @param {Array} arguments
         * @return {Promise} -> {State}
         */

        sort: function() {
            var self = this,
                args = self._parseMultiMixArgs(arguments);

            return self.multiMix({
                sort: args.command
            }, args.animate, args.callback);
        },

        /**
         * changeLayout
         * @since 2.0.0
         * @shorthand self.multiMix
         * @param {Mixed[]} arguments
         * @return {Promise} -> {State}
         */

        changeLayout: function() {
            var self = this;

            // TODO: map to multiMix
        },

        /**
         * getOperation
         * @since 3.0.0
         * @param {Command} command
         * @return {Operation}
         */

        getOperation: function(command) {
            var self = this,
                sortCommand = command.sort,
                filterCommand = command.filter,
                changeLayoutCommand = command.changeLayout,
                operation = new Operation();

            operation.command = command;
            operation.startState = self._state;

            self._execAction('getOperation', 0, operation);

            if (self._isMixing) {
                return null;
            }

            // TODO: passing the operation rather than arguments
            // to the action is non-standard here but essential as
            // we require a reference to original. Perhaps a "pre"
            // filter is the best alternative

            if (sortCommand) {
                operation.startSortString = operation.startState.activeSort;
                operation.newSort = self._parseSort(sortCommand);
                operation.newSortString = sortCommand;

                if (sortCommand !== operation.startState.activeSortString || sortCommand === 'random') {
                    operation.willSort = true;

                    self._sort(operation);
                }
            }

            if (filterCommand) {
                filterCommand = (filterCommand === 'all') ?
                    self.selectors.target : filterCommand;
            }

            // TODO: we need a definitve object for filter operations,
            // which accomodates selectors, elements, hide vs show etc.

            // TODO: insert/remove ops would be represented here too.
            // All others would be extended in via hooks

            operation.startFilter = operation.startState.activeFilter;
            operation.newFilter = filterCommand || operation.startState.activeFilter;

            self._filter(operation);

            if (changeLayoutCommand !== undf) {
                operation.startContainerClass = operation.startState.activeContainerClass;
                operation.newContainerClass = typeof changeLayoutCommand === 'string' ?
                    changeLayoutCommand : '';

                if (
                    operation.newContainerClass !== operation.startState.activeContainerClass
                ) {
                    operation.willChangeLayout = true;
                }
            }

            // Populate the operation's position data

            self._getStartMixData(operation);
            self._setInter(operation);

            operation.docState = _h.getDocumentState();

            self._getInterMixData(operation);
            self._setFinal(operation);
            self._getFinalMixData(operation);

            self._parseEffects();

            self._getTweenData(operation);

            operation.newState = self._buildState(operation);

            return self._execFilter('getOperation', operation, arguments);
        },

        /**
         * multiMix
         * @since 2.0.0
         * @param {Mixed[]} arguments
         * @return {Promise} -> {State}
         */

        multiMix: function() {
            var self = this,
                operation = null,
                args = self._parseMultiMixArgs(arguments);

            self._execAction('multiMix', 0, arguments);

            if (!self._isMixing) {
                operation = self.getOperation(args.command);

                if (self.controls.enable && !self._isClicking && !self._isRemoving) {
                    self._dom.filterToggleButtons.length && self._buildToggleArray();

                    // TODO: what about "live" toggles?

                    self._updateControls(operation.command);
                }

                (self._queue.length < 2) && (self._isClicking = false);

                self._userCallback = null;

                if (args.callback) self._userCallback = args.callback;

                self._execAction('multiMix', 1, arguments);

                return self._goMix(
                    (args.animate ^ self.animation.enable) ?
                        args.animate :
                        self.animation.enable,
                    operation
                );
            } else {
                return self._deferMix(arguments, args);
            }
        },

        /**
         * tween
         * @since 3.0.0
         * @param {Operation} operation
         * @param {Float} multiplier
         * @void
         */

        tween: function(operation, multiplier) {
            var self = this,
                target = null,
                posData = null,
                posIn = null,
                posOut = null,
                tweenData = null,
                propertyName = '',
                toHideIndex = -1,
                i = -1,
                j = -1;

            multiplier = Math.min(multiplier, 1);
            multiplier = Math.max(multiplier, 0);

            for (i = 0; target = operation.show[i]; i++) {
                posData = operation.showPosData[i];

                target._applyTween(posData, multiplier);
            }

            for (i = 0; target = operation.hide[i]; i++) {
                if (target._dom.el.style.display) {
                    target._hide();
                }

                if ((toHideIndex = operation.toHide.indexOf(target)) > -1) {
                    posData = operation.toHidePosData[toHideIndex];

                    if (!target._dom.el.style.display) {
                        target._show();
                    }

                    target._applyTween(posData, multiplier);
                }
            }
        },

        /**
         * insert
         * @since 2.0.0
         * @param {Array} arguments
         * @return {Promise} -> {State}
         */

        insert: function() {
            var self = this,
                args = self._parseInsertArgs(arguments),
                callback = (typeof args.callback === 'function') ? args.callback : null,
                frag = doc.createDocumentFragment(),
                target = null,
                nextSibling = (function() {
                    if (args.position === 'before') {
                        return args.sibling;
                    }

                    if (args.position === 'after') {
                        return args.sibling.nextElementSibling || null;
                    }

                    if (self._targets.length) {
                        return (args.index < self._targets.length || !self._targets.length) ?
                            self._targets[args.index]._dom.el :
                            self._targets[self._targets.length - 1]._dom.el.nextElementSibling;
                    } else {
                        return self._dom.parent.children.length ? self._dom.parent.children[0] : null;
                    }
                })(),
                el = null,
                i = -1;

            // TODO: insert and remove must be queuable independently of their multimix calls

            // TODO: throw error if user attempts to insert element that is already a target

            self._execAction('insert', 0, arguments);

            if (args.collection) {
                for (i = 0; el = args.collection[i]; i++) {
                    frag.appendChild(el);
                    frag.appendChild(doc.createTextNode(' '));

                    if (!_h.isElement(el) || !el.matches(self.selectors.target)) continue;

                    target = new Target();

                    target._init(el, self);

                    self._targets.splice(args.index, 0, target);
                }

                self._dom.parent.insertBefore(frag, nextSibling);
            }

            self._currentOrder = self._origOrder = self._targets;

            self._execAction('insert', 1, arguments);

            if (typeof args.multiMix === 'object') {
                return self.multiMix(args.multiMix, callback);
            }
        },

        /**
         * insertBefore
         * @since 3.0.0
         * @shorthand self.insert
         * @param {Array} arguments
         * @return {Promise} -> {State}
         */

        insertBefore: function() {
            var self = this,
                args = self._parseInsertArgs(arguments);

            return self.insert(0, args.collection, args.multiMix, 'before', args.sibling, args.callback);
        },

        /**
         * insertAfter
         * @since 3.0.0
         * @shorthand self.insert
         * @param {Array} arguments
         * @return {Promise} -> {State}
         */

        insertAfter: function() {
            var self = this,
                args = self._parseInsertArgs(arguments);

            return self.insert(0, args.collection, args.multiMix, 'after', args.sibling, args.callback);
        },

        /**
         * prepend
         * @since 2.0.0
         * @shorthand self.insert
         * @param {Array} arguments
         * @return {Promise} -> {State}
         */

        prepend: function() {
            var self = this,
                args = self._parseInsertArgs(arguments);

            return self.insert(0, args.collection, args.multiMix, args.callback);
        },

        /**
         * append
         * @since 2.0.0
         * @shorthand self.insert
         * @param {array} arguments
         * @return {Promise} -> {State}
         */

        append: function() {
            var self = this,
                args = self._parseInsertArgs(arguments);

            return self.insert(self._state.totalTargets, args.collection, args.multiMix, args.callback);
        },

        /**
         * remove
         * @since 3.0.0
         * @param {Array} arguments
         * @return {Promise} -> {State}
         */

        remove: function() {
            var self = this,
                args = self._parseRemoveArgs(arguments),
                activeFilterStart = '',
                multiMix = {
                    filter: {
                        hide: null
                    }
                },
                target = null,
                i = -1,
                cleanUp = function(state) {
                    if (args.collection.length) {
                        for (i = 0; target = self._targets[i]; i++) {
                            if (args.collection.indexOf(target._dom.el) > -1) {
                                _h.deleteElement(target._dom.el);

                                self._targets.splice(i, 1);

                                i--;
                            }
                        }
                    } else if (args.index > -1 && self._targets[args.index]) {
                        _h.deleteElement(self._targets[args.index]._dom.el);

                        self._targets.splice(args.index, 1);
                    } else if (args.selector) {
                        for (i = 0; target = self._targets[i]; i++) {
                            if (target._dom.el.matches(args.selector)) {
                                _h.deleteElement(target._dom.el);

                                self._targets.splice(i, 1);

                                i--;
                            }
                        }
                    }

                    self._currentOrder = self._origOrder = self._targets;

                    self._activeFilter = activeFilterStart;
                    self._filter();

                    self._buildState();

                    return self._state;
                };

            // TODO: this method needs a major refactor

            self._execAction('remove', 0, arguments);

            activeFilterStart = self.getState().activeFilter;

            self._isRemoving = true;

            if (args.collection.length) {
                multiMix.filter.hide = args.collection;
            } else if (args.index > -1 && self._targets[args.index]) {
                multiMix.filter.hide = self._targets[args.index]._dom.el;
            } else if (args.selector) {
                multiMix.filter.hide = args.selector;
            }

            self._execAction('remove', 1, arguments);

            return self.multiMix(multiMix, args.callback)
                .then(function() {
                    cleanUp();
                });

            // TODO: use a normal callback here for browser support!
        },

        /**
         * getOption
         * @since 2.0.0
         * @param {String} string
         * @return {Mixed}
         */

        getOption: function(string) {
            var self = this;

            // TODO
        },

        /**
         * setOptions
         * @since 2.0.0
         * @param {Object} config
         */

        setOptions: function(config) {
            var self = this;

            self._execAction('setOptions', 0, arguments);

            // TODO

            self._execAction('setOptions', 1, arguments);
        },

        /**
         * getState
         * @since 2.0.0
         * @return {State}
         */

        getState: function() {
            var self = this;

            return self._execFilter('getState', self._state, self);
        },

        /**
         * forceRefresh
         * @since 2.1.2
         */

        forceRefresh: function() {
            var self = this;

            self._indexTargets();
        },

        /**
         * destroy
         * @since 2.0.0
         * @param {Boolean} hideAll
         * @void
         */

        destroy: function(hideAll) {
            var self = this,
                target = null,
                button = null,
                i = 0;

            self._execAction('destroy', 0, arguments);

            self._unbindEvents();

            for (i = 0; target = self._targets[i]; i++) {
                hideAll && target._hide();

                target._unbindEvents();
            }

            for (i = 0; button = self._dom.allButtons[i]; i++) {
                _h.removeClass(button, self.controls.activeClass);
            }

            if (self._dom.container.id.indexOf('MixItUp') > -1) {
                // TODO: use a regex

                self._dom.container.id = '';
            }

            delete MixItUp.prototype._instances[self.id];

            self._execAction('destroy', 1, arguments);
        }
    });

    /* Target
    ---------------------------------------------------------------------- */

    /**
     * Target
     * @constructor
     * @since 3.0.0
     */

    Target = function() {
        var self = this;

        self._execAction('_constructor', 0, arguments);

        _h.extend(self, {
            _sortString: '',
            _mixer: null,
            _callback: null,
            _isShown: false,
            _isBound: false,
            _isExcluded: false,
            _handler: null,

            _dom: {
                el: null
            }
        });

        self._execAction('_constructor', 1, arguments);

        _h.seal(this);
        _h.seal(this.dom);
    };

    /**
     * Target.prototype
     * @prototype
     * @extends basePrototype
     * @since 3.0.0
     */

    Target.prototype = Object.create(basePrototype);

    _h.extend(Target.prototype, {
        constructor: Target,

        _actions: {},
        _filters: {},

        /* Private Instance Methods
        ---------------------------------------------------------------------- */

        /**
         * _init
         * @since 3.0.0
         * @param {Object} element
         * @param {Object} mixer
         * @void
         *
         * Initialize a newly instantiated Target
         */

        _init: function(el, mixer) {
            var self = this;

            self._execAction('_init', 0, arguments);

            self._mixer = mixer;

            self._cacheDom(el);

            self._bindEvents();

            !!self._dom.el.style.display && (self._isShown = true);

            self._execAction('_init', 1, arguments);
        },

        /**
         * cacheDom
         * @since 3.0.0
         * @param {Object} element
         * @void
         *
         * Cache any DOM elements from the target context inwards
         */

        _cacheDom: function(el) {
            var self = this;

            self._execAction('_cacheDom', 0, arguments);

            self._dom.el = el;

            self._execAction('_cacheDom', 1, arguments);
        },

        /**
         * _getSortString
         * @since 3.0.0
         * @param {String} attributeName
         * @void
         */

        _getSortString: function(attributeName) {
            var self = this,
                value = self._dom.el.getAttribute('data-' + attributeName) || '';

            self._execAction('_getSortString', 0, arguments);

            value = isNaN(value * 1) ?
                value.toLowerCase() :
                value * 1;

            self._sortString = value;

            self._execAction('_getSortString', 1, arguments);
        },

        /**
         * _show
         * @since 3.0.0
         * @param {Boolean} animate
         * @void
         */

        _show: function(animate) {
            var self = this;

            self._execAction('_show', 0, arguments);

            !self._dom.el.style.display && (self._dom.el.style.display = self._mixer.layout.display);

            self._execAction('_show', 1, arguments);
        },

        /**
         * _hide
         * @since 3.0.0
         * @param {Boolean} animate
         * @void
         */

        _hide: function(animate) {
            var self = this;

            self._execAction('_hide', 0, arguments);

            self._dom.el.style.display = '';

            self._execAction('_hide', 1, arguments);
        },

        /**
         * _move
         * @since 3.0.0
         * @param {Object} options
         * @void
         */

        _move: function(options) {
            var self = this;

            self._execAction('_move', 0, arguments);

            if (!self._isExcluded) {
                self._mixer._targetsMoved++;
            }

            self._applyStylesIn({
                posIn: options.posIn,
                hideOrShow: options.hideOrShow
            });

            requestAnimationFrame(function() {
                self._applyStylesOut({
                    posIn: options.posIn,
                    posOut: options.posOut,
                    hideOrShow: options.hideOrShow,
                    staggerIndex: options.staggerIndex,
                    duration: options.duration,
                    callback: options.callback
                });
            });

            self._execAction('_move', 1, arguments);
        },

        /**
         * _applyTween
         * @since 3.0.0
         * @param {Object} posData
         * @param {Number} multiplier
         * @void
         */

        _applyTween: function(posData, multiplier) {
            var self = this,
                propertyName = '',
                tweenData = null,
                posIn = posData.posIn,
                currentTransformValues = [],
                currentValues = new StyleData(),
                i = -1;

            currentValues.display = self._mixer.layout.display;
            currentValues.x = posIn.x;
            currentValues.y = posIn.y;

            if (multiplier === 0) {
                currentValues.display = 'none';

                posIn.display === currentValues.display && self._hide();
            } else if (!self._dom.el.style.display) {
                self._show();
            }

            for (i = 0; propertyName = self._mixer._tweenable[i]; i++) {
                tweenData = posData.tweenData[propertyName];

                if (propertyName === 'x') {
                    if (!tweenData) continue;

                    currentValues.x = posIn.x + (tweenData * multiplier);
                } else if (propertyName === 'y') {
                    if (!tweenData) continue;

                    currentValues.y = posIn.y + (tweenData * multiplier);
                } else if (tweenData instanceof TransformData) {
                    if (!tweenData.value) continue;

                    currentValues[propertyName].value = posIn[propertyName].value + (tweenData.value * multiplier);
                    currentValues[propertyName].unit = tweenData.unit;

                    currentTransformValues.push(propertyName + '(' + currentValues[propertyName].value + tweenData.unit + ')');
                } else if (propertyName !== 'display') {
                    if (!tweenData) continue;

                    currentValues[propertyName] = posIn[propertyName] + (tweenData * multiplier);

                    self._dom.el.style[propertyName] = currentValues[propertyName];
                }
            }

            if (currentValues.x || currentValues.y) {
                currentTransformValues.unshift('translate(' + currentValues.x + 'px, ' + currentValues.y + 'px)');
            }

            if (currentTransformValues.length) {
                self._dom.el.style[MixItUp.prototype._transformProp] = currentTransformValues.join(' ');
            }
        },

        /**
         * _applyStylesIn
         * @param {Object} options
         * @void
         *
         * Applies starting styles to a target element
         * before any transition is applied
         */

        _applyStylesIn: function(options) {
            var self = this,
                posIn = options.posIn,
                isFading = self._mixer._effectsIn.opacity !== 1,
                transformValues = [];

            transformValues.push('translate(' + posIn.x + 'px, ' + posIn.y + 'px)');

            if (!options.hideOrShow && self._mixer.animation.animateResizeTargets) {
                self._dom.el.style.width        = posIn.width + 'px';
                self._dom.el.style.height       = posIn.height + 'px';
                self._dom.el.style.marginRight  = posIn.marginRight + 'px';
                self._dom.el.style.marginBottom = posIn.marginBottom + 'px';
            }

            isFading && (self._dom.el.style.opacity = posIn.opacity);

            if (options.hideOrShow === 'show') {
                transformValues = transformValues.concat(self._mixer._transformIn);
            }

            self._dom.el.style[MixItUp.prototype._transformProp] = transformValues.join(' ');
        },

        /**
         * _applyStylesOut
         * @param {Object} options
         * @void
         *
         * Applies a transition and the corresponding styles to
         * transition towards
         */

        _applyStylesOut: function(options) {
            var self            = this,
                transitionRules = [],
                transformValues = [],
                isResizing      = self._mixer.animation.animateResizeTargets,
                isFading        = self._mixer._effectsIn.opacity !== undf;

            // Build the transition rules

            transitionRules.push(self._writeTransitionRule(
                MixItUp.prototype._transformRule,
                options.staggerIndex
            ));

            if (options.hideOrShow) {
                transitionRules.push(self._writeTransitionRule(
                    'opacity',
                    options.staggerIndex,
                    options.duration
                ));
            }

            if (
                self._mixer.animation.animateResizeTargets &&
                options.posOut.display
            ) {
                transitionRules.push(self._writeTransitionRule(
                    'width',
                    options.staggerIndex,
                    options.duration
                ));

                transitionRules.push(self._writeTransitionRule(
                    'height',
                    options.staggerIndex,
                    options.duration
                ));

                transitionRules.push(self._writeTransitionRule(
                    'margin',
                    options.staggerIndex,
                    options.duration
                ));
            }

            // Based on the data we have, if the element will
            // not transition in any way, abort here

            if (!self._willTransition(options)) {
                self._mixer._targetsImmovable++;

                if (self._mixer._targetsMoved === self._mixer._targetsImmovable) {
                    // If the total targets moved is equal to the
                    // number of immovable targets, the operation
                    // should be considered finished

                    self._mixer._cleanUp();
                }

                return;
            }

            // If the target will transition in some fasion,
            // assign a callback function

            self._callback = options.callback;

            // As long as the target is not excluded, increment
            // the total number of targets bound

            !self._isExcluded && self._mixer._targetsBound++;

            // Tag the target as bound to differentiate from transitionEnd
            // events that may come from stylesheet driven effects

            self._isBound = true;

            // Apply the transition

            self._applyTransition(transitionRules);

            // Apply width, height and margin negation

            if (
                isResizing &&
                options.posOut.display
            ) {
                self._dom.el.style.width        = options.posOut.width + 'px';
                self._dom.el.style.height       = options.posOut.height + 'px';
                self._dom.el.style.marginRight  = options.posOut.marginRight + 'px';
                self._dom.el.style.marginBottom = options.posOut.marginBottom + 'px';
            }

            if (!self._mixer.animation.nudgeOut && options.hideOrShow === 'hide') {
                // If we're not nudging, the translation should be
                // applied before any other transforms to prevent
                // lateral movement

                transformValues.push('translate(' + options.posOut.x + 'px, ' + options.posOut.y + 'px)');
            }

            // Apply fade

            switch (options.hideOrShow) {
                case 'hide':
                    isFading && (self._dom.el.style.opacity = self._mixer._effectsIn.opacity);

                    transformValues = transformValues.concat(self._mixer._transformOut);

                    break;
                case 'show':
                    isFading && (self._dom.el.style.opacity = 1);
            }

            if (
                self._mixer.animation.nudgeOut ||
                (!self._mixer.animation.nudgeOut && options.hideOrShow !== 'hide')
            ) {
                // Opposite of above - apply translate after
                // other transform

                transformValues.push('translate(' + options.posOut.x + 'px, ' + options.posOut.y + 'px)');
            }

            // Apply transforms

            self._dom.el.style[MixItUp.prototype._transformProp] = transformValues.join(' ');
        },

        /**
         * _willTransition
         * @param {Object} options
         * @return {Boolean}
         *
         * Determines if a target element will transition in
         * some fasion and therefore requires binding of
         * transitionEnd
         */

        _willTransition: function(options) {
            var self = this,
                canResize = self._mixer.animation.animateResizeTargets;

            if (!_h.isVisible(self._mixer._dom.container)) {
                // If the container is not visible, the transitionEnd
                // event will not occur and MixItUp will hang

                return false;
            }

            // Check if opacity and/or translate will change

            if (
                options.hideOrShow ||
                options.posIn.x !== options.posOut.x ||
                options.posIn.y !== options.posOut.y
            ) {
                return true;
            } else if (canResize) {
                // Check if width, height or margins will change

                return (
                    options.posIn.width !== options.posOut.width ||
                    options.posIn.height !== options.posOut.height ||
                    options.posIn.marginRight !== options.posOut.marginRight ||
                    options.posIn.marginTop !== options.posOut.marginTop
                );
            }
        },

        /**
         * _writeTransitionRule
         * @since 3.0.0
         * @param {String} rule
         * @param {Number} staggerIndex
         * @param [{Number}] duration
         * @return {String}
         *
         * Combines the name of a rule with duration and delay values
         * to produce a valid transition value
         */

        _writeTransitionRule: function(rule, staggerIndex, duration) {
            var self = this,
                delay = self._mixer._getDelay(staggerIndex),
                output = '';

            output = rule + ' ' +
                (duration || self._mixer.animation.duration) + 'ms ' +
                delay + 'ms ' +
                (rule === 'opacity' ? 'linear' : self._mixer.animation.easing);

            return output;
        },

        /**
         * _applyTransition
         * @since 3.0.0
         * @param {Array} rules
         * @void
         */

        _applyTransition: function(rules) {
            var self = this,
                transitionString = rules.join(', ');

            self._execAction('_transition', 0, arguments);

            self._dom.el.style[MixItUp.prototype._transitionProp] = transitionString;

            self._execAction('_transition', 1, arguments);
        },

        /**
         * handleTransitionEnd
         * @since 3.0.0
         * @void
         */

        _handleTransitionEnd: function(e) {
            var self = this,
                propName = e.propertyName,
                canResize = self._mixer.animation.animateResizeTargets;

            self._execAction('_handleTransitionEnd', 0, arguments);

            if (
                self._isBound &&
                e.target.matches(self._mixer.selectors.target) &&
                (
                    propName.indexOf('transform') > -1 ||
                    propName.indexOf('opacity') > -1 ||
                    canResize && propName.indexOf('height') > -1 ||
                    canResize && propName.indexOf('width') > -1 ||
                    canResize && propName.indexOf('margin') > -1
                )
            ) {
                self._callback.call(self);

                self._isBound = false;
                self._callback = null;
            }

            self._execAction('_handleTransitionEnd', 1, arguments);
        },

        /**
         * _eventBus
         * @since 3.0.0
         * @param {Event} e
         * @void
         */

        _eventBus: function(e) {
            var self = this;

            self._execAction('_eventBus', 0, arguments);

            switch (e.type) {
                case 'webkitTransitionEnd':
                case 'transitionend':
                    self._handleTransitionEnd(e);
            }

            self._execAction('_eventBus', 1, arguments);
        },

        /**
         * _unbindEvents
         * @since 3.0.0
         * @void
         */

        _unbindEvents: function() {
            var self = this;

            self._execAction('_unbindEvents', 0, arguments);

            _h.off(self._dom.el, 'webkitTransitionEnd', self._handler);
            _h.off(self._dom.el, 'transitionEnd', self._handler);

            self._execAction('_unbindEvents', 1, arguments);

            delete self._handler;
        },

        /**
         * _bindEvents
         * @since 3.0.0
         * @void
         */

        _bindEvents: function() {
            var self = this,
                transitionEndEvent = self._mixer._transitionPrefix === 'webkit' ?
                    'webkitTransitionEnd' :
                    'transitionend';

            self._execAction('_bindEvents', 0, arguments);

            self._handler = function(e) {
                return self._eventBus(e);
            };

            _h.on(self._dom.el, transitionEndEvent, self._handler);

            self._execAction('_bindEvents', 1, arguments);
        },

        /**
         * _getPosData
         * @since 3.0.0
         * @return {PosData}
         */

        _getPosData: function() {
            var self = this,
                styles = {},
                posData = new StyleData();

            self._execAction('_getPosData', 0, arguments);

            posData.x               = self._dom.el.offsetLeft;
            posData.y               = self._dom.el.offsetTop;
            posData.width           = self._dom.el.offsetWidth;
            posData.height          = self._dom.el.offsetHeight;
            posData.display         = self._dom.el.style.display || 'none';

            if (self._mixer.animation.animateResizeTargets) {
                styles = window.getComputedStyle(self._dom.el);

                posData.marginBottom = parseFloat(styles.marginBottom);
                posData.marginRight = parseFloat(styles.marginRight);
            }

            return self._execFilter('_getPosData', posData, arguments);
        },

        /**
         * _cleanUp
         * @void
         */

        _cleanUp: function() {
            var self = this;

            self._execAction('_cleanUp', 0, arguments);

            self._dom.el.style[MixItUp.prototype._transformProp] = '';
            self._dom.el.style[MixItUp.prototype._transitionProp] = '';
            self._dom.el.style.opacity = '';

            if (self._mixer.animation.animateResizeTargets) {
                self._dom.el.style.width = '';
                self._dom.el.style.height = '';
                self._dom.el.style.marginRight = '';
                self._dom.el.style.marginBottom = '';
            }

            self._execAction('_cleanUp', 1, arguments);
        }
    });

    /* Collection
    ---------------------------------------------------------------------- */

    Collection = function(instances) {
        var propKey = '',
            instance = null,
            i = -1;

        for (i = 0; instance = instances[i]; i++) {
            this[i] = instance;
        }

        this.length = instances.length;
    };

    Collection.prototype = {
        constructor: Collection,

        mixItUp: function(methodName) {
            var self = this,
                instance = null,
                args = Array.prototype.slice.call(arguments),
                tasks = [],
                q = null,
                i = -1;

            args.shift();

            for (i = 0; instance = self[i]; i++) {
                if (!q && instance.libraries.q) {
                    q = instance.libraries.q;
                }

                tasks.push(instance[methodName].apply(instance, args));
            }

            if (q) {
                return q.all(tasks);
            } else if (MixItUp.prototype._has._promises) {
                return Promise.all(tasks);
            }
        }
    };

    /* Operation
    ---------------------------------------------------------------------- */

    /**
     * Operation
     * @since 3.0.0
     * @constructor
     *
     * Operation objects contain all data neccessary to describe
     * the full lifecycle of any individual MixItUp operation
     */

    Operation = function() {
        this._execAction('_constructor', 0);

        this.args                = [];
        this.command             = null;
        this.showPosData         = [];
        this.toHidePosData       = [];

        this.startState          = null;
        this.newState            = null;
        this.docState            = null;

        this.willSort            = false;
        this.willChangeLayout    = false;

        this.show                = [];
        this.hide                = [];
        this.matching            = [];
        this.toShow              = [];
        this.toHide              = [];
        this.toMove              = [];
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
        this.startContainerClass = ''
        this.newContainerClass   = '';

        this._execAction('_constructor', 1);

        _h.seal(this);
    };

    /**
     * Operation.prototype
     * @since 3.0.0
     * @prototype
     * @extends basePrototype
     */

    Operation.prototype = Object.create(basePrototype);

    _h.extend(Operation.prototype, {
        _actions: {},
        _filters: {}
    });

    /* State
    ---------------------------------------------------------------------- */

    /**
     * State
     * @since 3.0.0
     * @constructor
     */

    State = function() {
        this._execAction('_constructor', 0);

        this.activeFilter         = '';
        this.activeSort           = '';
        this.activeContainerClass = '';
        this.targets              = null;
        this.show                 = null;
        this.hide                 = null;
        this.matching             = null;
        this.instance             = null;
        this.totalTargets         = -1;
        this.totalShow            = -1;
        this.totalHide            = -1;
        this.totalMatching        = -1;
        this.hasFailed            = false;

        this._execAction('_constructor', 1);

        _h.seal(this);
    };

    /**
     * State.prototype
     * @since 3.0.0
     * @prototype
     * @extends basePrototype
     */

    State.prototype = Object.create(basePrototype);

    _h.extend(State.prototype, {
        _actions: {},
        _filters: {}
    });

    /* TransformData
    ---------------------------------------------------------------------- */

    /**
     * TransformData
     * @since 3.0.0
     * @constructor
     */

    TransformData = function() {
        this._execAction('_constructor', 0);

        this.value = 0;
        this.unit = '';

        this._execAction('_constructor', 1);

        _h.seal(this);
    };

    /**
     * TransformData.prototype
     * @since 3.0.0
     * @prototype
     * @extends basePrototype
     */

    TransformData.prototype = Object.create(basePrototype);

    _h.extend(TransformData.prototype, {
        _actions: {},
        _filters: {}
    });

    /* StyleData
    ---------------------------------------------------------------------- */

    /**
     * StyleData
     * @since 3.0.0
     * @constructor
     */

    StyleData = function() {
        this._execAction('_constructor', 0);

        this.x              = 0;
        this.y              = 0;
        this.width          = 0;
        this.height         = 0;
        this.marginRight    = 0;
        this.marginBottom   = 0;
        this.display        = '';
        this.opacity        = 0;
        this.scale          = new TransformData();
        this.translateX     = new TransformData();
        this.translateY     = new TransformData();
        this.translateZ     = new TransformData();
        this.rotateX        = new TransformData();
        this.rotateY        = new TransformData();
        this.rotateZ        = new TransformData();

        this._execAction('_constructor', 1);

        _h.seal(this);
    };

    /**
     * StyleData.prototype
     * @since 3.0.0
     * @prototype
     * @extends basePrototype
     */

    StyleData.prototype = Object.create(basePrototype);

    _h.extend(StyleData.prototype, {
        _actions: {},
        _filters: {}
    });

    /* mixItUp Factory
    ---------------------------------------------------------------------- */

    /**
     * mixItUp
     * @since 3.0.0
     * @factory
     * @param {Element|Element[]|String} container
     * @param [{Object}] configuration
     * @param [{Object}] foreignDoc
     * @param [{Boolean}] returnCollection
     * @return {MixItUp}
     */

    mixItUp = function(container, config, foreignDoc, returnCollection) {
        var el = null,
            instance = null,
            instances = [],
            id = '',
            name = '',
            rand = _h.randomHexKey(),
            elements = [],
            i = -1;

        doc = foreignDoc || document;

        if (config && typeof config.extensions === 'object') {
            for (name in config.extensions) {
                config.extensions[name](MixItUp);
            }
        }

        if (!container && _h.canReportErrors(config)) {
            throw new Error('[MixItUp] Invalid selector or element');
        }

        switch (typeof container) {
            case 'string':
                elements = doc.querySelectorAll(container);

                break;
            case 'object':
                if (_h.isElement(container)) {
                    elements = [container];
                } else if (container.length) {
                    elements = container;
                }

                break;
        }

        for (i = 0; el = elements[i]; i++) {
            if (!el.id) {
                id = 'MixItUp' + _h.randomHexKey();

                el.id = id;
            } else {
                id = el.id;
            }

            if (MixItUp.prototype._instances[id] === undf) {
                instance = new MixItUp(el, config);

                instance._init(el, config);

                MixItUp.prototype._instances[id] = instance;
            } else if (MixItUp.prototype._instances[id] instanceof MixItUp) {
                instance = MixItUp.prototype._instances[id];

                if (config && _h.canReportErrors(config)) {
                    console.warn(
                        '[MixItUp] This element already has an active instance.' +
                        'Config will be ignored.'
                    );
                }
            }

            instances.push(instance);
        }

        if (returnCollection) {
            return new Collection(instances);
        } else {
            return instances[0];
        }
    };

    /**
     * mixItUp.prototype.all
     * @since 3.0.0
     * @factory
     * @param {Element|Element[]|String} container
     * @param [{Object}] configuration
     * @param [{Object}] foreignDoc
     * @return {Collection}
     *
     * Returns a collection of one or more instances
     * that can be operated on simultaneously, similar
     * to a jQuery collection
     */

    mixItUp.prototype.all = function(container, config, foreignDoc) {
        var self = this;

        return self.constructor(container, config, foreignDoc, true);
    };

    /* Encapsulation
    ---------------------------------------------------------------------- */

    // Encapsulate shared objects in the MixItUp prototype for transportation

    MixItUp.prototype.Operation = Operation;
    MixItUp.prototype.Target = Target;
    MixItUp.prototype.State = State;
    MixItUp.prototype._h = _h;

    // Encapulate the MixItUp constructor in the mixItUp factory for transportation

    // TODO: Why not stick everything in the factory?

    mixItUp.prototype.MixItUp = MixItUp;

    /* Start up
    ---------------------------------------------------------------------- */

    MixItUp.prototype._featureDetect();

    /* Module Definitions
    ---------------------------------------------------------------------- */

    if (typeof exports === 'object' && typeof module === 'object') {
        module.exports = mixItUp;
    } else if (typeof define === 'function' && define.amd) {
        define(function() {
            return mixItUp;
        });
    } else if (window.mixItUp === undf || typeof window.mixItUp !== 'function') {
        window.mixItUp = mixItUp;
    }
})(window, document);