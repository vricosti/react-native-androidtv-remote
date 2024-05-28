import protobufjs from "protobufjs";
import remoteMessageProto from "./remotemessage.proto.js";

class RemoteMessageManager {
    constructor(systeminfo = {}) {
        systeminfo = systeminfo || {};

        this.root = protobufjs.parse(remoteMessageProto).root;
        this.RemoteMessage = this.root.lookupType("remote.RemoteMessage");
        this.RemoteKeyCode = this.root.lookupEnum("remote.RemoteKeyCode").values;
        this.RemoteDirection = this.root.lookupEnum("remote.RemoteDirection").values;

        this.manufacturer = systeminfo.manufacturer || 'defaultManufacturer';
        this.model = systeminfo.model || 'defaultModel';
    }

    create(payload){
        if(!payload.remotePingResponse){
            console.debug("Create Remote " + JSON.stringify(payload));
        }

        let errMsg = this.RemoteMessage.verify(payload);
        if (errMsg)
            throw Error(errMsg);

        let message = this.RemoteMessage.create(payload);

        let array = this.RemoteMessage.encodeDelimited(message).finish()

        if(!payload.remotePingResponse){
            //console.debug("Sending " + Array.from(array));
            console.debug("Sending " + JSON.stringify(message.toJSON()));
        }

        return array;
    }

    createRemoteConfigure(code1, model, vendor, unknown1, unknown2){
        return this.create({
            remoteConfigure:{
                code1 : 622,
                deviceInfo : {
                    model : this.model,
                    vendor : this.manufacturer,
                    unknown1 : 1,
                    unknown2 : "1",
                    packageName : "androidtv-remote",
                    appVersion : "1.0.0",
                }
            }
        });
    }

    createRemoteSetActive(active){
        return this.create({
            remoteSetActive:{
                active:active,
            }
        });
    }

    createRemotePingResponse(val1){
        return this.create({
            remotePingResponse:{
                val1:val1,
            }
        });
    }

    createRemoteKeyInject(direction, keyCode) {
        return this.create({
            remoteKeyInject:{
                keyCode : keyCode,
                direction : direction,
            }
        });
    }

    createRemoteAdjustVolumeLevel(level) {
        return this.create({
            remoteAdjustVolumeLevel : level,
        });
    }

    createRemoteResetPreferredAudioDevice() {
        return this.create({
            remoteResetPreferredAudioDevice : {},
        });
    }

    createRemoteImeKeyInject(appPackage, status) {
        return this.create({
            remoteImeKeyInject: {
                textFieldStatus : status,
                appInfo:{
                    appPackage:appPackage,
                }
            }
        });
    }

    createRemoteRemoteAppLinkLaunchRequest(app_link) {
        return this.create({
            remoteAppLinkLaunchRequest : {
                appLink : app_link
            }
        });
    }

    parse(buffer){
        return this.RemoteMessage.decodeDelimited(buffer);
    }

}

export { RemoteMessageManager };
