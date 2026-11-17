# Patrones de diseño y principios SOLID

Los cuatro patrones participan de un mismo flujo: el cambio de estado de un libro.

```
LibroService.changeStatus()
 └─> EventPublisher.notify(evento)                 ← Observer (Subject)
      └─> NotificationService.update(evento)       ← Observer (Observer)
           ├─ SubscriptionRepository: suscriptores ← modelos sobre DatabaseConnection (Singleton)
           └─ canales creados con NotifierFactory  ← Factory
                ├─ InAppNotifier                    (guarda en la base)
                └─ ConsoleNotifierAdapter           ← Adapter
                     └─ console.log
```

---

## Patrones de diseño

### Singleton — `DatabaseConnection`

**Archivos:**
- `backend/src/database/DatabaseConnection.ts`
- Se obtiene en `backend/src/main.ts` con `DatabaseConnection.getInstance()`.

**Problema que resuelve:** `new Sequelize(...)` abre un pool de conexiones a PostgreSQL. Si cada
parte de la aplicación creara el suyo, habría varios pools compitiendo por la base, y los modelos
quedarían registrados sobre conexiones distintas. El Singleton garantiza una única instancia
compartida por toda la aplicación.

```ts
export class DatabaseConnection {
  private static instance: DatabaseConnection | null = null;
  private readonly sequelize: Sequelize;

  private constructor() {
    this.sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, { /* ... */ });
  }

  static getInstance(): DatabaseConnection {
    if (DatabaseConnection.instance === null) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }
}
```

### Observer — `ISubject`, `IObserver`, `EventPublisher`, `NotificationService`

**Archivos:**
- `backend/src/observer/ISubject.ts`: interfaz del Subject (`attach`, `detach`, `notify`).
- `backend/src/observer/IObserver.ts`: interfaz del Observer (`update`).
- `backend/src/observer/EventPublisher.ts`: Subject, implementación propia sin `EventEmitter`.
- `backend/src/services/NotificationService.ts`: Observer.
- `backend/src/services/LibroService.ts`: recibe el Subject por constructor y llama a `notify`.
- `backend/src/main.ts`: registro del observer con `attach`.

**Problema que resuelve:** cuando un libro cambia de estado hay que notificar a los suscriptores,
pero `LibroService` no debería conocer ni depender de las notificaciones. Con el Observer,
`LibroService` solo avisa "cambió el estado" al `EventPublisher`, que reenvía el evento a todos los
observers registrados. Se pueden agregar nuevas reacciones sin modificar `LibroService`.

> Observers ≠ suscripciones. Los observers son objetos del backend que reaccionan al evento. Las
> suscripciones son datos persistidos (tabla `subscriptions`) que indican qué usuario sigue qué
> libro. `NotificationService` (observer) consulta las suscripciones para saber a quién notificar.

```ts
// backend/src/observer/EventPublisher.ts
export class EventPublisher<TEvent> implements ISubject<TEvent> {
  private readonly observers: IObserver<TEvent>[] = [];

  attach(observer: IObserver<TEvent>): void {
    if (!this.observers.includes(observer)) this.observers.push(observer);
  }

  detach(observer: IObserver<TEvent>): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) this.observers.splice(index, 1);
  }

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

// backend/src/main.ts
const libroEvents = new EventPublisher<LibroStatusChangedEvent>();
libroEvents.attach(notificationService);
const libroService = new LibroService(libroRepository, libroEvents);

// backend/src/services/LibroService.ts — dentro de changeStatus()
await this.events.notify({ libroId: libro.id, libroTitle: libro.title,
  previousStatus: current.status, newStatus: libro.status, changedAt: libro.updatedAt });
```

### Factory — `NotifierFactory`

**Archivos:**
- `backend/src/notifications/NotifierFactory.ts`: la fábrica.
- `backend/src/notifications/INotifier.ts`: lo que devuelve.
- `backend/src/services/NotificationService.ts`: quien la usa.

