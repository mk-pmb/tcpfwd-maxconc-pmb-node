/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX = {};


function ifFun(x, d) { return ((typeof x) === 'function' ? x : d); }


EX.expectFunc = function (f) {
  if (ifFun(f)) { return f; }
  throw new TypeError('Expected a function, not ' + String(f));
};


EX.handleEvents = function (ee, names, hnd) {
  EX.expectFunc(hnd);
  names.forEach(function (n) { ee.on(n, hnd.bind(ee, n)); });
};


EX.onlyOnce = function (f) {
  var r;
  EX.expectFunc(f);
  return function () {
    if (f) {
      r = f.apply(this, arguments);
      f = null;
    }
    return r;
  };
};


EX.soonOnce = function (f, d) {
  EX.expectFunc(f);
  if (f.timer) { return; }
  f.timer = setTimeout(function () {
    f.timer = null;
    f();
  }, (+d || 10));
};


EX.rememberConnect = function (socket) {
  socket.connectFailed = null;
  socket.once('error', function (err) {
    if (socket.connectFailed === null) { socket.connectFailed = err; }
  });
  socket.once('connect', function () {
    if (socket.connectFailed === null) { socket.connectFailed = false; }
  });
};







module.exports = EX;
