/*jslint indent: 2, maxlen: 80, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var makeLoggerFactory = require('clog1801-pmb'),
  sockAddrStr = require('sockaddrstr');

function install(srv, cfg) {
  if (srv.log) { throw new Error('Server already has a logger'); }
  srv.log = makeLoggerFactory(cfg);

  process.on('exit', function (rv) {
    srv.log.oper('exit', { pid: process.pid, rv: rv });
  });
  srv.on('close', function () { srv.log.oper('Server closed.'); });
  srv.on('listening', function () {
    srv.log.oper('Listening.', sockAddrStr(srv), cfg.tgtDescrArrow +
      ', pid=' + process.pid);
  });
  srv.on('guestWaiting', function (ev) {
    var g = ev.guest;
    srv.log.misc(g.logPfx + g.addrDescr + ' enqueued.', ev.seatQ.stats());
  });

  srv.log.cfg('Gonna listen on', String(cfg.lsnSpec), cfg.tgtDescrArrow);



}

module.exports = require('plugmgr1801-pmb/plugify')(module, install);
