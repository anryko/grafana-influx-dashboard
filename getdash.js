/* global _ */

/*
 * Complex scripted dashboard
 * This script generates a dashboard object that Grafana can load. It also takes a number of user
 * supplied URL parameters (int ARGS variable)
 */

// Accessable variables in this scope
var window, document, ARGS, $, jQuery, moment, kbn;


return function scriptedDashboard (callback) {
  'use strict';

  require(['app/getdash/getdash.app'], function getDahs (dash) {

    // GET variables
    var displayHost = '';
    var displayMetric = '';
    var displayTime;
    var displaySpan = 12;
    var async = true;

    // sanitize :: String -> new String
    var sanitize = function sanitize (str) {
      return str.replace(/[^\w\s-,.*/]/gi, '');
    };

    if(!_.isUndefined(ARGS.host))
      displayHost = sanitize(ARGS.host);

    if(!_.isUndefined(ARGS.metric))
      displayMetric = sanitize(ARGS.metric);

    if(!_.isUndefined(ARGS.time))
      displayTime = sanitize(ARGS.time);

    if(!_.isUndefined(ARGS.span))
      displaySpan = sanitize(ARGS.span);

    if(!_.isUndefined(ARGS.async))
      async = !!JSON.parse(ARGS.async.toLowerCase());

    // Dashboard configuration
    var dashConf = {
      host: displayHost,
      metric: displayMetric,
      time: displayTime,
      span: displaySpan,
      async: async,
      title: 'Scripted Dashboard for ' + displayHost,
      // Series used to get the list of all hosts
      // (Some metric that is common for all hosts).
      defaultQueries: [ 'load_midterm' ]
    };

    dash.get(dashConf, callback);
  });
};
