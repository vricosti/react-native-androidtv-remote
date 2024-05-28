// pairingmessage.proto.js
export default `
syntax = "proto3";
package pairing;

enum RoleType {
  ROLE_TYPE_UNKNOWN = 0;
  ROLE_TYPE_INPUT = 1;
  ROLE_TYPE_OUTPUT = 2;
  UNRECOGNIZED = -1;
}

message PairingRequest {
  string client_name = 2;
  string service_name = 1;
}

message PairingRequestAck {
  string server_name = 1;
}

message PairingEncoding {
  enum EncodingType {
      ENCODING_TYPE_UNKNOWN = 0;
      ENCODING_TYPE_ALPHANUMERIC = 1;
      ENCODING_TYPE_NUMERIC = 2;
      ENCODING_TYPE_HEXADECIMAL = 3;
      ENCODING_TYPE_QRCODE = 4;
      UNRECOGNIZED = -1;
  }
  EncodingType type = 1;
  uint32 symbol_length = 2;
}

message PairingOption {
  repeated PairingEncoding input_encodings = 1;
  repeated PairingEncoding output_encodings = 2;
  RoleType preferred_role = 3;
}

message PairingConfiguration {
  PairingEncoding encoding = 1;
  RoleType client_role = 2;
}

message PairingConfigurationAck {

}

message PairingSecret {
  bytes secret = 1;
}

message PairingSecretAck {
  bytes secret = 1;
}

message PairingMessage {
  enum Status {
    UNKNOWN = 0;
    STATUS_OK = 200;
    STATUS_ERROR = 400;
    STATUS_BAD_CONFIGURATION = 401;
    STATUS_BAD_SECRET = 402;
    UNRECOGNIZED = -1;
  }
  int32 protocol_version = 1;
  Status status = 2;
  int32 request_case = 3;
  PairingRequest pairing_request = 10;
  PairingRequestAck pairing_request_ack = 11;
  PairingOption pairing_option = 20;
  PairingConfiguration pairing_configuration = 30;
  PairingConfigurationAck pairing_configuration_ack = 31;
  PairingSecret pairing_secret = 40;
  PairingSecretAck pairing_secret_ack = 41;
}
`;