import forge from "node-forge"
import modPow from 'react-native-modpow'

export class CertificateGenerator {

    static generateFull(name){

        console.log(`Entering generateFull(${name})`);
        console.log('modPow: ', modPow);

        forge.jsbn.BigInteger.prototype.modPow = function nativeModPow(e, m) {
            const result = modPow({
                target: this.toString(16),
                value: e.toString(16),
                modifier: m.toString(16)
            });

            return new forge.jsbn.BigInteger(result, 16);
        };
        
        let date = new Date();
        date.setUTCFullYear(2021);
        let date2 = new Date();
        date2.setUTCFullYear(2099);
        let keys = forge.pki.rsa.generateKeyPair(3072);
        let cert = forge.pki.createCertificate();
        cert.publicKey = keys.publicKey;
        cert.serialNumber = '01' + forge.util.bytesToHex(forge.random.getBytesSync(19));
        cert.validity.notBefore = date;
        cert.validity.notAfter = date2;

        let attributes = [
            {name: 'commonName', value: name},
            // {name: 'countryName', value: country},
            // {shortName: 'ST', value: state},
            // {name: 'localityName', value: locality},
            // {name: 'organizationName', value: organisation},
            // {shortName: 'OU', value: OU}
        ];
        cert.setSubject(attributes);
        cert.setIssuer(attributes)
        cert.sign(keys.privateKey, forge.md.sha256.create());

        console.debug('Exiting generateFull');

        return {
            cert : forge.pki.certificateToPem(cert),
            key : forge.pki.privateKeyToPem(keys.privateKey),
        }
    }

    static initClientCertificate() {
        console.debug('initClientCertificate');

    }
}
