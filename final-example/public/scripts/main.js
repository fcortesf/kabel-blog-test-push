window.addEventListener('load', function (event) {
    // Register service worker
    if (canRegisterSw()) {
        navigator.serviceWorker.register('sw.js');
    }
    if (canUsePush()) {
        document.getElementById('subscribe-btn').addEventListener('click', subscribe);
        document.getElementById('unsubscribe-btn').addEventListener('click', unsubscribePush);
        getPushSubscription().then(function (subscription) {
            if (subscription) {
                document.getElementById('subscribe-btn').innerHTML = "Send Msg";
            }
        });
    }
    mangeButtonsStatus();
    manageOfflineAlert();
    window.addEventListener('offline', manageConnection);
    window.addEventListener('online', manageConnection);
});

function manageConnection() {
    mangeButtonsStatus();
    manageOfflineAlert();
}

function manageOfflineAlert() {
    if (!navigator.onLine) {
        document.getElementById('offline-alert').classList.remove('disabled');
    }
    else{
        document.getElementById('offline-alert').classList.add('disabled');
    }
}

function mangeButtonsStatus() {
    if (canUsePush() && navigator.onLine) {
        enableButtons();
    }
    else {
        disableButtons();
    }
}

function disableButtons() {
    document.getElementById('subscribe-btn').setAttribute('disabled', true);
    document.getElementById('unsubscribe-btn').setAttribute('disabled', true);
}

function enableButtons() {
    document.getElementById('subscribe-btn').removeAttribute('disabled');
    document.getElementById('unsubscribe-btn').removeAttribute('disabled');
}

function canRegisterSw() {
    return !!navigator.serviceWorker;
}

function canUsePush() {
    return canRegisterSw() && ('PushManager' in window);
}

function subscribe() {
    fetch('./api/key')
        .then(function (res) {
            res.json().then(function (data) {
                registerPush(data.key);
            });
        });
}

function getPushSubscription() {
    return navigator.serviceWorker.ready
        .then(function (registration) {
            return registration.pushManager.getSubscription();
        });
}

function unsubscribePush() {
    return getPushSubscription().then(function (subscription) {
        return subscription.unsubscribe().then(function () {
            document.getElementById('subscribe-btn').innerHTML = "Subscribe";
            // Call your server to delete the subscription            
        });
    });
}

function registerPush(appPubkey) {

    navigator.serviceWorker.ready.then(function (registration) {
        return registration.pushManager.getSubscription()
            .then(function (subscription) {

                if (subscription) {
                    return subscription;
                }
                document.getElementById('subscribe-btn').innerHTML = "Subscribing";
                return registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(appPubkey)
                });
            })
            .then(function (subscription) {
                return fetch('./api/save-subscription', {
                    method: 'post',
                    headers: { 'Content-type': 'application/json' },
                    body: JSON.stringify({ subscription: subscription })
                });
            })
            .then(function () {
                document.getElementById('subscribe-btn').innerHTML = "Send Msg";
            });
    });
}

function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

