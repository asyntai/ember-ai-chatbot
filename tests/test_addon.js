/**
 * Offline tests for ember-ai-chatbot.
 *
 * These call the addon the way Ember CLI calls it: contentFor(type, config)
 * with the app's config/environment.js result. No Ember install is needed.
 *
 * Run: node plugins/ember/tests/test_addon.js
 */

'use strict';

const assert = require('assert');
const vm = require('vm');

const {validateOptions, buildLoader, DEFAULT_SCRIPT_URL, NAME} = require('../src/options');
const addon = require('../index');
const pkg = require('../package.json');

const ID = 'asyntai_1a2b3c4d5e6f';
const passed = [];
const failed = [];

function check(name, fn) {
  try {
    fn();
    passed.push(name);
    console.log('  PASS  ' + name);
  } catch (err) {
    failed.push(name);
    console.log('  FAIL  ' + name + '  -> ' + err.message);
  }
}

function config(asyntai, environment) {
  return {modulePrefix: 'demo', environment: environment || 'production', asyntai};
}

function footer(asyntai, environment) {
  return addon.contentFor('body-footer', config(asyntai, environment));
}

/** Pulls the JavaScript out of the script tag the addon returns. */
function scriptBody(html) {
  const m = /^<script data-asyntai-loader>([\s\S]*)<\/script>$/.exec(html);
  assert.ok(m, 'not a single loader script tag: ' + html.slice(0, 80));
  return m[1];
}

/** Runs the loader in a fake browser and returns the scripts it added. */
function runLoader(code, readyState, existing) {
  const added = [];
  const listeners = {};
  const document = {
    readyState: readyState || 'complete',
    querySelector: () => (existing ? {} : null),
    createElement: () => {
      const attrs = {};
      return {
        attrs,
        setAttribute: (k, v) => {
          attrs[k] = v;
        },
      };
    },
    head: {appendChild: (el) => added.push(el)},
  };
  const window = {
    addEventListener: (name, fn) => {
      listeners[name] = fn;
    },
  };
  vm.runInNewContext(code, {document, window});
  return {added, listeners};
}

console.log('\nOptions');

check('a valid widget ID is accepted', () => {
  assert.strictEqual(validateOptions({widgetId: ID}).widgetId, ID);
});

check('surrounding spaces are trimmed', () => {
  assert.strictEqual(validateOptions({widgetId: '  ' + ID + '  '}).widgetId, ID);
});

