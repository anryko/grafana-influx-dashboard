# Grafana InfluxDB scripted dashboard

Javascript dashboard auto-generation script to mimic comfortable Munin behaviour in Grafana. Main project goal is to be able to see all the stats for the added machine in one dashboard (to have possibility to add auto-generated URL to the existing monitoring system alarm notification for faster incident investigation). Project is written and tested with CollectD->InfluxDB+(input_plugins.collectd) as a system stats collector but with minor configuration changes should be collector independent.

:white_check_mark: Tested for **Grafana 2.6.0** and **InfluxDB v0.11.0**

## Demonstration
![](https://media.giphy.com/media/3oEdvcYi3a3KVvtuHS/giphy.gif)

## Installation
There is a bash installation script included. Substitute GRAFANA_ROOT_DIR with a path to your Grafana installation (e.g. /usr/share/grafana).
```bash
# for influxdb v0.8
git clone -b influxdb_v0.8 --depth=1 https://github.com/anryko/grafana-influx-dashboard.git
# for influxdb >= v0.9
git clone --depth=1 https://github.com/anryko/grafana-influx-dashboard.git

cd grafana-influx-dashboard
sudo ./install.sh GRAFANA_ROOT_DIR
```

## Usage examples
```
http://grafanaIP/dashboard/script/getdash.js
http://grafanaIP/dashboard/script/getdash.js?host=hostname
http://grafanaIP/dashboard/script/getdash.js?host=hostname&metric=cpu,load
http://grafanaIP/dashboard/script/getdash.js?host=hostname&metric=load,database
http://grafanaIP/dashboard/script/getdash.js?host=hostname&metric=load&time=7d
http://grafanaIP/dashboard/script/getdash.js?host=hostname&metric=disk&time=12h&span=6
http://grafanaIP/dashboard/script/getdash.js?metric=redis&span=4
```

## Features
#### Supported metrics
* [cpu](https://github.com/anryko/cpu-collectd-plugin)
* [load](https://collectd.org/wiki/index.php/Plugin:Load)
* [memory](https://collectd.org/wiki/index.php/Plugin:Memory)
* [swap](https://collectd.org/wiki/index.php/Plugin:Swap)
* [interface](https://collectd.org/wiki/index.php/Plugin:Interface)
* [df](https://collectd.org/wiki/index.php/Plugin:DF)
* [disk](https://collectd.org/wiki/index.php/Plugin:Disk)
* [processes](https://collectd.org/wiki/index.php/Plugin:Processes)
* [entropy](https://collectd.org/wiki/index.php/Plugin:Entropy)
* [users](https://collectd.org/wiki/index.php/Plugin:Users)
* [uptime](https://collectd.org/wiki/index.php/Plugin:Uptime)
* [redis](https://github.com/powdahound/redis-collectd-plugin)
* [memcache](https://collectd.org/wiki/index.php/Plugin:memcached)
* [rabbitmq](https://github.com/kozdincer/rabbitmq_collectd_plugin)
* [elasticsearch](https://github.com/phobos182/collectd-elasticsearch)
* [nginx](https://collectd.org/wiki/index.php/Plugin:nginx)
* [connstate](https://github.com/anryko/connstate-collectd-plugin)
* [ping](https://collectd.org/wiki/index.php/Plugin:Ping)
* [posgresql](https://collectd.org/wiki/index.php/Plugin:PostgreSQL)
* [zookeeper](https://github.com/signalfx/collectd-zookeeper)
* [mesos](https://github.com/rayrod2030/collectd-mesos)
* [apache](https://collectd.org/wiki/index.php/Plugin:Apache)
* [nfs](https://collectd.org/wiki/index.php/Plugin:NFS)
* [ipvs](https://collectd.org/wiki/index.php/Plugin:IPVS)
* [conntrack](https://collectd.org/wiki/index.php/Plugin:ConnTrack)
* [hddtemp](https://collectd.org/wiki/index.php/Plugin:HDDTemp)
* [lvm](https://collectd.org/wiki/index.php/Plugin:LVM)
* [mysql](https://collectd.org/wiki/index.php/Plugin:MySQL)
* [tcpconns](https://collectd.org/wiki/index.php/Plugin:TCPConns)

#### Supported metric groups
* system
* middleware
* database

#### Supported time format
```
/(\d+)(m|h|d)/
```
<sub>_Grouping by time is automatically adjusted._</sub>


## Configuration HOWTO
This HOWTO will guide you through initial script configuration and example of adding additional plugins/metrics.

#### Initial getdash.js script configuration
Grafana datasource configuration is used for InfluxDB backend requests.

#### New plugin configuration
Lets assume you have some metric in your InfluxDB and you want it to be displayed. Before starting plugin configuration you will need *hostname*, *series* and *type*. For this demonstration I will use *\<hostname\>*, *disk_read*/*disk_write* and *disk_ops* accordingly. If you are not sure about *series* you can list all host series by querying your InfluxDB:
```bash
curl -sG 'http://<influxIP>:8086/query?pretty=true' --data-urlencode "db=collectd" --data-urlencode "q=SHOW SERIES WHERE host = '<hostname>';" | grep "\"name\":"
                    "name": "cpu_value",
                    "name": "df_value",
                    "name": "disk_read",
                    "name": "disk_write",
                    ...
```
And get other available parameters:
```bash
curl -sG 'http://<influxIP>:8086/query?pretty=true' --data-urlencode "db=collectd" --data-urlencode "q=SHOW SERIES FROM /disk_.*/ WHERE host = '<hostname>';" | grep "host="
                            "disk_read,host=<hostname>,instance=sda,type=disk_merged",
                            "disk_read,host=<hostname>,instance=sda,type=disk_octets",
                            "disk_read,host=<hostname>,instance=sda,type=disk_ops",
                            ...
```

To configure plugin for selected metrics you need to add following configuration to your getdash.conf.js.
```javascript
// collectd disk plugin configuration
plugins.disk = new Plugin();
plugins.disk.config.multi = true;
plugins.disk.config.regexp = /\d$/;

plugins.disk.diskOps = {
  'graph': {
    'read': {
      'color': '#447EBC',
      'apply': 'derivative',
      'type': 'disk_ops'
    },
    'write': {
      'color': '#508642',
      'math': '* -1',
      'apply': 'derivative',
      'type': 'disk_ops'
    }
  },
  'panel': {
    'title': 'Disk Operations for @metric',
    'grid': { 'max': null, 'min': null, 'leftMin': null }
  }
};
```
_Applying 'derivative' will use derivative(mean(value), 1s) by default. However, more extensive derivative syntax is supported. Examples: derivative(10s), derivative(last), derivative(max, 1s), derivative(min(value), 10s)._

OK. So let's go line by line and I'll explain what was done here. Firs you create new Plugin and the name of plugin have to match the beginning of the series for that plugin. In this case it have to be **disk**.
```javascript
plugins.disk = new Plugin();
```

Next you define that this plugin have multiple metrics split in separate graphs. There are probably multiple disks/partitions on your system. In this example I have sda, sda1 and sda2.
```javascript
plugins.disk.config.multi = true;
```
<sub>_For something like memory, where you have just one metric per host you wouldn't need to setup that._</sub>

Because we actually want to see only sda1, sda2 on our graphs (sda and sda1 are identical in my case) we apply a regular expression to match the metric. In this case I want to see only metrics with digit at the end.
```javascript
plugins.disk.config.regexp = /\d$/;
```

Next we configure "Disk IO" graph itself. We want to see **disk_read** and **disk_write** for **type=disk_ops**.

Now lets describe this in the graph configuration. ``graph`` defines that we are configuring a graph :). ``read`` and ``write`` objects describe the series we want to graph. Those should match begining/ending of the series name or type_instance. Inside those graph configurations we define ``type`` to distinguish particular type of disk_read/write series we want to graph. Then we add ``color`` we want and InfluxDB function on the stored value with the ``apply`` keyword.
```bash
plugins.disk.diskOps = {
  'graph': {
    'read': {
      'color': '#447EBC',
      'apply': 'derivative',
      'type': 'disk_ops'
    },
    'write': {
      'color': '#508642',
      'math': '* -1',
      'apply': 'derivative',
      'type': 'disk_ops'
    }
  },
```
Supported configuration keys are:

 * *color* - if not defined color will be random
 * *alias* - used to change metric name on the graph
 * *column* - used to define requested column
 * *math* - used to define mathematical expression which will be applied to the *column* value
 * *apply* - used to apply InfluxDB SQL value function (e.g. max, min, count, etc.)
 * *type* - used in case when you have multiple graphs per series

Next we define Panel title and grid.
```javascript
  'panel': {
    'title': 'Disk Operations for @metric',
    'grid': { 'max': null, 'min': null, 'leftMin': null },
  },
};
```
*@metric* is a special keyword which will be substituted with sda1 and sda2 dynamically.

This should be sufficient introduction to start adding your own metrics as needed. It was one of the most feature reach examples. Usually configuration is much more straightforward. Like this config for memcached.
```javascript
// collectd memcached plugin configuration
plugins.memcache = new Plugin();

plugins.memcache.hits = {
  'graph': {
    'hitratio': { }
  },
  'panel': {
    'title': 'Memcached Hitratio',
    'y_formats': [ 'percent' ]
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
    'y_formats': [ 'pps' ]
  }
};
```
You can also describe metric using JS regular expressions syntax as it is done in the nfs plugin example above.

If you understand your data and how it is structured inside database you should be able to describe it as a plugin configuration with current feature set. If you are having any troubles with that feel free to register an Issue and I'll try to help.

## Notes

#### Adding GetDash link to Grafana side menu.
This is direct minified javascript patching approach. Be sure you understand what is done here and don't forget to backup first.
```bash
cd GRAFANA_ROOT_DIR
# backup
ls public/app/app.*.js | xargs -I{} cp {} {}.bak
# apply change
sed -i 's|\({text:"Dashboards",icon:"fa fa-fw fa-th-large",href:a.getUrl("/")}\)|\1,{text:"GetDash",icon:"fa fa-fw fa-th-large",href:a.getUrl("/dashboard/script/getdash.js")}|' public/app/app.*.js
```
<sub>_Substitute GRAFANA_ROOT_DIR with a path to your Grafana installation (e.g. /usr/share/grafana)._</sub>

#### Fetching server side generated graph images.
```
http://grafanaIP/render/dashboard-solo/script/getdash.js?host=hostname&metric=cpu&panelId=1&time=6h&async=false
```
<sub>_async=false has to be used in this case to disable return of Promise to PhantomJS renderer._</sub>
