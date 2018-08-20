define([
    'core/js/adapt',
    'core/js/models/configModel'
], function(Adapt, ConfigModel) {

    // Override config model to stop spoor from initializing on 'configModel:dataLoaded'
    ConfigModel.prototype.initialize = function(attrs, options) {

        this.url = options.url;
        // Fetch data & if successful trigger event to enable plugins to stop course files loading
        // Then check if course files can load
        // 'configModel:loadCourseData' event starts the core content collections and models being fetched
        this.fetch({
            success: function() {
                Adapt.trigger('offlineStorage:prepare');

                Adapt.wait.queue(function() {
                    Adapt.trigger('configModel:preDataLoaded');
                    if (this.get('_canTriggerDataLoaded')) {
                        Adapt.trigger('configModel:dataLoaded');
                    }
                    if (this.get('_canLoadData')) {
                        Adapt.trigger('configModel:loadCourseData');
                    }

                    if (this.get('_defaultDirection') === 'rtl'){
                        // We're going to use rtl style
                        $('html').addClass('dir-rtl');
                    }

                    // Check if animations should be disabled
                    var disableAnimationArray = this.get('_disableAnimationFor');
                    if (disableAnimationArray && disableAnimationArray.length > 0) {
                        for (var i = 0; i < disableAnimationArray.length; i++) {
                            if ($("html").is(disableAnimationArray[i])) {
                                this.set('_disableAnimation', true);
                                console.log('Animation disabled.');
                            }
                        }
                    }
                }.bind(this));
            }.bind(this),
            error: function() {
                console.log('Unable to load course/config.json');
            }
        });

    };

})
