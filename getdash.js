/* global _ */

/*
 * Complex scripted dashboard
 * This script generates a dashboard object that Grafana can load. It also takes a number of user
 * supplied URL parameters (int ARGS variable)
 *
 * Return a dashboard object, or a function
 *
 * For async scripts, return a function, this function must take a single callback function as argument,
 * call this callback function with the dashboard object (look at scripted_async.js for an example)
 */


// accessable variables in this scope
var window, document, ARGS, $, jQuery, moment, kbn;

// Setup some variables
var dashboard;

// All url parameters are available via the ARGS object
var ARGS;

// Intialize a skeleton with nothing but a rows array and service object
dashboard = {
  rows : [],
};


// Set default time
// time can be overriden in the url using from/to parameteres, but this is
// handled automatically in grafana core during dashboard initialization
dashboard.time = {
  from: "now-6h",
  to: "now"
};

// InfluxDB setup
var influxUser = 'root';
var influxPass = 'root';
var influxDB = 'graphite';

if(!_.isUndefined(ARGS.host)) {
  var host = ARGS.host;
}

// Set a title
dashboard.title = 'Scripted Dashboard for ' + host;


// function to get series from influxdb
var getHostSeries = function (host) {
  var query_url = window.location.protocol + '//'+ window.location.host +
                   ':8086/db/' + influxDB + '/series?u=' + influxUser + '&p=' + influxPass +
                   '&q=list series /\.' + host + '\./';
  var res = [];
  var req = new XMLHttpRequest();
  req.open('GET', query_url, false);
  req.send();
  var obj = JSON.parse(req.responseText)[0].points;
  obj.forEach(function (a) {
    res.push(a[1]);
  });
  return res;
};


// function to generate target object
var targetGen = function (series, alias, interval, column, apply) {
  return {
    'series': series,
    'alias': alias,
    'column': (column === undefined) ? 'value' : column,
    'interval': (interval === undefined) ? '1m' : interval,
    'function': (apply === undefined) ? 'mean' : apply,
  };
};


var targetsGen = function (series, span, interval, grapghConf) {
  var targets = [];
  var aliasColors = {};
  for (var match in grapghConf) {
    for (var i = 0; i < series.length; i++) {
      var s = series[i];
      if (s.lastIndexOf(match) === s.length - match.length) {
        var alias = s.split('.')[2] + '.' + match;
        var column = grapghConf[match].column;
        var apply = grapghConf[match].apply;
        targets.push(targetGen(s, alias, interval, column, apply));
        aliasColors[alias] = grapghConf[match].color;
      }
    }
  }
  return {
    'targets': targets,
    'aliasColors': aliasColors,
  };
};


