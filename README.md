Node UPNP Subscription Library
==============================

Library to manage subscriptions, renewals and unsubscription of UPNP subscriptions. 

Events are currently handled via a provided callback which will be passed all the data from the event as a Javascript object. XML is automatically parsed into a javascript object. 

## Example

```javascript
var Subscription = require('node-upnp-subscription');

var host = '192.168.1.122';
var port = 55178;
var infoSubUri = '/Ds/Info/event';

var infoSub = new Subscription(host, port, infoSubUri);
infoSub.on('message', processInfo(console.log));

setTimeout(infoSub.unsubscribe, 12000);
```
