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

  require(['getdash/getdash.conf'], function(getdashConf) {

    // Setup some variables
    var plugins = getdashConf.plugins;
    var datasourcesAll = getdashConf.datasources;
    var datasources = _.filter(datasourcesAll, function (ds) {
      return (ds.grafanaDB && ds.type == 'influxdb'));
    });
    var dashboard;
    var getdashConfig = '/app/getdash/getdash.conf.js';

    // GET variables
    var displayHost = '';
    var displayMetric = '';
    var displayTime;

    var sanitize = function sanitize (str) {
      return str.replace(/[^\w\s-,]/gi, '');
    };

    if(!_.isUndefined(ARGS.host))
      displayHost = sanitize(ARGS.host);

    if(!_.isUndefined(ARGS.metric))
      displayMetric = sanitize(ARGS.metric);

    if(!_.isUndefined(ARGS.time))
      displayTime = sanitize(ARGS.time);

    // Setup influxDB queries
    var getMetricArr = function getMetrics (displayMetric) {
      if (!displayMetric)
        return _.keys(plugins);

      var displayMetrics = displayMetric.split(',');
      
      return _.uniq(_.reduce(displayMetrics, function (arr, metric) {
        if (metric in plugins)
          return _(arr).push(metric).value();
        else if (metric in plugins.groups)
          return _.union(arr, plugins.groups[metric]);
      }, []));
    };

    var getMetricRegexp = function getMetricRegexp (arr) {
      if (!arr.length)
        return '';
      return '(' + arr.join('|') + ')';
    };

    var influxdbQuery = 'list series /\\.' + displayHost + '\\.' +
      getMetricRegexp(getMetricArr(displayMetric)) + '/';

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
    dashboard.title = 'Grafana - Scripted Dashboard for ' + displayHost;

    // Object prototypes
    var targetProto = {
      'series': '',
      'alias': '',
      'column': 'value',
      'interval': interval,
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
      return _.merge({}, targetProto, target);
    };

    var genRandomColor = function genRandomColor () {
      return '#' + ((1 << 24) * Math.random() | 0).toString(16);
    };

    var genTargets = function genTargets (seriesArr, seriesAlias, pluginConf) {
      var targets = [];
      var aliasColors = {};
      var alias = '';

      _.each(pluginConf.graph, function (graph, match) {
        _.each(seriesArr, function (series) {
          var name = series.name;
          seriesAlias = (seriesAlias) ? seriesAlias : name.split('.')[2];

          if (name.lastIndexOf(match) !== name.length - match.length)
            return;

          if ((this.alias) && ('position' in this.alias))
            alias = seriesAlias + '.' + name.split('.')[this.alias.position];
          else if (graph.alias)
            alias = seriesAlias + '.' + graph.alias;
          else
            alias = seriesAlias + '.' + match;

          targets.push(setupTarget({
            'series': name,
            'alias': alias,
            'column': graph.column,
            'apply': graph.apply,
          }));

          if (graph.color)
            aliasColors[alias] = graph.color;
          else
            aliasColors[alias] = genRandomColor();

        }.bind(this));
      }.bind(pluginConf));

      return {
        'targets': targets,
        'aliasColors': aliasColors,
      };
    };

    var genPanelFactory = function genPanelFactory (series, seriesAlias, pluginPanel) {
      return function (source, series, seriesAlias, targets, span) {
        var panel = {
          'span': span,
          'datasource': source,
          'targets': targets.targets,
          'aliasColors': targets.aliasColors,
        };

        if (('title' in pluginPanel) && (pluginPanel.title.match('@metric')))
          return _.merge({}, panelProto, panel, pluginPanel,
              { 'title': pluginPanel.title.replace('@metric', series[0].name.split('.')[2]) });

        return _.merge({}, panelProto, panel, pluginPanel);
      };
    };

    var panelFactory = function panelFactory (pluginConf) {
      return function (series, seriesAlias, span) {
        var sourceSeries = _.groupBy(series, 'source');
        var genPanel = genPanelFactory(series, seriesAlias, pluginConf.panel);

        var sourceTargets = _(sourceSeries)
          .map(function (series, source) {
            return [ source, genTargets(series, seriesAlias, pluginConf) ];
          })
          .zipObject()
          .value();

        var panels = _.map(sourceSeries, function (series, source) {
          return genPanel(source, series, seriesAlias, sourceTargets[source], span);
        });

        return panels;
     };
    };

    var setupRow = function setupRow (row) {
      return _.merge({}, rowProto, row);
    };

    var getExtendedMetrics = function getExtendedMetrics (matchedSeries, prefix) {
      return _(matchedSeries).map(function (series) {
        return series.name.slice(prefix.length, series.name.indexOf('.', prefix.length));
      })
        .uniq()
        .value();
    };

    var setupDash = function setupDash (plugin) {
      return {
        'func': _.map(plugin, function (metricConf) {
          return panelFactory(metricConf);
        }),
        'config': plugin.config,
      };
    };

    var genDashs = function genDashs (metrics, plugins) {
      if (!metrics) {
        return _(plugins)
          .map(function (plugin, name) {
            return [ name, setupDash(plugin) ];
          })
          .zipObject()
          .value();
      }

      return _(metrics).map(function (metric) {
        if (metric in plugins) {
          return [ metric, setupDash(plugins[metric]) ];
        } else if (metric in plugins.groups) {
          return _.map(plugins.groups[metric], function (member) {
            return [ member, setupDash(plugins[member]) ];
          });
        }
      })
        .flatten()
        .groupBy(function (val, index) {
          return index % 2;
        })
        .zip()
        .zipObject()
        .value();
    };

    var filterSeriesFactory = function filterSeriesFactory (prefix, metric, plugin, dash) {
      return function (dsSeries) {
        return ((dsSeries.name.indexOf(prefix + metric) === 0) &&
            (!('regexp' in dash[plugin].config) ||
             dash[plugin].config.regexp.test(dsSeries.name.split('.')[2])));
      };
    };

    var setupDashboard = function setupDashboard (hostSeries, plugins, displayMetric, dashboard) {
      if (!hostSeries.length)
        return;

      var displayMetrics = (displayMetric) ? displayMetric.split(',') : null;
      var showDashs = genDashs(displayMetrics, plugins);

      dashboard.rows = _(showDashs)
        .map(function (plugin, name) {
          var metric = name;
          var seriesAlias = ('alias' in plugin.config) ? plugin.config.alias : null;
          var seriesPrefix = plugin.config.prefix + displayHost + '.';
          var matchedSeries = _.filter(hostSeries, filterSeriesFactory(seriesPrefix, metric, name, this));
          var matchedSeriesArr = [];

          if (plugin.config.multi) {
            var metricsExt = getExtendedMetrics(matchedSeries, seriesPrefix);
            matchedSeriesArr = _.map(metricsExt, function (metric) {
              return _.filter(hostSeries, filterSeriesFactory(seriesPrefix, metric, name, this));
            }.bind(this));
          } else {
            matchedSeriesArr.push(matchedSeries);
          }

          return _.map(plugin.func, function (makePanels) {
            return _.map(matchedSeriesArr, function (series) {
              return _.map(makePanels(series, seriesAlias, 12), function (panel) {
                return setupRow({
                  'title': metric.toUpperCase(),
                  'panels': [ panel ],
                });
              });
            });
          });
        }.bind(showDashs))
        .flatten()
        .value();

      return dashboard;
    };

    // Get series from InfluxDB
    var getSeries = function getSeries (datasources, query, callback) {
      var dsQueries = _.map(datasources, function (ds) {
        return {
          'datasource': ds.name,
          'url': ds.url + '/series?u=' + ds.username + '&p=' + ds.password + '&q=' + query,
        };
      });

      var gettingDBData = _.map(dsQueries, function (query) {
        return $.getJSON(query.url);
      });

      return Promise.all(gettingDBData).then(function (json) {
        var datasources = _.pluck(dsQueries, 'datasource');
        var points = _(json)
          .flatten()
          .pluck('points')
          .value();

        return _(datasources)
          .zip(points)
          .map(function (dsPoints) {
            var ds = dsPoints[0];
            var points = dsPoints[1];
            return _.map(points, function (point) {
              return {
                'source': ds,
                'name': point[1],
              };
            });
          })
          .flatten()
          .value();
      });
    };

    var setupDefaultDashboard = function setupDashboard (allSeries, dashboard) {
      var hostsAll = _.uniq(_.map(_.pluck(allSeries, 'name'), function (series) {
        return series.split('.')[1];
      }));

      var hostsLinks = _.reduce(hostsAll, function (string, host) {
        return string + '\n\t\t\t<li>\n\t\t\t\t<a href="' +
          window.location.href + '?host=' + host + '" onclick="window.location=this.href;window.location.reload();">' +
          host + '</a>\n\t\t\t</li>';
      }, '');

      var rowProto = {
        'title': 'Default',
        'height': '90px',
        'panels': [
          {
            'title': '',
            'span': 12,
            'type': 'text',
            'mode': 'html',
            'content': 'default',
          },
        ],
      };

      var rowDocs = _.merge({}, rowProto, {
        'title': 'Docs',
        'panels': [
          {
            'content': '<div class="row-fluid">\n\t<div class="span12">\n\t\t<h4>Grafana InfluxDB Scripted Dashboard Documentation</h4>\n\t\t<ul>\n\t\t\t<li>\n\t\t\t\t<a href="https://github.com/anryko/grafana-influx-dashboard">GitHub</a>\n\t\t\t</li>\n\t</div>\n</div>',
          },
        ],
      });

      var rowHosts = _.merge({}, rowProto, {
        'title': 'Hosts',
        'panels': [
          {
            'content': '<div class="row-fluid">\n\t<div class="span6">\n\t\t<h4>Available Hosts</h4>\n\t\t<ul>' + hostsLinks + '\n\t\t</ul>',
          },
        ],
      });

      dashboard.title = 'Grafana - Scripted Dashboard';
      dashboard.rows = [ rowDocs, rowHosts ];
      return dashboard;
    };


    if (!displayHost) {
      getSeries(datasources, 'list series /load\\.load\\.midterm/')
        .then(function (series) {
          callback(setupDefaultDashboard(series, dashboard));
        });
      return;
    }
    getSeries(datasources, influxdbQuery)
      .then(function (series) {
        callback(setupDashboard(series, plugins, displayMetric, dashboard));
      });
  });
};
