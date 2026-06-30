import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_TOKEN_BYTES = 2048;
const MIN_SECRET_LENGTH = 32;
const BASE64URL_ENCODING = "base64url";

function assertSecret(secret) {
  if (typeof secret !== "string" || secret.length < MIN_SECRET_LENGTH) {
    throw new Error("Purchase intent secret must be at least 32 characters long.");
  }
}

function assertPositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
}

function assertReturnPath(returnPath) {
  if (typeof returnPath !== "string" || !returnPath.startsWith("/tienda/")) {
    throw new Error("returnPath must start with /tienda/.");
  }
}

function assertPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Purchase intent payload must be an object.");
  }

  assertPositiveInteger(payload.productId, "productId");
  assertPositiveInteger(payload.variantId, "variantId");
  assertReturnPath(payload.returnPath);
  assertPositiveInteger(payload.exp, "exp");
}

function encodeSegment(value) {
  return Buffer.from(JSON.stringify(value)).toString(BASE64URL_ENCODING);
}

function signSegment(segment, secret) {
  return createHmac("sha256", secret).update(segment).digest(BASE64URL_ENCODING);
}

function decodeJsonSegment(segment) {
  return JSON.parse(Buffer.from(segment, BASE64URL_ENCODING).toString("utf8"));
}

export function createPurchaseIntent(payload, secret) {
  assertSecret(secret);
  assertPayload(payload);

  const tokenPayload = {
    productId: payload.productId,
    variantId: payload.variantId,
    returnPath: payload.returnPath,
    exp: payload.exp,
  };
  const payloadSegment = encodeSegment(tokenPayload);
  const signatureSegment = signSegment(payloadSegment, secret);

  return `${payloadSegment}.${signatureSegment}`;
}

export function verifyPurchaseIntent(token, secret, now = Math.floor(Date.now() / 1000)) {
  assertSecret(secret);

  if (typeof token !== "string" || Buffer.byteLength(token, "utf8") > MAX_TOKEN_BYTES) {
    throw new Error("Purchase intent token is invalid.");
  }

  const separatorIndex = token.indexOf(".");
  if (separatorIndex <= 0 || separatorIndex !== token.lastIndexOf(".")) {
    throw new Error("Purchase intent token is invalid.");
  }

  const payloadSegment = token.slice(0, separatorIndex);
  const signatureSegment = token.slice(separatorIndex + 1);
  const expectedSignatureSegment = signSegment(payloadSegment, secret);
  const receivedSignature = Buffer.from(signatureSegment, BASE64URL_ENCODING);
  const expectedSignature = Buffer.from(expectedSignatureSegment, BASE64URL_ENCODING);

  if (
    receivedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(receivedSignature, expectedSignature)
  ) {
    throw new Error("Purchase intent token is invalid.");
  }

  const payload = decodeJsonSegment(payloadSegment);
  assertPayload(payload);

  if (now > payload.exp) {
    throw new Error("Purchase intent token has expired.");
  }

  return payload;
}
