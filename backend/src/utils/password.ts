import bcrypt from 'bcrypt';

/** Costo de bcrypt: cada +1 duplica el tiempo de cálculo. 10 es el valor habitual. */
const SALT_ROUNDS = 10;

/** Lo usan AuthService (registro) y el seed (usuarios de prueba). */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
