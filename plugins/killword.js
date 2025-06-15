/* -*- tab-width: 2 -*- */
'use strict';

function install(srv, cfg) {
  const killword = (cfg('killword') || ''); const
    sliceLen = killword.length + 2;
  if (!killword) { return; }
  srv.log.cfg('Kill word is ' + killword.length + ' characters long.');

  function checkFirstChunk(guest, chunk) {
    guest.protectUntil = 0; // eslint-disable-line no-param-reassign
    const cleaned = String(chunk.slice(0, sliceLen)).replace(/[\r\n]+$/, '');
    if (cleaned !== killword) { return; }
    srv.log.misc(guest.logPfx + 'knew the killword.');
    srv.useless('received killword from ' + guest.addrDescr);
    try { guest.send('+OK Goodbye\n'); } catch (ignore) { ; }
    try { guest.end(); } catch (ignore) { ; }
  }

  srv.on('guestMaySpeak', function onGuestMaySpeak(ev) {
    const { guest } = ev;
    guest.once('data', checkFirstChunk.bind(null, ev.guest));

    // Also make sure the guest gets a chance to send the killword,
    // even when the target connection fails very quickly:
    guest.protectUntil = ev.since + 5e3;
  });



}

module.exports = require('plugmgr1801-pmb/plugify')(module, install);
