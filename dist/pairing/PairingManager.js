"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PairingManager = void 0;
require("core-js/modules/es.error.cause.js");
require("core-js/modules/es.json.stringify.js");
require("core-js/modules/es.parse-int.js");
require("core-js/modules/es.promise.js");
var _PairingMessageManager = require("./PairingMessageManager.js");
var _nodeForge = _interopRequireDefault(require("node-forge"));
var _buffer = require("buffer");
var _events = _interopRequireDefault(require("events"));
var _reactNativeTcpSocket = _interopRequireDefault(require("react-native-tcp-socket"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
class PairingManager extends _events.default {
  constructor(host, port, certs, service_name, systeminfo) {
    super();
    this.host = host;
    this.port = port;
    this.chunks = _buffer.Buffer.from([]);
    this.certs = certs;
    this.service_name = service_name;
    this.pairingMessageManager = new _PairingMessageManager.PairingMessageManager(systeminfo);
  }
  sendCode(code) {
    var _this = this;
    return _asyncToGenerator(function* () {
      console.debug("Sending code : ", code);
      var code_bytes = _this.hexStringToBytes(code);
      var client_certificate = yield _this.client.getCertificate();
      var server_certificate = yield _this.client.getPeerCertificate();
      var sha256 = _nodeForge.default.md.sha256.create();
      sha256.update(_nodeForge.default.util.hexToBytes(client_certificate.modulus), 'raw');
      sha256.update(_nodeForge.default.util.hexToBytes("0" + client_certificate.exponent.slice(2)), 'raw');
      sha256.update(_nodeForge.default.util.hexToBytes(server_certificate.modulus), 'raw');
      sha256.update(_nodeForge.default.util.hexToBytes("0" + server_certificate.exponent.slice(2)), 'raw');
      sha256.update(_nodeForge.default.util.hexToBytes(code.slice(2)), 'raw');
      var hash = sha256.digest().getBytes();
      var hash_array = Array.from(hash, c => c.charCodeAt(0) & 0xff);
      var check = hash_array[0];
      if (check !== code_bytes[0]) {
        _this.client.destroy(new Error("Bad Code"));
        return false;
      } else {
        _this.client.write(_this.pairingMessageManager.createPairingSecret(hash_array));
        return true;
      }
    })();
  }
  start() {
    var _this2 = this;
    return _asyncToGenerator(function* () {
      return new Promise((resolve, reject) => {
        var options = {
          port: _this2.port,
          host: _this2.host,
          key: _this2.certs.key,
          cert: _this2.certs.cert,
          rejectUnauthorized: false,
          // if true => use ca
          // Specific to react-native-tcp-socket (patched)
          androidKeyStore: _this2.certs.androidKeyStore,
          certAlias: _this2.certs.certAlias,
          keyAlias: _this2.certs.keyAlias
        };
        _this2.client = _reactNativeTcpSocket.default.connectTLS(options, () => {
          console.debug(_this2.host + " Pairing connected");
        });
        _this2.client.pairingManager = _this2;
        _this2.client.on("secureConnect", () => {
          console.debug(_this2.host + " Pairing secure connected ");
          _this2.client.write(_this2.pairingMessageManager.createPairingRequest(_this2.service_name));
        });
        _this2.client.on('data', data => {
          var buffer = _buffer.Buffer.from(data);
          _this2.chunks = _buffer.Buffer.concat([_this2.chunks, buffer]);
          if (_this2.chunks.length > 0 && _this2.chunks.readInt8(0) === _this2.chunks.length - 1) {
            var message = _this2.pairingMessageManager.parse(_this2.chunks);
            console.debug("Receive : " + Array.from(_this2.chunks));
            console.debug("Receive : " + JSON.stringify(message.toJSON()));
            if (message.status !== _this2.pairingMessageManager.Status.STATUS_OK) {
              _this2.client.destroy(new Error(message.status));
            } else {
              if (message.pairingRequestAck) {
                _this2.client.write(_this2.pairingMessageManager.createPairingOption());
              } else if (message.pairingOption) {
                _this2.client.write(_this2.pairingMessageManager.createPairingConfiguration());
              } else if (message.pairingConfigurationAck) {
                _this2.emit('secret');
              } else if (message.pairingSecretAck) {
                console.debug(_this2.host + " Paired!");
                _this2.client.destroy();
              } else {
                console.debug(_this2.host + " What Else ?");
              }
            }
            _this2.chunks = _buffer.Buffer.from([]);
          }
        });
        _this2.client.on('close', hasError => {
          console.debug(_this2.host + " Pairing Connection closed", hasError);
          if (hasError) {
            reject(false);
          } else {
            resolve(true);
          }
        });
        _this2.client.on('error', error => {
          console.error(error);
        });
      });
    })();
  }
  hexStringToBytes(q) {
    var bytes = [];
    for (var i = 0; i < q.length; i += 2) {
      var byte = parseInt(q.substring(i, i + 2), 16);
      if (byte > 127) {
        byte = -(~byte & 0xFF) - 1;
      }
      bytes.push(byte);
    }
    return bytes;
  }
}
exports.PairingManager = PairingManager;