
<!--#echo json="package.json" key="name" underline="=" -->
tcpfwd-maxconc-pmb
==================
<!--/#echo -->

<!--#echo json="package.json" key="description" -->
Transparently proxy TCP connections (&#39;forward&#39; their data), with a
limit on the total number of concurrent connections (maxconn, maxsockets).
Might help guard your proxy from overly aggressive programs.
<!--/#echo -->


Usage
-----

```bash
$ echo $https_proxy
http://hostname.currently.ignored:8118/
$ nodejs -r tcpfwd-maxconc-pmb -e 0 -- max_conc=5
17:12:16 Gonna listen on TCP localhost:8119 --{maxConc=5}--> localhost:8118
17:12:16 Listening. 127.0.0.1:8119 --{maxConc=5}--> localhost:8118
```


Options
-------

Options can be given via
* CLI with dashes, e.g. `--max-conc=5`
* CLI with underscores, e.g. `max_conc=5`
* environment variables, e.g. `MAX_CONC=5`
* additional undocumented methods that you shouldn't rely on.

Available options:
* `max_conc` (typo fallback: `max_conn`):
  Up to how many connections the target
  shall be bothered with at the same time.
* `tgt_host` or `tgt_addr`: Where to connect (target).
  * Currently defaults to `localhost`, but might change to an attempt
    at guessing your HTTP(S) proxy hostname.
  * Can also be a unix domain socket path.
* `tgt_port`: In case the target looks like TCP, this is the port.
  If empty or zero, tries to guess your HTTP(S) proxy's port and use that.
* `lsn_addr`: Like `tgt_addr` but for where the proxy itself shall listen.
  * Can be anything supported by [net-smartlisten-pmb][npm-smartlisten],
    e.g. a unix domain socket path or `systemd:`.
* `lsn_port`: In case `lsn_addr` looks like TCP, this is the port.
  If empty or zero, a port is chosen based on `tgt_port` and some offset
  to ensure its above 1024.
* `debuglevel` or `loglv`: Verbosity level as a number. Default: 0.
  You'll need negative numbers to make the proxy quiet.
* `idle_quit`: Close the server after this many minutes(!) without activity.
  * __BUG:__ [Not yet reliable][autoquit-bug-4] at time of this writing,
    but I hope newer versions of `autoquit` will support it.
* `tgt_idle`: If set to a positive number, target connections are reclaimed
  after `tgt_idle` seconds without data transfer.
  Default: 0 = Target is allowed to idle forever.



!!! Recommended options

* To guard your proxy from
  [npm bug 18903](https://github.com/npm/npm/issues/18903):
  `max_conc=25 tgt_idle=5`




<!--#toc stop="scan" -->



Known issues
------------

* Needs more/better tests and docs.




&nbsp;

  [npm-smartlisten]: https://www.npmjs.com/package/net-smartlisten-pmb
  [autoquit-bug-4]: https://github.com/rubenv/node-autoquit/issues/4

License
-------
<!--#echo json="package.json" key=".license" -->
ISC
<!--/#echo -->
