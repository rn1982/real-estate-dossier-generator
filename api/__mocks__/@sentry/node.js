/* global jest */
// Mock for @sentry/node
const init = jest.fn();
const captureException = jest.fn();
const captureMessage = jest.fn();
const configureScope = jest.fn((callback) => {
  callback({
    setContext: jest.fn(),
    setTag: jest.fn(),
    setExtra: jest.fn(),
    setUser: jest.fn(),
  });
});

const Sentry = {
  init,
  captureException,
  captureMessage,
  configureScope,
};

module.exports = Sentry;
module.exports.init = init;
module.exports.captureException = captureException;
module.exports.captureMessage = captureMessage;
module.exports.configureScope = configureScope;