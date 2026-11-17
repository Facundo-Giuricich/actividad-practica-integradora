import { useEffect, useState } from 'react';
import { usersApi } from '../api/users.api';
import { Can } from '../components/Can';
import { useAuth } from '../context/AuthContext';
import type { RoleSummary, UserSummary } from '../types';
import { errorMessage, formatDate } from '../utils/format';

/** RF6: el administrador lista usuarios y les asigna un rol. */
export function AdminUsersPage() {
  const { user: me, hasPermission } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const canAssign = hasPermission('user:assign-role');

  useEffect(() => {
    Promise.all([usersApi.list(), canAssign ? usersApi.roles() : Promise.resolve([])])
      .then(([userList, roleList]) => {
        setUsers(userList);
        setRoles(roleList);
      })
      .catch((err: unknown) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [canAssign]);

  const changeRole = async (target: UserSummary, roleName: string) => {
    const role = roles.find((r) => r.name === roleName);
    if (!role || role.name === target.role) return;
    setError(null);
    setInfo(null);
    try {
      const updated = await usersApi.assignRole(target.id, role.name);
      setUsers((current) => current.map((u) => (u.id === updated.id ? updated : u)));
      setInfo(`${updated.name} ahora tiene el rol ${updated.role}.`);
    } catch (err: unknown) {
      setError(errorMessage(err));
    }
  };

  return (
    <section>
      <h1>Usuarios</h1>
      {loading && <p className="muted">Cargando…</p>}
      {info && <p className="success">{info}</p>}
      {error && <p className="error">{error}</p>}

      {users.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Alta</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <Can permission="user:assign-role" fallback={<span className={`role role-${u.role}`}>{u.role}</span>}>
                    {u.id === me?.id ? (
                      <span className={`role role-${u.role}`} title="No podés cambiar tu propio rol">
                        {u.role} (vos)
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        aria-label={`Rol de ${u.name}`}
                        onChange={(e) => void changeRole(u, e.target.value)}
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.name}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </Can>
                </td>
                <td className="muted">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
