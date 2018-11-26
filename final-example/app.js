var express = require('express');
var bodyParser = require('body-parser');
var webpush = require('web-push');

const app = express();
// Configure static server
app.use(express.static('public'));
// Configure body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Vapid config
const vapidPublicKey = '< VAPID PUBLIC KEY >';
const vapidPrivateKey = '< VAPID PRIVATE KEY>';
webpush.setVapidDetails(
    'mailto:someemail@someemaildomain.com',
    vapidPublicKey,
    vapidPrivateKey
);

// Return public key
app.get('/api/key', function (req, res) {
    res.send({
        key: vapidPublicKey
    });
});

// Save subscription and send a message
app.post('/api/save-subscription', function (req, res) {
    // save req.body.subscription to a database
    const payload = 'Hola!';
    webpush.sendNotification(
        req.body.subscription,
        payload
    );

    res.send('Success');
});

module.exports = app;