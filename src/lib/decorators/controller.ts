/**
 * Socket.IO Controller Decorators
 * @SocketIOController - Class decorator for marking Socket.IO controllers
 * @SocketIOEvent - Method decorator for defining Socket.IO event handlers
 */

import {
  SOCKETIO_CONTROLLER_KEY,
  SOCKETIO_EVENT_KEY,
  setMetadata,
  getMetadata,
  MethodMetadataRegistry,
  type Constructor,
} from './metadata.js';

/**
 * Options for @SocketIOController decorator
 */
export interface SocketIOControllerOptions {
  /**
   * Socket.IO namespace
   * @default '/'
   * @example '/', '/admin', '/api'
   */
  namespace?: string;
  /**
   * Connection middleware to apply to this controller's namespace
   * Can be middleware class references or string names
   * @example [AuthMiddleware, LogMiddleware] or ['auth', 'log']
   */
  connectionMiddleware?: Array<Constructor | string>;
  /**
   * Packet middleware to apply to all events in this controller
   * Can be middleware class references or string names
   * @example [ValidationMiddleware] or ['validate']
   */
  packetMiddleware?: Array<Constructor | string>;
}

/**
 * Metadata stored by @SocketIOController
 */
export interface SocketIOControllerMetadata extends SocketIOControllerOptions {
  namespace: string; // Always has a value (default: '/')
}

/**
 * Options for @SocketIOEvent decorator
 */
export interface SocketIOEventOptions {
  /**
   * Event name (required)
   * @example 'chat', 'message', 'join'
   */
  event: string;
  /**
   * Packet middleware to apply to this specific event (optional)
   * These will be executed after controller-level packet middleware
   * @example ['validate']
   */
  packetMiddleware?: string[];
}

/**
 * Metadata stored by @SocketIOEvent
 */
export interface SocketIOEventMetadata extends SocketIOEventOptions {
  methodName: string; // The name of the decorated method
}

/**
 * Registry for storing event metadata by controller class
 */
export const EventMetadataRegistry = new MethodMetadataRegistry<SocketIOEventMetadata>();

/**
 * @SocketIOController - Class decorator for marking Socket.IO controllers
 *
 * Marks a class as a Socket.IO controller and configures its namespace and middleware.
 * Controllers will be automatically discovered and registered during application startup.
 *
 * @param options - Controller configuration options
 *
 * @example
 * ```typescript
 * @SocketIOController({
 *   namespace: '/',
 *   connectionMiddleware: ['auth'],
 *   packetMiddleware: ['log']
 * })
 * export default class ChatController {
 *   @SocketIOEvent({ event: 'message' })
 *   async handleMessage() {
 *     const msg = this.ctx.args[0];
 *     this.ctx.socket.emit('response', msg);
 *   }
 * }
 * ```
 */
export function SocketIOController(options?: SocketIOControllerOptions): ClassDecorator {
  return (<T extends Constructor>(target: T): T => {
    const metadata: SocketIOControllerMetadata = {
      namespace: options?.namespace || '/',
      connectionMiddleware: options?.connectionMiddleware,
      packetMiddleware: options?.packetMiddleware,
    };

    setMetadata(target, SOCKETIO_CONTROLLER_KEY, metadata);
    return target;
  }) as ClassDecorator;
}

/**
 * Get controller metadata from a class
 */
export function getSocketIOControllerMetadata(target: Constructor): SocketIOControllerMetadata | undefined {
  return getMetadata<SocketIOControllerMetadata>(target, SOCKETIO_CONTROLLER_KEY);
}

/**
 * Check if a class is decorated with @SocketIOController
 */
export function isSocketIOController(target: Constructor): boolean {
  return getSocketIOControllerMetadata(target) !== undefined;
}

/**
 * @SocketIOEvent - Method decorator for defining Socket.IO event handlers
 *
 * Marks a method as a Socket.IO event handler. The method will be automatically
 * registered to handle the specified event when the controller is loaded.
 *
 * The decorated method will have access to:
 * - `this.ctx.socket` - The Socket.IO socket instance
 * - `this.ctx.args` - The event arguments sent from client
 * - `this.app`, `this.ctx`, `this.service`, etc. - All Egg.js controller properties
 *
 * @param options - Event configuration options
 *
 * @example
 * ```typescript
 * @SocketIOController()
 * export default class ChatController {
 *   @SocketIOEvent({ event: 'chat' })
 *   async handleChat() {
 *     const message = this.ctx.args[0];
 *     this.ctx.socket.emit('res', `Message: ${message}`);
 *   }
 *
 *   @SocketIOEvent({
 *     event: 'private-message',
 *     packetMiddleware: ['validatePrivateMessage']
 *   })
 *   async handlePrivateMessage() {
 *     const { to, message } = this.ctx.args[0];
 *     this.ctx.socket.to(to).emit('private-message', message);
 *   }
 * }
 * ```
 */
export function SocketIOEvent(options: SocketIOEventOptions): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    if (!options.event) {
      throw new Error(`@SocketIOEvent requires an 'event' name. Used on method: ${String(propertyKey)}`);
    }

    const methodName = String(propertyKey);
    const metadata: SocketIOEventMetadata = {
      ...options,
      methodName,
    };

    // Store metadata on the method itself
    setMetadata(descriptor.value, SOCKETIO_EVENT_KEY, metadata);

    // Also register in the centralized registry for easier scanning
    const classConstructor = target.constructor as Constructor;
    EventMetadataRegistry.set(classConstructor, methodName, metadata);

    return descriptor;
  };
}

/**
 * Get event metadata from a method
 */
export function getSocketIOEventMetadata(method: object): SocketIOEventMetadata | undefined {
  return getMetadata<SocketIOEventMetadata>(method, SOCKETIO_EVENT_KEY);
}

/**
 * Get all event metadata from a controller class
 */
export function getAllSocketIOEvents(classConstructor: Constructor): Map<string, SocketIOEventMetadata> | undefined {
  return EventMetadataRegistry.getAll(classConstructor);
}

/**
 * Check if a method is decorated with @SocketIOEvent
 */
export function isSocketIOEvent(method: object): boolean {
  return getSocketIOEventMetadata(method) !== undefined;
}

