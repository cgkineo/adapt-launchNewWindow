define([
    'core/js/adapt'
], function(Adapt) {

    var LaunchView = Backbone.View.extend({

        _wasClosed: false,

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

            href[2] = ( !href[2] ? "?" : "" ) + "relaunched=true";

            var data = this.model.toJSON();
            _.extend(data, {
                location: window.location,
                href: href.join(""),
                _wasClosed: this._wasClosed
            });

            var template = Handlebars.templates[this.constructor.template];

            this.$el.html(template(data));

        },

        setCourseClosed: function(closed) {

            this._wasClosed = closed;
            this.render();

        }

    }, {

        template: "adapt-launch"

    });

    return LaunchView;  

});