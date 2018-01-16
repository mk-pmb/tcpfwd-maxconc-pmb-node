/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var connectSocket = require('net').connect, api,
  arSlc = Array.prototype.slice,
  connIdCounter = require('maxuniqid')(),
  sockAddrStr = require('sockaddrstr'),
  dropoutEvents = ['close', 'error', 'end'],
  goodbyeEvents = ['close', 'error', 'timeout'], // end: .pipe will care
  evut = require('./ev-util');


api = {

  stats: function () {
    return ('remaining seats: ' + this.seatsAvail +
      ', remaining waiting guests: ' + Object.keys(this.guestsWaiting).length);
  },


};


function install(srv, cfg) {
  var logMisc = srv.log.misc,
    SQ = Object.assign({ seatsAvail: cfg.maxConn, guestsWaiting: {} }, api);
  srv.seatQ = SQ;


  function checkTargetErrorInsanity(srv, err) {
    var sc = err.syscall, ec = err.code,
      at = (ec || '') + '@' + (sc || '');
    if (at === 'EINVAL@connect') { return srv.useless(err); }
    return false;
  }


  SQ.checkSeatAvail = function () {
    if (SQ.seatsAvail < 1) { return logMisc('No seats available.'); }
    var q = SQ.guestsWaiting, lucky = q[Object.keys(q)[0]], logPfx, fwd;
    if (!lucky) { return logMisc('No guests waiting.'); }
    logPfx = lucky.logPfx;

    lucky.releaseSeat = evut.onlyOnce(function () {
      SQ.seatsAvail += 1;
      logMisc(logPfx + 'disconnected from target',
        '=> seats available: ' + SQ.seatsAvail);
      evut.soonOnce(SQ.checkSeatAvail);
    });
    SQ.seatsAvail -= 1;
    delete q[lucky.id];
    logMisc(logPfx + 'connecting to target.', SQ.stats());
    fwd = connectSocket(cfg.tgtSpec);
    evut.rememberConnect(fwd);
    lucky.protectUntil = 0;
    lucky.maySpeakSince = false;    // not yet

    function goodbyeLucky() {
      var remain;
      if (lucky.protectUntil) {
        remain = lucky.protectUntil - Date.now();
        if (remain > 0) { return evut.soonOnce(goodbyeLucky, remain); }
        lucky.protectUntil = 0;
      }
      try { lucky.end(); } catch (ignore) {}
    }

    function unignore() {
      if (lucky.maySpeakSince) { return; }
      var now = (Date.now() || 1);
      lucky.maySpeakSince = now;
      srv.emit('guestMaySpeak', { seatQ: SQ, guest: lucky, tgtSock: fwd,
        since: now });
      // Now that plugins had their chance to subscribe .on('data'):
      lucky.resume();
    }

    function burnBridge(evName) {
      var evArgs = arSlc.call(arguments, 1), side = 'seat';
      if (this !== lucky) {
        side = 'target';
        unignore();   // <-- will emit guestMaySpeak,
            // so plugins get a chance to protect lucky.
      }
      logMisc(logPfx + side + ' ' + evName + '!', evArgs);
      try { fwd.end(); } catch (ignore) {}
      goodbyeLucky();
    }

    srv.emit('guestSeated', { seatQ: SQ, guest: lucky, tgtSock: fwd });
    evut.handleEvents(lucky, goodbyeEvents, burnBridge);
    evut.handleEvents(fwd,   goodbyeEvents, burnBridge);
    lucky.pipe(fwd).pipe(lucky);
    fwd.on('error', checkTargetErrorInsanity.bind(null, srv));
    fwd.once('close', lucky.releaseSeat);
    fwd.once('connect', function () {
      logMisc(logPfx + 'connection established.');
      unignore();
    });
    evut.soonOnce(SQ.checkSeatAvail);
  };


  function nqGuest(conn) {
    var connId = connIdCounter(), logPfx = 'Guest ' + connId + ': ';
    conn.id = connId;
    conn.logPfx = logPfx;

    conn.addrDescr = sockAddrStr(conn);
    // save it while the socket still knows it.

    SQ.guestsWaiting[connId] = conn;
    function lostEarly(evName) {
      if (SQ.guestsWaiting[connId] !== conn) { return; }   // no longer in Q
      delete SQ.guestsWaiting[connId];
      var evArgs = arSlc.call(arguments, 1);
      logMisc(logPfx + 'queue ' + evName + '!', evArgs, SQ.stats());
    }
    evut.handleEvents(conn, dropoutEvents, lostEarly);
    srv.emit('guestWaiting', { seatQ: SQ, guest: conn, tgtSock: null });
    evut.soonOnce(SQ.checkSeatAvail);
  }






  // register our handler very late: Any handlers that should trigger
  // after it, can instead subscribe to the "guestSeated" event.
  srv.once('listening', function () { srv.on('connection', nqGuest); });
}

module.exports = require('plugmgr1801-pmb/plugify')(module, install);
