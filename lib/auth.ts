import crypto from "crypto";

const KEYLEN = 64;

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, KEYLEN, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

export function verifyPassword(password: string, stored: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, hash] = (stored || "").split(":");
    if (!salt || !hash) return resolve(false);
    crypto.scrypt(password, salt, KEYLEN, (err, derivedKey) => {
      if (err) return reject(err);
      const hashBuf = Buffer.from(hash, "hex");
      if (hashBuf.length !== derivedKey.length) return resolve(false);
      resolve(crypto.timingSafeEqual(hashBuf, derivedKey));
    });
  });
}

const SESSION_COOKIE = "ds_user_session";

export function sessionCookieName(): string {
  return SESSION_COOKIE;
}
