define([
    'core/js/adapt',
    'core/js/models/courseModel',
    './launchView',
    './launchStateEnum',
    './launchModeEnum',
    './configModel'
], function(Adapt, CourseModel, LaunchView, LAUNCH_STATE, LAUNCH_MODE) {

    var Launch = Backbone.Controller.extend({

        mode: LAUNCH_MODE.NONE,
        href: null,

        initialize: function() {

            _.bindAll(this, "onNewWindowClosed", "onNewWindowLaunched", "onLaunchViewLoaded", "onLaunchDelayComplete");

            this.listenTo(Adapt, 'configModel:preDataLoaded', this.onConfigLoaded);

        },

        onConfigLoaded: function() {

            this._config = Adapt.config.get("_launch");

            if (window._relaunched) {
                window._relaunched();
            }
        
            if (!this.isEnabled()) {
                Adapt.config.set("_canTriggerDataLoaded", true);
                return;
            }

            this.stopAdaptLoading();
            this.newLaunchView();

        },

        isEnabled: function() {

            if (!this._config || !this._config._isEnabled) return;

            // Check relaunched in search part incase window.open doesn't work properly
            if (/rl=1/.test(location.search)) return;

            this.mode = this.getLaunchMode();
            if (this.mode == LAUNCH_MODE.NONE) return;

            this.href = this.getHREF();

            return true;

        },

        getLaunchMode: function() {

            var $html = $("html");
            var isNewWindow = $html.is(this._config._newWindow._selector);
            var isCurrentWindow = $html.is(this._config._currentWindow._selector);
            
            if (isNewWindow) return LAUNCH_MODE.NEW_WINDOW;
            if (isCurrentWindow) return LAUNCH_MODE.CURRENT_WINDOW;

            return LAUNCH_MODE.NONE;

        },

        getHREF: function() {

            var href;
            switch(this.mode) {
                case LAUNCH_MODE.NEW_WINDOW: {
                    href = this._config._newWindow._href;
                    break;
                } case LAUNCH_MODE.CURRENT_WINDOW: {
                    href = this._config._currentWindow._href;
                    break;
                }
            }

            var location = document.createElement("a");
            location.href = href;

            var href = [
                location.origin,
                location.pathname,
                location.search,
                location.hash
            ];

            href[2] = (!href[2] ? "?" : "&") + "rl=1";

            return href.join("");

        },

        stopAdaptLoading: function() {
            Adapt.config.set("_canTriggerDataLoaded", !this._config._stopSessionInitialize);
            Adapt.config.setLocking("_canLoadData", false);
            Adapt.config.set("_canLoadData", false, {
                pluginName: "adapt-launch" 
            });
        },

        newLaunchView: function() {

            this.launchView = new LaunchView({
                model: Adapt.config,
                href : this.href
            });

            this.listenTo(this.launchView, "launch:manualLaunch", this.onLaunchedManually);

            $("body").append(this.launchView.$el);

            $("#wrapper").fadeOut({ duration: "slow", complete: this.onLaunchViewLoaded });

        },

        onLaunchViewLoaded: function() {

            var delay; 
            try {
                delay = parseInt(this._config._delay);
            } catch(error) {
                delay = 2000;
            }

            _.delay(this.onLaunchDelayComplete, delay);

        },

        onLaunchDelayComplete: function() {

            if (this._wasLaunchedManually) return;
            this.processMode();

        },

        onLaunchedManually: function() {

            this._wasLaunchedManually = true;
            this.processMode();

        },

        processMode: function() {

            switch(this.mode) {
                case LAUNCH_MODE.NEW_WINDOW: {
                    this.openNewWindow();
                    break;
                } case LAUNCH_MODE.CURRENT_WINDOW: {
                    this.openCurrentWindow();
                    break;
                }
            }

        },
        openNewWindow: function() {

            if (this.newWindow) {
                $(this.newWindow).off("beforeunload");
                this.newWindow.close();
            }

            var strWindowFeatures = Handlebars.compile(this._config._newWindow._strWindowFeatures)({
                width: screen.availWidth,
                height: screen.availHeight
            });

            this.newWindow = window.open(this.href, this._config._newWindow._target, strWindowFeatures);
            this.newWindow._relaunched = this.onNewWindowLaunched;

            $(this.newWindow).on("beforeunload", this.onNewWindowClosed);

        },

        onNewWindowLaunched: function() {

            this.launchView.setLaunchState(LAUNCH_STATE.PROGRESS);
            
        },

        onNewWindowClosed: function() {

            this.launchView.setLaunchState(LAUNCH_STATE.CLOSED);

        },

        openCurrentWindow: function() {

            window.location.href = this.href;

        }

    });

    Adapt.launch = new Launch();

    return Adapt.launch;

});