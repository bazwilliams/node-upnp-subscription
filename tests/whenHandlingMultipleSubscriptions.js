"use strict";

let Subscription = require('../index.js');
let async = require('async');
let nock = require('nock');
let chai = require('chai');
let expect = chai.expect;
let http = require('http');
let url = require('url');

const host1 = 'testhost';
const port1 = '12342';
const uri1 = '/info';
const expectedSid1 = '54';

const host2 = 'testhost2';
const port2 = '12343';
const uri2 = '/info';
const expectedSid2 = '55';

describe('When handling multiple subscriptions', function () {
    let subscription1, subscription2, mockedUpnpDevice1, mockedUpnpDevice2, sid1, sid2, responseServer1, responseServer2;
    before(function (done) {
        this.timeout(4000)
        mockedUpnpDevice1 = nock(`http://${host1}:${port1}`, {
                reqheaders: {
                    'CALLBACK': function (headerValue) {
                        responseServer1 = headerValue;
                        return true;
                    }
                }
            })
            .persist()
            .intercept(uri1, 'SUBSCRIBE')
            .reply(200, {}, { sid: expectedSid1 })
            .intercept(uri1, 'UNSUBSCRIBE')
            .reply(200, {}, { sid: expectedSid1 });
        mockedUpnpDevice2 = nock(`http://${host2}:${port2}`, {
                reqheaders: {
                    'CALLBACK': function (headerValue) {
                        responseServer2 = headerValue;
                        return true;
                    }
                }
            })
            .persist()
            .intercept(uri2, 'SUBSCRIBE')
            .reply(200, {}, { sid: expectedSid2 })
            .intercept(uri2, 'UNSUBSCRIBE')
            .reply(200, {}, { sid: expectedSid2 });
        subscription1 = new Subscription(host1, port1, uri1, 1.2);
        subscription2 = new Subscription(host2, port2, uri2, 1.2);
        let sub1, sub2;

        async.parallel({
            subscription1: function(callback) {
                subscription1.on('subscribed', function(payload) {
                    console.log('subscribed')
                    sid1 = payload.sid;

                    callback(null, true);
                });
            },
            subscription2: function(callback) {
                subscription2.on('subscribed', function(payload) {
                    console.log('subscribed')
                    sid2 = payload.sid;

                    callback(null, true);
                });
            }
        }, function(err, results) {
            if (results.subscription1 && results.subscription2) {
                done();
            }
        });
    });
    after(function() {
        subscription1.unsubscribe();
        subscription2.unsubscribe();
        nock.cleanAll();
    });
    it('the response server callbacks should be identical', () => {
        expect(responseServer1).to.eql(responseServer2);
    });
    describe('when subscription 1 receives a message', () => {
        let receivedMessage;
        before(function(done) {
            let parsedUrl = url.parse(responseServer2.slice(1, -1));

            subscription2.on('message', (msg) => {
                receivedMessage = msg;
                done();
            });

            let req = http.request({
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.path,
                method: '',
                headers: {
                    sid: sid2
                }
            }, (res) => {
                console.log(res);
            });
            req.end();
        });
        it('payload should have sid', () => {
            expect(receivedMessage.sid).to.eql(sid2);
        });
    });
});
