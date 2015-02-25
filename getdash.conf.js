// Configuration JS file for getdash.js

// collectd cpu plugin configuration
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


// collectd memory plugin configuration
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


// collectd load plugin configuration
var gLoad = {
  'graph': {
    'midterm': { 'color': '#7B68EE' },
  },
  'panel': {
    'title': 'Load Average',
    'grid': { 'max': null, 'min': 0 },
  },
};


// collectd swap plugin configuration
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


// collectd interface plugin configuration
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


// collectd disk plugin configuration
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


// collectd processes plugin configuration
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


// collectd redis plugin configuration: https://github.com/powdahound/redis-collectd-plugin
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


// collectd memcached plugin configuration
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


// collectd rabbitmq plugin configuration: https://github.com/kozdincer/rabbitmq_collectd_plugin
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


// collectd elasticsearch plugin configuration: https://github.com/phobos182/collectd-elasticsearch
var gElasticsearchJVMHeapPercent = {
  'graph': {
    'jvm_mem_heap-used-percent': { 'alias': 'jvm-heap-used' },
  },
  'panel': {
    'title': 'ElasticSearch JVM Heap Usage',
    'grid': { 'max': null, 'min': 0 },
    'y_formats': [ 'percent' ],
  },
};

var gElasticsearchJVMMemHeap = {
  'graph': {
    'jvm_mem_heap-committed': { 'color': '#508642', 'alias': 'jvm-heap-commited' },
    'bytes-jvm_mem_heap-used': { 'color': '#447EBC', 'alias': 'jvm-heap-used' },
  },
  'panel': {
    'title': 'ElasticSearch JVM Heap Memory Usage',
    'grid': { 'max': null, 'min': 0 },
    'y_formats': [ 'bytes' ],
  },
};

var gElasticsearchJVMMemNonHeap = {
  'graph': {
    'bytes-jvm_mem_non-heap-committed': { 'color': '#508642', 'alias': 'jvm-non-heap-commited' },
    'bytes-jvm_mem_non-heap-used': { 'color': '#447EBC', 'alias': 'jvm-non-heap-used' },
  },
  'panel': {
    'title': 'ElasticSearch JVM Non Heap Memory Usage',
    'grid': { 'max': null, 'min': 0 },
    'y_formats': [ 'bytes' ],
  },
};

var gElasticsearchJVMThreads = {
  'graph': {
    'jvm_threads_peak': { 'color': '#508642' },
    'jvm_threads_count': { 'color': '#447EBC' },
  },
  'panel': {
    'title': 'ElasticSearch JVM Threads',
    'grid': { 'max': null, 'min': 0 },
  },
};

var gElasticsearchJVMGCCount = {
  'graph': {
    'jvm_gc_old-count': { },
    'jvm_gc_count': { },
  },
  'panel': {
    'title': 'ElasticSearch JVM GC Count',
    'grid': { 'max': null, 'min': 0 },
  },
};

var gElasticsearchJVMGCTime = {
  'graph': {
    'jvm_gc_old-time': { },
    'jvm_gc_time': { },
  },
  'panel': {
    'title': 'ElasticSearch JVM GC Time',
    'grid': { 'max': null, 'min': 0 },
  },
};
