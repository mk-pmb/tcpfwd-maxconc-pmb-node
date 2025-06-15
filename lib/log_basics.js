/* -*- tab-width: 2 -*- */
'use strict';

const makeLoggerFactory = require('clog1801-pmb');
const sockAddrStr = require('sockaddrstr');

function install(srv, cfg) {
  if (srv.log) { throw new Error('Server already has a logger'); }
  srv.log = makeLoggerFactory(cfg); // eslint-disable-line no-param-reassign

  process.on('exit', function onExit(rv) {
    srv.log.oper('exit', { pid: process.pid, rv });
  });
  srv.on('close', function onClose() { srv.log.oper('Server closed.'); });
  srv.on('listening', function onListening() {
    srv.log.oper('Listening.', sockAddrStr(srv), cfg.tgtDescrArrow
      + ', pid=' + process.pid);
  });
  srv.on('guestWaiting', function onGuestWaiting(ev) {
    const g = ev.guest;
    srv.log.misc(g.logPfx + g.addrDescr + ' enqueued.', ev.seatQ.stats());
  });

  srv.log.cfg('Gonna listen on', String(cfg.lsnSpec), cfg.tgtDescrArrow);



}

module.exports = require('plugmgr1801-pmb/plugify')(module, install);
