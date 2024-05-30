"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.RemoteKeyCode = exports.RemoteDirection = exports.AndroidRemote = void 0;
require("core-js/modules/es.promise.js");
var _CertificateGenerator = require("./certificate/CertificateGenerator.js");
var _PairingManager = require("./pairing/PairingManager.js");
var _RemoteManager = require("./remote/RemoteManager.js");
var _RemoteMessageManager = require("./remote/RemoteMessageManager.js");
var _events = _interopRequireDefault(require("events"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
class AndroidRemote extends _events.default {
  constructor(host, options) {
    var _options$cert, _options$cert2, _options$cert3, _options$cert4, _options$cert5, _options$cert6, _options$cert7, _options$cert8;
    console.log('AndroidRemote.constructor');
    super();
    this.host = host;
    this.cert = {
      key: (_options$cert = options.cert) === null || _options$cert === void 0 ? void 0 : _options$cert.key,
      cert: (_options$cert2 = options.cert) === null || _options$cert2 === void 0 ? void 0 : _options$cert2.cert,
      androidKeyStore: (_options$cert3 = options.cert) !== null && _options$cert3 !== void 0 && _options$cert3.androidKeyStore ? (_options$cert4 = options.cert) === null || _options$cert4 === void 0 ? void 0 : _options$cert4.androidKeyStore : '',
      certAlias: (_options$cert5 = options.cert) !== null && _options$cert5 !== void 0 && _options$cert5.certAlias ? (_options$cert6 = options.cert) === null || _options$cert6 === void 0 ? void 0 : _options$cert6.certAlias : '',
      keyAlias: (_options$cert7 = options.cert) !== null && _options$cert7 !== void 0 && _options$cert7.keyAlias ? (_options$cert8 = options.cert) === null || _options$cert8 === void 0 ? void 0 : _options$cert8.keyAlias : ''
    };
    this.pairing_port = options.pairing_port ? options.pairing_port : 6467;
    this.remote_port = options.remote_port ? options.remote_port : 6466;
    this.service_name = options.service_name ? options.service_name : "Service Name";
    this.systeminfo = options.systeminfo ? options.systeminfo : {
      manufacturer: "default manufacturer",
      model: "default model"
    };
  }
  start() {
    var _this = this;
    return _asyncToGenerator(function* () {
      console.log('AndroidRemote.start');
      if (!_this.cert.key || !_this.cert.cert) {
        //console.log('before CertificateGenerator.generateFull');

        var androidKeyStore = _this.cert.androidKeyStore;
        var certAlias = _this.cert.certAlias;
        var keyAlias = _this.cert.keyAlias;
        _this.cert = _CertificateGenerator.CertificateGenerator.generateFull(_this.service_name);
        _this.cert.androidKeyStore = androidKeyStore;
        _this.cert.certAlias = certAlias;
        _this.cert.keyAlias = keyAlias;
        _this.pairingManager = new _PairingManager.PairingManager(_this.host, _this.pairing_port, _this.cert, _this.service_name, _this.systeminfo);
        _this.pairingManager.on('secret', () => _this.emit('secret'));
        var paired = yield _this.pairingManager.start().catch(error => {
          console.error(error);
        });
        if (!paired) {
          return;
        }
      }
      _this.remoteManager = new _RemoteManager.RemoteManager(_this.host, _this.remote_port, _this.cert, _this.systeminfo);
      _this.remoteManager.on('powered', powered => _this.emit('powered', powered));
      _this.remoteManager.on('volume', volume => _this.emit('volume', volume));
      _this.remoteManager.on('current_app', current_app => _this.emit('current_app', current_app));
      _this.remoteManager.on('ready', () => _this.emit('ready'));
      _this.remoteManager.on('unpaired', () => _this.emit('unpaired'));
      yield new Promise(resolve => setTimeout(resolve, 1000));
      var started = yield _this.remoteManager.start().catch(error => {
        console.error(error);
      });
      return started;
    })();
  }
  initCertificate(certs) {}
  sendCode(code) {
    return this.pairingManager.sendCode(code);
  }
  sendPower() {
    return this.remoteManager.sendPower();
  }
  sendAppLink(app_link) {
    return this.remoteManager.sendAppLink(app_link);
  }
  sendKey(key, direction) {
    return this.remoteManager.sendKey(key, direction);
  }
  getCertificate() {
    return {
      key: this.cert.key,
      cert: this.cert.cert
    };
  }
  stop() {
    this.remoteManager.stop();
  }
}
exports.AndroidRemote = AndroidRemote;
var remoteMessageManager = new _RemoteMessageManager.RemoteMessageManager();
var RemoteKeyCode = exports.RemoteKeyCode = remoteMessageManager.RemoteKeyCode;
var RemoteDirection = exports.RemoteDirection = remoteMessageManager.RemoteDirection;
var _default = exports.default = {
  AndroidRemote,
  CertificateGenerator: _CertificateGenerator.CertificateGenerator,
  RemoteKeyCode,
  RemoteDirection
};