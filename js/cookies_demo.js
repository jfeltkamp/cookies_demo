/**
 * @file
 * Defines Javascript behaviors for the cookies module.
 * These are invoked once the user performs a cookie consent
 * action like: accept / deny / revoke to immediately
 * react on that with loading a script, video, iframe, etc.
 * or if consent is revoked, removing existing cookies,
 * stop stracking or similar.
 *
 * This is NOT invoked on each page load, only immediately, when the user
 * takes concrete action in the COOKiES banner.
 */;

(function (Drupal, $) {
  'use strict';

  /**
   * Define defaults.
   */
  Drupal.behaviors.cookies_demo = {
    // id corresponding to the cookies_service.schema->id.
    id: 'base',

    /**
     * Called when consent was given.
     */
    consentGiven: function (context) {
      // Do stuff here to activate the specific 3rd-party service.
    },

    /**
     * Called when consent was denied / revoked.
     */
    consentDenied: function (context) {
      // Do stuff here to display that 3rd-party service is disabled.
      // If needed do stuff here to disable the 3rd-party service immediately.
    },

    attach: function (context) {
      var self = this;
      document.addEventListener('cookiesjsrUserConsent', function (event) {
        var service = (typeof event.detail.services === 'object') ? event.detail.services : {};
        if (typeof service[self.id] !== 'undefined' && service[self.id]) {
          // Conent was given:
          self.consentGiven(context);
        } else {
          // Consent was denied / revoked:
          self.consentDenied(context);
        }
      });
    }
  }
})(Drupal, jQuery);
