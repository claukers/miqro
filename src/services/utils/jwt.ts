import { decodeJWT, decodeProtectedHeaderJWT, decryptJWT, encryptJWT, signJWT, verifyJWT } from "../../common/jwt.js";
import { JWTInterface } from "../../types.js";
import { createSecretKey } from "node:crypto";

export const jwt: JWTInterface = {
  createSecretKey,
  decode(jwt) {
    return decodeJWT(jwt);
  },
  decodeProtectedHeader(token) {
    return decodeProtectedHeaderJWT(token);
  },
  decrypt(jwt, secret, options) {
    return decryptJWT(jwt, secret, options);
  },
  encrypt(payload, secret, options) {
    return encryptJWT(payload, secret, options);
  },
  sign(payload, secret, options) {
    return signJWT(payload, secret, options);
  },
  verify(jwt, secret, options) {
    return verifyJWT(jwt, secret, options);
  }
};
