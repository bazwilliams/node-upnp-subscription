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

function processTime(callback) {
    return function parseTimeEvent(data) {
        if (data.body['e:propertyset']['e:property']) {
            if (data.body['e:propertyset']['e:property'].Seconds) {
                callback(null, { time: data.body['e:propertyset']['e:property'].Seconds });
            } else if (data.body['e:propertyset']['e:property'].Standby) {
		callback(null, { standby: data.body['e:propertyset']['e:property'] ? true : false });
            } else {
                callback(new Error('No time found'), JSON.stringify(data.body['e:propertyset']['e:property']));
            }
        } else {
            callback(new Error('No data found'), JSON.stringify(data.body['e:propertyset']['e:property']));
        }
    };
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
            callback(new Error('No data found'), JSON.stringify(data.body['e:propertyset']['e:property']));
        }
    };
}

var host = '192.168.1.122';
var port = 55178;
var infoSubUri = '/Ds/Info/event';
//var productSubUri = '/Ds/Product/event';
var timeSubUri = '/Ds/Time/event';

var infoSub = new Subscription(host, port, infoSubUri);
infoSub.on('message', processInfo(console.log));
var timeSub = new Subscription(host, port, timeSubUri);
timeSub.on('message', processTime(console.log));

setTimeout(infoSub.unsubscribe, 12000);
setTimeout(timeSub.unsubscribe, 12000);
