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

if(!_.isUndefined(ARGS.metric)) {
  var displayMetric = ARGS.metric;
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
    'octets.rx': { 'color': '#447EBC' },
    'octets.tx': { 'color': '#508642', 'column': 'value*-1' },
  },
  'panel': {
    'title': 'Network Traffic on @metric',
    'y_formats': [ 'bytes' ],
  },
};


var gNetworkPackets = {
  'graph': {
    'packets.rx': { 'color': '#447EBC' },
    'packets.tx': { 'color': '#508642', 'column': 'value*-1' },
  },
  'panel': {
    'title': 'Network Packets on @metric',
  },
};


var gDiskDf = {
  'graph': {
    'complex-used': { 'color': '#447EBC' },
    'complex-reserved': { 'color': '#EAB839' },
    'complex-free': { 'color': '#508642' },
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
    'ops.write': { 'color': '#447EBC' },
    'ops.read': { 'color': '#508642', 'column': 'value*-1' },
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
    'fork_rate': { 'apply': 'max' },
  },
  'panel': {
    'title': 'Processes Fork Rate',
    'y_formats': [ 'short' ],
    'grid': { 'max': null, 'min': 0 },
  },
};


// Redis plugin configuration: https://github.com/powdahound/redis-collectd-plugin
var gRedisMemory = {
  'graph': {
    'used_memory': { 'color': '#447EBC' },
  },
  'panel': {
    'title': 'Redis Memomy',
    'y_formats': [ 'bytes' ],
    'grid': { 'max': null, 'min': 0, 'leftMin': 0 },
  },
};

var gRedisCommands = {
  'graph': {
    'commands_processed': { 'color': '#447EBC' },
  },
  'panel': {
    'title': 'Redis Commands',
    'grid': { 'max': null, 'min': 0, 'leftMin': 0 },
  },
};

var gRedisConns = {
  'graph': {
    'connections_received': { 'color': '#447EBC', 'apply': 'max' },
    'blocked_clients': { 'color': '#E24D42', 'apply': 'max'},
    'connected_clients': { 'color': '#508642' },
  },
  'panel': {
    'title': 'Redis Connections',
    'grid': { 'max': null, 'min': 0, 'leftMin': 0 },
  },
};

var gRedisUnsavedChanges = {
  'graph': {
    'changes_since_last_save': { 'color': '#E24D42' },
  },
  'panel': {
    'title': 'Redis Unsaved Changes',
    'grid': { 'max': null, 'min': 0, 'leftMin': 0 },
  },
};

var gRedisSlaves = {
  'graph': {
    'connected_slaves': { 'color': '#508642' },
  },
  'panel': {
    'title': 'Redis Connected Slaves',
    'grid': { 'max': null, 'min': 0, 'leftMin': 0 },
  },
};

var gRedisDBKeys = {
  'graph': {
    'keys': { },
  },
  'panel': {
    'title': 'Redis DB Keys',
    'grid': { 'max': null, 'min': 0, 'leftMin': 0 },
  },
  'alias': {
    'position': 3,
  },
};

var gRedisReplMaster = {
  'graph': {
    'master_repl_offset': { },
  },
  'panel': {
    'title': 'Redis Replication Master',
    'grid': { 'max': null, 'min': 0, 'leftMin': 0 },
  },
};

var gRedisReplBacklogCounters = {
  'graph': {
    'repl_backlog_active': { },
    'repl_backlog_histlen': { },
  },
  'panel': {
    'title': 'Redis Replication Backlog Counters',
    'grid': { 'max': null, 'min': 0, 'leftMin': 0 },
  },
};

var gRedisReplBacklogSize = {
  'graph': {
    'backlog_first_byte_offset': { },
    'repl_backlog_size': { },
  },
  'panel': {
    'title': 'Redis Replication Backlog Size',
    'y_formats': [ 'bytes' ],
    'grid': { 'max': null, 'min': 0, 'leftMin': 0 },
  },
};

var gRedisUptime = {
  'graph': {
    'uptime_in_seconds': { 'color': '#508642', 'alias': 'uptime_in_hours', 'column': 'value/3600' },
  },
  'panel': {
    'title': 'Redis Uptime',
    'grid': { 'max': null, 'min': 0, 'leftMin': 0 },
  },
};

