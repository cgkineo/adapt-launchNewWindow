import Adapt from 'core/js/adapt';
import ConfigModel from 'core/js/models/configModel';
import LaunchView from './LaunchView';
import { LAUNCH_STATE } from './enums';

const RELAUNCHED_PARAM = 'relaunched=y';
const DEFAULT_DELAY = 2000;

class LaunchNewWindow extends Backbone.Controller {

  initialize() {
    this.config = null;
    this.href = null;
    this.newWindow = null;
    this.launchView = null;
    this.wasLaunchedManually = false;
    this.onNewWindowLaunched = this.onNewWindowLaunched.bind(this);
    this.onNewWindowClosed = this.onNewWindowClosed.bind(this);
    this.hookConfigParse();
  }

  /**
   * Core triggers `offlineStorage:prepare`, which starts the SCORM session, straight after
   * config.json loads, and plugins can't reorder that. Inspecting the config as it's parsed is
   * the one point before it, so the launching window can stop course data loading and keep the
   * LMS session for the course window.
   */
  hookConfigParse() {
    const parse = ConfigModel.prototype.parse;
    const controller = this;
    ConfigModel.prototype.parse = function(...args) {
      const data = parse.apply(this, args);
      controller.onConfigParsed(data);
      return data;
    };
  }

  onConfigParsed(data) {
    this.config = data?._launchNewWindow;

    // Let the launching window know the course window loaded
    window._relaunched?.();

    if (!this.isActive) return;

    data._canLoadData = false;
    if (this.config._stopSessionInitialize !== false && data._spoor) {
      data._spoor = { ...data._spoor, _isEnabled: false };
    }

    this.href = this.getHREF();
    this.listenToOnce(Adapt, 'configModel:dataLoaded', this.showLaunchView);
  }

  get isActive() {
    const config = this.config;
    if (!config?._isEnabled) return false;

    // The course window carries the param in case window.open didn't keep the window reference
    if (location.search.includes(RELAUNCHED_PARAM)) return false;

    const pages = config._activeOnPages;
    if (pages?.length && !pages.some(page => new RegExp(page).test(location.href))) return false;

    const selector = config._activeOnSelector;
    return !selector || $('html').is(selector);
  }

  get delay() {
    return parseInt(this.config._delay) || DEFAULT_DELAY;
  }

  getHREF() {
    const url = new URL(location.href);
    url.search += (url.search ? '&' : '?') + RELAUNCHED_PARAM;
    return url.href;
  }

  showLaunchView() {
    this.launchView = new LaunchView({ model: Adapt.config, href: this.href });
    this.listenTo(this.launchView, 'launch:manualLaunch', this.onLaunchedManually);
    $('body').append(this.launchView.$el);
    $('#wrapper, .js-loading, .loading').fadeOut({
      duration: 'fast',
      complete: _.once(() => _.delay(this.onLaunchDelayComplete.bind(this), this.delay))
    });
  }

  onLaunchDelayComplete() {
    if (this.wasLaunchedManually) return;
    this.openNewWindow();
  }

  onLaunchedManually() {
    this.wasLaunchedManually = true;
    this.openNewWindow();
  }

  openNewWindow() {
    if (this.newWindow) {
      $(this.newWindow).off('beforeunload', this.onNewWindowClosed);
      this.newWindow.close();
      this.newWindow = null;
    }

    const features = Handlebars.compile(this.config._strWindowFeatures ?? '')({
      width: screen.availWidth,
      height: screen.availHeight
    });
    const open = () => window.open(this.href, this.config._target, features);

    this.newWindow = open();
    // A popup blocker returns null, leaving the manual link in the launch view
    if (!this.newWindow) return;

    // Refreshing the launch page with the course open re-targets the stale window, so close it
    if (this.newWindow.location.href !== 'about:blank') {
      this.newWindow.close();
      this.newWindow = open();
      if (!this.newWindow) return;
    }

    // The course window calls this once its config loads
    this.newWindow._relaunched = this.onNewWindowLaunched;
  }

  onNewWindowLaunched() {
    $(this.newWindow).on('beforeunload', this.onNewWindowClosed);
    this.launchView.setLaunchState(LAUNCH_STATE.PROGRESS);
  }

  onNewWindowClosed() {
    this.launchView.setLaunchState(LAUNCH_STATE.CLOSED);
  }

}

Adapt.launch = new LaunchNewWindow();

export default Adapt.launch;
