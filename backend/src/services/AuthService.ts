import { DEFAULT_ROLE } from '../config/permissions';
import { AppError } from '../errors/AppError';
import type { IRoleRepository } from '../repositories/interfaces/IRoleRepository';
import type { IUserRepository } from '../repositories/interfaces/IUserRepository';
import type { AuthUser } from '../types/user';
import { hashPassword, verifyPassword } from '../utils/password';
import type { ITokenService } from './TokenService';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}

/**
 * Lógica de registro, login y sesión. No conoce Express: recibe datos ya
 * validados y devuelve datos o lanza AppError. Sus dependencias son interfaces
 * y le llegan por constructor desde main.ts.
 */
export class AuthService {
  constructor(
    private readonly users: IUserRepository,
    private readonly roles: IRoleRepository,
    private readonly tokens: ITokenService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    if (await this.users.existsByEmail(input.email)) {
      throw new AppError('CONFLICT', 'Ya existe un usuario registrado con ese email');
    }

    // RF2: todo usuario nuevo se registra con el rol "usuario".
    const role = await this.roles.findByName(DEFAULT_ROLE);
    if (!role) throw new Error(`No existe el rol "${DEFAULT_ROLE}": ¿se ejecutó el seed?`);

    const created = await this.users.create({
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      roleId: role.id,
    });
    return this.buildResult(created.id);
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const credentials = await this.users.findCredentialsByEmail(input.email);
    const valid = credentials !== null && (await verifyPassword(input.password, credentials.passwordHash));
    if (!credentials || !valid) {
      // Mismo mensaje si falla el email o la contraseña: no revela qué emails existen.
      throw new AppError('UNAUTHORIZED', 'Email o contraseña incorrectos');
    }
    return this.buildResult(credentials.id);
  }

  /** Usuario con permisos actuales. Lo usa el middleware authenticate en cada request. */
  async getAuthUser(userId: number): Promise<AuthUser> {
    const user = await this.users.findAuthById(userId);
    if (!user) throw new AppError('UNAUTHORIZED', 'La sesión ya no es válida: el usuario no existe');
    return user;
  }

  private async buildResult(userId: number): Promise<AuthResult> {
    const user = await this.getAuthUser(userId);
    return { token: this.tokens.sign(user.id), user };
  }
}
