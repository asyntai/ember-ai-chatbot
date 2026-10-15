/**
 * Asyntai AI chatbot for Ember.
 *
 * Adds the Asyntai chat widget to the app's index.html through the
 * {{content-for "body-footer"}} slot that every Ember app has. The loader sits
 * outside the Ember application, so route changes never remove it or load a
 * second widget.
 */

'use strict';

const {NAME, bodyFooter} = require('./src/options');

module.exports = {
  name: NAME,

  contentFor(type, config) {
    if (type === 'body-footer') {
      return bodyFooter(config);
    }
    return '';
  },
};
