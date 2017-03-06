// Configuration JS file for getdash.app.js

// getDashConf :: -> configurationObj
var getDashConf = function getDashConf () {
  'use strict';

  var pluginConfProto = {
    alias: undefined,                // Used to replace real measurement name in graphs.

    separator: ',',                  // Used to define series separator.

    //merge: [ 'instance' ],         // Used to merge multiple instances, types or descriptions
                                     // to one line.

    //multi: false,                  // Used to split single measurement instances to multiple
                                     // individual graphs.

    //regexp: /\d$/,                 // Used to filter instances by regexp.

    //datasources: [ 'graphite' ],   // Used to limit datasources per plugin.
                                     // If undefined all grafana InfluxDB
                                     // datasources will be used.

    tags: {                          // Used to identify data in InfluxDB.
      host: 'host',                  // Defaults are set to work with CollectD metric collector.
      instance: 'instance',
      description: 'type_instance',
      type: 'type'
    }
  };

  // Plugin constructor
  function Plugin (config) {
    Object.defineProperty(this, 'config', {
      value: _.merge({}, pluginConfProto, config),
      enumerable: false
    });
  }

  // collectd plugins configuration
  var plugins = {};
  Object.defineProperty(plugins, 'groups', {
    value: {},
    enumerable: false
  });

  // plugin groups configuration
  plugins.groups.system = [
    'cpu',
    'memory',
    'load',
    'swap',
    'interface',
    'netlink',
    'ping',
    'connstate',
    'tcpconns',
    'conntrack',
    'df',
    'lvm',
    'disk',
    'hddtemp',
    'processes',
    'entropy',
    'users',
    'uptime',
    'irq',
    'nfs',
    'ipvs',
    'docker'
  ];
  plugins.groups.middleware = [
    'redis',
    'memcache',
    'rabbitmq',
    'elasticsearch',
    'nginx',
    'zookeeper',
    'mesos',
    'apache',
    'kafka'
  ];
  plugins.groups.database = [
    'elasticsearch',
    'mysql',
    'postgresql',
    'couchbase'
  ];


  // collectd cpu plugin configuration: https://github.com/anryko/cpu-collectd-plugin
  // works also with default cpu collectd plugin configured as below
  // for reporting aggregated on collectd level metrics:
  // <Plugin cpu>
  //   ReportByState true
  //   ReportByCPU false
  // </Plugin>
  // for reporting per-CPU (per-core) metrics that will be aggregated on Grafana level:
  // <Plugin cpu>
  //   ReportByState true
  //   ReportByCPU true
  //   ValuesPercentage true
  // </Plugin>
  plugins.cpu = new Plugin({ 'alias': 'cpu' });
  plugins.cpu.config.merge = [ 'instance' ];

  plugins.cpu.cpu = {
    'graph': {
      'system': {
        'color': '#EAB839',
        'alias': '@description'
      },
      'user': {
        'color': '#508642',
        'alias': '@description'
      },
      'idle': {
        'color': '#303030',
        'alias': '@description'
      },
      'wait': {
        'color': '#890F02',
        'alias': '@description'
      },
      'steal': {
        'color': '#E24D42',
        'alias': '@description'
      },
      'nice': {
        'color': '#9400D3',
        'alias': '@description'
      },
      'softirq': {
        'color': '#E9967A',
        'alias': '@description'
      },
      'interrupt': {
        'color': '#1E90FF',
        'alias': '@description'
      }
    },
    'panel': {
      'title': 'CPU',
      'yaxes': [ { 'format': 'percent', 'max': 100 }, {} ],
      'fill': 7,
      'stack': true,
      'tooltip': { 'value_type': 'individual' },
      'percentage': true
    }
  };


  // collectd memory plugin configuration
  plugins.memory = new Plugin();

  plugins.memory.memory = {
    'graph': {
      'used': {
        'color': '#1F78C1',
        'alias': '@description'
      },
      'cached': {
        'color': '#EF843C',
        'alias': '@description'
      },
      'buffered': {
        'color': '#CCA300',
        'alias': '@description'
      },
      'free': {
        'color': '#629E51',
        'alias': '@description'
      }
    },
    'panel': {
      'title': 'Memory',
      'yaxes': [ { 'format': 'bytes' }, {} ],
      'stack': true,
      'tooltip': { 'value_type': 'individual' }
    }
  };


  // collectd load plugin configuration
  plugins.load = new Plugin();

  plugins.load.midterm = {
    'graph': {
      'load_shortterm': {
         'color': '#508642',
         'alias': '1m@'
       },
      'load_midterm': {
         'color': '#447EBC',
         'alias': '5m@'
       },
      'load_longterm': {
         'color': '#C15C17',
         'alias': '15m@'
       }
    },
    'panel': {
      'title': 'Load Average'
    }
  };


  // collectd swap plugin configuration
  plugins.swap = new Plugin();

  plugins.swap.swap = {
    'graph': {
      'used': {
        'color': '#1F78C1',
        'alias': 'used'
      },
      'cached': {
        'color': '#EAB839',
        'alias': 'cached'
      },
      'free': {
        'color': '#508642',
        'alias': 'free'
      }
    },
    'panel': {
      'title': 'Swap',
      'yaxes': [ { 'format': 'bytes' }, {} ],
      'stack': true,
      'tooltip': { 'value_type': 'individual' }
    }
  };

  plugins.swap.swapIO = {
    'graph': {
      'in': {
        'color': '#447EBC',
        'apply': 'derivative'
      },
      'out': {
        'color': '#508642',
        'apply': 'derivative',
        'math': '* -1'
      }
    },
    'panel': {
      'title': 'Swap IO',
      'yaxes': [ { 'format': 'bytes', 'min': null }, {} ]
    }
  };


  // collectd interface plugin configuration
  plugins.interface = new Plugin();
  plugins.interface.config.multi = true;

  plugins.interface.traffic = {
    'graph': {
      'rx': {
        'color': '#447EBC',
        'alias': 'octets-rx',
        'apply': 'derivative',
        'math': '* -1',
        'type': 'if_octets'
      },
      'tx': {
        'color': '#508642',
        'alias': 'octets-tx',
        'apply': 'derivative',
        'type': 'if_octets'
      }
    },
    'panel': {
      'title': 'Network Traffic on @metric',
      'yaxes': [ { 'format': 'Bps', 'min': null }, {} ],
    }
  };

  plugins.interface.packets = {
    'graph': {
      'rx': {
        'color': '#447EBC',
        'alias': 'packets-rx',
        'apply': 'derivative',
        'math': '* -1',
        'type': 'if_packets'
      },
      'tx': {
        'color': '#508642',
        'alias': 'packets-tx',
        'apply': 'derivative',
        'type': 'if_packets'
      }
    },
    'panel': {
      'title': 'Network Packets on @metric',
      'yaxes': [ { 'format': 'pps', 'min': null }, {} ]
    }
  };


  // collectd netlink plugin configuration
  plugins.netlink = new Plugin({ 'alias': 'netlink' });
  plugins.netlink.config.multi = true;

  plugins.netlink.packets = {
    'graph': {
      'rx': {
        'color': '#4180A0',
        'apply': 'non_negative_derivative',
        'math': '* -1',
        'type': 'if_packets',
        'alias': '@instance.rx'
      },
      'tx': {
        'color': '#80A041',
        'apply': 'non_negative_derivative',
        'type': 'if_packets',
        'alias': '@instance.tx'
      }
    },
    'panel': {
      'title': 'Netlink packets for @metric',
      'yaxes': [ { 'format': 'pps', 'min': null }, {} ]
    }
  };

  plugins.netlink.octets = {
    'graph': {
      'rx': {
        'color': '#447EBC',
        'apply': 'non_negative_derivative',
        'math': '* -1',
        'type': 'if_octets',
        'alias': '@instance.rx'
      },
      'tx': {
        'color': '#508642',
        'apply': 'non_negative_derivative',
        'type': 'if_octets',
        'alias': '@instance.tx'
      }
    },
    'panel': {
      'title': 'Netlink octets for @metric',
      'yaxes': [ { 'format': 'bps', 'min': null }, {} ]
    }
  };

  plugins.netlink.problems = {
    'graph': {
      'rx': {
        'apply': 'non_negative_derivative',
        'math': '* -1',
        'type': 'if_errors',
        'alias': '@instance.error.rx'
      },
      'tx': {
        'apply': 'non_negative_derivative',
        'type': 'if_errors',
        'alias': '@instance.error.tx'
      },
      '_rx': {
        'apply': 'non_negative_derivative',
        'math': '* -1',
        'type': 'if_dropped',
        'alias': '@instance.drop.rx'
      },
      '_tx': {
        'apply': 'non_negative_derivative',
        'type': 'if_dropped',
        'alias': '@instance.drop.tx'
      },
      'netlink_value': {
        'apply': 'non_negative_derivative',
        'type': 'if_collisions',
        'alias': '@instance.collision'
      }
    },
    'panel': {
      'title': 'Netlink problems for @metric',
      'yaxes': [ { 'format': 'pps', 'min': null }, {} ],
    }
  };

  plugins.netlink.errorsExtended = {
    'graph': {
      'crc': {
        'apply': 'non_negative_derivative',
        'math': '* -1',
        'type': 'if_rx_errors',
        'alias': '@instance.crc-rx'
      },
      'fifo': {
        'apply': 'non_negative_derivative',
        'math': '* -1',
        'type': 'if_rx_errors',
        'alias': '@instance.fifo-rx'
      },
      'frame': {
        'apply': 'non_negative_derivative',
        'math': '* -1',
        'type': 'if_rx_errors',
        'alias': '@instance.frame-rx'
      },
      'length': {
        'apply': 'non_negative_derivative',
        'math': '* -1',
        'type': 'if_rx_errors',
        'alias': '@instance.length-rx'
      },
      'missed': {
        'apply': 'non_negative_derivative',
        'math': '* -1',
        'type': 'if_rx_errors',
        'alias': '@instance.missed-rx'
      },
      'over': {
        'apply': 'non_negative_derivative',
        'math': '* -1',
        'type': 'if_rx_errors',
        'alias': '@instance.over-rx'
      },
      'fifo': {
        'apply': 'non_negative_derivative',
        'type': 'if_tx_errors',
        'alias': '@instance.fifo-tx'
      },
      'aborted': {
        'apply': 'non_negative_derivative',
        'type': 'if_tx_errors',
        'alias': '@instance.aborted-tx'
      },
      'carrier': {
        'apply': 'non_negative_derivative',
        'type': 'if_tx_errors',
        'alias': '@instance.carrier-tx'
      },
      'heartbeat': {
        'apply': 'non_negative_derivative',
        'type': 'if_tx_errors',
        'alias': '@instance.heartbeat-tx'
      },
      'window': {
        'apply': 'non_negative_derivative',
        'type': 'if_tx_errors',
        'alias': '@instance.window-tx'
      }
    },
    'panel': {
      'title': 'Netlink errors for @metric',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'pps', 'min': null }, {} ],
    }
  };

  plugins.netlink.multicast = {
    'graph': {
      'netlink_value': {
        'color': '#FFCC00',
        'apply': 'non_negative_derivative',
        'type': 'if_multicast',
        'alias': '@instance.multicast'
      }
    },
    'panel': {
      'title': 'Netlink multicast for @metric',
      'yaxes': [ { 'format': 'pps' }, {} ]
    }
  };


  // collectd ipvs plugin configuration
  plugins.ipvs = new Plugin({ 'alias': 'ipvs'});

  plugins.ipvs.ipvs = {
    'graph': {
      'ipvs_value': {
        'apply': 'derivative'
      }
    },
    'panel': {
      'title': 'Loadbalanced connections',
      'yaxes': [ { 'format': 'pps' }, {} ]
    }
  };

  // collectd ping plugin configuration
  plugins.ping = new Plugin();

  plugins.ping.ping = {
    'graph': {
      'ping_value': { 'color': '#1F78C1' }
    },
    'panel': {
      'title': 'Ping',
      'yaxes': [ { 'format': 'ms' }, {} ]
    }
  };


  // collectd nfs plugin configuration
  plugins.nfs = new Plugin({ 'alias': 'nfs' });

  plugins.nfs.nfs = {
    'graph': {
      '/.*/': { 'apply': 'derivative' }
    },
    'panel': {
      'title': 'NFS for @metric',
      'yaxes': [ { 'format': 'pps' }, {} ]
    }
  };


  // collectd connstate plugin configuration: https://github.com/anryko/connstate-collectd-plugin
  plugins.connstate = new Plugin({ 'alias': 'connstate' });
  plugins.connstate.config.merge = [ 'instance' ];

  plugins.connstate.connStates = {
    'graph': {
      'established': {
        'color': '#FCE94F',
        'apply': 'sum',
        'alias': 'established@'
      },
      'syn_sent': {
        'color': '#FCAF3E',
        'apply': 'sum',
        'alias': 'syn_sent@'
      },
      'syn_recv': {
        'color': '#8AE234',
        'apply': 'sum',
        'alias': 'syn_recv@'
      },
      'fin_wait1': {
        'color': '#729FCF',
        'apply': 'sum',
        'alias': 'fin_wait1@'
      },
      'fin_wait2': {
        'color': '#AD7FA8',
        'apply': 'sum',
        'alias': 'fin_wait2@'
      },
      'time_wait': {
        'color': '#EF2929',
        'apply': 'sum',
        'alias': 'time_wait@'
      },
      '/close$/': {
        'color': '#D3D7CF',
        'apply': 'sum',
        'alias': 'close@'
      },
      'close_wait': {
        'color': '#2E3436',
        'apply': 'sum',
        'alias': 'close_wait@'
      },
      'last_ack': {
        'color': '#4E9A06',
        'apply': 'sum',
        'alias': 'last_ack@'
      },
      'listen': {
        'color': '#CE5C00',
        'apply': 'sum',
        'alias': 'listen@'
      },
      'closing': {
        'color': '#C4A000',
        'apply': 'sum',
        'alias': 'closing@'
      }
    },
    'panel': {
      'title': 'Network Connections States',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'short', 'min': 0 }, {} ]
    }
  };


  // collectd tcpconns plugin configuration
  plugins.tcpconns = new Plugin({ 'alias': 'tcpconns' });
  plugins.tcpconns.config.multi = true;

  plugins.tcpconns.tcpconnss = {
    'graph': {
      'ESTABLISHED': {
        'color': '#FCE94F',
        'alias': 'ESTABLISHED'
      },
      'SYN_SENT': {
        'color': '#FCAF3E',
        'alias': 'SYN_SENT'
      },
      'SYN_RECV': {
        'color': '#8AE234',
        'alias': 'SYN_RECV'
      },
      'FIN_WAIT1': {
        'color': '#729FCF',
        'alias': 'FIN_WAIT1'
      },
      'FIN_WAIT2': {
        'color': '#AD7FA8',
        'alias': 'FIN_WAIT2'
      },
      'TIME_WAIT': {
        'color': '#EF2929',
        'alias': 'TIME_WAIT'
      },
      'CLOSED': {
        'color': '#D3D7CF',
        'alias': 'CLOSED'
      },
      'CLOSE_WAIT': {
        'color': '#2E3436',
        'alias': 'CLOSE_WAIT'
      },
      'LAST_ACK': {
        'color': '#4E9A06',
        'alias': 'LAST_ACK'
      },
      'LISTEN': {
        'color': '#CE5C00',
        'alias': 'LISTEN'
      },
      'CLOSING': {
        'color': '#C4A000',
        'alias': 'CLOSING'
      }
    },
    'panel': {
      'title': 'Network Connections States for TCP/@metric',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };


  // collectd conntrack plugin configuration
  // collectd conntrack plugin returns measurements like this:
  //   conntrack_value,host=host.example.com,type=conntrack
  //   conntrack_value,host=host.example.com,type=conntrack,type_instance=max
  //   conntrack_value,host=host.example.com,type=percent,type_instance=used
  // so tag 'type_instance' has an empty value. To set proper value we'll
  // use collectd chains https://collectd.org/wiki/index.php/Chains
  //   LoadPlugin match_regex
  //   LoadPlugin target_replace
  //
  //   <Chain "PreCache">
  //     <Rule "conntrack_add_instance_type" >
  //       <Match "regex">
  //         Plugin "^conntrack$"
  //       </Match>
  //       <Target "replace">
  //         TypeInstance "^$" "used"
  //       </Target>
  //       Target "return"
  //     </Rule>
  //     Target "return"
  //   </Chain>
  plugins.conntrack = new Plugin();

  plugins.conntrack.conntrack = {
    'graph': {
      'used': {
        'color': '#00FF99',
        'type': 'conntrack',
      }
    },
    'panel': {
      'title': 'Network Connections Tracking Count',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.conntrack.percent = {
    'graph': {
      'used': {
        'color': '#00FF99',
        'type': 'percent',
       }
    },
    'panel': {
      'title': 'Network Connections Tracking Table Usage',
      'yaxes': [ { 'format': 'percent' }, {} ]
    }
  };


  // collectd df plugin configuration
  plugins.df = new Plugin({ 'alias': 'df' });
  plugins.df.config.multi = true;

  plugins.df.space = {
    'graph': {
      'used': {
        'color': '#447EBC',
        'type': 'df_complex',
        'alias': 'used@'
      },
      'reserved': {
        'color': '#EAB839',
        'type': 'df_complex',
        'alias': 'reserved@'
      },
      'free': {
        'color': '#508642',
        'type': 'df_complex',
        'alias': 'free@'
      }
    },
    'panel': {
      'title': 'Disk space for @metric',
      'yaxes': [ { 'format': 'bytes' }, {} ],
      'stack': true,
      'tooltip': { 'sort': 2 }
    }
  };

  plugins.df.inode = {
    'graph': {
      'used': {
        'color': '#4180A0',
        'type': 'df_inodes',
        'alias': 'used@'
      },
      'reserved': {
        'color': '#F0CD74',
        'type': 'df_inodes',
        'alias': 'reserved@'
      },
      'free': {
        'color': '#80A041',
        'type': 'df_inodes',
        'alias': 'free@'
      }
    },
    'panel': {
      'title': 'Disk inodes for @metric',
      'yaxes': [ { 'format': 'short' }, {} ],
      'stack': true,
      'tooltip': { 'sort': 2 }
    }
  };


  // collectd lvm plugin configuration
  plugins.lvm = new Plugin();
  plugins.lvm.config.multi = true;

  plugins.lvm.space = {
    'graph': { '': { } },
    'panel': {
      'title': 'Disk space for @metric',
      'yaxes': [ { 'format': 'bytes' }, {} ],
      'stack': true,
      'tooltip': { 'value_type': 'individual' }
    }
  };


  // collectd disk plugin configuration
  plugins.disk = new Plugin();
  plugins.disk.config.multi = true;
  plugins.disk.config.regexp = /[^a]$/;

  plugins.disk.diskOps = {
    'graph': {
      'read': {
        'color': '#4180A0',
        'apply': 'non_negative_derivative',
        'type': 'disk_ops',
        'alias': 'read@'
      },
      'write': {
        'color': '#80A041',
        'math': '* -1',
        'apply': 'non_negative_derivative',
        'type': 'disk_ops',
        'alias': 'write@'
      }
    },
    'panel': {
      'title': 'Disk Operations for @metric',
      'yaxes': [ { 'format': 'iops' }, {} ]
    }
  };

  plugins.disk.diskOctets = {
    'graph': {
      'read': {
        'color': '#447EBC',
        'apply': 'non_negative_derivative',
        'type': 'disk_octets',
        'alias': 'read@'
      },
      'write': {
        'color': '#508642',
        'math': '* -1',
        'apply': 'non_negative_derivative',
        'type': 'disk_octets',
        'alias': 'write@'
      }
    },
    'panel': {
      'title': 'Disk Octets for @metric',
      'yaxes': [ { 'format': 'bytes' }, {} ]
    }
  };

  plugins.disk.diskTime = {
    'graph': {
      'read': {
        'color': '#D29C57',
        'apply': 'non_negative_derivative',
        'type': 'disk_time',
        'alias': 'read@'
      },
      'write': {
        'color': '#D25E57',
        'math': '* -1',
        'apply': 'non_negative_derivative',
        'type': 'disk_time',
        'alias': 'write@'
      }
    },
    'panel': {
      'title': 'Disk Wait for @metric',
      'yaxes': [ { 'format': 'ms' }, {} ]
    }
  };


  // collectd hddtemp plugin configuration
  plugins.hddtemp = new Plugin();

  plugins.hddtemp.temperature = {
    'graph': {
       '': { }
     },
    'panel': {
      'title': 'Disk Temperature',
      'yaxes': [ { 'format': 'celsius' }, {} ]
    }
  };


  // collectd processes plugin configuration
  plugins.processes = new Plugin({ 'alias': 'ps' });

  plugins.processes.state = {
    'graph': {
      'sleeping': {
        'type': 'ps_state',
        'color': '#EAB839',
        'alias': 'sleeping@'
      },
      'running': {
        'type': 'ps_state',
        'color': '#508642',
        'alias': 'running@'
      },
      'stopped': {
        'type': 'ps_state',
        'color': '#E9967A',
        'alias': 'stopped@'
      },
      'blocked': {
        'type': 'ps_state',
        'color': '#890F02',
        'alias': 'blocked@'
      },
      'zombies': {
        'type': 'ps_state',
        'color': '#E24D42',
        'alias': 'zombies@'
      },
      'paging': {
        'type': 'ps_state',
        'color': '#9400D3',
        'alias': 'paging@'
      }
    },
    'panel': {
      'title': 'Processes State',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.processes.fork = {
    'graph': {
      'processes': {
        'color': '#BA43A9',
        'alias': 'forks@',
        'apply': 'non_negative_derivative',
        'type': 'fork_rate'
      }
    },
    'panel': {
      'title': 'Processes Fork Rate',
      'fill': 3,
      'yaxes': [ { 'format': 'pps', 'min': 0 }, {} ]
    }
  };

  plugins.processes.psVM = {
    'graph': {
      'processes': {
        'type': 'ps_vm',
        'alias': 'vm'
      }
    },
    'panel': {
      'title': 'Processes VM',
      'yaxes': [ { 'format': 'bytes' }, {} ]
    }
  };

  plugins.processes.psStackSize = {
    'graph': {
      'processes': {
        'type': 'ps_stacksize',
        'alias': 'stacksize'
      }
    },
    'panel': {
      'title': 'Processes Stack Size',
      'yaxes': [ { 'format': 'bytes' }, {} ]
    }
  };

  plugins.processes.psRSS = {
    'graph': {
      'processes': {
        'type': 'ps_rss',
        'alias': 'rss'
      }
    },
    'panel': {
      'title': 'Processes RSS',
      'yaxes': [ { 'format': 'bytes' }, {} ]
    }
  };


  // collectd processes plugin configuration with individual metrics
  plugins.process = new Plugin({ 'alias': 'process' });
  plugins.process.config.multi = true;

  plugins.process.psCount = {
    'graph': {
      'threads': {
        'color': '#508642',
        'type': 'ps_count',
        'alias': 'threads'
      },
      '_processes': {
        'color': '#EAB839',
        'type': 'ps_count',
        'alias': 'processes'
      }
    },
    'panel': {
      'title': 'Processes/Threads Count for @metric',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.process.psCpuTime = {
    'graph': {
      'syst': {
        'color': '#EAB839', 
        'type': 'ps_cputime',
        'apply': 'derivative',
        'alias': 'cpu-system'
      },
      'user': {
        'color': '#508642',
        'type': 'ps_cputime',
        'apply': 'derivative',
        'alias': 'cpu-user'
      }
    },
    'panel': {
      'title': 'Process CPU Time for @metric',
      'stack': true,
      'tooltip': { 'value_type': 'individual' },
      'yaxes': [ { 'format': 'µs' }, {} ]
    }
  };

  plugins.process.psPageFaults = {
    'graph': {
      'majflt': {
        'color': '#890F02',
        'type': 'ps_pagefaults',
        'apply': 'derivative',
        'alias': 'faults-major'
      },
      'minflt': {
        'color': '#C15C17',
        'type': 'ps_pagefaults',
        'apply': 'derivative',
        'alias': 'faults-minor'
      }
    },
    'panel': {
      'title': 'Process Page Faults for @metric',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.process.psDiskOps = {
    'graph': {
      'read': {
        'color': '#447EBC',
        'type': 'ps_disk_ops',
        'apply': 'derivative',
        'alias': 'ops-read'
      },
      'write': {
        'color': '#508642',
        'type': 'ps_disk_ops',
        'math': '* -1',
        'apply': 'derivative',
        'alias': 'ops-write'
      }
    },
    'panel': {
      'title': 'Process Disk Ops for @metric',
      'yaxes': [ { 'format': 'iops', 'min': null }, {} ]
    }
  };

  plugins.process.psDiskOctets = {
    'graph': {
      'read': {
        'color': '#447EBC',
        'type': 'ps_disk_octets',
        'apply': 'derivative',
        'alias': 'bytes-read'
      },
      'write': {
        'color': '#508642',
        'type': 'ps_disk_octets',
        'math': '* -1',
        'apply': 'derivative',
        'alias': 'bytes-write'
      }
    },
    'panel': {
      'title': 'Process Disk Octets for @metric',
      'yaxes': [ { 'format': 'bps', 'min': null }, {} ]
    }
  };

  plugins.process.psCodeData = {
    'graph': {
      'processes': {
        'color': '#EAB839',
        'type': 'ps_code',
        'alias': 'size-code'
      },
      'value': {
        'color': '#508642',
        'type': 'ps_data',
        'alias': 'size-data'
      }
    },
    'panel': {
      'title': 'Process Code and Data for @metric',
      'stack': true,
      'tooltip': { 'value_type': 'individual' },
      'yaxes': [ { 'format': 'bytes' }, {} ]
    }
  };

  plugins.process.psVM = {
    'graph': {
      'processes': {
        'type': 'ps_vm',
        'alias': 'vm'
      }
    },
    'panel': {
      'title': 'Process VM for @metric',
      'yaxes': [ { 'format': 'bytes' }, {} ]
    }
  };

  plugins.process.psStackSize = {
    'graph': {
      'processes': {
        'type': 'ps_stacksize',
        'alias': 'stacksize'
      }
    },
    'panel': {
      'title': 'Process Stack Size for @metric',
      'yaxes': [ { 'format': 'bytes' }, {} ]
    }
  };

  plugins.process.psRSS = {
    'graph': {
      'processes': {
        'type': 'ps_rss',
        'alias': 'rss'
      }
    },
    'panel': {
      'title': 'Process RSS for @metric',
      'yaxes': [ { 'format': 'bytes' }, {} ]
    }
  };


  // collectd entropy plugin configuration
  plugins.entropy = new Plugin();

  plugins.entropy.entropy = {
    'graph': {
      'entropy': { 'color': '#1F78C1' }
    },
    'panel': {
      'title': 'Entropy',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };


  // collectd users plugin configuration
  plugins.users = new Plugin();

  plugins.users.users = {
    'graph': {
      'users': {
        'color': '#CCFF66',
        'alias': 'users@',
        'apply': 'max'
      }
    },
    'panel': {
      'title': 'Users',
      'yaxes': [ { 'format': 'short', 'min': 0 }, {} ]
    }
  };


  // collectd uptime plugin configuration
  plugins.uptime = new Plugin();

  plugins.uptime.uptime = {
    'graph': {
      'uptime': { 'color': '#00FF99' }
    },
    'panel': {
      'title': 'System Uptime',
      'yaxes': [ { 'format': 's' }, {} ]
    }
  };


  // collectd redis plugin configuration: https://github.com/powdahound/redis-collectd-plugin
  plugins.redis = new Plugin({ 'alias': 'redis' });

  plugins.redis.cpu = {
    'graph': {
      'used_cpu_sys_children': {
        'color': '#F2D488',
        'apply': 'derivative',
        'alias': '@instance.cpu-system-children'
      },
      'used_cpu_user_children': {
        'color': '#96B68D',
        'apply': 'derivative',
        'alias': '@instance.cpu-user-children'
      },
      '/^used_cpu_sys$/': {
        'color': '#EAB839',
        'apply': 'derivative',
        'alias': '@instance.cpu-system'
      },
      '/^used_cpu_user$/': {
        'color': '#508642',
        'apply': 'derivative',
        'alias': '@instance.cpu-user'
      }
    },
    'panel': {
      'title': 'Redis CPU Time',
      'stack': true,
      'tooltip': { 'value_type': 'individual' },
      'yaxes': [ { 'format': 's' }, {} ]
    }
  };

  plugins.redis.memory = {
    'graph': {
      'used_memory_rss': {
        'color': '#EAB839',
        'alias': '@instance.memory-used-rss'
      },
      'used_memory_peak': {
        'color': '#447EBC',
        'alias': '@instance.memory-used-peak'
      },
      '/^used_memory$/': {
        'color': '#508642',
        'alias': '@instance.memory-used'
      }
    },
    'panel': {
      'title': 'Redis Memomy',
      'yaxes': [ { 'format': 'bytes' }, {} ]
    }
  };

  plugins.redis.uptime = {
    'graph': {
      'uptime_in_seconds': {
        'color': '#00FF99'
      }
    },
    'panel': {
      'title': 'Redis Uptime',
      'yaxes': [ { 'format': 's' }, {} ]
    }
  };

  plugins.redis.commandsOps = {
    'graph': {
      'instantaneous_ops_per_sec': {
        'color': '#6600FF',
        'alias': '@instance.ops'
      },
      'commands_processed': {
        'color': '#FF6600',
        'apply': 'derivative',
        'alias': '@instance.commands'
      }
    },
    'panel': {
      'title': 'Redis Commands',
      'yaxes': [ { 'format': 'ops' }, {} ]
    }
  };

  plugins.redis.connections = {
    'graph': {
      'connections_received': {
        'color': '#447EBC',
        'apply': 'derivative',
        'alias': '@instance.connections-received'
      },
      'rejected_connections': {
        'color': '#FF6600',
        'apply': 'derivative',
        'alias': '@instance.connections-rejected'
      },
      'connected_clients': {
        'color': '#508642',
        'apply': 'derivative',
        'alias': '@instance.clients-connected'
      },
      'blocked_clients': {
        'color': '#E24D42',
        'apply': 'derivative',
        'alias': '@instance.clients-blocked'
      }
    },
    'panel': {
      'title': 'Redis Connections',
      'yaxes': [ { 'format': 'ops' }, {} ]
    }
  };

  plugins.redis.unsaved = {
    'graph': {
      'changes_since_last_save': {
        'color': '#E24D42',
        'alias': '@instance.changes-unsaved'
      }
    },
    'panel': {
      'title': 'Redis Unsaved Changes',
      'yaxes': [ { 'format': 'short' }, {} ],
      'fill': 2
    }
  };

  plugins.redis.slaves = {
    'graph': {
      'connected_slaves': {
        'color': '#508642',
        'alias': '@instance.slaves'
      }
    },
    'panel': {
      'title': 'Redis Connected Slaves',
      'fill': 2
    }
  };

  plugins.redis.hitstMisses = {
    'graph': {
      'keyspace_hits': {
        'color': '#00FF66',
        'apply': 'derivative',
        'alias': '@instance.key-hits'
      },
      'keyspace_misses': {
        'color': '#FF6600',
        'apply': 'derivative',
        'alias': '@instance.key-misses'
      }
    },
    'panel': {
      'title': 'Redis DB Keyspace',
      'yaxes': [ { 'format': 'percent' }, {} ]
    }
  };

  plugins.redis.keys = {
    'graph': {
      '/keys$/': {
        'alias': '@instance.@description'
      }
    },
    'panel': {
      'title': 'Redis DB Keys',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.redis.repl = {
    'graph': {
      'master_repl_offset': {
        'color': '#508642',
        'alias': '@instance.master-repl-offset'
      },
      'slave_repl_offset': {
        'color': '#E24D42',
        'alias': '@instance.slave-repl-offset'
      }
    },
    'panel': {
      'title': 'Redis Replication Offset',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.redis.replLag = {
    'graph': {
      '/lag$/': {
        'alias': '@instance.@description'
      }
    },
    'panel': {
      'title': 'Redis Replication Lag',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };


  // collectd memcached plugin configuration
  plugins.memcache = new Plugin({ 'alias': 'mc' });

  plugins.memcache.memory = {
    'graph': {
      'used': {
        'color': '#447EBC',
        'alias': 'used'
      },
      'free': {
        'color': '#508642',
        'alias': 'free'
      }
    },
    'panel': {
      'title': 'Memcached Memomy',
      'yaxes': [ { 'format': 'bytes' }, {} ],
      'stack': true,
      'tooltip': { 'value_type': 'individual' }
    }
  };

  plugins.memcache.connections = {
    'graph': {
      'current': { 'type': 'memcached_connections' }
    },
    'panel': {
      'title': 'Memcached Connections',
      'yaxes': [ { 'format': 'bytes' }, {} ]
    }
  };

  plugins.memcache.items = {
    'graph': {
      'current': { 'type': 'memcached_items' }
    },
    'panel': {
      'title': 'Memcached Items',
      'yaxes': [ { 'format': 'bytes' }, {} ]
    }
  };

  plugins.memcache.commands = {
    'graph': {
      'flush': { 'apply': 'derivative' },
      'get': { 'apply': 'derivative' },
      'set': { 'apply': 'derivative' },
      'touch': { 'apply': 'derivative' }
    },
    'panel': {
      'title': 'Memcached Commands',
      'yaxes': [ { 'format': 'ops' }, {} ]
    }
  };

  plugins.memcache.octets = {
    'graph': {
      'tx': {
        'color': '#447EBC',
        'apply': 'derivative'
      },
      'rx': {
        'color': '#508642',
        'math': '* -1',
        'apply': 'derivative'
      }
    },
    'panel': {
      'title': 'Memcached Traffic',
      'yaxes': [ { 'format': 'bps', 'min': null }, {} ]
    }
  };

  plugins.memcache.operations = {
    'graph': {
      'hits': { 'apply': 'derivative' },
      'misses': { 'apply': 'derivative' },
      'evictions': { 'apply': 'derivative' },
      'incr_hits': { 'apply': 'derivative' },
      'decr_hits': { 'apply': 'derivative' },
      'incr_misses': { 'apply': 'derivative' },
      'decr_misses': { 'apply': 'derivative' }
    },
    'panel': {
      'title': 'Memcached Operations',
      'yaxes': [ { 'format': 'ops' }, {} ]
    }
  };

  plugins.memcache.hits = {
    'graph': {
      'hitratio': { }
    },
    'panel': {
      'title': 'Memcached Hitratio',
      'yaxes': [ { 'format': 'percent' }, {} ]
    }
  };

  plugins.memcache.ps = {
    'graph': {
      'processes': { },
      'threads': { }
    },
    'panel': {
      'title': 'Memcached Process Stats',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.memcache.cpu = {
    'graph': {
      'syst': {
        'color': '#EAB839',
        'apply': 'derivative'
      },
      'user': {
        'color': '#508642',
        'apply': 'derivative'
      }
    },
    'panel': {
      'title': 'Memcached CPU Time',
      'stack': true,
      'tooltip': { 'value_type': 'individual' }
    }
  };

  // collectd rabbitmq plugin configuration: https://github.com/kozdincer/rabbitmq_collectd_plugin
  plugins.rabbitmq = new Plugin({ 'alias': 'rmq' });

  plugins.rabbitmq.rates = {
    'graph': {
      'ack_rate': { 'alias': 'rate-ack' },
      'deliver_rate': { 'alias': 'rate-deliver' },
      'publish_rate': { 'alias': 'rate-publish' }
    },
    'panel': {
      'title': 'RabbitMQ Rates'
    }
  };

  plugins.rabbitmq.channels = {
    'graph': {
      'channels': { 'alias': 'channels' },
      'queues': { 'alias': 'queues' }
    },
    'panel': {
      'title': 'RabbitMQ Channels and Queues',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.rabbitmq.connections = {
    'graph': {
      'connections': { 'alias': 'connections' },
      'consumers': { 'alias': 'consumers' },
      'exchanges': { 'alias': 'exchanges' }
    },
    'panel': {
      'title': 'RabbitMQ Connections',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.rabbitmq.messages = {
    'graph': {
      'messages_total': { 'alias': 'messages-total' },
      'messages_unack': { 'alias': 'messages-unack' },
      'messages_ready': { 'alias': 'messages-ready' }
    },
    'panel': {
      'title': 'RabbitMQ Messages',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.rabbitmq.fd = {
    'graph': {
      'fd_total': {
        'color': '#508642',
        'alias': 'fd-total'
      },
      'fd_used': {
        'color': '#447EBC',
        'alias': 'fd-used'
      }
    },
    'panel': {
      'title': 'RabbitMQ File Descriptors',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.rabbitmq.memory = {
    'graph': {
      'mem_limit': {
        'color': '#508642',
        'alias': 'mem-limit'
      },
      'mem_used': {
        'color': '#447EBC',
        'alias': 'mem-used'
      }
    },
    'panel': {
      'title': 'RabbitMQ Memory',
      'yaxes': [ { 'format': 'bytes' }, {} ]
    }
  };

  plugins.rabbitmq.proc = {
    'graph': {
      'proc_total': {
        'color': '#508642',
        'alias': 'proc-total'
      },
      'proc_used': {
        'color': '#447EBC',
        'alias': 'proc-used'
      }
    },
    'panel': {
      'title': 'RabbitMQ Proc',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.rabbitmq.sockets = {
    'graph': {
      'sockets_total': {
        'color': '#508642',
        'alias': 'sockets-total'
      },
      'sockets_used': {
        'color': '#447EBC',
        'alias': 'sockets-used'
      }
    },
    'panel': {
      'title': 'RabbitMQ Sockets',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };


  // collectd elasticsearch plugin configuration: https://github.com/signalfx/collectd-elasticsearch
  plugins.elasticsearch = new Plugin({ 'alias': 'es' });

  plugins.elasticsearch.psCpu = {
    'graph': {
      'process.cpu.percent': {
        'color': '#EA6460',
        'alias': 'cpu@'
      }
    },
    'panel': {
      'title': 'ElasticSearch CPU Usage for @metric',
      'yaxes': [ { 'format': 'percent', 'max': 100 }, {} ]
    }
  };

  plugins.elasticsearch.idxStorage = {
    'graph': {
      'indices.store.size': {
        'color': '#1F78C1',
        'alias': 'index-data@'
      }
    },
    'panel': {
      'title': 'ElasticSearch Index Storage for @metric',
      'yaxes': [ { 'format': 'bytes' }, {} ]
    }
  };

  plugins.elasticsearch.openFiles = {
    'graph': {
      'process.open_file_descriptors': {
        'color': '#65C5DB',
        'alias': 'open-files@'
      }
    },
    'panel': {
      'title': 'ElasticSearch Open Files for @metric',
      'yaxes': [ { 'format': 'short', 'min': 0 }, {} ]
    }
  };

  plugins.elasticsearch.httpConns = {
    'graph': {
      'http.current_open': {
        'color': '#B3FF00',
        'alias': 'http-conns@'
      }
    },
    'panel': {
      'title': 'ElasticSearch HTTP Conns for @metric',
      'yaxes': [ { 'format': 'short', 'min': 0 }, {} ]
    }
  };

  plugins.elasticsearch.serverConns = {
    'graph': {
      'transport.server_open': {
        'color': '#B3FF00',
        'alias': 'server-conns@'
      }
    },
    'panel': {
      'title': 'ElasticSearch Server Conns for @metric',
      'yaxes': [ { 'format': 'short', 'min': 0 }, {} ]
    }
  };

  plugins.elasticsearch.transportCount = {
    'graph': {
      'transport.rx.count': {
        'color': '#447EBC',
        'apply': 'derivative',
        'alias': 'in@'
      },
      'transport.tx.count': {
        'color': '#508642',
        'apply': 'derivative',
        'math': '* -1',
        'alias': 'out@'
      }
    },
    'panel': {
      'title': 'ElasticSearch Network Packets for @metric',
      'yaxes': [ { 'format': 'pps' }, {} ]
    }
  };

  plugins.elasticsearch.transportSize = {
    'graph': {
      'transport.rx.size': {
        'color': '#447EBC',
        'apply': 'derivative',
        'alias': 'in@'
      },
      'transport.tx.size': {
        'color': '#508642',
        'math': '* -1',
        'apply': 'derivative',
        'alias': 'out@'
      }
    },
    'panel': {
      'title': 'ElasticSearch Network Data for @metric',
      'yaxes': [ { 'format': 'bps' }, {} ]
    }
  };

  plugins.elasticsearch.idxTimes = {
    'graph': {
      '/^indices\\..*time$/': {
        'apply': 'derivative',
        'alias': '@description'
      }
    },
    'panel': {
      'title': 'ElasticSearch Indices Times for @metric',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'ms' }, {} ]
    }
  };

  plugins.elasticsearch.idxOpsTotals = {
    'graph': {
      '/^indices\\.(get|search|flush|refresh|merges)\\..*total$/': {
        'apply': 'derivative',
        'alias': '@description'
      }
    },
    'panel': {
      'title': 'ElasticSearch Indices Actions for @metric',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.elasticsearch.idxIndexerTotals = {
    'graph': {
      '/^indices\\.indexing\\..*-total$/': {
        'apply': 'derivative',
        'alias': '@description'
      }
    },
    'panel': {
      'title': 'ElasticSearch Indexing for @metric',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.elasticsearch.idxDocs = {
    'graph': {
      '/^indices\\.docs\\./': {
        'apply': 'derivative',
        'alias': '@description'
      }
    },
    'panel': {
      'title': 'ElasticSearch Indices Docs for @metric',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.elasticsearch.idxCacheEvictions = {
    'graph': {
      '/^indices\\.cache\\..*\\.eviction(s)?$/': {
        'apply': 'derivative',
        'alias': '@description'
      }
    },
    'panel': {
      'title': 'ElasticSearch Indices Cache Evictions for @metric',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'ops', 'min': 0 }, {} ]
    }
  };

  plugins.elasticsearch.jvmHeapPercent = {
    'graph': {
      'jvm.mem.heap-used-percent': {
        'color': '#65C5DB',
        'alias': 'heap-used@'
      }
    },
    'panel': {
      'title': 'ElasticSearch JVM Heap Usage for @metric',
      'yaxes': [ { 'format': 'percent', 'max': 100 }, {} ]
    }
  };

  plugins.elasticsearch.jvmMemHeap = {
    'graph': {
      'jvm.mem.heap-committed': {
        'color': '#508642',
        'alias': 'heap-commited@'
      },
      '/jvm.mem.heap-used$/': {
        'color': '#447EBC',
        'alias': 'heap-used@'
      }
    },
    'panel': {
      'title': 'ElasticSearch JVM Heap Memory Usage for @metric',
      'yaxes': [ { 'format': 'bytes' }, {} ]
    }
  };

  plugins.elasticsearch.jvmMemNonHeap = {
    'graph': {
      'jvm.mem.non-heap-committed': {
        'color': '#508642',
        'alias': 'non-heap-commited@'
      },
      'jvm.mem.non-heap-used': {
        'color': '#447EBC',
        'alias': 'non-heap-used@'
      }
    },
    'panel': {
      'title': 'ElasticSearch JVM Non Heap Memory Usage for @metric',
      'yaxes': [ { 'format': 'bytes' }, {} ]
    }
  };

  plugins.elasticsearch.jvmThreads = {
    'graph': {
      'jvm.threads.peak': {
        'color': '#508642',
        'alias': 'threads-peak@'
      },
      'jvm.threads.count': {
        'color': '#447EBC',
        'alias': 'threads@'
      }
    },
    'panel': {
      'title': 'ElasticSearch JVM Threads for @metric',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.elasticsearch.jvmGCCount = {
    'graph': {
      'jvm.gc.old-count': {
        'color': '#B7DBAB',
        'apply': 'derivative',
        'alias': 'gc-old@'
      },
      'jvm.gc.count': {
        'color': '#F2C96D',
        'apply': 'derivative',
        'alias': 'gc@'
      }
    },
    'panel': {
      'title': 'ElasticSearch JVM GC Count for @metric',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'ops' }, {} ]
    }
  };

  plugins.elasticsearch.jvmGCTime = {
    'graph': {
      'jvm.gc.old-time': {
        'color': '#B7DBAB',
        'apply': 'derivative',
        'alias': 'gc-old@'
      },
      'jvm.gc.time': {
        'color': '#F2C96D',
        'apply': 'derivative',
        'alias': 'gc@'
      }
    },
    'panel': {
      'title': 'ElasticSearch JVM GC Time for @metric',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'ms' }, {} ]
    }
  };


  // collectd nginx plugin
  plugins.nginx = new Plugin();

  plugins.nginx.requests = {
    'graph': {
      'nginx': {
        'apply': 'derivative',
        'alias': 'requests',
        'type': 'nginx_requests'
      }
    },
    'panel': {
      'title': 'Nginx Requests',
      'yaxes': [ { 'format': 'ops' }, {} ]
    }
  };

  plugins.nginx.connections = {
    'graph': {
      'accepted': {
        'color': '#1F78C1',
        'apply': 'derivative'
      },
      'handled': {
        'color': '#629E51',
        'apply': 'derivative'
      }
    },
    'panel': {
      'title': 'Nginx Connections',
      'yaxes': [ { 'format': 'ops' }, {} ]
    }
  };

  plugins.nginx.connStates = {
    'graph': {
      'active': { },
      'reading': { },
      'waiting': { },
      'writing': { }
    },
    'panel': {
      'title': 'Nginx Connections States',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };


  // collectd apache plugin
  plugins.apache = new Plugin({ 'alias': 'apache' });

  plugins.apache.traffic = {
    'graph': {
      'apache_value': {
        'type': 'apache_bytes',
        'color': '#508642',
        'alias': 'tx',
        'apply': 'derivative',
        'math': '* 8'
      }
    },
    'panel': {
      'title': 'Apache Network Traffic',
      'yaxes': [ { 'format': 'bps' }, {} ]
    }
  };

  plugins.apache.connections = {
    'graph': {
      'apache_value': {
        'type': 'apache_connections',
        'color': '#00FF99',
        'alias': 'connections',
        'apply': 'max'
      }
    },
    'panel': {
      'title': 'Apache Connections',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.apache.idleWorkers = {
    'graph': {
      'apache_value': {
        'type': 'apache_idle_workers',
        'color': '#3636FF',
        'alias': 'idle_workers',
        'apply': 'max'
      }
    },
    'panel': {
      'title': 'Apache Idle Workers',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.apache.requests = {
    'graph': {
      'apache_value': {
        'type': 'apache_requests',
        'color': '#73E3EB',
        'alias': 'requests',
        'apply': 'derivative'
      }
    },
    'panel': {
      'title': 'Apache Requests',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.apache.apacheScoreboard = {
    'graph': {
      'open': { 'color': '#FCE94F' },
      'starting': { 'color': '#FCAF3E' },
      'reading': { 'color': '#8AE234' },
      'keepalive': { 'color': '#729FCF' },
      'dnslookup': { 'color': '#AD7FA8' },
      'logging': { 'color': '#EF2929' },
      'finishing': { 'color': '#D3D7CF' },
      'idle_cleanup': { 'color': '2E3436' },
      'waiting': { 'color': '#4E9A06' },
      'closing': { 'color': '#CE5C00' },
      'sending': { 'color': '#C4A000' }
    },
    'panel': {
      'title': 'Apache Scoreboard',
      'yaxes': [ { 'format': 'short' }, {} ],
      'tooltip': { 'value_type': 'individual' }
    }
  };


  // collectd mysql plugin configuration
  plugins.mysql = new Plugin();
  plugins.mysql.config.multi = true;

  plugins.mysql.commands = {
    'graph': {
      '': {
        'apply': 'derivative',
        'type': 'mysql_commands'
      }
    },
    'panel': {
      'title': 'MySQL commands for @metric',
      'stack': true,
      'tooltip': { 'value_type': 'individual' },
      'yaxes': [ { 'format': 'ops' }, {} ]
    }
  };

  plugins.mysql.handlers = {
    'graph': {
      '': {
        'apply': 'derivative',
        'type': 'mysql_handler'
      }
    },
    'panel': {
      'title': 'MySQL handlers for @metric',
      'stack': true,
      'tooltip': { 'value_type': 'individual' },
      'yaxes': [ { 'format': 'ops' }, {} ]
    }
  };

  plugins.mysql.locks = {
    'graph': {
      'immediate': {
        'color': '#508642',
        'apply': 'derivative',
        'type': 'mysql_locks'
      },
      'waited': {
        'color': '#BF1B00',
        'apply': 'derivative',
        'type': 'mysql_locks'
      }
    },
    'panel': {
      'title': 'MySQL locks for @metric',
      'stack': true,
      'tooltip': { 'value_type': 'individual' },
      'yaxes': [ { 'format': 'ops' }, {} ],
      'fill': 5
    }
  };

  plugins.mysql.select = {
    'graph': {
      'full_join': {
        'color': '#EAB839',
        'apply': 'derivative',
        'type': 'mysql_select'
      },
      'full_range_join': {
        'color': '#EF843C',
        'apply': 'derivative',
        'type': 'mysql_select'
      },
      '/range$/': {
        'color': '#6ED0E0',
        'apply': 'derivative',
        'type': 'mysql_select'
      },
      'range_check': {
        'color': '#1F78C1',
        'apply': 'derivative',
        'type': 'mysql_select'
      },
      'scan': {
        'color': '#E24D42',
        'apply': 'derivative',
        'type': 'mysql_select'
      }
    },
    'panel': {
      'title': 'MySQL select for @metric',
      'stack': true,
      'tooltip': { 'value_type': 'individual' },
      'yaxes': [ { 'format': 'ops' }, {} ],
      'fill': 5
    }
  };

  plugins.mysql.sort = {
    'graph': {
      'merge_passes': {
        'color': '#EAB839',
        'apply': 'derivative',
        'type': 'mysql_sort'
      },
      'range': {
        'color': '#6ED0E0',
        'apply': 'derivative',
        'type': 'mysql_sort'
      },
      'rows': {
        'color': '#1F78C1',
        'apply': 'derivative',
        'type': 'mysql_sort'
      },
      'scan': {
        'color': '#E24D42',
        'apply': 'derivative',
        'type': 'mysql_sort'
      }
    },
    'panel': {
      'title': 'MySQL sort for @metric',
      'stack': true,
      'tooltip': { 'value_type': 'individual' },
      'yaxes': [ { 'format': 'ops' }, {} ],
      'fill': 5
    }
  };

  plugins.mysql.threads = {
    'graph': {
      'cached': {
        'color': '#508642',
        'type': 'threads'
      },
      'connected': {
        'color': '#EAB839',
        'type': 'threads'
      },
      'running': {
        'color': '#890F02',
        'type': 'threads'
      },
      'created': {
        'color': '#2F575E',
        'apply': 'derivative',
        'type': 'total_threads'
      }
    },
    'panel': {
      'title': 'MySQL threads for @metric',
      'stack': true,
      'tooltip': { 'value_type': 'individual' },
      'yaxes': [ { 'format': 'short' }, {} ],
    }
  };

  plugins.mysql.qcache = {
    'graph': {
      'qcache-hits': {
        'color': '#508642',
        'apply': 'derivative',
        'type': 'cache_result'
      },
      'qcache-inserts': {
        'color': '#6ED0E0',
        'apply': 'derivative',
        'type': 'cache_result'
      },
      'qcache-not_cached': {
        'color': '#EAB839',
        'apply': 'derivative',
        'type': 'cache_result'
      },
      'qcache-prunes': {
        'color': '#890F02',
        'apply': 'derivative',
        'type': 'cache_result'
      }
    },
    'panel': {
      'title': 'MySQL Query Cache for @metric',
      'stack': true,
      'tooltip': { 'value_type': 'individual' },
      'yaxes': [ { 'format': 'ops' }, {} ],
      'fill': 5
    }
  };

  plugins.mysql.qcache_size = {
    'graph': {
      'qcache': {
        'color': '#1F78C1',
        'alias': 'queries',
        'type': 'cache_size'
      }
    },
    'panel': {
      'title': 'MySQL Query Cache Size for @metric',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mysql.traffic = {
    'graph': {
      'rx': {
        'color': '#447EBC',
        'alias': 'rx',
        'apply': 'derivative',
        'math': '* -8',
        'type': 'mysql_octets'
      },
      'tx': {
        'color': '#508642',
        'alias': 'tx',
        'apply': 'derivative',
        'math': '* 8',
        'type': 'mysql_octets'
      }
    },
    'panel': {
      'title': 'MySQL Network Traffic on @metric',
      'yaxes': [ { 'format': 'bps', 'min': null }, {} ]
    }
  };


  // collectd postgresql plugin configuration
  plugins.postgresql = new Plugin({ 'alias': 'psql' });
  plugins.postgresql.config.multi = true;

  plugins.postgresql.numBackends = {
    'graph': {
      'postgresql': { 'type': 'pg_numbackends' }
    },
    'panel': {
      'title': 'PostgreSQL Connected backends for @metric',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.postgresql.commitRollback = {
    'graph': {
      'postgresql': { 'type': 'pg_xact', 'apply': 'derivative' }
    },
    'panel': {
      'title': 'PostgreSQL Transactions for @metric',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.postgresql.ops = {
    'graph': {
      'postgresql': { 'type': 'pg_n_tup_c', 'apply': 'derivative' }
    },
    'panel': {
      'title': 'PostgreSQL Operations for @metric',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.postgresql.rows = {
    'graph': {
      'postgresql': { 'type': 'pg_n_tup_g', 'apply': 'derivative' }
    },
    'panel': {
      'title': 'PostgreSQL Rows for @metric',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.postgresql.idx = {
    'graph': {
      'idx': { 'type': 'pg_blks', 'apply': 'derivative' }
    },
    'panel': {
      'title': 'PostgreSQL Disk and Buffer Index Stats for @metric',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.postgresql.tidx = {
    'graph': {
      'tidx': { 'type': 'pg_blks', 'apply': 'derivative' }
    },
    'panel': {
      'title': 'PostgreSQL Disk and Buffer Stats for @metric',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.postgresql.dbSize = {
    'graph': {
      'postgresql': { 'type': 'pg_db_size', 'alias': 'size' }
    },
    'panel': {
      'title': 'PostgreSQL DB Size for @metric',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };


  // collectd zookeeper plugin configuration: https://github.com/signalfx/collectd-zookeeper
  plugins.zookeeper = new Plugin({ 'alias': 'zk' });
  plugins.zookeeper.config.multi = true;

  plugins.zookeeper.followers = {
    'graph': {
      'zk_followers': {
        'color': '#FFCC00',
        'alias': '@instance.followers-total'
      },
      'zk_synced_followers': {
        'color': '#B3FF00',
        'alias': '@instance.followers-synced'
      }
    },
    'panel': {
      'title': 'Zookeeper followers for @metric',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.zookeeper.conn = {
    'graph': {
      'connections': {
        'color': '#508642',
        'alias': '@instance.connections'
      }
    },
    'panel': {
      'title': 'Zookeeper connections for @metric',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.zookeeper.req = {
    'graph': {
      'outstanding_requests': {
        'color': '#FFCC00',
        'apply': 'max',
        'alias': '@instance.outstanding-requests'
      },
      'pending_syncs': {
        'color': '#CC00FF',
        'apply': 'max',
        'alias': '@instance.pending-syncs'
      }
    },
    'panel': {
      'title': 'Zookeeper requests and syncs for @metric',
      'yaxes': [ { 'format': 'short', 'min': 0 }, {} ]
    }
  };

  plugins.zookeeper.watch = {
    'graph': {
      'watch_count': {
        'color': '#70DBED',
        'apply': 'max',
        'alias': '@instance.watches'
      }
    },
    'panel': {
      'title': 'Zookeeper watches for @metric',
      'yaxes': [ { 'format': 'short', 'min': 0 }, {} ]
    }
  };

  plugins.zookeeper.leader = {
    'graph': {
      'is_leader': {
        'color': '#508642',
        'apply': 'max',
        'alias': '@instance.leader'
      }
    },
    'panel': {
      'title': 'Zookeeper leader for @metric',
      'yaxes': [ { 'format': 'short', 'min': 0 }, {} ]
    }
  };

  plugins.zookeeper.nodes = {
    'graph': {
      'znode_count': {
        'color': '#EF843C',
        'apply': 'max',
        'alias': '@instance.znodes'
      },
      'ephemerals_count': {
        'color': '#AEA2E0',
        'apply': 'max',
        'alias': '@instance.ephemerals'
      }
    },
    'panel': {
      'title': 'Zookeeper nodes for @metric',
      'yaxes': [ { 'format': 'short', 'min': 0 }, {} ]
    }
  };

  plugins.zookeeper.data = {
    'graph': {
      'data_size': {
        'color': '#508642',
        'alias': '@instance.data'
      }
    },
    'panel': {
      'title': 'Zookeeper data for @metric',
      'yaxes': [ { 'format': 'bytes', 'min': 0 }, {} ]
    }
  };

  plugins.zookeeper.files = {
    'graph': {
      'max_file_descriptor_count': {
        'color': '#508642',
        'alias': '@instance.max'
      },
      'open_file_descriptor_count': {
        'color': '#447EBC',
        'alias': '@instance.open'
      }
    },
    'panel': {
      'title': 'Zookeeper files for @metric',
      'yaxes': [ { 'format': 'short', 'min': 0 }, {} ]
    }
  };

  plugins.zookeeper.packets = {
    'graph': {
      'packets_sent': {
        'color': '#447EBC',
        'apply': 'derivative',
        'math': '* -1',
        'alias': '@instance.sent'
      },
      'packets_received': {
        'color': '#508642',
        'apply': 'derivative',
        'alias': '@instance.received'
      }
    },
    'panel': {
      'title': 'Zookeeper packets for @metric',
      'yaxes': [ { 'format': 'pps' }, {} ]
    }
  };

  plugins.zookeeper.latency = {
    'graph': {
      'max_latency': {
        'color': '#82B5D8',
        'alias': '@instance.max'
      },
      'avg_latency': {
        'color': '#EAB839',
        'alias': '@instance.avg'
      },
      'min_latency': {
        'color': '#7EB26D',
        'alias': '@instance.min'
      }
    },
    'panel': {
      'title': 'Zookeeper latency for @metric',
      'yaxes': [ { 'format': 'ms', 'min': 0 }, {} ]
    }
  };


  // collectd mesos plugin configuration: https://github.com/rayrod2030/collectd-mesos
  plugins.mesos = new Plugin({ 'alias': 'mo' });

  plugins.mesos.cpus = {
    'graph': {
      '/(master|slave)_cpus_total/': { 'color': '#508642' },
      '/(master|slave)_cpus_used/': { 'color': '#447EBC' }
    },
    'panel': {
      'title': 'Mesos CPUs',
      'yaxes': [ { 'format': 'short' }, {} ],
      'fill': 5
    }
  };

  plugins.mesos.cpusPercent = {
    'graph': {
      'cpus_percent': { 'math': '* 100' }
    },
    'panel': {
      'title': 'Mesos CPUs percent',
      'yaxes': [ { 'format': 'percent' }, {} ],
      'fill': 5,
      'percentage': true
    }
  };

  plugins.mesos.load = {
    'graph': {
      'system_load': { }
    },
    'panel': {
      'title': 'Mesos System Load',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mesos.memory = {
    'graph': {
      'mem_total': { 'color': '#508642' },
      'mem_used': { 'color': '#447EBC' }
    },
    'panel': {
      'title': 'Mesos Memory',
      'yaxes': [ { 'format': 'mbytes' }, {} ],
      'fill': 5
    }
  };

  plugins.mesos.memPercent = {
    'graph': {
      'mem_percent': { 'math': '* 100' }
    },
    'panel': {
      'title': 'Mesos Memory percent',
      'yaxes': [ { 'format': 'percent' }, {} ],
      'fill': 5,
      'percentage': true
    }
  };

  plugins.mesos.systemMem = {
    'graph': {
      'system_mem_total': { 'color': '#f08080' },
      'system_mem_free': { 'color': '#32cd32' }
    },
    'panel': {
      'title': 'Mesos System Memory',
      'yaxes': [ { 'format': 'bytes' }, {} ],
      'fill': 5
    }
  };

  plugins.mesos.disk = {
    'graph': {
      'disk_total': { 'color': '#508642' },
      'disk_used': { 'color': '#447EBC' }
    },
    'panel': {
      'title': 'Mesos Disk',
      'yaxes': [ { 'format': 'mbytes' }, {} ],
      'fill': 5
    }
  };

  plugins.mesos.diskPercent = {
    'graph': {
      'disk_percent': { 'math': '* 100' }
    },
    'panel': {
      'title': 'Mesos Disk percent',
      'yaxes': [ { 'format': 'percent' }, {} ],
      'fill': 5,
      'percentage': true
    }
  };

  plugins.mesos.uptime = {
    'graph': {
      'uptime_secs': { }
    },
    'panel': {
      'title': 'Mesos Uptime',
      'fill': 5,
      'yaxes': [ { 'format': 's' }, {} ]
    }
  };

  plugins.mesos.slaveRegistered = {
    'graph': {
      'slave_registered': { }
    },
    'panel': {
      'title': 'Mesos Slave registered',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mesos.masterElected = {
    'graph': {
      'master_elected': { }
    },
    'panel': {
      'title': 'Mesos Master elected',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mesos.slaveRecoveryErrors = {
    'graph': {
      'slave_recovery_errors': { 'apply': 'derivative' }
    },
    'panel': {
      'title': 'Mesos Slave recovery errors/sec',
      'yaxes': [ { 'format': 'ops' }, {} ]
    }
  };

  plugins.mesos.tasksGauge = {
    'graph': {
      'tasks_running': { },
      'tasks_staging': { },
      'tasks_starting': { }
    },
    'panel': {
      'title': 'Mesos tasks states',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mesos.statusUpdates = {
    'graph': {
      'status_updates': { 'apply': 'derivative' }
    },
    'panel': {
      'title': 'Mesos status updates/sec',
      'yaxes': [ { 'format': 'ops' }, {} ]
    }
  };

  plugins.mesos.tasksCounter = {
    'graph': {
      'tasks_error': { 'apply': 'derivative' },
      'tasks_failed': { 'apply': 'derivative' },
      'tasks_finished': { 'apply': 'derivative' },
      'tasks_killed': { 'apply': 'derivative' },
      'tasks_lost': { 'apply': 'derivative' }
    },
    'panel': {
      'title': 'Mesos tasks results/sec',
      'yaxes': [ { 'format': 'ops' }, {} ]
    }
  };

  plugins.mesos.frameworks = {
    'graph': {
      'frameworks_active': { 'apply': 'max' },
      'frameworks_inactive': { 'apply': 'max' },
      'frameworks_connected': { 'apply': 'max' },
      'frameworks_disconnected': { 'apply': 'max' }
    },
    'panel': {
      'title': 'Mesos frameworks status',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mesos.slaveExecutors = {
    'graph': {
      'slave_executors': { 'type': 'gauge' }
    },
    'panel': {
      'title': 'Mesos Slave executors states',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mesos.slaveFrameworkMsg = {
    'graph': {
      'framework_messages': { 'apply': 'derivative' }
    },
    'panel': {
      'title': 'Mesos framework messages/sec',
      'yaxes': [ { 'format': 'ops' }, {} ]
    }
  };

  plugins.mesos.masterFmwExecMsg = {
    'graph': {
      'framework_to_executor_messages': { 'apply': 'derivative' },
      'messages_exited_executor': { 'apply': 'derivative' },
      'messages_framework_to_executor': { 'apply': 'derivative' }
    },
    'panel': {
      'title': 'Mesos framework executor messages/sec',
      'yaxes': [ { 'format': 'ops' }, {} ]
    }
  };

  plugins.mesos.masterFmwMsg = {
    'graph': {
      '_register_framework': { 'apply': 'derivative' },
      '_reregister_framework': { 'apply': 'derivative' },
      '_unregister_framework': { 'apply': 'derivative' },
      '_deactivate_framework': { 'apply': 'derivative' }
    },
    'panel': {
      'title': 'Mesos framework messages/sec',
      'yaxes': [ { 'format': 'ops' }, {} ]
    }
  };

  plugins.mesos.masterOpMsg = {
    'graph': {
      'messages_authenticate': { 'apply': 'derivative' },
      'messages_status_update': { 'apply': 'derivative' },
      'messages_status_update_acknowledgement': { 'apply': 'derivative' },
      '_valid_status_updates': { 'apply': 'derivative' },
      '_valid_status_update_acknowledgements': { 'apply': 'derivative' },
      '_invalid_status_updates': { 'apply': 'derivative' },
      '_invalid_status_update_acknowledgements': { 'apply': 'derivative' },
      'messages_resource_request': { 'apply': 'derivative' },
      'dropped_messages': { 'apply': 'derivative' }
    },
    'panel': {
      'title': 'Mesos operation messages/sec',
      'yaxes': [ { 'format': 'ops' }, {} ]
    }
  };

  plugins.mesos.masterSlaveMsg = {
    'graph': {
      '_register_slave': { 'apply': 'derivative' },
      '_reregister_slave': { 'apply': 'derivative' },
      '_unregister_slave': { 'apply': 'derivative' }
    },
    'panel': {
      'title': 'Mesos slave messages/sec',
      'yaxes': [ { 'format': 'ops' }, {} ]
    }
  };

  plugins.mesos.masterOfferMsg = {
    'graph': {
      'messages_decline_offers': { 'apply': 'derivative' },
      'messages_revive_offers': { 'apply': 'derivative' },
      'outstanding_offers': { 'apply': 'derivative' }
    },
    'panel': {
      'title': 'Mesos offer messages/sec',
      'yaxes': [ { 'format': 'ops' }, {} ]
    }
  };

  plugins.mesos.masterTaskMsg = {
    'graph': {
      'messages_kill_task': { 'apply': 'derivative' },
      'messages_launch_tasks': { 'apply': 'derivative' },
      'messages_reconcile_tasks': { 'apply': 'derivative' }
    },
    'panel': {
      'title': 'Mesos task messages/sec',
      'yaxes': [ { 'format': 'ops' }, {} ]
    }
  };

  plugins.mesos.masterSlaveOps = {
    'graph': {
      'master_slave_': { 'apply': 'derivative' },
      'recovery_slave_removals': { 'apply': 'derivative' }
    },
    'panel': {
      'title': 'Mesos slave operations/sec',
      'yaxes': [ { 'format': 'ops' }, {} ]
    }
  };

  plugins.mesos.masterSlaves = {
    'graph': {
      'master_slaves': { }
    },
    'panel': {
      'title': 'Mesos Master Slaves status',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mesos.masterFwks = {
    'graph': {
      'master_frameworks': { }
    },
    'panel': {
      'title': 'Mesos Master Frameworks status',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mesos.masterEventQueue = {
    'graph': {
      'master_event_queue': { }
    },
    'panel': {
      'title': 'Mesos Master Event Queue',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mesos.masterRegStates = {
    'graph': {
      'registrar_state': { }
    },
    'panel': {
      'title': 'Mesos Master Registrar states',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mesos.masterRegSize = {
    'graph': {
      'registrar_registry_size_bytes': { }
    },
    'panel': {
      'title': 'Mesos Master Registry size',
      'yaxes': [ { 'format': 'bytes' }, {} ]
    }
  };

  plugins.mesos.masterRegQueue = {
    'graph': {
      'registrar_queued_operations': { }
    },
    'panel': {
      'title': 'Mesos Master Registry queued operations',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };


  // Plugin for collectd-IRQ. for more verbosity ,you need to confiugure 
  // it to your own needs. At the client machine, you do 
  // '$cat /proc/interrrups' 
  // and choose the interrups you need by number. 
  // Than you edit the 'graph' section. 
  // The commented example you can use, for more verbosity.
  plugins.irq = new Plugin();
  plugins.irq.config.multi = true;
  /*
  plugins.irq.perSec = {
    'graph': {
      '/^5$/': { 
        'color': '#E24D42',
        'alias': 'eth1',
        'apply': 'derivative(1s)'
      },
      '/^4$/': {
        'color': '#890F02',
        'alias': 'eth0',
        'apply': 'derivative(1s)'
      },
      '/^7$/': {
        'color': '#508642',
        'alias': 'timer',
        'apply': 'derivative(1s)'
      },
      '/^11$/': {
        'color': '#9400D3' ,
        'alias': 'serial',
        'apply': 'derivative(1s)'
      }
    },
    'panel': {
      'title': 'interrupts per second'
    }
  };
  */
  
  plugins.irq.genericPSec = {
    'graph': {
      '': {
        'apply': 'derivative(1s)'
      } 
      
    },
    'panel': {
      'title': 'generic interrupts pers second'
    }
  };


  // kafka GenericJMX plugin configuration
  plugins.kafka = new Plugin({ 'alias': 'kafka' });

  plugins.kafka.controller = {
    'graph': {
      'controller.active.gauge': {
        'color': '#FCEACA',
        'alias': 'master@'
      },
    },
    'panel': {
      'title': 'JMX Kafka Active Controllers',
      'yaxes': [ { 'format': 'short', 'min': 0 }, {} ]
    }
  };

  plugins.kafka.logFlush = {
    'graph': {
      'log.flush.count': {
        'color': '#806EB7',
        'apply': 'derivative',
        'alias': 'log-flushes@'
      },
    },
    'panel': {
      'title': 'JMX Kafka Log Flushes',
      'yaxes': [ { 'format': 'ops', 'min': 0 }, {} ]
    }
  };

  plugins.kafka.logTime = {
    'graph': {
      'log.flush.time-ms.median': {
        'alias': 'flush-time-average@',
        'color': '#CCA300'
      },
      'log.flush.time-ms.99th': {
        'alias': 'flush-time-max@',
        'color': '#508642'
      }
    },
    'panel': {
      'title': 'JMX Kafka Log Flushes Time',
      'fill': 3,
      'yaxes': [ { 'format': 'ms' }, {} ]
    }
  };

  plugins.kafka.requestsCount = {
    'graph': {
      'fetch-requests.count': {
        'color': '#70DBED',
        'apply': 'non_negative_derivative',
        'alias': 'fetch@'
      },
      'produce-requests.count': {
        'color': '#7EB26D',
        'math': '* -1',
        'apply': 'non_negative_derivative',
        'alias': 'produce@'
      }
    },
    'panel': {
      'title': 'JMX Kafka Requests',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'ops', 'min': null }, {} ]
    }
  };

  plugins.kafka.requestsQueueSize = {
    'graph': {
      'request.queue-size.value': {
        'color': '#AEA2E0',
        'alias': 'request-queue@'
      },
      'response.queue-size.value': {
        'color': '#F2C96D',
        'math': '* -1',
        'alias': 'response-queue@'
      }
    },
    'panel': {
      'title': 'JMX Kafka Requests Queue Size',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'short', 'min': null }, {} ]
    }
  };

  plugins.kafka.fetchRequestsCount = {
    'graph': {
      'fetch-consumer.requests.count': {
        'color': '#447EBC',
        'apply': 'derivative',
        'alias': 'fetch-consumer@'
      },
      'fetch-follower.requests.count': {
        'color': '#C15C17',
        'apply': 'derivative',
        'alias': 'fetch-follower@'
      }
    },
    'panel': {
      'title': 'JMX Kafka Fetch Requests',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'ops', 'min': 0 }, {} ]
    }
  };

  plugins.kafka.totalTimeMedian = {
    'graph': {
      'total-time.median': {
        'alias': 'average-time'
      },
      'total-time.99th': {
        'alias': 'max-time'
      }
    },
    'panel': {
      'title': 'JMX Kafka Operation Times',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'ms' }, {} ]
    }
  };

  plugins.kafka.traffic = {
    'graph': {
      'topics.bytes-out.count': {
        'color': '#447EBC',
        'apply': 'derivative',
        'alias': 'out@'
      },
      'topics.bytes-in.count': {
        'color': '#508642',
        'math': '* -1',
        'apply': 'derivative',
        'alias': 'in@'
      }
    },
    'panel': {
      'title': 'JMX Kafka Topics Traffic',
      'yaxes': [ { 'format': 'bytes' }, {} ]
    }
  };

  plugins.kafka.messages = {
    'graph': {
      'topics.messages.count': {
        'color': '#508642',
        'apply': 'non_negative_derivative',
        'alias': 'messages@'
      }
    },
    'panel': {
      'fill': 3,
      'title': 'JMX Kafka Topics Messages',
      'yaxes': [ { 'format': 'pps', 'min': 0 }, {} ]
    }
  };

  plugins.kafka.partitionsUnderRepl = {
    'graph': {
      'kafka.partitions.count.gauge': {
        'color': '#508642',
        'alias': 'total@'
      },
      'partitions.underreplicated.gauge': {
        'color': '#BF1B00',
        'alias': 'underreplicated@'
      }
    },
    'panel': {
      'title': 'JMX Kafka Underreplicated Partitions',
      'yaxes': [ { 'format': 'short', 'min': 0 }, {} ]
    }
  };


  // collectd curl_json plugin configuration for mongooseim
  plugins.mongooseim = new Plugin();

  plugins.mongooseim.overview = {
    'graph': {
      'sessionCount': {
        'color': '#1F78C1',
        'alias': '@instance.sessions_count@'
      },
      'xmppErrorTotal-one': {
        'color': '#EF843C',
        'alias': '@instance.errors_count@'
      }
    },
    'panel': {
      'title': 'MongooseIM Sessions and Errors',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mongooseim.errors = {
    'graph': {
      'xmppErrorBadRequest-one': {
        'color': '#1F78C1',
        'alias': '@instance.error_bad_equest_count@'
      },
      'xmppErrorIq-one': {
        'color': '#EF843C',
        'alias': '@instance.error_iq_count@'
      },
      'xmppErrorMessage-one': {
        'color': '#CCA300',
        'alias': '@instance.error_message_count@'
      },
      'xmppErrorPresence-one': {
        'color': '#629E51',
        'alias': '@instance.error_presence_count@'
      }
    },
    'panel': {
      'title': 'MongooseIM Errors',
      'lines': false,
      'bars': true,
      'stack': true,
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mongooseim.auth = {
    'graph': {
      'sessionAuthAnonymous-one': {
        'color': '#1F78C1',
        'alias': '@instance.auth_anonymous_count@'
      },
      'sessionAuthFails-one': {
        'color': '#EF843C',
        'alias': '@instance.auth_fails_count@'
      },
      'sessionLogouts-one': {
        'color': '#CCA300',
        'alias': '@instance.logouts_count@'
      },
      'sessionSuccessfulLogins-one': {
        'color': '#629E51',
        'alias': '@instance.successful_logins_count@'
      }
    },
    'panel': {
      'title': 'MongooseIM Authentication',
      'lines': false,
      'bars': true,
      'stack': true,
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mongooseim.registrations = {
    'graph': {
      'modRegisterCount-one': {
        'color': '#1F78C1',
        'alias': '@instance.register_count@'
      },
      'modUnregisterCount-one': {
        'color': '#EF843C',
        'alias': '@instance.unregister_count@'
      }
    },
    'panel': {
      'title': 'MongooseIM Registrations',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mongooseim.messages = {
    'graph': {
      'xmppMessageReceived-one': {
        'color': '#508642',
        'alias': '@instance.message_received@'
      },
      'xmppMessageSent-one': {
        'color': '#447EBC',
        'math': '* -1',
        'alias': '@instance.message_sent@'
      },
      'xmppMessageBounced-one': {
        'color': '#EAB839',
        'alias': '@instance.message_bounced@'
      }
    },
    'panel': {
      'title': 'MongooseIM Messages',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mongooseim.iq = {
    'graph': {
      'xmppIqReceived-one': {
        'color': '#508642',
        'alias': '@instance.iq_received@'
      },
      'xmppIqSent-one': {
        'color': '#447EBC',
        'math': '* -1',
        'alias': '@instance.iq_sent@'
      },
      'xmppIqTimeouts-one': {
        'color': '#EAB839',
        'alias': '@instance.iq_timeouts@'
      }
    },
    'panel': {
      'title': 'MongooseIM IQ',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mongooseim.presence = {
    'graph': {
      'xmppPresenceReceived-one': {
        'color': '#508642',
        'alias': '@instance.presence_received@'
      },
      'xmppPresenceSent-one': {
        'color': '#447EBC',
        'math': '* -1',
        'alias': '@instance.presence_sent@'
      }
    },
    'panel': {
      'title': 'MongooseIM Presence',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mongooseim.stanzas = {
    'graph': {
      'xmppStanzaReceived-one': {
        'color': '#508642',
        'alias': '@instance.stanza_received@'
      },
      'xmppStanzaSent-one': {
        'color': '#447EBC',
        'math': '* -1',
        'alias': '@instance.stanza_sent@'
      },
      'xmppStanzaDropped-one': {
        'color': '#EAB839',
        'alias': '@instance.stanza_dropped@'
      }
    },
    'panel': {
      'title': 'MongooseIM Stanzas',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mongooseim.roster = {
    'graph': {
      'modRosterGets-one': {
        'color': '#508642',
        'alias': '@instance.roster_gets@'
      },
      'modRosterSets-one': {
        'color': '#447EBC',
        'math': '* -1',
        'alias': '@instance.roster_sets@'
      },
      'modRosterPush-one': {
        'color': '#EAB839',
        'alias': '@instance.roster_push@'
      }
    },
    'panel': {
      'title': 'MongooseIM Roster',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mongooseim.mucMam = {
    'graph': {
      'modMucMamLookups-one': {
        'color': '#1F78C1',
        'alias': '@instance.muc_mam_lookups@'
      },
      'modMucMamForwarded-one': {
        'color': '#EF843C',
        'alias': '@instance.muc_mam_forwarded@'
      },
      'modMucMamArchived-one': {
        'color': '#CCA300',
        'alias': '@instance.muc_mam_archived@'
      },
      'modMucMamArchiveRemoved-one': {
        'color': '#629E51',
        'alias': '@instance.muc_mam_archive_removed@'
      }
    },
    'panel': {
      'title': 'MongooseIM MUC MAM',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mongooseim.mucMamDetails = {
    'graph': {
      'modMucMamPrefsGets-one': {
        'color': '#1F78C1',
        'alias': '@instance.muc_mam_prefs_gets@'
      },
      'modMucMamPrefsSets-one': {
        'color': '#EF843C',
        'alias': '@instance.muc_mam_prefs_sets@'
      },
      'modMucMamSinglePurges-one': {
        'color': '#CCA300',
        'alias': '@instance.muc_mam_single_purges@'
      },
      'modMucMamMultiplePurges-one': {
        'color': '#629E51',
        'alias': '@instance.muc_mam_multiple_purges@'
      }
    },
    'panel': {
      'title': 'MongooseIM MUC MAM Details',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mongooseim.mam = {
    'graph': {
      'modMamLookups-one': {
        'color': '#EAB839',
        'alias': '@instance.mam_lookups@'
      },
      'modMamForwarded-one': {
        'color': '#508642',
        'alias': '@instance.mam_forwarded@'
      },
      'modMamArchived-one': {
        'color': '#303030',
        'alias': '@instance.mam_archived@'
      },
      'modMamArchiveRemoved-one': {
        'color': '#890F02',
        'alias': '@instance.mam_archive_removed@'
      },
      'modMamFlushed-one': {
        'color': '#E24D42',
        'alias': '@instance.mam_flushed@'
      },
      'modMamDropped-one': {
        'color': '#9400D3',
        'alias': '@instance.mam_dropped@'
      },
      'modMamDropped2-one': {
        'color': '#E9967A',
        'alias': '@instance.mam_dropped_2@'
      },
      'modMamDroppedIQ-one': {
        'color': '#1E90FF',
        'alias': '@instance.mam_dropped_iq@'
      }
    },
    'panel': {
      'title': 'MongooseIM MAM',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.mongooseim.mamDetails = {
    'graph': {
      'modMamPrefsGets-one': {
        'color': '#1F78C1',
        'alias': '@instance.mam_prefs_gets@'
      },
      'modMamPrefsSets-one': {
        'color': '#EF843C',
        'alias': '@instance.mam_prefs_sets@'
      },
      'modMamSinglePurges-one': {
        'color': '#CCA300',
        'alias': '@instance.mam_single_purges@'
      },
      'modMamMultiplePurges-one': {
        'color': '#629E51',
        'alias': '@instance.mam_multiple_purges@'
      }
    },
    'panel': {
      'title': 'MongooseIM MAM Details',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };


  // collectd docker plugin configuration: https://github.com/lebauce/docker-collectd-plugin
  plugins.docker = new Plugin();

  plugins.docker.cpuPercent = {
    'graph': {
      'value': {
        'type': 'cpu.percent',
        'alias': '@instance'
      }
    },
    'panel': {
      'title': 'Docker CPU Percent',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'percent', 'min': 0 }, {} ]
    }
  };

  plugins.docker.cpuThrottling = {
    'graph': {
      'throttled_time': {
        'type': 'cpu.throttling_data',
        'alias': '@instance'
      }
    },
    'panel': {
      'title': 'Docker CPU Throttling',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'short', 'min': 0 }, {} ]
    }
  };

  plugins.docker.ioOps = {
    'graph': {
      'write': {
        'description': 'io_serviced_recursive',
        'apply': 'non_negative_derivative',
        'alias': '@instance.write'
      },
      'read': {
        'description': 'io_serviced_recursive',
        'apply': 'non_negative_derivative',
        'math': '* -1',
        'alias': '@instance.read'
      }
    },
    'panel': {
      'title': 'Docker I/O Ops',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'iops', 'min': null }, {} ]
    }
  };

  plugins.docker.ioBytes = {
    'graph': {
      'write': {
        'description': 'io_service_bytes_recursive',
        'apply': 'non_negative_derivative',
        'alias': '@instance.write'
      },
      'read': {
        'description': 'io_service_bytes_recursive',
        'apply': 'non_negative_derivative',
        'math': '* -1',
        'alias': '@instance.read'
      }
    },
    'panel': {
      'title': 'Docker I/O Bytes',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'bps', 'min': null }, {} ]
    }
  };

  plugins.docker.networkTraffic = {
    'graph': {
      'rx_bytes': {
        'type': 'network.usage',
        'apply': 'non_negative_derivative',
        'alias': '@instance.rx'
      },
      'tx_bytes': {
        'type': 'network.usage',
        'apply': 'non_negative_derivative',
        'math': '* -1',
        'alias': '@instance.tx'
      }
    },
    'panel': {
      'title': 'Docker Network Traffic',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'bps', 'min': null }, {} ]
    }
  };

  plugins.docker.networkPackets = {
    'graph': {
      'rx_packets': {
        'type': 'network.usage',
        'apply': 'non_negative_derivative',
        'alias': '@instance.rx'
      },
      'tx_packets': {
        'type': 'network.usage',
        'apply': 'non_negative_derivative',
        'math': '* -1',
        'alias': '@instance.tx'
      }
    },
    'panel': {
      'title': 'Docker Network Packets',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'pps', 'min': null }, {} ]
    }
  };

  plugins.docker.memoryBytes = {
    'graph': {
      'docker_total': {
        'type': 'memory.usage',
        'alias': '@instance'
      }
    },
    'panel': {
      'title': 'Docker Memory Usage',
      'tooltip': { 'sort': 2 },
      'yaxes': [ { 'format': 'bytes', 'min': 0 }, {} ]
    }
  };


  // collectd docker plugin configuration: https://github.com/anryko/collectd-couchbase
  plugins.couchbase = new Plugin({ 'alias': 'cb' });

  plugins.couchbase.nodeOpsGets = {
    'graph': {
      'nodes.ops': {
        'color': '#FF4C00',
        'alias': 'ops@'
      },
      'nodes.cmd_get': {
        'color': '#FFCC00',
        'alias': 'get-cmd@'
      },
      'nodes.get_hits': {
        'color': '#B3FF00',
        'alias': 'get-hit@'
      },
      'nodes.ep_bg_fetched': {
        'color': '#CC00FF',
        'alias': 'bg-fetch@'
      }
    },
    'panel': {
      'fill': 3,
      'lines': false,
      'bars': true,
      'tooltip': { 'sort': 2 },
      'title': 'Couchbase Node Ops',
      'yaxes': [ { 'format': 'short', 'min': 0 }, {} ]
    }
  };

  plugins.couchbase.nodeItems = {
    'graph': {
      '/^nodes.curr_items$/': {
        'color': '#7EBC44',
        'alias': 'items@'
      },
      'nodes.vb_replica_curr_items': {
        'color': '#44BABC',
        'alias': 'replicas@'
      }
    },
    'panel': {
      'stack': true,
      'tooltip': { 'sort': 2 },
      'title': 'Couchbase Node Items',
      'yaxes': [ { 'format': 'short', 'min': 0 }, {} ]
    }
  };

  plugins.couchbase.nodeDataSize = {
    'graph': {
      'nodes.couch_docs_actual_disk_size': {
        'color': '#44BABC',
        'alias': 'actual-data-size@'
      },
      'nodes.couch_docs_data_size': {
        'color': '#7EBC44',
        'alias': 'docs-data-size@'
      }
    },
    'panel': {
      'tooltip': { 'sort': 2 },
      'title': 'Couchbase Node Data',
      'yaxes': [ { 'format': 'bytes' }, {} ]
    }
  };

  plugins.couchbase.bucketDataSize = {
    'graph': {
      'bucket.op.couch_docs_data_size': {
        'alias': '@instance'
      }
    },
    'panel': {
      'stack': true,
      'tooltip': { 'sort': 2 },
      'title': 'Couchbase Bucket Data per Node',
      'yaxes': [ { 'format': 'bytes' }, {} ]
    }
  };

  plugins.couchbase.bucketTotalDataUsed = {
    'graph': {
      'bucket.basic.dataUsed': {
        'alias': '@instance'
      }
    },
    'panel': {
      'stack': true,
      'tooltip': { 'sort': 2 },
      'title': 'Couchbase Bucket Data per Cluster',
      'yaxes': [ { 'format': 'bytes', 'min': 0 }, {} ]
    }
  };

  plugins.couchbase.bucketTotalDiskUsed = {
    'graph': {
      'bucket.basic.diskUsed': {
        'alias': '@instance'
      }
    },
    'panel': {
      'stack': true,
      'tooltip': { 'sort': 2 },
      'title': 'Couchbase Bucket Disk per Cluster',
      'yaxes': [ { 'format': 'bytes', 'min': 0 }, {} ]
    }
  };

  plugins.couchbase.bucketTotalMemoryUsed = {
    'graph': {
      'bucket.basic.memUsed': {
        'alias': '@instance'
      }
    },
    'panel': {
      'stack': true,
      'tooltip': { 'sort': 2 },
      'title': 'Couchbase Bucket Memory per Cluster',
      'yaxes': [ { 'format': 'bytes', 'min': 0 }, {} ]
    }
  };

  plugins.couchbase.bucketTotalQuotaUsed = {
    'graph': {
      'bucket.basic.quotaPercentUsed': {
        'alias': '@instance'
      }
    },
    'panel': {
      'tooltip': { 'sort': 2 },
      'title': 'Couchbase Bucket Quota per Cluster',
      'yaxes': [ { 'format': 'percent', 'max': 100 }, {} ]
    }
  };

  plugins.couchbase.bucketTotalOps = {
    'graph': {
      'bucket.basic.opsPerSec': {
        'alias': '@instance'
      }
    },
    'panel': {
      'lines': false,
      'bars': true,
      'stack': true,
      'tooltip': { 'sort': 2 },
      'title': 'Couchbase Bucket Ops per Cluster',
      'yaxes': [ { 'format': 'short', 'min': 0 }, {} ]
    }
  };

  plugins.couchbase.bucketTotalDiskFetch = {
    'graph': {
      'bucket.basic.diskFetches': {
        'alias': '@instance'
      }
    },
    'panel': {
      'lines': false,
      'bars': true,
      'stack': true,
      'tooltip': { 'sort': 2 },
      'title': 'Couchbase Bucket Disk Fetches per Cluster',
      'yaxes': [ { 'format': 'short', 'min': 0 }, {} ]
    }
  };

  plugins.couchbase.bucketMemoryUsed = {
    'graph': {
      '/^bucket.op.mem_used$/': {
        'alias': '@instance'
      }
    },
    'panel': {
      'stack': true,
      'tooltip': { 'sort': 2 },
      'title': 'Couchbase Bucket Memomy per Node',
      'yaxes': [ { 'format': 'bytes' }, {} ]
    }
  };

  plugins.couchbase.bucketFrag = {
    'graph': {
      'bucket.op.couch_docs_fragmentation': {
        'alias': '@instance'
      }
    },
    'panel': {
      'tooltip': { 'sort': 2 },
      'title': 'Couchbase Bucket Fragmentation',
      'yaxes': [ { 'format': 'percent', 'max': 100 }, {} ]
    }
  };

  plugins.couchbase.bucketConns = {
    'graph': {
      'bucket.op.curr_connections': {
        'color': '#508642',
        'alias': '@instance'
      }
    },
    'panel': {
      'tooltip': { 'sort': 2 },
      'title': 'Couchbase Bucket Conns per Node',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.couchbase.bucketAvgBGWaitTime = {
    'graph': {
      'bucket.op.avg_bg_wait_time': {
        'alias': '@instance'
      }
    },
    'panel': {
      'lines': false,
      'bars': true,
      'stack': true,
      'tooltip': { 'sort': 2 },
      'title': 'Couchbase Bucket Avg BG Wait',
      'yaxes': [ { 'format': 'ms', 'min': 0 }, {} ]
    }
  };

  plugins.couchbase.bucketAvgDiskCommitTime = {
    'graph': {
      'bucket.op.avg_disk_commit_time': {
        'alias': '@instance'
      }
    },
    'panel': {
      'lines': false,
      'bars': true,
      'stack': true,
      'tooltip': { 'sort': 2 },
      'title': 'Couchbase Bucket Avg Disk Commit Wait',
      'yaxes': [ { 'format': 'ms', 'min': 0 }, {} ]
    }
  };

  plugins.couchbase.bucketAvgDiskUpdateTime = {
    'graph': {
      'bucket.op.avg_disk_update_time': {
        'alias': '@instance'
      }
    },
    'panel': {
      'lines': false,
      'bars': true,
      'stack': true,
      'tooltip': { 'sort': 2 },
      'title': 'Couchbase Bucket Avg Disk Update Wait',
      'yaxes': [ { 'format': 'ms', 'min': 0 }, {} ]
    }
  };

  plugins.couchbase.bucketGets = {
    'graph': {
      'bucket.op.cmd_get': {
        'alias': '@instance.get'
      },
      'bucket.op.cmd_set': {
        'math': '* -1',
        'alias': '@instance.set'
      }
    },
    'panel': {
      'lines': false,
      'bars': true,
      'stack': true,
      'tooltip': { 'sort': 2 },
      'title': 'Couchbase Bucket Get and Set',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.couchbase.bucketHits = {
    'graph': {
      'bucket.op.get_hits': {
        'alias': '@instance.hit'
      },
      'bucket.op.get_misses': {
        'math': '* -1',
        'alias': '@instance.miss'
      }
    },
    'panel': {
      'lines': false,
      'bars': true,
      'stack': true,
      'tooltip': { 'sort': 2 },
      'title': 'Couchbase Bucket Get hit and miss',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };

  plugins.couchbase.bucketOps = {
    'graph': {
      'bucket.op.ops': {
        'alias': '@instance'
      }
    },
    'panel': {
      'lines': false,
      'bars': true,
      'stack': true,
      'tooltip': { 'sort': 2 },
      'title': 'Couchbase Bucket Ops',
      'yaxes': [ { 'format': 'short' }, {} ]
    }
  };


  return {
    'plugins': plugins
  };
}
