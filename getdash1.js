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

// Set a title
dashboard.title = 'Scripted Dashboard';

// Set default time
// time can be overriden in the url using from/to parameteres, but this is
// handled automatically in grafana core during dashboard initialization
dashboard.time = {
  from: "now-6h",
  to: "now"
};

var rows = 1;
var prefix = 'collectd.';
var influxUser = 'root';
var influxPass = 'root';
var influxDB = 'graphite';

if(!_.isUndefined(ARGS.rows)) {
  rows = parseInt(ARGS.rows, 10);
}

if(!_.isUndefined(ARGS.host)) {
  var host = ARGS.host;
}

if(!_.isUndefined(ARGS.metric)) {
  seriesName = ARGS.name;
}


//var seriesName = prefix + host;

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
var targetGen = function (series, alias, interval, column, func) {
  return {
    'series': series,
    'alias': alias,
    'column': (column === undefined) ? 'value' : column,
    'interval': (interval === undefined) ? '1m' : interval,
    'function': (func === undefined) ? 'mean' : func,
  };
};

var aliasSeries = function (series, alias, interval, column, func) {
  if (series.lastIndexOf(alias) === series.length - alias.length)
    return targetGen(series, alias, interval, column, func);
  return false;
};


var setupPanelCpu = function (series, span, interval) {
  span = (span === undefined) ? 12 : span;
  interval = (interval === undefined) ? '1m' : interval;
  var aliasColors = {
    'user': '#508642',
    'system': '#EAB839',
    'idle': '#303030',
    'wait': '#890F02',
    'steal': '#E24D42',
    'nice': '#9400D3',
    'softirq': '#E9967A',
    'interrupt': '#1E90FF',
  };
  var targets = [];
  var target = {};
  for (var alias in aliasColors) {
    for (var i = 0; i < series.length; i++) {
      target = aliasSeries(series[i], alias, interval);
      if (target)
        targets.push(target);
    }
  }
  return {
    'title': 'CPU',
    'type': 'graphite',
    'span': span,
    'renderer': 'flot',
    'y_formats': [ 'none' ],
    'grid': { 'max': null, 'min': 0 },
    'lines': false,
    'bars': true,
    'stack': true,
    'legend': { 'show': true },
    'percentage': true,
    'nullPointMode': 'null',
    'targets': targets,
    'aliasColors': aliasColors,
  };
};

var setupPanelMemory = function (series, span, interval) {
  span = (span === undefined) ? 12 : span;
  interval = (interval === undefined) ? '1m' : interval;
  return {
    'title': 'Memory',
    'type': 'graphite',
    'span': span,
    'y_formats': [ 'bytes' ],
    'grid': { max: null, min: 0 },
    'lines': true,
    'fill': 1,
    'linewidth': 1,
    'stack': true,
    'nullPointMode': 'null',
    'targets': [
      targetGen(series + '.memory.memory-used', 'used', interval),
      targetGen(series + '.memory.memory-cached', 'cached', interval),
      targetGen(series + '.memory.memory-buffered', 'buffered', interval),
      targetGen(series + '.memory.memory-free', 'free', interval),
    ],
    'aliasColors': {
      'free': '#629E51',
      'used': '#1F78C1',
      'cached': '#EF843C',
      'buffered': '#CCA300'
    }
  };
};

var setupPanelLoad = function (series, span, interval) {
  span = (span === undefined) ? 12 : span;
  interval = (interval === undefined) ? '1m' : interval;
  return {
    'title': 'Load Average',
    'type': 'graphite',
    'span': span,
    'y_formats': [ 'none' ],
    'grid': { max: null, min: 0 },
    'lines': true,
    'fill': 1,
    'linewidth': 1,
    'nullPointMode': 'null',
    'targets': [
      targetGen(series + '.load.load.midterm', 'load', interval),
    ]
  };
};

var setupPanelSwap = function (series, span, interval) {
  span = (span === undefined) ? 12 : span;
  interval = (interval === undefined) ? '1m' : interval;
  return {
    'title': 'Swap',
    'type': 'graphite',
    'span': span,
    'y_formats': [ 'bytes' ],
    'grid': { max: null, min: 0, leftMin: 0 },
    'lines': true,
    'fill': 1,
    'linewidth': 1,
    'stack': true,
    'nullPointMode': 'null',
    'targets': [
      targetGen(series + '.swap.swap-used', 'used', interval),
      targetGen(series + '.swap.swap-cached', 'cached', interval),
      targetGen(series + '.swap.swap-free', 'free', interval),
    ],
    'aliasColors': {
      'used': '#1F78C1',
      'cached': '#EAB839',
      'free': "#508642"
    }
  };
};

var setupPanelNetworkTraffic = function (series, span, interval, interf) {
  interf = (interf === undefined) ? 'interface-eth0' : interf;
  span = (span === undefined) ? 12 : span;
  interval = (interval === undefined) ? '1m' : interval;
  return {
    title: 'Network Traffic on ' + interf,
    type: 'graphite',
    span: span,
    y_formats: [ 'bytes' ],
    grid: { max: null, min: null },
    lines: true,
    fill: 1,
    linewidth: 1,
    nullPointMode: 'null',
    targets: [
      targetGen(series + '.' + interf + '.if_octets.rx', 'in_' + interf, interval, 'value'),
      targetGen(series + '.' + interf + '.if_octets.tx', 'out_' + interf, interval, 'value*-1'),
    ]
  };
};

