"use strict";

const nock = require('nock');
const chai = require('chai');
const expect = chai.expect;

const async = require('async');
const mockery = require('mockery');

const host = 'testhost';
const port = '12342';
const uris = ['/info1', '/info2', '/info3', '/info4', '/info5', '/info6', '/info7', '/info8', '/info9', '/info10', '/info11', '/info12', '/info13'];

const expectedSid = '54';

describe('When subscribing many at once', function () {
    let subscriptions, mockedUpnpDevice, portFoundCallback, sids;
    before(function (done) {
        let portfinderStub = {
            getPort: (cb) => {
                portFoundCallback = cb;
            }
        };
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });
        mockery.registerMock('portfinder', portfinderStub);

        let Subscription = require('../index.js');

        subscriptions = uris.map((uri) => {
            mockedUpnpDevice = nock(`http://${host}:${port}`)
                .persist()
                .intercept(uri, 'SUBSCRIBE')
                .reply(200, {}, { sid: expectedSid })
                .intercept(uri, 'UNSUBSCRIBE')
                .reply(200, {}, { sid: expectedSid });
            return new Subscription(host, port, uri, 1.2)
        });

        portFoundCallback(null, 56567);

        async.map(subscriptions, (sub, iterCallback) => sub.on('subscribed', (data) => iterCallback(null, data.sid)), (err, data) => {
            sids = data;
            done();
        });
    });
    afterEach(function () {
        mockery.deregisterAll();
        mockery.disable();
    });
    after(function() {
        subscriptions.forEach((sub) => sub.unsubscribe());
        nock.cleanAll();
    });
    it('Should emit a subscribed event with the correct SID', function () {
        expect(sids).to.include(expectedSid);
    });
});
