// Getdash application

define(['config', 'getdash/getdash.conf'], function getDashApp (grafanaConf, getdashConf) {
  'use strict';

  // Helper Functions

  // isError :: valueAny -> Bool
  var isError = function isError (value) {
    return Object.prototype.toString.call(value) === '[object Error]';
  };


  // genRandomColor :: -> colorStr
  var genRandomColor = function genRandomColor () {
    return '#' + ((1 << 24) * Math.random() | 0).toString(16);
  };


  // endsWith :: Str, targetStr -> Bool
  var endsWith = function endsWith (string, target) {
    var position = string.length - target.length;
    return position >= 0 && string.indexOf(target, position) === position;
  };


  // startsWith :: Str, targetStr -> Bool
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

  // seriesFilter :: metricConfObj, metricNameObj, seriesObj -> Bool
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


  // initMetric :: metricConfObj, metricNameStr -> metricObj
  var initMetric = _.curry(function initMetric (metricConf, metricName) {
    return _.merge({}, metricProto, metricConf, { name: metricName });
  });


  // addProperty :: keyStr, valueAny, Obj -> new Obj{key: value}
  var addProperty = _.curry(function addProperty (k, v, obj) {
    var o = {};
    o[k] = v;
    return _.merge({}, obj, o);
  });


  // addInstanceToSeries :: seriesObj, separatorStr, nameStr -> new seriesObj
  var addInstanceToSeries = function addInstanceToSeries (series, separator, name) {
    var instancePositionRight = name.split(separator).length + 1;
    return _.map(series, function (obj) {
      obj.instance = obj.name.split(separator).slice(-instancePositionRight)[0];
      return obj;
    });
  };


  // addSeriesToMetricGraphs :: seriesObj, metricConfObj -> new metricConfObj
  var addSeriesToMetricGraphs = _.curry(function addSeriesToMetricGraphs (series, metricConf) {
    // seriesThisFilter :: graphNameStr -> [seriesObjs]
    var seriesThisFilter = seriesFilter(metricConf);
    var graphSeries = _.reduce(metricConf.graph, function (newConf, graphConf, graphName) {
      var matchedSeries = _.filter(series, seriesThisFilter(graphName));
      if (_.isEmpty(matchedSeries))
        return newConf;

      var instanceSeries = addInstanceToSeries(matchedSeries, metricConf.separator, graphName);
      if (_.isArray(graphConf))
        newConf.graph[graphName] = _.map(_.range(graphConf.length), function () {
          return { series: instanceSeries };
        });
      else
        newConf.graph[graphName] = {
          series: instanceSeries,
        };

      return newConf;
    }, { graph: {} });

    return _.merge({}, metricConf, graphSeries);
  });


  //  moveUpToMetric :: keyStr, metricConfObj -> new metricConfObj
  var moveUpToMetric = _.curry(function moveUpToMetric (key, metricConf) {
    var keys = key + 's';
    var o = {};
    o[keys] =  _.union(_.flatten(_.map(metricConf.graph, function (graph) {
      var g = (_.isArray(graph)) ? graph[0] : graph;
      return _.pluck(g.series, key);
    })));
    return _.merge({}, metricConf, o);
  });


  // addSourcesToMetric :: metricConfObj -> new metricConfObj
  var addSourcesToMetric = moveUpToMetric('source');


  // addInstancesToMetric :: metricConfObj -> new metricConfObj
  var addInstancesToMetric = moveUpToMetric('instance');


  // getMetric :: [seriesObj], pluginObj -> func
  var getMetric = _.curry(function getMetric (series, plugin) {
    // :: metricConfObj, metricNameStr -> metricObj
    return _.compose(addInstancesToMetric,
                     addSourcesToMetric,
                     addSeriesToMetricGraphs(series),
                     addProperty('regexp', plugin.config.regexp),
                     addProperty('separator', plugin.config.separator),
                     addProperty('pluginAlias', plugin.config.alias),
                     addProperty('plugin', plugin.name),
                     initMetric);
  });


  // setupTarget :: metricConfObj, graphConfObj, metricStr, seriesObj -> targetObj
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
      condition: graphConf.where,
    };
    return _.merge({}, targetProto, { 'interval': series.interval }, target);
  });


  // transformObj :: keyKeyStr, valueKeyStr, {}, Obj -> Obj{key: value}
  var transformObj = _.curry(function transformObj (k, v, o, obj) {
    o[obj[k]] = obj[v];
    return o;
  });


  // setupAlias :: targetsObj -> aliasColorsObj
  var setupAlias = transformObj('alias', 'color');


  // initPanel :: metricConfObj, datasourceStr, instanceStr -> panelObj
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


  // getTargetsForPanel :: panelObj, graphConfObj -> [targetObjs]
  var getTargetsForPanel = _.curry(function getTargetsForPanel (panel, graphConf) {
    var grepBy = (_.isUndefined(panel.config.instance)) ?
      { source: panel.datasource } :
      { source: panel.datasource, instance: panel.config.instance };
    var graphSeries = _.where(graphConf.series, grepBy);
    if (_.isEmpty(graphSeries))
      return [];

    // setupThisTarget :: graphConfObj -> [targetObjs]
    var setupThisTarget = setupTarget(panel.config.metric, graphConf);
    return _.map(graphSeries, setupThisTarget);
  });


  // addTargetsToPanel :: panelObj -> new panelObj
  var addTargetsToPanel = function addTargetsToPanel (panel) {
    if (isError(panel))
      return panel;

    // getTargetsForThisPanel :: graphConfObj -> [targetObjs]
    var getTargetsForThisPanel = getTargetsForPanel(panel);
    var targets = _.flatten(_.map(panel.config.metric.graph, function (graphConf) {
      if (_.isArray(graphConf))
        return _.flatten(_.map(graphConf, getTargetsForThisPanel));

      return getTargetsForThisPanel(graphConf);
    }));

    if (_.isEmpty(targets))
      return new Error('targets for ' + panel.config.metric.plugin + '.' +
        panel.config.metric.plugin + ' are empty.');

    return _.merge({}, panel, {
      targets: targets,
    });
  };


  // addAliasColorsToPanel :: panelObj -> new panelObj
  var addAliasColorsToPanel = function addAliasColorsToPanel (panel) {
    if (isError(panel))
      return panel;

    return _.merge({}, panel, {
      aliasColors: _.reduce(panel.targets, setupAlias, {})
    });
  };


  // addTitleToPanle :: panelObj -> new panelObj
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


  // setupPanel :: panelObj -> new panelObj
  var setupPanel = function setupPanel (panel) {
    if (isError(panel))
      return panel;

    var p = _.merge({}, panelProto, panel);
    delete p.config; // no need in config after panel compleated.
    return p;
  };


  // getPanel :: metricConfigObj, datasourceStr, instanceStr -> panelObj
  var getPanel = _.compose(setupPanel,
                           addTitleToPanel,
                           addAliasColorsToPanel,
                           addTargetsToPanel,
                           initPanel);


  // setupRow :: [panelObjs] -> rowObj
  var setupRow = function setupRow (panels) {
    return _.merge({}, rowProto, {
      title: ('title' in panels[0]) ?
        panels[0].title.toUpperCase() :
        'Default Title',
      panels: panels
    });
  };


  // stripErrorPanels :: [panelObjs] -> new [panelObjs]
  var stripErrorsFromPanels = function stripErrorsFromPanels (panels) {
    var errors = _.filter(panels, isError);
    if (!_.isEmpty(errors))
      _.map(errors, function (e) {
        console.error(e.toString());
      });
    return _.reject(panels, isError);
  };


  // getPanelsForPlugin :: pluginObj -> [panelObjs]
  var getPanelsForPlugin = function getPanelsForPlugin (plugin) {
    return _.flatten(_.map(plugin.metrics, getPanelsForMetric(plugin.config)));
  };


  // getDatasources :: pluginConfObj, metricConfObj -> [Strs]
  var getDatasourcesForPanel = _.curry(function getDatasourcesForPanel (pluginConf, metricConf) {
    return (_.isArray(pluginConf.datasources) && !_.isEmpty(pluginConf.datasources)) ?
      pluginConf.datasources :
      metricConf.sources;
  });


  // getInstances :: pluginConfObj, metricConfObj -> [Strs]
  var getInstancesForPanel = _.curry(function getInstancesForPanel (pluginConf, metricConf) {
    return (_.has(pluginConf, 'multi') && pluginConf.multi) ?
      metricConf.instances :
      [ undefined ];
  });


  // getPanelsForMetric :: metricConfObj, [datasourceStrs], [instanceStrs] -> [panelObjs]
  var getPanelsForMetric = _.curry(function getPanelsForMetric (pluginConf, metricConf) {
    var datasources = getDatasourcesForPanel(pluginConf, metricConf);
    var instances = getInstancesForPanel(pluginConf, metricConf);
    return _.flatten(_.map(datasources, function (source) {
      return _.map(instances, function (instance) {
        return getPanel(metricConf, source, instance);
      });
    }));
  });


  // setupPlugin :: [seriesObjects], pluginConfObj, pluginNameStr -> pluginObj
  var setupPlugin = _.curry(function setupPlugin (series, pluginConf, pluginName) {
    var plugin = {
      name: pluginName,
      config: pluginConf.config,
    };
    plugin.metrics = _.map(pluginConf, getMetric(series, plugin));
    return _.merge({}, pluginProto, plugin);
  });


  // getRowsForPlugin :: [seriesObjs] -> func
  var getRowsForPlugin = function getRowsForPlugin (series) {
    // curry doesn't work inside compose... probably lodash issue
    // :: pluginConfObj, pluginNameStr -> [rowObjs]
    return _.compose(setupRow,
                     stripErrorsFromPanels,
                     getPanelsForPlugin,
                     setupPlugin(series));
  };


  // getRows :: seriesObj, pluginsObj -> [rowObjs]
  var getRows = _.curry(function getRows (plugins, series) {
    return (_.isArray(series) && !_.isEmpty(series)) ?
      _.flatten(_.map(plugins, getRowsForPlugin(series))) :
      [];
  });


  // getSeries :: intervalStr, [datasourcePointsObjs] -> Promise -> [seriesObjs]
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


  // getQueriesForDDash :: [datasourcesObjs], [queriesStrs] -> [queryObjs]
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


  // setupDefaultDashboard :: [seriesObjs], dashboardObj -> mod dashboardObj
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


  // parseTime :: timeStr -> [timeStrs]
  var parseTime = function parseTime (time) {
    var regexpTime = /(\d+)(m|h|d)/;
    return regexpTime.exec(time);
  };


  // getDashboardTime :: timeStr -> dashboardTimeObj
  var getDashboardTime = function getDashboardTime (time) {
    if (!time || !parseTime(time))
      return _.merge({}, dashboardTimeProto);

    return _.merge({}, dashboardTimeProto, { from: 'now-' + time });
  };


  // getInterval :: timeStr -> intervalStr
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


  // getMetricArr :: pluginsObj, displayMetricStr -> [metricStrs]
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


  // getQueryConfigs :: [datasourceObjs], pluginsObj -> [queryConfigObjs]
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


  // getDSQueryArr :: hostNameStr, [queryConfigObjs] -> [urlDatasourceObjs]
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


  // stripPlugins :: pluginsObj, [metricsStrs] -> new pluginsObj
  var stripPlugins = _.curry(function stripPlugins (plugins, metrics) {
    var newPlugins = _.merge({}, plugins);
    // have to use this ugly thing because reduce will strip unenumerable 'config'
    _.each(_.keys(plugins), function (pluginName) {
      if (!_.contains(metrics, pluginName)) {
        delete newPlugins[pluginName];
      }
    });
    return newPlugins;
  });


  // getQueries :: hostNameStr, datasourcesObj, pluginsObj -> [queryStrs]
  var getQueries = function getQueries (hostName, datasources, plugins) {
    return _.compose(getDSQueryArr(hostName), getQueryConfigs(datasources))(plugins);
  };


  // pickPlugins :: pluginObj, metricsStr -> new pluginsObj
  var pickPlugins = function pickPlugins (plugins, metrics) {
    return _.compose(stripPlugins(plugins), getMetricArr(plugins))(metrics);
  };


  // getDashboard :: [datasources], pluginsObj, dashConfObj,
  //                 grafanaCallbackFunc -> grafanaCallbackFunc(dashboardObj)
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
    // get :: dashConfObj, grafanaCallbackFunc -> grafanaCallbackFunc(dashboardObj)
    get: getDashboard(datasources, plugins),
  };
});
