import { AppError } from '../errors/AppError';
import type { ILibroRepository } from '../repositories/interfaces/ILibroRepository';
import type { Libro, LibroStatus, LibroStatusChange, LibroUpdateData, NewLibroData } from '../types/libro';

/** Gestión del recurso principal (RF3). No conoce Express. */
export class LibroService {
  constructor(private readonly libros: ILibroRepository) {}

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
   * Cambia el estado del libro. Se permite pasar de cualquier estado a cualquier
   * otro, salvo al mismo: eso no es un cambio y no debe notificar a nadie.
   * (En la etapa 4 este método avisa al EventPublisher — patrón Observer.)
   */
  async changeStatus(id: number, newStatus: LibroStatus): Promise<LibroStatusChange> {
    const current = await this.getById(id);
    if (current.status === newStatus) {
      throw new AppError('VALIDATION', `El libro ya está en estado ${newStatus}`);
    }

    const libro = await this.libros.updateStatus(id, newStatus);
    if (!libro) throw notFound(id);
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
