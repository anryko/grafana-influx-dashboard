// Configuration JS file for getdash.app.js

define(function getDashConf () {
  'use strict';

  // You can add custom 'alias', 'prefix', 'separator', 'datasources', 'multi', 'regexp' per plugin.
  var pluginConfProto = {
    'alias': undefined,
    //'prefix': 'collectd\\.',        // Special characters in prefix should be escaped by '\\'.
                                      // If you use no prefix set it to undefined or comment it out.
    'separator': '/',                 // In backend query separator is automatically escaped by '\\'.
    //'datasources': [ 'graphite' ],  // You can add custom datasources per plugin.
                                      // If datasources is not set all grafana datasources will be used.
  };

  // Plugin constructor
  function Plugin (config) {
    Object.defineProperty(this, 'config', {
      value: _.merge({}, pluginConfProto, config),
      enumerable: false,
    });
  }

  // collectd plugins configuration
  var plugins = {};
  Object.defineProperty(plugins, 'groups', {
    value: {},
    enumerable: false,
  });

  // plugin groups configuration
  plugins.groups.system = [
    'cpu',
    'memory',
    'load',
    'swap',
    'interface',
    'df',
    'disk',
    'processes',
    'entropy',
    'users'
  ];
  plugins.groups.middleware = [
    'redis',
    'memcache',
    'rabbitmq',
    'elasticsearch',
    'nginx'
  ];
  plugins.groups.database = [ 'elasticsearch' ];


  // collectd cpu plugin configuration
  plugins.cpu = new Plugin();

  plugins.cpu.cpu = {
    'graph': {
      'system': { 'color': '#EAB839', 'alias': 'system' },
      'user': { 'color': '#508642', 'alias': 'user' },
      'idle': { 'color': '#303030', 'alias': 'idle' },
      'wait': { 'color': '#890F02', 'alias': 'wait' },
      'steal': { 'color': '#E24D42', 'alias': 'steal'},
      'nice': { 'color': '#9400D3', 'alias': 'nice' },
      'softirq': { 'color': '#E9967A', 'alias': 'softirq' },
      'interrupt': { 'color': '#1E90FF', 'alias': 'interrupt' },
    },
    'panel': {
      'title': 'CPU',
      'y_formats': [ 'percent' ],
      'lines': false,
      'bars': true,
      'stack': true,
      'percentage': true,
    },
  };


  // collectd memory plugin configuration
  plugins.memory = new Plugin();

  plugins.memory.memory = {
    'graph': {
      'used': { 'color': '#1F78C1', 'alias': 'used' },
      'cached': { 'color': '#EF843C', 'alias': 'cached' },
      'buffered': { 'color': '#CCA300', 'alias': 'buffered' },
      'free': { 'color': '#629E51', 'alias': 'free' },
    },
    'panel': {
      'title': 'Memory',
      'y_formats': [ 'bytes' ],
      'stack': true,
    },
  };


  // collectd load plugin configuration
  plugins.load = new Plugin();

  plugins.load.load = {
    'graph': {
      'load': { 'color': '#7B68EE', 'where': "dsname='midterm'", 'alias': 'midterm' },
    },
    'panel': {
      'title': 'Load Average',
    },
  };


  // collectd swap plugin configuration
  plugins.swap = new Plugin();

  plugins.swap.swap = {
    'graph': {
      'used': { 'color': '#1F78C1', 'alias': 'used' },
      'cached': { 'color': '#EAB839', 'alias': 'cached' },
      'free': { 'color': '#508642', 'alias': 'free' },
    },
    'panel': {
      'title': 'Swap',
      'y_formats': [ 'bytes' ],
      'stack': true,
    },
  };

  plugins.swap.swapIO = {
    'graph': {
      'swap_io-in': { 'apply': 'derivative', 'alias': 'in' },
      'swap_io-out': { 'apply': 'derivative', 'column': 'value*-1', 'alias': 'out' },
    },
    'panel': {
      'title': 'Swap IO',
      'grid': { 'max': null, 'min': null, 'leftMin': null },
      'y_formats': [ 'bytes' ],
    },
  };


  // collectd interface plugin configuration
  plugins.interface = new Plugin();
  plugins.interface.config.multi = true;

  plugins.interface.traffic = {
    'graph': {
      'octets': [
        {
          'color': '#447EBC',
          'where': "dsname='rx'",
          'alias': 'octets-rx',
          'apply': 'derivative',
        },
        {
          'color': '#508642',
          'where': "dsname='tx'",
          'column': 'value*-1',
          'alias': 'octets-tx',
          'apply': 'derivative',
        },
      ],
    },
    'panel': {
      'title': 'Network Traffic on @metric',
      'y_formats': [ 'bytes' ],
      'grid': { 'max': null, 'min': null, 'leftMin': null },
    },
  };

  plugins.interface.packets = {
    'graph': {
      'packets': [
        {
          'color': '#447EBC',
          'where': "dsname='rx'",
          'alias': 'packets-rx',
          'apply': 'derivative',
        },
        {
          'color': '#508642',
          'where': "dsname='tx'",
          'column': 'value*-1',
          'alias': 'packets-tx',
          'apply': 'derivative',
        },
      ],
    },
    'panel': {
      'title': 'Network Packets on @metric',
      'grid': { 'max': null, 'min': null, 'leftMin': null },
    },
  };


  // collectd df plugin configuration
  plugins.df = new Plugin();

  plugins.df.df = {
    'graph': {
      'complex-used': { 'color': '#447EBC', 'alias': 'used' },
      'complex-reserved': { 'color': '#EAB839', 'alias': 'reserved' },
      'complex-free': { 'color': '#508642', 'alias': 'free' },
    },
    'panel': {
      'title': 'Disk space for @metric',
      'y_formats': [ 'bytes' ],
      'stack': true,
    },
  };


  // collectd disk plugin configuration
  plugins.disk = new Plugin();
  plugins.disk.config.multi = true;
  plugins.disk.config.regexp = /\d$/;

  plugins.disk.diskOps = {
    'graph': {
      'ops': [
        {
          'color': '#447EBC',
          'where': "dsname='write'",
          'alias': 'write',
          'apply': 'derivative',
        },
        {
          'color': '#508642',
          'where': "dsname='read'",
          'alias': 'read',
          'column': 'value*-1',
          'apply': 'derivative',
        },
      ]
    },
    'panel': {
      'title': 'Disk Operations for @metric',
      'grid': { 'max': null, 'min': null, 'leftMin': null },
    },
  };

  plugins.disk.diskOctets = {
    'graph': {
      'octets': [
        {
          'color': '#447EBC',
          'where': "dsname='write'",
          'alias': 'write',
          'apply': 'derivative',
        },
        {
          'color': '#508642',
          'where': "dsname='read'",
          'alias': 'read',
          'column': 'value*-1',
          'apply': 'derivative',
        },
      ],
    },
    'panel': {
      'title': 'Disk Traffic for @metric',
      'grid': { 'max': null, 'min': null, 'leftMin': null },
      'y_formats': [ 'bytes' ],
    },
  };

  plugins.disk.diskTime = {
    'graph': {
      'time': [
        {
          'color': '#447EBC',
          'where': "dsname='write'",
          'alias': 'write',
          'apply': 'derivative',
        },
        {
          'color': '#508642',
          'where': "dsname='read'",
          'alias': 'read',
          'column': 'value*-1',
          'apply': 'derivative',
        },
      ],
    },
    'panel': {
      'title': 'Disk Wait for @metric',
      'grid': { 'max': null, 'min': null, 'leftMin': null },
    },
  };


  // collectd processes plugin configuration
  plugins.processes = new Plugin();

  plugins.processes.state = {
    'graph': {
      'sleeping': { 'color': '#EAB839', 'alias': 'sleeping' },
      'running': { 'color': '#508642', 'alias': 'running' },
      'stopped': { 'color': '#E9967A', 'alias': 'stopped' },
      'blocked': { 'color': '#890F02', 'alias': 'blocked' },
      'zombies': { 'color': '#E24D42', 'alias': 'zombies' },
      'paging': { 'color': '#9400D3', 'alias': 'paging' },
    },
    'panel': {
      'title': 'Processes State',
      'y_formats': [ 'short' ],
    },
  };

  plugins.processes.fork = {
    'graph': {
      'fork_rate': { 'apply': 'derivative' },
    },
    'panel': {
      'title': 'Processes Fork Rate',
      'y_formats': [ 'short' ],
    },
  };


  // collectd entropy plugin configuration
  plugins.entropy = new Plugin();

  plugins.entropy.entropy = {
    'graph': {
      'entropy': { },
    },
    'panel': {
      'title': 'Entropy',
      'y_formats': [ 'short' ],
    },
  };


  // collectd users plugin configuration
  plugins.users = new Plugin();

  plugins.users.users = {
    'graph': {
      'users': { },
    },
    'panel': {
      'title': 'Users',
    },
  };


  // collectd redis plugin configuration: https://github.com/powdahound/redis-collectd-plugin
  plugins.redis = new Plugin({ 'alias': 'redis' });

  plugins.redis.memory = {
    'graph': {
      'used_memory': { 'color': '#447EBC', 'alias': 'memory-used' },
    },
    'panel': {
      'title': 'Redis Memomy',
      'y_formats': [ 'bytes' ],
    },
  };

  plugins.redis.commands = {
    'graph': {
      'commands_processed': { 'color': '#447EBC', 'alias': 'commands-processed', 'apply': 'derivative' },
    },
    'panel': {
      'title': 'Redis Commands',
    },
  };

  plugins.redis.connections = {
    'graph': {
      'connections_received': { 'color': '#447EBC', 'apply': 'derivative', 'alias': 'connections' },
      'blocked_clients': { 'color': '#E24D42', 'apply': 'derivative', 'alias': 'clients-blocked' },
      'connected_clients': { 'color': '#508642', 'apply': 'derivative', 'alias': 'clients-connected' },
    },
    'panel': {
      'title': 'Redis Connections',
    },
  };

  plugins.redis.unsaved = {
    'graph': {
      'changes_since_last_save': { 'color': '#E24D42', 'alias': 'changes-unsaved' },
    },
    'panel': {
      'title': 'Redis Unsaved Changes',
    },
  };

  plugins.redis.slaves = {
    'graph': {
      'connected_slaves': { 'color': '#508642', 'alias': 'slaves-connected' },
    },
    'panel': {
      'title': 'Redis Connected Slaves',
    },
  };

  plugins.redis.keys = {
    'graph': {
      'keys': { },
    },
    'panel': {
      'title': 'Redis DB Keys',
    },
  };

  plugins.redis.replMaster = {
    'graph': {
      'master_repl_offset': { 'alias': 'master-repl-offset' },
    },
    'panel': {
      'title': 'Redis Replication Master',
    },
  };

  plugins.redis.replBacklogCounters = {
    'graph': {
      'repl_backlog_active': { 'alias': 'backlog' },
      'repl_backlog_histlen': { 'alias': 'history'},
    },
    'panel': {
      'title': 'Redis Replication Backlog Counters',
    },
  };

  plugins.redis.replBacklogSize = {
    'graph': {
      'backlog_first_byte_offset': { 'alias': 'offset' },
      'repl_backlog_size': { 'alias': 'backlog-size' },
    },
    'panel': {
      'title': 'Redis Replication Backlog Size',
      'y_formats': [ 'bytes' ],
    },
  };

  plugins.redis.uptime = {
    'graph': {
      'uptime_in_seconds': { 'color': '#508642', 'alias': 'uptime-hours', 'column': 'value/3600' },
    },
    'panel': {
      'title': 'Redis Uptime',
    },
  };


  // collectd memcached plugin configuration
  plugins.memcache = new Plugin();

  plugins.memcache.memory = {
    'graph': {
      'cache': [
        {
          'color': '#447EBC',
          'alias': 'memory-used',
          'where': "dsname='used'",
        },
        {
          'color': '#508642',
          'alias': 'momory-free',
          'where': "dsname='free'"
        },
      ],
    },
    'panel': {
      'title': 'Memcached Memomy',
      'y_formats': [ 'bytes' ],
      'stack': true,
    },
  };

  plugins.memcache.connections = {
    'graph': {
      'connections-current': { 'alias': 'connections' },
    },
    'panel': {
      'title': 'Memcached Connections',
    },
  };

  plugins.memcache.items = {
    'graph': {
      'items-current': { 'alias': 'items' },
    },
    'panel': {
      'title': 'Memcached Items',
    },
  };

  plugins.memcache.commands = {
    'graph': {
      'command-flush': { 'apply': 'derivative', 'alias': 'command-flush' },
      'command-get': { 'apply': 'derivative', 'alias': 'command-get' },
      'command-set': { 'apply': 'derivative', 'alias': 'command-set' },
      'command-touch': { 'apply': 'derivative', 'alias': 'command-touch' },
    },
    'panel': {
      'title': 'Memcached Commands',
    },
  };

  plugins.memcache.octets = {
    'graph': {
      'octets': [
        {
          'color': '#447EBC',
          'where': "dsname='tx'",
          'alias': 'octets-tx',
          'apply': 'derivative',
        },
        {
          'color': '#508642',
          'where': "dsname='rx'",
          'alias': 'octets-rx',
          'column': 'value*-1',
          'apply': 'derivative',
        },
      ],
    },
    'panel': {
      'title': 'Memcached Traffic',
      'y_formats': [ 'bytes' ],
      'grid': { 'max': null, 'min': null, 'leftMin': null },
    },
  };

  plugins.memcache.operations = {
    'graph': {
      'ops-hits': { 'apply': 'derivative', 'alias': 'hits' },
      'ops-misses': { 'apply': 'derivative', 'alias': 'misses' },
      'ops-evictions': { 'apply': 'derivative', 'alias': 'evictions' },
      'ops-incr_hits': { 'apply': 'derivative', 'alias': 'incr-hits' },
      'ops-decr_hits': { 'apply': 'derivative', 'alias': 'decr-hits' },
      'ops-incr_misses': { 'apply': 'derivative', 'alias': 'incr-misses' },
      'ops-decr_misses': { 'apply': 'derivative', 'alias': 'decr-misses' },

    },
    'panel': {
      'title': 'Memcached Operations',
    },
  };

  plugins.memcache.hits = {
    'graph': {
      'percent-hitratio': { 'alias': 'hitratio' },
    },
    'panel': {
      'title': 'Memcached Hitratio',
      'y_formats': [ 'percent' ],
    },
  };

  plugins.memcache.ps = {
    'graph': {
      'ps_count': [
        {
          'alias': 'processes',
          'where': "dsname='processes'",
        },
        {
          'alias': 'threads',
          'where': "dsname='threads'",
        },
      ],
    },
    'panel': {
      'title': 'Memcached Process Stats',
    },
  };

  plugins.memcache.cpu = {
    'graph': {
      'ps_cputime': [
        {
          'color': '#EAB839',
          'alias': 'system',
          'where': "dsname='syst'",
          'apply': 'derivative',
        },
        {
          'color': '#508642',
          'alias': 'user',
          'where': "dsname='user'",
          'apply': 'derivative',
        },
      ],
    },
    'panel': {
      'title': 'Memcached CPU Time',
      'stack': true,
    },
  };


  // collectd rabbitmq plugin configuration: https://github.com/kozdincer/rabbitmq_collectd_plugin
  plugins.rabbitmq = new Plugin({ 'alias': 'rabbitmq' });

  plugins.rabbitmq.rates = {
    'graph': {
      'ack_rate': { 'alias': 'rate-ack' },
      'deliver_rate': { 'alias': 'rate-deliver' },
      'publish_rate': { 'alias': 'rate-publish' },
    },
    'panel': {
      'title': 'RabbitMQ Rates',
    },
  };

  plugins.rabbitmq.channels = {
    'graph': {
      'channels': { 'alias': 'channels' },
      'queues': { 'alias': 'queues' },
    },
    'panel': {
      'title': 'RabbitMQ Channels and Queues',
    },
  };

  plugins.rabbitmq.connections = {
    'graph': {
      'connections': { 'alias': 'connections' },
      'consumers': { 'alias': 'consumers' },
      'exchanges': { 'alias': 'exchanges' },
    },
    'panel': {
      'title': 'RabbitMQ Connections',
    },
  };

  plugins.rabbitmq.messages = {
    'graph': {
      'messages_total': { 'alias': 'messages-total' },
      'messages_unack': { 'alias': 'messages-unack' },
      'messages_ready': { 'alias': 'messages-ready' },
    },
    'panel': {
      'title': 'RabbitMQ Messages',
      'y_formats': [ 'short' ],
    },
  };

  plugins.rabbitmq.fd = {
    'graph': {
      'fd_total': { 'color': '#508642', 'alias': 'fd-total' },
      'fd_used': { 'color': '#447EBC', 'alias': 'fd-used' },
    },
    'panel': {
      'title': 'RabbitMQ File Descriptors',
    },
  };

  plugins.rabbitmq.memory = {
    'graph': {
      'mem_limit': { 'color': '#508642', 'alias': 'mem-limit' },
      'mem_used': { 'color': '#447EBC', 'alias': 'mem-used' },
    },
    'panel': {
      'title': 'RabbitMQ Memory',
      'y_formats': [ 'bytes' ],
    },
  };

  plugins.rabbitmq.proc = {
    'graph': {
      'proc_total': { 'color': '#508642', 'alias': 'proc-total' },
      'proc_used': { 'color': '#447EBC', 'alias': 'proc-used' },
    },
    'panel': {
      'title': 'RabbitMQ Proc',
      'y_formats': [ 'short' ],
    },
  };

  plugins.rabbitmq.sockets = {
    'graph': {
      'sockets_total': { 'color': '#508642', 'alias': 'sockets-total' },
      'sockets_used': { 'color': '#447EBC', 'alias': 'sockets-used' },
    },
    'panel': {
      'title': 'RabbitMQ Sockets',
      'y_formats': [ 'short' ],
    },
  };


  // collectd elasticsearch plugin configuration: https://github.com/phobos182/collectd-elasticsearch
  plugins.elasticsearch = new Plugin({ 'alias': 'elasticsearch' });

  plugins.elasticsearch.http = {
    'graph': {
      'http.current_open': { 'alias': 'http-open' },
    },
    'panel': {
      'title': 'ElasticSearch HTTP Open',
    },
  };

  plugins.elasticsearch.transportCount = {
    'graph': {
      'transport.rx.count': { 'apply': 'derivative', 'alias': 'transport.rx' },
      'transport.tx.count': { 'apply': 'derivative', 'column': 'value*-1', 'alias': 'transport.tx' },
    },
    'panel': {
      'title': 'ElasticSearch Transport Counters',
      'grid': { 'max': null, 'min': null, 'leftMin': null },
      'y_formats': [ 'short' ],
    },
  };

  plugins.elasticsearch.transportSize = {
    'graph': {
      'transport.rx.size': { 'alias': 'transport.rx' },
      'transport.tx.size': { 'column': 'value*-1', 'alias': 'transport.tx' },
    },
    'panel': {
      'title': 'ElasticSearch Transport Size',
      'grid': { 'max': null, 'min': null, 'leftMin': null },
      'y_formats': [ 'bytes' ],
    },
  };

  plugins.elasticsearch.idxTimes = {
    'graph': {
      'indices.flush.time': { },
      'indices.get.exists-time': { },
      'indices.get.missing-time': { },
      'indices.get.time': { },
      'indices.indexing.delete-time': { },
      'indices.indexing.index-time': { },
      'indices.merges.time': { },
      'indices.refresh.time': { },
      'indices.search.fetch-time': { },
      'indices.search.query-time': { },
      'indices.store.throttle-time': { },
    },
    'panel': {
      'title': 'ElasticSearch Indices Times',
    },
  };

  plugins.elasticsearch.idxTotals = {
    'graph': {
      'indices.flush.total': { 'apply': 'derivative' },
      'indices.get.exists-total': { 'apply': 'derivative' },
      'indices.get.missing-total': { 'apply': 'derivative' },
      'indices.get.total': { 'apply': 'derivative' },
      'indices.indexing.delete-total': { 'apply': 'derivative' },
      'indices.indexing.index-total': { 'apply': 'derivative' },
      'indices.merges.total': { 'apply': 'derivative' },
      'indices.refresh.total': { 'apply': 'derivative' },
      'indices.search.fetch-total': { 'apply': 'derivative' },
      'indices.search.query-total': { 'apply': 'derivative' },
    },
    'panel': {
      'title': 'ElasticSearch Indices Totals',
    },
  };

  plugins.elasticsearch.idxDocs = {
    'graph': {
      'indices.docs.count': { },
      'indices.docs.deleted': { 'apply': 'derivative' },
    },
    'panel': {
      'title': 'ElasticSearch Indices Docs',
    },
  };

  plugins.elasticsearch.idxCacheEvictions = {
    'graph': {
      'indices.cache.field.eviction': { 'apply': 'derivative' },
      'indices.cache.filter.evictions': { 'apply': 'derivative' },
    },
    'panel': {
      'title': 'ElasticSearch Indices Cache Evictions',
    },
  };

  plugins.elasticsearch.jvmHeapPercent = {
    'graph': {
      'jvm.mem.heap-used-percent': { 'alias': 'jvm-heap-used' },
    },
    'panel': {
      'title': 'ElasticSearch JVM Heap Usage',
      'y_formats': [ 'percent' ],
    },
  };

  plugins.elasticsearch.jvmMemHeap = {
    'graph': {
      'jvm.mem.heap-committed': { 'color': '#508642', 'alias': 'jvm-heap-commited' },
      'bytes-jvm.mem.heap-used': { 'color': '#447EBC', 'alias': 'jvm-heap-used' },
    },
    'panel': {
      'title': 'ElasticSearch JVM Heap Memory Usage',
      'y_formats': [ 'bytes' ],
    },
  };

  plugins.elasticsearch.jvmMemNonHeap = {
    'graph': {
      'bytes-jvm.mem.non-heap-committed': { 'color': '#508642', 'alias': 'jvm-non-heap-commited' },
      'bytes-jvm.mem.non-heap-used': { 'color': '#447EBC', 'alias': 'jvm-non-heap-used' },
    },
    'panel': {
      'title': 'ElasticSearch JVM Non Heap Memory Usage',
      'y_formats': [ 'bytes' ],
    },
  };

  plugins.elasticsearch.jvmThreads = {
    'graph': {
      'jvm.threads.peak': { 'color': '#508642' },
      'jvm.threads.count': { 'color': '#447EBC' },
    },
    'panel': {
      'title': 'ElasticSearch JVM Threads',
    },
  };

  plugins.elasticsearch.jvmGCCount = {
    'graph': {
      'jvm.gc.old-count': { 'apply': 'derivative' },
      'jvm.gc.count': { 'apply': 'derivative' },
    },
    'panel': {
      'title': 'ElasticSearch JVM GC Count',
    },
  };

  plugins.elasticsearch.jvmGCTime = {
    'graph': {
      'jvm.gc.old-time': { 'apply': 'derivative' },
      'jvm.gc.time': { 'apply': 'derivative' },
    },
    'panel': {
      'title': 'ElasticSearch JVM GC Time',
    },
  };

  plugins.elasticsearch.threadPoolCompleted = {
    'graph': {
      'thread_pool.bulk.completed': { 'apply': 'derivative' },
      'thread_pool.flush.completed': { 'apply': 'derivative' },
      'thread_pool.generic.completed': { 'apply': 'derivative' },
      'thread_pool.get.completed': { 'apply': 'derivative' },
      'thread_pool.index.completed': { 'apply': 'derivative' },
      'thread_pool.merge.completed': { 'apply': 'derivative' },
      'thread_pool.optimize.completed': { 'apply': 'derivative' },
      'thread_pool.refres._completed': { 'apply': 'derivative' },
      'thread_pool.search.completed': { 'apply': 'derivative' },
      'thread_pool.snapshot.completed': { 'apply': 'derivative' },
      'thread_pool.warmer.completed': { 'apply': 'derivative' },
    },
    'panel': {
      'title': 'ElasticSearch Thread Pool Completed',
    },
  };

  plugins.elasticsearch.threadPoolRejected = {
    'graph': {
      'thread_pool.bulk.rejected': { 'apply': 'derivative' },
      'thread_pool.flush.rejected': { 'apply': 'derivative' },
      'thread_pool.generic.rejected': { 'apply': 'derivative' },
      'thread_pool.get.rejected': { 'apply': 'derivative' },
      'thread_pool.index.rejected': { 'apply': 'derivative' },
      'thread_pool.merge.rejected': { 'apply': 'derivative' },
      'thread_pool.optimize.rejected': { 'apply': 'derivative' },
      'thread_pool.refresh.rejected': { 'apply': 'derivative' },
      'thread_pool.search.rejected': { 'apply': 'derivative' },
      'thread_pool.snapshot.rejected': { 'apply': 'derivative' },
      'thread_pool.warmer.rejected': { 'apply': 'derivative' },
    },
    'panel': {
      'title': 'ElasticSearch Thread Pool Rejected',
    },
  };

  plugins.elasticsearch.threadPoolAcrive = {
    'graph': {
      'thread_pool.bulk.active': { 'apply': 'derivative' },
      'thread_pool.flush.active': { 'apply': 'derivative' },
      'thread_pool.generic.active': { 'apply': 'derivative' },
      'thread_pool.get.active': { 'apply': 'derivative' },
      'thread_pool.index.active': { 'apply': 'derivative' },
      'thread_pool.merge.active': { 'apply': 'derivative' },
      'thread_pool.optimize.active': { 'apply': 'derivative' },
      'thread_pool.refresh.active': { 'apply': 'derivative' },
      'thread_pool.search.active': { 'apply': 'derivative' },
      'thread_pool.snapshot.active': { 'apply': 'derivative' },
      'thread_pool.warmer.active': { 'apply': 'derivative' },
    },
      'panel': {
      'title': 'ElasticSearch Thread Pool Active',
    },
  };

  plugins.elasticsearch.threadPoolLargest = {
    'graph': {
      'thread_pool.bulk.largest': { },
      'thread_pool.flush.largest': { },
      'thread_pool.generic.largest': { },
      'thread_pool.get.largest': { },
      'thread_pool.index.largest': { },
      'thread_pool.merge.largest': { },
      'thread_pool.optimize.largest': { },
      'thread_pool.refresh.largest': { },
      'thread_pool.search.largest': { },
      'thread_pool.snapshot.largest': { },
      'thread_pool.warmer.largest': { },
    },
      'panel': {
      'title': 'ElasticSearch Thread Pool Largest',
    },
  };

  plugins.elasticsearch.threadPoolQueue = {
    'graph': {
      'thread_pool.bulk.queue': { },
      'thread_pool.flush.queue': { },
      'thread_pool.generic.queue': { },
      'thread_pool.get.queue': { },
      'thread_pool.index.queue': { },
      'thread_pool.merge.queue': { },
      'thread_pool.optimize.queue': { },
      'thread_pool.refresh.queue': { },
      'thread_pool.search.queue': { },
      'thread_pool.snapshot.queue': { },
      'thread_pool.warmer.queue': { },
    },
      'panel': {
      'title': 'ElasticSearch Thread Pool Queue',
    },
  };

  plugins.elasticsearch.threadPoolThread = {
    'graph': {
      'thread_pool.bulk.threads': { },
      'thread_pool.flush.threads': { },
      'thread_pool.generic.threads': { },
      'thread_pool.get.threads': { },
      'thread_pool.index.threads': { },
      'thread_pool.merge.threads': { },
      'thread_pool.optimize.threads': { },
      'thread_pool.refresh.threads': { },
      'thread_pool.search.threads': { },
      'thread_pool.snapshot.threads': { },
      'thread_pool.warmer.threads': { },
    },
      'panel': {
      'title': 'ElasticSearch Thread Pool Threads',
    },
  };


  // collectd nginx plugin
  plugins.nginx = new Plugin();

  plugins.nginx.requests = {
    'graph': {
      'nginx_requests': { 'apply': 'derivative', 'alias': 'requests' },
    },
    'panel': {
      'title': 'Nginx Requests',
      'y_formats': [ 'short' ],
    },
  };

  plugins.nginx.connections = {
    'graph': {
      'connections-accepted': { 'color': '#1F78C1', 'apply': 'derivative', 'alias': 'accepted' },
      'connections-handled': { 'color': '#629E51', 'apply': 'derivative', 'alias': 'handled' },
    },
    'panel': {
      'title': 'Nginx Connections',
      'y_formats': [ 'short' ],
    },
  };

  plugins.nginx.connStates = {
    'graph': {
      'nginx_connections-active': { 'alias': 'active' },
      'nginx_connections-reading': { 'alias': 'reading' },
      'nginx_connections-waiting': { 'alias': 'waiting' },
      'nginx_connections-writing': { 'alias': 'writing' },
    },
    'panel': {
      'title': 'Nginx Connections States',
      'y_formats': [ 'short' ],
    },
  };


  return {
    'plugins': plugins,
  }; 
});
