import { LibroModel } from '../models';
import type { Libro, LibroStatus, LibroUpdateData, NewLibroData } from '../types/libro';
import type { ILibroRepository } from './interfaces/ILibroRepository';

export class LibroRepository implements ILibroRepository {
  async findAll(): Promise<Libro[]> {
    const libros = await LibroModel.findAll({ order: [['id', 'ASC']] });
    return libros.map(toLibro);
  }

  async findById(id: number): Promise<Libro | null> {
    const libro = await LibroModel.findByPk(id);
    return libro ? toLibro(libro) : null;
  }

  async create(data: NewLibroData): Promise<Libro> {
    return toLibro(await LibroModel.create(data));
  }

  async update(id: number, data: LibroUpdateData): Promise<Libro | null> {
    const libro = await LibroModel.findByPk(id);
    if (!libro) return null;
    return toLibro(await libro.update(data));
  }

  async updateStatus(id: number, status: LibroStatus): Promise<Libro | null> {
    const libro = await LibroModel.findByPk(id);
    if (!libro) return null;
    return toLibro(await libro.update({ status }));
  }

  async delete(id: number): Promise<boolean> {
    const deletedRows = await LibroModel.destroy({ where: { id } });
    return deletedRows > 0;
  }
}

function toLibro(model: LibroModel): Libro {
  return {
    id: model.id,
    title: model.title,
    author: model.author,
    description: model.description,
    status: model.status,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
  };
}
