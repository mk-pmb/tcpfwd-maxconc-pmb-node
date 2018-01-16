/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

function lenProp(x) { return (x || false).length; }

function install(srv) {
  var snoopLog = srv.log('snoop');
  if (!snoopLog.isIgnore) { return; }
  srv.log.cfg('Transfer chunks sizes will be logged.');

  srv.on('guestSeated', function (ev) {
    var logPfx = ev.guest.logPfx;
    ev.guest.on('data', snoopLog.l8r([logPfx + '>> n_bytes ='], lenProp));
    ev.tgtSock.on('data', snoopLog.l8r([logPfx + '<< n_bytes ='], lenProp));
  });



}

module.exports = require('plugmgr1801-pmb/plugify')(module, install);
