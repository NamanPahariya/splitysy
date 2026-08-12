import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const ALGORITHM = "scrypt";

export const DUMMY_PASSWORD_DIGEST =
  "scrypt$000102030405060708090a0b0c0d0e0f$4f7b3182cf5025dfdfd6137dfb58b87c465841e6189959d9d74a5cdd1a5b9b162db03e17eabd5dc62eba45369182e8ee57f8e51af2ca2232620b80d8403bbea0";

function deriveKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (error, key) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await deriveKey(password, salt);

  return `${ALGORITHM}$${salt}$${key.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  digest: string,
): Promise<boolean> {
  const parts = digest.split("$");

  if (parts.length !== 3) {
    return false;
  }

  const [algorithm, salt, expectedHex] = parts;

  if (algorithm !== ALGORITHM || !salt || !expectedHex) {
    return false;
  }

  const expected = Buffer.from(expectedHex, "hex");

  if (expected.length !== KEY_LENGTH) {
    return false;
  }

  const actual = await deriveKey(password, salt);
  return timingSafeEqual(actual, expected);
}
