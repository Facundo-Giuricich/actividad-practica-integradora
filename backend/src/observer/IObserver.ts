/**
 * Patrón Observer — el que ESCUCHA.
 *
 * Cualquier objeto que quiera enterarse de un evento implementa update().
 * Es genérico: TEvent es el tipo de evento que recibe (en este proyecto,
 * LibroStatusChangedEvent).
 */
export interface IObserver<TEvent> {
  update(event: TEvent): Promise<void>;
}
