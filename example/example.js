import {
    AndroidRemote,
    RemoteKeyCode,
    RemoteDirection
} from "androidtv-remote";

import fs from "fs/promises";
import path from "path";
import Readline from "readline";    
import { system } from "systeminformation";

const rememberPairing = true;

const CERT_KEY_PATH = path.resolve("./androidtv_key.pem");
const CERT_CERT_PATH = path.resolve("./androidtv_cert.pem");

async function loadCertificate() {
    try {
        let key = await fs.readFile(CERT_KEY_PATH, 'utf8');
        let cert = await fs.readFile(CERT_CERT_PATH, 'utf8');
        return { key, cert };
    } catch (error) {
        console.error("No existing certificate found, a new pairing will be required.");
        return null;
    }
}

async function saveCertificate(cert) {
    try {
        await fs.writeFile(CERT_KEY_PATH, cert.key);
        await fs.writeFile(CERT_CERT_PATH, cert.cert);
        console.log("Certificate saved successfully.");
    } catch (error) {
        console.error("Failed to save certificate: ", error);
    }
}

let line = Readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let host = "192.168.1.102";
let options = {
    pairing_port: 6467,
    remote_port: 6466,
    name: 'androidtv-remote'
}

async function setup() {
    // Fetch system information
    let sysInfo = await system();
    options.systeminfo = {
        manufacturer: sysInfo.manufacturer || 'default-manufacturer',
        model: sysInfo.model || 'default-model'
    };

    let cert = null;
    
    if (rememberPairing) {
        cert = await loadCertificate();
        console.log('Loaded certificate: ', cert);
        if (cert) {
            options.cert = cert;
        }
    }

    let androidRemote = new AndroidRemote(host, options);

    androidRemote.on('secret', async () => {
        line.question("Code : ", async (code) => {
            await androidRemote.sendCode(code);
        });
    });

    androidRemote.on('powered', (powered) => {
        console.debug("Powered : " + powered);
    });

    androidRemote.on('volume', (volume) => {
        console.debug("Volume : " + volume.level + '/' + volume.maximum + " | Muted : " + volume.muted);
    });

    androidRemote.on('current_app', (current_app) => {
        console.debug("Current App : " + current_app);
    });

    androidRemote.on('error', (error) => {
        console.error("Error : " + error);
    });

    androidRemote.on('unpaired', () => {
        console.error("Unpaired");
    });

    androidRemote.on('ready', async () => {
        console.log("Remote is ready. Type command keys (e.g., KEYCODE_MUTE) to control the TV:");
        commandInput();
    });

    async function commandInput() {
        line.prompt();
        line.on('line', async (cmd) => {
            if (cmd in RemoteKeyCode) {
                console.log(`Sending ${cmd}...`);
                androidRemote.sendKey(RemoteKeyCode[cmd], RemoteDirection.SHORT);
            } else {
                console.log("Invalid key code. Please try again.");
            }
            line.prompt();
        });
    }

    let started = await androidRemote.start();
    console.log('after androidRemote.start()');
    if (started && rememberPairing && (!cert || !cert.key || !cert.cert)) {
        await saveCertificate(androidRemote.getCertificate());
    }
}

// Run the setup function
setup().catch(error => {
    console.error("Failed to setup AndroidRemote:", error);
});
