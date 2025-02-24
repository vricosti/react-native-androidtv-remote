import {PairingMessageManager} from "./PairingMessageManager.js";
import forge from 'node-forge';
import {Buffer} from "buffer";
import EventEmitter from "events";
import TcpSockets from 'react-native-tcp-socket';

//import RNFS from 'react-native-fs';

class PairingManager extends EventEmitter {

    constructor(host, port, certs, service_name, systeminfo) {
        super();
        this.host = host;
        this.port = port;
        this.chunks = Buffer.from([]);
        this.certs = certs;
        this.service_name = service_name;
        this.pairingMessageManager = new PairingMessageManager(systeminfo);
        this.isCancelled = false;
    }

    /*
    async logCertificates(clientCert, serverCert) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const logDir = `${RNFS.DocumentDirectoryPath}/logs`;
        const logFile = `${logDir}/certificates-${timestamp}.log`;
      
        try {
          // Create logs directory if it doesn't exist
          await RNFS.mkdir(logDir, { NSURLIsExcludedFromBackupKey: true });
      
          const logContent = `
      === Certificate Log Generated at ${new Date().toISOString()} ===
      Client Certificate:
      ${JSON.stringify(clientCert, null, 2)}
      Server Certificate:
      ${JSON.stringify(serverCert, null, 2)}
      `;
      
          await RNFS.writeFile(logFile, logContent, 'utf8');
          console.debug(`Certificates logged to: ${logFile}`);
      
          // Log the full path for debugging
          console.debug('Document Directory:', RNFS.DocumentDirectoryPath);
        } catch (error) {
          console.error('Error writing certificate logs:', error);
        }
      }*/

    async sendCode(code){
        console.debug("Sending code : ", code);
        let code_bytes = this.hexStringToBytes(code);

        let client_certificate = await this.client.getCertificate();
        let server_certificate = await this.client.getPeerCertificate();
        //await this.logCertificates(client_certificate, server_certificate);
        let sha256 = forge.md.sha256.create();

        sha256.update(forge.util.hexToBytes(client_certificate.modulus), 'raw');
        sha256.update(forge.util.hexToBytes("0" + client_certificate.exponent.slice(2)), 'raw');
        sha256.update(forge.util.hexToBytes(server_certificate.modulus), 'raw');
        sha256.update(forge.util.hexToBytes("0" + server_certificate.exponent.slice(2)), 'raw');
        sha256.update(forge.util.hexToBytes(code.slice(2)), 'raw');

        let hash = sha256.digest().getBytes();
        let hash_array = Array.from(hash, c => c.charCodeAt(0) & 0xff);
        let check = hash_array[0];
        if (check !== code_bytes[0]){
            console.error("Code validation failed");
            this.client.destroy(new Error("Bad Code"));
            return false;
        }
        else {
            console.debug("Code validated, sending pairing secret");
            this.client.write(this.pairingMessageManager.createPairingSecret(hash_array));
            return true;
        }
    }

    cancelPairing() {
        this.isCancelled = true;
        this.client.destroy(new Error("Pairing canceled"));
        return false;
    }

    async start() {
        return new Promise((resolve, reject) => {
  
            let options = {
                port: this.port,
                host : this.host,
                key: this.certs.key,
                cert: this.certs.cert,
                rejectUnauthorized: false, // if true => use ca
                // Specific to react-native-tcp-socket (patched)
                androidKeyStore: this.certs.androidKeyStore,
                certAlias: this.certs.certAlias,
                keyAlias: this.certs.keyAlias,
            };
            
            //console.debug('PairingManager.start(): before connectTLS');
            this.client = TcpSockets.connectTLS(options, () => {
                console.debug(this.host + " Pairing connected");
            });

            this.isCancelled = false;
            this.client.pairingManager = this;

            this.client.on("secureConnect", () => {
                console.debug(this.host + " Pairing secure connected ");
                this.client.write(this.pairingMessageManager.createPairingRequest(this.service_name));
            });

            this.client.on('data', (data) => {
                let buffer = Buffer.from(data);
                this.chunks = Buffer.concat([this.chunks, buffer]);

                if(this.chunks.length > 0 && this.chunks.readInt8(0) === this.chunks.length - 1){

                    let message = this.pairingMessageManager.parse(this.chunks);

                    console.debug("Receive : " + Array.from(this.chunks));
                    console.debug("Receive : " + JSON.stringify(message.toJSON()));

                    if (message.status !== this.pairingMessageManager.Status.STATUS_OK){
                        this.client.destroy(new Error(message.status));
                    }
                    else {
                        if(message.pairingRequestAck){
                            this.client.write(this.pairingMessageManager.createPairingOption());
                        }
                        else if(message.pairingOption){
                            this.client.write(this.pairingMessageManager.createPairingConfiguration());
                        }
                        else if(message.pairingConfigurationAck){
                            this.emit('secret');
                        }
                        else if(message.pairingSecretAck){
                            console.debug(this.host + " Paired!");
                            this.client.destroy();
                        }
                        else {
                            console.debug(this.host + " What Else ?")
                        }
                    }
                    this.chunks = Buffer.from([]);
                }
            });

            this.client.on('close', (hasError) => {
                if(hasError) {
                    console.log('PairingManager.close() failure');
                    reject(false);
                }
                else if (this.isCancelled) {
                    console.log('PairingManager.close() on cancelPairing()');
                    this.isCancelled = false;
                    reject(false);
                }
                else{
                    console.log('PairingManager.close() success');
                    resolve(true);
                }
            });

            this.client.on('error', (error) => {
                console.error(error);
            });
        });

    }

    hexStringToBytes(q){
        let bytes = [];
        for (let i = 0; i < q.length; i += 2) {
            let byte = parseInt(q.substring(i, i + 2), 16);
            if (byte > 127) {
                byte = -(~byte & 0xFF) - 1;
            }
            bytes.push(byte);
        }
        return bytes;
    }
}

export { PairingManager };
