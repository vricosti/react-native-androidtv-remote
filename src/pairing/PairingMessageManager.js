import protobufjs from "protobufjs";
import pairingMessageProto from "./pairingmessage.proto.js";

class PairingMessageManager {
    constructor(systeminfo = {}){

        console.log('PairingMessageManager.constructor');
        systeminfo = systeminfo || {};

        this.root = protobufjs.parse(pairingMessageProto).root;
        this.PairingMessage = this.root.lookupType("pairing.PairingMessage");
        this.Status = this.root.lookupEnum("pairing.PairingMessage.Status").values;
        this.RoleType = this.root.lookupEnum("RoleType").values;
        this.EncodingType = this.root.lookupEnum("pairing.PairingEncoding.EncodingType").values;

        this.manufacturer = systeminfo.manufacturer || 'defaultManufacturer';
        this.model = systeminfo.model || 'defaultModel';
    }

    create(payload){
        console.log('PairingMessageManager.create');
        let errMsg = this.PairingMessage.verify(payload);
        if (errMsg)
            throw Error(errMsg);

        let message = this.PairingMessage.create(payload);

        return this.PairingMessage.encodeDelimited(message).finish();
    }

    createPairingRequest(service_name){
        console.log('PairingMessageManager.createPairingRequest');
        return this.create({
            pairingRequest: {
                serviceName: service_name,
                clientName: this.model,
            },
            status: this.Status.STATUS_OK,
            protocolVersion: 2
        });
    }

    createPairingOption(){
        console.log('PairingMessageManager.createPairingOption');
        return this.create({
            pairingOption: {
                preferredRole : this.RoleType.ROLE_TYPE_INPUT,
                inputEncodings : [{
                    type : this.EncodingType.ENCODING_TYPE_HEXADECIMAL,
                    symbolLength : 6
                }]
            },
            status: this.Status.STATUS_OK,
            protocolVersion: 2
        });
    }

    createPairingConfiguration(){
        return this.create({
            pairingConfiguration: {
                clientRole : this.RoleType.ROLE_TYPE_INPUT,
                encoding : {
                    type : this.EncodingType.ENCODING_TYPE_HEXADECIMAL,
                    symbolLength : 6
                }
            },
            status: this.Status.STATUS_OK,
            protocolVersion: 2
        });
    }

    createPairingSecret(secret){
        return this.create({
            pairingSecret: {
                secret : secret
            },
            status: this.Status.STATUS_OK,
            protocolVersion: 2
        });
    }

    parse(buffer){
        console.log('PairingMessageManager.parse');
        return this.PairingMessage.decodeDelimited(buffer);
    }

}

export { PairingMessageManager };
