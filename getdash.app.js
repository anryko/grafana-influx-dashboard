// Getdash application

// getDashApp :: [datasourceObj], confObj -> dashObj
var getDashApp = function getDashApp (datasourcesAll) {
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
    return (_.isString(string)) && (_.isString(target)) &&
        (target[0] === '/' && target[target.length - 1] === '/') &&
        (RegExp(target.substr(1, target.length - 2)).test(string));
  };


  // Variables
  var datasources = _.filter(datasourcesAll, function (ds) {
    return !ds.grafanaDB && startsWith(ds.type, 'influxdb');
  });


  // Object prototypes
  var dashboardProto = {
    rows: [],  // [rowProto]
    services: {},
    time: {},  // dashboardTimeProto
    title: '',
    schemaVersion: 13
  };

  var dashboardTimeProto = {
    from: 'now-6h',
    to: 'now'
  };

  var seriesProto = {
    source: '',
    measurement: ''
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
    fill: 'null',
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
    type: 'graph',
    span: 12,
    yaxes: [
      {
        format: 'short',
        min: null
      }, {}
    ],
    lines: true,
    fill: 1,
    linewidth: 1,
    nullPointMode: 'null',
    targets: [],  // [targetProto]
    aliasColors: {},
    legend: {
      show: true,
      hideEmpty: true,
      values: false,
      min: false,
      max: false,
      current: false,
      total: false,
      avg: false,
      alignAsTable: false,
      rightSide: false
    },
    id: 1,
    interval: '>10s'
  };

  var rowProto = {
    title: 'default',
    height: '300px',
    panels: []  // [panelProto]
  };



  // Application Functions
  // matchLineSeries :: lineObj, seriesObj, optionStr -> Bool
  var matchLineSeries = function matchLineSeries (line, series, option) {
    return (line[option] === series[option]) ||
        _.isUndefined(line[option]) ||
        testIfRegexp(series[option], line[option]);
  };

  // lineSeriesFilter :: tagsObj, lineObj, seriesObj -> Bool
  var lineSeriesFilter = _.curry(function lineSeriesFilter (tags, line, series) {
    //debugger; 
    return _(tags)
      .keys()
      .map(option => matchLineSeries(line, series, option))
      .every(x => x === true);
  });

  // setLineSeries :: tagsObj, lineObj, [seriesObj] -> new lineObj
  var setLineSeries = function setLineSeries (tags, line, series) {
    //return _.merge({}, line, { series: _.filter(series, lineSeriesFilter(tags, line)) });
    return _(line)
      .chain()
      .cloneDeep()
      .tap(l => _.set(l, 'series', _.filter(series, lineSeriesFilter(tags, line))))
      .value();
  };

  // setGraphSeries :: tagsObj, [lineObj], [seriesObj] -> new [lineObj]
  var setGraphSeries = function setGraphSeries (tags, graph, series) {
    //var pluginTags = _.merge({}, tags, _.get(plugin, 'config.tags'));
    //debugger;
    return _(graph)
      .map(line => setLineSeries(tags, line, series))
      .value();
  };

  // setGraphsSeries :: tagsObj, [graphObj], [seriesObj] -> new [[lineObj]]
  var setGraphsSeries = function setGraphsSeries (tags, graphs, series) {
    return _(graphs)
      .map(graph => setGraphSeries(tags, graph, series))
      .value();
  };

  // setPluginSeries :: tagsObj, pluginObj, [seriesObj] -> new pluginObj 
  var setPluginSeries = function setPluginSeries (tags, plugin, series) {
    return _(plugin)
      .chain()
      .cloneDeep()
      .tap(p => _.set(p, 'config.tags', _.merge({}, tags, _.get(plugin, 'config.tags'))))
      .tap(p => _.set(p, 'graphs', setGraphsSeries(p.config.tags, p.graphs, series)))
      .value();
  };


  // getGraphSeriesValuesByKey :: seriesKeyStr, graphObj -> [seriesKeyValueStr]
  var getGraphSeriesValuesByKey = function getGraphSeriesValuesByKey (seriesKey, graph) {
    return _(graph)
      .map('series')
      .without(undefined)
      .flattenDeep()
      .unionBy(seriesKey)
      .map(seriesKey)
      .value();
  };

  // stripLineSeriesByValue :: seriesKeyStr, seriesValueStr, lineObj -> new lineObj
  var stripLineSeriesByValue = _.curry(function stripLineSeriesByValue (seriesKey, seriesValue, line) {
    //debugger;
    return _(line)
      .chain()
      .cloneDeep()
      .tap(l => _.set(l, 'series', _.filter(l.series, [seriesKey, seriesValue])))
      .value();
  });

  // stripLinesSeriesByValue :: seriesKeyStr, seriesValueStr, [lineObj] -> [lineObj]
  var stripLinesSeriesByValue = _.curry(function stripLinesSeriesByValue (seriesKey, seriesValue, lines) {
    return _(lines)
      .map(stripLineSeriesByValue(seriesKey, seriesValue))
      .filter(l => !_.isEmpty(l.series))
      .value();
  });

  // stripGraphSeriesByValue :: graphObj, seriesKeyStr, seriesValueStr -> new graphObj
  var stripGraphSeriesByValue = _.curry(function stripGraphSeriesByValue (graph, seriesKey, seriesValue) {
    //debugger;
    return _(graph)
      .chain()
      .cloneDeep()
      .tap(g => _.set(g, 'graph', stripLinesSeriesByValue(seriesKey, seriesValue, g.graph)))
      .value();
  });


  // splitGraphBySeriesKey :: seriesKeyStr, graphObj -> [graphObj]
  var splitGraphBySeriesKey = _.curry(function splitGraphBySeriesKey (seriesKey, graph) {
    // NOTE: Overwrite global series key with local one if present
    seriesKey = _.get(graph, 'config.split_by', seriesKey);
    if (_.isUndefined(seriesKey))
      return [graph];

    var seriesValues = getGraphSeriesValuesByKey(seriesKey, graph.graph);
    return _(seriesValues)
      .map(stripGraphSeriesByValue(graph, seriesKey))
      .value();
  });

  // splitPluginGraphsBySeriesKey :: pluginObj -> new pluginObj
  var splitPluginGraphsBySeriesKey = function splitPluginGraphsBySeriesKey (plugin) {
    var seriesKey = _.get(plugin, 'config.split_by', undefined);

    var splitedGraphs = _(plugin.graphs)
      .map(splitGraphBySeriesKey(seriesKey))
      .flattenDeep()
      .value();

    return _(plugin)
      .chain()
      .cloneDeep()
      .tap(p => _.set(p, 'graphs', splitedGraphs))
      .value();
  };

