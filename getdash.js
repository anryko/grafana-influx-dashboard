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
      return (!(ds.grafanaDB || ds.type !== 'influxdb'));
    });
    var dashboard;
    var getdashConfig = '/app/getdash/getdash.conf.js';

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

    // Setup influxDB queries
// TODO: Implement query optimization with account for service groups
//    var influxdbQuery = (displayMetric) ? '&q=list series /\.' + displayHost + '\.(' +
//                    displayMetric.replace(',', '|') + ')/'
//                    : '&q=list series /\.' + displayHost + '\./';
    var influxdbQuery = 'list series /\.' + displayHost + '\./';


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
        var sourceTargets = {};

        _.each(sourceSeries, function (series, source) {
          sourceTargets[source] = genTargets(series, seriesAlias, pluginConf);
        });

        var genPanel = genPanelFactory(series, seriesAlias, pluginConf.panel);
        var panels = _.map(sourceSeries, function (series, source) {
          return genPanel(source, series, seriesAlias, sourceTargets[source], span);
        });

        return panels;
     };
    };

    var setupRow = function setupRow (row) {
      return _.merge({}, rowProto, row);
    };

    var getExtendedMetrics = function getExtendedMetrics (series, prefix) {
      var metricsExt = [];
      var sufix = '';

      _.each(series, function (s) {
        if (s.name.indexOf(prefix) === 0) {
          sufix = s.name.slice(prefix.length);
          sufix = sufix.slice(0, sufix.indexOf('.'));
          if (metricsExt.indexOf(sufix) === -1)
            metricsExt.push(sufix);
        }
      });

      return metricsExt;
    };

    var setupDash = function setupDash (plugin) {
      return {
        func: _.map(plugin, function (metricConf) {
          return panelFactory(metricConf);
        }),
        config: plugin.config,
      };
    };

    var genDashs = function genDashs (metrics, plugins) {
      var dashs = {};

      if (!metrics) {
        _.each(plugins, function (plugin, name) {
          dashs[name] = setupDash(plugin);
        });
        return dashs;
      }

      _.each(metrics, function (metric) {
        if (metric in plugins) {
          dashs[metric] = setupDash(plugins[metric]);
        } else if (metric in plugins.groups) {
          var members = plugins.groups[metric];
          _.each(members, function (member) {
            if (!(member in dashs) && (member in plugins))
              dashs[member] = setupDash(plugins[member]);
          });
        }
      });
      return dashs;
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

      _.each(showDashs, function (plugin, name) {
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

        dashboard.rows = _.union(dashboard.rows, _.reduceRight(plugin.func, function (rows, func) {
          _.each(matchedSeriesArr, function (series) {
            var panels = func(series, seriesAlias, 12);
            rows = _.union(rows, _.map(panels, function (panel) {
              return setupRow({
                'title': metric.toUpperCase(),
                'panels': [ panel ],
              });
            }));
          });
          return rows;
        }, []));
      }.bind(showDashs));

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

      var hostSeries = [];
      var gettingHostSeries = [];
      _.each(dsQueries, function (query) {
        gettingHostSeries.push($.getJSON(query.url, function (json) {
          hostSeries = _.union(hostSeries, _.map(json[0].points, function (point) {
            return {
              'source': query.datasource,
              'name': point[1],
            };
          }));
        }));
      });

      $.when.apply($, gettingHostSeries).done(function () {
        callback(hostSeries);
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
        'panels': [
          {
            'content': '<div class="row-fluid">\n\t<div class="span12">\n\t\t<h4>Grafana InfluxDB Scripted Dashboard Documentation</h4>\n\t\t<ul>\n\t\t\t<li>\n\t\t\t\t<a href="https://github.com/anryko/grafana-influx-dashboard">GitHub</a>\n\t\t\t</li>\n\t</div>\n</div>',
          },
        ],
      });

      var rowHosts = _.merge({}, rowProto, {
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
      getSeries(datasources, 'list series /load\.load\.midterm/', function (series) {
        callback(setupDefaultDashboard(series, dashboard));
      });
      return;
    }
    getSeries(datasources, influxdbQuery, function (series) {
      callback(setupDashboard(series, plugins, displayMetric, dashboard));
    });

  });
};
