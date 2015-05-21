// Getdash application

define(['config', 'getdash/getdash.conf'], function getDashApp (grafanaConf, getdashConf) {
  'use strict';

  // Helper Functions

  // isError :: valueAny -> Boolean
  var isError = function isError (value) {
    return Object.prototype.toString.call(value) === '[object Error]';
  };


  // genRandomColor :: -> colorString
  var genRandomColor = function genRandomColor () {
    return '#' + ((1 << 24) * Math.random() | 0).toString(16);
  };


  // endsWith :: String, targetString -> Boolean
  var endsWith = function endsWith (string, target) {
    var position = string.length - target.length;
    return position >= 0 && string.indexOf(target, position) === position;
  };


  // startsWith :: String, targetString -> Boolean
  var startsWith = function startsWith (string, target) {
    return string.indexOf(target) === 0;
  };


  // Variables
  var plugins = getdashConf.plugins;
  var datasourcesAll = grafanaConf.datasources;
  var datasources = _.filter(datasourcesAll, function (ds) {
    return !ds.grafanaDB && startsWith(ds.type, 'influxdb');
  });


  // Object prototypes
  var dashboardProto = {
    rows: [],  // [rowProtos]
    services: {},
    time: {},  // dashboardTimeProto
    title: '',
  };

  var dashboardTimeProto = {
    from: 'now-6h',
    to: 'now',
  };

  var seriesProto = {
    source: '',
    name: '',
    instance: '',
    interval: '',
  };

  var metricProto = {
    name: '',
    plugin: '',
    pluginAlias: undefined,  // String
    regexp: undefined,  // String
    separator: '',
    graph: {},
    panel: {},
  };

  var pluginProto = {
    name: '',
    config: {},
    metrics: [],  // [metricProtos]
  };

  var targetProto = {
    series: '',
    alias: '',
    column: 'value',
    interval: '1m',
    function: 'mean',
  };

  var panelProto = {
    title: 'default',
    height: '300px',
    type: 'graphite',
    span: 12,
    y_formats: [ 'none' ],
    grid: { max: null, min: 0, leftMin: 0 },
    lines: true,
    fill: 1,
    linewidth: 1,
    nullPointMode: 'null',
    targets: {},  //  {targetNames: targetProtos}
    aliasColors: {},
  };

  var rowProto = {
    title: 'default',
    height: '300px',
    panels: [],  // [panelProtos]
  };


  // Application Functions

  // seriesFilter :: metricConfObject, metricNameObject, seriesObject -> Boolean
  var seriesFilter = _.curry(function seriesFilter (metricConf, metricName, series) {
    if (endsWith(series.name, metricName)) {
      var instancePositionRight = metricName.split(metricConf.separator).length + 1;
      var instance = series.name.split(metricConf.separator).slice(-instancePositionRight)[0];
      if (startsWith(instance, metricConf.plugin) && (_.isUndefined(metricConf.regexp) ||
            metricConf.regexp.test(instance)))
        return true;
    }

    return false;
  });


  // initMetric :: metricConfObject, metricNameString -> metricObject
  var initMetric = _.curry(function initMetric (metricConf, metricName) {
    return _.merge({}, metricProto, metricConf, { name: metricName });
  });


  // addProperty :: keyString, valueAny, Object -> new Object{key: value}
  var addProperty = _.curry(function addProperty (k, v, obj) {
    var o = {};
    o[k] = v;
    return _.merge({}, obj, o);
  });


  // addInstanceToSeries :: seriesObject, separatorString, nameString -> new seriesObject
  var addInstanceToSeries = function addInstanceToSeries (series, separator, name) {
    var instancePositionRight = name.split(separator).length + 1;
    return _.map(series, function (obj) {
      obj.instance = obj.name.split(separator).slice(-instancePositionRight)[0];
      return obj;
    });
  };


  // addSeriesToMetricGraphs :: seriesObject, metricConfObject -> new metricConfObject
  var addSeriesToMetricGraphs = _.curry(function addSeriesToMetricGraphs (series, metricConf) {
    var seriesThisFilter = seriesFilter(metricConf);
    var graphSeries = _.reduce(metricConf.graph, function (newConf, graphConf, graphName) {
      var matchedSeries = _.filter(series, seriesThisFilter(graphName));
      if (_.isEmpty(matchedSeries))
        return newConf;

      newConf[graphName] = {
        series: addInstanceToSeries(matchedSeries, metricConf.separator, graphName),
      };
      return newConf;
    }, {});

    return _.merge({}, metricConf, {
      graph: graphSeries,
    });
  });


  // addSourcesToMetric :: metricConfObject -> new metricConfObject
  var addSourcesToMetric = function addSourcesToMetric (metricConf) {
    return _.merge({}, metricConf, {
      sources: _.union(_.flatten(_.map(metricConf.graph, function (graph) {
        return _.pluck(graph.series, 'source');
      }))),
    });
  };


  // addInstancesToMetric :: metricConfObject -> new metricConfObject
  var addInstancesToMetric = function addInstancesToMetric (metricConf) {
    return _.merge({}, metricConf, {
      instances: _.union(_.flatten(_.map(metricConf.graph, function (graph) {
        return _.pluck(graph.series, 'instance');
      }))),
    });
  };


  // getMetric :: [seriesObject], pluginObject -> function
  var getMetric = _.curry(function getMetric (series, plugin) {
    // :: metricConfObject, metricNameString -> metricObject
    return _.compose(addInstancesToMetric,
                     addSourcesToMetric,
                     addSeriesToMetricGraphs(series),
                     addProperty('regexp', plugin.config.regexp),
                     addProperty('separator', plugin.config.separator),
                     addProperty('pluginAlias', plugin.config.alias),
                     addProperty('plugin', plugin.name),
                     initMetric);
  });


  // setupTarget :: metricConfObject, graphConfObject, metricString, seriesObject -> targetObject
  var setupTarget = _.curry(function setupTarget (metricConf, graphConf, series) {
    var metric = series.name.split(series.instance + metricConf.separator).slice(-1)[0];
    var target = {
      alias: (metricConf.pluginAlias || series.instance) +
        metricConf.separator + (graphConf.alias || metric),
      color: graphConf.color || genRandomColor(),
      series: series.name,
      column: graphConf.column,
      interval: graphConf.interval,
      function: graphConf.apply,
    };
    return _.merge({}, targetProto, { 'interval': series.interval }, target);
  });


  // transformObj :: keyKeyString, valueKeyString, {}, Object -> Object{key: value}
  var transformObj = _.curry(function transformObj (k, v, o, obj) {
    o[obj[k]] = obj[v];
    return o;
  });


  // setupAlias :: targetsObject -> aliasColorsObject
  var setupAlias = transformObj('alias', 'color');


  // initPanel :: metricConfObject, datasourceString, instanceString -> panelObject
  var initPanel = _.curry(function initPanel (metricConf, datasource, instance) {
    if (_.isUndefined(datasource) || _.isUndefined(metricConf)) {
      return new Error('undefined argument in initPanel function.');
    }
    var panel = {
      datasource: datasource,
      config: {
        instance: instance,
        metric: metricConf,
      },
    };
    return _.merge({}, panel, metricConf.panel);
  });


  // addTargetsToPanel :: panelObject -> new panelObject
  var addTargetsToPanel = function addTargetsToPanel (panel) {
    if (isError(panel))
      return panel;

    var targets = _.flatten(_.map(panel.config.metric.graph, function (graphConf) {
      var grepBy = (_.isUndefined(panel.config.instance)) ?
                    { source: panel.datasource } :
                    { source: panel.datasource, instance: panel.config.instance };
      var series = _.where(graphConf.series, grepBy);
      var setupThisTarget = setupTarget(panel.config.metric, graphConf);
      if (_.isEmpty(series))
        return [];

      return _.map(series, setupThisTarget);
    }));

    if (_.isEmpty(targets))
      return new Error('targets for ' + panel.config.metric.plugin + '.' +
        panel.config.metric.plugin + ' are empty.');

    return _.merge({}, panel, {
      targets: targets,
    });
  };


  // addAliasColorsToPanel :: panelObject -> new panelObject
  var addAliasColorsToPanel = function addAliasColorsToPanel (panel) {
    if (isError(panel))
      return panel;

    return _.merge({}, panel, {
      aliasColors: _.reduce(panel.targets, setupAlias, {})
    });
  };


  // addTitleToPanle :: panelObject -> new panelObject
  var addTitleToPanel = function addTitleToPanel (panel) {
    if (isError(panel))
      return panel;

    if (('title' in panel) && (panel.title.match('@metric'))) {
      var metric = (_.isUndefined(panel.config.instance)) ?
        panel.config.metric.instances[0] :
        panel.config.instance;
      return _.merge({}, panel, {
        title: panel.title.replace('@metric', metric)
      });
    }
    return panel;
  };


  // setupPanel :: panelObject -> new panelObject
  var setupPanel = function setupPanel (panel) {
    if (isError(panel))
      return panel;

    var p = _.merge({}, panelProto, panel);
    delete p.config; // no need in config after panel compleated.
    return p;
  };


  // getPanel :: metricConfigObject, datasourceString, instanceString -> panelObject
  var getPanel = _.compose(setupPanel,
                           addTitleToPanel,
                           addAliasColorsToPanel,
                           addTargetsToPanel,
                           initPanel);


  // setupRow :: panelObject || [panelObjects] -> rowObject
  var setupRow = function setupRow (panels) {
    if (_.isArray(panels))
      return _.merge({}, rowProto, {
        title: ('title' in panels[0]) ?
          panels[0].title.toUpperCase() :
          'Default Title',
        panels: panels
      });
    return _.merge({}, rowProto, {
      title: ('title' in panel) ?
        panel.title.toUpperCase() :
        'Default Title',
      panels: [ panel ],
    });
  };


  // stripErrorPanels :: [panelObjects] -> new [panelObjects]
  var stripErrorsFromPanels = function stripErrorsFromPanels (panels) {
    var errors = _.filter(panels, isError);
    if (!_.isEmpty(errors))
      _.map(errors, function (e) {
        console.error(e.toString());
      });
    return _.reject(panels, isError);
  };


  // getPanelsForPlugin :: pluginObject -> [panelObjects]
  var getPanelsForPlugin = function getPanelsForPlugin (plugin) {
    return _.flatten(_.map(plugin.metrics, getPanelsForMetric(plugin.config)));
  };


  // getDatasources :: pluginConfObject, metricConfObject -> [Strings]
  var getDatasourcesForPanel = _.curry(function getDatasourcesForPanel (pluginConf, metricConf) {
    return (_.isArray(pluginConf.datasources) && !_.isEmpty(pluginConf.datasources)) ?
      pluginConf.datasources :
      metricConf.sources;
  });


  // getInstances :: pluginConfObject, metricConfObject -> [Strings]
  var getInstancesForPanel = _.curry(function getInstancesForPanel (pluginConf, metricConf) {
    return (_.has(pluginConf, 'multi') && pluginConf.multi) ?
      metricConf.instances :
      [ undefined ];
  });


  // getPanelsForMetric :: metricConfObject, datasources[Strings], instances[Strings] -> [panelObjects]
  var getPanelsForMetric = _.curry(function getPanelsForMetric (pluginConf, metricConf) {
    var datasources = getDatasourcesForPanel(pluginConf, metricConf);
    var instances = getInstancesForPanel(pluginConf, metricConf);
    return _.flatten(_.map(datasources, function (source) {
      return _.map(instances, function (instance) {
        return getPanel(metricConf, source, instance);
      });
    }));
  });


  // setupPlugin :: [seriesObjects], pluginConfObject, pluginNameString -> pluginObject
  var setupPlugin = _.curry(function setupPlugin (series, pluginConf, pluginName) {
    var plugin = {
      name: pluginName,
      config: pluginConf.config,
    };
    plugin.metrics = _.map(pluginConf, getMetric(series, plugin));
    return _.merge({}, pluginProto, plugin);
  });


  // getRowsForPlugin :: [seriesObjects] -> function
  var getRowsForPlugin = function getRowsForPlugin (series) {
    // curry doesn't work inside compose... probably lodash issue
    // :: pluginConfObject, pluginNameString -> [rowObjects]
    return _.compose(setupRow,
                     stripErrorsFromPanels,
                     getPanelsForPlugin,
                     setupPlugin(series));
  };


  // getRows :: seriesObject, pluginsObject -> [rowObjects]
  var getRows = _.curry(function getRows (plugins, series) {
    return (_.isArray(series) && !_.isEmpty(series)) ?
      _.flatten(_.map(plugins, getRowsForPlugin(series))) :
      [];
  });


  // getSeries :: intervalString, [datasourcePointsObjects] -> Promise -> [seriesObjects]
  var getSeries = _.curry(function getSeries (interval, dsQueries) {
    var gettingDBData = _.map(dsQueries, function (query) {
      return $.getJSON(query.url);
    });

    return Promise.all(gettingDBData).then(function (json) {
      var datasources = _.pluck(dsQueries, 'datasource');
      var points = _.pluck(_.flatten(json), 'points');
      var dsPoints = _.zip(datasources, points);
      return _.flatten(_.map(dsPoints, function (dsPoint) {
        var ds = dsPoint[0];
        var points = dsPoint[1];
        return _.map(points, function (point) {
          return {
            source: ds,
            name: point[1],
            interval: interval,
          };
        }); 
      }));
    });
  });


  // getQueriesForDDash :: [datasourcesObjects], [queriesString] -> [queryObjects]
  var getQueriesForDDash = _.curry(function getQueriesForDDash (datasources, queries) {
    return _.flatten(_.map(datasources, function (ds) {
      return _.map(queries, function (query) {
        return {
          'datasource': ds.name,
          'url': ds.url + '/series?u=' + ds.username + '&p=' + ds.password +
            '&q=' + encodeURIComponent(query),
        };
      });
    }));
  });


  // setupDefaultDashboard :: [seriesObjects], dashboardObject -> mod dashboardObject
  var setupDefaultDashboard = function setupDefaultDashboard (series, dashboard) {
    var hostsAll = _.uniq(_.map(_.pluck(series, 'name'), function (series) {
      return series.split('.')[1];
    }));

    var hostsLinks = _.reduce(hostsAll, function (string, host) {
      return string + '\n\t\t\t<li>\n\t\t\t\t<a href="' +
        window.location.href + '?host=' + host +
        '" onclick="window.location=this.href;window.location.reload();">' +
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


  // parseTime :: timeString -> timeArray
  var parseTime = function parseTime (time) {
    var regexpTime = /(\d+)(m|h|d)/;
    return regexpTime.exec(time);
  };


  // getDashboardTime :: timeString -> dashboardTimeObject
  var getDashboardTime = function getDashboardTime (time) {
    if (!time || !parseTime(time))
      return _.merge({}, dashboardTimeProto);

    return _.merge({}, dashboardTimeProto, { from: 'now-' + time });
  };


  // getInterval :: timeString -> intervalString
  var getInterval = function getInterval (time) {
    var rTime = parseTime(time);
    if (!rTime)
      return '1m';

    var timeM = 0;
    if (rTime[2] === 'm')
      timeM = parseInt(rTime[1]);
    else if (rTime[2] === 'h')
      timeM = parseInt(rTime[1]) * 60;
    else if (rTime[2] === 'd')
      timeM = parseInt(rTime[1]) * 60 * 24;

    if (timeM > 360)
      return  (Math.ceil((Math.floor(timeM / 360) + 1) / 5) * 5).toString() + 'm';
    else if (timeM === 360)
      return '1m';
    else
      return '30s';
  };


  // getMetricArr :: pluginsObject, displayMetricString -> [metricStrings]
  var getMetricArr = _.curry(function getMetricArr (plugins, displayMetric) {
    if (!displayMetric)
      return _.keys(plugins);

    var displayMetrics = displayMetric.split(',');
    return _.uniq(_.reduce(displayMetrics, function (arr, metric) {
      if (metric in plugins) {
        arr.push(metric);
        return arr;
      } else if (metric in plugins.groups) {
        return _.union(arr, plugins.groups[metric]);
      }
    }, []));
  });


  // getQueryConfigs :: [datasourceObjects], pluginsObject -> [queryConfigObjects]
  var getQueryConfigs = _.curry(function getQueryConfigs (datasources, plugins) {
    var queryConfigsAll = _.map(plugins, function (plugin, name) {
      return {
        name: name,
        separator: plugin.config.separator,
        prefix: plugin.config.prefix,
        datasources: plugin.config.datasources || _.pluck(datasources, 'name'),
      };
    });

    var qSeparator = '@SEPARATOR@';
    var queryConfigsGrouped = _.groupBy(queryConfigsAll, function (qConf) {
      return qConf.prefix + qSeparator +
        qConf.separator + qSeparator +
        qConf.datasources;
    });

    return _.map(queryConfigsGrouped, function (qConf, pfxSepaDS) {
      var pfxSepaDSArr = pfxSepaDS.split(qSeparator);
      var prefix = pfxSepaDSArr[0];
      var separator = pfxSepaDSArr[1];
      var qDS = qConf[0].datasources;
      return {
        prefix: (prefix === 'undefined') ? undefined : prefix,
        separator: (separator === 'undefined')? undefined : separator,
        regexp: '(' + _.pluck(qConf, 'name').join('|') + ')',
        datasources: _.flatten(_.map(qDS, function (ds) {
            return _.where(datasources, { name: ds });
          })),
      };
    });
  });


  // getDSQueryArr :: hostNameString, [queryConfigObjects] -> [urlDatasourceObjects]
  var getDSQueryArr = _.curry(function getDSQueryArr (hostName, queryConfigs) {
    return _.flatten(_.map(queryConfigs, function (qConf) {
      return _.map(qConf.datasources, function (ds) {
        return {
          datasource: ds.name,
          url: ds.url + '/series?u=' + ds.username + '&p=' + ds.password + '&q=' +
            encodeURIComponent('list series /^' + (qConf.prefix || '') + hostName + '\\' +
                qConf.separator + qConf.regexp + '/'),
        };
      });
    }));
  });


  // stripPlugins :: pluginsObject, [metricsStrings] -> new pluginsObject
  var stripPlugins = _.curry(function stripPlugins (plugins, metrics) {
    var newPlugins = _.merge({}, plugins);
    _.each(_.keys(plugins), function (pluginName) {
      if (!_.contains(metrics, pluginName)) {
        delete newPlugins[pluginName];
      }
    });
    return newPlugins;
  });


  // getQueries :: hostNameString, datasourcesObject, pluginsObject -> [queryStrings]
  var getQueries = function getQueries (hostName, datasources, plugins) {
    return _.compose(getDSQueryArr(hostName), getQueryConfigs(datasources))(plugins);
  };


  // pickPlugins :: pluginObject, metricsString -> new pluginsObject
  var pickPlugins = function pickPlugins (plugins, metrics) {
    return _.compose(stripPlugins(plugins), getMetricArr(plugins))(metrics);
  };


  // getDashboard :: dashConfObject, grafanaCallbackFunction -> grafanaCallbackFunction(dashboardObject)
  var getDashboard = _.curry(function getDashboard (datasources, plugins, dashConf, callback) {
    var interval = getInterval(dashConf.time);
    var dashboard = {
      title: dashConf.title,
      time: getDashboardTime(dashConf.time),
    };

    if (!dashConf.host) {
      getSeries(interval, getQueriesForDDash(datasources, dashConf.defaultQueries))
        .then(function (series) {
          callback(setupDefaultDashboard(series, dashboard));
        });
      return;
    }
    
    var dashPlugins = pickPlugins(plugins, dashConf.metric);
    var dashQueries = getQueries(dashConf.host, datasources, dashPlugins);
    getSeries(interval, dashQueries)
      .then(function (series) {
        dashboard.rows = getRows(dashPlugins, series);
        callback(dashboard);
      });
  });


  return {
    get: getDashboard(datasources, plugins),
  };
});