/*
  // seriesFilter :: metricConfObj, metricNameObj, seriesObj -> Bool
  var seriesFilter = _.curry(function seriesFilter (metricConf, metricName, series) {
    var description = (_.isUndefined(series.description) || _.isEmpty(series.description)
        ? 'UNDEFINED'
        : series.description);
    return startsWith(series.measurement, metricConf.plugin) && (startsOrEndsWith(series.measurement, metricName) ||
        testIfRegexp(series.measurement, metricName) || startsOrEndsWith(description, metricName) ||
        testIfRegexp(description, metricName)) && (_.isUndefined(metricConf.regexp) ||
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
*/

  // mergeSeries :: [seriesObj], [delKey] -> mod [seriesObj]
  var mergeSeries = function (series, delKeys) {
    return _.uniqBy(_.map(series, function (s) {
      _.map(delKeys, function (k) {
        if (_.isUndefined(s[k]))
          return s;

        delete(s[k]);
        return s;
      });
      return s;
    }), JSON.stringify);
  };


  // swapSeriesKeysTags :: tagsObj, seriesObj -> new seriesObj
  var swapSeriesKeysTags = _.curry(function swapSeriesKeysTags (tags, series) {
    var invTags = _.invert(tags);
    return _.reduce(series, function (o, v, k) {
        if (_.includes(_.keys(invTags), k)) {
          o[invTags[k]] = v;
        } else {
          o[k] = v;
        }

        return o;
      }, {});
  });


  // swapSeriesTags :: tagsObj, [seriesObj] -> [new seriesObj]
  var swapSeriesTags = _.curry(function swapSeriesTags (tags, series) {
    return _.map(series, swapSeriesKeysTags(tags));
  });

