import type { Notification } from '../types/notification';
import type { INotifier } from './INotifier';

/**
 * Patrón Adapter.
 *
 * La aplicación espera que todo canal cumpla INotifier:
 *   send(notification: Notification): Promise<void>   ← recibe un OBJETO y devuelve una promesa
 * Pero console.log tiene otra forma:
 *   console.log(texto: string): void                 ← recibe TEXTO y no devuelve nada
 *
 * Este adapter hace de intermediario: implementa INotifier hacia afuera y,
 * por dentro, transforma la Notification en una línea legible y se la pasa a
 * console.log. NotificationService nunca llama a console.log directamente.
 */
export class ConsoleNotifierAdapter implements INotifier {
  send(notification: Notification): Promise<void> {
    const line =
      `[NOTIFICACIÓN] Para: ${notification.recipientEmail}` +
      ` | Libro #${notification.libroId}` +
      ` | Estado: ${notification.previousStatus} → ${notification.newStatus}`;

    console.log(line);
    return Promise.resolve();
  }
}
