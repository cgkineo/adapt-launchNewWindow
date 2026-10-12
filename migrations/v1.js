import { describe, whereContent, whereFromPlugin, mutateContent, checkContent, updatePlugin, getConfig, testSuccessWhere, testStopWhere } from 'adapt-migrations';
import _ from 'lodash';

describe('Launch New Window - v0.1.2 to v1.0.0', async () => {
  // The legacy schema stored _delay as a string; the runtime fell back to this when it didn't parse
  const DEFAULT_DELAY = 2000;
  let launchNewWindow;

  whereFromPlugin('Launch New Window - from <v1.0.0', { name: 'adapt-launchNewWindow', version: '<1.0.0' });

  whereContent('Launch New Window - where _launchNewWindow', async () => {
    launchNewWindow = getConfig()?._launchNewWindow;
    return launchNewWindow;
  });

  mutateContent('Launch New Window - convert _delay to a number', async () => {
    if (!_.has(launchNewWindow, '_delay') || typeof launchNewWindow._delay === 'number') return true;
    launchNewWindow._delay = parseInt(launchNewWindow._delay) || DEFAULT_DELAY;
    return true;
  });

  checkContent('Launch New Window - check _delay is a number', async () => {
    const isValid = !_.has(launchNewWindow, '_delay') || typeof launchNewWindow._delay === 'number';
    if (!isValid) throw new Error('Launch New Window - _delay not converted to a number');
    return true;
  });

  updatePlugin('Launch New Window - update to v1.0.0', { name: 'adapt-launchNewWindow', version: '1.0.0', framework: '>=5.19.1' });

  testSuccessWhere('v0.1.2 config with _delay as a numeric string', {
    fromPlugins: [{ name: 'adapt-launchNewWindow', version: '0.1.2' }],
    content: [
      { _type: 'config', _launchNewWindow: { _isEnabled: true, _activeOnSelector: '', _delay: '500' } }
    ]
  });

  testSuccessWhere('v0.1.2 config with _delay as an empty string', {
    fromPlugins: [{ name: 'adapt-launchNewWindow', version: '0.1.2' }],
    content: [
      { _type: 'config', _launchNewWindow: { _isEnabled: true, _delay: '' } }
    ]
  });

  testSuccessWhere('v0.1.0 config with _delay already a number', {
    fromPlugins: [{ name: 'adapt-launchNewWindow', version: '0.1.0' }],
    content: [
      { _type: 'config', _launchNewWindow: { _isEnabled: true, _delay: 500 } }
    ]
  });

  testSuccessWhere('v0.1.2 config without _delay', {
    fromPlugins: [{ name: 'adapt-launchNewWindow', version: '0.1.2' }],
    content: [
      { _type: 'config', _launchNewWindow: { _isEnabled: false } }
    ]
  });

  testStopWhere('incorrect version', {
    fromPlugins: [{ name: 'adapt-launchNewWindow', version: '1.0.0' }]
  });

  testStopWhere('no _launchNewWindow', {
    fromPlugins: [{ name: 'adapt-launchNewWindow', version: '0.1.2' }],
    content: [
      { _type: 'config' }
    ]
  });
});
