import crypto from "crypto";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Refresh/reset tokens are high-entropy random values, so a fast SHA-256
// digest (rather than bcrypt) is sufficient for the at-rest lookup hash.
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function randomToken(bytes = 48): string {
  return crypto.randomBytes(bytes).toString("hex");
}
