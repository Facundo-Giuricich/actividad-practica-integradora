import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { librosApi } from '../api/libros.api';
import { LIBRO_STATUSES, isLibroStatus, type LibroStatus } from '../types';
import { errorMessage, statusLabel } from '../utils/format';

/**
 * Alta (/libros/nuevo) y edición (/libros/:id/editar) de un libro.
 * En la edición no se toca el estado: tiene su propio permiso y su propio botón.
 */
export function LibroFormPage() {
  const { id } = useParams();
  const editingId = id === undefined ? null : Number(id);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<LibroStatus>('DISPONIBLE');
  const [loading, setLoading] = useState(editingId !== null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingId === null) return;
    librosApi
      .get(editingId)
      .then((libro) => {
        setTitle(libro.title);
        setAuthor(libro.author);
        setDescription(libro.description);
      })
      .catch((err: unknown) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [editingId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = { title, author, description };
      const libro =
        editingId === null ? await librosApi.create({ ...data, status }) : await librosApi.update(editingId, data);
      navigate(`/libros/${libro.id}`, { replace: true });
    } catch (err: unknown) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  };

  if (loading) return <p className="muted">Cargando…</p>;

  return (
    <section className="card narrow-wide">
      <Link to={editingId === null ? '/libros' : `/libros/${editingId}`}>← Volver</Link>
      <h1>{editingId === null ? 'Nuevo libro' : 'Editar libro'}</h1>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Título
          <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
        </label>
        <label>
          Autor
          <input value={author} onChange={(e) => setAuthor(e.target.value)} required maxLength={200} />
        </label>
        <label>
          Descripción
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            maxLength={2000}
            rows={4}
          />
        </label>
        {editingId === null && (
          <label>
            Estado inicial
            <select
              value={status}
              onChange={(e) => {
                if (isLibroStatus(e.target.value)) setStatus(e.target.value);
              }}
            >
              {LIBRO_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </label>
        )}
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Guardando…' : 'Guardar'}
        </button>
      </form>
    </section>
  );
}
