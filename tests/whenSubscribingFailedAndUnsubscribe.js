"use strict";

let Subscription = require('../index.js');
let nock = require('nock');
let chai = require('chai');
let expect = chai.expect;

const host = 'testhost';
const port = '1235';
const uri = '/info';
const expectedErrorMessage = 'something awful happened';

describe('When subscribe failed and then unsubscribing', function () {
    let mockedUpnpDevice, subscription, error;
    before(function (done) {
        mockedUpnpDevice = nock(`http://${host}:${port}`)
            .intercept(uri, 'SUBSCRIBE')
            .replyWithError(expectedErrorMessage);
        subscription = new Subscription(host, port, uri, 1.2);
	subscription.on('error:unsubscribe', (payload) => {
            error = payload;
            done();
	});
        subscription.on('error', (payload) => {
            subscription.unsubscribe();
        });
    });
    it('Should emit an error event with the error', function () {
        expect(error.message).to.be.eql('No SID for subscription');
    });
});
