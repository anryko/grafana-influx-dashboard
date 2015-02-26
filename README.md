# grafana-influx-dashboard

###Grafana InfluxDB scripted dashboard

####Installation instructions

```bash
git clone --depth=1 git@github.com:anryko/grafana-influx-dashboard.git
cd grafana-influx-dashboard
./install.sh GRAFANA_ROOT_DIR
```


####Usage examples
http://grafanaIP/#/dashboard/script/getdash.js?host=hostname
http://grafanaIP/#/dashboard/script/getdash.js?host=hostname&metric=cpu,load
http://grafanaIP/#/dashboard/script/getdash.js?host=hostname&metric=load,database


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
```
####Supported metric groups
```
system
middleware
database
```
