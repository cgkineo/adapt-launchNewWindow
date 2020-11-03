define([
  'core/js/adapt'
], function(Adapt) {

  var LaunchView = Backbone.View.extend({

    state: null,

    className: 'launch-new-window',

    events: {
      'click a': 'onLaunchedManually'
    },

    initialize: function(options) {
      this.state = Adapt.launch.STATE.PRELAUNCH;
      this.href = options.href;
      this.render();
    },

    onLaunchedManually: function(event) {
      event.preventDefault();
      this.trigger('launch:manualLaunch');
    },

    render: function() {

      var data = this.model.toJSON();
      _.extend(data, {
        href: this.href,
        state: this.state,
        LAUNCH_STATE: Adapt.launch.STATE
      });

      var template = Handlebars.templates[this.constructor.template];

      this.$el.html(template(data));

    },

    setLaunchState: function(state) {

      this.state = state;
      this.render();

    }

  }, {

    template: 'launchNewWindow'

  });

  return LaunchView;

});
