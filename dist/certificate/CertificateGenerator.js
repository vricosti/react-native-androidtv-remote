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

    // Stil does not work so try with a self-signed cert generated with openssl
    // openssl req -newkey rsa:2048 -nodes -x509 -days 36500 -nodes -keyout client-selfsigned.key -out client-selfsigned.crt
    // copy them inside client-selfsigned.crt and client-selfsigned.key and inside android/app/src/main/res/raw
    // and add android/app/src/main/res/xml/network_security_config.xml

    //         const cert = `
    // -----BEGIN CERTIFICATE-----
    // MIIC4TCCAcmgAwIBAgIBCzANBgkqhkiG9w0BAQsFADAfMRAwDgYDVQQDDAdNb3Vz
    // ZUNBMQswCQYDVQQGEwJHQjAeFw0xOTA5MzAxNDI0NDFaFw0yOTA5MjcxNDI0NDFa
    // MB0xDjAMBgNVBAMMBUJlbmp5MQswCQYDVQQGEwJHQjCCASIwDQYJKoZIhvcNAQEB
    // BQADggEPADCCAQoCggEBAOQe5ai68FQhTVIgpsDK+UOPIrgKzqJcW+wwLnJRp6GV
    // V9EmifJq7wjrXeqmP1XgcNtu7cVhDx+/ONKl/8hscak54HTQrgwE6mK628RThld9
    // BmZoOjaWWCkoU5bH7ZIYgrKF1tAO5uTAmVJB9v7DQQvKERwjQ10ZbFOW6v8j2gDL
    // esZQbFIC7f/viDXLsPq8dUZuyyb9BXrpEJpXpFDi/wzCV3C1wmtOUrU27xz4gBzi
    // 3o9O6U4QmaF91xxaTk0Ot+/RLI70mR7TYa+u6q7UW/KK9q1+8LeTVs1x24VA5csx
    // HCAQf+xvMoKlocmUxCDBYkTFkmtyhmGRN52XucHgu0kCAwEAAaMqMCgwDgYDVR0P
    // AQH/BAQDAgWgMBYGA1UdJQEB/wQMMAoGCCsGAQUFBwMCMA0GCSqGSIb3DQEBCwUA
    // A4IBAQAyrArH7+IyHTyEOrv/kZr3s3h4HWczSVeiO9qWD03/fVew84J524DiSBK4
    // mtAy3V/hqXrzrQEbsfyT7ZhQ6EqB/W0flpVYbku10cSVgoeSfjgBJLqgJRZKFonv
    // OQPjTf9HEDo5A1bQdnUF1y6SwdFaY16lH9mZ5B8AI57mduSg90c6Ao1GvtbAciNk
    // W8y4OTQp4drh18hpHegrgTIbuoWwgy8V4MX6W39XhkCUNhrQUUJk3mEfbC/yqfIG
    // YNds0NRI3QCTJCUbuXvDrLEn4iqRfbzq5cbulQBxBCUtLZFFjKE4M42fJh6D6oRR
    // yZSx4Ac3c+xYqTCjf0UdcUGxaxF/
    // -----END CERTIFICATE-----
    // `;

    // const key = `
    // -----BEGIN PRIVATE KEY-----
    // MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDkHuWouvBUIU1S
    // IKbAyvlDjyK4Cs6iXFvsMC5yUaehlVfRJonyau8I613qpj9V4HDbbu3FYQ8fvzjS
    // pf/IbHGpOeB00K4MBOpiutvEU4ZXfQZmaDo2llgpKFOWx+2SGIKyhdbQDubkwJlS
    // Qfb+w0ELyhEcI0NdGWxTlur/I9oAy3rGUGxSAu3/74g1y7D6vHVGbssm/QV66RCa
    // V6RQ4v8MwldwtcJrTlK1Nu8c+IAc4t6PTulOEJmhfdccWk5NDrfv0SyO9Jke02Gv
    // ruqu1FvyivatfvC3k1bNcduFQOXLMRwgEH/sbzKCpaHJlMQgwWJExZJrcoZhkTed
    // l7nB4LtJAgMBAAECggEBAKOPF6ED776SZgrliEog/dmXrhABB6jXybytyw+CRkuP
    // dXhrRmr+isZ9Y0gTzMN4+dILVgW4EozzoP0/sgZ04oWwDqQS30eU2qzRRzMbo+3k
    // oYsZXeu3nhxcYppwXIDsfAEd/ygMFzaadRPKYhrFykR2rA/dpLYCvW2tfm5SuULp
    // RxnKykFlVi8yVT64AovVm0XGOy/QTO5BBbUdftvZY9QCjGn/IEL8QFEz0rxZsb2L
    // s0HgVMUcB1My38RksZQRKLMWCtqLqWnez3oCnPka+dxFQj5RU//vNtRoVh1ExbmW
    // txHz48v00AKQvaudC4ujIspZlY8+UPdYQT0TNjhsfoUCgYEA+7yEvyCgRtYwUNm6
    // jHTg67LoSldHwENOry63qGZp3rCkWBkPXle7ulgRtuw+e11g4MoMMAgkIGyIGB/Z
    // 6YvnQGmJCTMw+HHIyw3k/OvL1iz4DM+QlxDuD79Zu2j2UIL4maDG0ZDskiJujVAf
    // sFOy4r36TvYedmd7qgh9pgpsFl8CgYEA5/v8PZDs2I1wSDGllGfTr6aeQcxvw98I
    // p8l/8EV/lYpdKQMFndeFZI+dnJCcTeBbeXMmPNTAdL5gOTwDReXamIAdr93k7/x6
    // iKMHzBrpQZUMEhepSd8zdR1+vLvyszvUU6lvNXcfjwbu7gJQkwbA6kSoXRN+C1Cv
    // i5/w66t0f1cCgYBt02FWwTUrsmaB33uzq4o1SmhthoaXKsY5R3h4z7WAojAQ/13l
    // GwGb2rBfzdG0oJiTeZK3odWhD7iQTdUUPyU0xNY0XVEQExQ3AmjUr0rOte/CJww9
    // 2/UAicrsKG7N0VYEMFCNPVz4pGz22e35T4rLwXZi3J2NqrgZBntK5WEioQKBgEyx
    // L4ii+sn0qGQVlankUUVGjhcuoNxeRZxCrzsdnrovTfEbAKZX88908yQpYqMUQul5
    // ufBuXVm6/lCtmF9pR8UWxbm4X9E+5Lt7Oj6tvuNhhOYOUHcNhRN4tsdqUygR5XXr
    // E8rXIOXF4wNoXH7ewrQwEoECyq6u8/ny3FDtE8xtAoGBALNFxRGikbQMXhUXj7FA
    // lLwWlNydCxCc7/YwlHfmekDaJRv59+z7SWAR15azhbjqS9oXWJUQ9uvpKF75opE7
    // MT0GzblkKAYu/3uhTENCjQg+9RFfu5w37E5RTWHD2hANV0YqXUlmH3d+f5uO0xN7
    // 7bpqwYuYzSv1hBfU/yprDco6
    // -----END PRIVATE KEY-----
    // `;

    //         return {
    //             cert,
    //             key
    //         }
  }
}
exports.CertificateGenerator = CertificateGenerator;