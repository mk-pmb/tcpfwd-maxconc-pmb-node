/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

require('autoquit');

var srv, net = require('net'),
  arSlc = Array.prototype.slice,
  cliArgs = process.argv.slice(1),
    // ^-- start at arg 1 to allow -r -e hack:
    //     nodejs -r tcpfwd-maxconc-pmb -e 0 -- max_conc=5
  cfg = require('cfg-cli-env-180111-pmb')(cliArgs, process.env),
  sockAddrStr = require('sockaddrstr'),
  smartListen = require('net-smartlisten-pmb'),
  connIdCounter = require('maxuniqid')(),
  consts = { secondsPerMinute: 60 },
  tgtConnect;

function connectTCP() { return net.connect(cfg.tgtPort, cfg.tgtName); }
function connectUDS() { return net.connect(cfg.tgtName); }


(function configure() {
  cfg.tgtName = (cfg('tgt_host') || cfg('tgt_name') || 'localhost');
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
  cfg.idleQuit = (+cfg('idle_quit') || 0);   // minutes

  tgtConnect = connectTCP;
  if (cfg.tgtName.substr(0, 1) === '/') { tgtConnect = connectUDS; }

  cfg.tgtDescrArrow = ('--{maxConc=' + cfg.maxConn + '}--> ' +
    cfg.tgtName + ':' + cfg.tgtPort);
  cfg.lsnSpec = smartListen({ addr: cfg('lsn_addr'), port: cfg.lsnPort });
}());


function identity(x) { return x; }
function lenProp(x) { return (x || false).length; }

function clog(lvl, pre, conv) {
  if (lvl > cfg.verbosity) { return identity; }
  pre = ['<date>'].concat(pre || []);
  return function () {
    pre[0] = (new Date()).toLocaleTimeString();
    var msg = arSlc.call(arguments);
    if (conv) { msg = msg.map(conv); }
    console.log.apply(console, pre.concat(msg));
  };
}
clog.misc = clog(0);



srv = net.createServer({ pauseOnConnect: true });
srv.seatsAvail = cfg.maxConn;
srv.guestsWaiting = {};
srv.qStats = function () {
  return ('remaining seats: ' + srv.seatsAvail +
    ', remaining waiting guests: ' + Object.keys(srv.guestsWaiting).length);
};


if (cfg.idleQuit) {
  clog.misc('Will idle-quit after', cfg.idleQuit, 'minutes of inactivity.');
  srv.getBored = function () {
    clog.misc('Gonna idle-quit.');
    srv.close();
  };
  srv.autoQuit({ exitFn: srv.getBored,
    timeOut: cfg.idleQuit * consts.secondsPerMinute });
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
  lucky.lostEarly = false;
  clog.misc(logPfx + 'connecting.', srv.qStats());
  fwd = tgtConnect();

  function burnBridge() {
    try { fwd.end(); } catch (ignore) {}
    try { lucky.end(); } catch (ignore) {}
  }

  fwd.on('close', releaseSeat);
  fwd.on('close', burnBridge);
  fwd.on('error', burnBridge);
  lucky.on('close', burnBridge);
  lucky.on('error', burnBridge);
  fwd.on('connect', function () {
    clog.misc(logPfx + 'plumbing the pipes.');
    lucky.pipe(fwd).pipe(lucky);
  });
  if (cfg.verbosity >= 8) {
    lucky.on('data', clog(0, [logPfx + '>> n_bytes ='], lenProp));
    fwd.on('data', clog(0, [logPfx + '<< n_bytes ='], lenProp));
  }
  lucky.resume();
  soonOnce(checkSeatAvail);
}


srv.on('connection', function (conn) {
  var connId = connIdCounter(), logPfx = 'Guest ' + connId + ': ';
  conn.id = connId;
  conn.logPfx = logPfx;
  srv.guestsWaiting[connId] = conn;
  conn.lostEarly = function () {
    if (!conn.lostEarly) { return; }
    clog.misc(logPfx + 'disappeared from queue.', srv.qStats());
    delete srv.guestsWaiting[connId];
  };
  conn.on('close', conn.lostEarly);
  clog.misc(logPfx + sockAddrStr(conn) + ' enqueued.', srv.qStats());
  soonOnce(checkSeatAvail);
});

srv.on('listening', function () {
  clog.misc('Listening.', sockAddrStr(srv), cfg.tgtDescrArrow);
});

clog.misc('Gonna listen on', String(cfg.lsnSpec), cfg.tgtDescrArrow);
srv.listen(cfg.lsnSpec);
















/*np2*/
