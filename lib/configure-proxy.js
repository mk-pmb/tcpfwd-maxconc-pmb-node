/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var smartListen = require('net-smartlisten-pmb');


module.exports = function (srv, cfg) {
  cfg.logFile = cfg('log_file');
  if (cfg.logFile) { srv.log.toFile(cfg.logFile); }
  cfg.tgtAddr = (cfg('tgt_host') || cfg('tgt_addr') || 'localhost');
  //if (!String(cfg.tgtAddr).match(/\D/)) {
  //  throw new Error('Target host must contain a non-digit character.');
  //}
  cfg.tgtPort = (+cfg('tgt_port')
    || cfg.guessProxyPort('https')
    || cfg.guessProxyPort('http')
    || 0);
  if (cfg.tgtPort < 1) { throw new RangeError('Target port must be positive'); }
  cfg.lsnPort = (+cfg('lsn_port')
    || ((cfg.tgtPort > 1024) && (cfg.tgtPort + 1))
    || ((cfg.tgtPort > 0) && (cfg.tgtPort + 4000))
    || 8280);
  cfg.maxConn = (+cfg('max_conn') || +cfg('max_conc') || 1);
  cfg.verbosity = (+cfg('debuglevel') || +cfg('loglv') || 0);
  cfg.peekData = (+cfg('peek_data') || 0);

  cfg.lsnSpec = smartListen({ addr: cfg('lsn_addr'),  port: cfg.lsnPort });
  cfg.tgtSpec = smartListen({ addr: cfg.tgtAddr,      port: cfg.tgtPort });
  cfg.tgtDescrArrow = ('--{maxConc=' + cfg.maxConn + '}--> '
    + String(cfg.tgtSpec));



  srv.listenAsConfigured = function () { srv.listen(cfg.lsnSpec); };
};
