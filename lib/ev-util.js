/* -*- tab-width: 2 -*- */
'use strict';

const EX = {};


function ifFun(x, d) { return ((typeof x) === 'function' ? x : d); }


EX.expectFunc = function expectFunc(f) {
  if (ifFun(f)) { return f; }
  throw new TypeError('Expected a function, not ' + String(f));
};


EX.handleEvents = function handleEvents(ee, names, hnd) {
  EX.expectFunc(hnd);
  names.forEach(function install(n) { ee.on(n, hnd.bind(ee, n)); });
};


EX.onlyOnce = function onlyOnce(f) {
  let r;
  EX.expectFunc(f);
  return function cacheResult(...args) {
    if (f) {
      r = f(...args);
      f = null; // eslint-disable-line no-param-reassign
    }
    return r;
  };
};


EX.soonOnce = function soonOnce(f, d) {
  EX.expectFunc(f);
  if (f.timer) { return; }
  // eslint-disable-next-line no-param-reassign
  f.timer = setTimeout(function doit() {
    f.timer = null; // eslint-disable-line no-param-reassign
    f();
  }, (+d || 10));
};


EX.rememberConnect = function rememberConnect(socket) {
  const s = socket;
  s.connectFailed = null;
  s.once('error', function onError(err) {
    if (s.connectFailed === null) { s.connectFailed = err || true; }
  });
  s.once('connect', function onConnect() {
    if (s.connectFailed === null) { s.connectFailed = false; }
  });
};







module.exports = EX;