/*
  // addSeriesToMetricGraphs :: [seriesObj], pluginObj -> new pluginObj
  var addSeriesToMetricGraphs = _.curry(function addSeriesToMetricGraphs (series, plugin) {
    // seriesThisFilter :: graphNameStr -> Bool
    var seriesThisFilter = seriesFilter(metricConf);

    //debugger;

    var graphSeries = _.reduce(metricConf.graph, function (newConf, graphConf, graphName) {
      var matchedSeries = _.filter(series, seriesThisFilter(graphName));
      var readySeries = (_.isUndefined(metricConf.merge))
          ? matchedSeries
          : mergeSeries(matchedSeries, metricConf.merge);

      if (_.isEmpty(readySeries))
        return newConf;

      if (_.isArray(graphConf)) {
        newConf.graph[graphName] = _.map(_.range(graphConf.length), function () {
          return {
            series: readySeries
          };
        });
      } else {
        newConf.graph[graphName] = {
          series: readySeries
        };
      }

      return newConf;
    }, { graph: {} });

    return _.merge({}, metricConf, graphSeries);
  });


  // moveUpToMetric :: keyStr, asKeyStr, metricConfObj -> new metricConfObj
  var moveUpToMetric = _.curry(function moveUpToMetric (key, asKey, metricConf) {
    var o = {};
    o[asKey] = _.union(_.flattenDeep(_.map(metricConf.graph, function (graph) {
      var g = (_.isArray(graph))
          ? graph[0]
          : graph;
      return _.map(g.series, key);
    })));

    _.remove(o[asKey], _.isUndefined);

    return _.merge({}, metricConf, o);
  });


  // getMetric :: [seriesObj], pluginObj -> func
  var getMetric = _.curry(function getMetric (series, plugin) {
    // convert series to internal common format
    var internal_series = swapSeriesTags(plugin.config.tags, series);
    // :: metricConfObj, metricNameStr -> metricObj
    return _.flowRight(moveUpToMetric('host', 'hosts'),
                       moveUpToMetric('instance', 'instances'),
                       moveUpToMetric('source', 'sources'),
                       addSeriesToMetricGraphs(internal_series, plugin.config.tags),
                       //addProperty('merge', plugin.config.merge),
                       //addProperty('regexp', plugin.config.regexp),
                       //addProperty('separator', plugin.config.separator),
                       //addProperty('pluginAlias', plugin.config.alias),
                       //addProperty('plugin', plugin.name),
                       initMetric);
  });
*/

  // isDerivative :: Str -> Bool
  var isDerivative = x => _.indexOf(['derivative', 'non_negative_derivative'], x) !== -1;

  // getSelect :: graphObj -> [selectObj]
  var getSelect = function getSelect (graph) {
    // Forms targets select array from 'apply' string.
    // Intended to handle inputs like max, count, derivative, derivative(10s),
    // derivative(last), derivative(max(), 1s), derivative(min(value), 10s).
    var select = [
      {
        type: 'field',
        params: (graph.column)
            ? graph.column.split(',')
            : [ 'value' ]
      }
    ];

    if (graph.apply) {
      var fn = _(graph.apply.split(/[(), ]/))
        .filter()
        .without(graph.column, 'value')
        .value();
      //var fn = _.without(_.filter(graph.apply.split(/[(), ]/)), graph.column, 'value');
      if (isDerivative(fn[0])) {
        if (isNaN(parseInt(fn[1], 10))) {
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

    if (graph.math)
      select.push({
        type: 'math',
        params: [ graph.math ]
      });

   return select;
  };


  // fmtAlias :: aliasStr, serisObj -> new aliasStr
  var fmtAlias = function fmtAlias (alias, series) {
    var matches = {
      '@measurement': series.measurement,
      '@description': series.description,
      '@type': series.type,
      '@instance': series.instance,
      '@host': series.host
    };

    return _.reduce(matches, function (result, val, key) {
        return (val && result.match(key))
            ? result.replace(key, val)
            : result;
      }, alias);
  };


  // isSelectDerivative :: [selectObj] -> Bool
  var isSelectDerivative = select => !_(select)
      .map('type')
      .filter(isDerivative)
      .isEmpty();

/*
  // setupTarget :: panelConfObj, graphConfObj, seriesObj -> targetObj
  var setupTarget = _.curry(function setupTarget (panelConf, graphConf, series) {
    var select = getSelect(graphConf);

    var tagObjs = _.omitBy(series, function (v, n) {
      return _.indexOf([ 'measurement', 'source', 'key' ], n) !== -1;
    });

    // convert series back to external influxdb format
    var readyTags = swapSeriesKeysTags(_.invert(panelConf.tags), tagObjs);

    var tags = _.map(readyTags, function (v, k) {
      return {
        condition: 'AND',
        key: k,
        value: v,
        operator: '='
      };
    });
    delete tags[0].condition;

    var alias = (graphConf.alias && graphConf.alias.match('@'))
        ? fmtAlias(graphConf.alias, series).replace('@', '')
        : (panelConf.metric.pluginAlias || series.type || series.measurement) +
            (series.instance ? '.' + series.instance : '') + '.' +
            (graphConf.alias || series.description || series.measurement || series.type);

    var target = {
      alias: alias,
      color: graphConf.color || genRandomColor(),
      measurement: series.measurement,
      select: [ select ],
      tags: tags,
      interval: (isSelectDerivative(select) ? null : graphConf.interval),
      fill: (isSelectDerivative(select) ? 'none' : 'null')
    };

    if (graphConf.fill)
      target.fill = graphConf.fill;

    return _.merge({}, targetProto, target);
  });
*/

  // setupLineTarget :: tagsObj, lineObj, seriesObj -> targetObj
  var setupLineTarget = _.curry(function setupLineTarget (tags, line, series) {
    var select = getSelect(line);

    var seriesTags = _(series)
        .omitBy((v, k) => _.indexOf([ 'measurement', 'source', 'key' ], k) !== -1)
        .value();

    // convert series back to external influxdb format
    var seriesTagsReady = swapSeriesKeysTags(_.invert(tags), seriesTags);

    var targetTags = _(seriesTagsReady)
        .map((v, k) => ({
            condition: 'AND',
            key: k,
            value: v,
            operator: '='
          }))
        .value();

    // remove 'AND' from the leading conditional
    delete targetTags[0].condition;

    var alias = (line.alias && line.alias.match('@'))
        ? fmtAlias(line.alias, series).replace('@', '')
        : (series.type || series.measurement) +
            (series.instance ? '.' + series.instance : '') + '.' +
            (line.alias || series.description || series.measurement || series.type);

    var target = {
      alias: alias,
      color: line.color || genRandomColor(),
      measurement: series.measurement,
      select: [ select ],
      tags: targetTags,
      interval: (isSelectDerivative(select) ? 'null' : line.interval),
      fill: (isSelectDerivative(select) ? 'none' : 'null')
    };

    if (line.fill)
      target.fill = line.fill;

    //debugger;
    return _.merge({}, targetProto, target);
  });


  // transformObj :: keyKeyStr, valueKeyStr, {}, Obj -> Obj{key: value}
  var transformObj = _.curry(function transformObj (k, v, o, obj) {
    o[obj[k]] = obj[v];
    return o;
  });


  // setupAlias :: targetsObj -> aliasColorsObj
  var setupAlias = transformObj('alias', 'color');


  // initPanel :: pluginConfObj, metricConfObj, datasourceStr, instanceStr, hostnameStr -> panelObj
  var initPanel = _.curry(function initPanel (pluginConf, metricConf, datasource, instance, host) {
    if (_.isUndefined(datasource) || _.isUndefined(metricConf)) {
      return new Error('undefined argument in initPanel function.');
    }
    var panel = {
      datasource: datasource,
      config: {
        instance: instance,
        host: host,
        metric: metricConf,
        tags: pluginConf.tags
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
      grepBy.instance = panel.config.instance;
    }
    if (!_.isUndefined(graphConf.type)) {
      grepBy.type = graphConf.type;
    }
    if (!_.isUndefined(graphConf.description)) {
      grepBy.description = graphConf.description;
    }

    var graphSeries = _.filter(graphConf.series, grepBy);
    if (_.isEmpty(graphSeries))
      return [];

    // setupThisTarget :: graphConfObj -> [targetObj]
    var setupThisTarget = setupTarget(panel.config, graphConf);
    return _.map(graphSeries, setupThisTarget);
  });


  // addTargetsToPanel :: panelObj -> new panelObj
  var addTargetsToPanel = function addTargetsToPanel (panel) {
    if (isError(panel))
      return panel;

    // getTargetsForThisPanel :: graphConfObj -> [targetObj]
    var getTargetsForThisPanel = getTargetsForPanel(panel);
    var targets = _.flattenDeep(_.map(panel.config.metric.graph, function (graphConf) {
      if (_.isArray(graphConf))
        return _.flattenDeep(_.map(graphConf, getTargetsForThisPanel));

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

    // idCounter keeps state of panel ID number
    if (!setupPanel.idCounter)
      setupPanel.idCounter = 1;

    var p = _.merge({}, panelProto, panel, { id: setupPanel.idCounter++ });
    delete p.config;  // no need in config after panel complected.
    return p;
  };


  // getPanel :: metricConfigObj, datasourceStr, instanceStr, hostnameStr -> panelObj
  var getPanel = _.flowRight(setupPanel,
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
    return _.flattenDeep(_.map(plugin.metrics, getPanelsForMetric(plugin.config)));
  };


  // getDatasources :: pluginConfObj, metricConfObj -> [Str]
  var getDatasourcesForPanel = _.curry(function getDatasourcesForPanel (pluginConf, metricConf) {
    return (_.isArray(pluginConf.datasources) && !_.isEmpty(pluginConf.datasources))
        ? pluginConf.datasources
        : metricConf.sources;
  });


  // getInstances :: pluginConfObj, metricConfObj -> [Str]
  var getInstancesForPanel = _.curry(function getInstancesForPanel (pluginConf, metricConf) {
    if (_.has(metricConf.panel, 'multi'))
      return (metricConf.panel.multi)
          ? metricConf.instances
          : [ undefined ];
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

    return _.flattenDeep(_.map(hosts, function (host) {
      return _.map(datasources, function (source) {
        return _.map(instances, function (instance) {
          return getPanel(pluginConf, metricConf, source, instance, host);
        });
      });
    }));
  });


  // setupPlugin :: [seriesObj], pluginObj -> new pluginObj
  var setupPlugin = _.curry(function setupPlugin (series, plugin) {
    plugin.metrics = getMetric(series, plugin);
    return _.merge({}, pluginProto, plugin);
  });


  // getRowsForPlugin :: [seriesObj] -> func
  var getRowsForPlugin = function getRowsForPlugin (series) {
    // curry doesn't work inside compose... probably lodash issue
    // :: pluginConfObj -> rowObj
    return _.flowRight(setupRow,
                       stripErrorsFromPanels,
                       getPanelsForPlugin,
                       setupPlugin(series));
  };


  // getRows :: seriesObj, pluginsObj -> [rowObj]
  var getRows = _.curry(function getRows (plugins, series) {
    return (_.isArray(series) && !_.isEmpty(series))
        ? _.flattenDeep(_.map(plugins, getRowsForPlugin(series)))
        : [];
  });


  // fetchDBData :: [datasourcePointsObj] -> Promise([queryResultObj])
  var fetchDBData = function fetchDBData (dsQueries) {
    var gettingDBData = _.map(dsQueries, x => $.getJSON(x.url));
    return Promise.all(gettingDBData);
  };


  // getQueriesForDDash :: [datasourcesObj], [queriesStr], [hostTagStr] -> [queryObj]
  var getQueriesForDDash = _.curry(function getQueriesForDDash (datasources, queries, hostTags) {
    return _.flattenDeep(_.map(datasources, function (ds) {
      return _.map(queries, function (query) {
        return _.map(hostTags, function (hostTag) {
          return {
            datasource: ds.name,
            url: ds.url + '/query?db=' + ds.database +
                   (ds.username ? '&u=' + ds.username : '') +
                   (ds.password ? '&p=' + ds.password : '') +
                   '&q=' + fixedEncodeURIComponent('SHOW TAG VALUES FROM ' +
                   query + ' WITH KEY = ' + hostTag  + ';')
          };
        });
      });
    }));
  });


  // setupDefaultDashboard :: [seriesObj], dashboardObj -> mod dashboardObj
  var setupDefaultDashboard = function setupDefaultDashboard (hostsAll, dashboard) {
    var hostsLinks = _.reduce(hostsAll, function (string, host) {
      return string + '<div class="filter-div" data-filter="' + host + '"><li><a href="' +
        window.location.href + '?host=' + host +
        '" onclick="window.location.href=this.href;">' +
        host + '</a></li></div>';
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
          'transparent': true,
          'content': '<div class="row-fluid"><div class="span12"><hr style="border:0; height:2px; box-shadow:0 1px 1px -1px #8c8b8b inset;"><a href="https://github.com/anryko/grafana-influx-dashboard"><i>Grafana InfluxDB Scripted Dashboard Documentation</i></a></div></div>'
        }
      ]
    });

    var rowHosts = _.merge({}, rowProto, {
      'title': 'Hosts',
      'panels': [
        {
          'transparent': true,
          'content': '<div class="row-fluid"><div class="span12"><h4>Available Hosts</h4><input type="search" name="filter" id="search" placeholder="Filter..." value="" ondblclick="this.select();"/><ul>' + hostsLinks + '</ul><script type="text/javascript">var divs = $("div[data-filter]"); divs.show(); $("#search").on("keyup", function(e) { var val = $.trim(this.value); divs.hide(); var m = divs.filter(function() {return $(this).data("filter").search(val) >= 0}).get(); if (e.which == 13 && m.length <= 4) {window.location.href = window.location.href + "?host=" + $(m).map(function() {return $(this).text()}).get().join() + "&span=" + 12/m.length; return;} $(m).show();}); divs.on("click", function() {divs.not(this).hide(); var text = $.trim($(this).text()); $("#search").val(text);});</script>'
        }
      ]
    });

    dashboard.title = 'Scripted Dashboard';
    dashboard.editable = false;
    dashboard.hideControls = true;
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


  // parseRefresh :: timeStr -> [timeStr]
  var parseRefresh = function parseRefresh (refresh) {
    var regexpRefresh = /(\d+)(s|m|h|d)/;
    return regexpRefresh.exec(refresh);
  };


  // getDashboardRefresh :: timeStr -> dashboardTimeObj
  var getDashboardRefresh = function getDashboardRefresh (refresh) {
    if (!refresh || !parseRefresh(refresh))
      return '';

    return refresh;
  };

  // getPluginOptFromConf :: optKeyStr, pluginGraphsObj -> [optValueStr]
  var getPluginOptFromConf = _.curry(function getPluginOptFromConf (opt, pluginGraphs) {
    return  _(pluginGraphs)
      .map(x => _.get(x, 'config.' + opt))
      .flattenDeep()
      .without(undefined)
      .value();
  });

  // getGraphOpt :: optKeyStr, [graph] -> [optValueStr]
  var getGraphOpt = _.curry(function getGraphOpt (opt, graph) {
    return _(graph)
      .map(x => _.get(x, opt))
      .flattenDeep()
      .without(undefined)
      .value();
  });

  // getPluginOptFromGraphs :: optKeyStr, pluginGraphsObj -> [optValueStr]
  var getPluginOptFromGraphs = _.curry(function getPluginOptFromGraphs (opt, pluginGraphs) {
    return _(pluginGraphs)
      .map(x => getGraphOpt(opt, x.graph))
      .flattenDeep()
      .value();
  });

  // getPluginOpt :: optKeyStr, pluginObj -> [optValueStr]
  var getPluginOpt = _.curry(function getPluginOpt (opt, plugin) {
    console.log('IN getPluginOpt: ', plugin);
    if (!plugin.graphs)
      return [];

    console.log(getPluginOptFromConf(opt, plugin.graphs));
    console.log(getPluginOptFromGraphs(opt, plugin.graphs));
    return _.union(getPluginOptFromConf(opt, plugin.graphs),
      getPluginOptFromGraphs(opt, plugin.graphs));
  });

  // getPluginsOpt :: optKeyStr, [pluginObj] -> [optValueStr]
  var getPluginsOpt = function getPluginsOpt (opt, plugins) {
    return _(plugins)
      .map(getPluginOpt(opt))
      .flattenDeep()
      .uniq()
      .value();
  };

  // getPluginsMeasurements :: [pluginObj] -> [measurementStr]
  var getPluginsMeasurements = getPluginsOpt('measurement');

  // getPluginsDescriptions :: [pluginObj] -> [descriptionsStr]
  var getPluginsDescriptions = getPluginsOpt('description');

  // getPluginsNames :: [pluginObj] -> [nameStr]
  var getPluginsNames = function (plugins) {
    return _.map(plugins, 'name');
  };

  // getMeasurements :: pluginsObj, displayMetricStr -> [metricStr]
  var getMeasurements = _.curry(function getMeasurements (plugins, displayMetric) {
    var pluginsMeasurements = getPluginsMeasurements(plugins);
    console.log(pluginsMeasurements);

    if (!displayMetric)
      return pluginsMeasurements;

    var displayMetrics = displayMetric.split(',');
    return _.uniq(_.reduce(displayMetrics, function (arr, metric) {
      if (_.indexOf(pluginsMeasurements, metric) !== -1) {
        arr.push(metric);
        return arr;
        // TODO: adjust or remove groups
      } /* else if (metric in plugins.groups) {
        return _.union(arr, plugins.groups[metric]);
      } */
    }, []));
  });


  // getQueryConfigs :: [datasourceObj], [pluginObj] -> [queryConfigObj]
  var getQueryConfigs = _.curry(function getQueryConfigs (datasources, plugins) {
    var qSeparator = '--';
    console.log(getPluginOpt('measurement', plugins[0]));
    console.log('datasources: ', datasources);
    var queryConfigsGrouped = _(plugins)
      .map(p => getPluginOpt('measurement', p)
        .map(m => {
          return {
            measurement: m,
            separator: p.config.separator || ',',
            hostTag: p.config.tags.host,
            datasources: p.config.datasources || _.map(datasources, 'name')
          };
        })
      )
      .flattenDeep()
      .groupBy(q => q.hostTag + qSeparator + q.separator + qSeparator + q.datasources.join(qSeparator))
      .value();
    console.log(queryConfigsGrouped);

/*
    var queryConfigsAll = _.map(plugins, function (plugin) {
      return {
        name: name,
        separator: plugin.config.separator || ',',
        hostTag: plugin.config.tags.host,
        datasources: plugin.config.datasources || _.map(datasources, 'name')
      };
    });

    var qSeparator = '@SEPARATOR@';
    var queryConfigsGrouped = _.groupBy(queryConfigsAll, function (qConf) {
      return qConf.hostTag + qSeparator +
        qConf.separator + qSeparator +
        qConf.datasources;
    });
*/
    return _.map(queryConfigsGrouped, function (qConf, htagSepaDS) {
      var htagSepaDSArr = htagSepaDS.split(qSeparator);
      var hostTag = htagSepaDSArr[0];
      var separator = htagSepaDSArr[1];
      var qDS = qConf[0].datasources;
      return {
        hostTag: (hostTag === 'undefined')
            ? undefined
            : hostTag,
        separator: (separator === 'undefined')
            ? undefined
            : separator,
        regexp: '(' + _.map(qConf, 'measurement').join('|') + ')',
        datasources: _.flattenDeep(_.map(qDS, function (ds) {
            return _.filter(datasources, { name: ds });
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


  // getHostQuery :: hostNameStr, hostTagStr -> hostQueryStr
  var getHostQuery = function getHostQuery (hostName, hostTag) {
    if (!hostName)
      return '';

    var rxPatt = /[^\w\s-,./]/gi;
    if (rxPatt.test(hostName))
      return hostTag + ' =~ /' + hostName + '/';

    if (hostName.indexOf(',') > -1)
      return _.reduce(hostName.split(','), function(result, host) {
          return result + hostTag + ' = \'' + host + '\' ' + 'OR ';
        }, '').slice(0, -4);

    return hostTag + ' = \'' + hostName + '\'';
  };


  // getDSQueryArr :: hostNameStr, [queryConfigObj] -> [urlDatasourceObj]
  var getDSQueryArr = _.curry(function getDSQueryArr (hostName, queryConfigs) {
    return _.flattenDeep(_.map(queryConfigs, function (qConf) {
      return _.map(qConf.datasources, function (ds) {
        return {
          datasource: ds.name,
          url: ds.url + '/query?db=' + ds.database +
              (ds.username ? '&u=' + ds.username : '') +
              (ds.password ? '&p=' + ds.password : '') +
              '&q=' + fixedEncodeURIComponent('SHOW SERIES FROM /' + qConf.regexp + '.*/' +
              (hostName ? ' WHERE ' + getHostQuery(hostName, qConf.hostTag) + ';' : ';'))
        };
      });
    }));
  });

/*
  // stripPlugins :: pluginsObj, [metricsStr] -> new pluginsObj
  var stripPlugins = _.curry(function stripPlugins (plugins, metrics) {
    var newPlugins = _.merge({}, plugins);

    // have to use this ugly thing because reduce will strip unenumerable 'config'
    _.each(_.keys(plugins), function (pluginName) {
      if (!_.includes(metrics, pluginName)) {
        delete newPlugins[pluginName];
      }
    });
    return newPlugins;
  });
*/

  // setPluginsInstance :: [pluginObj], instanceStr -> [pluginObj]
  var setPluginsInstance = function setPluginsInstance (plugins, instance) {
    if (!instance)
      return plugins;

    var rxPatt = /[^\w\s-,./]/gi;
    var rxInstance;
    if (rxPatt.test(instance)) {
      rxInstance = new RegExp(instance);
    } else if (instance.indexOf(',') > -1) {
      rxInstance = new RegExp(_.map(instance.split(','), function (s) {
        return '^' + s + '$';
      }).join('|'));
    } else {
      rxInstance =  new RegExp('^' + instance + '$');
    }

    return _.map(plugins, function (p) {
      if (p.config.multi)
        p.config.regexp = rxInstance;
      return p;
    });
  };


  // getQueries :: hostNameStr, datasourcesObj, [pluginObj] -> [queryStr]
  var getQueries = function getQueries (hostName, datasources, plugins) {
    return _.flowRight(getDSQueryArr(hostName), getQueryConfigs(datasources))(plugins);
  };


  // splitKey :: keyStr -> [keyPartStr]
  var splitKey = function splitKey (key) {
    return ('measurement=' + key).split(',');
  };


  // objectKey :: [keyPartStr] -> keyObj
  var objectKey = function objectKey (keys) {
    return _.reduce(keys, function(result, expr) {
      var vars = expr.split('=');
      result[vars[0]] = vars[1];
      return result;
    }, {});
  };


  // convertKey :: keyStr -> keyObj
  var convertKey = _.flowRight(objectKey, splitKey);


  // setupSeries :: seriesObj -> new seriesObj
  var setupSeries = function (series) {
    return _.merge({}, seriesProto, series);
  };


  // getSeries :: keyStr -> seriesObj
  var getSeries = _.flowRight(setupSeries, convertKey);


  // pickPlugins :: pluginObj, metricsStr -> new pluginsObj
  var pickPlugins = function pickPlugins (plugins, metrics) {
    return _.flowRight(stripPlugins(plugins), getMeasurements(plugins))(metrics);
  };


  // parseResp :: [jsonObj] -> [Str]
  var parseResp = function parseResp (resp) {
    return _.map(resp, function (res) {
      var series = res.results[0].series;
      if (_.isUndefined(series))
        return;

      return _.map(series, 'values');
    });
  };


  // genSeries :: dashConfObj, seriesRespObj, [datasourceObj] -> [seriesObj]
  var genSeries = function genSeries (dashConf, seriesResp, datasources) {
    var keys = _.map(seriesResp, function (val) {
      if (_.isUndefined(val))
        return;

      return _.flattenDeep(_.map(val, function (v) {
        return _.map(v, _.first);
      }));
    });

    var dsKeys = _.zip(datasources, keys);

    return  _.flattenDeep(_.map(dsKeys, function (dsKey) {
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


  // setupPanelLegend :: legendStr -> new legendObj
  var setupPanelLegend = function setupPanelLegend (legend) {
    if (!legend)
      return _.merge({}, panelProto.legend);

    if (legend === 'false')
      return { 'show': false };

    var legendOrig = _.merge({}, panelProto.legend);
    return _.reduce(legend.split(','), function (result, opt) {
      return (_.has(panelProto.legend, opt))
          ? _.set(result, opt, true)
          : result;
    }, legendOrig);
  };

  var pluginConfProto = {};

  function Plugin (name, config, graphs) {
    this.name = name || 'default';
    this.config = _.merge({}, pluginConfProto, config || {});
    this.graphs = _.map(graphs || [], _.cloneDeep);
  }

  // fetchPluginsConf :: confPathStr => Promise([pluginConfObj])
  var fetchPluginsConf = function fetchPluginsConf (confPath) {
    return $.get(confPath + '/main.yml')
      .then(function (mainConfYaml) {
        var mainConf = jsyaml.safeLoad(mainConfYaml);

        // setup plugin confiiguration prototype
        pluginConfProto = _.merge({}, mainConf.plugins.config);

        console.log('fetchPluginsConf: ', mainConf);
        console.log('fetchPluginsConf: ', pluginConfProto);
        console.log('fetchPluginsConf: ', datasources);
        var yamlConfigsToLoad = _.map(mainConf.plugins.enabled, x => confPath + '/' + x + '.yml');
        var gettingConfigs = _.map(yamlConfigsToLoad, x => $.get(x));

        return Promise.all(gettingConfigs);
      })
      .then(pluginsYaml => _.flattenDeep(_.map(pluginsYaml, x => jsyaml.safeLoad(x))))
      .then(pluginsJson => _.map(pluginsJson, x => new Plugin(x.name, x.config, x.graphs)));
  };


  // getHostsFromDBResp :: resp -> [hostStr]
  var getHostsFromDBResp = function (resp) {
    return _(resp)
      .compact()
      .flattenDeep()
      .uniq()
      .without(dashConf.defaultHostTags)
      .value();
  };


  // getDashboard :: [datasources], dashConfObj,
  //                 grafanaCallbackFunc -> grafanaCallbackFunc(dashboardObj)
  var getDashboard = _.curry(function getDashboard (datasources, dashConf, callback) {
    var dashboard = _.merge({}, dashboardProto, {
      title: dashConf.title,
      time: getDashboardTime(dashConf.time),
      refresh: getDashboardRefresh(dashConf.refresh)
    });

    console.log('main ds: ', datasources);

    if (!dashConf.host && !dashConf.metric) {
      var queriesForDDash = getQueriesForDDash(datasources, dashConf.defaultQueries, dashConf.defaultHostTags);

      fetchDBData(queriesForDDash)
        .then(function (resp) {
          var hosts = getHostsFromDBResp(parseResp(resp));
          return callback(setupDefaultDashboard(hosts, dashboard));
        });
      return;
    }

    fetchPluginsConf('public/app/getdash/getdash.conf.d')
      .then(function (plugins) {
        console.log(plugins);
        //debugger;
        //var dashPlugins = pickPlugins(plugins, dashConf.metric);
        var dashPlugins = plugins;
        console.log(dashPlugins);
        //dashPlugins = setPluginsInstance(dashPlugins, dashConf.instance);
        console.log(dashPlugins);
        console.log('fetchPluginsConf ds: ', datasources);

        var dashQueries = getQueries(dashConf.host, datasources, dashPlugins);
        console.log(dashQueries);
        //var datasources = _.map(dashQueries, 'datasource');

        fetchDBData(dashQueries)
          .then(function (resp) {
            var seriesResp = parseResp(resp);
            var series = genSeries(dashConf, seriesResp, datasources);
            console.log('series: ', series);

            // Object prototypes setup
            panelProto.span = dashConf.span;
            panelProto.legend = setupPanelLegend(dashConf.legend);

            dashboard.rows = getRows(dashPlugins, series);
            return callback(dashboard);
          });
      });
  });


  // TESTS
  // runTests :: -> undefined
  var runTests = function runTests () {
    var assertEqual = (i, o, msg) => console.assert(_.isEqual(i, o), msg);

    // TEST :: stripLineSeriesByValue
    assertEqual(
      stripLineSeriesByValue(
        'instance',
        'sda1',
        {
          measurement: 'disk',
          instance: '/\\d$/',
          series: [
            { measurement: 'disk', instance: 'sda1', type: 'io' },
            { measurement: 'disk', instance: 'sdb1', type: 'io' },
            { measurement: 'disk', instance: 'sdb2', type: 'io' }
          ]
        }
      ),
      {
        measurement: 'disk',
        instance: '/\\d$/',
        series: [
          { measurement: 'disk', instance: 'sda1', type: 'io' }
        ]
      },
      "[1] stripLineSeriesByValue is broken."
    );

    // TEST :: stripLinesSeriesByValue
    assertEqual(
      stripLinesSeriesByValue(
        'instance',
        'sdc1',
        [
          {
            measurement: 'disk',
            instance: '/\\d$/',
            series: [
              { measurement: 'disk', instance: 'sda1', type: 'io' },
              { measurement: 'disk', instance: 'sdb2', type: 'io' }
            ]
          },
          {
            measurement: 'disk_read',
            type: 'bytes',
            series: [
              { measurement: 'disk_read', instance: 'sda1', type: 'bytes' },
              { measurement: 'disk_read', instance: 'sdc1', type: 'bytes' }
            ]
          }
        ]
      ),
      [
        {
          measurement: 'disk_read',
          type: 'bytes',
          series: [
            { measurement: 'disk_read', instance: 'sdc1', type: 'bytes' }
          ]
        }
      ],
      "[1] stripLinesSeriesByValue is broken."
    );

    // TEST :: stripGraphSeriesByValue
    assertEqual(
      stripGraphSeriesByValue(
        {
          title: 'Disk',
          config: {
            measurement: 'disk',
            split_by: 'instance'
          },
          panel: {},
          graph: [
              {
                measurement: 'disk',
                instance: '/\\d$/',
                series: [
                  { measurement: 'disk', instance: 'sda1', type: 'io' },
                  { measurement: 'disk', instance: 'sdb2', type: 'io' }
                ]
              },
              {
                measurement: 'disk_read',
                type: 'bytes',
                series: [
                  { measurement: 'disk_read', instance: 'sda1', type: 'bytes' },
                  { measurement: 'disk_read', instance: 'sdc1', type: 'bytes' }
                ]
              }
            ]
        },
        'instance',
        'sdc1'
      ),
      {
        title: 'Disk',
        config: {
          measurement: 'disk',
          split_by: 'instance'
        },
        panel: {},
        graph: [
          {
            measurement: 'disk_read',
            type: 'bytes',
            series: [
              { measurement: 'disk_read', instance: 'sdc1', type: 'bytes' }
            ]
          }
        ]
      },
      "[1] stripGraphSeriesByValue is broken."
    );

    // TEST :: splitGraphBySeriesKey
    assertEqual(
      splitGraphBySeriesKey(
        'instance',
        {
          title: 'Disk',
          config: {
            measurement: 'disk',
            split_by: 'instance'
          },
          panel: {},
          graph: [
            {
              measurement: 'disk',
              instance: '/\\d$/',
              series: [
                { measurement: 'disk', instance: 'sda1', type: 'io' },
                { measurement: 'disk', instance: 'sdb2', type: 'io' }
              ]
            },
            {
              measurement: 'disk_read',
              type: 'bytes',
              series: [
                { measurement: 'disk_read', instance: 'sda1', type: 'bytes' },
                { measurement: 'disk_read', instance: 'sdc1', type: 'bytes' }
              ]
            }
          ]
        }
      ),
      [
        {
          title: 'Disk',
          config: {
            measurement: 'disk',
            split_by: 'instance'
          },
          panel: {},
          graph: [
            {
              measurement: 'disk',
              instance: '/\\d$/',
              series: [{ measurement: 'disk', instance: 'sda1', type: 'io' }]
            },
            {
              measurement: 'disk_read',
              type: 'bytes',
              series: [{ measurement: 'disk_read', instance: 'sda1', type: 'bytes' }]
            }
          ]
        },
        {
          title: 'Disk',
          config: {
            measurement: 'disk',
            split_by: 'instance'
          },
          panel: {},
          graph: [
            {
              measurement: 'disk',
              instance: '/\\d$/',
              series: [{ measurement: 'disk', instance: 'sdb2', type: 'io' }]
            }
          ]
        },
        {
          title: 'Disk',
          config: {
            measurement: 'disk',
            split_by: 'instance'
          },
          panel: {},
          graph: [
            {
              measurement: 'disk_read',
              type: 'bytes',
              series: [{ measurement: 'disk_read', instance: 'sdc1', type: 'bytes' }]
            }
          ]
        }
      ],
      "[1] splitGraphBySeriesKey is broken."
    );

 
    // TEST :: splitPluginGraphsBySeriesKey
    assertEqual(
      splitPluginGraphsBySeriesKey(
        {
          name: 'disk',
          config: { alias: 'd' },
          graphs: [
            {
              title: 'Disk',
              config: {
                measurement: 'disk',
                split_by: 'instance'
              },
              panel: {},
              graph: [
                {
                  measurement: 'disk',
                  instance: '/\\d$/',
                  series: [
                    { measurement: 'disk', instance: 'sda1', type: 'io' },
                    { measurement: 'disk', instance: 'sdb2', type: 'io' }
                  ]
                },
                {
                  measurement: 'disk_read',
                  type: 'bytes',
                  series: [
                    { measurement: 'disk_read', instance: 'sda1', type: 'bytes' },
                    { measurement: 'disk_read', instance: 'sdc1', type: 'bytes' }
                  ]
                }
              ]
            }
          ]
        }
      ),
      {
        name: 'disk',
        config: { alias: 'd' },
        graphs: [
          {
            title: 'Disk',
            config: {
              measurement: 'disk',
              split_by: 'instance'
            },
            panel: {},
            graph: [
              {
                measurement: 'disk',
                instance: '/\\d$/',
                series: [{ measurement: 'disk', instance: 'sda1', type: 'io' }]
              },
              {
                measurement: 'disk_read',
                type: 'bytes',
                series: [{ measurement: 'disk_read', instance: 'sda1', type: 'bytes' }]
              }
            ]
          },
          {
            title: 'Disk',
            config: {
              measurement: 'disk',
              split_by: 'instance'
            },
            panel: {},
            graph: [
              {
                measurement: 'disk',
                instance: '/\\d$/',
                series: [{ measurement: 'disk', instance: 'sdb2', type: 'io' }]
              }
            ]
          },
          {
            title: 'Disk',
            config: {
              measurement: 'disk',
              split_by: 'instance'
            },
            panel: {},
            graph: [
              {
                measurement: 'disk_read',
                type: 'bytes',
                series: [{ measurement: 'disk_read', instance: 'sdc1', type: 'bytes' }]
              }
            ]
          }
        ]
      },
      "[1] splitPluginGraphsBySeriesKey is broken."
    );

    // TEST :: getGraphSeriesValueByKey
    assertEqual(
      getGraphSeriesValuesByKey(
        'instance',
        [
          {
            measurement: 'disk',
            instance: '/\\d$/',
            series: [
              { measurement: 'disk', instance: 'sda1', type: 'io' },
              { measurement: 'disk', instance: 'sdb1', type: 'io' },
              { measurement: 'disk', instance: 'sdb2', type: 'io' }
            ]
          },
          {
            measurement: 'disk_read',
            type: 'bytes',
            series: [
              { measurement: 'disk_read', instance: 'sda1', type: 'bytes' },
              { measurement: 'disk_read', instance: 'sdb1', type: 'bytes' },
              { measurement: 'disk_read', instance: 'sdc1', type: 'bytes' }
            ]
          }
        ]
      ),
      ['sda1', 'sdb1', 'sdb2', 'sdc1'],
      "[1] getGraphSeriesValuesByKey is broken."
    );

    // TEST :: matchLineSeries
    assertEqual(
      matchLineSeries(
        { measurement: 'disk_read', instance: '/\\d$/', color: '#AAA' },
        { measurement: 'disk', instance: 'sda1' },
        'instance'
      ),
      true,
      "[1] matchLineSeries is broken."
    );
    assertEqual(
      matchLineSeries(
        { measurement: 'disk_read', instance: '/\\d$/', color: '#AAA' },
        { measurement: 'disk', instance: 'sda1' },
        'measurement'
      ),
      false,
      "[2] matchLineSeries is broken."
    );
    assertEqual(
      matchLineSeries(
        { measurement: 'disk_read', instance: '/\\d$/', color: '#AAA' },
        { measurement: 'disk', instance: 'sda1' },
        'type'
      ),
      true,
      "[3] matchLineSeries is broken."
    );

    // TEST :: lineSeriesFilter
    assertEqual(
      lineSeriesFilter(
        { description: 'type_instance', instance: 'instance', type: 'type' },
        { description: 'read', instance: '/\\d$/', color: '#AAA' },
        { description: 'read', instance: 'sda1' }
      ),
      true,
      "[1] lineSeriesFilter broken."
    );
    assertEqual(
      lineSeriesFilter(
        { description: 'type_instance', instance: 'instance', type: 'type' },
        { description: 'read', instance: '/\d$/', color: '#AAA' },
        { description: 'write', instance: 'sda1' }
      ),
      false,
      "[2] lineSeriesFilter is broken."
    );

    // TEST :: setLineSeries
    assertEqual(
      setLineSeries(
        { measurement: 'measurement', instance: 'instance', type: 'type' },
        { measurement: 'disk', instance: '/\\d$/', color: '#AAA' },
        [
          { measurement: 'disk', instance: 'sda1', type: 'io' },
          { measurement: 'disk_read', instance: 'sda1', type: 'bytes' },
          { measurement: 'disk', instance: 'sda', type: 'io' }
        ]
      ),
      {
        measurement: 'disk', instance: '/\\d$/', color: '#AAA',
        series: [{ measurement: 'disk', instance: 'sda1', type: 'io' }]
      },
      "[1] setLineSeries is broken."
    );

    // TEST :: setGraphSeries
    assertEqual(
      setGraphSeries(
        { measurement: 'measurement', instance: 'instance', type: 'type' },
        [
          { measurement: 'disk', instance: '/\\d$/' },
          { measurement: 'disk_read', type: 'bytes' },
          { measurement: 'disk', instance: 'sda' }
        ],
        [
          { measurement: 'disk', instance: 'sda1', type: 'io' },
          { measurement: 'disk_read', instance: 'sda1', type: 'bytes' },
          { measurement: 'disk', instance: 'sda', type: 'io' }
        ]
      ),
      [
        { measurement: 'disk', instance: '/\\d$/', series: [{ measurement: 'disk', instance: 'sda1', type: 'io' }] },
        { measurement: 'disk_read', type: 'bytes', series: [{ measurement: 'disk_read', instance: 'sda1', type: 'bytes' }] },
        { measurement: 'disk', instance: 'sda', series: [{ measurement: 'disk', instance: 'sda', type: 'io' }] }
      ],
      "[1] setGraphSeries is broken."
    );

    // TEST :: setGraphsSeries
    assertEqual(
      setGraphsSeries(
        { measurement: 'measurement', instance: 'instance', type: 'type' },
        [
          [
            { measurement: 'disk', instance: '/\\d$/' },
            { measurement: 'disk_read', type: 'bytes' },
            { measurement: 'disk', instance: 'sda' }
          ],
          [
            { measurement: 'disk', instance: '/\\d$/' },
            { measurement: 'disk_read', type: 'bytes' },
            { measurement: 'disk', instance: 'sda' }
          ],
        ],
        [
          { measurement: 'disk', instance: 'sda1', type: 'io' },
          { measurement: 'disk_read', instance: 'sda1', type: 'bytes' },
          { measurement: 'disk', instance: 'sda', type: 'io' }
        ]
      ),
      [
        [
          {
            measurement: 'disk',
            instance: '/\\d$/',
            series: [{ measurement: 'disk', instance: 'sda1', type: 'io' }]
          },
          {
            measurement: 'disk_read',
            type: 'bytes',
            series: [{ measurement: 'disk_read', instance: 'sda1', type: 'bytes' }]
          },
          {
            measurement: 'disk',
            instance: 'sda',
            series: [{ measurement: 'disk', instance: 'sda', type: 'io' }]
          }
        ],
        [
          {
            measurement: 'disk',
            instance: '/\\d$/',
            series: [{ measurement: 'disk', instance: 'sda1', type: 'io' }]
          },
          {
            measurement: 'disk_read',
            type: 'bytes',
            series: [{ measurement: 'disk_read', instance: 'sda1', type: 'bytes' }]
          },
          {
            measurement: 'disk',
            instance: 'sda',
            series: [{ measurement: 'disk', instance: 'sda', type: 'io' }]
          }
        ],
      ],
      "[1] setGraphsSeries is broken."
    );

    // TEST :: setPluginSeries
    assertEqual(
      setPluginSeries(
        { measurement: 'measurement' },
        {
          name: 'disk',
          config: {
            tags: {
              instance: 'instance',
              type: 'type'
            }
          },
          graphs: [
            [
              { measurement: 'disk', instance: '/\\d$/' },
              { measurement: 'disk_read', type: 'bytes' },
              { measurement: 'disk', instance: 'sda' }
            ],
            [
              { measurement: 'disk', instance: '/\\d$/' },
              { measurement: 'disk_read', type: 'bytes' },
              { measurement: 'disk', instance: 'sda' }
            ],
          ]
        },
        [
          { measurement: 'disk', instance: 'sda1', type: 'io' },
          { measurement: 'disk_read', instance: 'sda1', type: 'bytes' },
          { measurement: 'disk', instance: 'sda', type: 'io' }
        ]
      ),
      {
        name: 'disk',
        config: {
          tags: {
            measurement: 'measurement',
            instance: 'instance',
            type: 'type'
          }
        },
        graphs: [
          [
            {
              measurement: 'disk',
              instance: '/\\d$/',
              series: [{ measurement: 'disk', instance: 'sda1', type: 'io' }]
            },
            {
              measurement: 'disk_read',
              type: 'bytes',
              series: [{ measurement: 'disk_read', instance: 'sda1', type: 'bytes' }]
            },
            {
              measurement: 'disk',
              instance: 'sda',
              series: [{ measurement: 'disk', instance: 'sda', type: 'io' }]
            }
          ],
          [
            {
              measurement: 'disk',
              instance: '/\\d$/',
              series: [{ measurement: 'disk', instance: 'sda1', type: 'io' }]
            },
            {
              measurement: 'disk_read',
              type: 'bytes',
              series: [{ measurement: 'disk_read', instance: 'sda1', type: 'bytes' }]
            },
            {
              measurement: 'disk',
              instance: 'sda',
              series: [{ measurement: 'disk', instance: 'sda', type: 'io' }]
            }
          ]
        ]
      },
      "[1] setPluginSeries is broken."
    );

    // TEST :: mergeSeries
    assertEqual(
      mergeSeries([{
          source: 'ops',
          name: 'cpu_value',
          instance: '0',
          interval: '1m',
          host: 'vagrant-ubuntu-trusty-64',
          type: 'cpu',
          type_instance: 'system'
        }, {
          source: 'ops',
          name: 'cpu_value',
          instance: '1',
          interval: '1m',
          host: 'vagrant-ubuntu-trusty-64',
          type: 'cpu',
          type_instance: 'system'
        }
      ], [ 'instance', 'type' ]),
      [
        {
          source: 'ops',
          name: 'cpu_value',
          interval: '1m',
          host: 'vagrant-ubuntu-trusty-64',
          type_instance: 'system'
        }
      ],
      "[1] mergeSeries is broken."
    );

    // TEST :: swapSeriesKeysTags
    assertEqual(
      swapSeriesKeysTags({
        host: 'host_name',
        description: 'type_instance',
        type: 'event_type'
      }, {
        source: 'ops',
        host_name: 'vagrant-ubuntu-trusty-64',
        event_type: 'cpu',
        type_instance: 'system'
      }),
      {
        source: 'ops',
        host: 'vagrant-ubuntu-trusty-64',
        type: 'cpu',
        description: 'system'
      },
      "[1] swapSeriesKeysTags is broken."
    );

    // TEST :: splitKey
    assertEqual(
      splitKey("load_longterm,host=vagrant,type=load"),
      [ "measurement=load_longterm", "host=vagrant", "type=load" ],
      "[1] splitKey is broken."
    );

    // TEST :: objectKey
    assertEqual(
      objectKey([ "measurement=load_longterm", "host=vagrant", "type=load" ]),
      { host: "vagrant", measurement: "load_longterm", type: "load" },
      "[1] objectKey is broken."
    );

    // TEST :: convertKey
    assertEqual(
      convertKey("load_longterm,host=vagrant,type=load"),
      { host: "vagrant", measurement: "load_longterm", type: "load" },
      "[1] convertKey is broken."
    );

    // TEST :: setupLineTarget :: tagsObj, lineObj, seriesObj -> targetObj
    assertEqual(
      setupLineTarget(
        { measurement: 'measurement', instance: 'instance', type: 'type' },
        { measurement: 'disk', instance: '/\\d$/', color: '#AAA', alias: '@instance', apply: 'derivative' },
        { measurement: 'disk', instance: 'sda1', type: 'io' }
      ),
      _.merge({}, targetProto, {
          alias: 'sda1',
          color: '#AAA',
          measurement: 'disk',
          select: [
            [
              { params: [ 'value' ], type: 'field' },
              { params: [], type: 'mean' },
              { params: [ '1s' ], type: 'derivative' }
            ]
          ],
          tags: [
            { key: 'instance', operator: '=', value: 'sda1' },
            { condition: 'AND', key: 'type', operator: '=', value: 'io' }
          ],
          interval: 'null',
          fill: 'none'
        }),
      "[1] setupLineTarget is broken."
    );
  };

  if (TEST)
    runTests();

  return {
    // get :: dashConfObj, grafanaCallbackFunc -> grafanaCallbackFunc(dashboardObj)
    get: getDashboard(datasources)
  };
};