check('a missing asyntai block stops the build', () => {
  assert.throws(() => footer(undefined), /widgetId" is required/);
});

check('the missing-ID message says where to set it', () => {
  assert.throws(() => footer({}), /config\/environment\.js/);
});

check('an empty widget ID stops the build', () => {
  assert.throws(() => footer({widgetId: '   '}), /widgetId" is required/);
});

check('a non-string widget ID stops the build', () => {
  assert.throws(() => footer({widgetId: 12345}), /widgetId" is required/);
});

check('a widget ID without the prefix stops the build', () => {
  assert.throws(() => footer({widgetId: '1a2b3c4d5e6f'}), /does not look like a widget ID/);
});

check('a widget ID with a quote in it stops the build', () => {
  assert.throws(() => footer({widgetId: 'asyntai_a"b'}), /does not look like a widget ID/);
});

check('a widget ID with a tag in it stops the build', () => {
  assert.throws(() => footer({widgetId: 'asyntai_a</script>'}), /does not look like a widget ID/);
});

check('the default script URL is the Asyntai CDN', () => {
  assert.strictEqual(validateOptions({widgetId: ID}).scriptUrl, DEFAULT_SCRIPT_URL);
  assert.strictEqual(DEFAULT_SCRIPT_URL, 'https://widget.asyntai.com/static/js/chat-widget.js');
});

check('a blank scriptUrl falls back to the CDN', () => {
  assert.strictEqual(validateOptions({widgetId: ID, scriptUrl: '  '}).scriptUrl, DEFAULT_SCRIPT_URL);
});

console.log('\ncontentFor');

check('production gets one loader script', () => {
  const html = footer({widgetId: ID});
  assert.strictEqual((html.match(/<script/g) || []).length, 1);
  assert.ok(html.includes('"' + ID + '"'));
});

check('other content-for slots stay empty', () => {
  for (const type of ['head', 'head-footer', 'body', 'test-head', 'test-body', 'app-boot']) {
    assert.strictEqual(addon.contentFor(type, config({widgetId: ID})), '');
  }
});

check('other slots do not fail on a missing ID', () => {
  assert.strictEqual(addon.contentFor('head', config(undefined)), '');
});

check('development gets the loader by default', () => {
  assert.ok(footer({widgetId: ID}, 'development').includes(ID));
});

check('enableInDevelopment: false removes it in development', () => {
  assert.strictEqual(footer({widgetId: ID, enableInDevelopment: false}, 'development'), '');
});

check('enableInDevelopment: false keeps it in production', () => {
  assert.ok(footer({widgetId: ID, enableInDevelopment: false}, 'production').includes(ID));
});

check('the test environment never gets the widget', () => {
  assert.strictEqual(footer({widgetId: ID}, 'test'), '');
});

check('the test environment does not fail on a missing ID', () => {
  assert.strictEqual(footer(undefined, 'test'), '');
});

check('a staging environment gets the loader', () => {
  assert.ok(footer({widgetId: ID}, 'staging').includes(ID));
});

check('a custom scriptUrl is used', () => {
  assert.ok(footer({widgetId: ID, scriptUrl: 'https://cdn.example.com/w.js'}).includes('"https://cdn.example.com/w.js"'));
});

check('a scriptUrl with </script> cannot close the tag', () => {
  const html = footer({widgetId: ID, scriptUrl: 'https://x.example/</script><b>'});
  assert.strictEqual((html.match(/<\/script>/g) || []).length, 1);
  assert.ok(html.endsWith('</script>'));
});

console.log('\nLoader in a browser');

check('the loader is valid JavaScript', () => {
  new vm.Script(scriptBody(footer({widgetId: ID})));
});

check('page already loaded: the widget script is added at once', () => {
  const {added} = runLoader(scriptBody(footer({widgetId: ID})), 'complete');
  assert.strictEqual(added.length, 1);
  assert.strictEqual(added[0].src, DEFAULT_SCRIPT_URL);
  assert.strictEqual(added[0].async, true);
  assert.strictEqual(added[0].attrs['data-asyntai-id'], ID);
});

check('page still loading: it waits for the load event', () => {
  const {added, listeners} = runLoader(scriptBody(footer({widgetId: ID})), 'interactive');
  assert.strictEqual(added.length, 0);
  assert.strictEqual(typeof listeners.load, 'function');
  listeners.load();
  assert.strictEqual(added.length, 1);
});

check('a hand-pasted widget already on the page is not doubled', () => {
  const {added} = runLoader(scriptBody(footer({widgetId: ID})), 'complete', true);
  assert.strictEqual(added.length, 0);
});

check('the escaped scriptUrl still loads the same URL', () => {
  const url = 'https://x.example/a<b.js';
  const {added} = runLoader(scriptBody(footer({widgetId: ID, scriptUrl: url})), 'complete');
  assert.strictEqual(added[0].src, url);
});

check('buildLoader is the same loader as the other Asyntai packages', () => {
  assert.ok(buildLoader(ID, DEFAULT_SCRIPT_URL).startsWith('(function(){var l=function(){'));
});

console.log('\nPackage');

check('package name and addon name match', () => {
  assert.strictEqual(pkg.name, NAME);
  assert.strictEqual(addon.name, NAME);
});

check('the ember-addon keyword is set (Ember CLI and Ember Observer need it)', () => {
  assert.ok(pkg.keywords.includes('ember-addon'));
});

check('the homepage is the Asyntai docs page', () => {
  assert.strictEqual(pkg.homepage, 'https://asyntai.com/documentation/integrations/ember/');
});

check('every file in "files" exists', () => {
  const fs = require('fs');
  const path = require('path');
  for (const f of pkg.files) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', f)), f + ' is missing');
  }
});

console.log('\n' + passed.length + ' passed, ' + failed.length + ' failed');
process.exit(failed.length ? 1 : 0);
