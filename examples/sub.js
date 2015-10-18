var Subscription = require('../index.js');
var _ = require('underscore');
var xml2js = require('xml2js');
var xmlParser = new xml2js.Parser({explicitArray: false});

function elementText(element) {
    return _.isObject(element) ? element._ : element;
}
function first(element) {
    return _.isArray(element) ? element[0] : element;
}

function logEvent(data) {
    console.log(JSON.stringify(data.body));
}

function processInfo(callback) {
    return function parseInfoEvent(data) {
        if (data.body['e:propertyset']['e:property']) {
            var dictionary = _.chain(data.body['e:propertyset']['e:property'])
                .reduce(_.extend, {})
                .pick('Uri', 'Metadata')
                .value();
            if (dictionary.Metadata) {
                xmlParser.parseString(dictionary.Metadata, function (err, result) {
                    callback(null, {
                        uri: dictionary.Uri,
                        artist: elementText(first(result['DIDL-Lite'].item['upnp:artist'])),
                        title: elementText(first(result['DIDL-Lite'].item['dc:title'])),
                        albumArt: elementText(first(result['DIDL-Lite'].item['upnp:albumArtURI'])),
                        album: elementText(first(result['DIDL-Lite'].item['upnp:album']))
                    });
                });
            } else {
                callback(new Error('No metadata found'), JSON.stringify(data.body['e:propertyset']['e:property']));
            }
        } else {
            callback(new Error('No track found'), JSON.stringify(data.body['e:propertyset']['e:property']));
        }
    };
}

var host = '192.168.1.129';
var port = 55178;
var infoSubUri = '/Ds/Info/event';
var productSubUri = '/Ds/Product/event';

var infoSub = new Subscription(host, port, infoSubUri);
infoSub.on('message', processInfo(console.log));
var productSub = new Subscription(host, port, productSubUri);
productSub.on('message', processInfo(console.log));

setTimeout(infoSub.unsubscribe, 120000);
setTimeout(productSub.unsubscribe, 120000);
