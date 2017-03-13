define([
    'core/js/adapt',
    './launchStateEnum'
], function(Adapt, LAUNCH_STATE) {

    var LaunchView = Backbone.View.extend({

        state: LAUNCH_STATE.PRELAUNCH,

        className: "launch",

        events: {
            "click a": "onLaunchedManually"
        },

        initialize: function() {
            this.render();
        },

        onLaunchedManually: function(event) {
            event.preventDefault();
            this.trigger("launch:manualLaunch");
        },
        
        render: function() {

            var href = [
                location.origin,
                location.pathname,
                location.search,
                location.hash
            ];

            // Add relaunched to search part incase window.open doesn't work properly
            //href[2] = ( !href[2] ? "?" : "" ) + "relaunched=true";

            var data = this.model.toJSON();
            _.extend(data, {
                location: window.location,
                href: href.join(""),
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

        template: "adapt-launch"

    });

    return LaunchView;  

});