**Problema que resuelve:** cada canal de notificación se construye distinto (`InAppNotifier`
necesita el repositorio de notificaciones; la consola no necesita nada) y `NotificationService` no
debe conocer esas clases concretas ni hacer `new` de ellas. La Factory concentra la creación:
recibe el tipo de canal y devuelve "algo que cumple `INotifier`".

```ts
export class NotifierFactory {
  constructor(private readonly notificationWriter: INotificationWriter) {}

  create(channel: NotifierChannel): INotifier {
    switch (channel) {
      case 'inapp':
        return new InAppNotifier(this.notificationWriter);
      case 'console':
        return new ConsoleNotifierAdapter();
      default: {
        const unknownChannel: never = channel; // si falta un case, no compila
        throw new Error(`Canal de notificación desconocido: ${String(unknownChannel)}`);
      }
    }
  }
}

// backend/src/services/NotificationService.ts — no hay ningún `new` de canales
this.notifiers = channels.map((channel) => notifierFactory.create(channel));
```

### Adapter — `ConsoleNotifierAdapter`

**Archivos:**
- `backend/src/notifications/ConsoleNotifierAdapter.ts`
- Implementa `backend/src/notifications/INotifier.ts`.

**Problema que resuelve:** la aplicación espera que todo canal cumpla `INotifier`: recibe un objeto
`Notification` y devuelve una promesa. `console.log`, en cambio, recibe texto y no devuelve nada.
El Adapter hace de intermediario: hacia afuera es un `INotifier`, y por dentro transforma el objeto
en una línea legible y se la pasa a `console.log`. Así `NotificationService` nunca llama a
`console.log` directamente.

```ts
export class ConsoleNotifierAdapter implements INotifier {
  send(notification: Notification): Promise<void> {
    const line =
      `[NOTIFICACIÓN] Para: ${notification.recipientEmail}` +
      ` | Libro #${notification.libroId}` +
      ` | Estado: ${notification.previousStatus} → ${notification.newStatus}`;

    console.log(line);          // el "adaptado": recibe texto, no devuelve nada
    return Promise.resolve();   // cumple el contrato de INotifier
  }
}
```

Salida real en `docker compose logs backend`:

```
[NOTIFICACIÓN] Para: usuario@tp.com | Libro #1 | Estado: DISPONIBLE → PRESTADO
```

---

## Principios SOLID

### S — Responsabilidad única

**Archivos:**
- Las capas de `backend/src/routes/`, `backend/src/controllers/`, `backend/src/services/` y
  `backend/src/repositories/`, por ejemplo `LibroController.ts`, `LibroService.ts` y
  `LibroRepository.ts`.
- `backend/src/middlewares/authenticate.ts` y `backend/src/middlewares/authorize.ts`.

**Problema que resuelve:** cada clase tiene un único motivo para cambiar. El controller cambia si
cambia el formato HTTP, el service si cambia una regla de negocio, y el repositorio si cambia la
forma de acceder a la base. Autenticar (¿quién sos?) y autorizar (¿qué podés hacer?) también están
separados en dos middlewares.

```ts
// Controller: solo lee y valida la request, y responde. Sin lógica de negocio.
changeStatus = async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  const result = await this.libroService.changeStatus(id, readStatus(asObject(req.body)));
  res.json(result);
};

// Service: solo la regla de negocio. No conoce Express (ni req ni res).
async changeStatus(id: number, newStatus: LibroStatus): Promise<LibroStatusChange> {
  const current = await this.getById(id);
  if (current.status === newStatus) throw new AppError('VALIDATION', `El libro ya está en estado ${newStatus}`);
  // ...
}
```

### O — Abierto/cerrado

**Archivos:**
- `backend/src/services/NotificationService.ts`
- `backend/src/notifications/NotifierFactory.ts`
- `backend/src/main.ts` (lista `NOTIFICATION_CHANNELS`)

**Problema que resuelve:** agregar un canal de notificación nuevo (por ejemplo, email) no requiere
modificar `NotificationService`. Se crea una clase que implemente `INotifier`, se agrega su `case`
en la Factory y su nombre en la lista de canales de `main.ts`. `NotificationService` queda cerrado
a modificaciones y abierto a extensión.

```ts
// backend/src/main.ts — el único lugar que decide qué canales se usan
const NOTIFICATION_CHANNELS: readonly NotifierChannel[] = ['inapp', 'console'];

