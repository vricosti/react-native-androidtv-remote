"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CertificateGenerator = void 0;
require("core-js/modules/es.regexp.to-string.js");
var _nodeForge = _interopRequireDefault(require("node-forge"));
var _reactNativeModpow = _interopRequireDefault(require("react-native-modpow"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class CertificateGenerator {
  static generateFull(name) {
    console.log("Entering generateFull(".concat(name, ")"));
    console.log('modPow: ', _reactNativeModpow.default);
    _nodeForge.default.jsbn.BigInteger.prototype.modPow = function nativeModPow(e, m) {
      var result = (0, _reactNativeModpow.default)({
        target: this.toString(16),
        value: e.toString(16),
        modifier: m.toString(16)
      });
      return new _nodeForge.default.jsbn.BigInteger(result, 16);
    };
    var date = new Date();
    date.setUTCFullYear(2021);
    var date2 = new Date();
    date2.setUTCFullYear(2099);
    var keys = _nodeForge.default.pki.rsa.generateKeyPair(2048);
    var cert = _nodeForge.default.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01' + _nodeForge.default.util.bytesToHex(_nodeForge.default.random.getBytesSync(19));
    cert.validity.notBefore = date;
    cert.validity.notAfter = date2;
    var attributes = [{
      name: 'commonName',
      value: name
    }, {
      name: 'countryName',
      value: 'CNT'
    }, {
      shortName: 'ST',
      value: 'ST'
    }, {
      name: 'localityName',
      value: 'LOC'
    }, {
      name: 'organizationName',
      value: 'O'
    }, {
      shortName: 'OU',
      value: 'OU'
    }];
    cert.setSubject(attributes);
    cert.sign(keys.privateKey, _nodeForge.default.md.sha256.create());
    console.debug('Exiting generateFull');
    return {
      cert: _nodeForge.default.pki.certificateToPem(cert),
      key: _nodeForge.default.pki.privateKeyToPem(keys.privateKey)
    };
  }
}
exports.CertificateGenerator = CertificateGenerator;