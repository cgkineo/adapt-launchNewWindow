define([
    'core/js/adapt',
    'core/js/models/courseModel',
    './launchView'
], function(Adapt, CourseModel, LaunchView) {

    var Launch = Backbone.Controller.extend({

        initialize: function() {

            this.listenTo(Adapt, 'configModel:dataLoaded', this.onConfigLoaded);

        },

        onConfigLoaded: function() {

            this._config = Adapt.config.get("_launch");
        
            if (!this.isEnabled()) return;

            this.stopAdaptLoading();
            this.newLaunchView();

        },

        isEnabled: function() {

            if (!this._config || !this._config._isEnabled) return;
            if (window._WAS_RELAUNCHED) return;
            // Check relaunched in search part incase window.open doesn't work properly
            //if (/relaunched=true/.test(location.search)) return;
            if (!$("html").is(this._config._relaunchOnSelector)) return;

            return true;
        },

        stopAdaptLoading: function() {
            Adapt.config.setLocking("_canLoadData", false);
            Adapt.config.set("_canLoadData", false, {
                pluginName: "adapt-launch" 
            });
        },

        newLaunchView: function() {

            this.launchView = new LaunchView({
                model: Adapt.config
            });

            this.listenTo(this.launchView, "launch:manualLaunch", this.onLaunchedManually);

            $("body").append(this.launchView.$el);

            $("#wrapper").fadeOut({ duration: "slow", complete: _.bind(function() {

                this.onLaunchViewLoaded();

            }, this)});

        },

        onLaunchedManually: function() {

            this.openNewWindow();
            this._wasLaunchedManually = true;

        },

        onLaunchViewLoaded: function() {

            var delay; 
            try {
                delay = parseInt(this._config._delay);
            } catch(error) {
                delay = 2000;
            }

            _.delay(_.bind(function() {

                if (this._wasLaunchedManually) return;
                this.openNewWindow();

            }, this), delay);

        },

        openNewWindow: function() {

            var newWindow = window.open(window.location.href, "_blank");
            newWindow._WAS_RELAUNCHED = true;

            $(newWindow).on("beforeunload", _.bind(this.onNewWindowClosed, this));

        },

        onNewWindowClosed: function() {
            this.launchView.setCourseClosed(true);
        }

    });

    Adapt.launch = new Launch();

    return Adapt.launch;

});