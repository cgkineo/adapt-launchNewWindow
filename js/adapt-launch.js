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
            this.loadCourseData();           

        },

        isEnabled: function() {

            if (!this._config || !this._config._isEnabled) return;
            if (window._WAS_RELAUNCHED) return;
            if (/relaunched=true/.test(location.search)) return;
            if (!$("html").is(this._config._relaunchOnSelector)) return;

            return true;
        },

        stopAdaptLoading: function() {
            Adapt.config.setLocking("_canLoadData", false);
            Adapt.config.set("_canLoadData", false, {
                pluginName: "adapt-launch" 
            });
        },

        loadCourseData: function() {

            this.listenTo(Adapt, 'courseModel:dataLoaded', this.onCourseDataLoaded);
            
            Adapt.trigger("configModel:loadCourseData");

        },

        onCourseDataLoaded: function() {
            
            this.newLaunchView();

        },

        newLaunchView: function() {

            this.launchView = new LaunchView({
                model: Adapt.course
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

            var delay = 0 || this._config._delay;

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