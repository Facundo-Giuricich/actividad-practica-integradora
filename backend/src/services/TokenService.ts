import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';

/** Contrato para emitir y verificar tokens de sesión. */
export interface ITokenService {
  sign(userId: number): string;
  /** Devuelve el id del usuario dueño del token, o lanza UNAUTHORIZED. */
  verify(token: string): number;
}

/**
 * Implementación con JWT. El token solo lleva el id del usuario (claim "sub"):
 * los permisos NO van en el token, se consultan en la base en cada request,
 * así un cambio de rol se aplica en el momento.
 */
export class JwtTokenService implements ITokenService {
  constructor(private readonly secret: string) {}

  sign(userId: number): string {
    return jwt.sign({}, this.secret, {
      algorithm: 'HS256',
      subject: String(userId),
      expiresIn: '8h',
    });
  }

  verify(token: string): number {
    let payload: string | jwt.JwtPayload;
    try {
      payload = jwt.verify(token, this.secret, { algorithms: ['HS256'] });
    } catch {
      throw new AppError('UNAUTHORIZED', 'Token inválido o vencido');
    }

    const userId = typeof payload === 'string' ? NaN : Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new AppError('UNAUTHORIZED', 'Token inválido o vencido');
    }
    return userId;
  }
}
