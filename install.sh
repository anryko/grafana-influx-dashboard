#!/bin/bash
# Getdash scripted dashboard install script.

set -e

usage() {
  echo "Usage: $0 <GRAFANA_ROOT_DIR>"
  exit 1
}

[[ $# -eq 0 || "$1" == "-h" ]] && usage
[[ -z $1 ]] && usage || GRAFANA_ROOT_DIR=$1
[[ ! -d $GRAFANA_ROOT_DIR ]] && usage

INSTALL_PATH=$GRAFANA_ROOT_DIR/public/app/getdash

[[ ! -d $INSTALL_PATH ]] && mkdir "$INSTALL_PATH"/
cp getdash.{app.,conf.,}js "$INSTALL_PATH"/
cp -r {lib,getdash.conf.d} "$INSTALL_PATH"/
cd "$GRAFANA_ROOT_DIR"/public/dashboards/
ln -sf "$INSTALL_PATH"/getdash.js .

echo "Install finished."
