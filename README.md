#Grafana InfluxDB scripted dashboard

Javascript dashboard auto-generation script to mimic comfortable Munin behaviour in Grafana. Main project goal is to be able to see all the stats for the added machine in one dashboard (to have possibility to add auto-generated URL to the existing monitoring system alarm notification for faster incident investigation). Project is written and tested with CollectD+(write_graphite plugin) as a system stats collector but with minor configuration changes should be collector independent. For Grafana+InfluxDB setup I recommend to look in to [docker-influxdb](https://github.com/StackPointCloud/docker-influxdb).

##Installation
There is a bash installation script included. Substitute GRAFANA_ROOT_DIR with a path to your Grafana installation (e.g. /opt/grafana).
```bash
git clone --depth=1 https://github.com/anryko/grafana-influx-dashboard.git
cd grafana-influx-dashboard
./install.sh GRAFANA_ROOT_DIR
```

##Usage examples
```
http://grafanaIP/#/dashboard/script/getdash.js?host=hostname
http://grafanaIP/#/dashboard/script/getdash.js?host=hostname&metric=cpu,load
http://grafanaIP/#/dashboard/script/getdash.js?host=hostname&metric=load,database
http://grafanaIP/#/dashboard/script/getdash.js?host=hostname&metric=load&time=7d
```

##Features
####Supported metrics
```
cpu
load
memory
swap
interface
df
disk
processes
redis
memcache
rabbitmq
elasticsearch
nginx
```
####Supported metric groups
```
system
middleware
database
```
####Supported time format
```
/(\d+)(m|h|d)/
```
<sub>_Grouping by time is automatically adjusted._</sub>


##Configuration HOWTO
This HOWTO will guide you through initial script configuration and example of adding additional plugins/metrics.

####Initial getdash.js script configuration
Grafana datasource configuration is used for InfluxDB backend requests.

####Plugin/metric configuration
If you don't use CollectD or your series prefix is not 'collectd.' you will have to change 'prefix' in Plugin Config Prototype object in detdash.conf.js file.
```javascript
  var pluginConfProto = {
    'alias': undefined,
    'prefix': 'collectd.',
  };
```
Just substitute 'collectd.' with the prefix used in your setup.

####New plugin configuration
Lets asume you have some metric in your InfluxDB and you want it to be displayed. Before starting plugin configuration you will need *hostname* and *metricname*. For this demonstration I will use *hostname* and *disk* accordingly.
First you get metric names if you don't already know them.
```bash
curl -sG "http://InfluxDBIP:8086/db/graphite/series?u=root&p=root" --data-urlencode "q=select * from /.*\.hostname\.disk/ limit 1" | python -m json.tool | grep name | grep ops
```

Output will be something like this.
```json
        "name": "collectd.hostname.disk-vda.disk_ops.read",
        "name": "collectd.hostname.disk-vda.disk_ops.write",
        "name": "collectd.hostname.disk-vda1.disk_ops.read",
        "name": "collectd.hostname.disk-vda1.disk_ops.write",
        "name": "collectd.hostname.disk-vda2.disk_ops.read",
        "name": "collectd.hostname.disk-vda2.disk_ops.write",
```

To configure plugin for those metric you need to add this configuration to your getdash.conf.js.
```javascript
// collectd disk plugin configuration
plugins.disk = new Plugin();
plugins.disk.config.multi = true;
plugins.disk.config.regexp = /\d$/;

plugins.disk.diskIO = {
  'graph': {
    'ops.write': { 'color': '#447EBC' },
    'ops.read': { 'color': '#508642', 'column': 'value*-1' },
  },
  'panel': {
    'title': 'Disk IO for @metric',
    'grid': { 'max': null, 'min': null },
  },
};
```

OK. So let's go line by line and I'll explain what was done here. Firs you create new Plugin and the name of plugin have to match the beginning of the series for that plugin. In this case it have to be **disk**.
```javascript
plugins.disk = new Plugin();
```

Next you define that this plugin can have multiple metrics because there are probably multiple disks/partitions on your system. In this example we have disk-vda, disk-vda1 and disk-vda2.
```javascript
plugins.disk.config.multi = true;
```
<sub>_For something like memory, where you have just one metric per host you wouldn't need to setup that._</sub>

Because we actually want to see only disk-vda1, disk-vda2 on our graphs (disk-vda and disk-vda1 are identical in my case) we apply a regular expression to match the metric. In this case I want to see only metrics with the digit at the end.
```javascript
plugins.disk.config.regexp = /\d$/;
```

Next we configure "Disk IO" graph itself. We want to see **ops.write** and **ops.read**. Those names must match the ending of the metric we are configuring (Order of metrics controls the order in the graph).
```javascript
plugins.disk.diskIO = {
  'graph': {
    'ops.write': { 'color': '#447EBC' },
    'ops.read': { 'color': '#508642', 'column': 'value*-1' },
  },
```
Supported configuration keys are:

 * *color* - if not defined color will be random
 * *alias* - to change metric name on the graph
 * *column* - used to manipulate the graph (in this case we want to make it upsidedown so we multiply values by -1)
 * *apply* - used to apply InfluxDB SQL value function (e.g. max, min, cont, etc.)

Next we define Panel title and grid.
```javascript
  'panel': {
    'title': 'Disk IO for @metric',
    'grid': { 'max': null, 'min': null },
  },
};

```
*@metric* is a special keyword which will be substituted with disk-vda1 and disk-vda2 dinamically.

This should be sufficient introduction to start adding your own metrics as needed. It was one of the most feature reach examples. Usually configuration is much more straightforward. Like this config for memcached.
```javascript
// collectd memcached plugin configuration
plugins.memcache = new Plugin();

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
```
