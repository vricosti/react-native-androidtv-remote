"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RemoteManager = void 0;
require("core-js/modules/es.json.stringify.js");
require("core-js/modules/es.promise.js");
var _RemoteMessageManager = require("./RemoteMessageManager.js");
var _events = _interopRequireDefault(require("events"));
var _buffer = require("buffer");
var _reactNativeTcpSocket = _interopRequireDefault(require("react-native-tcp-socket"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
class RemoteManager extends _events.default {
  constructor(host, port, certs, systeminfo) {
    super();
    this.host = host;
    this.port = port;
    this.certs = certs;
    this.chunks = _buffer.Buffer.from([]);
    this.error = null;
    this.remoteMessageManager = new _RemoteMessageManager.RemoteMessageManager(systeminfo);
  }
  start() {
    var _this = this;
    return _asyncToGenerator(function* () {
      return new Promise((resolve, reject) => {
        var options = {
          port: _this.port,
          host: _this.host,
          key: _this.certs.key,
          cert: _this.certs.cert,
          rejectUnauthorized: false,
          // Specific to react-native-tcp-socket (patched)
          androidKeyStore: _this.certs.androidKeyStore,
          certAlias: _this.certs.certAlias,
          keyAlias: _this.certs.keyAlias
          //ca: require('../../../../client-selfsigned.crt'),
        };
        console.debug("Start Remote Connect");
        _this.client = _reactNativeTcpSocket.default.connectTLS(options, () => {
          console.debug("Remote connected");
        });
        _this.client.on('timeout', () => {
          console.debug('timeout');
          _this.client.destroy();
        });

        // Le ping est reçu toutes les 5 secondes
        _this.client.setTimeout(10000);
        _this.client.on("secureConnect", () => {
          console.debug(_this.host + " Remote secureConnect");
          resolve(true);
        });
        _this.client.on('data', data => {
          var buffer = _buffer.Buffer.from(data);
          _this.chunks = _buffer.Buffer.concat([_this.chunks, buffer]);
          if (_this.chunks.length > 0 && _this.chunks.readInt8(0) === _this.chunks.length - 1) {
            var message = _this.remoteMessageManager.parse(_this.chunks);
            if (!message.remotePingRequest) {
              //console.debug(this.host + " Receive : " + Array.from(this.chunks));
              console.debug(_this.host + " Receive : " + JSON.stringify(message.toJSON()));
            }
            if (message.remoteConfigure) {
              _this.client.write(_this.remoteMessageManager.createRemoteConfigure(622, "Build.MODEL", "Build.MANUFACTURER", 1, "Build.VERSION.RELEASE"));
              _this.emit('ready');
            } else if (message.remoteSetActive) {
              _this.client.write(_this.remoteMessageManager.createRemoteSetActive(622));
            } else if (message.remotePingRequest) {
              _this.client.write(_this.remoteMessageManager.createRemotePingResponse(message.remotePingRequest.val1));
            } else if (message.remoteImeKeyInject) {
              _this.emit('current_app', message.remoteImeKeyInject.appInfo.appPackage);
            } else if (message.remoteImeBatchEdit) {
              console.debug("Receive IME BATCH EDIT" + message.remoteImeBatchEdit);
            } else if (message.remoteImeShowRequest) {
              console.debug("Receive IME SHOW REQUEST" + message.remoteImeShowRequest);
            } else if (message.remoteVoiceBegin) {
              //console.debug("Receive VOICE BEGIN" + message.remoteVoiceBegin);
            } else if (message.remoteVoicePayload) {
              //console.debug("Receive VOICE PAYLOAD" + message.remoteVoicePayload);
            } else if (message.remoteVoiceEnd) {
              //console.debug("Receive VOICE END" + message.remoteVoiceEnd);
            } else if (message.remoteStart) {
              _this.emit('powered', message.remoteStart.started);
            } else if (message.remoteSetVolumeLevel) {
              _this.emit('volume', {
                level: message.remoteSetVolumeLevel.volumeLevel,
                maximum: message.remoteSetVolumeLevel.volumeMax,
                muted: message.remoteSetVolumeLevel.volumeMuted
              });
              //console.debug("Receive SET VOLUME LEVEL" + message.remoteSetVolumeLevel.toJSON().toString());
            } else if (message.remoteSetPreferredAudioDevice) {
              //console.debug("Receive SET PREFERRED AUDIO DEVICE" + message.remoteSetPreferredAudioDevice);
            } else if (message.remoteError) {
              //console.debug("Receive REMOTE ERROR");
              _this.emit('error', {
                error: message.remoteError
              });
            } else {
              console.log("What else ?");
            }
            _this.chunks = _buffer.Buffer.from([]);
          }
        });
        _this.client.on('close', /*#__PURE__*/function () {
          var _ref = _asyncToGenerator(function* (hasError) {
            console.info(_this.host + " Remote Connection closed ", hasError);
            if (hasError) {
              reject(_this.error.code);
              if (_this.error.code === "ECONNRESET") {
                _this.emit('unpaired');
              } else if (_this.error.code === "ECONNREFUSED") {
                // L'appareil n'est pas encore prêt : on relance
                yield new Promise(resolve => setTimeout(resolve, 1000));
                yield _this.start().catch(error => {
                  console.error(error);
                });
              } else if (_this.error.code === "EHOSTDOWN") {
                // L'appareil est down, on ne fait rien
              } else {
                // Dans le doute on redémarre
                yield new Promise(resolve => setTimeout(resolve, 1000));
                yield _this.start().catch(error => {
                  console.error(error);
                });
              }
            } else {
              // Si pas d'erreur on relance. Si elle s'est éteinte alors une erreur empéchera de relancer encore
              yield new Promise(resolve => setTimeout(resolve, 1000));
              yield _this.start().catch(error => {
                console.error(error);
              });
            }
          });
          return function (_x) {
            return _ref.apply(this, arguments);
          };
        }());
        _this.client.on('error', error => {
          console.error(_this.host, error);
          _this.error = error;
        });
      });
    })();
  }
  sendPower() {
    this.client.write(this.remoteMessageManager.createRemoteKeyInject(this.remoteMessageManager.RemoteDirection.SHORT, this.remoteMessageManager.RemoteKeyCode.KEYCODE_POWER));
  }
  sendKey(key, direction) {
    this.client.write(this.remoteMessageManager.createRemoteKeyInject(direction, key));
  }
  sendAppLink(app_link) {
    this.client.write(this.remoteMessageManager.createRemoteRemoteAppLinkLaunchRequest(app_link));
  }
  stop() {
    this.client.destroy();
  }
}
exports.RemoteManager = RemoteManager;