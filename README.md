# adapt-launchNewWindow

The launch new window extension forces your Adapt course to open in a new window - something that can be very useful if your course is being run from a platform that embeds the content within an iframe or frameset (which can cause rendering issues in iOS). The extension allows you to be quite specific about when it does this so you can, for example, set it to open the content on iOS/iPadOS only when running from an LMS (i.e. when index_lms.html is used to run the course).

```javascript
//config.json
    "_launchNewWindow": {
        "_isEnabled": true,
        "_stopSessionInitialize": true,
        "_activeOnPages": [
            "index_lms.html"
        ],
        "_activeOnSelector": ".os-ios",
        "_target": "courseWin",
        "_strWindowFeatures": "width={{width}},height={{height}},menubar=no,location=no,directories=no,resizable=yes,scrollbars=yes",
        "_delay": 500,
        "preLaunchTitle": "The course should now open in a new browser window.",
        "preLaunchBody": "If this does not occur, please deactivate any popup blocking software - then <a href=\"{{href}}\" target=\"_blank\">click here</a> or refresh this page to try again.",
        "launchTitle": "The course should now be open in a new browser window.",
        "launchBody": "Please ensure you don't close or do anything in this window whilst the course is in progress.",
        "closedTitle": "You have closed the course.",
        "closedBody": "Please close this window to continue."
    }
```
The `_activeOnSelector` setting can be a comma-separated list if you want to target multiple platforms/browsers e.g. `"_activeOnSelector": ".os-ios, .os-android"` or leave blank for always-on.
