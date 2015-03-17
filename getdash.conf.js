// Configuration JS file for getdash.js

define(['config'], function(config) {

  var pluginConfProto = {
    'alias': undefined,
    'prefix': 'collectd.',
    //'datasources': [ 'graphite' ],
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
  plugins.groups.system = [ 'cpu', 'memory', 'load', 'swap', 'interface', 'df', 'disk', 'processes' ];
  plugins.groups.middleware = [ 'redis', 'memcache', 'rabbitmq', 'elasticsearch' ];
  plugins.groups.database = [ 'elasticsearch' ];


  // collectd cpu plugin configuration
  plugins.cpu = new Plugin();

  plugins.cpu.cpu = {
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
      'lines': false,
      'bars': true,
      'stack': true,
      'legend': { 'show': true },
      'percentage': true,
    },
  };


  // collectd memory plugin configuration
  plugins.memory = new Plugin();

  plugins.memory.memory = {
    'graph': {
      'used': { 'color': '#1F78C1' },
      'cached': { 'color': '#EF843C' },
      'buffered': { 'color': '#CCA300' },
      'free': { 'color': '#629E51' },
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
      'midterm': { 'color': '#7B68EE' },
    },
    'panel': {
      'title': 'Load Average',
    },
  };


  // collectd swap plugin configuration
  plugins.swap = new Plugin();

  plugins.swap.swap = {
    'graph': {
      'used': { 'color': '#1F78C1' },
      'cached': { 'color': '#EAB839' },
      'free': { 'color': '#508642' },
    },
    'panel': {
      'title': 'Swap',
      'y_formats': [ 'bytes' ],
      'stack': true,
    },
  };


  // collectd interface plugin configuration
  plugins.interface = new Plugin();
  plugins.interface.config.multi = true;

  plugins.interface.traffic = {
    'graph': {
      'octets.rx': { 'color': '#447EBC' },
      'octets.tx': { 'color': '#508642', 'column': 'value*-1' },
    },
    'panel': {
      'title': 'Network Traffic on @metric',
      'y_formats': [ 'bytes' ],
      'grid': { 'max': null, 'min': null, 'leftMin': null },
    },
  };

  plugins.interface.packets = {
    'graph': {
      'packets.rx': { 'color': '#447EBC' },
      'packets.tx': { 'color': '#508642', 'column': 'value*-1' },
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
      'complex-used': { 'color': '#447EBC' },
      'complex-reserved': { 'color': '#EAB839' },
      'complex-free': { 'color': '#508642' },
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
      'ops.write': { 'color': '#447EBC' },
      'ops.read': { 'color': '#508642', 'column': 'value*-1' },
    },
    'panel': {
      'title': 'Disk Operations for @metric',
      'grid': { 'max': null, 'min': null, 'leftMin': null },
    },
  };

  plugins.disk.diskOctets = {
    'graph': {
      'octets.write': { 'color': '#447EBC' },
      'octets.read': { 'color': '#508642', 'column': 'value*-1' },
    },
    'panel': {
      'title': 'Disk Traffic for @metric',
      'grid': { 'max': null, 'min': null, 'leftMin': null },
      'y_formats': [ 'bytes' ],
    },
  };

  plugins.disk.diskTime = {
    'graph': {
      'time.write': { 'color': '#447EBC' },
      'time.read': { 'color': '#508642', 'column': 'value*-1' },
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
    },
  };

  plugins.processes.fork = {
    'graph': {
      'fork_rate': { 'apply': 'max' },
    },
    'panel': {
      'title': 'Processes Fork Rate',
      'y_formats': [ 'short' ],
    },
  };


  // collectd redis plugin configuration: https://github.com/powdahound/redis-collectd-plugin
  plugins.redis = new Plugin({ 'alias': 'redis' });

  plugins.redis.memory = {
    'graph': {
      'used_memory': { 'color': '#447EBC' },
    },
    'panel': {
      'title': 'Redis Memomy',
      'y_formats': [ 'bytes' ],
    },
  };

  plugins.redis.commands = {
    'graph': {
      'commands_processed': { 'color': '#447EBC' },
    },
    'panel': {
      'title': 'Redis Commands',
    },
  };

  plugins.redis.connections = {
    'graph': {
      'connections_received': { 'color': '#447EBC', 'apply': 'max' },
      'blocked_clients': { 'color': '#E24D42', 'apply': 'max'},
      'connected_clients': { 'color': '#508642' },
    },
    'panel': {
      'title': 'Redis Connections',
    },
  };

  plugins.redis.unsaved = {
    'graph': {
      'changes_since_last_save': { 'color': '#E24D42' },
    },
    'panel': {
      'title': 'Redis Unsaved Changes',
    },
  };

  plugins.redis.slaves = {
    'graph': {
      'connected_slaves': { 'color': '#508642' },
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
    'alias': {
      'position': 3,
    },
  };

  plugins.redis.replMaster = {
    'graph': {
      'master_repl_offset': { },
    },
    'panel': {
      'title': 'Redis Replication Master',
    },
  };

  plugins.redis.replBacklogCounters = {
    'graph': {
      'repl_backlog_active': { },
      'repl_backlog_histlen': { },
    },
    'panel': {
      'title': 'Redis Replication Backlog Counters',
    },
  };

  plugins.redis.replBacklogSize = {
    'graph': {
      'backlog_first_byte_offset': { },
      'repl_backlog_size': { },
    },
    'panel': {
      'title': 'Redis Replication Backlog Size',
      'y_formats': [ 'bytes' ],
    },
  };

  plugins.redis.uptime = {
    'graph': {
      'uptime_in_seconds': { 'color': '#508642', 'alias': 'uptime_in_hours', 'column': 'value/3600' },
    },
    'panel': {
      'title': 'Redis Uptime',
    },
  };


  // collectd memcached plugin configuration
  plugins.memcache = new Plugin();

  plugins.memcache.memory = {
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

  plugins.memcache.connections = {
    'graph': {
      'connections-current': { 'color': '#447EBC', 'alias': 'connections' },
    },
    'panel': {
      'title': 'Memcached Connections',
    },
  };

  plugins.memcache.items = {
    'graph': {
      'items-current': { 'color': '#447EBC', 'alias': 'items' },
    },
    'panel': {
      'title': 'Memcached Items',
    },
  };

  plugins.memcache.commands = {
    'graph': {
      'command-flush': { },
      'command-get': { },
      'command-set': { },
      'command-touch': { },
    },
    'panel': {
      'title': 'Memcached Commands',
    },
  };

  plugins.memcache.packets = {
    'graph': {
      'octets.rx': { 'color': '#447EBC' },
      'octets.tx': { 'color': '#508642', 'column': 'value*-1' },
    },
    'panel': {
      'title': 'Memcached Traffic',
      'y_formats': [ 'bytes' ],
      'grid': { 'max': null, 'min': null, 'leftMin': null },
    },
  };

  plugins.memcache.operations = {
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
    },
  };

  plugins.memcache.hits = {
    'graph': {
      'percent-hitratio': { },
    },
    'panel': {
      'title': 'Memcached Hitratio',
      'y_formats': [ 'percent' ],
    },
  };

  plugins.memcache.ps = {
    'graph': {
      'processes': { },
      'threads': { },
    },
    'panel': {
      'title': 'Memcached Process Stats',
    },
  };

  plugins.memcache.cpu = {
    'graph': {
      'cputime.syst': { 'color': '#EAB839' },
      'cputime.user': { 'color': '#508642' },
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
      'ack_rate': { },
      'deliver_rate': { },
      'publish_rate': { },
    },
    'panel': {
      'title': 'RabbitMQ Rates',
    },
  };


  plugins.rabbitmq.channels = {
    'graph': {
      'channels': { },
      'queues': { },
    },
    'panel': {
      'title': 'RabbitMQ Channels and Queues',
    },
  };

  plugins.rabbitmq.connections = {
    'graph': {
      'connections': { },
      'consumers': { },
      'exchanges': { },
    },
    'panel': {
      'title': 'RabbitMQ Connections',
    },
  };

  plugins.rabbitmq.messages = {
    'graph': {
      'messages_total': { },
      'messages_unack': { },
      'messages_ready': { },
    },
    'panel': {
      'title': 'RabbitMQ Messages',
      'y_formats': [ 'short' ],
    },
  };

  plugins.rabbitmq.fd = {
    'graph': {
      'fd_total': { 'color': '#508642' },
      'fd_used': { 'color': '#447EBC' },
    },
    'panel': {
      'title': 'RabbitMQ File Descriptors',
    },
  };

  plugins.rabbitmq.memory = {
    'graph': {
      'mem_limit': { 'color': '#508642' },
      'mem_used': { 'color': '#447EBC' },
    },
    'panel': {
      'title': 'RabbitMQ Memory',
      'y_formats': [ 'bytes' ],
    },
  };

  plugins.rabbitmq.proc = {
    'graph': {
      'proc_total': { 'color': '#508642' },
      'proc_used': { 'color': '#447EBC' },
    },
    'panel': {
      'title': 'RabbitMQ Proc',
      'y_formats': [ 'short' ],
    },
  };

  plugins.rabbitmq.sockets = {
    'graph': {
      'sockets_total': { 'color': '#508642' },
      'sockets_used': { 'color': '#447EBC' },
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
      'http_current_open': { },
    },
    'panel': {
      'title': 'ElasticSearch HTTP Open',
    },
  };

  plugins.elasticsearch.transport = {
    'graph': {
      'transport_rx_count': { },
      'transport_tx_count': { 'column': 'value*-1' },
    },
    'panel': {
      'title': 'ElasticSearch Transport',
      'grid': { 'max': null, 'min': null, 'leftMin': null },
    },
  };


  plugins.elasticsearch.idxTimes = {
    'graph': {
      'indices_flush_time': { },
      'indices_get_exists-time': { },
      'indices_get_missing-time': { },
      'indices_get_time': { },
      'indices_indexing_delete-time': { },
      'indices_indexing_index-time': { },
      'indices_merges_time': { },
      'indices_refresh_time': { },
      'indices_search_fetch-time': { },
      'indices_search_query-time': { },
      'indices_store_throttle-time': { },
    },
    'panel': {
      'title': 'ElasticSearch Indices Times',
    },
  };

  plugins.elasticsearch.idxTotals = {
    'graph': {
      'indices_flush_total': { },
      'indices_get_exists-total': { },
      'indices_get_missing-total': { },
      'indices_get_total': { },
      'indices_indexing_delete-total': { },
      'indices_indexing_index-total': { },
      'indices_merges_total': { },
      'indices_refresh_total': { },
      'indices_search_fetch-total': { },
      'indices_search_query-total': { },
    },
    'panel': {
      'title': 'ElasticSearch Indices Totals',
    },
  };

  plugins.elasticsearch.idxDocsDel = {
    'graph': {
      'indices_docs_deleted': { },
    },
    'panel': {
      'title': 'ElasticSearch Indices Docs Deleted',
    },
  };

  plugins.elasticsearch.idxCacheEvictions = {
    'graph': {
      'indices_cache_field_eviction': { },
      'indices_cache_filter_evictions': { },
    },
    'panel': {
      'title': 'ElasticSearch Indices Cache Evictions',
    },
  };

  plugins.elasticsearch.jvmHeapPercent = {
    'graph': {
      'jvm_mem_heap-used-percent': { 'alias': 'jvm-heap-used' },
    },
    'panel': {
      'title': 'ElasticSearch JVM Heap Usage',
      'y_formats': [ 'percent' ],
    },
  };

  plugins.elasticsearch.jvmMemHeap = {
    'graph': {
      'jvm_mem_heap-committed': { 'color': '#508642', 'alias': 'jvm-heap-commited' },
      'bytes-jvm_mem_heap-used': { 'color': '#447EBC', 'alias': 'jvm-heap-used' },
    },
    'panel': {
      'title': 'ElasticSearch JVM Heap Memory Usage',
      'y_formats': [ 'bytes' ],
    },
  };

  plugins.elasticsearch.jvmMemNonHeap = {
    'graph': {
      'bytes-jvm_mem_non-heap-committed': { 'color': '#508642', 'alias': 'jvm-non-heap-commited' },
      'bytes-jvm_mem_non-heap-used': { 'color': '#447EBC', 'alias': 'jvm-non-heap-used' },
    },
    'panel': {
      'title': 'ElasticSearch JVM Non Heap Memory Usage',
      'y_formats': [ 'bytes' ],
    },
  };

  plugins.elasticsearch.jvmThreads = {
    'graph': {
      'jvm_threads_peak': { 'color': '#508642' },
      'jvm_threads_count': { 'color': '#447EBC' },
    },
    'panel': {
      'title': 'ElasticSearch JVM Threads',
    },
  };

  plugins.elasticsearch.jvmGCCount = {
    'graph': {
      'jvm_gc_old-count': { },
      'jvm_gc_count': { },
    },
    'panel': {
      'title': 'ElasticSearch JVM GC Count',
    },
  };

  plugins.elasticsearch.jvmGCTime = {
    'graph': {
      'jvm_gc_old-time': { },
      'jvm_gc_time': { },
    },
    'panel': {
      'title': 'ElasticSearch JVM GC Time',
    },
  };

  plugins.elasticsearch.threadPoolCompleted = {
    'graph': {
      'thread_pool_bulk_completed': { },
      'thread_pool_flush_completed': { },
      'thread_pool_generic_completed': { },
      'thread_pool_get_completed': { },
      'thread_pool_index_completed': { },
      'thread_pool_merge_completed': { },
      'thread_pool_optimize_completed': { },
      'thread_pool_refresh_completed': { },
      'thread_pool_search_completed': { },
      'thread_pool_snapshot_completed': { },
      'thread_pool_warmer_completed': { },
    },
    'panel': {
      'title': 'ElasticSearch Thread Pool Completed',
    },
  };

  plugins.elasticsearch.threadPoolRejected = {
    'graph': {
      'thread_pool_bulk_rejected': { },
      'thread_pool_flush_rejected': { },
      'thread_pool_generic_rejected': { },
      'thread_pool_get_rejected': { },
      'thread_pool_index_rejected': { },
      'thread_pool_merge_rejected': { },
      'thread_pool_optimize_rejected': { },
      'thread_pool_refresh_rejected': { },
      'thread_pool_search_rejected': { },
      'thread_pool_snapshot_rejected': { },
      'thread_pool_warmer_rejected': { },
    },
    'panel': {
      'title': 'ElasticSearch Thread Pool Rejected',
    },
  };

  plugins.elasticsearch.threadPoolAcrive = {
    'graph': {
      'thread_pool_bulk_active': { },
      'thread_pool_flush_active': { },
      'thread_pool_generic_active': { },
      'thread_pool_get_active': { },
      'thread_pool_index_active': { },
      'thread_pool_merge_active': { },
      'thread_pool_optimize_active': { },
      'thread_pool_refresh_active': { },
      'thread_pool_search_active': { },
      'thread_pool_snapshot_active': { },
      'thread_pool_warmer_active': { },
    },
      'panel': {
      'title': 'ElasticSearch Thread Pool Active',
    },
  };

  plugins.elasticsearch.threadPoolLargest = {
    'graph': {
      'thread_pool_bulk_largest': { },
      'thread_pool_flush_largest': { },
      'thread_pool_generic_largest': { },
      'thread_pool_get_largest': { },
      'thread_pool_index_largest': { },
      'thread_pool_merge_largest': { },
      'thread_pool_optimize_largest': { },
      'thread_pool_refresh_largest': { },
      'thread_pool_search_largest': { },
      'thread_pool_snapshot_largest': { },
      'thread_pool_warmer_largest': { },
    },
      'panel': {
      'title': 'ElasticSearch Thread Pool Largest',
    },
  };

  plugins.elasticsearch.threadPoolQueue = {
    'graph': {
      'thread_pool_bulk_queue': { },
      'thread_pool_flush_queue': { },
      'thread_pool_generic_queue': { },
      'thread_pool_get_queue': { },
      'thread_pool_index_queue': { },
      'thread_pool_merge_queue': { },
      'thread_pool_optimize_queue': { },
      'thread_pool_refresh_queue': { },
      'thread_pool_search_queue': { },
      'thread_pool_snapshot_queue': { },
      'thread_pool_warmer_queue': { },
    },
      'panel': {
      'title': 'ElasticSearch Thread Pool Queue',
    },
  };

  plugins.elasticsearch.threadPoolThread = {
    'graph': {
      'thread_pool_bulk_threads': { },
      'thread_pool_flush_threads': { },
      'thread_pool_generic_threads': { },
      'thread_pool_get_threads': { },
      'thread_pool_index_threads': { },
      'thread_pool_merge_threads': { },
      'thread_pool_optimize_threads': { },
      'thread_pool_refresh_threads': { },
      'thread_pool_search_threads': { },
      'thread_pool_snapshot_threads': { },
      'thread_pool_warmer_threads': { },
    },
      'panel': {
      'title': 'ElasticSearch Thread Pool Threads',
    },
  };


  return {
    'plugins': plugins,
    'datasources': config.datasources,
  }; 
});