var setupPanelNetworkPackets = function (series, span, interval, interf) {
  interf = (interf === undefined) ? 'interface-eth0' : interf;
  span = (span === undefined) ? 12 : span;
  interval = (interval === undefined) ? '1m' : interval;
  return {
    title: 'Network Packets on ' + interf,
    type: 'graphite',
    span: span,
    y_formats: [ 'bytes' ],
    grid: { max: null, min: null },
    lines: true,
    fill: 1,
    linewidth: 1,
    nullPointMode: 'null',
    targets: [
      targetGen(series + '.' + interf + '.if_packets.rx', 'in_' + interf, interval),
      targetGen(series + '.' + interf + '.if_packets.tx', 'out_' + interf, interval, 'value*-1'),
    ]
  };
};

var setupPanelDiskDf = function (series, span, interval, vol) {
  vol = (vol === undefined) ? 'df-vda1' : vol;
  span = (span === undefined) ? 12 : span;
  interval = (interval === undefined) ? '1m' : interval;
  return {
    title: 'Disk space for ' + vol,
    type: 'graphite',
    span: span,
    y_formats: [ "bytes" ],
    grid: { max: null, min: 0, leftMin: 0 },
    lines: true,
    fill: 1,
    linewidth: 1,
    stack: true,
    nullPointMode: "null",
    targets: [
      targetGen(series + '.' + vol + '.df_complex-used', 'used', interval),
      targetGen(series + '.' + vol + '.df_complex-reserved', 'reserved', interval),
      targetGen(series + '.' + vol + '.df_complex-free', 'free', interval),
    ],
    aliasColors: {
      "used": "#447EBC",
      "free": "#508642",
      "reserved": "#EAB839"
    }
  };
};

var setupPanelDiskIO = function (series, span, interval, vol) {
  vol = (vol === undefined) ? 'df-root' : vol;
  span = (span === undefined) ? 12 : span;
  interval = (interval === undefined) ? '1m' : interval;
  return {
    title: 'Disk IO for ' + vol,
    type: 'graphite',
    span: span,
    y_formats: [ "none" ],
    grid: { max: null, min: null },
    lines: true,
    fill: 1,
    linewidth: 1,
    nullPointMode: "null",
    targets: [
      targetGen(series + '.' + vol + '.disk_ops.write', 'write', interval),
      targetGen(series + '.' + vol + '.disk_ops.read', 'read', interval, 'value*-1'),
    ],
  };
};

var setupRow = function (title, panels) {
  return {
    title: title,
    height: '250px',
    panels: panels,
  };
};


var supportedDashs = {
  cpu: { func: [setupPanelCpu], split: false },
  load: { func: [setupPanelLoad] },
  memory: { func: [setupPanelMemory] },
  swap: { func: [setupPanelSwap] },
  interface: { func: [setupPanelNetworkTraffic, setupPanelNetworkPackets], split: true },
  df: { func: [setupPanelDiskDf], split: true },
  disk: { func: [ setupPanelDiskIO], split: true },
};

if (!_.isUndefined(ARGS.test)) {
  var test = ARGS.test;
  var pfx = 'collectd.' + host;
  var hostSeries = getHostSeries(host);

  for (var metric in supportedDashs) {
    var matchedSeries = [];
    for (var i = 0; i < hostSeries.length; i++) {      
      if (hostSeries[i].indexOf(pfx + '.' + metric) === 0) {
        matchedSeries.push(hostSeries[i]);
//        for (var j = 0; j < supportedDashs[metric].func.length; j++) {
//          console.log(metric);
//          metricFunc = supportedDashs[metric].func[j];
//          dashboard.rows.push(setupRow(metric.toUpperCase, [metricFunc(hostSeries[i], 12, '1m')]));
//        }
//        break;
      }
    }
    for (var j = 0; j < supportedDashs[metric].func.length; j++) {
      metricFunc = supportedDashs[metric].func[j];
      dashboard.rows.push(setupRow(metric.toUpperCase, [metricFunc(matchedSeries, 12, '1m')]));
    
    }
  }
  
  return dashboard;
}


// Dashboard row composition
dashboard.rows.push(setupRow('CPU and Load',
      [setupPanelCpu(seriesName, 6, '1m'), setupPanelLoad(seriesName, 6, '5m')]));

dashboard.rows.push(setupRow('Memory',
      [setupPanelMemory(seriesName, 6, '5m'), setupPanelSwap(seriesName, 6, '5m')]));

dashboard.rows.push(setupRow('Network',
      [setupPanelNetworkTraffic(seriesName, 6, '1m'), setupPanelNetworkPackets(seriesName, 6, '1m')]));

dashboard.rows.push(setupRow('Disk',
      [setupPanelDiskDf(seriesName, 6, '1m'), setupPanelDiskIO(seriesName, 6, '1m', 'disk-vda')]));

return dashboard;
