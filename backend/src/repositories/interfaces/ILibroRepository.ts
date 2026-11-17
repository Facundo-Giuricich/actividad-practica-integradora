import type { Libro, LibroStatus, LibroUpdateData, NewLibroData } from '../../types/libro';

/** Contrato de acceso a libros. Los métodos de escritura devuelven null si el libro no existe. */
export interface ILibroRepository {
  findAll(): Promise<Libro[]>;
  findById(id: number): Promise<Libro | null>;
  create(data: NewLibroData): Promise<Libro>;
  update(id: number, data: LibroUpdateData): Promise<Libro | null>;
  updateStatus(id: number, status: LibroStatus): Promise<Libro | null>;
  /** true si existía y se borró. */
  delete(id: number): Promise<boolean>;
}
