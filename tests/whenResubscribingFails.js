"use strict";

let Subscription = require('../index.js');
let nock = require('nock');
let chai = require('chai');
let expect = chai.expect;

const host = 'testhost';
const port = '1235';
const uri = '/info';
const expectedSid = '54';

describe('When subscribed and resubscribe fails', function () {
    let subscription, mockedUpnpDevice, sid;
    beforeEach(function (done) {
        mockedUpnpDevice = nock(`http://${host}:${port}`)
            .intercept(uri, 'SUBSCRIBE')
            .reply(200, {}, { sid: expectedSid })
            .intercept(uri, 'SUBSCRIBE')
            .replyWithError('something awful happened');
        subscription = new Subscription(host, port, uri, 1.2);
        subscription.on('error', function (payload) {
            sid = payload.sid;
            done();
        });
    });
    afterEach(function() {
        nock.cleanAll();
    });
    it('Should emit an error event with the correct SID', function () {
        expect(sid).to.be.eql(expectedSid);
    });
});