// backend/src/services/NotificationService.ts — recorre los canales sin saber cuáles son
for (const notifier of this.notifiers) {
  await notifier.send(notification);
}
```

### L — Sustitución de Liskov

**Archivos:**
- `backend/src/notifications/InAppNotifier.ts`
- `backend/src/notifications/ConsoleNotifierAdapter.ts`
- Los dos implementan `backend/src/notifications/INotifier.ts`.

**Problema que resuelve:** cualquier `INotifier` puede reemplazar a otro sin que el código que lo
usa se entere ni se rompa. `NotificationService` trata igual al canal que guarda en la base y al que
escribe en consola: los dos reciben la misma `Notification` y devuelven una promesa.

```ts
export interface INotifier {
  send(notification: Notification): Promise<void>;
}

export class InAppNotifier implements INotifier { /* guarda en la tabla notifications */ }
export class ConsoleNotifierAdapter implements INotifier { /* escribe una línea con console.log */ }
```

### I — Segregación de interfaces

**Archivos:**
- `backend/src/repositories/interfaces/ISubscriptionRepository.ts` (`ISubscriberLookup`)
- `backend/src/repositories/interfaces/INotificationRepository.ts` (`INotificationWriter`)
- `backend/src/repositories/interfaces/IRoleRepository.ts`

**Problema que resuelve:** ningún cliente depende de métodos que no usa. `NotificationService`
solo necesita saber quién sigue un libro, así que depende de `ISubscriberLookup` (un único método)
y no del repositorio completo. `InAppNotifier` solo necesita guardar, así que depende de
`INotificationWriter` y no puede leer ni marcar la bandeja de nadie. `IRoleRepository` tiene solo
dos métodos de lectura, porque no hay ABM de roles.

```ts
export interface ISubscriberLookup {
  findSubscribersByLibro(libroId: number): Promise<Subscriber[]>;
}

export interface ISubscriptionRepository extends ISubscriberLookup {
  create(userId: number, libroId: number): Promise<Subscription | null>;
  delete(userId: number, libroId: number): Promise<boolean>;
  findByUser(userId: number): Promise<UserSubscription[]>;
}

// NotificationService pide solo lo que usa:
constructor(private readonly subscribers: ISubscriberLookup, /* ... */) {}
```

### D — Inversión de dependencias

**Archivos:**
- `backend/src/services/AuthService.ts`, `UserService.ts`, `LibroService.ts`,
  `SubscriptionService.ts` y `NotificationService.ts`, que dependen de interfaces.
- `backend/src/repositories/interfaces/*.ts`, las abstracciones.
- `backend/src/main.ts`, el composition root donde se eligen las implementaciones.

**Problema que resuelve:** los services (lógica de alto nivel) no dependen de las implementaciones
concretas con Sequelize, JWT o `EventPublisher`, sino de interfaces. Las clases concretas se crean
en un único lugar, `main.ts`, y se pasan por constructor. Cambiar de base de datos, o usar un
repositorio falso para probar, no requiere tocar los services.

```ts
// backend/src/services/LibroService.ts — solo conoce abstracciones
export class LibroService {
  constructor(
    private readonly libros: ILibroRepository,
    private readonly events: ISubject<LibroStatusChangedEvent>,
  ) {}
}

// backend/src/main.ts — el único lugar que conoce las clases concretas
const libroRepository = new LibroRepository();
const libroEvents = new EventPublisher<LibroStatusChangedEvent>();
const libroService = new LibroService(libroRepository, libroEvents);
```
