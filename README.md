# Grafana InfluxDB scripted dashboard

Javascript dashboard auto-generation script to mimic comfortable Munin behaviour in Grafana. Main project goal is to be able to see all the stats for the added machine in one dashboard (to have possibility to add auto-generated URL to the existing monitoring system alarm notification for faster incident investigation). Project is written and tested with CollectD->InfluxDB+(input_plugins.collectd) as a system stats collector but with minor configuration changes should be collector independent. For Grafana+InfluxDB setup I recommend to look in to [docker-influxdb](https://github.com/StackPointCloud/docker-influxdb).

## Installation
There is a bash installation script included. Substitute GRAFANA_ROOT_DIR with a path to your Grafana installation (e.g. /opt/grafana).
```bash
git clone -b influxdb_v0.8 --depth=1 https://github.com/anryko/grafana-influx-dashboard.git
cd grafana-influx-dashboard
./install.sh GRAFANA_ROOT_DIR
```
_In deb package default install it should be /usr/share/grafana_

## Usage examples
```
http://grafanaIP/dashboard/script/getdash.js
http://grafanaIP/dashboard/script/getdash.js?host=hostname
http://grafanaIP/dashboard/script/getdash.js?host=hostname&metric=cpu,load
http://grafanaIP/dashboard/script/getdash.js?host=hostname&metric=load,database
http://grafanaIP/dashboard/script/getdash.js?host=hostname&metric=load&time=7d
```

## Features
#### Supported metrics
```
cpu
load
memory
swap
interface
df
disk
processes
entropy
users
uptime
redis
memcache
rabbitmq
elasticsearch
nginx
```
#### Supported metric groups
```
system
middleware
database
```
#### Supported time format
```
/(\d+)(m|h|d)/
```
<sub>_Grouping by time is automatically adjusted._</sub>


## Configuration HOWTO
This HOWTO will guide you through initial script configuration and example of adding additional plugins/metrics.

#### Initial getdash.js script configuration
Grafana datasource configuration is used for InfluxDB backend requests.

#### Plugin/metric configuration
If you don't use CollectD or your series prefix is not 'collectd.' you will have to change ``prefix`` in Plugin Config Prototype object in getdash.conf.js file. Other two options you should pay attention to are ``separator`` and ``datasources``. CollectD default separator is ``/``, however if you use write_graphite plugin for CpllectD your separator might be a ``.``. By default getdash will use all datasources configured in Grafana, however in some circumstances you might want to use only specific datasource(s) for your dashboard and ``datasources`` is the property to configure that.
```javascript
  var pluginConfProto = {
    'alias': undefined,
    //'prefix': 'collectd.',
    'separator': '/',
    //'datasources': [ 'collectd' ],
  };
```
_In my case I don't use prefix at all and do use all of the Grafana datasources so ``prefix`` and ``datasources`` are commented out_).

#### New plugin configuration
Lets assume you have some metric in your InfluxDB and you want it to be displayed. Before starting plugin configuration you will need *hostname* and *metricname*. For this demonstration I will use *\<hostname\>* and *disk* accordingly.
First you get metric names if you don't already know them.
```bash
curl -sG "http://<influxIP>:8086/db/<DBname>/series?u=root&p=root" --data-urlencode "q=select * from /<hostname>\/disk/ limit 1" | python -m json.tool | grep name | grep ops
```
<sub>_This example is for InfluxDB v0.8. In v0.9 query syntax will differ._</sub>

Output will be something like this.
```json
        "name": "hostname/disk-vda/disk_ops",
        "name": "hostname/disk-vda/disk_ops",
        "name": "hostname/disk-vda1/disk_ops",
        "name": "hostname/disk-vda1/disk_ops",
        "name": "hostname/disk-vda2/disk_ops",
        "name": "hostname/disk-vda2/disk_ops",
```

To configure plugin for those metric you need to add this configuration to your getdash.conf.js.
```javascript
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
        'alias': 'write'
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

Next we configure "Disk IO" graph itself. We want to see **ops.write** and **ops.read**. To do that we need to understand how data is actually contained in our InfluxDB table. Essentially there are columns and points:
```bash
curl -sG "http://<influxIP>:8086/db/<DBname>/series?u=root&p=root" --data-urlencode "q=select * from /<hostname>\/disk.*\/disk_ops/ limit 1" | python -c 'import sys, json; print json.load(sys.stdin)[0]["columns"]'
```
```javascript
[u'time', u'sequence_number', u'plugin', u'plugin_instance', u'type', u'type_instance', u'dsname', u'dstype', u'value', u'host']
```
```bash
curl -sG "http://<influxIP>:8086/db/<DBname>/series?u=root&p=root" --data-urlencode "q=select * from /<hostname>\/disk.*\/disk_ops/ limit 1" | python -c 'import sys, json; print json.load(sys.stdin)[0]["points"]'
```
```javascript
[[1438332413000, 10554650500001, u'derive', 36404719.0, u'lab3', u'disk', u'vda', u'disk_ops', u'', u'write']]
```
Column name matches the point data.
What we want is to get the info for two graphs (**write** and **read**).

So lets summarise: We need data points from disk_ops metric with two different **dsname**s (**write** and **read**).

Now lets describe this in the graph configuration. ``graph`` defines that we are configuring a graph :). ``ops`` describes the metric we want and must match the ending of the metric name **disk_ops** in our seriues **hostname/disk-vda/disk_ops**. Inside that series we have two graphs and to describe that we use an array with two configuration objects, each with different ``color``, ``alias`` (this will show up on the graph instead of full metric name) and **dsname** which we describe using ``where`` keyword. From the plugin column in curl query output we can see that data is u'derive', this means that to make graphs meaningful we have to apply Grafanas 'derivative(value)' function which we do with ``apply`` keyword. Another neat thing we want to do i to show disk reads as negative (upside-down) graph and to describe that we multiply the column value by -1 using ``column`` keyword.
```javascript
plugins.disk.diskIO = {
  'graph': {
    'ops': [
      {
        'color': '#447EBC',
        'where': "dsname='write'",
        'alias': 'write'
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
```
Supported configuration keys are:

 * *color* - if not defined color will be random
 * *alias* - to change metric name on the graph
 * *column* - used to manipulate the graph (in this case we want to make it upside-down so we multiply values by -1)
 * *apply* - used to apply InfluxDB SQL value function (e.g. max, min, cont, etc.)
 * *where* - used in case when you have multiple graphs per series

Next we define Panel title and grid.
```javascript
  'panel': {
    'title': 'Disk Operations for @metric',
    'grid': { 'max': null, 'min': null, 'leftMin': null },
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
