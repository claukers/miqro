import { EncryptJWT, EncryptOptions, JWTDecryptOptions, JWTDecryptResult, JWTPayload, JWTVerifyOptions, JWTVerifyResult, ProtectedHeaderParameters, SignJWT, SignOptions, decodeJwt, decodeProtectedHeader, jwtDecrypt as joseJWTDecrypt, jwtVerify } from "jose";
import { KeyObject } from "node:crypto";
import { EncryptJWTOptions, JWTSignOptions } from "../types.js";

/**
 * creates a JWT encrypted token with jose
 * 
 * @param payload the payload to encrypt
 * @param secret the secret example. const secret = createSecretKey(process.env.JWT_SECRET, 'utf-8');
 * @param options options like expiratation date, issuer and audience
 * @returns 
 */
export async function encryptJWT(payload: JWTPayload, secret: KeyObject, options?: Partial<EncryptJWTOptions>): Promise<string> {
  const en = new EncryptJWT(payload)
    .setProtectedHeader({
      alg: options?.alg ? options?.alg : 'dir',
      enc: options?.enc ? options?.enc : 'A128CBC-HS256'
    })
    .setIssuedAt(options?.iat)
    .setIssuer(options?.iss ? options?.iss : 'urn:example:issuer')
    .setAudience(options?.aud ? options?.aud : 'urn:example:audience')
    .setExpirationTime(options?.exp ? options?.exp : '2h');

  return await en.encrypt(secret, options?.options);
}

/**
 * decrypts a JWT token with jose
 * @param jwt the JWT token
 * @param secret the secret example. const secret = createSecretKey(process.env.JWT_SECRET, 'utf-8');
 * @param options options like issuer and audience
 * @returns 
 */
export async function decryptJWT<PayloadType = JWTPayload>(jwt: string, secret: KeyObject, options?: Partial<JWTDecryptOptions>): Promise<JWTDecryptResult<PayloadType>> {
  return await joseJWTDecrypt(jwt, secret, options)
}

/**
 * verify a JWT token with jose
 * @param jwt the JWT token
 * @param secret the secret example. const secret = createSecretKey(process.env.JWT_SECRET, 'utf-8');
 * @param options options like issuer and audience
 * @returns 
 */
export async function verifyJWT<PayloadType = JWTPayload>(jwt: string, secret: KeyObject, options?: Partial<JWTVerifyOptions>): Promise<JWTVerifyResult<PayloadType>> {
  return await jwtVerify(jwt, secret, options)
}

/**
 * creates a signed JWT with jose
 * 
 * @param payload the payload to encrypt
 * @param secret the secret example. const secret = createSecretKey(process.env.JWT_SECRET, 'utf-8');
 * @param options options like expiratation date, issuer and audience
 * @returns 
 */
export async function signJWT(payload: JWTPayload, secret: KeyObject, options?: Partial<JWTSignOptions>): Promise<string> {
  const sign = new SignJWT(payload)
    .setProtectedHeader({
      alg: options?.alg ? options?.alg : 'dir',
    })
    .setIssuedAt(options?.iat)
    .setIssuer(options?.iss ? options?.iss : 'urn:example:issuer')
    .setAudience(options?.aud ? options?.aud : 'urn:example:audience')
    .setExpirationTime(options?.exp ? options?.exp : '2h');
  return sign.sign(secret, options?.options);
}

/**
 * decodes a protected header with jose
 * @param token 
 * @returns 
 */
export function decodeProtectedHeaderJWT(token: string | object): ProtectedHeaderParameters {
  return decodeProtectedHeader(token);
}

/**
 * decodes a jwt token
 * @param jwt 
 * @returns 
 */
export function decodeJWT<PayloadType = JWTPayload>(jwt: string): PayloadType & JWTPayload {
  return decodeJwt<PayloadType>(jwt)
}
