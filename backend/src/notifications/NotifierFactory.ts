import type { INotificationWriter } from '../repositories/interfaces/INotificationRepository';
import { ConsoleNotifierAdapter } from './ConsoleNotifierAdapter';
import { InAppNotifier } from './InAppNotifier';
import type { INotifier } from './INotifier';

/** Canales disponibles. Para sumar uno: agregarlo acá, crear su clase y su case. */
export const NOTIFIER_CHANNELS = ['inapp', 'console'] as const;
export type NotifierChannel = (typeof NOTIFIER_CHANNELS)[number];

/**
 * Patrón Factory.
 *
 * Recibe el tipo de canal y devuelve el INotifier correspondiente. Es el ÚNICO
 * lugar donde se hace `new` de un canal: quien lo usa (NotificationService)
 * pide un canal por nombre y recibe "algo que cumple INotifier", sin conocer
 * la clase concreta ni sus dependencias (InAppNotifier necesita la base;
 * la consola no).
 */
export class NotifierFactory {
  constructor(private readonly notificationWriter: INotificationWriter) {}

  create(channel: NotifierChannel): INotifier {
    switch (channel) {
      case 'inapp':
        return new InAppNotifier(this.notificationWriter);
      case 'console':
        return new ConsoleNotifierAdapter();
      default: {
        // Si se agrega un canal al tipo y se olvida su case, esto no compila.
        const unknownChannel: never = channel;
        throw new Error(`Canal de notificación desconocido: ${String(unknownChannel)}`);
      }
    }
  }
}
