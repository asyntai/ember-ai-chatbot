/**
 * Option handling and the widget loader for ember-ai-chatbot.
 *
 * Kept apart from index.js so the tests can call it without an Ember install.
 */

'use strict';

const DEFAULT_SCRIPT_URL = 'https://widget.asyntai.com/static/js/chat-widget.js';
const WIDGET_ID_PATTERN = /^asyntai_[A-Za-z0-9]+$/;
const NAME = 'ember-ai-chatbot';
const CONFIG_KEY = 'asyntai';

const MISSING_ID_MESSAGE =
  NAME +
  ': "widgetId" is required. Set ENV.asyntai = { widgetId: \'asyntai_...\' } ' +
  'in config/environment.js. Copy the ID from the Install page of your ' +
  'Asyntai dashboard, for example asyntai_1a2b3c4d5e6f.';

function badIdMessage(widgetId) {
  return (
    NAME +
    ': "' +
    widgetId +
    '" does not look like a widget ID. It starts with asyntai_, for ' +
    'example asyntai_1a2b3c4d5e6f.'
  );
}

/**
 * Returns the cleaned options, or throws with a message that says what to fix.
 */
function validateOptions(options) {
  const opts = options || {};
  const widgetId = typeof opts.widgetId === 'string' ? opts.widgetId.trim() : '';

  if (!widgetId) {
    throw new Error(MISSING_ID_MESSAGE);
  }
  if (!WIDGET_ID_PATTERN.test(widgetId)) {
    throw new Error(badIdMessage(widgetId));
  }

  const scriptUrl =
    typeof opts.scriptUrl === 'string' && opts.scriptUrl.trim()
      ? opts.scriptUrl.trim()
      : DEFAULT_SCRIPT_URL;

  return {
    widgetId,
    scriptUrl,
    // Set to false to keep the widget off the app during `ember serve`.
    enableInDevelopment: opts.enableInDevelopment !== false,
  };
}

/**
 * The loader waits for the page's load event before it fetches the widget.
 * An ordinary `<script async src>` holds the load event open until its own
 * fetch finishes, so an unreachable server would delay the host page. This
 * pattern cannot. The guard stops a second copy if the snippet is also pasted
 * into index.html by hand.
 */
function buildLoader(widgetId, scriptUrl) {
  return (
    '(function(){var l=function(){' +
    'if(document.querySelector("script[data-asyntai-id]"))return;' +
    'var s=document.createElement("script");' +
    's.src=' +
    JSON.stringify(scriptUrl) +
    ';s.async=true;' +
    's.setAttribute("data-asyntai-id",' +
    JSON.stringify(widgetId) +
    ');' +
    'document.head.appendChild(s)};' +
    'if(document.readyState==="complete"){l()}' +
    'else{window.addEventListener("load",l)}})();'
  );
}

/**
 * Returns the HTML for the body-footer slot of index.html, or '' when the
 * widget should stay off. `config` is the app's config/environment.js result.
 * The test environment never gets the widget, so `ember test` makes no
 * network calls to Asyntai.
 */
function bodyFooter(config) {
  const env = (config && config.environment) || 'production';
  if (env === 'test') {
    return '';
  }

  const settings = validateOptions(config && config[CONFIG_KEY]);

  if (env === 'development' && !settings.enableInDevelopment) {
    return '';
  }

  // `<` is escaped so a value can never close the script tag early.
  const code = buildLoader(settings.widgetId, settings.scriptUrl).replace(/</g, '\\u003c');
  return '<script data-asyntai-loader>' + code + '</script>';
}

module.exports = {
  NAME,
  CONFIG_KEY,
  DEFAULT_SCRIPT_URL,
  WIDGET_ID_PATTERN,
  MISSING_ID_MESSAGE,
  badIdMessage,
  validateOptions,
  buildLoader,
  bodyFooter,
};
