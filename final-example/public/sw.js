importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.6.1/workbox-sw.js');

workbox.precaching.precacheAndRoute([
    { url: 'styles/main.css', revision: '35690' },
    { url: 'scripts/main.js', revision: '35690' },
    { url: '/', revision: '35690' },
]);

self.addEventListener('push', function(event) {
    event.waitUntil(
        registration.showNotification('Test-push', {
            body: event.data ? event.data.text() : 'no payload',
            icon: 'images/push-icon.png',
            badge: 'images/letter_k.png'
        })
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(clients.openWindow('/'));
});