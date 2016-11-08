/* global mixitup:true, h */

/**
 * The `mixitup` "factory" function is used to create individual instances
 * of MixItUp, or "mixers". All API methods can then be called using the
 * mixer instance returned by the factory function.
 *
 * When loading MixItUp via a script tag, the factory function is accessed
 * as the global variable `mixitup`. When using a module loader such as Browserify
 * or RequireJS however, the factory function is exported directly into your module
 * when you require the MixItUp library.
 *
 * @example
 * mixitup(container [,config] [,foreignDoc])
 *
 * @example <caption>Example 1: Creating a mixer instance with an element reference</caption>
 * var containerEl = document.querySelector('.container');
 *
 * var mixer = mixitup(containerEl);
 *
 * @example <caption>Example 2: Creating a mixer instance with a selector string</caption>
 * var mixer = mixitup('.container');
 *
 * @example <caption>Example 3: Passing a configuration object</caption>
 * var mixer = mixitup(containerEl, {
 *     animation: 'fade scale(.5)'
 * });
 *
 * @example <caption>Example 4: Passing an iframe reference</caption>
 * var mixer = mixitup(containerEl, config, foreignDocument);
 *
 * @global
 * @namespace
 * @public
 * @kind        function
 * @since       3.0.0
 * @param       {(Element|string)}  container
 *      A DOM element or selector string representing the container(s) on which to instantiate MixItUp.
 * @param       {object}            [config]
 *      An optional "configuration object" used to customize the behavior of the MixItUp instance.
 * @param       {object}            [foreignDoc]
 *      An optional reference to a `document`, which can be used to control a MixItUp instance in an iframe.
 * @return      {mixitup.Mixer}
 *      A "mixer" object representing the instance of MixItUp
 */

mixitup = function(container, config, foreignDoc) {
    var el                  = null,
        returnCollection    = false,
        instance            = null,
        facade              = null,
        doc                 = null,
        output              = null,
        instances           = [],
        id                  = '',
        elements            = [],
        i                   = -1;

    doc = foreignDoc || window.document;

    if (returnCollection = arguments[3]) {
        // A non-documented 4th paramater set only if the V2 API is in-use via a jQuery shim

        returnCollection = typeof returnCollection === 'boolean';
    }

    if (typeof container === 'string') {
        elements = doc.querySelectorAll(container);
    } else if (container && typeof container === 'object' && h.isElement(container, doc)) {
        elements = [container];
    } else if (container && typeof container === 'object' && container.length) {
        // Although not documented, the container may also be an array-like list of
        // elements such as a NodeList or jQuery collection. In the case if using the
        // V2 API via a jQuery shim, the container will typically be passed in this form.

        elements = container;
    } else {
        throw new Error(mixitup.messages.errorFactoryInvalidContainer());
    }

    if (elements.length < 1) {
        throw new Error(mixitup.messages.errorFactoryContainerNotFound());
    }

    for (i = 0; el = elements[i]; i++) {
        if (i > 0 && !returnCollection) break;

        if (!el.id) {
            id = 'MixItUp' + h.randomHex();

            el.id = id;
        } else {
            id = el.id;
        }

        if (mixitup.instances[id] instanceof mixitup.Mixer) {
            instance = mixitup.instances[id];

            if (!config || (config && config.debug && config.debug.showWarnings !== false)) {
                console.warn(mixitup.messages.warningFactoryPreexistingInstance());
            }
        } else {
            instance = new mixitup.Mixer();

            instance.attach(el, doc, id, config);

            mixitup.instances[id] = instance;
        }

        facade = new mixitup.Facade(instance);

        if (config && config.debug && config.debug.enable) {
            instances.push(instance);
        } else {
            instances.push(facade);
        }
    }

    if (returnCollection) {
        output = new mixitup.Collection(instances);
    } else {
        // Return the first instance regardless

        output = instances[0];
    }

    return output;
};

/**
 * The `.use()` static method is used to extend the functionalityof mixitup with compatible
 * extensions and libraries.
 *
 * @example
 * mixitup.use(extension)
 *
 * @public
 * @static
 * @since   3.0.0
 * @param   {*}  extension   A reference to the extension or library to be used.
 * @return  {void}
 */

mixitup.use = function(extension) {
    // Call the extension's factory function, passing
    // the mixitup factory as a paramater

    if (typeof extension === 'function' && extension.TYPE === 'mixitup-extension') {
        // Mixitup extension

        if (typeof mixitup.extensions[extension.NAME] === 'undefined') {
            extension(mixitup);

            mixitup.extensions[extension.NAME] = extension;
        }
    } else if (extension.fn && extension.fn.jquery) {
        // jQuery

        mixitup.libraries.$ = extension;
    }
};

mixitup.instances   = {};
mixitup.extensions  = {};
mixitup.libraries   = {};