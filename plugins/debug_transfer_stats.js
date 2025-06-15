/* -*- tab-width: 2 -*- */
'use strict';

function lenProp(x) { return (x || false).length; }

function install(srv) {
  const snoopLog = srv.log('snoop');
  if (!snoopLog.isIgnore) { return; }
  srv.log.cfg('Transfer chunks sizes will be logged.');

  srv.on('guestSeated', function onGuestSeated(ev) {
    const { logPfx } = ev.guest;
    ev.guest.on('data', snoopLog.l8r([logPfx + '>> n_bytes ='], lenProp));
    ev.tgtSock.on('data', snoopLog.l8r([logPfx + '<< n_bytes ='], lenProp));
  });



}

module.exports = require('plugmgr1801-pmb/plugify')(module, install);
