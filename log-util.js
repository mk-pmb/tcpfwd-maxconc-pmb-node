/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var arSlc = Array.prototype.slice;

function identity(x) { return x; }

module.exports = function () {
  function clog(lvl, pre, conv) {
    if (lvl > clog.verbosity) { return identity; }
    pre = ['<date>'].concat(pre || []);
    return function () {
      pre[0] = (new Date()).toLocaleTimeString();
      var msg = arSlc.call(arguments);
      if (conv) { msg = msg.map(conv); }
      console.log.apply(console, pre.concat(msg));
    };
  }
  clog.verbosity = 0;
  clog.misc = clog(clog.verbosity);





  return clog;
};
