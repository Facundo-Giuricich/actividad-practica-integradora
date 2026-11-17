import type { Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import type { LibroService } from '../services/LibroService';
import {
  DEFAULT_LIBRO_STATUS,
  LIBRO_STATUSES,
  isLibroStatus,
  type LibroStatus,
  type LibroUpdateData,
} from '../types/libro';
import { asObject, parseId, readString, type JsonObject } from '../utils/validators';

export class LibroController {
  constructor(private readonly libroService: LibroService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.libroService.list());
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.libroService.getById(parseId(req.params.id)));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const body = asObject(req.body);
    const status = body.status === undefined ? DEFAULT_LIBRO_STATUS : readStatus(body);
    const libro = await this.libroService.create({ ...readLibroFields(body), status });
    res.status(201).json(libro);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const id = parseId(req.params.id);
    const body = asObject(req.body);
    if (body.status !== undefined) {
      // El estado tiene su propio permiso y su propio endpoint (dispara notificaciones).
      throw new AppError('VALIDATION', 'El estado no se edita acá: usá PATCH /api/libros/:id/status');
    }
    res.json(await this.libroService.update(id, readLibroFields(body)));
  };

  changeStatus = async (req: Request, res: Response): Promise<void> => {
    const id = parseId(req.params.id);
    const result = await this.libroService.changeStatus(id, readStatus(asObject(req.body)));
    res.json(result);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.libroService.delete(parseId(req.params.id));
    res.status(204).end();
  };
}

function readLibroFields(body: JsonObject): LibroUpdateData {
  return {
    title: readString(body, 'title', { maxLength: 200 }),
    author: readString(body, 'author', { maxLength: 200 }),
    description: readString(body, 'description', { maxLength: 2000 }),
  };
}

function readStatus(body: JsonObject): LibroStatus {
  const status = readString(body, 'status');
  if (!isLibroStatus(status)) {
    throw new AppError('VALIDATION', `Estado inválido. Valores posibles: ${LIBRO_STATUSES.join(', ')}`);
  }
  return status;
}
