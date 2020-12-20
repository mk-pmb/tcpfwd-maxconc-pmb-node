#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-
SYM='sudo ln --verbose --symbolic --target-directory='
SS='/systemd/system'
NP='/npm-proxy-guard'
$SYM/lib$SS -- "$PWD"$NP.service
$SYM/lib$SS -- "$PWD"$NP.socket
$SYM/etc$SS -- /lib$SS$NP.socket
sudo systemctl daemon-reload
sudo systemctl start $NP.socket
# Manually starting the service would be futile.
# It must be activated by a socket unit, in order to receive
# that socket as its stdin.
