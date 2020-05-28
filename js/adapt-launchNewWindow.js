define([
    'core/js/adapt',
    'core/js/models/courseModel',
    './launchView',
    './configModel'
], function(Adapt, CourseModel, LaunchView) {

    var LAUNCH_MODE = ENUM([
        "NONE",
        "NEW_WINDOW",
        "CURRENT_WINDOW"
    ]);

    var LAUNCH_STATE = ENUM([
        "PRELAUNCH",
        "PROGRESS",
        "CLOSED"
    ]);

    var Launch = Backbone.Controller.extend({

        MODE: LAUNCH_MODE,
        STATE: LAUNCH_STATE,

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
                // If the window has been relaunched then just proceed as normal loading Adapt
                Adapt.trigger("offlineStorage:prepare");
                Adapt.config.set("_canTriggerDataLoaded", true);
                return;
            }

            this.stopAdaptLoading();
            this.newLaunchView();

        },

        isEnabled: function() {

            // Config not defined or enabled
            if (!this._config || !this._config._isEnabled) return;

            // Check relaunched in search part incase window.open doesn't work properly
            if (/relaunched=y/.test(location.search)) return;

            // Check if active on this page
            if (this._config._activeOnPages && this._config._activeOnPages.length > 0) {
                var found = false;
                this._config._activeOnPages.forEach(function(pageName) {
                    if (new RegExp(pageName).test(location.href)) {
                        found = true;
                    }
                });
                if (!found) return;
            }

            // Check if the launch mode matches properly
            this.mode = this.getLaunchMode();
            if (this.mode !== LAUNCH_MODE.NEW_WINDOW) return;

            this.href = this.getHREF();
            this.delay = this.getDelay();

            return true;

        },

        getLaunchMode: function() {

            var $html = $("html");
            var isNewWindow = this._config._activeOnSelector && $html.is(this._config._activeOnSelector);
            
            if (isNewWindow) return LAUNCH_MODE.NEW_WINDOW;

            return LAUNCH_MODE.CURRENT_WINDOW;

        },

        getHREF: function() {

            var location = document.createElement("a");
            location.href = window.location.href;

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
                    delay = parseInt(this._config._delay) || 2000;
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

        newLaunchView: function() {

            this.launchView = new LaunchView({
                model: Adapt.config,
                href : this.href
            });

            this.listenTo(this.launchView, "launch:manualLaunch", this.onLaunchedManually);

            $("body").append(this.launchView.$el);

            $("#wrapper, .js-loading, .loading").fadeOut({ duration: "fast", complete: this.onLaunchViewReady });
   
        },

        onLaunchViewReady: function() {

            _.delay(this.onLaunchDelayComplete, this.delay);

        },

        onLaunchDelayComplete: function() {

            if (this._wasLaunchedManually) return;
            this.openNewWindow();

        },

        onLaunchedManually: function() {

            this._wasLaunchedManually = true;
            this.openNewWindow();

        },

        openNewWindow: function() {

            if (this.newWindow) {
                $(this.newWindow).off("beforeunload");
                this.newWindow.close();
                this.newWindow = null;
            }

            var strWindowFeatures = Handlebars.compile(this._config._strWindowFeatures)({
                width: screen.availWidth,
                height: screen.availHeight
            });

            this.newWindow = window.open(this.href, this._config._target, strWindowFeatures);
            if (this.newWindow.location.href != "about:blank") {

                // Force close on stale windows
                // This will happen if someone refreshes the launch page with the course open
                this.newWindow.close();
                this.newWindow = window.open(this.href, this._config._target, strWindowFeatures);

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

        }

    });

    Adapt.launch = new Launch();

    return Adapt.launch;

});
