"use strict";

let http = require('http');
let portfinder = require('portfinder');
let ip = require('ip');
let util = require('util');
let events = require('events');
let xmlResponseParser = require('parsexmlresponse');

function Subscription(host, port, eventSub, requestedTimeoutSeconds) {
    let sid, resubscribeInterval, httpSubscriptionResponseServer, emitter, timeoutSeconds = requestedTimeoutSeconds || 1800;
    events.EventEmitter.call(this);
    emitter = this;
    this.unsubscribe = function unsubscribe() {
        clearInterval(resubscribeInterval);
        httpSubscriptionResponseServer.close();
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
                emitter.emit('error', e);
            }).end();
        } else {
            emitter.emit('error', new Error('No SID for subscription'));
        }
    };
    portfinder.getPort(function (err, availablePort) {
        httpSubscriptionResponseServer = http.createServer();
        httpSubscriptionResponseServer.on('request', xmlResponseParser(function (err, data) {
            emitter.emit('message', { sid: sid, body: data });
        }));
        httpSubscriptionResponseServer.listen(availablePort, function() {
            http.request({
                host: host,
                port: port,
                path: eventSub,
                method: 'SUBSCRIBE',
                headers: {
                    'CALLBACK': "<http://" + ip.address() + ':' + availablePort + ">",
                    'NT': 'upnp:event',
                    'TIMEOUT': 'Second-' + timeoutSeconds
                }
            }, function(res) {
                emitter.emit('subscribed', { sid: res.headers.sid });
                sid = res.headers.sid;
            }).on('error', function(e) {
                emitter.emit('error', e);
            }).end();
        });
        resubscribeInterval = setInterval(function() {
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
                }).on('error', function (e) {
                    emitter.emit('error', { sid: sid, error: e });
                }).end();
            }
        }, (timeoutSeconds-1) * 1000)
    });
}
util.inherits(Subscription, events.EventEmitter);
module.exports = Subscription;
