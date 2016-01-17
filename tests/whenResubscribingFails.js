"use strict";

let Subscription = require('../index.js');
let nock = require('nock');
let chai = require('chai');
let expect = chai.expect;

const host = 'testhost';
const port = '1235';
const uri = '/info';
const expectedSid = '54';
const expectedErrorMessage = 'something awful happened';

describe('When subscribed and resubscribe fails', function () {
    let subscription, mockedUpnpDevice, sid, error;
    before(function (done) {
        mockedUpnpDevice = nock(`http://${host}:${port}`)
            .intercept(uri, 'SUBSCRIBE')
            .reply(200, {}, { sid: expectedSid })
            .intercept(uri, 'SUBSCRIBE')
            .replyWithError(expectedErrorMessage);
        subscription = new Subscription(host, port, uri, 1.2);
        subscription.on('error:resubscribe', function (payload) {
            sid = payload.sid;
	    error = payload.error;
            done();
        });
    });
    after(function() {
        nock.cleanAll();
    });
    it('Should emit an error event with the correct SID', function () {
        expect(sid).to.be.eql(expectedSid);
    });
    it('Should emit an error event with the error', function () {
	expect(error.message).to.be.eql(expectedErrorMessage);
    });
});
