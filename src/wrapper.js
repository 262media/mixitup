{{>banner}}

(function(window) {
    'use strict';

    var mixitup         = null,
        h               = null;

    {{>factory}}

    {{>h}}

    {{>base}}

    {{>base-static}}

    {{>config-animation}}

    {{>config-callbacks}}

    {{>config-controls}}

    {{>config-classnames}}

    {{>config-debug}}

    {{>config-layout}}

    {{>config-load}}

    {{>config-selectors}}

    {{>config-templates}}

    {{>config}}

    {{>mixer-dom}}

    {{>ui-classnames}}

    {{>command-multimix}}

    {{>command-filter}}

    {{>command-sort}}

    {{>command-insert}}

    {{>command-remove}}

    {{>command-change-layout}}

    {{>control-definition}}

    {{>control}}

    {{>style-data}}

    {{>transform-data}}

    {{>transform-defaults}}

    {{>events}}

    {{>queue-item}}

    {{>mixer}}

    {{>i-move-data}}

    {{>target-dom}}

    {{>target}}

    {{>collection}}

    {{>operation}}

    {{>state}}

    {{>user-instruction}}

    {{>messages}}

    {{>features}}

    {{>facade}}

    {{>module-definitions}}

    mixitup.NAME = '{{name}}';
    mixitup.CORE_VERSION = '{{version}}';
})(window);