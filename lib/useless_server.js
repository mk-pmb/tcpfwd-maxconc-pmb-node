/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var evut = require('./ev-util');

function install(srv) {

  var hardKillTimeout = 10e3;

  function hardKillNow() {
    srv.log.oper('Hard-killing undead useless server!');
    process.exit(7);
  }

  srv.useless = evut.onlyOnce(function (why) {
    srv.log.oper('shutdown: FUBAR:', why);
    srv.useless.why = why;
    try { srv.close(); } catch (ignore) {}
    setTimeout(hardKillNow, hardKillTimeout).unref();
    return why;
  });
  srv.useless.why = null;



}

module.exports = require('plugmgr1801-pmb/plugify')(module, install);
