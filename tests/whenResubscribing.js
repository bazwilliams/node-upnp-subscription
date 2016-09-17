"use strict";

let Subscription = require('../index.js');
let nock = require('nock');
let chai = require('chai');
let expect = chai.expect;

const host = 'testhost';
const port = '12342';
const uri = '/info';
const expectedSid = '54';

describe('When subscribed and resubscribing', function () {
    let subscription, mockedUpnpDevice, sid, timeoutHeader;
    before(function (done) {
        mockedUpnpDevice = nock(`http://${host}:${port}`, {
                reqheaders: {
                    'TIMEOUT': function (headerValue) {
                        timeoutHeader = headerValue;
                        return true;
                    }
                }
            })
            .persist()
            .intercept(uri, 'SUBSCRIBE')
            .reply(200, {}, { sid: expectedSid })
            .intercept(uri, 'UNSUBSCRIBE')
            .reply(200, {}, { sid: expectedSid });
        subscription = new Subscription(host, port, uri, 1.2);
        subscription.on('resubscribed', function(payload) {
            sid = payload.sid;
            done();
        });
    });
    after(function() {
        subscription.unsubscribe();
    });
    after(function() {
        nock.cleanAll();
    });
    it('Should emit a resubscribed event with the correct SID', function () {
        expect(sid).to.be.eql(expectedSid);
    });
    it('Should send the timeout value', function () {
        expect(timeoutHeader).to.be.eql('Second-1.2');
    });
});
