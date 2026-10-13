# adapt-launchNewWindow

Opens the course in its own browser window. This is useful when a platform runs the content inside an iframe or frameset, which can cause rendering problems, particularly on iOS.

## Description

When the course loads on a page and device that match the settings, the launching window shows a message instead of the course and opens the course in a new window. The launching window stays open and its message follows the course window: before launch, in progress, and closed. If a popup blocker stops the new window opening, the pre-launch message carries a link the learner can use instead.

The settings let you be specific about when this happens. For example, you can open the course in a new window only on iOS/iPadOS, and only when it runs from an LMS (when `index_lms.html` is the launch page).

With `_stopSessionInitialize` on, the launching window doesn't start a SCORM session or load the course, so only the course window tracks to the LMS. It finds the LMS through the launching window, as it would from the frame.

Settings live in `config.json`:

```json
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

## Settings Overview

| Attribute | Type | Default | Description |
| :-------- | :--- | :------ | :---------- |
| `_isEnabled` | boolean | `false` | Turns the extension on. |
| `_stopSessionInitialize` | boolean | `true` | Stops the launching window starting a SCORM session, leaving it to the course window. |
| `_activeOnPages` | array | `["index_lms.html"]` | Only opens a new window when the page address matches one of these (each is a regular expression). Leave empty for every page. |
| `_activeOnSelector` | string | `".os-ios"` | Only opens a new window when the `html` element matches this selector. Use a comma-separated list for several, e.g. `".os-ios, .os-android"`, or leave empty for every browser and device. |
| `_target` | string | `"courseWin"` | The name given to the course window. |
| `_strWindowFeatures` | string | see above | The window features passed to `window.open`. `{{width}}` and `{{height}}` are the available screen size. |
| `_delay` | number | `2000` | Milliseconds the launching window shows its message before opening the course window. |
| `preLaunchTitle`, `preLaunchBody` | string | see above | Shown before the course window opens. `{{href}}` is the course window's address. |
| `launchTitle`, `launchBody` | string | see above | Shown while the course window is open. |
| `closedTitle`, `closedBody` | string | see above | Shown once the course window is closed. |

## Limitations

- The course window is found again by name (`_target`). Refreshing the launching window closes and reopens a course window that's already open.
- If the browser blocks popups, the course only opens when the learner uses the link in the pre-launch message.

---

**Author / maintainer:** Mindtools Kineo<br>
