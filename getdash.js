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

  // GET variables
  var displayHost = '';
  var displayMetric = '';
  var displayTime;

  if(!_.isUndefined(ARGS.host))
    displayHost = ARGS.host;

  if(!_.isUndefined(ARGS.metric))
    displayMetric = ARGS.metric;

  if(!_.isUndefined(ARGS.time))
    displayTime = ARGS.time;

  // InfluxDB setup
  var influxUser = 'root';
  var influxPass = 'root';
  var influxDB = 'graphite';
  var influxDBUrl = window.location.protocol + '//' + window.location.host + ':8086';
  var influxdbQueryUrl = influxDBUrl + '/db/' + influxDB + '/series?u=' + influxUser +
                         '&p=' + influxPass + '&q=list series /\.' + displayHost + '\./';

  var getdashConfig = '/app/getdash/getdash.conf.js';

  // Intialize a skeleton with nothing but a rows array and service object
  dashboard = {
    'rows': [],
    'services': {}
  };

  // Set default time
  // time can be overriden in the url using from/to parameteres, but this is
  // handled automatically in grafana core during dashboard initialization

  // Dashboard time and interval setup function
  var getDashTimeInterval = function getDashTimeInterval (time) {
    var defaultTimeInterval = {
      'time': {
        'from': "now-6h",
        'to': "now"
      },
      'interval': '1m',
    };

    if (!time)
      return defaultTimeInterval;

    var timeM = 0;
    var interval = '';
    var regexpTime = /(\d+)(m|h|d)/;
    var rTime = regexpTime.exec(time);

    if (!rTime)
      return defaultTimeInterval;

    if (rTime[2] === 'm')
      timeM = parseInt(rTime[1]);
    else if (rTime[2] === 'h')
      timeM = parseInt(rTime[1]) * 60;
    else if (rTime[2] === 'd')
      timeM = parseInt(rTime[1]) * 60 * 24;

    if (timeM > 360)
      interval = (Math.ceil((Math.floor(timeM / 360) + 1) / 5) * 5).toString() + 'm';
    else if (timeM === 360)
      interval = '1m';
    else
      interval = '30s';

    return {
      'time': {
        'from': "now-" + time,
        'to': "now"
      },
      'interval': interval,
    };
  };

  var dashTimeInterval = getDashTimeInterval(displayTime);
  var interval = dashTimeInterval.interval;
  dashboard.time = dashTimeInterval.time;

  // Set a title
  dashboard.title = 'Scripted Dashboard for ' + displayHost;

  // Object prototypes
  var targetProto = {
    'series': '',
    'alias': '',
    'column': 'value',
    'interval': '1m',
    'function': 'mean',
  };

  var panelProto = {
    'title': 'Default Title',
    'type': 'graphite',
    'span': 12,
    'y_formats': [ 'none' ],
    'grid': { 'max': null, 'min': 0, 'leftMin': 0 },
    'lines': true,
    'fill': 1,
    'linewidth': 1,
    'nullPointMode': 'null',
    'targets': {},
    'aliasColors': {},
  };

  var rowProto = {
    'title': 'Default Row Title',
    'height': '250px',
    'panels': [],
  };


  // Dashboard setup helper functions
  var setupTarget = function setupTarget (target) {
    return $.extend({}, targetProto, target);
  };

  var genRandomColor = function genRandomColor () {
    return '#' + ((1 << 24) * Math.random() | 0).toString(16);
  };

  var genTargets = function genTargets (seriesArr, seriesAlias, interval, pluginConf) {
    var targets = [];
    var aliasColors = {};
    var alias = '';
    for (var match in pluginConf.graph) {
      var graph = pluginConf.graph[match];
      for (var i = 0, len = seriesArr.length; i < len; i++) {
        var series = seriesArr[i];
        seriesAlias = (seriesAlias) ? seriesAlias : series.split('.')[2];

        if (series.lastIndexOf(match) !== series.length - match.length)
          continue;

        if ((pluginConf.alias) && ('position' in pluginConf.alias))
          alias = seriesAlias + '.' + series.split('.')[pluginConf.alias.position];
        else if (graph.alias)
          alias = seriesAlias + '.' + graph.alias;
        else
          alias = seriesAlias + '.' + match;

        targets.push(setupTarget({
          'series': series,
          'alias': alias,
          'interval': interval,
          'column': graph.column,
          'apply': graph.apply,
        }));

        if (graph.color)
          aliasColors[alias] = graph.color;
        else
          aliasColors[alias] = genRandomColor();
      }
    }
    return {
      'targets': targets,
      'aliasColors': aliasColors,
    };
  };

  var panelFactory = function panelFactory (pluginConf) {
    return function (series, seriesAlias, span, interval) {
      interval = (interval === undefined) ? '1m' : interval;
      var targets = genTargets(series, seriesAlias, interval, pluginConf);
      var panel = {
        'span': span,
        'targets': targets.targets,
        'aliasColors': targets.aliasColors,
      };

      if (('title' in pluginConf.panel) && (pluginConf.panel.title.match('@metric')))
        return $.extend({}, panelProto, panel, pluginConf.panel,
            { 'title': pluginConf.panel.title.replace('@metric', series[0].split('.')[2]) });

      return $.extend({}, panelProto, panel, pluginConf.panel);
   };
  };

  var setupRow = function setupRow (row) {
    return $.extend({}, rowProto, row);
  };
  
  var getExtendedMetrics = function getExtendedMetrics (series, prefix) {
    var metricsExt = [];
    var postfix = '';
    for (var i = 0, len = series.length; i < len; i++) {
      if (series[i].indexOf(prefix) === 0) {
        postfix = series[i].slice(prefix.length);
        postfix = postfix.slice(0, postfix.indexOf('.'));
        if (metricsExt.indexOf(postfix) === -1)
          metricsExt.push(postfix);
      }
    }
    return metricsExt;
  };

  var setupDash = function setupDash (plugin) {
    var p = {
      func: [],
      config: plugin.config,
    };
    for (var name in plugin) {
      p.func.push(panelFactory(plugin[name]));
    }
    return p;
  };

  var genDashs = function genDashs (metrics, plugins) {
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

  var matchSeries = function matchSeries (prefix, metric, plugin, series, dash) {
    var matchedSeries = [];
    for (var i = 0, len = series.length; i < len; i++) {
      if ((series[i].indexOf(prefix + metric) === 0) &&
        (!('regexp' in dash[plugin].config) ||
        dash[plugin].config.regexp.test(series[i].split('.')[2]))) {
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
    if (hostSeries.length === 0)
      return dashboard;

    var displayMetrics = (displayMetric) ? displayMetric.split(',') : null;
    var showDashs = genDashs(displayMetrics, plugins);

    for (var plugin in showDashs) {
      var metric = plugin;
      var seriesAlias = ('alias' in showDashs[plugin].config) ? showDashs[plugin].config.alias : null;
      var seriesPrefix = showDashs[plugin].config.prefix + displayHost + '.';
      var matchedSeries = [];
 
      if (showDashs[plugin].config.multi) {
        var metricsExt = getExtendedMetrics(matchSeries(seriesPrefix, metric, plugin, hostSeries, showDashs), seriesPrefix);
        for (var i = 0, mlen = metricsExt.length; i < mlen; i++) {
          matchedSeries.push(matchSeries(seriesPrefix, metricsExt[i], plugin, hostSeries, showDashs));
        }
      } else {
        matchedSeries.push(matchSeries(seriesPrefix, metric, plugin, hostSeries, showDashs));
      }

      for (var j = 0, slen = matchedSeries.length; j < slen; j++) {
        for (var k = 0, flen = showDashs[plugin].func.length; k < flen; k++) {
          var metricFunc = showDashs[plugin].func[k];
          dashboard.rows.push(setupRow({
            'title': metric.toUpperCase,
            'panels': [ metricFunc(matchedSeries[j], seriesAlias, 12, interval) ],
          }));
        }
      }
    }

    // Return dashboard
    callback(dashboard);
  });
};
