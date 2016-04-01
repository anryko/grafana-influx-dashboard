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

    // GET variables
    var displayHost = '';
    var displayMetric = '';
    var displayTime;
    var displaySpan = 12;
    var async = true;

    // sanitize :: Str -> new Str
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

    $.getJSON('api/datasources', function (datasources) {
      var dash = getDashApp(datasources, getDashConf());
      dash.get(dashConf, callback);
    });
  });
};
