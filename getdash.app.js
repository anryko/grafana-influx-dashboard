// Getdash application

// getDashApp :: [datasourceObj], confObj -> dashObj
var getDashApp = function getDashApp (datasourcesAll, getdashConf) {
  'use strict';

  // Helper Functions

  // log :: any -> any
  var log = function log (a) {
    console.log('DEBUG LOG: ', arguments);
    return a;
  };


  // isError :: valueAny -> Bool
  var isError = function isError (value) {
    return Object.prototype.toString.call(value) === '[object Error]';
  };


  // genRandomColor :: -> colorStr
  var genRandomColor = function genRandomColor () {
    return '#' + ('00' + (Math.random() * 4096 << 0).toString(16)).substr(-3);
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


  // startsOrEndsWith :: Str, targetStr -> Bool
  var startsOrEndsWith = function startsOrEndsWith (string, target) {
    return startsWith(string, target) || endsWith(string, target);
  };


  // testIfRegexp :: Str, targetStr -> Bool
  var testIfRegexp = function testIfRegexp (string, target) {
    return (target[0] === '/' && target[target.length - 1] === '/') &&
        (RegExp(target.substr(1, target.length - 2)).test(string));
  };


  // Variables
  var plugins = getdashConf.plugins;
  var datasources = _.filter(datasourcesAll, function (ds) {
    return !ds.grafanaDB && startsWith(ds.type, 'influxdb');
  });


  // Object prototypes
  var dashboardProto = {
    rows: [],  // [rowProto]
    services: {},
    time: {},  // dashboardTimeProto
    title: ''
  };

  var dashboardTimeProto = {
    from: 'now-6h',
    to: 'now'
  };

  var seriesProto = {
    source: '',
    name: ''
  };

  var metricProto = {
    name: '',
    plugin: '',
    pluginAlias: undefined,  // Str
    regexp: undefined,  // Str
    separator: '',
    graph: {},
    panel: {}
  };

  var pluginProto = {
    name: '',
    config: {},
    metrics: []  // [metricProto]
  };

  var tagProto = {};

  var selectProto = {
    type: '',
    params: []
  };

  var targetProto = {
    measurement: '',
    alias: '',
    tags: [],  // [tagProto]
    select: [],  // [selectProto]
    interval: false,
    query: '',
    fill: 'none',
    groupBy: [
      {
        type: 'time',
        interval: 'auto'
      }
    ]
  };

  var panelProto = {
    title: 'default',
    height: '300px',
    type: 'graphite',
    span: 12,
    y_formats: [ 'none' ],
    grid: {
      max: null,
      min: 0,
      leftMin: 0
    },
    lines: true,
    fill: 1,
    linewidth: 1,
    nullPointMode: 'null',
    targets: [],  // [targetProto]
    aliasColors: {}
  };

  var rowProto = {
    title: 'default',
    height: '300px',
    panels: []  // [panelProto]
  };


  // Application Functions

  // seriesFilter :: metricConfObj, metricNameObj, seriesObj -> Bool
  var seriesFilter = _.curry(function seriesFilter (metricConf, metricName, series) {
    var type_instance = (_.isUndefined(series.type_instance) || _.isEmpty(series.type_instance))
        ? 'UNDEFINED'
        : series.type_instance;
    return startsWith(series.name, metricConf.plugin) && (startsOrEndsWith(series.name, metricName) ||
        testIfRegexp(series.name, metricName) || startsOrEndsWith(type_instance, metricName) ||
        testIfRegexp(type_instance, metricName)) && (_.isUndefined(metricConf.regexp) ||
        metricConf.regexp.test(series.instance));
  });


  // initMetric :: metricConfObj, metricNameStr -> metricObj
  var initMetric = function initMetric (metricConf, metricName) {
    return _.merge({}, metricProto, metricConf, { name: metricName });
  };


  // addProperty :: keyStr, valueAny, Obj -> new Obj{key: value}
  var addProperty = _.curry(function addProperty (k, v, obj) {
    var o = {};
    o[k] = v;
    return _.merge({}, obj, o);
  });


  // mergeSeries :: [Str], [seriesObj] -> mod [seriesObj]
  var mergeSeries = function (series, delKeys) {
    return _.uniq(_.map(series, function (s) {
      _.map(delKeys, function (k) {
        if (_.isUndefined(s[k]))
          return s;

        delete(s[k]);
        return s;
      });
      return s;
    }), JSON.stringify);
  };
  //console.assert(_.isEqual(
  //   mergeSeries([{
  //       source: 'ops',
  //       name: 'cpu_value',
  //       instance: '0',
  //       interval: '1m',
  //       host: 'vagrant-ubuntu-trusty-64',
  //       type: 'cpu',
  //       type_instance: 'system'
  //     }, {
  //       source: 'ops',
  //       name: 'cpu_value',
  //       instance: '1',
  //       interval: '1m',
  //       host: 'vagrant-ubuntu-trusty-64',
  //       type: 'cpu',
  //       type_instance: 'system'
  //     }], [ 'instance', 'type' ]),
  //   [{
  //     source: 'ops',
  //     name: 'cpu_value',
  //     interval: '1m',
  //     host: 'vagrant-ubuntu-trusty-64',
  //     type_instance: 'system'
  //   }]
  // ), "mergeSeries is broken.");


  // addSeriesToMetricGraphs :: seriesObj, metricConfObj -> new metricConfObj
  var addSeriesToMetricGraphs = _.curry(function addSeriesToMetricGraphs (series, metricConf) {
    // seriesThisFilter :: graphNameStr -> [seriesObj]
    var seriesThisFilter = seriesFilter(metricConf);
    var graphSeries = _.reduce(metricConf.graph, function (newConf, graphConf, graphName) {
      var matchedSeries = _.filter(series, seriesThisFilter(graphName));
      var readySeries = (_.isUndefined(metricConf.merge))
          ? matchedSeries
          : mergeSeries(matchedSeries, metricConf.merge);

      if (_.isEmpty(readySeries))
        return newConf;

      if (_.isArray(graphConf))
        newConf.graph[graphName] = _.map(_.range(graphConf.length), function () {
          return {
            series: readySeries
          };
        });
      else
        newConf.graph[graphName] = {
          series: readySeries
        };

      return newConf;
    }, { graph: {} });

    return _.merge({}, metricConf, graphSeries);
  });


  // moveUpToMetric :: keyStr, metricConfObj -> new metricConfObj
  var moveUpToMetric = _.curry(function moveUpToMetric (key, metricConf) {
    var keys = key + 's';
    var o = {};
    o[keys] =  _.union(_.flatten(_.map(metricConf.graph, function (graph) {
      var g = (_.isArray(graph))
          ? graph[0]
          : graph;
      return _.pluck(g.series, key);
    })));
    return _.merge({}, metricConf, o);
  });


  // addSourcesToMetric :: metricConfObj -> new metricConfObj
  var addSourcesToMetric = moveUpToMetric('source');


  // addInstancesToMetric :: metricConfObj -> new metricConfObj
  var addInstancesToMetric = moveUpToMetric('instance');


  // addHostsToMetric :: metricConfObj -> new metricConfObj
  var addHostsToMetric = moveUpToMetric('host');


  // getMetric :: [seriesObj], pluginObj -> func
  var getMetric = _.curry(function getMetric (series, plugin) {
    // :: metricConfObj, metricNameStr -> metricObj
    return _.compose(addHostsToMetric,
                     addInstancesToMetric,
                     addSourcesToMetric,
                     addSeriesToMetricGraphs(series),
                     addProperty('merge', plugin.config.merge),
                     addProperty('regexp', plugin.config.regexp),
                     addProperty('separator', plugin.config.separator),
                     addProperty('pluginAlias', plugin.config.alias),
                     addProperty('plugin', plugin.name),
                     initMetric);
  });


  // getSelect :: graphConfObj -> [selectObj]
  var getSelect = function getSelect (graphConf) {
    // Simple parser function to form targets select array from 'apply' string.
    // Intended to handle inputs like max, count, derivative, derivative(10s),
    // derivative(last), derivative(max(), 1s), derivative(min(value), 10s).
    var select = [
      {
        type: 'field',
        params: (graphConf.column)
            ? graphConf.column.split(',')
            : [ 'value' ]
      }
    ];

    if (graphConf.apply) {
      var fn = _.without(_.filter(graphConf.apply.split(/[(), ]/)), graphConf.column, 'value');
      if (fn[0] === 'derivative') {
        if (isNaN(parseInt(fn[1]))) {
          select.push({
            type: fn[1] || 'mean',
            params: []
          });
          select.push({
            type: fn[0],
            params: (fn[2])
                ? [ fn[2] ]
                : [ '1s' ]
          });
        } else {
          select.push({
            type: 'mean',
            params: []
          });
          select.push({
            type: fn[0],
            params: (fn[1])
                ? [ fn[1] ]
                : [ '1s' ]
          });
        }
      } else {
        select.push({
          type: fn[0],
          params: (fn[1])
              ? [ fn[1] ]
              : []
        });
      }
    } else {
      select.push({
        type: 'mean',
        params: []
      });
    }

    if (graphConf.math)
      select.push({
        type: 'math',
        params: [ graphConf.math ]
      });

   return select;
  };


  // setupTarget :: metricConfObj, graphConfObj, seriesObj -> targetObj
  var setupTarget = _.curry(function setupTarget (metricConf, graphConf, series) {
    var select = getSelect(graphConf);

    var tagObjs = _.omit(series, function (v, n) {
      return _.indexOf([ 'name', 'source', 'key' ], n) !== -1;
    });
    var tags = _.map(tagObjs, function (v, k) {
      return {
        condition: 'AND',
        key: k,
        value: v,
        operator: '='
      };
    });
    delete tags[0].condition;
    var target = {
      alias: (metricConf.pluginAlias || series.type || series.name) +
        (series.instance ? '.' + series.instance : '') + '.' +
        (graphConf.alias || series.type_instance || series.name || series.type),
      color: graphConf.color || genRandomColor(),
      measurement: series.name,
      select: [ select ],
      tags: tags,
      interval: graphConf.interval
    };

    return _.merge({}, targetProto, target);
  });


  // transformObj :: keyKeyStr, valueKeyStr, {}, Obj -> Obj{key: value}
  var transformObj = _.curry(function transformObj (k, v, o, obj) {
    o[obj[k]] = obj[v];
    return o;
  });


  // setupAlias :: targetsObj -> aliasColorsObj
  var setupAlias = transformObj('alias', 'color');


  // initPanel :: metricConfObj, datasourceStr, instanceStr, hostnameStr -> panelObj
  var initPanel = _.curry(function initPanel (metricConf, datasource, instance, host) {
    if (_.isUndefined(datasource) || _.isUndefined(metricConf)) {
      return new Error('undefined argument in initPanel function.');
    }
    var panel = {
      datasource: datasource,
      config: {
        instance: instance,
        host: host,
        metric: metricConf
      }
    };

    return _.merge({}, panel, metricConf.panel);
  });


  // getTargetsForPanel :: panelObj, graphConfObj -> [targetObj]
  var getTargetsForPanel = _.curry(function getTargetsForPanel (panel, graphConf) {
    var grepBy = {
      source: panel.datasource,
      host: panel.config.host
    };
    if (!_.isUndefined(panel.config.instance)) {
      grepBy['instance'] = panel.config.instance;
    }
    if (!_.isUndefined(graphConf.type)) {
      grepBy['type'] = graphConf.type;
    }

    var graphSeries = _.where(graphConf.series, grepBy);
    if (_.isEmpty(graphSeries))
      return [];

    // setupThisTarget :: graphConfObj -> [targetObj]
    var setupThisTarget = setupTarget(panel.config.metric, graphConf);
    return _.map(graphSeries, setupThisTarget);
  });


  // addTargetsToPanel :: panelObj -> new panelObj
  var addTargetsToPanel = function addTargetsToPanel (panel) {
    if (isError(panel))
      return panel;

    // getTargetsForThisPanel :: graphConfObj -> [targetObj]
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
      targets: targets
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


  // addTitleToPanel :: panelObj -> new panelObj
  var addTitleToPanel = function addTitleToPanel (panel) {
    if (isError(panel))
      return panel;

    panel.title = panel.config.host + ': ' + panel.title;
    if (panel.title.match('@metric')) {
      var metric = (_.isUndefined(panel.config.instance))
          ? panel.config.metric.instances[0]
          : panel.config.instance;
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
    delete p.config;  // no need in config after panel complected.
    return p;
  };


  // getPanel :: metricConfigObj, datasourceStr, instanceStr, hostnameStr -> panelObj
  var getPanel = _.compose(setupPanel,
                           addTitleToPanel,
                           addAliasColorsToPanel,
                           addTargetsToPanel,
                           initPanel);


  // setupRow :: [panelObj] -> rowObj
  var setupRow = function setupRow (panels) {
    if (_.isEmpty(panels))
      return [];

    return _.merge({}, rowProto, {
      title: ('title' in panels[0])
          ? panels[0].title.toUpperCase()
          : 'Default Title',
      panels: panels
    });
  };


  // stripErrorPanels :: [panelObj] -> new [panelObj]
  var stripErrorsFromPanels = function stripErrorsFromPanels (panels) {
    var errors = _.filter(panels, isError);
    if (!_.isEmpty(errors))
      _.map(errors, function (e) {
        console.warn(e.toString());
      });
    return _.reject(panels, isError);
  };


  // getPanelsForPlugin :: pluginObj -> [panelObj]
  var getPanelsForPlugin = function getPanelsForPlugin (plugin) {
    return _.flatten(_.map(plugin.metrics, getPanelsForMetric(plugin.config)));
  };


  // getDatasources :: pluginConfObj, metricConfObj -> [Str]
  var getDatasourcesForPanel = _.curry(function getDatasourcesForPanel (pluginConf, metricConf) {
    return (_.isArray(pluginConf.datasources) && !_.isEmpty(pluginConf.datasources))
        ? pluginConf.datasources
        : metricConf.sources;
  });


  // getInstances :: pluginConfObj, metricConfObj -> [Str]
  var getInstancesForPanel = _.curry(function getInstancesForPanel (pluginConf, metricConf) {
    return (_.has(pluginConf, 'multi') && pluginConf.multi)
        ? metricConf.instances
        : [ undefined ];
  });


  // getPanelsForMetric :: metricConfObj, [datasourceStr], [instanceStr] -> [panelObj]
  var getPanelsForMetric = _.curry(function getPanelsForMetric (pluginConf, metricConf) {
    var datasources = getDatasourcesForPanel(pluginConf, metricConf);
    var hosts = metricConf.hosts;

    if (_.isEmpty(datasources))
      return new Error('Datasources for ' + metricConf.plugin + '.' +
          metricConf.name + ' are empty.');

    var instances = getInstancesForPanel(pluginConf, metricConf);
    return _.flatten(_.map(hosts, function (host) {
      return _.map(datasources, function (source) {
        return _.map(instances, function (instance) {
          return getPanel(metricConf, source, instance, host);
        });
      });
    }));
  });


  // setupPlugin :: [seriesObject], pluginConfObj, pluginNameStr -> pluginObj
  var setupPlugin = _.curry(function setupPlugin (series, pluginConf, pluginName) {
    var plugin = {
      name: pluginName,
      config: pluginConf.config
    };
    plugin.metrics = _.map(pluginConf, getMetric(series, plugin));
    return _.merge({}, pluginProto, plugin);
  });


  // getRowsForPlugin :: [seriesObj] -> func
  var getRowsForPlugin = function getRowsForPlugin (series) {
    // curry doesn't work inside compose... probably lodash issue
    // :: pluginConfObj, pluginNameStr -> rowObj
    return _.compose(setupRow,
                     stripErrorsFromPanels,
                     getPanelsForPlugin,
                     setupPlugin(series));
  };


  // getRows :: seriesObj, pluginsObj -> [rowObj]
  var getRows = _.curry(function getRows (plugins, series) {
    return (_.isArray(series) && !_.isEmpty(series))
        ? _.flatten(_.map(plugins, getRowsForPlugin(series)))
        : [];
  });


  // getDBData :: [datasourcePointsObj] -> Promise([queryResultObj])
  var getDBData = function getDBData (dsQueries) {
    var gettingDBData = _.map(dsQueries, function (query) {
      return $.getJSON(query.url);
    });

    return Promise.all(gettingDBData);
  };


  // getQueriesForDDash :: [datasourcesObj], [queriesStr] -> [queryObj]
  var getQueriesForDDash = _.curry(function getQueriesForDDash (datasources, queries) {
    return _.flatten(_.map(datasources, function (ds) {
      return _.map(queries, function (query) {
        if (ds.access == 'proxy')
          return {
            datasource: ds.name,
            url: 'api/datasources/proxy/' + ds.id + '/query?q=' +
                   fixedEncodeURIComponent('SHOW TAG VALUES FROM '+
                     query + ' WITH KEY = host;')
          };

        return {
          datasource: ds.name,
          url: ds.url + '/query?db=' + ds.database +
                 '&u=' + ds.username + '&p=' + ds.password +
                   '&q=' + fixedEncodeURIComponent('SHOW TAG VALUES FROM ' +
                     query + ' WITH KEY = host;')
        };
      });
    }));
  });


  // setupDefaultDashboard :: [seriesObj], dashboardObj -> mod dashboardObj
  var setupDefaultDashboard = function setupDefaultDashboard (hostsAll, dashboard) {
    var hostsLinks = _.reduce(hostsAll, function (string, host) {
      return string + '\n\t\t\t<li>\n\t\t\t\t<a href="' +
        window.location.href + '?host=' + host +
        '" onclick="window.location.href=this.href;">' +
        host + '</a>\n\t\t\t</li>';
    }, '');

    var rowProto = {
      'title': 'Default',
      'height': '30px',
      'panels': [
        {
          'title': '',
          'span': 12,
          'type': 'text',
          'mode': 'html',
          'content': 'default'
        }
      ]
    };

    var rowDocs = _.merge({}, rowProto, {
      'title': 'Docs',
      'panels': [
        {
          'content': '<div class="row-fluid">\n\t<div class="span12">\n\t\t<a href="https://github.com/anryko/grafana-influx-dashboard"><h4>Grafana InfluxDB Scripted Dashboard Documentation</h4></a>\n\t</div>\n</div>'
        }
      ]
    });

    var rowHosts = _.merge({}, rowProto, {
      'title': 'Hosts',
      'panels': [
        {
          'content': '<div class="row-fluid">\n\t<div class="span6">\n\t\t<h4>Available Hosts</h4>\n\t\t<ul>' + hostsLinks + '\n\t\t</ul>'
        }
      ]
    });

    dashboard.title = 'Scripted Dashboard';
    dashboard.rows = [
      rowHosts,
      rowDocs
    ];
    return dashboard;
  };


  // parseTime :: timeStr -> [timeStr]
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


  // getMetricArr :: pluginsObj, displayMetricStr -> [metricStr]
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


  // getQueryConfigs :: [datasourceObj], pluginsObj -> [queryConfigObj]
  var getQueryConfigs = _.curry(function getQueryConfigs (datasources, plugins) {
    var queryConfigsAll = _.map(plugins, function (plugin, name) {
      return {
        name: name,
        separator: plugin.config.separator,
        prefix: plugin.config.prefix,
        datasources: plugin.config.datasources || _.pluck(datasources, 'name')
      };
    });

    var qSeparator = '@SEPARATOR@';
    var queryConfigsGrouped = _.groupBy(queryConfigsAll, function (qConf) {
      return qConf.prefix + qSeparator +
        qConf.separator + qSeparator +
        qConf.datasources;
    });

    // TODO: remove prefix.
    return _.map(queryConfigsGrouped, function (qConf, pfxSepaDS) {
      var pfxSepaDSArr = pfxSepaDS.split(qSeparator);
      var prefix = pfxSepaDSArr[0];
      var separator = pfxSepaDSArr[1];
      var qDS = qConf[0].datasources;
      return {
        prefix: (prefix === 'undefined')
            ? undefined
            : prefix,
        separator: (separator === 'undefined')
            ? undefined
            : separator,
        regexp: '(' + _.pluck(qConf, 'name').join('|') + ')',
        datasources: _.flatten(_.map(qDS, function (ds) {
            return _.where(datasources, { name: ds });
          }))
      };
    });
  });


  // fixedEncodeURIComponent :: Str -> Str
  function fixedEncodeURIComponent (str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
      return '%' + c.charCodeAt(0).toString(16);
    });
  }


  // getDSQueryArr :: hostNameStr, [queryConfigObj] -> [urlDatasourceObj]
  var getDSQueryArr = _.curry(function getDSQueryArr (hostName, queryConfigs) {
    var hostQuery = (hostName)
        ? 'WHERE host = \'' + hostName + '\''
        : '';

    return _.flatten(_.map(queryConfigs, function (qConf) {
      return _.map(qConf.datasources, function (ds) {
        if (ds.access == "proxy")
          return {
            datasource: ds.name,
            url: 'api/datasources/proxy/' + ds.id + '/query?q=' +
                   fixedEncodeURIComponent('SHOW SERIES FROM /' +
                     qConf.regexp + '.*/ ' + hostQuery + ';')
          };

        return {
          datasource: ds.name,
          url: ds.url + '/query?db=' + ds.database +
                 '&u=' + ds.username + '&p=' + ds.password +
                   '&q=' + fixedEncodeURIComponent('SHOW SERIES FROM /' +
                     qConf.regexp + '.*/ ' + hostQuery + ';')
        };
      });
    }));
  });


  // stripPlugins :: pluginsObj, [metricsStr] -> new pluginsObj
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


  // getQueries :: hostNameStr, datasourcesObj, pluginsObj -> [queryStr]
  var getQueries = function getQueries (hostName, datasources, plugins) {
    return _.compose(getDSQueryArr(hostName), getQueryConfigs(datasources))(plugins);
  };


  // splitKey :: keyStr -> [keyPartStr]
  var splitKey = function splitKey (key) {
    return ('name=' + key).split(',');
  };
  // console.assert(_.isEqual(
  //   splitKey("load_longterm,host=vagrant,type=load"),
  //   [ "name=load_longterm", "host=vagrant", "type=load" ]
  // ));


  // objectKey :: [keyPartStr] -> keyObj
  var objectKey = function objectKey (keys) {
    return _.reduce(keys, function(result, expr) {
      var vars = expr.split('=');
      result[vars[0]] = vars[1];
      return result;
    }, {});
  };
  // console.assert(_.isEqual(
  //   objectKey([ "name=load_longterm", "host=vagrant", "type=load" ]),
  //   { host: "vagrant", name: "load_longterm", type: "load"}
  // ));


  // convertKey :: keyStr -> keyObj
  var convertKey = _.compose(objectKey, splitKey);
  //  console.assert(_.isEqual(
  //    convertKey("load_longterm,host=vagrant,type=load"),
  //    { host: "vagrant", name: "load_longterm", type: "load"}
  //  ));


  // setupSeries :: seriesObj -> new seriesObj
  var setupSeries = function (series) {
    return _.merge({}, seriesProto, series);
  };


  // getSeries :: keyStr -> seriesObj
  var getSeries = _.compose(setupSeries, convertKey);


  // pickPlugins :: pluginObj, metricsStr -> new pluginsObj
  var pickPlugins = function pickPlugins (plugins, metrics) {
    return _.compose(stripPlugins(plugins), getMetricArr(plugins))(metrics);
  };


  // parseResp :: [jsonObj] -> [Str]
  var parseResp = function parseResp (resp) {
    return _.map(resp, function (res) {
      var series = res.results[0].series;
      if (_.isUndefined(series))
        return;

      return _.pluck(series, 'values');
    });
  };


  // genSeries :: dashConfObj, seriesRespObj, [datasourceObj] -> dashboardObj
  var genSeries = function genSeries (dashConf, seriesResp, datasources) {
    var keys = _.map(seriesResp, function (val) {
      if (_.isUndefined(val))
        return;

      return _.flatten(_.map(val, function (v) {
        return _.map(v, _.first);
      }));
    });

    var dsKeys = _.zip(datasources, keys);

    return  _.flatten(_.map(dsKeys, function (dsKey) {
      var ds = dsKey[0];
      var kk = dsKey[1];
      return _.map(kk, function (k) {
        var series = {
          source: ds
        };
        return _.merge({}, getSeries(k), series);
      });
    }));
  };


  // getDashboard :: [datasources], pluginsObj, dashConfObj,
  //                 grafanaCallbackFunc -> grafanaCallbackFunc(dashboardObj)
  var getDashboard = _.curry(function getDashboard (datasources, plugins, dashConf, callback) {
    var dashboard = {
      title: dashConf.title,
      time: getDashboardTime(dashConf.time)
    };

    if (!dashConf.host && !dashConf.metric) {
      var queriesForDDash = getQueriesForDDash(datasources, dashConf.defaultQueries);

      getDBData(queriesForDDash).then(function (resp) {
        var hosts = _.without(_.uniq(_.flatten(_.compact(parseResp(resp)))), 'host');
        return callback(setupDefaultDashboard(hosts, dashboard));
      });
    } else {

      var dashPlugins = pickPlugins(plugins, dashConf.metric);
      var dashQueries = getQueries(dashConf.host, datasources, dashPlugins);
      var datasources = _.pluck(dashQueries, 'datasource');

      getDBData(dashQueries).then(function (resp) {
        var seriesResp = parseResp(resp);
        var series = genSeries(dashConf, seriesResp, datasources);

        // Object prototypes setup
        panelProto.span = dashConf.span;

        dashboard.rows = getRows(dashPlugins, series);
        return callback(dashboard);
      });
    }
  });


  return {
    // get :: dashConfObj, grafanaCallbackFunc -> grafanaCallbackFunc(dashboardObj)
    get: getDashboard(datasources, plugins)
  };
}
