# mixitup.Config.controls

## Overview




## Members

### <a id="mixitup.Config.controls#enable">mixitup.Config.controls.enable</a>




A boolean dictating whether or not the default controls should be enabled for
the mixer instance.

If `true` (default behavior), MixItUp will search the DOM for any clickable elements with
`data-filter`, `data-sort` or `data-toggle` attributes, and bind them for click events.

If `false`, no click handlers will be bound, and all functionality must therefore be performed
via the mixer's API methods.

If you do not intend to use the default controls, setting this property to `false` will
marginally improve the startup time of your mixer instance, and will also prevent any other active
mixer instances in the DOM which are using the default controls from controlling the instance.


|Type | Default
|---  | ---
|`boolean`| `true`

> Example: Disabling controls

```js
var mixer = mixitup(containerEl, {
    controls: {
        enable: false
    }
});

// With the default controls disabled, we can only control
// the mixer via its API methods, e.g.:

mixer.filter('.cat-1');
```

### <a id="mixitup.Config.controls#live">mixitup.Config.controls.live</a>




A boolean dictating whether or not to use event delegation when binding click events
to the default controls.

If `false` (default behavior), each control button in the DOM will be found and
individually bound when a mixer is instantiated, with their corresponding actions
cached for performance.

If `true`, a single click handler will be applied to the `window` (or container element - see
`config.controls.scope`), and any click events triggered by elements with `data-filter`,
`data-sort` or `data-toggle` attributes present will be handled as they propagate upwards.

If you require a user interface where control buttons may be added, removed, or changed during the
lifetime of a mixer, `controls.live` should be set to `true`. There is a marginal but unavoidable
performance deficit when using live controls, as the value of each control button must be read
from the DOM in real time once the click event has propagated.


|Type | Default
|---  | ---
|`boolean`| `true`

> Example: Setting live controls

```js
var mixer = mixitup(containerEl, {
    controls: {
        live: true
    }
});

// Control buttons can now be added, remove and changed without breaking
// the mixer's UI
```

### <a id="mixitup.Config.controls#scope">mixitup.Config.controls.scope</a>




A string dictating the "scope" to use when binding or querying the default controls. The available
values are `'global'` or `'local'`.

When set to `'global'` (default behavior), MixItUp will query the entire document for control buttons
to bind, or delegate click events from (see `config.controls.live`).

When set to `'local'`, MixItUp will only query (or bind click events to) its own container element.
This may be desireable if you require multiple active mixer instances within the same document, who's
controls would would otherwise intefere with each other if scoped globally.

Conversely, if you wish to control multiple instances with a single UI, you would create one
set of controls and keep the controls scope of each mixer set to `global`.


|Type | Default
|---  | ---
|`string`| `'global'`

> Example: Setting 'local' scoped controls

```js
var mixerOne = mixitup(containerOne, {
    controls: {
        scope: 'local'
    }
});

var mixerTwo = mixitup(containerTwo, {
    controls: {
        scope: 'local'
    }
});

// Both mixers can now exist within the same document with
// isolated controls placed within their container elements.
```

### <a id="mixitup.Config.controls#toggleLogic">mixitup.Config.controls.toggleLogic</a>




A string dictating the type of logic to apply when concatenating the filter selectors of
active toggle buttons (i.e. any clickable element with a `data-toggle` attribute).

If set to `'or'` (default behavior), selectors will be concatenated together as
a comma-seperated list. For example:

`'.cat-1, .cat-2'` (shows any elements matching `'.cat-1'` OR `'.cat-2'`)

If set to `'and'`, selectors will be directly concatenated together. For example:

`'.cat-1.cat-2'` (shows any elements which match both `'.cat-1'` AND `'.cat-2'`)


|Type | Default
|---  | ---
|`string`| `'or'`

> Example: Setting "and" toggle logic

```js
var mixer = mixitup(containerEl, {
    controls: {
        toggleLogic: 'and'
    }
});
```

### <a id="mixitup.Config.controls#toggleDefault">mixitup.Config.controls.toggleDefault</a>




A string dictating the filter behavior when all toggles are inactive.

When set to `'all'` (default behavior), *all* targets will be shown by default
when no toggles are active, or at the moment all active toggles are toggled off.

When set to `'none'`, no targets will be shown by default when no toggles are
active, or at the moment all active toggles are toggled off.


|Type | Default
|---  | ---
|`string`| `'all'`

> Example 1: Setting the default toggle behavior to `'all'`

```js
var mixer = mixitup(containerEl, {
    controls: {
        toggleDefault: 'all'
    }
});

mixer.toggleOn('.cat-2')
    .then(function() {
        // Deactivate all active toggles

        return mixer.toggleOff('.cat-2')
    })
    .then(function(state) {
         console.log(state.activeFilter.selector); // 'all'
         console.log(state.totalShow); // 12
    });
```
> Example 2: Setting the default toggle behavior to `'none'`

```js
var mixer = mixitup(containerEl, {
    controls: {
        toggleDefault: 'none'
    }
});

mixer.toggleOn('.cat-2')
    .then(function() {
        // Deactivate all active toggles

        return mixer.toggleOff('.cat-2')
    })
    .then(function(state) {
         console.log(state.activeFilter.selector); // 'none'
         console.log(state.totalShow); // 0
    });
```

