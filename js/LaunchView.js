import { LAUNCH_STATE } from './enums';

class LaunchView extends Backbone.View {

  className() {
    return 'launch-new-window';
  }

  events() {
    return {
      'click a': 'onLaunchedManually'
    };
  }

  initialize({ href }) {
    this.href = href;
    this.state = LAUNCH_STATE.PRELAUNCH;
    this.render();
  }

  onLaunchedManually(event) {
    event.preventDefault();
    this.trigger('launch:manualLaunch');
  }

  render() {
    const data = {
      ...this.model.toJSON(),
      href: this.href,
      state: this.state,
      LAUNCH_STATE
    };
    this.$el.html(Handlebars.templates[this.constructor.template](data));
  }

  setLaunchState(state) {
    this.state = state;
    this.render();
  }

}

LaunchView.template = 'launchNewWindow';

export default LaunchView;
