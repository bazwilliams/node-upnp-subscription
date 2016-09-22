"use strict";

let http = require('http');
let portfinder = require('portfinder');
let ip = require('ip');
let util = require('util');
let events = require('events');
let xml = require('xml2js');

let httpServerPort;

let subscriptions = new Map();

portfinder.getPort(function (err, availablePort) {
    httpServerPort = availablePort
    http.createServer(function (req, res) {
      var buffer = ''
      req.on('data', function (d) {
        buffer += d
      })

      req.on('end', function () {
        req.body = buffer

        let sid = req.headers.sid;

        xml.parseString(req.body, (err, result) => {
            let emitter = subscriptions.get(sid);
            if (emitter) {
                emitter.emit('message', { sid: sid, body: result });
            }
        })

        res.end()
      })
    }).listen(httpServerPort)
});

function Subscription(host, port, eventSub, requestedTimeoutSeconds) {
    let sid,
        resubscribeTimeout,
        emitter = this,
        timeoutSeconds = requestedTimeoutSeconds || 1800;
    function resubscribe() {
        if (sid) {
            var req = http.request({
                host: host,
                port: port,
                path: eventSub,
                method: 'SUBSCRIBE',
                headers: {
                    'SID': sid,
                    'TIMEOUT': 'Second-' + timeoutSeconds
                }
            }, function(res) {
                emitter.emit('resubscribed', { sid: sid });
                resubscribeTimeout = setTimeout(resubscribe, (timeoutSeconds-1) * 1000)
            }).on('error', function (e) {
                emitter.emit('error:resubscribe', { sid: sid, error: e });
            }).end();
        }
    }
    function unsubscribe() {
        clearTimeout(resubscribeTimeout);
        if (sid) {
            http.request({
                host: host,
                port: port,
                path: eventSub,
                method: 'UNSUBSCRIBE',
                headers: {
                    'SID': sid
                }
            }, function(res) {
                emitter.emit('unsubscribed', { sid: sid });
            }).on('error', function(e) {
                emitter.emit('error:unsubscribe', e);
            }).setTimeout(3000, () => emitter.emit('unsubscribed', { sid: sid })).end();
        } else {
            emitter.emit('error:unsubscribe', new Error('No SID for subscription'));
        }
        subscriptions.delete(sid);
    }
    http.request({
        host: host,
        port: port,
        path: eventSub,
        method: 'SUBSCRIBE',
        headers: {
            'CALLBACK': "<http://" + ip.address() + ':' + httpServerPort + ">",
            'NT': 'upnp:event',
            'TIMEOUT': 'Second-' + timeoutSeconds
        }
    }, function(res) {
        emitter.emit('subscribed', { sid: res.headers.sid });
        sid = res.headers.sid;
        if (res.headers.timeout) {
            let subscriptionTimeout = res.headers.timeout.match(/\d+/);
            if (subscriptionTimeout) {
                timeoutSeconds = subscriptionTimeout[0];
            }
        }
        resubscribeTimeout = setTimeout(resubscribe, (timeoutSeconds-1) * 1000);
        subscriptions.set(sid, emitter);
    }).on('error', function(e) {
        emitter.emit('error', e);
        subscriptions.delete(sid);
    }).end();
    events.EventEmitter.call(this);
    this.unsubscribe = unsubscribe;
}
util.inherits(Subscription, events.EventEmitter);
module.exports = Subscription;
