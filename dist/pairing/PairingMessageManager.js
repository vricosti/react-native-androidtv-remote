"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PairingMessageManager = void 0;
require("core-js/modules/es.error.cause.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/web.dom-collections.iterator.js");
var _protobufjs = _interopRequireDefault(require("protobufjs"));
var _pairingmessageProto = _interopRequireDefault(require("./pairingmessage.proto.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class PairingMessageManager {
  constructor() {
    var systeminfo = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    console.log('PairingMessageManager.constructor');
    systeminfo = systeminfo || {};
    this.root = _protobufjs.default.parse(_pairingmessageProto.default).root;
    this.PairingMessage = this.root.lookupType("pairing.PairingMessage");
    this.Status = this.root.lookupEnum("pairing.PairingMessage.Status").values;
    this.RoleType = this.root.lookupEnum("RoleType").values;
    this.EncodingType = this.root.lookupEnum("pairing.PairingEncoding.EncodingType").values;
    this.manufacturer = systeminfo.manufacturer || 'defaultManufacturer';
    this.model = systeminfo.model || 'defaultModel';
  }
  create(payload) {
    console.log('PairingMessageManager.create');
    var errMsg = this.PairingMessage.verify(payload);
    if (errMsg) throw Error(errMsg);
    var message = this.PairingMessage.create(payload);
    return this.PairingMessage.encodeDelimited(message).finish();
  }
  createPairingRequest(service_name) {
    console.log('PairingMessageManager.createPairingRequest');
    return this.create({
      pairingRequest: {
        serviceName: service_name,
        clientName: this.model
      },
      status: this.Status.STATUS_OK,
      protocolVersion: 2
    });
  }
  createPairingOption() {
    console.log('PairingMessageManager.createPairingOption');
    return this.create({
      pairingOption: {
        preferredRole: this.RoleType.ROLE_TYPE_INPUT,
        inputEncodings: [{
          type: this.EncodingType.ENCODING_TYPE_HEXADECIMAL,
          symbolLength: 6
        }]
      },
      status: this.Status.STATUS_OK,
      protocolVersion: 2
    });
  }
  createPairingConfiguration() {
    return this.create({
      pairingConfiguration: {
        clientRole: this.RoleType.ROLE_TYPE_INPUT,
        encoding: {
          type: this.EncodingType.ENCODING_TYPE_HEXADECIMAL,
          symbolLength: 6
        }
      },
      status: this.Status.STATUS_OK,
      protocolVersion: 2
    });
  }
  createPairingSecret(secret) {
    return this.create({
      pairingSecret: {
        secret: secret
      },
      status: this.Status.STATUS_OK,
      protocolVersion: 2
    });
  }
  parse(buffer) {
    console.log('PairingMessageManager.parse');
    return this.PairingMessage.decodeDelimited(buffer);
  }
}
exports.PairingMessageManager = PairingMessageManager;