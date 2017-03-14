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

            _.bindAll(this, "onNewWindowClosed", "onNewWindowLaunched", "onLaunchViewReady", "onLaunchDelayComplete");

            this.listenTo(Adapt, 'configModel:preDataLoaded', this.onConfigLoaded);

        },

        onConfigLoaded: function() {

            this._config = Adapt.config.get("_launchNewWindow");

            if (window._relaunched) {
                // Trigger callback to let parent window know Adapt was launched
                window._relaunched();
            }
        
            if (!this.isEnabled()) {
                Adapt.config.set("_canTriggerDataLoaded", true);
                return;
            }

            this.stopAdaptLoading();
            this.start();

        },

        isEnabled: function() {

            if (!this._config || !this._config._isEnabled) return;

            // Check relaunched in search part incase window.open doesn't work properly
            if (/relaunched=y/.test(location.search)) return;

            this.mode = this.getLaunchMode();
            if (this.mode == LAUNCH_MODE.NONE) return;

            this.href = this.getHREF();
            this.delay = this.getDelay();

            return true;

        },

        getLaunchMode: function() {

            var $html = $("html");
            var isNewWindow = this._config._newWindow._selector && $html.is(this._config._newWindow._selector);
            var isCurrentWindow = this._config._currentWindow._selector && $html.is(this._config._currentWindow._selector);
            
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

            href[2] = (!href[2] ? "?" : "&") + "relaunched=y";

            return href.join("");

        },

        getDelay: function() {

            var delay;
            switch(this.mode) {
                case LAUNCH_MODE.NEW_WINDOW: {
                    delay = parseInt(this._config._newWindow._delay) || 2000;
                    break;
                } case LAUNCH_MODE.CURRENT_WINDOW: {
                    delay = parseInt(this._config._currentWindow._delay) || 0;
                    break;
                }
            }

            return delay;

        },

        stopAdaptLoading: function() {

            Adapt.config.set("_canTriggerDataLoaded", !this._config._stopSessionInitialize);

            Adapt.config.setLocking("_canLoadData", false);
            Adapt.config.set("_canLoadData", false, {
                pluginName: "adapt-launch" 
            });

        },

        start: function() {

            if (this.delay === 0 && this.mode == LAUNCH_MODE.CURRENT_WINDOW) {
                // If no delay and redirecting to current window, skip creation of a launch view
                this.launch();
                return;
            }

            this.newLaunchView();

        },

        newLaunchView: function() {

            this.launchView = new LaunchView({
                model: Adapt.config,
                href : this.href
            });

            this.listenTo(this.launchView, "launch:manualLaunch", this.onLaunchedManually);

            $("body").append(this.launchView.$el);

            $("#wrapper").fadeOut({ duration: "fast", complete: this.onLaunchViewReady });
   
        },

        onLaunchViewReady: function() {

            _.delay(this.onLaunchDelayComplete, this.delay);

        },

        onLaunchDelayComplete: function() {

            if (this._wasLaunchedManually) return;
            this.launch();

        },

        onLaunchedManually: function() {

            this._wasLaunchedManually = true;
            this.launch();

        },

        launch: function() {

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
                this.newWindow = null;
            }

            var strWindowFeatures = Handlebars.compile(this._config._newWindow._strWindowFeatures)({
                width: screen.availWidth,
                height: screen.availHeight
            });

            this.newWindow = window.open(this.href, this._config._newWindow._target, strWindowFeatures);
            if (this.newWindow.location.href != "about:blank") {

                // Force close on stale windows
                // This will happen if someone refreshes the launch page with the course open
                this.newWindow.close();
                this.newWindow = window.open(this.href, this._config._newWindow._target, strWindowFeatures);

            }

            // Attach callback function so that we know adapt has loaded on the other side
            this.newWindow._relaunched = this.onNewWindowLaunched;

        },

        onNewWindowLaunched: function() {

            // Adapt called back here from the new window
            $(this.newWindow).on("beforeunload", this.onNewWindowClosed);
            this.launchView.setLaunchState(LAUNCH_STATE.PROGRESS);
            
        },

        onNewWindowClosed: function() {

            // Content window was closed by the user
            this.launchView.setLaunchState(LAUNCH_STATE.CLOSED);

        },

        openCurrentWindow: function() {

            window.location.href = this.href;

        }

    });

    Adapt.launch = new Launch();

    return Adapt.launch;

});