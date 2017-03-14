define([
    'core/js/adapt',
    './launchStateEnum'
], function(Adapt, LAUNCH_STATE) {

    var LaunchView = Backbone.View.extend({

        state: LAUNCH_STATE.PRELAUNCH,

        className: "launch-new-window",

        events: {
            "click a": "onLaunchedManually"
        },

        initialize: function(options) {
            this.href = options.href;
            this.render();
        },

        onLaunchedManually: function(event) {
            event.preventDefault();
            this.trigger("launch:manualLaunch");
        },
        
        render: function() {

            var data = this.model.toJSON();
            _.extend(data, {
                href: this.href,
                state: this.state,
                LAUNCH_STATE: LAUNCH_STATE
            });

            var template = Handlebars.templates[this.constructor.template];

            this.$el.html(template(data));

        },

        setLaunchState: function(state) {

            this.state = state;
            this.render();

        }

    }, {

        template: "launchNewWindow"

    });

    return LaunchView;  

});