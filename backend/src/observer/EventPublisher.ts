import type { IObserver } from './IObserver';
import type { ISubject } from './ISubject';

/**
 * Implementación propia del Subject (sin EventEmitter de Node).
 *
 * LibroService lo recibe por constructor y llama a notify() cuando un libro
 * cambia de estado. Los observers se registran desde main.ts con attach().
 */
export class EventPublisher<TEvent> implements ISubject<TEvent> {
  private readonly observers: IObserver<TEvent>[] = [];

  attach(observer: IObserver<TEvent>): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  detach(observer: IObserver<TEvent>): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * Avisa a cada observer, uno por uno. Si uno falla, se registra el error y
   * se sigue con los demás: el estado del libro ya cambió y un observer roto
   * no debe impedir que los otros se enteren.
   */
  async notify(event: TEvent): Promise<void> {
    for (const observer of [...this.observers]) {
      try {
        await observer.update(event);
      } catch (error: unknown) {
        console.error('[OBSERVER] Un observer falló al procesar el evento:', error);
      }
    }
  }
}
