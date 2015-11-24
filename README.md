Node UPNP Subscription Library
==============================

Library to manage subscriptions, renewals and unsubscription of UPNP subscriptions. 

Events are currently handled via a provided callback which will be passed all the data from the event as a Javascript object. XML is automatically parsed into a javascript object. 

## Installation

`npm install node-upnp-subscription`

## Example

```javascript
var Subscription = require('node-upnp-subscription');

var host = '192.168.1.122';
var port = 55178;
var infoSubUri = '/Ds/Info/event';

var infoSub = new Subscription(host, port, infoSubUri);
infoSub.on('message', console.log);

setTimeout(infoSub.unsubscribe, 12000);
```

## Usage

### Construction

On construction, a local HTTP server will begin to listen on a random port and a subscribe request will be made to the Upnp device advertising this address and a resubscribe timer is set. If the subscribe attempt fails, the resubscribe interval is not cancelled. When a response is received, the subscription Id `sid` is returned in an event. 

The resubscribe timer will cause a subscribe attempt to be resent to keep the Upnp subscription alive. If this fails for any reason an event is emitted, but the resubscribe interval will not be cancelled. 

### Unsubscribe

On unsubscribe, the resubscribe timer will be cancelled and the listening HTTP server closed. An unsubscribe request will be made to the Upnp device, if this fails an event is emitted with the reason. 

## Events

### Initialisation

* `subscribed` - Will return the `sid`
* `error` - Will return the error object which occured during subscribe attempt. 

### Resubscribe

* `resubscribed` - Will return the `sid`
* `error` - Will return both the `sid` of the subscription and the HTTP error object. 
 
### Unsubscribe

* `unsubscribed` - Will return the now defunct `sid`
* `error` - Will return the HTTP error object.
