/* -*- tab-width: 2 -*- */
'use strict';

const evut = require('./ev-util.js');

function install(srv) {

  const hardKillTimeout = 10e3;

  function hardKillNow() {
    srv.log.oper('Hard-killing undead useless server!');
    process.exit(7); // eslint-disable-line n/no-process-exit
  }

  const u = evut.onlyOnce(function setReason(why) {
    srv.log.oper('shutdown: FUBAR:', why);
    u.why = why; // eslint-disable-line no-param-reassign
    try { srv.close(); } catch (ignore) { ; }
    setTimeout(hardKillNow, hardKillTimeout).unref();
    return why;
  });
  u.why = null;

  srv.useless = u; // eslint-disable-line no-param-reassign
}

module.exports = require('plugmgr1801-pmb/plugify')(module, install);
