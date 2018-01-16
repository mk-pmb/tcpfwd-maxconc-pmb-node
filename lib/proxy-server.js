/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = {}, impl = {},
  createTcpServer = require('net').createServer,
  configure = require('./configure-proxy'),
  cliEnvCfg = require('cfg-cli-env-180111-pmb'),
  plugMgr = require('plugmgr1801-pmb');


EX = function makeProxyServer(how) {
  var cfg, srv;
  cfg = (how.cfg || cliEnvCfg(how.cfgArgs, how.cfgEnv));
  if (how.saveCfgProp) {
    (how.saveCfgObj || how)[how.saveCfgProp] = cfg;
  }
  srv = (how.server || createTcpServer({ pauseOnConnect: true }));
  configure(srv, cfg);
  plugMgr().loadStages(EX.pluginStages, cfg).installAllOnto(srv, cfg);
  return srv;
};


EX.pluginStages = (function () {
  var ps = [];
  function noDeco(name, list) {
    ps.push(name);
    ps[name] = list || [];
  }
  function st(name, list) {
    noDeco(name + '_early');
    noDeco(name, list);
    noDeco(name + '_late');
  }
  st('mixins', [
    require('./log_basics'),
    require('./seat-q'),
    require('./useless_server'),
  ]);
  st('plugins', [
    require('../plugins/debug_transfer_stats'),
    //require('../plugins/idle_quit'),
    require('../plugins/killword'),
    require('../plugins/tgt_idle'),
  ]);
  return ps;
}());





















module.exports = EX;
