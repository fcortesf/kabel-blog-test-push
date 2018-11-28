# Test Push
Aplicación web de ejemplo para el blog de https://kabel.es . La aplicación puede enviar notificaciones push, trabajar offline y puede ser instalada de forma local.

Se puede ver la aplicación en acción: https://kabelblogtestpush.azurewebsites.net 

## Initial
Estructura inicial de la aplicación web, a partir de la cual, siguiendo los pasos del blog, se puede llegar al resultado final.

## Final-example
Código fuente de la aplicación corriendo en azure.

Para probar en local:
1. npm i
2. Establecer [VAPID keys](#claves-de-aplicación-vapid-keys) en el archivo app.js.
3. npm start

# Introducción
Hay nuevos estándares web que hacen que la experiencia de usuario sea mucho más rica. Por ello es interesante poder verlos en acción y saber llevarlos a cabo. Esta aplicación de ejemplo, permite la introducción e implementación de los conceptos básicos de estos estándares. Para ello, partiendo de la base que se encuentra en la carpeta 'initial' se irán incorporando conceptos y funcionalidad en el siguiente orden:
1. *Web push*
2. Trabajo *offline*
3. *Manifest* e instalación local

Todo será implementado en un *servidor node con express* y mediante javascript en la web. Todo el tutorial se realiza desde el directorio 'initial'.

## Requisitos
¿Qué es necesario para arrancar el proyecto? 
- Git
- Node

## Instalación
Para comenzar el ejemplo serán necesarios los siguientes pasos:
1. git clone https://github.com/fcortesf/kabel-blog-test-push.git
2. Realizar un 'npm i' en la carpeta 'initial'

Con esto, ya desde la carpeta 'initial' es posible realizar un 'npm start'. Accediendo a http://localhost:3000 se puede ver el esqueleto inicial.

# Web push
El primer paso en esta web será incorporar notificaciones push.

Lo primero será entender cómo funciona el flujo de comunicación. El cuál sería el siguiente:
- El lado del cliente solicita al usuario los permisos para enviar notificaciones.
- Se obtiene una 'PushSubscription'.
- Se manda la suscripción al servidor.
- El servidor almacena la suscripción para una futura comunicación.
- Cuando se desee, a partir de las suscripciones y desde el servidor, se envía un mensaje a un servicio de notificaciones.
- El mensaje llega al dispositivo.
- El navegador despierta al 'Service Worker' encargado de gestionar la notificación.
- Se muestra la notificación.
Más información: https://developers.google.com/web/fundamentals/push-notifications/how-push-works 

En este punto, se pueden diferenciar las dos partes, que se deben llevar a cabo para gestionar las notificaciones push en la web:
- Cliente: se encarga de solicitar los permisos al usuario, enviar la suscripción al servidor y visualizar los mensajes push.
- Servidor: encargado de gestionar las suscripciones de los diferentes dispositivos y de realizar la comunicación de los mensajes a los servicios push de los navegadores. 

## Servidor
Lo primero va a ser la configuración del servidor para que pueda gestionar las suscripciones y enviar mensajes. 

Para llevar a cabo los envíos push en el servidor se utilizará una librería de web push de node.
```
npm i web-push
```

### Web push protocol
A pesar de que cada navegador posee un servicio de notificaciones, todo el proceso se simplifica gracias al *'Web Push Protocol'*. Una especificación de cómo deben ser las peticiones realizadas a los servicios Push y cómo deben responder los mismos. https://developers.google.com/web/fundamentals/push-notifications/web-push-protocol

### Claves de aplicación (VAPID Keys)
Para poder cumplir la especificación será necesario identificar nuestra aplicación web, asegurando así que la comunicación de push se produce de forma segura entre el servidor de la aplicación y el cliente. Para ello será necesario cumplir la especificación VAPID ([Voluntary Application Server Identification](https://tools.ietf.org/html/draft-thomson-webpush-vapid-02)). 

VAPID Keys son una pareja de claves (pública y privada) para identificar a una aplicación y sus servidores. Se utilizapara realizar las comunicaciones con los servicios push y asegurar así la procedencia de los mensajes.

Hay varias formas para obtener un par de claves VAPID, en este caso se va a utilizar el cli de web-push. Para ello es necesario en la consola realizar:
 ```
 npm i -g web-push
 ```
 Y a continuación realizar la generación de las claves:
 ```
 web-push generate-vapid-keys
 ```
 Este comando nos devolverá una clave pública y una privada que podremos utilizar posteriormente.

### Implementación
La implementación del servidor se encuentra en el archivo app.js en la raíz del proyecto 'initial'. Ya hay código que: levanta un servidor express que sirve los contenidos estáticos de la carpeta 'public' y que se queda a la escucha del puerto 3000. 

El primer paso será agregar la dependencia de web-push en el script del servidor y configurar las claves vapid de nuestro servidor. Para ello, debajo del require de express será necesario realizar lo siguiente:
```javascript
var webpush = require('web-push');

// Vapid config
const vapidPublicKey = '< VAPID PUBLIC KEY >';
const vapidPrivateKey = '< VAPID PRIVATE KEY>';
webpush.setVapidDetails(
    'mailto:someemail@someemaildomain.com',
    vapidPublicKey,
    vapidPrivateKey
);
```

Una vez configuradas las claves, habilitaremos un método para obtener la clave pública desde el cliente mediante un get. (Esto, también se podría realizar definiendo la clave pública como una constante del cliente).

Para ello es necesario incluir el siguiente fragmento tras la configuración de las claves.
```javascript
// Return public key
app.get('/api/key', function (req, res) {
    res.send({
        key: vapidPublicKey
    });
});
```

Una vez que el cliente tenga la clave pública podrá obtener su suscripción y comunicarla al servidor. Para ello es necesario, primero configurar el body-parser de express para que deserialice el contenido del 'body' de una petición post. Para ello en la sección de los require agregar:
```javascript
var bodyParser = require('body-parser');
```
Además, habrá que configurarlo, una vez instanciada la app de express:
```javascript
// Configure body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
```
Una vez que tengamos configurado esto, se puede pasar a configurar un método post que reciba la suscripción del cliente. Para ello, tras el método get definido previamente:
```javascript
// Save subscription and send a message
app.post('/api/save-subscription', function (req, res) {
    // req.body.subscription contains the subscription
    res.send('Success');
});
```
¿Qué contiene la suscripción? La suscripción es un objeto que posee:
- Un endpoint: el del servicio de notificaciones del navegador asociado a la suscripción
- Un objeto con un par de claves.

Una vez recibida la suscripción, esta debería ser almacenada para su uso posterior. Sin embargo, para simplificar en este mismo método enviaremos la notificación. Por lo tanto, se enviará una notificación al usuario al recibir la suscripción. Pa ello se utilizará el método [sendNotification](https://www.npmjs.com/package/web-push#sendnotificationpushsubscription-payload-options) de web-push. A este método le enviaremos una suscripción y un payload. Dejando el método post de la siguiente forma:
```javascript
// Save subscription and send a message
app.post('/api/save-subscription', function (req, res) {
    // save subscription to a database
    const payload = 'Hola!';
    webpush.sendNotification(
        req.body.subscription,
        payload
    );

    res.send('Success');
});
```
NOTA: El payload será recibido por el cliente y es en formato string. En él podemos enviar un json con información para que sea tratado y formateado por el cliente.

Una vez realizados estos pasos, una vez realicemos 'npm start' nuestro servidor estará listo para enviar notificaciones push.

### Compatibilidad con navegadores
Puedes revisar la compatibilidad de navegadores en: https://www.npmjs.com/package/web-push#browser-support 

* Al estar utilizando Web push protocol no se utiliza el gcm_sender_id. Por lo que cualquier referencia al mismo será de un navegador que aún no implemente este protocolo.

## Cliente
En el esqueleto proporcionado hay dos scripts: 'sw.js' y 'scripts/main.js'. El primero contendrá el código del service worker y en el segundo será el script principal de la página.

NOTA: Para evitar navegar entre mucho javascript, el código dedicado a controlar la interfaz será omitido.

Es importante que todo lo que se haga en el cliente se ejecute tras el evento 'load', para evitar entorpecer el renderizado de la página. Para ello comenzar a ejecutar código en
```javascript
window.addEventListener('load', function (event) { 
    ...
});
```
Para poder trabajar con las notificaciones push en el cliente el navegador debe soportar:
- Service Worker
- PushManager

Para comprobar si existen estas funcionalidades, en main.js se crearán dos métodos destinados a ello:
```javascript
function canRegisterSw() {
    return !!navigator.serviceWorker;
}

function canUsePush() {
    return canRegisterSw() && ('PushManager' in window);
}
```

Una vez cargada la página debemos preguntar si están disponibles estas funcionalidades para continuar trabajando. Si no están disponibles deberá deshabilitarse la interfaz que interactué con estos botones. 

En caso de que podamos usar service worker, debemos [registrar](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle?hl=en) uno (sw.js en este caso)  de la siguiente forma: 
```javascript
navigator.serviceWorker.register('sw.js');
```

Si además del service worker podemos usar el push manager, asociamos al evento 'click' del botón 'subscribe-btn' el evento de suscripción push. La suscripción hará lo siguiente: 
1. Obtener la clave pública VAPID del servidor.
2. Espera/verifica que el serviceworker esté ready.
3. Solicita la suscripción. El navegador solicita permisos la primera vez.
4. Comunica la suscripción al servidor.

Este proceso se realizará con las siguientes funciones:
```javascript
function subscribe() {
    fetch('./api/key')
        .then(function (res) {
            res.json().then(function (data) {
                registerPush(data.key);
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
```
Si deseas conocer más información acerca de las opciones de registro: https://developers.google.com/web/fundamentals/push-notifications/subscribing-a-user

Con esto la web ya dispone del mecanismo para obtener una suscripción del servicio de notificaciones y enviársela a su propio servidor. Sin embargo, queda una parte crucial: recibir la notificación y mostrarle. Lo cual es trabajo del service worker. 

Al recibir la notificación el navegador despertará al servie worker registrado en la aplicación y le pasará un evento push con el payload. Llamando al método 'registratio.showNotification' que recibe como parámetro el título de la notificación y objeto con las [opciones](https://developers.google.com/web/fundamentals/push-notifications/display-a-notification) de la misma.

Para ello, en el archivo sw.js debemos incorporar lo siguiente: 
```javascript
self.addEventListener('push', function(event) {
    event.waitUntil(
        registration.showNotification('Test-push', {
            body: event.data ? event.data.text() : 'no payload',
            icon: 'images/push-icon.png',
            badge: 'images/letter_k.png'
        })
    );
});
```
¿El service worker no se actualiza? Para ello hay que entender el [ciclo de vida de los service worker](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle?hl=en). Estos no se actualizan de forma normal, en Chrome por ejemplo, se descargará la nueva versión del service worker pero no se aplicará hasta que no se cierren todas las pestañas de la misma url. También es posible forzar su actualización con las herramientas de desarrollador de Google Chrome.

También podemos reaccionar a eventos sobre la notificación, por ejemplo, abriendo una pestaña con una url de la web.
```javascript
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(clients.openWindow('/'));
});
```

Una vez realizado todo ello ya disponemos de una web que recibe notificaciones push cada vez que pulsamos al botón 'Subscribe'. Sólo faltaría la forma de cancelar la suscripción
```javascript
function getPushSubscription() {
    return navigator.serviceWorker.ready
        .then(function (registration) {
            return registration.pushManager.getSubscription();
        });
}

function unsubscribePush() {
    return getPushSubscription().then(function (subscription) {
        return subscription.unsubscribe().then(function () {
            // Call your server to delete the subscription            
        });
    });
}
```

# Trabajo Offline
Para el trabajo offline solamente será necesario trabajar en el cliente. El encargado de almacenar el contenido para ser cacheado será el service worker, pues es quien tiene acceso a la API de Cache. 

El esqueleto básico de la aplicación se ha llevado a cabo siguiendo una 'Application Shell Arquitecture'. La shell sería: la cabecera, los botones, los estilos básicos y el comportamiento básico. Es decir, los archivos:
- index.html
- styles/main.css
- scripts/index.js

Por lo tanto, precacheando estos archivos se puede conseguir que la aplicación cargue de forma desconectada, obviamente sin conexión las notificaciones push no van a funcionar por lo que hay que desactivar los botones si no hay conexión. Sin embargo, si tuviésemos alguna funcionalidad extra en 'main.js' esta podría seguir funcionando.

Para verificar si hay conexión y los eventos asicados al cambio de offline/online:
```javascript
navigator.onLine

window.addEventListener('offline', manageConnection);
window.addEventListener('online', manageConnection);
```

Para facilitar el proceso de cache, la librería a utilizar es ['workbox'](https://developers.google.com/web/tools/workbox/). Esta librería es muy potente y permite diferentes estrategias de cache. Por ejemplo, podemos precachear nuestra shell al instalar el service worker y cachear otros recursos sólamente a medida que se pidan. 

Debido a que en este caso la aplicación contiene solamente la shell, se deben cachear sólamente esos archivos. Para ello lo primero será importar workbox en el service worker (sw.js). En la primera línea del service worker incorporamos lo siguiente:
```javascript
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.6.1/workbox-sw.js');
```
A continuación, deben precachearse los archivos y rutas (para la raíz de la web).
```javascript
workbox.precaching.precacheAndRoute([
    { url: 'styles/main.css', revision: '35690' },
    { url: 'scripts/main.js', revision: '35690' },
    { url: '/', revision: '35690' },
]);
```
En una aplicación más compleja es necesario estudiar la estrategia de cache para cada uno de los recursos, puesto que cada uno de estos recursos deben ser redescargados y almacenados.

¿Qué es el número de revisión? De forma simplificada, es la versión del archivo en cache. Por lo que si modificamos un archivo debemos modificar su revisión. Workbox es una librería muy completa y nos permite enlazarla en nuestros procesos de generación del front. ¿Cómo?, Por ejemplo dispone de plugins en webpack o gulp para generar estos fragmentos de código.

Con esto al acceder a la aplicación y una vez que el service worker se ha actualizado dispondremos de la aplicación offline. Si dejamos al navegador sin conexión y recargamos la página veremos que el 'downasaur' no aparece en la misma.

## Velocidad de carga
Una vez que se han precacheado los archivos la velocidad de carga de los mismos en un dispositivo corriente es muy elevada. Es decir, evitamos la comunicación y descarga de los diferentes archivos puesto que ya los tenemos en local.

## Compatibilidad
En este caso hay muchos más navegadores que dan soporte a los service worker y al soporte de la API Cache. Es decir, esta funcionalidad funciona en más navegadores que el web push.

Esta funcionalidad está disponible en Android y en iOS por lo que en ambas plataformas móviles dispondremos de la aplicación de forma desconectada.

# Manifest e instalación local
Hay varios navegadores que ya permiten la instalación de aplicaciones web de forma local. Para ello es necesario cumplir los siguientes requisitos:
- Contener un Web App Manifest con información básica.
- Tener un service worker registrado.
- Debe ser servida por HTTPS. (Localhost no es necesario)
- Requisitos específicos del navegador, por ejemplo, Chrome necesita de disponibilidad sin conexión.

Lo único que le falta a la aplicación actual es un manifest. Para generar el manifest, de forma amigable, existen varios generadores de manifest. Como este: https://app-manifest.firebaseapp.com/ que además permite cargar un icono y lo redimensiona para las necesidades de Android.  PAra dimensionar iconos para otros sistemas y navegadores puede usarse https://realfavicongenerator.net/ 

Una vez generado y obtenido el manifest dejarlo en la raiz de la web (la carpeta public en este caso) y referenciarlo en el 'head' del html:
```html
<link rel="manifest" href="manifest.json">
```

En android los iconos se encuentran definidos en el manifest, sin embargo en iOS se deben definir en el 'head' del html. Por ejemplo:
```html
<link rel="apple-touch-icon" sizes="180x180" href="images/icons/apple-touch-icon.png">
```

Al instalarlo desde edge también podemos definir algunas opciones del 'tile':
```html
<meta name="msapplication-TileColor" content="#ffffff">
    <meta name="theme-color" content="#ffffff">
```

Una vez realizada la configuración del manifest y referenciado el mismo ya no hay más que hacer. Al seguir todos los pasos la web ya: recibe notificaciones, está disponible sin conexión y puede ser instalada. Sólo queda personalizar y retocar al gusto para afinar su funcionalidad.

## Compatibilidad
Podemos instalar aplicaciones así en:
- Chrome: Android y Windows.
- iOS Safari.
- Edge.

En Chrome además podemos trabajar con el prompt de instalación, mientras que en el resto de navegadores se realiza de forma manual desde las opciones del navegador. En el ejemplo final hay un archivo 'prompt.js' que se encarga de gestionar el prompt de Chrome.

# ¿Y el Progressive enhancement?
La aplicación cumple con este principio. A la hora de utilizar las diferentes funcionalidades se ha establecido que primero deban existir en el navegador. Por ejemplo, para registrar el service worker se ha establecido que el navegador debe disponer de service worker. En este caso la web cargará, mostrará la shell y no hará más (no hay más funcionalidad). 

Al abrirla en iOS no se podrán recibir notificaciones, pero podrá ser instalada y ejecutada offline. Por lo tanto, se ha creado una web que cumple este principio haciendo que los navegadores más avanzados dispongan de toda la funcionalidad y los menos avanzados al menos tengan acceso a la misma aunque su experiencia sea menor.

# Conclusión
Todo este trabajo sirve para ver cómo: de una web ya existente se puede agregar funcionalidad que enriquece la experiencia de usuario sin interferir en el desarrollo previo. En algún caso será necesario alguna pequeña reestructuración, por ejemplo para obtener la shell. Pero no son grandes cambios de desarrollo.

Por lo tanto, si ya disponemos de una aplicación web con un pequeño esfuerzo pero sin estropear el trabajo previo podemos alcanzar una experiencia muy enriquecida. Con lo que se consigue una ventaja competitiva de cara a los usuarios.