// Memcached default collectd plugin configuration
var gMemcachedMemory = {
  'graph': {
    'cache.used': { 'color': '#447EBC', 'alias': 'memory-used' },
    'cache.free': { 'color': '#508642', 'alias': 'momory-free' },
  },
  'panel': {
    'title': 'Memcached Memomy',
    'y_formats': [ 'bytes' ],
    'stack': true,
  },
};

var gMemcachedConns = {
  'graph': {
    'connections-current': { 'color': '#447EBC', 'alias': 'connections' },
  },
  'panel': {
    'title': 'Memcached Connections',
    'grid': { 'max': null, 'min': 0, 'leftMin': 0 },
  },
};

var gMemcachedItems = {
  'graph': {
    'items-current': { 'color': '#447EBC', 'alias': 'items' },
  },
  'panel': {
    'title': 'Memcached Items',
    'grid': { 'max': null, 'min': 0, 'leftMin': 0 },
  },
};

var gMemcachedCommands = {
  'graph': {
    'command-flush': { },
    'command-get': { },
    'command-set': { },
    'command-touch': { },
  },
  'panel': {
    'title': 'Memcached Commands',
    'grid': { 'max': null, 'min': 0, 'leftMin': 0 },
  },
};

var gMemcachedPackets = {
  'graph': {
    'octets.rx': { 'color': '#447EBC' },
    'octets.tx': { 'color': '#508642', 'column': 'value*-1' },
  },
  'panel': {
    'title': 'Memcached Commands',
    'y_formats': [ 'bytes' ],
  },
};

var gMemcachedOperations = {
  'graph': {
    'ops-hits': { },
    'ops-misses': { },
    'ops-evictions': { },
    'ops-incr_hits': { },
    'ops-incr_misses': { },
    'ops-decr_hits': { },
    'ops-decr_misses': { },
  },
  'panel': {
    'title': 'Memcached Operations',
    'grid': { 'max': null, 'min': 0, 'leftMin': 0 },
  },
};

var gMemcachedHits = {
  'graph': {
    'percent-hitratio': { },
  },
  'panel': {
    'title': 'Memcached Hitratio',
    'y_formats': [ 'percent' ],
  },
};

var gMemcachedPs = {
  'graph': {
    'processes': { },
    'threads': { },
  },
  'panel': {
    'title': 'Memcached Process Stats',
    'grid': { 'max': null, 'min': 0, 'leftMin': 0 },
  },
};

var gMemcachedCPU = {
  'graph': {
    'cputime.syst': { 'color': '#EAB839' },
    'cputime.user': { 'color': '#508642' },
  },
  'panel': {
    'title': 'Memcached CPU Time',
    'grid': { 'max': null, 'min': 0 },
    'stack': true,
  },
};


// RabbitMQ plugin configuration: https://github.com/kozdincer/rabbitmq_collectd_plugin
var gRabbitmqRates = {
  'graph': {
    'ack_rate': { },
    'deliver_rate': { },
    'publish_rate': { },
  },
  'panel': {
    'title': 'RabbitMQ Rates',
    'grid': { 'max': null, 'min': 0 },
  },
};

var gRabbitmqChannels = {
  'graph': {
    'channels': { },
    'queues': { },
  },
  'panel': {
    'title': 'RabbitMQ Channels and Queues',
    'grid': { 'max': null, 'min': 0 },
  },
};

var gRabbitmqConns = {
  'graph': {
    'connections': { },
    'consumers': { },
    'exchanges': { },
  },
  'panel': {
    'title': 'RabbitMQ Connections',
    'grid': { 'max': null, 'min': 0 },
  },
};

var gRabbitmqMessages = {
  'graph': {
    'messages_total': { },
    'messages_unack': { },
    'messages_ready': { },
  },
  'panel': {
    'title': 'RabbitMQ Messages',
    'grid': { 'max': null, 'min': 0 },
    'y_formats': [ 'short' ],
  },
};

var gRabbitmqFD = {
  'graph': {
    'fd_total': { 'color': '#508642' },
    'fd_used': { 'color': '#447EBC' },
  },
  'panel': {
    'title': 'RabbitMQ File Descriptors',
    'grid': { 'max': null, 'min': 0 },
  },
};

var gRabbitmqMemory = {
  'graph': {
    'mem_limit': { 'color': '#508642' },
    'mem_used': { 'color': '#447EBC' },
  },
  'panel': {
    'title': 'RabbitMQ Memory',
    'grid': { 'max': null, 'min': 0 },
    'y_formats': [ 'bytes' ],
  },
};

