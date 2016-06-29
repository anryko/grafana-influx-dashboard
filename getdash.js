/* global _ */

/*
 * Complex scripted dashboard
 * This script generates a dashboard object that Grafana can load. It also takes a number of user
 * supplied URL parameters (int ARGS variable)
 */

// Accessable variables in this scope
var window, document, ARGS, $, jQuery, moment, kbn;


// Helper Functions

// loadScripts :: [scriptSourceStr] -> Promise([jQuery.getScript Result])
var loadScripts = function loadScripts (scriptSrcs) {
  var gettingScripts = _.map(scriptSrcs, function (src) {
    return $.getScript(src);
  });

  return Promise.all(gettingScripts);
};


// Dashboard Functions

// scriptedDashboard :: callbackFunc -> dashboardJSON
return function scriptedDashboard (callback) {
  'use strict';

  loadScripts([
      'public/app/getdash/getdash.app.js',
      'public/app/getdash/getdash.conf.js'
    ]).then(function () {

    // sanitize :: Str -> new Str
    var sanitize = function sanitize (str) {
      return str.replace(/[^\w\s-,.*/]/gi, '');
    };

    var displayHost = (_.isUndefined(ARGS.host)) ? '' : ARGS.host;

    // Dashboard configuration
    var dashConf = {
      host: displayHost,
      metric: (_.isUndefined(ARGS.metric)) ? '' : sanitize(ARGS.metric),
      instance: (_.isUndefined(ARGS.instance)) ? undefined : ARGS.instance,
      time: (_.isUndefined(ARGS.time)) ? undefined : sanitize(ARGS.time),
      refresh: (_.isUndefined(ARGS.refresh)) ? undefined : sanitize(ARGS.refresh),
      span: (_.isUndefined(ARGS.span)) ? 12 : sanitize(ARGS.span),
      title: 'Dashboard for ' + displayHost,
      // Series used to get the list of all hosts
      // (Some metric that is common for all hosts).
      // If there is none for all hpsts ypu can add a list
      defaultQueries: [ 'load_midterm' ]
    };

    var datasources = _.values(window.grafanaBootData.settings.datasources);
    var dash = getDashApp(datasources, getDashConf());
    dash.get(dashConf, callback);
  });
};
