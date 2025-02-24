# react-native-androidtv-remote

**This package is a port of the [Android TV Remote](https://github.com/louis49/androidtv-remote) written by @louis49 to React Native**  
- License: MIT (see LICENSE file)

It has beeen modified to replace modpow that is too slow on ios/android during the generation of the certificate 
and I have added the possibility to use a certificate when using react-native-tcp-sockets (dev/more-node-tls-compliant-ios).  


# Installation

Install the library using either yarn:   

`yarn add react-native-androidtv-remote react-native-modpow`

or npm:  

`npm install --save react-native-androidtv-remote react-native-modpow`

At the time of writing these instructions, my dev/more-node-tls-compliant-ios branch has not yet been merged into react-native-tcp-sockets, so it is necessary to patch it using patch-package.  
So inside your project add patch-package:  

`yarn add patch-package` and copy the folder example/patches inside your project and add inside package.json:  

```
"scripts": {
    ...
    "postinstall": "patch-package"
  },
```

# Example

To run the example:  

#### android
```
cd example
yarn install
yarn start
```
on another terminal:  
`yarn android`  

#### iOS
```
cd example
yarn install
cd ios
pod install
cd ..
yarn start
```

on another terminal:  
`yarn ios`

# Usage

After first succeeded pairing, you can reuse generated certs with `getCertificate()` by sending it in constructor options.

```js
let host = "192.168.1.12";
let options = {
    pairing_port : 6467,
    remote_port : 6466,
    service_name: 'com.urcompany.appname',
    systeminfo: {
      manufacturer: 'default-manufacturer',
      model: 'default-model'
      },
      // Mandatory for the connection to work on android and needs patched version of
      // react-native-tcp-socket
      cert: {
        key: null,
        cert: null,
        androidKeyStore: 'AndroidKeyStore',
        certAlias: 'my-remotectl-atv-cert',
        keyAlias: 'my-remotectl-atv',
      }
}

let androidRemote = new AndroidRemote(host, options)

androidRemote.on('secret', () => {
    line.question("Code : ", async (code) => {
        androidRemote.sendCode(code);
    });
});

androidRemote.on('powered', (powered) => {
    console.debug("Powered : " + powered)
});

androidRemote.on('volume', (volume) => {
    console.debug("Volume : " + volume.level + '/' + volume.maximum + " | Muted : " + volume.muted);
});

androidRemote.on('current_app', (current_app) => {
    console.debug("Current App : " + current_app);
});

androidRemote.on('ready', async () => {
    let cert = androidRemote.getCertificate();

    androidRemote.sendKey(RemoteKeyCode.MUTE, RemoteDirection.SHORT)

    androidRemote.sendAppLink("https://www.disneyplus.com");
});

let started = await androidRemote.start();
```
# Events

### `Event: secret`

Emitted when androidtv ask for code.

### `Event: powered`

Emitted when androidtv is powering on/off.

### `Event: volume`

Emitted when androidtv is changing volume/mute.

### `Event: current_app`

Emitted when androidtv is changing current app.

### `Event: error`

Emitted when androidtv has a problem : by example when you send a wrong app_link with `sendAppLink(app_link)`.

# Commands

### `Command: sendCode(code)`
- `code` : You need to pass the shown code on the TV when asked

### `Command: sendKey(KeyCode, Direction)`
- `KeyCode` : Any key of https://developer.android.com/reference/android/view/KeyEvent?hl=fr
- `Direction` : 
  * `START_LONG` : Start long push
  * `END_LONG` : Stop long push
  * `SHORT` : Simple push

### `Command : sendAppLink(app_link)`
- `app_link` : You can find them in some Android apps by seeking 'android:host' in Android-Manifest
  * You can use [jadx](https://github.com/skylot/jadx) to decompile the Android app and read Android-Manifest
  * Example : "https://www.netflix.com/title.*"

# Others

* If you need to decrypt some new messages from android TV, pass an Hexa form of buffer here : https://protogen.marcgravell.com/decode
* You can take a look at an other package for homebridge that use this current one: [homebridge-plugin-androidtv](https://github.com/louis49/homebridge-plugin-androidtv)

# License

MIT


