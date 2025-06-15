/* -*- tab-width: 2 -*- */
'use strict';

const createTcpServer = require('net').createServer;
const cliEnvCfg = require('cfg-cli-env-180111-pmb');
const plugMgr = require('plugmgr1801-pmb');
const configure = require('./configure-proxy.js');


const EX = function makeProxyServer(how) {
  const cfg = (how.cfg || cliEnvCfg(how.cfgArgs, how.cfgEnv));
  if (how.saveCfgProp) {
    // eslint-disable-next-line no-param-reassign
    (how.saveCfgObj || how)[how.saveCfgProp] = cfg;
  }
  const srv = (how.server || createTcpServer({ pauseOnConnect: true }));
  configure(srv, cfg);
  plugMgr().loadStages(EX.pluginStages, cfg).installAllOnto(srv, cfg);
  return srv;
};


EX.pluginStages = (function decidePluginStages() {
  const ps = [];
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
    require('./log_basics.js'),
    require('./seat-q.js'),
    require('./useless_server.js'),
  ]);
  st('plugins', [
    require('../plugins/debug_transfer_stats.js'),
    // require('../plugins/idle_quit.js'),
    require('../plugins/killword.js'),
    require('../plugins/tgt_idle.js'),
  ]);
  return ps;
}());





















module.exports = EX;
