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
    let subscription, mockedUpnpDevice, sid;
    beforeEach(function (done) {
        mockedUpnpDevice = nock(`http://${host}:${port}`)
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
    afterEach(function() {
        subscription.unsubscribe();
    });
    after(function() {
        nock.cleanAll();
    });
    it('Should emit a subscribed event with the correct SID', function () {
        expect(sid).to.be.eql(expectedSid);
    });
});