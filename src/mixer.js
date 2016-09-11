/* global mixitup, h */

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
    mixitup.Base.call(this);

    this.callActions('beforeConstruct');

    this.config             = new mixitup.Config();

    this.id                = '';

    this.isBusy            = false;
    this.isToggling        = false;
    this.incPadding        = true;

    this.controls          = [];
    this.targets           = [];
    this.origOrder         = [];

    this.toggleArray       = [];

    this.targetsMoved      = 0;
    this.targetsImmovable  = 0;
    this.targetsBound      = 0;
    this.targetsDone       = 0;

    this.staggerDuration   = 0;
    this.effectsIn         = null;
    this.effectsOut        = null;
    this.transformIn       = [];
    this.transformOut      = [];
    this.queue             = [];

    this.state             = null;
    this.lastOperation     = null;
    this.lastClicked       = null;
    this.userCallback      = null;
    this.userDeferred      = null;

    this.dom               = new mixitup.MixerDom();

    this.callActions('afterConstruct');

    h.seal(this);
};

mixitup.BaseStatic.call(mixitup.Mixer);

mixitup.Mixer.prototype = Object.create(mixitup.Base.prototype);

h.extend(mixitup.Mixer.prototype,
/** @lends mixitup.Mixer */
{
    constructor: mixitup.Mixer,

    /**
     * @param {HTMLElement} container
     * @param {HTMLElement} document
     * @param {string}      id
     * @param {object}      [config]
     */

    attach: function(container, document, id, config) {
        var self = this;

        self.callActions('beforeAttach', arguments);

        self.id = id;

        if (config) {
            h.extend(self.config, config, true);
        }

        self.cacheDom(container, document);

        if (self.config.layout.containerClass) {
            h.addClass(self.dom.container, self.config.layout.containerClass);
        }

        if (!mixitup.features.has.transitions) {
            self.config.animation.enable = false;
        }

        self.indexTargets();

        self.state = self.getInitialState();

        self.updateControls({
            filter: self.state.activeFilterSelector,
            sort: self.state.activeSort
        });

        self.parseEffects();

        self.initControls();

        self.buildToggleArray(null, self.state);

        self.callActions('afterAttach', arguments);
    },

    /**
     * @private
     * @instance
     * @since   2.0.0
     * @return  {mixitup.State}
     */

    getInitialState: function() {
        var self        = this,
            state       = new mixitup.State(),
            operation   = new mixitup.Operation();

        self.callActions('beforeGetInitialState', arguments);

        // Map in whatever state values we can

        state.activeFilter          = self.parseFilterArgs([self.config.load.filter]).command;
        state.activeSort            = self.parseSortArgs([self.config.load.sort]).command;
        state.activeContainerClass  = self.config.layout.containerClass;
        state.totalTargets          = self.targets.length;

        if (
            state.activeSort.collection || state.activeSort.attribute ||
            state.activeSort.order === 'random' || state.activeSort.order === 'desc'
        ) {
            // Perform a syncronous sort without an operation

            operation.newSort = state.activeSort;

            self.sortOperation(operation);

            self.printSort(false, operation);

            self.targets = operation.newOrder;
        }

        // TODO: the initial state should be fully mapped, but as the operation is fake we don't have this data

        // state.totalShow         = operation.show.length
        // state.totalHide         = operation.hide.length
        // state.totalMatching     = operation.matching.length;

        return self.callFilters('stateGetInitialState', state, arguments);
    },

    /**
     * Caches references of DOM elements neccessary for the mixer's functionality.
     *
     * @private
     * @instance
     * @since   3.0.0
     * @param   {HTMLElement}       el
     * @param   {HTMLHtmlElement}   document
     * @return  {void}
     */

    cacheDom: function(el, document) {
        var self    = this;

        self.callActions('beforeCacheDom', arguments);

        self.dom.document  = document;
        self.dom.body      = self.dom.document.getElementsByTagName('body')[0];
        self.dom.container = el;
        self.dom.parent    = el;

        self.callActions('afterCacheDom', arguments);
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

    indexTargets: function() {
        var self    = this,
            target  = null,
            el      = null,
            i       = -1;

        self.callActions('beforeIndexTargets', arguments);

        self.dom.targets = self.config.layout.allowNestedTargets ?
            self.dom.container.querySelectorAll(self.config.selectors.target) :
            h.children(self.dom.container, self.config.selectors.target, self.dom.document);

        self.dom.targets = Array.prototype.slice.call(self.dom.targets);

        self.targets = [];

        if (self.dom.targets.length) {
            for (i = 0; el = self.dom.targets[i]; i++) {
                target = new mixitup.Target();

                target.init(el, self);

                self.targets.push(target);
            }

            self.dom.parent = self.dom.targets[0].parentElement.isEqualNode(self.dom.container) ?
                self.dom.container :
                self.dom.targets[0].parentElement;
        }

        self.origOrder = self.targets;

        self.callActions('afterIndexTargets', arguments);
    },

    initControls: function() {
        var self                = this,
            definition          = '',
            controlElements     = null,
            el                  = null,
            parent              = null,
            delagator           = null,
            control             = null,
            i                   = -1,
            j                   = -1;

        self.callActions('beforeInitControls', arguments);

        if (!self.config.controls.enable) {
            self.callActions('afterInitControls', arguments);

            return;
        }

        switch (self.config.controls.scope) {
            case 'local':
                parent = self.dom.container;

                break;
            case 'global':
                parent = self.dom.document;

                break;
            default:
                throw new Error(mixitup.messages.ERROR_CONFIG_INVALID_CONTROLS_SCOPE);
        }

        for (i = 0; definition = mixitup.controlDefinitions[i]; i++) {
            if (self.config.controls.live || definition.live) {
                if (definition.parent) {
                    delagator = self.dom[definition.parent];

                    if (!delagator) continue;
                } else {
                    delagator = parent;
                }

                control = self.getControl(delagator,  definition.type, definition.selector);

                self.controls.push(control);
            } else {
                controlElements = parent.querySelectorAll(definition.selector);

                for (j = 0; el = controlElements[j]; j++) {
                    control = self.getControl(el, definition.type, '');

                    if (!control) continue;

                    self.controls.push(control);
                }
            }
        }

        self.callActions('afterInitControls', arguments);
    },

    /**
     * @private
     * @instance
     * @since   3.0.0
     * @param   {HTMLElement} el
     * @param   {string}      type
     * @param   {string}      selector
     * @return  {mixitup.Control|null}
     */

    getControl: function(el, type, selector) {
        var self    = this,
            control = null,
            i       = -1;

        self.callActions('beforeGetControl', arguments);

        if (!selector) {
            // Static controls only

            for (i = 0; control = mixitup.controls[i]; i++) {
                if (control.el === el && control.isBound(self)) {
                    // Control already bound to this mixer (as another type).

                    // NB: This prevents duplicate controls from being registered where a selector
                    // might collide, eg: "[data-filter]" and "[data-filter][data-sort]"

                    return self.callFilters('controlGetControl', null, arguments);
                } else if (control.el === el && control.type === type && control.selector === selector) {
                    // Another mixer is already using this control, add this mixer as a binding

                    control.addBinding(self);

                    return self.callFilters('controlGetControl', control, arguments);
                }
            }
        }

        // Create new control

        control = new mixitup.Control();

        control.init(el, type, selector);

        control.classnames.base     = h.getClassname(self.config.classnames, type);
        control.classnames.active   = h.getClassname(self.config.classnames, type, self.config.classnames.modifierActive);
        control.classnames.disabled = h.getClassname(self.config.classnames, type, self.config.classnames.modifierDisabled);

        // Add a reference to this mixer as a binding

        control.addBinding(self);

        return self.callFilters('controlGetControl', control, arguments);
    },

    /**
     * Creates a compound selector by joining the `toggleArray` value as per the
     * defined toggle logic.
     *
     * @private
     * @instance
     * @since   3.0.0
     * @return  {string}
     */

    getToggleSelector: function() {
        var self            = this,
            delineator      = self.config.controls.toggleLogic === 'or' ? ',' : '',
            toggleSelector  = '';

        self.callActions('beforeGetToggleSelector', arguments);

        self.toggleArray = h.clean(self.toggleArray);

        toggleSelector = self.toggleArray.join(delineator);

        if (toggleSelector === '') {
            toggleSelector = self.config.controls.toggleDefault;
        }

        return self.callFilters('selectorGetToggleSelector', toggleSelector, arguments);
    },

    /**
     * Breaks compound selector strings in an array of discreet selectors,
     * as per the active `controls.toggleLogic` configuration option. Accepts
     * either a dynamic command object, or a state object.
     *
     * @private
     * @instance
     * @since   2.0.0
     * @param   {object}        [command]
     * @param   {mixitup.State} [state]
     * @return  {void}
     */

    buildToggleArray: function(command, state) {
        var self                    = this,
            activeFilterSelector    = '',
            filter                  = '',
            i                       = -1;

        self.callActions('beforeBuildToggleArray', arguments);

        if (command && command.filter) {
            activeFilterSelector = command.filter.selector.replace(/\s/g, '');
        } else if (state) {
            activeFilterSelector = state.activeFilter.selector.replace(/\s/g, '');
        } else {
            return;
        }

        if (activeFilterSelector === self.config.selectors.target || activeFilterSelector === 'all') {
            activeFilterSelector = '';
        }

        if (self.config.controls.toggleLogic === 'or') {
            self.toggleArray = activeFilterSelector.split(',');
        } else {
            self.toggleArray = activeFilterSelector.split('.');

            // TODO: selectors may not be class names, we need to be able to split any selectors

            !self.toggleArray[0] && self.toggleArray.shift();

            for (i = 0; filter = self.toggleArray[i]; i++) {
                self.toggleArray[i] = '.' + filter;
            }
        }

        self.toggleArray = h.clean(self.toggleArray);

        self.callActions('afterBuildToggleArray', arguments);
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

    updateControls: function(command) {
        var self    = this,
            control = null,
            output  = new mixitup.CommandMultimix(),
            i       = -1;

        self.callActions('beforeUpdateControls', arguments);

        // Sanitise to defaults

        if (command.filter) {
            output.filter = command.filter.selector;
        } else {
            output.filter = self.state.activeFilter.selector;
        }

        if (command.sort) {
            output.sort = command.sort.sortString;
        } else {
            output.sort = self.state.activeSort.sortString;
        }

        if (output.filter === self.config.selectors.target) {
            output.filter = 'all';
        }

        if (output.filter === '') {
            output.filter = 'none';
        }

        h.freeze(output);

        for (i = 0; control = self.controls[i]; i++) {
            control.update(output, self.toggleArray);
        }

        self.callActions('afterUpdateControls', arguments);
    },

    /**
     * @private
     * @instance
     * @since   3.0.0
     * @param   {object}        command
     * @param   {Operation}     operation
     * @return  {Promise.<mixitup.State>}
     */

    insertTargets: function(command, operation) {
        var self        = this,
            nextSibling = null,
            frag        = null,
            target      = null,
            el          = null,
            i           = -1;

        self.callActions('beforeInsertTargets', arguments);

        if (typeof command.index === 'undefined') command.index = 0;

        nextSibling = self.getNextSibling(command.index, command.sibling, command.position);
        frag        = self.dom.document.createDocumentFragment();

        if (command.collection) {
            for (i = 0; el = command.collection[i]; i++) {
                if (self.dom.targets.indexOf(el) > -1) {
                    throw new Error(mixitup.messages.ERROR_INSERT_PREEXISTING_ELEMENT);
                }

                // Ensure elements are hidden when they are added to the DOM, so they can
                // be animated in gracefully

                el.style.display = 'none';

                frag.appendChild(el);
                frag.appendChild(self.dom.document.createTextNode(' '));

                if (!h.isElement(el, self.dom.document) || !el.matches(self.config.selectors.target)) continue;

                target = new mixitup.Target();

                target.init(el, self);

                self.targets.splice(command.index, 0, target);

                command.index++;
            }

            self.dom.parent.insertBefore(frag, nextSibling);
        }

        // Since targets have been added, the original order must be updated

        operation.startOrder = self.origOrder = self.targets;

        self.callActions('afterInsertTargets', arguments);
    },

    /**
     * @private
     * @instance
     * @since   3.0.0
     * @param   {Number}      [index]
     * @param   {Element}     [sibling]
     * @param   {string}      [position]
     * @return  {Element}
     */

    getNextSibling: function(index, sibling, position) {
        var self    = this,
            element = null;

        if (sibling && position === 'before') {
            element = sibling;
        } else if (sibling && position === 'after') {
            element = sibling.nextElementSibling || null;
        } else if (self.targets.length && typeof index !== 'undefined') {
            element = (index < self.targets.length || !self.targets.length) ?
                self.targets[index].dom.el :
                self.targets[self.targets.length - 1].dom.el.nextElementSibling;
        } else {
            element = self.dom.parent.children.length ? self.dom.parent.children[0] : null;
        }

        return self.callFilters('elementGetNextSibling', element, arguments);
    },

    /**
     * @private
     * @instance
     * @since   2.0.0
     * @param   {Operation}     operation
     * @return  {void}
     */

    filterOperation: function(operation) {
        var self        = this,
            testResult  = false,
            index       = -1,
            action      = '',
            target      = null,
            i           = -1;

        self.callActions('beforeFilterOperation', arguments);

        action = operation.newFilter.action;

        for (i = 0; target = operation.newOrder[i]; i++) {
            if (operation.newFilter.collection) {
                // show via collection

                testResult = operation.newFilter.collection.indexOf(target.dom.el) > -1;
            } else {
                // show via selector

                if (operation.newFilter.selector === '') {
                    testResult = false;
                } else {
                    testResult = target.dom.el.matches(operation.newFilter.selector);
                }
            }

            self.evaluateHideShow(testResult, target, action, operation);
        }

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

        operation.matching = operation.show.slice();

        if (operation.show.length === 0 && operation.newFilter.selector !== '' && self.targets.length !== 0) {
            operation.hasFailed = true;
        }

        self.callActions('afterFilterOperation', arguments);
    },

    /**
     * @private
     * @instance
     * @since   3.0.0
     * @param   {boolean}   testResult
     * @param   {Element}   target
     * @param   {string}    action
     * @param   {Operation} operation
     * @return  {void}
     */

    evaluateHideShow: function(testResult, target, action, operation) {
        var self = this;

        self.callActions('beforeEvaluateHideShow', arguments);

        if (testResult === true && action === 'show' || testResult === false && action === 'hide') {
            operation.show.push(target);

            !target.isShown && operation.toShow.push(target);
        } else {
            operation.hide.push(target);

            target.isShown && operation.toHide.push(target);
        }

        self.callActions('afterEvaluateHideShow', arguments);
    },

    /**
     * @private
     * @instance
     * @since   2.0.0
     * @param   {Operation}     operation
     * @return  {void}
     */

    sortOperation: function(operation) {
        var self = this;

        self.callActions('beforeSortOperation', arguments);

        operation.startOrder = self.targets;

        if (operation.newSort.collection) {
            // Sort by collection

            operation.newOrder = operation.newSort.collection;
        } else if (operation.newSort.order === 'random') {
            // Sort random

            operation.newOrder = h.arrayShuffle(operation.startOrder);
        } else if (operation.newSort.attribute === '') {
            // Sort by default

            operation.newOrder = self.origOrder.slice();

            if (operation.newSort.order === 'desc') {
                operation.newOrder.reverse();
            }
        } else {
            // Sort by attribute

            operation.newOrder = operation.startOrder.slice();

            operation.newOrder.sort(function(a, b) {
                return self.compare(a, b, operation.newSort);
            });
        }

        if (h.isEqualArray(operation.newOrder, operation.startOrder)) {
            operation.willSort = false;
        }

        self.callActions('afterSortOperation', arguments);
    },

    /**
     * @private
     * @instance
     * @since   2.0.0
     * @param   {mixitup.Target}        a
     * @param   {mixitup.Target}        b
     * @param   {mixitup.CommandSort}   command
     * @return  {Number}
     */

    compare: function(a, b, command) {
        var self        = this,
            order       = command.order,
            attrA       = self.getAttributeValue(a, command.attribute),
            attrB       = self.getAttributeValue(b, command.attribute);

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

        if (attrA === attrB && command.next) {
            return self.compare(a, b, command.next);
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
     * @param   {mixitup.Target}    target
     * @param   {string}            [attribute]
     * @return  {(String|Number)}
     */

    getAttributeValue: function(target, attribute) {
        var self    = this,
            value   = '';

        value = target.dom.el.getAttribute('data-' + attribute);

        if (value === null) {
            if (self.config.debug.showWarnings) {
                // Encourage users to assign values to all targets to avoid erroneous sorting
                // when types are mixed

                console.warn(mixitup.messages.WARNING_INCONSISTENT_SORTING_ATTRIBUTES);
            }
        }

        // If an attribute is not present, return 0 as a safety value

        return self.callFilters('valueGetAttributeValue', value || 0, arguments);
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

    printSort: function(isResetting, operation) {
        var self        = this,
            order       = isResetting ? operation.startOrder : operation.newOrder,
            targets     = h.children(self.dom.parent, self.config.selectors.target, self.dom.document),
            nextSibling = targets.length ? targets[targets.length - 1].nextElementSibling : null,
            frag        = self.dom.document.createDocumentFragment(),
            target      = null,
            whiteSpace  = null,
            el          = null,
            i           = -1;

        self.callActions('beforePrintSort', arguments);

        for (i = 0; el = targets[i]; i++) {
            // Empty the container

            whiteSpace = el.nextSibling;

            if (el.style.position === 'absolute') continue;

            if (whiteSpace && whiteSpace.nodeName === '#text') {
                self.dom.parent.removeChild(whiteSpace);
            }

            self.dom.parent.removeChild(el);
        }

        for (i = 0; target = order[i]; i++) {
            // Add targets into a document fragment

            el = target.dom.el;

            frag.appendChild(el);
            frag.appendChild(self.dom.document.createTextNode(' '));
        }

        // Insert the document fragment into the container
        // before any other non-target elements

        if (nextSibling) {
            self.dom.parent.insertBefore(frag, nextSibling);
        } else {
            self.dom.parent.appendChild(frag);
        }

        self.callActions('afterPrintSort', arguments);
    },

    /**
     * Parses user-defined sort strings (i.e. `default:asc`) into sort commands objects.
     *
     * @private
     * @instance
     * @since   3.0.0
     * @param   {string}                sortString
     * @param   {mixitup.CommandSort}   command
     * @return  {mixitup.CommandSort}
     */

    parseSortString: function(sortString, command) {
        var self        = this,
            rules       = sortString.split(' '),
            current     = command,
            rule        = [],
            i           = -1;

        command.sortString = sortString;

        for (i = 0; i < rules.length; i++) {
            rule = rules[i].split(':');

            current.attribute   = h.dashCase(rule[0]);
            current.order       = rule[1] || 'asc';

            switch (current.attribute) {
                case 'default':
                    // treat "default" as sorting by no attribute

                    current.attribute = '';

                    break;
                case 'random':
                    // treat "random" as an order not an attribute

                    current.attribute   = '';
                    current.order       = 'random';

                    break;
            }

            if (!current.attribute || current.order === 'random') break;

            if (i < rules.length - 1) {
                // Embed reference to the next command

                current.next = new mixitup.CommandSort();

                h.freeze(current);

                current = current.next;
            }
        }

        return self.callFilters('commandsParseSort', command, arguments);
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

    parseEffects: function() {
        var self            = this,
            transformName   = '',
            effectsIn       = self.config.animation.effectsIn || self.config.animation.effects,
            effectsOut      = self.config.animation.effectsOut || self.config.animation.effects;

        self.callActions('beforeParseEffects', arguments);

        self.effectsIn      = new mixitup.StyleData();
        self.effectsOut     = new mixitup.StyleData();
        self.transformIn    = [];
        self.transformOut   = [];

        self.effectsIn.opacity = self.effectsOut.opacity = 1;

        self.parseEffect('fade', effectsIn, self.effectsIn, self.transformIn);
        self.parseEffect('fade', effectsOut, self.effectsOut, self.transformOut, true);

        for (transformName in mixitup.transformDefaults) {
            if (!(mixitup.transformDefaults[transformName] instanceof mixitup.TransformData)) {
                continue;
            }

            self.parseEffect(transformName, effectsIn, self.effectsIn, self.transformIn);
            self.parseEffect(transformName, effectsOut, self.effectsOut, self.transformOut, true);
        }

        self.parseEffect('stagger', effectsIn, self.effectsIn, self.transformIn);
        self.parseEffect('stagger', effectsOut, self.effectsOut, self.transformOut, true);

        self.callActions('afterParseEffects', arguments);
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

    parseEffect: function(effectName, effectString, effects, transform, isOut) {
        var self        = this,
            re          = /\(([^)]+)\)/,
            propIndex   = -1,
            str         = '',
            match       = [],
            val         = '',
            units       = ['%', 'px', 'em', 'rem', 'vh', 'vw', 'deg'],
            unit        = '',
            i           = -1;

        self.callActions('beforeParseEffect', arguments);

        if (typeof effectString !== 'string') {
            throw new Error(mixitup.messages.ERROR_CONFIG_INVALID_ANIMATION_EFFECTS);
        }

        if (effectString.indexOf(effectName) < 0) {
            // The effect is not present in the effects string

            if (effectName === 'stagger') {
                // Reset stagger to 0

                self.staggerDuration = 0;
            }

            return;
        }

        // The effect is present

        propIndex = effectString.indexOf(effectName + '(');

        if (propIndex > -1) {
            // The effect has a user defined value in parentheses

            // Extract from the first parenthesis to the end of string

            str = effectString.substring(propIndex);

            // Match any number of characters between "(" and ")"

            match = re.exec(str);

            val = match[1];
        }

        switch (effectName) {
            case 'fade':
                effects.opacity = val ? parseFloat(val) : 0;

                break;
            case 'stagger':
                self.staggerDuration = val ? parseFloat(val) : 100;

                // TODO: Currently stagger must be applied globally, but
                // if seperate values are specified for in/out, this should
                // be respected

                break;
            default:
                // All other effects are transforms following the same structure

                if (isOut && self.config.animation.reverseOut && effectName !== 'scale') {
                    effects[effectName].value =
                        (val ? parseFloat(val) : mixitup.transformDefaults[effectName].value) * -1;
                } else {
                    effects[effectName].value =
                        (val ? parseFloat(val) : mixitup.transformDefaults[effectName].value);
                }

                if (val) {
                    for (i = 0; unit = units[i]; i++) {
                        if (val.indexOf(unit) > -1) {
                            effects[effectName].unit = unit;

                            break;
                        }
                    }
                } else {
                    effects[effectName].unit = mixitup.transformDefaults[effectName].unit;
                }

                transform.push(
                    effectName +
                    '(' +
                    effects[effectName].value +
                    effects[effectName].unit +
                    ')'
                );
        }

        self.callActions('afterParseEffect', arguments);
    },

    /**
     * @private
     * @instance
     * @since   2.0.0
     * @param   {Operation}     operation
     * @return  {State}
     */

    buildState: function(operation) {
        var self        = this,
            state       = new mixitup.State(),
            target      = null,
            i           = -1;

        self.callActions('beforeBuildState', arguments);

        // Map target elements into state arrays.
        // the real target objects should never be exposed

        for (i = 0; target = self.targets[i]; i++) {
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

        state.activeFilter              = operation.newFilter;
        state.activeSort                = operation.newSort;
        state.activeContainerClass      = operation.newContainerClass;
        state.hasFailed                 = operation.hasFailed;
        state.totalTargets              = self.targets.length;
        state.totalShow                 = operation.show.length;
        state.totalHide                 = operation.hide.length;
        state.totalMatching             = operation.matching.length;
        state.triggerElement            = self.lastClicked;

        return self.callFilters('stateBuildState', state, arguments);
    },

    /**
     * @private
     * @instance
     * @since   2.0.0
     * @param   {boolean}   shouldAnimate
     * @param   {Operation} operation
     * @return  {void}
     */

    goMix: function(shouldAnimate, operation) {
        var self        = this,
            deferred    = null;

        self.callActions('beforeGoMix', arguments);

        // If the animation duration is set to 0ms,
        // or no effects specified,
        // or the container is hidden
        // then abort animation

        if (
            !self.config.animation.duration || !self.config.animation.effects || !h.isVisible(self.dom.container)
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

        mixitup.events.fire('mixStart', self.dom.container, {
            state: operation.startState,
            futureState: operation.newState,
            instance: self
        }, self.dom.document);

        if (typeof self.config.callbacks.onMixStart === 'function') {
            self.config.callbacks.onMixStart.call(
                self.dom.container,
                operation.startState,
                operation.newState,
                self
            );
        }

        h.removeClass(self.dom.container, self.config.layout.containerClassFail);

        deferred = self.userDeferred = h.defer(mixitup.libraries);

        if (!shouldAnimate || !mixitup.features.has.transitions) {
            // Abort

            self.cleanUp(operation);

            return self.callFilters('promiseGoMix', deferred.promise, arguments);
        }

        // If we should animate and the platform supports transitions, go for it

        self.isBusy = true;

        if (window.pageYOffset !== operation.docState.scrollTop) {
            window.scrollTo(operation.docState.scrollLeft, operation.docState.scrollTop);
        }

        if (self.config.animation.applyPerspective) {
            self.dom.parent.style[mixitup.features.perspectiveProp] =
                self.config.animation.perspectiveDistance;

            self.dom.parent.style[mixitup.features.perspectiveOriginProp] =
                self.config.animation.perspectiveOrigin;
        }

        if (self.config.animation.animateResizeContainer || operation.startHeight === operation.newHeight) {
            self.dom.parent.style.height = operation.startHeight + 'px';
        }

        if (self.config.animation.animateResizeContainer || operation.startWidth === operation.newWidth) {
            self.dom.parent.style.width = operation.startWidth + 'px';
        }

        requestAnimationFrame(function() {
            self.moveTargets(operation);
        });

        return self.callFilters('promiseGoMix', deferred.promise, arguments);
    },

    /**
     * @private
     * @instance
     * @since   2.0.0
     * @param   {Operation}     operation
     * @return  {void}
     */

    getStartMixData: function(operation) {
        var self        = this,
            parentStyle = window.getComputedStyle(self.dom.parent),
            parentRect  = self.dom.parent.getBoundingClientRect(),
            target      = null,
            data        = {},
            i           = -1,
            boxSizing   = parentStyle[mixitup.features.boxSizingProp];

        self.incPadding = (boxSizing === 'border-box');

        self.callActions('beforeGetStartMixData', arguments);

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

        operation.startX = parentRect.left;
        operation.startY = parentRect.top;

        operation.startHeight = self.incPadding ?
            parentRect.height :
            parentRect.height -
                parseFloat(parentStyle.paddingTop) -
                parseFloat(parentStyle.paddingBottom) -
                parseFloat(parentStyle.borderTop) -
                parseFloat(parentStyle.borderBottom);

        operation.startWidth = self.incPadding ?
            parentRect.width :
            parentRect.width -
                parseFloat(parentStyle.paddingLeft) -
                parseFloat(parentStyle.paddingRight) -
                parseFloat(parentStyle.borderLeft) -
                parseFloat(parentStyle.borderRight);

        self.callActions('afterGetStartMixData', arguments);
    },

    /**
     * @private
     * @instance
     * @since   2.0.0
     * @param   {Operation}     operation
     * @return  {void}
     */

    setInter: function(operation) {
        var self    = this,
            target  = null,
            i       = -1;

        self.callActions('beforeSetInter', arguments);

        for (i = 0; target = operation.toShow[i]; i++) {
            target.show();
        }

        if (operation.willChangeLayout) {
            h.removeClass(self.dom.container, operation.startContainerClass);
            h.addClass(self.dom.container, operation.newContainerClass);
        }

        self.callActions('afterSetInter', arguments);
    },

    /**
     * @private
     * @instance
     * @since   2.0.0
     * @param   {Operation}     operation
     * @return  {void}
     */

    getInterMixData: function(operation) {
        var self    = this,
            target  = null,
            i       = -1;

        self.callActions('beforeGetInterMixData', arguments);

        for (i = 0; target = operation.show[i]; i++) {
            operation.showPosData[i].interPosData = target.getPosData();
        }

        for (i = 0; target = operation.toHide[i]; i++) {
            operation.toHidePosData[i].interPosData = target.getPosData();
        }

        self.callActions('afterGetInterMixData', arguments);
    },

    /**
     * @private
     * @instance
     * @since   2.0.0
     * @param   {Operation}     operation
     * @return  {void}
     */

    setFinal: function(operation) {
        var self    = this,
            target  = null,
            i       = -1;

        self.callActions('beforeSetFinal', arguments);

        operation.willSort && self.printSort(false, operation);

        for (i = 0; target = operation.toHide[i]; i++) {
            target.hide();
        }

        self.callActions('afterSetFinal', arguments);
    },

    /**
     * @private
     * @instance
     * @since   2.0.0
     * @param   {Operation}     operation
     * @return  {void}
     */

    getFinalMixData: function(operation) {
        var self        = this,
            parentStyle = null,
            parentRect  = self.dom.parent.getBoundingClientRect(),
            target      = null,
            i           = -1;

        if (!self.incPadding) {
            parentStyle = window.getComputedStyle(self.dom.parent);
        }

        self.callActions('beforeGetFinalMixData', arguments);

        for (i = 0; target = operation.show[i]; i++) {
            operation.showPosData[i].finalPosData = target.getPosData();
        }

        for (i = 0; target = operation.toHide[i]; i++) {
            operation.toHidePosData[i].finalPosData = target.getPosData();
        }

        operation.newX = parentRect.left;
        operation.newY = parentRect.top;

        operation.newHeight = self.incPadding ?
            parentRect.height :
            parentRect.height -
                parseFloat(parentStyle.paddingTop) -
                parseFloat(parentStyle.paddingBottom) -
                parseFloat(parentStyle.borderTop) -
                parseFloat(parentStyle.borderBottom);

        operation.newWidth = self.incPadding ?
            parentRect.width :
            parentRect.width -
                parseFloat(parentStyle.paddingLeft) -
                parseFloat(parentStyle.paddingRight) -
                parseFloat(parentStyle.borderLeft) -
                parseFloat(parentStyle.borderRight);

        if (operation.willSort) {
            self.printSort(true, operation);
        }

        for (i = 0; target = operation.toShow[i]; i++) {
            target.hide();
        }

        for (i = 0; target = operation.toHide[i]; i++) {
            target.show();
        }

        if (operation.willChangeLayout && self.config.animation.animateChangeLayout) {
            h.removeClass(self.dom.container, operation.newContainerClass);
            h.addClass(self.dom.container, self.config.layout.containerClass);
        }

        self.callActions('afterGetFinalMixData', arguments);
    },

    /**
     * @private
     * @instance
     * @since    3.0.0
     * @param    {Operation}     operation
     */

    getTweenData: function(operation) {
        var self            = this,
            target          = null,
            posData         = null,
            effectNames     = Object.getOwnPropertyNames(self.effectsIn),
            effectName      = '',
            effect          = null,
            widthChange     = -1,
            heightChange    = -1,
            i               = -1,
            j               = -1;

        self.callActions('beforeGetTweenData', arguments);

        for (i = 0; target = operation.show[i]; i++) {
            posData             = operation.showPosData[i];
            posData.posIn       = new mixitup.StyleData();
            posData.posOut      = new mixitup.StyleData();
            posData.tweenData   = new mixitup.StyleData();

            // Process x and y

            if (target.isShown) {
                posData.posIn.x = posData.startPosData.x - posData.interPosData.x;
                posData.posIn.y = posData.startPosData.y - posData.interPosData.y;
            } else {
                posData.posIn.x = posData.posIn.y = 0;
            }

            posData.posOut.x = posData.finalPosData.x - posData.interPosData.x;
            posData.posOut.y = posData.finalPosData.y - posData.interPosData.y;

            // Process opacity

            posData.posIn.opacity       = target.isShown ? 1 : self.effectsIn.opacity;
            posData.posOut.opacity      = 1;
            posData.tweenData.opacity   = posData.posOut.opacity - posData.posIn.opacity;

            // Adjust x and y if not nudging

            if (!target.isShown && !self.config.animation.nudge) {
                posData.posIn.x = posData.posOut.x;
                posData.posIn.y = posData.posOut.y;
            }

            posData.tweenData.x = posData.posOut.x - posData.posIn.x;
            posData.tweenData.y = posData.posOut.y - posData.posIn.y;

            // Process width, height, and margins

            if (self.config.animation.animateResizeTargets) {
                posData.posIn.width     = posData.startPosData.width;
                posData.posIn.height    = posData.startPosData.height;

                // "||" Prevents width/height change from including 0 width/height if hiding or showing

                widthChange = (posData.startPosData.width || posData.finalPosData.width) - posData.interPosData.width;

                posData.posIn.marginRight = posData.startPosData.marginRight - widthChange;

                heightChange = (posData.startPosData.height || posData.finalPosData.height) - posData.interPosData.height;

                posData.posIn.marginBottom = posData.startPosData.marginBottom - heightChange;

                posData.posOut.width    = posData.finalPosData.width;
                posData.posOut.height   = posData.finalPosData.height;

                widthChange = (posData.finalPosData.width || posData.startPosData.width) - posData.interPosData.width;

                posData.posOut.marginRight = posData.finalPosData.marginRight - widthChange;

                heightChange = (posData.finalPosData.height || posData.startPosData.height) - posData.interPosData.height;

                posData.posOut.marginBottom = posData.finalPosData.marginBottom - heightChange;

                posData.tweenData.width         = posData.posOut.width - posData.posIn.width;
                posData.tweenData.height        = posData.posOut.height - posData.posIn.height;
                posData.tweenData.marginRight   = posData.posOut.marginRight - posData.posIn.marginRight;
                posData.tweenData.marginBottom  = posData.posOut.marginBottom - posData.posIn.marginBottom;
            }

            // Process transforms

            for (j = 0; effectName = effectNames[j]; j++) {
                effect = self.effectsIn[effectName];

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
            posData.posOut.x    = self.config.animation.nudge ? 0 : posData.posIn.x;
            posData.posOut.y    = self.config.animation.nudge ? 0 : posData.posIn.y;
            posData.tweenData.x = posData.posOut.x - posData.posIn.x;
            posData.tweenData.y = posData.posOut.y - posData.posIn.y;

            // Process width, height, and margins

            if (self.config.animation.animateResizeTargets) {
                posData.posIn.width         = posData.startPosData.width;
                posData.posIn.height        = posData.startPosData.height;

                widthChange = posData.startPosData.width - posData.interPosData.width;

                posData.posIn.marginRight = posData.startPosData.marginRight - widthChange;

                heightChange = posData.startPosData.height - posData.interPosData.height;

                posData.posIn.marginBottom = posData.startPosData.marginBottom - heightChange;
            }

            // Process opacity

            posData.posIn.opacity       = 1;
            posData.posOut.opacity      = self.effectsOut.opacity;
            posData.tweenData.opacity   = posData.posOut.opacity - posData.posIn.opacity;

            // Process transforms

            for (j = 0; effectName = effectNames[j]; j++) {
                effect = self.effectsOut[effectName];

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

        self.callActions('afterGetTweenData', arguments);
    },

    /**
     * @private
     * @instance
     * @since   3.0.0
     * @param   {Operation}     operation
     * @return  {void}
     */

    moveTargets: function(operation) {
        var self            = this,
            target          = null,
            posData         = null,
            hideOrShow      = '',
            willTransition  = false,
            staggerIndex    = -1,
            i               = -1,
            checkProgress   = h.bind(self, self.checkProgress);

        self.callActions('beforeMoveTargets', arguments);

        // TODO: this is an extra loop in addition to the calcs
        // done in getOperation, can we get around somehow?

        for (i = 0; target = operation.show[i]; i++) {
            posData = operation.showPosData[i];

            hideOrShow = target.isShown ? false : 'show'; // TODO: can we not mix types here?

            willTransition = self.willTransition(
                hideOrShow,
                operation.hasEffect,
                posData.posIn,
                posData.posOut
            );

            if (willTransition) {
                // Prevent non-transitioning targets from incrementing the staggerIndex

                staggerIndex++;
            }

            target.show();

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

            willTransition = self.willTransition(hideOrShow, posData.posIn, posData.posOut);

            target.move({
                posIn: posData.posIn,
                posOut: posData.posOut,
                hideOrShow: hideOrShow,
                staggerIndex: i,
                operation: operation,
                callback: willTransition ? checkProgress : null
            });
        }

        if (self.config.animation.animateResizeContainer) {
            self.dom.parent.style[mixitup.features.transitionProp] =
                'height ' + self.config.animation.duration + 'ms ease, ' +
                'width ' + self.config.animation.duration + 'ms ease ';

            requestAnimationFrame(function() {
                self.dom.parent.style.height = operation.newHeight + 'px';
                self.dom.parent.style.width = operation.newWidth + 'px';
            });
        }

        if (operation.willChangeLayout) {
            h.removeClass(self.dom.container, self.config.layout.containerClass);
            h.addClass(self.dom.container, operation.newContainerClass);
        }

        self.callActions('afterMoveTargets', arguments);
    },

    /**
     * @private
     * @instance
     * @return  {boolean}
     */

    hasEffect: function() {
        var self        = this,
            EFFECTABLES = [
                'scale',
                'translateX', 'translateY', 'translateZ',
                'rotateX', 'rotateY', 'rotateZ'
            ],
            effectName  = '',
            effect      = null,
            result      = false,
            value       = -1,
            i           = -1;

        if (self.effectsIn.opacity !== 1) {
            return self.callFilters('resultHasEffect', true, arguments);
        }

        for (i = 0; effectName = EFFECTABLES[i]; i++) {
            effect  = self.effectsIn[effectName];
            value   = (typeof effect && effect.value !== 'undefined') ?
                effect.value : effect;

            if (value !== 0) {
                result = true;

                break;
            }
        }

        return self.callFilters('resultHasEffect', result, arguments);
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

    willTransition: function(hideOrShow, hasEffect, posIn, posOut) {
        var self    = this,
            result  = false;

        if (!h.isVisible(self.dom.container)) {
            // If the container is not visible, the transitionEnd
            // event will not occur and MixItUp will hang

            result = false;
        } else if (
            (hideOrShow && hasEffect) ||
            posIn.x !== posOut.x ||
            posIn.y !== posOut.y
        ) {
            // If opacity and/or translate will change

            result = true;
        } else if (self.config.animation.animateResizeTargets) {
            // Check if width, height or margins will change

            result = (
                posIn.width !== posOut.width ||
                posIn.height !== posOut.height ||
                posIn.marginRight !== posOut.marginRight ||
                posIn.marginTop !== posOut.marginTop
            );
        } else {
            result = false;
        }

        return self.callFilters('resultWillTransition', result, arguments);
    },

    /**
     * @private
     * @instance
     * @since   2.0.0
     * @param   {Operation}     operation
     * @return  {void}
     */

    checkProgress: function(operation) {
        var self = this;

        self.targetsDone++;

        if (self.targetsBound === self.targetsDone) {
            self.cleanUp(operation);
        }
    },

    /**
     * @private
     * @instance
     * @since   2.0.0
     * @param   {Operation}     operation
     * @return  {void}
     */

    cleanUp: function(operation) {
        var self        = this,
            target      = null,
            nextInQueue = null,
            i           = -1;

        self.callActions('beforeCleanUp', arguments);

        self.targetsMoved          =
            self.targetsImmovable  =
            self.targetsBound      =
            self.targetsDone       = 0;

        for (i = 0; target = operation.show[i]; i++) {
            target.cleanUp();

            target.show();
        }

        for (i = 0; target = operation.toHide[i]; i++) {
            target.cleanUp();

            target.hide();
        }

        if (operation.willSort) {
            self.printSort(false, operation);

            self.targets = operation.newOrder;
        }

        // Remove any styles applied to the parent container

        self.dom.parent.style[mixitup.features.transitionProp]             =
            self.dom.parent.style.height                                   =
            self.dom.parent.style.width                                    =
            self.dom.parent.style[mixitup.features.perspectiveProp]        =
            self.dom.parent.style[mixitup.features.perspectiveOriginProp]  = '';

        if (operation.willChangeLayout) {
            h.removeClass(self.dom.container, operation.startContainerClass);
            h.addClass(self.dom.container, operation.newContainerClass);
        }

        if (operation.toRemove.length) {
            for (i = 0; target = self.targets[i]; i++) {
                if (operation.toRemove.indexOf(target) > -1) {

                    h.deleteElement(target.dom.el);

                    self.targets.splice(i, 1);

                    i--;
                }
            }

            // Since targets have been removed, the original order must be updated

            self.origOrder = self.targets;
        }

        self.state = operation.newState;
        self.lastOperation = operation;

        self.dom.targets = self.state.targets;

        // mixEnd

        mixitup.events.fire('mixEnd', self.dom.container, {
            state: self.state,
            instance: self
        }, self.dom.document);

        if (typeof self.config.callbacks.onMixEnd === 'function') {
            self.config.callbacks.onMixEnd.call(self.dom.container, self.state, self);
        }

        if (operation.hasFailed) {
            // mixFail

            mixitup.events.fire('mixFail', self.dom.container, {
                state: self.state,
                instance: self
            }, self.dom.document);

            if (typeof self.config.callbacks.onMixFail === 'function') {
                self.config.callbacks.onMixFail.call(self.dom.container, self.state, self);
            }

            h.addClass(self.dom.container, self.config.layout.containerClassFail);
        }

        // User-defined callback function

        if (typeof self.userCallback === 'function') {
            self.userCallback.call(self.dom.container, self.state, self);
        }

        self.userDeferred.resolve(self.state);

        self.userCallback  = null;
        self.userDeferred  = null;
        self.lastClicked   = null;
        self.isToggling    = false;
        self.isBusy      = false;

        if (self.queue.length) {
            self.callActions('beforeReadQueueCleanUp', arguments);

            nextInQueue = self.queue.shift();

            // Update non-public API properties stored in queue

            self.userDeferred   = nextInQueue.promise;
            self.isToggling    = nextInQueue.isToggling;
            self.lastClicked   = nextInQueue.trigger;

            self.multimix.apply(self, nextInQueue.args);
        }

        self.callActions('afterCleanUp', arguments);
    },

    /**
     * @private
     * @instance
     * @since   2.0.0
     * @param   {Array<*>}  args
     * @return  {mixitup.UserInstruction}
     */

    parseMultimixArgs: function(args) {
        var self        = this,
            instruction = new mixitup.UserInstruction(),
            arg         = null,
            i           = -1;

        instruction.animate = self.config.animation.enable;
        instruction.command = new mixitup.CommandMultimix();

        for (i = 0; i < args.length; i++) {
            arg = args[i];

            if (arg === null) continue;

            if (typeof arg === 'object') {
                h.extend(instruction.command, arg);
            } else if (typeof arg === 'boolean') {
                instruction.animate = arg;
            } else if (typeof arg === 'function') {
                instruction.callback = arg;
            }
        }

        // Coerce arbitrary command arguments into typed command objects

        if (instruction.command.insert && !(instruction.command.insert instanceof mixitup.CommandInsert)) {
            instruction.command.insert = self.parseInsertArgs([instruction.command.insert]).command;
        }

        if (instruction.command.remove && !(instruction.command.remove instanceof mixitup.CommandRemove)) {
            instruction.command.remove = self.parseRemoveArgs([instruction.command.remove]).command;
        }

        if (instruction.command.filter && !(instruction.command.filter instanceof mixitup.CommandFilter)) {
            instruction.command.filter = self.parseFilterArgs([instruction.command.filter]).command;
        }

        if (instruction.command.sort && !(instruction.command.sort instanceof mixitup.CommandSort)) {
            instruction.command.sort = self.parseSortArgs([instruction.command.sort]).command;
        }

        instruction = self.callFilters('instructionParseMultimixArgs', instruction, arguments);

        h.freeze(instruction);

        return instruction;
    },

    parseFilterArgs: function(args) {
        var self        = this,
            instruction = new mixitup.UserInstruction(),
            arg         = null,
            i           = -1;

        instruction.animate = self.config.animation.enable;
        instruction.command = new mixitup.CommandFilter();

        for (i = 0; i < args.length; i++) {
            arg = args[i];

            if (arg === null) continue;

            if (typeof arg === 'string') {
                // Selector

                instruction.command.selector = arg;
            } else if (typeof arg === 'object' && h.isElement(arg, self.dom.document)) {
                // Single element

                instruction.command.collection = [arg];
            } else if (typeof arg === 'object' && arg.length) {
                // Multiple elements in array, NodeList or jQuery collection

                instruction.command.collection = Array.prototype.slice.call(arg);
            } else if (typeof arg === 'object') {
                // Filter command

                h.extend(instruction.command, arg);
            } else if (typeof arg === 'boolean') {
                instruction.animate = arg;
            } else if (typeof arg === 'function') {
                instruction.callback = arg;
            }
        }

        instruction = self.callFilters('instructionParseFilterArgs', instruction, arguments);

        h.freeze(instruction);

        return instruction;
    },

    parseSortArgs: function(args) {
        var self        = this,
            instruction = new mixitup.UserInstruction(),
            arg         = null,
            sortString  = '',
            i           = -1;

        instruction.animate = self.config.animation.enable;
        instruction.command = new mixitup.CommandSort();

        for (i = 0; i < args.length; i++) {
            arg = args[i];

            if (arg === null) continue;

            switch (typeof arg) {
                case 'string':
                    // Sort string

                    sortString = arg;

                    break;
                case 'object':
                    // Array of element references

                    if (arg.length) {
                        instruction.command.collection = Array.prototype.slice.call(arg);
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

        if (sortString) {
            instruction.command = self.parseSortString(sortString, instruction.command);
        }

        instruction = self.callFilters('instructionParseSortArgs', instruction, arguments);

        h.freeze(instruction);

        return instruction;
    },

    /**
     * @private
     * @instance
     * @since   2.0.0
     * @param   {Array<*>}  args
     * @return  {mixitup.UserInstruction}
     */

    parseInsertArgs: function(args) {
        var self        = this,
            instruction = new mixitup.UserInstruction(),
            arg         = null,
            i           = -1;

        instruction.animate = self.config.animation.enable;
        instruction.command = new mixitup.CommandInsert();

        for (i = 0; i < args.length; i++) {
            arg = args[i];

            if (arg === null) continue;

            if (typeof arg === 'number') {
                // Insert index

                instruction.command.index = arg;
            } else if (typeof arg === 'string' && ['before', 'after'].indexOf(arg) > -1) {
                // 'before'/'after'

                instruction.command.position = arg;
            } else if (typeof arg === 'string') {
                // Markup

                instruction.command.collection =
                    Array.prototype.slice.call(h.createElement(arg).children);
            } else if (typeof arg === 'object' && h.isElement(arg, self.dom.document)) {
                // Single element

                !instruction.command.collection.length ?
                    (instruction.command.collection = [arg]) :
                    (instruction.command.sibling = arg);
            } else if (typeof arg === 'object' && arg.length) {
                // Multiple elements in array or jQuery collection

                !instruction.command.collection.length ?
                    (instruction.command.collection = arg) :
                    instruction.command.sibling = arg[0];
            } else if (typeof arg === 'object' && arg.childNodes && arg.childNodes.length) {
                // Document fragment

                !instruction.command.collection.length ?
                    instruction.command.collection = Array.prototype.slice.call(arg.childNodes) :
                    instruction.command.sibling = arg.childNodes[0];
            } else if (typeof arg === 'object') {
                // Insert command

                h.extend(instruction.command, arg);
            } else if (typeof arg === 'boolean') {
                instruction.animate = arg;
            } else if (typeof arg === 'function') {
                instruction.callback = arg;
            }
        }

        if (!instruction.command.collection.length && self.config.debug.showWarnings) {
            console.warn(mixitup.messages.WARNING_INSERT_NO_ELEMENTS);
        }

        instruction = self.callFilters('instructionParseInsertArgs', instruction, arguments);

        h.freeze(instruction);

        return instruction;
    },

    /**
     * @private
     * @instance
     * @since   3.0.0
     * @param   {Array<*>}  args
     * @return  {mixitup.UserInstruction}
     */

    parseRemoveArgs: function(args) {
        var self        = this,
            instruction = new mixitup.UserInstruction(),
            target      = null,
            arg         = null,
            i           = -1;

        instruction.animate = self.config.animation.enable;
        instruction.command = new mixitup.CommandRemove();

        for (i = 0; i < args.length; i++) {
            arg = args[i];

            if (arg === null) continue;

            switch (typeof arg) {
                case 'number':
                    if (self.targets[arg]) {
                        instruction.command.targets[0] = self.targets[arg];
                    }

                    break;
                case 'string':
                    instruction.command.collection = Array.prototype.slice.call(self.dom.parent.querySelectorAll(arg));

                    break;
                case 'object':
                    if (arg && arg.length) {
                        instruction.command.collection = arg;
                    } else if (h.isElement(arg, self.dom.document)) {
                        instruction.command.collection = [arg];
                    } else {
                        // Remove command

                        h.extend(instruction.command, arg);
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

        if (instruction.command.collection.length) {
            for (i = 0; target = self.targets[i]; i++) {
                if (instruction.command.collection.indexOf(target.dom.el) > -1) {
                    instruction.command.targets.push(target);
                }
            }
        }

        instruction = self.callFilters('instructionParseRemoveArgs', instruction, arguments);

        h.freeze(instruction);

        return instruction;
    },

    /**
     * @private
     * @instance
     * @since       3.0.0
     * @param       {mixitup.QueueItem}         queueItem
     * @return      {Promise.<mixitup.State>}
     */

    queueMix: function(queueItem) {
        var self            = this,
            deferred        = null,
            toggleSelector  = '';

        self.callActions('beforeQueueMix', arguments);

        deferred = h.defer(mixitup.libraries);

        if (self.config.animation.queue && self.queue.length < self.config.animation.queueLimit) {
            queueItem.deferred = deferred;

            self.queue.push(queueItem);

            // Keep controls in sync with user interactions. Mixer will catch up as it drains the queue.

            if (self.config.controls.enable) {
                if (self.isToggling) {
                    self.buildToggleArray(queueItem.instruction.command);

                    toggleSelector = self.getToggleSelector();

                    self.updateControls({
                        filter: {
                            selector: toggleSelector
                        }
                    });
                } else {
                    self.updateControls(queueItem.instruction.command);
                }
            }
        } else {
            if (self.config.debug.showWarnings) {
                console.warn(mixitup.messages.WARNING_MULTIMIX_INSTANCE_QUEUE_FULL);
            }

            deferred.resolve(self.state);

            mixitup.events.fire('mixBusy', self.dom.container, {
                state: self.state,
                instance: self
            }, self.dom.document);

            if (typeof self.config.callbacks.onMixBusy === 'function') {
                self.config.callbacks.onMixBusy.call(self.dom.container, self.state, self);
            }
        }

        return self.callFilters('promiseQueueMix', deferred.promise, arguments);
    },

    /**
     * Initialises a newly instantiated mixer by filtering in all targets, or those
     * specified via the `load.filter` configuration option.
     *
     * @example
     * .init([startFromHidden])
     *
     * @example <caption>Example 1: Running init after mixer instantiation</caption>
     * var container = document.querySelector('.mixitup-container');
     * var mixer = mixitup(container);
     *
     * mixer.init();
     *
     * @example
     * var mixer = mixitup(.mixitup-container, {
     *     selectors: {
     *         target: '.item'
     *     }
     * });
     *
     * mixer.init();
     *
     * @public
     * @instance
     * @since       3.0.0
     * @return      {Promise.<mixitup.State>}
     */

    init: function() {
        var self            = this,
            target          = null,
            filterCommand   = self.parseFilterArgs([self.config.load.filter]).command,
            i               = -1;

        for (i = 0; target = self.targets[i]; i++) {
            if (!target.isShown) {
                target.hide();
            }
        }

        return self.multimix({
            filter: filterCommand
        }, self.config.load.animate);
    },

    /**
     * A shorthand method for `.filter('all')`.
     *
     * @example
     * .show()
     *
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
     * A shorthand method for `.filter('none')`.
     *
     * @example
     * .hide()
     *
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
     * Returns a boolean indicating whether or not a MixItUp operation is
     * currently in progress.
     *
     * @example
     * .isMixing()
     *
     * @public
     * @instance
     * @since   2.0.0
     * @return  {boolean}
     */

    isMixing: function() {
        var self = this;

        return self.isBusy;
    },

    /**
     * Filters the mixer according to the specified filter command.
     *
     * @example
     * .filter(selector [,animate] [,callback])
     *
     * @public
     * @instance
     * @since       2.0.0
     * @param       {string}    selector
     *      Any valid CSS selector (i.e. `'.category-2'`), or the strings `'all'` or `'none'`.
     * @param       {boolean}   [animate]
     * @param       {function}  [callback]
     * @return      {Promise.<mixitup.State>}
     */

    filter: function() {
        var self = this,
            args = self.parseFilterArgs(arguments);

        return self.multimix({
            filter: args.command
        }, args.animate, args.callback);
    },

    /**
     * Adds a selector to the currently active set of toggles and filters the mixer.
     *
     * @example
     * .toggleOn(selector [,animate] [,callback])
     *
     * @public
     * @instance
     * @since       3.0.0
     * @param       {string}    selector
     *      Any valid CSS selector (i.e. `'.category-2'`)
     * @param       {boolean}   [animate]
     * @param       {function}  [callback]
     * @return      {Promise.<mixitup.State>}
     */

    toggleOn: function() {
        var self            = this,
            args            = self.parseFilterArgs(arguments),
            selector        = args.command.selector,
            toggleSelector  = '';

        self.isToggling = true;

        if (self.toggleArray.indexOf(selector) < 0) {
            self.toggleArray.push(selector);
        }

        toggleSelector = self.getToggleSelector();

        return self.multimix({
            filter: toggleSelector
        }, args.animate, args.callback);
    },

    /**
     * Removes a selector from the currently active set of toggles and filters the mixer.
     *
     * @example
     * .toggleOn(selector [,animate] [,callback])
     *
     * @public
     * @instance
     * @since       3.0.0
     * @param       {string}    selector
     *      Any valid CSS selector (i.e. `'.category-2'`)
     * @param       {boolean}   [animate]
     * @param       {function}  [callback]
     * @return      {Promise.<mixitup.State>}
     */

    toggleOff: function() {
        var self            = this,
            args            = self.parseFilterArgs(arguments),
            selector        = args.command.selector,
            toggleSelector  = '';

        self.isToggling = true;

        self.toggleArray.splice(self.toggleArray.indexOf(selector), 1);

        toggleSelector = self.getToggleSelector();

        return self.multimix({
            filter: toggleSelector
        }, args.animate, args.callback);
    },

    /**
     * Sorts the mixer according to the specified sort command.
     *
     * @example
     * .sort(sortString [,animate] [,callback])
     *
     * @public
     * @instance
     * @since       2.0.0
     * @param       {string}    sortString
     *      A colon-seperated "sorting pair" (e.g. `'published:asc'`, or `'random'`.
     * @param       {boolean}   [animate]
     * @param       {function}  [callback]
     * @return      {Promise.<mixitup.State>}
     */

    sort: function() {
        var self = this,
            args = self.parseSortArgs(arguments);

        return self.multimix({
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
        // TODO: parse arguments, and map to multimix
    },

    /**
     * @public
     * @instance
     * @since   3.0.0
     * @param   {object}            command
     * @param   {boolean}           [isPreFetch]
     *      An optional boolean indicating that the operation is being pre-fetched for execution at a later time.
     * @return  {Operation|null}
     */

    getOperation: function(command, isPreFetch) {
        var self                = this,
            sortCommand         = command.sort,
            filterCommand       = command.filter,
            changeLayoutCommand = command.changeLayout,
            removeCommand       = command.remove,
            insertCommand       = command.insert,
            operation           = new mixitup.Operation();

        operation = self.callFilters('operationUnmappedGetOperation', operation, arguments);

        // NB: `isPreFetch` is passed as may be useful for extensions, not used in this function
        // but placed here to satisfy jscs

        isPreFetch;

        operation.command       = command;
        operation.startState    = self.state;
        operation.id            = h.randomHex();

        if (self.isBusy) {
            if (self.config.debug.showWarnings) {
                console.warn(mixitup.messages.WARNING_GET_OPERATION_INSTANCE_BUSY);
            }

            return null;
        }

        if (insertCommand) {
            self.insertTargets(insertCommand, operation);
        }

        if (removeCommand) {
            operation.toRemove = removeCommand.targets;
        }

        operation.startSort = operation.newSort = operation.startState.activeSort;
        operation.startOrder = operation.newOrder = self.targets;

        if (sortCommand) {
            operation.startSort = operation.startState.activeSort;
            operation.newSort   = sortCommand;

            if (
                sortCommand.order       === 'random' ||
                sortCommand.attribute   !== operation.startState.activeSort.attribute ||
                sortCommand.order       !== operation.startState.activeSort.order ||
                sortCommand.collection  !== operation.startState.activeSort.collection
            ) {
                operation.willSort = true;

                self.sortOperation(operation);
            }
        }

        operation.startFilter = operation.newFilter = operation.startState.activeFilter;

        if (filterCommand) {
            operation.newFilter = filterCommand;

            if (operation.newFilter.selector === 'all') {
                operation.newFilter.selector = self.config.selectors.target;
            } else if (operation.newFilter.selector === 'none') {
                operation.newFilter.selector = '';
            }
        }

        self.filterOperation(operation);

        if (typeof changeLayoutCommand !== 'undefined') {
            operation.startContainerClass = operation.startState.activeContainerClass;

            operation.newContainerClass = changeLayoutCommand.containerClass || operation.startContainerClass;

            if (operation.newContainerClass !== operation.startContainerClass) {
                operation.willChangeLayout = true;
            }
        }

        // Populate the operation's position data

        self.getStartMixData(operation);
        self.setInter(operation);

        operation.docState = h.getDocumentState();

        self.getInterMixData(operation);
        self.setFinal(operation);
        self.getFinalMixData(operation);

        self.parseEffects();

        operation.hasEffect = self.hasEffect();

        self.getTweenData(operation);

        operation.newState = self.buildState(operation);

        return self.callFilters('operationMappedGetOperation', operation, arguments);
    },

    /**
     * Performs simultaneous `filter`, `sort`, `insert`, `remove` and `changeLayout`
     * operations as requested.
     *
     * @example
     * .multimix(multimixCommand [,animate] [,callback])
     *
     * @public
     * @instance
     * @since       2.0.0
     * @param       {object}    multimixCommand
     *      An object containing one or more things to do
     * @param       {boolean}   [animate=true]
     * @param       {function}  [callback=null]
     * @return      {Promise.<mixitup.State>}
     */

    multimix: function() {
        var self        = this,
            operation   = null,
            animate     = false,
            queueItem   = null,
            instruction = self.parseMultimixArgs(arguments);

        self.callActions('beforeMultimix', arguments);

        if (!self.isBusy) {
            operation = self.getOperation(instruction.command);

            if (self.config.controls.enable) {
                // Update controls for API calls

                if (instruction.command.filter && !self.isToggling) {
                    // As we are not toggling, reset the toggle array
                    // so new filter overrides existing toggles

                    self.toggleArray.length = 0;
                    self.buildToggleArray(operation.command);
                }

                if (self.queue.length < 1) {
                    self.updateControls(operation.command);
                }
            }

            if (instruction.callback) self.userCallback = instruction.callback;

            // Always allow the instruction to override the instance setting

            animate = (instruction.animate ^ self.config.animation.enable) ?
                instruction.animate :
                self.config.animation.enable;

            self.callFilters('operationMultimix', operation, arguments);

            return self.goMix(animate, operation);
        } else {
            queueItem = new mixitup.QueueItem();

            queueItem.args          = arguments;
            queueItem.instruction   = instruction;
            queueItem.trigger       = self.lastClicked;
            queueItem.isToggling    = self.isToggling;

            return self.queueMix(queueItem);
        }
    },

    /**
     * Renders a previously created operation at a specific point in its path, as
     * determined by a multiplier between 0 and 1.
     *
     * @example
     * .tween(operation, multiplier)
     *
     * @public
     * @instance
     * @since   3.0.0
     * @param   {mixitup.Operation}     operation
     *      An operation object created via the `getOperation` method
     *
     * @param   {Float}                 multiplier
     *      Any number between 0 and 1 representing the percentage complete of the operation
     * @return  {void}
     */

    tween: function(operation, multiplier) {
        var target          = null,
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
            if (target.isShown) {
                target.hide();
            }

            if ((toHideIndex = operation.toHide.indexOf(target)) > -1) {
                posData = operation.toHidePosData[toHideIndex];

                if (!target.isShown) {
                    target.show();
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
            args = self.parseInsertArgs(arguments);

        return self.multimix({
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
            args = self.parseInsertArgs(arguments);

        return self.insert(args.command.collection, 'before', args.command.sibling, args.animate, args.callback);
    },

    /**
     * @public
     * @instance
     * @since       3.0.0
     * @return      {Promise.<mixitup.State>}
     */

    insertAfter: function() {
        var self = this,
            args = self.parseInsertArgs(arguments);

        return self.insert(args.command.collection, 'after', args.command.sibling, args.animate, args.callback);
    },

    /**
     * @public
     * @instance
     * @since       2.0.0
     * @return      {Promise.<mixitup.State>}
     */

    prepend: function() {
        var self = this,
            args = self.parseInsertArgs(arguments);

        return self.insert(0, args.command.collection, args.animate, args.callback);
    },

    /**
     * @public
     * @instance
     * @since       2.0.0
     * @return      {Promise.<mixitup.State>}
     */

    append: function() {
        var self = this,
            args = self.parseInsertArgs(arguments);

        return self.insert(self.state.totalTargets, args.command.collection, args.animate, args.callback);
    },

    /**
     * @public
     * @instance
     * @since       3.0.0
     * @return      {Promise.<mixitup.State>}
     */

    remove: function() {
        var self = this,
            args = self.parseRemoveArgs(arguments);

        return self.multimix({
            remove: args.command
        }, args.animate, args.callback);
    },

    /**
     * @public
     * @instance
     * @since       2.0.0
     * @param       {string}    [stringKey]
     * @return      {*}
     */

    getConfig: function(stringKey) {
        var self    = this,
            value   = null;

        if (!stringKey) {
            value = self.config;
        } else {
            value = h.getProperty(self.config, stringKey);
        }

        return self.callFilters('valueGetConfig', value, arguments);
    },

    /**
     * @public
     * @instance
     * @since       2.0.0
     * @param       {object}    config
     * @return      {void}
     */

    configure: function(config) {
        var self = this;

        self.callActions('beforeConfigure', arguments);

        h.extend(self.config, config, true);

        self.callActions('afterConfigure', arguments);
    },

    /**
     * @public
     * @instance
     * @since       2.0.0
     * @return      {mixitup.State}
     */

    getState: function() {
        var self    = this,
            state   = null;

        if (typeof Object.assign === 'function') {
            state = new mixitup.State();

            Object.assign(state, self.state);
        } else {
            state = self.state;
        }

        return self.callFilters('stateGetState', state, arguments);
    },

    /**
     * @public
     * @instance
     * @since 2.1.2
     * @return {void}
     */

    forceRefresh: function() {
        var self = this;

        self.indexTargets();
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
            control = null,
            target  = null,
            i       = 0;

        self.callActions('beforeDestroy', arguments);

        for (i = 0; control = self.controls[i]; i++) {
            control.removeBinding(self);
        }

        for (i = 0; target = self.targets[i]; i++) {
            hideAll && target.hide();

            target.unbindEvents();
        }

        if (self.dom.container.id.indexOf('MixItUp') === 0) {
            self.dom.container.removeAttribute('id');
        }

        delete mixitup.instances[self.id];

        self.callActions('afterDestroy', arguments);
    }
});