import type { IObserver } from './IObserver';

/**
 * Patrón Observer — el que AVISA (Subject).
 *
 * Mantiene una lista de observers y les avisa cuando ocurre un evento.
 * El Subject no sabe qué hace cada observer: solo sabe que tienen update().
 */
export interface ISubject<TEvent> {
  attach(observer: IObserver<TEvent>): void;
  detach(observer: IObserver<TEvent>): void;
  notify(event: TEvent): Promise<void>;
}
