import type { RoleName } from '../../config/permissions';
import type { RoleSummary } from '../../types/user';

/** Contrato de acceso a roles: solo lectura, porque no hay ABM de roles (los carga el seed). */
export interface IRoleRepository {
  findByName(name: RoleName): Promise<RoleSummary | null>;
  findAll(): Promise<RoleSummary[]>;
}