var panelFactory = function (gConf) {
  return function (series, span, interval) {
    span = (span === undefined) ? 12 : span;
    interval = (interval === undefined) ? '1m' : interval;
    var result = {};
    var graph = gConf.graph;
    var targets = targetsGen(series, span, interval, graph);
    var panel = {
      'title': 'Default Title',
      'type': 'graphite',
      'span': span,
      'y_formats': [ 'none' ],
      'grid': { 'max': null, 'min': null },
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


var gCpu = {
  'graph': {
    'system': { 'color': '#EAB839' },
    'user': { 'color': '#508642' },
    'idle': { 'color': '#303030' },
    'wait': { 'color': '#890F02' },
    'steal': { 'color': '#E24D42'},
    'nice': { 'color': '#9400D3' },
    'softirq': {'color': '#E9967A' },
    'interrupt': { 'color': '#1E90FF' },
  },
  'panel': {
    'title': 'CPU',
    'y_formats': [ 'percent' ],
    'grid': { 'max': null, 'min': 0 },
    'lines': false,
    'bars': true,
    'stack': true,
    'legend': { 'show': true },
    'percentage': true,
  },
};


var gMemory = {
  'graph': {
    'used': { 'color': '#1F78C1' },
    'cached': { 'color': '#EF843C' },
    'buffered': { 'color': '#CCA300' },
    'free': { 'color': '#629E51' },
  },
  'panel': {
    'title': 'Memory',
    'y_formats': [ 'bytes' ],
    'grid': { 'max': null, 'min': 0 },
    'stack': true,
  },
};


var gLoad = {
  'graph': {
    'midterm': { 'color': '#7B68EE' },
  },
  'panel': {
    'title': 'Load Average',
    'grid': { 'max': null, 'min': 0 },
  },
};


var gSwap = {
  'graph': {
    'used': { 'color': '#1F78C1' },
    'cached': { 'color': '#EAB839' },
    'free': { 'color': '#508642' },
  },
  'panel': {
    'title': 'Swap',
    'y_formats': [ 'bytes' ],
    'grid': { 'max': null, 'min': 0, 'leftMin': 0 },
    'stack': true,
  },
};


var gNetworkTraffic = {
  'graph': {
    'if_octets.rx': { 'color': '#447EBC' },
    'if_octets.tx': { 'color': '#508642', 'column': 'value*-1' },
  },
  'panel': {
    'title': 'Network Traffic on @metric',
    'y_formats': [ 'bytes' ],
  },
};


var gNetworkPackets = {
  'graph': {
    'if_packets.rx': { 'color': '#447EBC' },
    'if_packets.tx': { 'color': '#508642', 'column': 'value*-1' },
  },
  'panel': {
    'title': 'Network Packets on @metric',
  },
};


var gDiskDf = {
  'graph': {
    'df_complex-used': { 'color': '#447EBC' },
    'df_complex-reserved': { 'color': '#EAB839' },
    'df_complex-free': { 'color': '#508642' },
  },
  'panel': {
    'title': 'Disk space for @metric',
    'y_formats': [ 'bytes' ],
    'grid': { 'max': null, 'min': 0, 'leftMin': 0 },
    'stack': true,
  },
};


var gDiskIO = {
  'graph': {
    'disk_ops.write': { 'color': '#447EBC' },
    'disk_ops.read': { 'color': '#508642', 'column': 'value*-1' },
  },
  'panel': {
    'title': 'Disk IO for @metric',
  },
};


var gPsState = {
  'graph': {
    'sleeping': { 'color': '#EAB839', 'apply': 'max' },
    'running': { 'color': '#508642', 'apply': 'max' },
    'stopped': { 'color': '#E9967A', 'apply': 'max' },
    'blocked': { 'color': '#890F02', 'apply': 'max' },
    'zombies': { 'color': '#E24D42', 'apply': 'max' },
    'paging': { 'color': '#9400D3', 'apply': 'max' },
  },
  'panel': {
    'title': 'Processes State',
    'y_formats': [ 'short' ],
    'grid': { 'max': null, 'min': 0 },
  },
};


var gPsForks = {
  'graph': {
    'fork_rate': { 'color': '#81BEF7', 'apply': 'max' },
  },
  'panel': {
    'title': 'Processes Fork Rate',
    'y_formats': [ 'short' ],
    'grid': { 'max': null, 'min': 0 },
  },
};


var setupRow = function (title, panels) {
  return {
    'title': title,
    'height': '250px',
    'panels': panels,
  };
};


var supportedDashs = {
  'cpu': {
    'func': [ panelFactory(gCpu) ],
  },
  'load': {
    'func': [ panelFactory(gLoad) ],
  },
  'memory': {
    'func': [ panelFactory(gMemory) ],
  },
  'swap': {
    'func': [ panelFactory(gSwap) ],
  },
  'interface': {
    'func': [ panelFactory(gNetworkTraffic), panelFactory(gNetworkPackets) ],
    'multi': true,
  },
  'df': {
    'func': [ panelFactory(gDiskDf) ],
    'multi': true,
  },
  'disk': {
    'func': [ panelFactory(gDiskIO) ],
    'multi': true,
    'regexp': /\d$/
  },
  'processes': {
    'func': [ panelFactory(gPsState), panelFactory(gPsForks) ],
  },
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

var pfx = 'collectd.' + host;
var postfix = '';
var hostSeries = getHostSeries(host);

// Skip empty Dashboard setup if there are no series.
if (hostSeries.length === 0) {
  return dashboard;
}

for (var metric in supportedDashs) {
  var matchedSeries = [];
  var pfxMetric = pfx + '.' + metric;
  for (var i = 0; i < hostSeries.length; i++) {
    if ((hostSeries[i].indexOf(pfxMetric) === 0) &&
        (!('regexp' in supportedDashs[metric]) ||
         ('regexp' in supportedDashs[metric] &&
          supportedDashs[metric].regexp.test(hostSeries[i].split('.')[2])))) {
      matchedSeries.push(hostSeries[i]);
    }
  }
  if (matchedSeries.length === 0) {
    continue;
  }
  if (supportedDashs[metric].multi) {
    metricsExt = getExtendedMetrics(matchedSeries, pfx + '.');
    if (metricsExt.length > 1) {
      for (var k = 0; k < metricsExt.length; k++) {
        var metricExt = metricsExt[k];
        var rematchedSeries = [];
        var repfxMetric = pfx + '.' + metricExt + '.';
        for (var i = 0; i < matchedSeries.length; i++) {
          if (matchedSeries[i].indexOf(repfxMetric) === 0) {
            rematchedSeries.push(matchedSeries[i]);
          }
        }
        for (var j = 0; j < supportedDashs[metric].func.length; j++) {
          metricFunc = supportedDashs[metric].func[j];
          dashboard.rows.push(setupRow(metricExt.toUpperCase, [metricFunc(rematchedSeries, 12, '1m')]));
        }
      }
     continue; 
    }
  }
  for (var j = 0; j < supportedDashs[metric].func.length; j++) {
    metricFunc = supportedDashs[metric].func[j];
    dashboard.rows.push(setupRow(metric.toUpperCase, [metricFunc(matchedSeries, 12, '1m')]));
  }
}


return dashboard;
