// eslint-disable-next-line spaced-comment
/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';
require('p-fatal');
require('esbrowserify-pmb')({
  srcAbs: require.resolve('..'),
  targetPlatform: 'nodejs',
  saveAs: './node_modules/tcpfwd.static.js',
  verbosity: 1,
  minify: false,  // saves about 5% => not worth the obfuscation.
});
