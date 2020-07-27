#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-
#
# An easy way to monitor the number of open connections to some target.


function loudproxy () {
  cd /
  local LOG_TAG="$FUNCNAME"
  local TGT_HOST="${1:-localhost}"; shift
  local TGT_PORT="${1:-80}"; shift
  local MUX_FILE="${LPX_RUNDIR:-/tmp/$FUNCNAME.run}/$TGT_HOST.$TGT_PORT.mux"
  mkdir --parents -- "${MUX_FILE%/*}"
  [ -f "$MUX_FILE" ] || >>"$MUX_FILE"
  local LOG_FILE="${MUX_FILE%.*}.log"
  netcat "$TGT_HOST" "$TGT_PORT" 32<"$MUX_FILE" &
  local NC_PID=$!
  logmsg "nc $NC_PID open"
  wait "$NC_PID"
  logmsg "nc $NC_PID done"
}


function logmsg () {
  local PIDS=( $(fuser --namespace file "$MUX_FILE" 2>/dev/null \
    | grep -oPe '\d+' | sort --version-sort) )
  local MSG="$TGT_HOST:$TGT_PORT: $* (active: ${#PIDS[@]}: ${PIDS[*]})"
  # logger --tag "$LOG_TAG" --id -- "$MSG"
  printf -v MSG '%(%y%m%d:%H%M%S)T\t%s\t%s' -1 $$ "$MSG"
  echo "$MSG" >>"$LOG_FILE"
}


loudproxy "$@"; exit $?
