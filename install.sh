#!/bin/bash
# Grafanas getdash scripted dashboard install script.

set -e

usage() {
  echo "Usage: $0 <GRAFANA_ROOT_DIR>"
  exit 1
}

[[ $# -eq 0 || "$1" == "-h" ]] && usage
[[ -z $1 ]] && usage || GRAFANA_ROOT_DIR=$1
[[ ! -d $GRAFANA_ROOT_DIR ]] && usage

[[ ! -d $GRAFANA_ROOT_DIR/app/getdash ]] && mkdir $GRAFANA_ROOT_DIR/app/getdash
cp getdash.{conf.,}js $GRAFANA_ROOT_DIR/app/getdash/
cd $GRAFANA_ROOT_DIR/app/dashboards/
ln -sf ../getdash/getdash.js .

echo "Install finished."
