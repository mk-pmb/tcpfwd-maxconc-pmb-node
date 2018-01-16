/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';
process.chdir('/');   // Don't lock any mountpoints
try { require('usnam-pmb'); } catch (ignore) {}
require('./lib/proxy-server')({
  cfgArgs: process.argv.slice(1),
    // ^-- start at arg 1 to allow -r -e hack:
    //     nodejs -r tcpfwd-maxconc-pmb -e 0 -- max_conc=5
  cfgEnv: process.env,
}).listenAsConfigured();
