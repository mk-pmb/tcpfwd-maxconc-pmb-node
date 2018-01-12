/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

require('autoquit');

var srv, net = require('net'), clog = require('./log-util')(),
  arSlc = Array.prototype.slice,
  cliArgs = process.argv.slice(1),
    // ^-- start at arg 1 to allow -r -e hack:
    //     nodejs -r tcpfwd-maxconc-pmb -e 0 -- max_conc=5
  cfg = require('cfg-cli-env-180111-pmb')(cliArgs, process.env),
  sockAddrStr = require('sockaddrstr'),
  smartListen = require('net-smartlisten-pmb'),
  connIdCounter = require('maxuniqid')(),
  consts = { secondsPerMinute: 60, millisecPerSecond: 1e3,
    dropoutEvents: ['close', 'error', 'end'],
    goodbyeEvents: ['close', 'error', 'timeout'], // end: .pipe will care
    };


(function configure() {
  cfg.tgtAddr = (cfg('tgt_host') || cfg('tgt_addr') || 'localhost');
  cfg.tgtIdleSec = (+cfg('tgt_idle') || 0);
  var tgtPort = (+cfg('tgt_port')
    || cfg.guessProxyPort('https')
    || cfg.guessProxyPort('http')
    || 0);
  cfg.tgtPort = tgtPort;
  cfg.lsnPort = (+cfg('lsn_port')
    || ((tgtPort > 1024) && (tgtPort + 1))
    || ((tgtPort > 0) && (tgtPort + 4000))
    || 8280);
  cfg.maxConn = (+cfg('max_conn') || +cfg('max_conc') || 1);
  cfg.verbosity = (+cfg('debuglevel') || +cfg('loglv') || 0);
  cfg.idleQuitMin = (+cfg('idle_quit') || 0);    // minutes

  cfg.lsnSpec = smartListen({ addr: cfg('lsn_addr'),  port: cfg.lsnPort });
  cfg.tgtSpec = smartListen({ addr: cfg.tgtAddr,      port: cfg.tgtPort });
  cfg.tgtDescrArrow = ('--{maxConc=' + cfg.maxConn + '}--> '
    + String(cfg.tgtSpec));
}());


function handleEvents(ee, names, hnd) {
  names.forEach(function (n) { ee.on(n, hnd.bind(ee, n)); });
}

function lenProp(x) { return (x || false).length; }

srv = net.createServer({ pauseOnConnect: true });
srv.seatsAvail = cfg.maxConn;
srv.guestsWaiting = {};
srv.qStats = function () {
  return ('remaining seats: ' + srv.seatsAvail +
    ', remaining waiting guests: ' + Object.keys(srv.guestsWaiting).length);
};


if (cfg.tgtIdleSec > 0) {
  clog.misc('Target connections are reclaimed after', cfg.tgtIdleSec,
    'seconds of idleness.');
} else {
  clog.misc('Target connections are allowed to idle forever.');
}

if (cfg.idleQuitMin) {
  clog.misc('Will idle-quit after', cfg.idleQuitMin, 'minutes of inactivity.');
  srv.getBored = function () {
    clog.misc('Gonna idle-quit.');
    srv.close();
  };
  srv.autoQuit({ exitFn: srv.getBored,
    timeOut: cfg.idleQuitMin * consts.secondsPerMinute });
}


function soonOnce(f) {
  if (f.timer) { return; }
  f.timer = setTimeout(function () {
    f.timer = null;
    f();
  }, 10);
}


function checkSeatAvail() {
  if (srv.seatsAvail < 1) { return clog.misc('No seats available.'); }
  var q = srv.guestsWaiting, lucky = q[Object.keys(q)[0]], logPfx, fwd;
  if (!lucky) { return clog.misc('No guests waiting.'); }
  logPfx = lucky.logPfx;

  function releaseSeat() {
    if (releaseSeat.done) { return; }
    srv.seatsAvail += 1;
    releaseSeat.done = true;
    clog.misc(logPfx + 'disconnected => seats available: ' + srv.seatsAvail);
    soonOnce(checkSeatAvail);
  }
  srv.seatsAvail -= 1;
  delete q[lucky.id];
  clog.misc(logPfx + 'connecting to target.', srv.qStats());
  fwd = net.connect(cfg.tgtSpec);
  fwd.on('close', releaseSeat);
  if (cfg.tgtIdleSec > 0) {
    fwd.setTimeout(cfg.tgtIdleSec * consts.millisecPerSecond);
  }

  function burnBridge(evName) {
    var evArgs = arSlc.call(arguments, 1),
      side = (this === lucky ? 'seat' : 'target');
    clog.misc(logPfx + side + ' ' + evName + '!', evArgs);
    try { fwd.end(); } catch (ignore) {}
    try { lucky.end(); } catch (ignore) {}
  }

  handleEvents(lucky, consts.goodbyeEvents, burnBridge);
  handleEvents(fwd,   consts.goodbyeEvents, burnBridge);
  lucky.pipe(fwd).pipe(lucky);
  fwd.on('connect', function () {
    clog.misc(logPfx + 'connection established.');
    lucky.resume();
  });
  if (cfg.verbosity >= 8) {
    lucky.on('data', clog(0, [logPfx + '>> n_bytes ='], lenProp));
    fwd.on('data', clog(0, [logPfx + '<< n_bytes ='], lenProp));
  }
  soonOnce(checkSeatAvail);
}


srv.on('connection', function (conn) {
  var connId = connIdCounter(), logPfx = 'Guest ' + connId + ': ';
  conn.id = connId;
  conn.logPfx = logPfx;
  srv.guestsWaiting[connId] = conn;
  function lostEarly(evName) {
    if (srv.guestsWaiting[connId] !== conn) { return; }   // no longer in Q
    delete srv.guestsWaiting[connId];
    var evArgs = arSlc.call(arguments, 1);
    clog.misc(logPfx + 'queue ' + evName + '!', evArgs, srv.qStats());
  }
  handleEvents(conn, consts.dropoutEvents, lostEarly);
  clog.misc(logPfx + sockAddrStr(conn) + ' enqueued.', srv.qStats());
  soonOnce(checkSeatAvail);
});

srv.on('listening', function () {
  clog.misc('Listening.', sockAddrStr(srv), cfg.tgtDescrArrow);
});

clog.misc('Gonna listen on', String(cfg.lsnSpec), cfg.tgtDescrArrow);
srv.listen(cfg.lsnSpec);
















/*np2*/
