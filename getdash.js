/* global _ */

/*
 * Complex scripted dashboard
 * This script generates a dashboard object that Grafana can load. It also takes a number of user
 * supplied URL parameters (int ARGS variable)
 */


// Accessable variables in this scope
var window, document, ARGS, $, jQuery, moment, kbn;


return function (callback) {
  'use strict';

  // Setup some variables
  var dashboard;
  var hostSeries = [];

  // InfluxDB setup
  var influxUser = 'root';
  var influxPass = 'root';
  var influxDB = 'graphite'; 

  // GET variables
  var displayHost = '';
  var displayMetric = '';

  if(!_.isUndefined(ARGS.host)) {
    displayHost = ARGS.host;
  }
  if(!_.isUndefined(ARGS.metric)) {
    displayMetric = ARGS.metric;
  }

  var pfx = 'collectd.' + displayHost;
  var postfix = '';
  var influxdbQueryUrl = window.location.protocol + '//'+ window.location.host +
                   ':8086/db/' + influxDB + '/series?u=' + influxUser + '&p=' + influxPass +
                   '&q=list series /\.' + displayHost + '\./';

  var getdashConfig = '/app/getdash/getdash.conf.js';

  // Intialize a skeleton with nothing but a rows array and service object
  dashboard = {
      rows : [],
      services : {}
  };

  // Set default time
  // time can be overriden in the url using from/to parameteres, but this is
  // handled automatically in grafana core during dashboard initialization
  dashboard.time = {
    from: "now-6h",
    to: "now"
  };

  // Set a title
  dashboard.title = 'Scripted Dashboard for ' + displayHost;


  // Helper Functions
  var targetGen = function (series, alias, interval, column, apply) {
    return {
      'series': series,
      'alias': alias,
      'column': (column === undefined) ? 'value' : column,
      'interval': (interval === undefined) ? '1m' : interval,
      'function': (apply === undefined) ? 'mean' : apply,
    };
  };

  var targetsGen = function (series, seriesAlias, span, interval, graphConf, aliasConf) {
    var targets = [];
    var aliasColors = {};
    var aliasColor = '';
    var alias = '';
    var column = '';
    var apply = '';
    for (var match in graphConf) {
      var graph = graphConf[match];
      for (var i = 0; i < series.length; i++) {
        var s = series[i];
        seriesAlias = (seriesAlias) ? seriesAlias : s.split('.')[2];
        if (s.lastIndexOf(match) === s.length - match.length) {
          if ((aliasConf) && ('position' in aliasConf)) {
            alias = seriesAlias + '.' + s.split('.')[aliasConf.position];
          } else if (graph.alias) {
            alias = seriesAlias + '.' + graph.alias;
          } else {
            alias = seriesAlias + '.' + match;
          }
          column = graph.column;
          apply = graph.apply;
          targets.push(targetGen(s, alias, interval, column, apply));
          if (graph.color) {
            aliasColor = graph.color;
          } else {
            aliasColor = '#' + ((1 << 24) * Math.random() | 0).toString(16);
          }
          aliasColors[alias] = aliasColor;
        }
      }
    }
    return {
      'targets': targets,
      'aliasColors': aliasColors,
    };
  };

  var panelFactory = function (gConf) {
    return function (series, seriesAlias, span, interval) {
      span = (span === undefined) ? 12 : span;
      interval = (interval === undefined) ? '1m' : interval;
      var result = {};
      var graph = gConf.graph;
      var alias = gConf.alias;
      var targets = targetsGen(series, seriesAlias, span, interval, graph, alias);
      var panel = {
        'title': 'Default Title',
        'type': 'graphite',
        'span': span,
        'y_formats': [ 'none' ],
        'grid': { 'max': null, 'min': 0, 'leftMin': 0 },
        'lines': true,
        'fill': 1,
        'linewidth': 1,
        'nullPointMode': 'null',
        'targets': targets.targets,
        'aliasColors': targets.aliasColors,
      };

      if (('title' in gConf.panel) && (gConf.panel.title.match('@metric'))) {
        result = $.extend(result, panel, gConf.panel,
            { 'title': gConf.panel.title.replace('@metric', series[0].split('.')[2]) });
      } else {
        result = $.extend(result, panel, gConf.panel);
      }

      return result;
   };
  };

  var setupRow = function (title, panels) {
    return {
      'title': title,
      'height': '250px',
      'panels': panels,
      'grid': { 'max': null, 'min': 0 },
    };
  };
  
  var getExtendedMetrics = function (series, prefix) {
    var metricsExt = [];
    var postfix = '';
    for (var i = 0; i < series.length; i++) {
      if (series[i].indexOf(prefix) === 0) {
        postfix = series[i].slice(prefix.length);
        postfix = postfix.slice(0, postfix.indexOf('.'));
        if (metricsExt.indexOf(postfix) === -1) {
          metricsExt.push(postfix);
        }
      }
    }
    return metricsExt;
  };

  var setupDash = function (plugin) {
    var p = {
      func: [],
      config: plugin.config,
    };
    for (var name in plugin) {
      p.func.push(panelFactory(plugin[name]));
    }
    return p;
  };

  var genDashs = function (metrics, plugins) {
    var dashs = {};
    if (metrics) {
      var groups = plugins.groups;
      for (var i = 0, mlen = metrics.length; i < mlen; i++) {
        var metric = metrics[i];
        if (metric in plugins) {
          dashs[metric] = setupDash(plugins[metric]);
        } else if (metric in groups) {
          var group = groups[metric];
          for (var j = 0, glen = group.length; j < glen; j++) {
            var member = group[j];
            if (!(member in dashs) && (member in plugins)) {
              dashs[member] = setupDash(plugins[member]);
            } 
          }
        }
      }
      return dashs;
    } else {
      for (var plugin in plugins) {
        dashs[plugin] = setupDash(plugins[plugin]);
      }
      return dashs;
    }
  };

  var matchSeries = function (prefix, metric, series, dash) {
    var matchedSeries = [];
    for (var i = 0, len = series.length; i < len; i++) {
      if ((series[i].indexOf(prefix + '.' + metric) === 0) &&
        (!('regexp' in dash[metric].config) ||
        dash[metric].config.regexp.test(series[i].split('.')[2]))) {
          matchedSeries.push(series[i]);
      }
    }
    return matchedSeries;
  };

  // AJAX configuration
  $.ajaxSetup({
    async: true,
    cache: false,
  });

  // Get series and panel configuration to perepare dashboard
  $.when(
    $.getJSON(influxdbQueryUrl)
      .done(function (jsonData) {
        var points = jsonData[0].points;
        for (var i = 0, len = points.length; i < len; i++) {
          hostSeries.push(points[i][1]);
        }
      })
      .fail(function () {
        throw new Error('Error loading InfluxDB data JSON from: ' + influxdbQueryUrl);
      }),

    $.getScript(getdashConfig)
      .fail(function () {
        throw new Error('Error loading getdash config from: ' + getdashConfig);
      }),

    $.Deferred(function (deferred) {
      $(deferred.resolve);
    })
  ).done(function () {
    var displayMetrics = (displayMetric) ? displayMetric.split(',') : null;
    var showDashs = genDashs(displayMetrics, plugins);

    if (hostSeries.length === 0) {
      return dashboard;
    }

    for (var metric in showDashs) {
      var metricFunc;
      var seriesAlias = ('alias' in showDashs[metric].config) ? showDashs[metric].config.alias : null;
      var matchedSeries = matchSeries(pfx, metric, hostSeries, showDashs);

      if (matchedSeries.length === 0) {
        continue;
      }

      // rematch series if we have multiple instances per plugin
      if (showDashs[metric].config.multi) {
        var metricsExt = getExtendedMetrics(matchedSeries, pfx + '.');
        if (metricsExt.length > 1) {
          for (var k = 0; k < metricsExt.length; k++) {
            var metricExt = metricsExt[k];
            var rematchedSeries = [];
            var repfxMetric = pfx + '.' + metricExt + '.';
            for (var m = 0; m < matchedSeries.length; m++) {
              if (matchedSeries[m].indexOf(repfxMetric) === 0) {
                rematchedSeries.push(matchedSeries[m]);
              }
            }
            for (var j = 0; j < showDashs[metric].func.length; j++) {
              metricFunc = showDashs[metric].func[j];
              dashboard.rows.push(setupRow(metricExt.toUpperCase, [metricFunc(rematchedSeries, seriesAlias, 12, '1m')]));
            }
          }
         continue; 
        }
      }

      for (var n = 0; n < showDashs[metric].func.length; n++) {
        metricFunc = showDashs[metric].func[n];
        dashboard.rows.push(setupRow(metric.toUpperCase, [metricFunc(matchedSeries, seriesAlias, 12, '1m')]));
      }
    }

    // Return dashboard
    callback(dashboard);
  });
};
