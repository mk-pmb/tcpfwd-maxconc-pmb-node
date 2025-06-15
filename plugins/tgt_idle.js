/* -*- tab-width: 2 -*- */
'use strict';

function install(srv, cfg) {
  const tgtIdleSec = (+cfg('tgt_idle') || 0);
  if (tgtIdleSec <= 0) {
    srv.log.misc('Target connections are allowed to idle forever.');
    return;
  }

  srv.log.misc('Target connections will be reclaimed after',
    tgtIdleSec, 'seconds of idleness.');

  srv.on('guestSeated', function onGuestSeated(ev) {
    ev.tgtSock.setTimeout(tgtIdleSec * 1e3);
  });



}

module.exports = require('plugmgr1801-pmb/plugify')(module, install);
