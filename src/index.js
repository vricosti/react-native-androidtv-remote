import { CertificateGenerator } from "./certificate/CertificateGenerator.js"
import { PairingManager } from "./pairing/PairingManager.js"
import { RemoteManager } from "./remote/RemoteManager.js";
import { RemoteMessageManager } from "./remote/RemoteMessageManager.js";
import EventEmitter from "events";

export class AndroidRemote extends EventEmitter {
    constructor(host, options) {
        console.log('AndroidRemote.constructor');
        super();
        this.host = host
        this.cert = {
            key: options.cert?.key,
            cert: options.cert?.cert,
            androidKeyStore: options.cert?.androidKeyStore ? options.cert?.androidKeyStore : '',
            certAlias: options.cert?.certAlias ? options.cert?.certAlias : '',
            keyAlias: options.cert?.keyAlias ? options.cert?.keyAlias : '',
        };
        this.pairing_port = options.pairing_port ? options.pairing_port : 6467;
        this.remote_port = options.remote_port ? options.remote_port : 6466;
        this.service_name = options.service_name ? options.service_name : "Service Name";
        this.systeminfo = options.systeminfo ? options.systeminfo : {
            manufacturer: "default manufacturer",
            model: "default model"
        };
        this.remoteManager = null;
        this.pairingManager = null;
    }

    async start() {

        if (this.remoteManager) {
            console.log('AndroidRemote.start() has already been started...');
            return;
        }

        console.log('AndroidRemote.start()');
        if (!this.cert || !this.cert.key || !this.cert.cert) {

            this.cert = CertificateGenerator.generateFull(this.service_name);

            console.log('Before creating PairingManager');
            // Clean up any existing pairing manager
            if (this.pairingManager) {
                this.pairingManager.removeAllListeners();
                this.pairingManager = null;
            }
            this.pairingManager = new PairingManager(
                this.host,
                this.pairing_port,
                this.cert,
                this.service_name,
                this.systeminfo);

            this.pairingManager.on('secret', () => this.emit('secret'));

            let paired = await this.pairingManager.start();
            if (!paired) {
                return;
            }
        }

        this.remoteManager = new RemoteManager(this.host, this.remote_port, this.cert, this.systeminfo);

        this.remoteManager.on('powered', (powered) => this.emit('powered', powered));

        this.remoteManager.on('volume', (volume) => this.emit('volume', volume));

        this.remoteManager.on('current_app', (current_app) => this.emit('current_app', current_app));

        this.remoteManager.on('ready', () => this.emit('ready'));

        this.remoteManager.on('unpaired', () => this.emit('unpaired'));

        await new Promise(resolve => setTimeout(resolve, 1000));

        let started = await this.remoteManager.start().catch((error) => {
            console.error(error);
        });

        return started;
    }

    sendPairingCode(code) {
        return this.pairingManager?.sendCode(code);
    }

    cancelPairing() {
        return this.pairingManager?.cancelPairing();
    }

    sendPower() {
        return this.remoteManager?.sendPower();
    }

    sendAppLink(app_link) {
        return this.remoteManager?.sendAppLink(app_link);
    }

    sendKey(key, direction) {
        return this.remoteManager?.sendKey(key, direction);
    }

    getCertificate() {
        return {
            key: this.cert.key,
            cert: this.cert.cert,
        }
    }

    stop() {
        // Remove event listeners from remoteManager
        if (this.remoteManager) {
            this.remoteManager.removeAllListeners();  // Use removeAllListeners() instead of individual removes
            this.remoteManager.stop();
            this.remoteManager = null;
        }

        // Remove event listeners from pairingManager
        if (this.pairingManager) {
            this.pairingManager.removeAllListeners();
            this.pairingManager = null;
        }
    }
}


const remoteMessageManager = new RemoteMessageManager();
let RemoteKeyCode = remoteMessageManager.RemoteKeyCode;
let RemoteDirection = remoteMessageManager.RemoteDirection;
export {
    RemoteKeyCode,
    RemoteDirection,
}
export default {
    AndroidRemote,
    CertificateGenerator,
    RemoteKeyCode,
    RemoteDirection,
}