var gRabbitmqProc = {
  'graph': {
    'proc_total': { 'color': '#508642' },
    'proc_used': { 'color': '#447EBC' },
  },
  'panel': {
    'title': 'RabbitMQ Proc',
    'grid': { 'max': null, 'min': 0 },
    'y_formats': [ 'short' ],
  },
};

var gRabbitmqSockets = {
  'graph': {
    'sockets_total': { 'color': '#508642' },
    'sockets_used': { 'color': '#447EBC' },
  },
  'panel': {
    'title': 'RabbitMQ Sockets',
    'grid': { 'max': null, 'min': 0 },
    'y_formats': [ 'short' ],
  },
};

var setupRow = function (title, panels) {
  return {
    'title': title,
    'height': '250px',
    'panels': panels,
    'grid': { 'max': null, 'min': 0 },
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
    'func': [ panelFactory(gNetworkTraffic),
              panelFactory(gNetworkPackets),
            ],
    'multi': true,
  },
  'df': {
    'func': [ panelFactory(gDiskDf) ],
    'multi': true,
  },
  'disk': {
    'func': [ panelFactory(gDiskIO) ],
    'multi': true,
    'regexp': /\d$/,
  },
  'processes': {
    'func': [ panelFactory(gPsState),
              panelFactory(gPsForks),
            ],
  },
  'redis': {
    'func': [ panelFactory(gRedisMemory),
              panelFactory(gRedisUptime),
              panelFactory(gRedisCommands),
              panelFactory(gRedisConns),
              panelFactory(gRedisDBKeys),
              panelFactory(gRedisUnsavedChanges),
              panelFactory(gRedisSlaves),
              panelFactory(gRedisReplMaster),
              panelFactory(gRedisReplBacklogCounters),
              panelFactory(gRedisReplBacklogSize),
            ],
    'alias': 'redis',
  },
  'memcache': {
    'func': [ panelFactory(gMemcachedMemory),
              panelFactory(gMemcachedConns),
              panelFactory(gMemcachedItems),
              panelFactory(gMemcachedCommands),
              panelFactory(gMemcachedPackets),
              panelFactory(gMemcachedOperations),
              panelFactory(gMemcachedHits),
              panelFactory(gMemcachedPs),
              panelFactory(gMemcachedCPU),
            ],
  },
  'rabbitmq': {
    'func': [
              panelFactory(gRabbitmqRates),
              panelFactory(gRabbitmqChannels),
              panelFactory(gRabbitmqConns),
              panelFactory(gRabbitmqMessages),
              panelFactory(gRabbitmqFD),
              panelFactory(gRabbitmqMemory),
              panelFactory(gRabbitmqProc),
              panelFactory(gRabbitmqSockets),
            ],
    'alias': 'rabbitmq',
  },
};

var showDashs = {};

if (displayMetric) {
  displayMetric.split(',').forEach(function (metric) {
    if (metric in supportedDashs) {
      showDashs[metric] = supportedDashs[metric];
    }
  });
} else {
  showDashs = supportedDashs;
}

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

for (var metric in showDashs) {
  var matchedSeries = [];
  var pfxMetric = pfx + '.' + metric;
  var seriesAlias = ('alias' in showDashs[metric]) ? showDashs[metric].alias : null;
  for (var i = 0; i < hostSeries.length; i++) {
    if ((hostSeries[i].indexOf(pfxMetric) === 0) &&
        (!('regexp' in showDashs[metric]) ||
         ('regexp' in showDashs[metric] &&
          showDashs[metric].regexp.test(hostSeries[i].split('.')[2])))) {
      matchedSeries.push(hostSeries[i]);
    }
  }
  if (matchedSeries.length === 0) {
    continue;
  }
  if (showDashs[metric].multi) {
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
        for (var j = 0; j < showDashs[metric].func.length; j++) {
          metricFunc = showDashs[metric].func[j];
          dashboard.rows.push(setupRow(metricExt.toUpperCase, [metricFunc(rematchedSeries, seriesAlias, 12, '1m')]));
        }
      }
     continue; 
    }
  }
  for (var j = 0; j < showDashs[metric].func.length; j++) {
    metricFunc = showDashs[metric].func[j];
    dashboard.rows.push(setupRow(metric.toUpperCase, [metricFunc(matchedSeries, seriesAlias, 12, '1m')]));
  }
}


return dashboard;
