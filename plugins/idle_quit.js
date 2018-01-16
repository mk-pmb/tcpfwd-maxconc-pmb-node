/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

require('autoquit');

function install(srv, cfg) {
  var idleQuitMin = (+cfg('idle_quit') || 0), secondsPerMinute = 60;
  if (idleQuitMin <= 0) { return; }

  srv.log.misc('Will idle-quit after', idleQuitMin, 'minutes of inactivity.');

  function getBored() {
    srv.log.misc('Gonna idle-quit.');
    srv.close();
  }
  srv.autoQuit({ exitFn: getBored, timeOut: idleQuitMin * secondsPerMinute });



}

module.exports = require('plugmgr1801-pmb/plugify')(module, install);
