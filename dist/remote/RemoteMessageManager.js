"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RemoteMessageManager = void 0;
require("core-js/modules/es.error.cause.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.json.stringify.js");
require("core-js/modules/web.dom-collections.iterator.js");
var _protobufjs = _interopRequireDefault(require("protobufjs"));
var _remotemessageProto = _interopRequireDefault(require("./remotemessage.proto.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class RemoteMessageManager {
  constructor() {
    var systeminfo = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    systeminfo = systeminfo || {};
    this.root = _protobufjs.default.parse(_remotemessageProto.default).root;
    this.RemoteMessage = this.root.lookupType("remote.RemoteMessage");
    this.RemoteKeyCode = this.root.lookupEnum("remote.RemoteKeyCode").values;
    this.RemoteDirection = this.root.lookupEnum("remote.RemoteDirection").values;
    this.manufacturer = systeminfo.manufacturer || 'defaultManufacturer';
    this.model = systeminfo.model || 'defaultModel';
  }
  create(payload) {
    if (!payload.remotePingResponse) {
      console.debug("Create Remote " + JSON.stringify(payload));
    }
    var errMsg = this.RemoteMessage.verify(payload);
    if (errMsg) throw Error(errMsg);
    var message = this.RemoteMessage.create(payload);
    var array = this.RemoteMessage.encodeDelimited(message).finish();
    if (!payload.remotePingResponse) {
      //console.debug("Sending " + Array.from(array));
      console.debug("Sending " + JSON.stringify(message.toJSON()));
    }
    return array;
  }
  createRemoteConfigure(code1, model, vendor, unknown1, unknown2) {
    return this.create({
      remoteConfigure: {
        code1: 622,
        deviceInfo: {
          model: this.model,
          vendor: this.manufacturer,
          unknown1: 1,
          unknown2: "1",
          packageName: "androidtv-remote",
          appVersion: "1.0.0"
        }
      }
    });
  }
  createRemoteSetActive(active) {
    return this.create({
      remoteSetActive: {
        active: active
      }
    });
  }
  createRemotePingResponse(val1) {
    return this.create({
      remotePingResponse: {
        val1: val1
      }
    });
  }
  createRemoteKeyInject(direction, keyCode) {
    return this.create({
      remoteKeyInject: {
        keyCode: keyCode,
        direction: direction
      }
    });
  }
  createRemoteAdjustVolumeLevel(level) {
    return this.create({
      remoteAdjustVolumeLevel: level
    });
  }
  createRemoteResetPreferredAudioDevice() {
    return this.create({
      remoteResetPreferredAudioDevice: {}
    });
  }
  createRemoteImeKeyInject(appPackage, status) {
    return this.create({
      remoteImeKeyInject: {
        textFieldStatus: status,
        appInfo: {
          appPackage: appPackage
        }
      }
    });
  }
  createRemoteRemoteAppLinkLaunchRequest(app_link) {
    return this.create({
      remoteAppLinkLaunchRequest: {
        appLink: app_link
      }
    });
  }
  parse(buffer) {
    return this.RemoteMessage.decodeDelimited(buffer);
  }
}
exports.RemoteMessageManager = RemoteMessageManager;