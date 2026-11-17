import { AppError } from '../errors/AppError';
import type { ISubject } from '../observer/ISubject';
import type { ILibroRepository } from '../repositories/interfaces/ILibroRepository';
import type { LibroStatusChangedEvent } from '../types/events';
import type { Libro, LibroStatus, LibroStatusChange, LibroUpdateData, NewLibroData } from '../types/libro';

/** Gestión del recurso principal (RF3). No conoce Express. */
export class LibroService {
  constructor(
    private readonly libros: ILibroRepository,
    // Subject del patrón Observer. LibroService no sabe quién escucha ni qué hace:
    // solo avisa que el estado cambió.
    private readonly events: ISubject<LibroStatusChangedEvent>,
  ) {}

  list(): Promise<Libro[]> {
    return this.libros.findAll();
  }

  async getById(id: number): Promise<Libro> {
    const libro = await this.libros.findById(id);
    if (!libro) throw notFound(id);
    return libro;
  }

  create(data: NewLibroData): Promise<Libro> {
    return this.libros.create(data);
  }

  async update(id: number, data: LibroUpdateData): Promise<Libro> {
    const libro = await this.libros.update(id, data);
    if (!libro) throw notFound(id);
    return libro;
  }

  /**
   * Cambia el estado del libro y publica el evento (patrón Observer).
   * Se permite pasar de cualquier estado a cualquier otro, salvo al mismo:
   * eso no es un cambio y no debe notificar a nadie.
   */
  async changeStatus(id: number, newStatus: LibroStatus): Promise<LibroStatusChange> {
    const current = await this.getById(id);
    if (current.status === newStatus) {
      throw new AppError('VALIDATION', `El libro ya está en estado ${newStatus}`);
    }

    const libro = await this.libros.updateStatus(id, newStatus);
    if (!libro) throw notFound(id);

    await this.events.notify({
      libroId: libro.id,
      libroTitle: libro.title,
      previousStatus: current.status,
      newStatus: libro.status,
      changedAt: libro.updatedAt,
    });

    return { libro, previousStatus: current.status };
  }

  async delete(id: number): Promise<void> {
    const deleted = await this.libros.delete(id);
    if (!deleted) throw notFound(id);
  }
}

function notFound(id: number): AppError {
  return new AppError('NOT_FOUND', `No existe el libro ${id}`);
}
