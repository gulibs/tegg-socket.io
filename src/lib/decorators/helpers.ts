/**
 * Socket.IO Helper Decorators
 * @Room - Method decorator for automatic room management
 * @Broadcast - Method decorator for automatic message broadcasting
 * @Subscribe - Method decorator for subscribing to Socket.IO system events
 */

import type { Context } from 'egg';
import {
  SOCKETIO_ROOM_KEY,
  SOCKETIO_BROADCAST_KEY,
  SOCKETIO_SUBSCRIBE_KEY,
  setMetadata,
  getMetadata,
  MethodMetadataRegistry,
  type Constructor,
} from './metadata.js';

/**
 * Room name can be static string or dynamic function
 */
export type RoomNameResolver = string | ((ctx: Context) => string | Promise<string>);

/**
 * Options for @Room decorator
 */
export interface RoomOptions {
  /**
   * Room name or function to determine room name at runtime
   * @example 'lobby'
   * @example (ctx) => ctx.args[0].roomId
   */
  name: RoomNameResolver;
  /**
   * Whether to automatically leave the room after method execution
   * @default false
   */
  autoLeave?: boolean;
}

/**
 * Metadata stored by @Room decorator
 */
export interface RoomMetadata extends RoomOptions {
  methodName: string;
}

/**
 * Broadcast target can be static string/array or dynamic function
 */
export type BroadcastTargetResolver = (ctx: Context) => string | string[] | Promise<string | string[]>;

/**
 * Options for @Broadcast decorator
 */
export interface BroadcastOptions {
  /**
   * Target room(s) or namespace to broadcast to
   * @example 'lobby'
   * @example ['room1', 'room2']
   * @example ctx => ctx.args[0]
   */
  to?: string | string[] | BroadcastTargetResolver;
  /**
   * Custom event name for broadcast (defaults to original event name)
   * @example 'newMessage'
   */
  event?: string;
  /**
   * Whether to include the sender in the broadcast
   * @default false
   */
  includeSelf?: boolean;
}

/**
 * Metadata stored by @Broadcast decorator
 */
export interface BroadcastMetadata extends BroadcastOptions {
  methodName: string;
}

/**
 * System events that can be subscribed to
 */
export type SocketIOSystemEvent = 'connect' | 'disconnect' | 'disconnecting' | 'error';

/**
 * Options for @Subscribe decorator
 */
export interface SubscribeOptions {
  /**
   * System event name to subscribe to
   * @example 'disconnect'
   * @example 'error'
   */
  event: SocketIOSystemEvent;
}

/**
 * Metadata stored by @Subscribe decorator
 */
export interface SubscribeMetadata extends SubscribeOptions {
  methodName: string;
}

/**
 * Registries for helper decorators
 */
export const RoomMetadataRegistry = new MethodMetadataRegistry<RoomMetadata>();
export const BroadcastMetadataRegistry = new MethodMetadataRegistry<BroadcastMetadata>();
export const SubscribeMetadataRegistry = new MethodMetadataRegistry<SubscribeMetadata>();

/**
 * @Room - Method decorator for automatic room management
 *
 * Automatically joins a socket to a room before method execution.
 * Optionally leaves the room after method execution completes.
 *
 * @param nameOrOptions - Room name (string) or RoomOptions object
 *
 * @example Static room name
 * ```typescript
 * @SocketIOController()
 * export default class RoomController {
 *   @SocketIOEvent({ event: 'joinLobby' })
 *   @Room({ name: 'lobby' })
 *   async joinLobby() {
 *     this.ctx.socket.emit('joined', 'Welcome to lobby');
 *   }
 * }
 * ```
 *
 * @example Dynamic room name
 * ```typescript
 * @SocketIOEvent({ event: 'joinRoom' })
 * @Room({ name: (ctx) => ctx.args[0].roomId })
 * async joinRoom() {
 *   const roomId = this.ctx.args[0].roomId;
 *   this.ctx.socket.emit('joined', `Welcome to room ${roomId}`);
 * }
 * ```
 *
 * @example Auto-leave room
 * ```typescript
 * @SocketIOEvent({ event: 'quickVisit' })
 * @Room({ name: 'temporary', autoLeave: true })
 * async quickVisit() {
 *   // Socket joins 'temporary' room
 *   this.ctx.socket.emit('visiting', 'Quick visit');
 *   // Socket automatically leaves 'temporary' room after this method
 * }
 * ```
 */
export function Room(nameOrOptions: string | RoomOptions): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const methodName = String(propertyKey);

    // Normalize options
    const options: RoomOptions = typeof nameOrOptions === 'string'
      ? { name: nameOrOptions }
      : nameOrOptions;

    if (!options.name) {
      throw new Error(`@Room requires a 'name'. Used on method: ${methodName}`);
    }

    const metadata: RoomMetadata = {
      ...options,
      methodName,
    };

    // Store metadata
    setMetadata(descriptor.value, SOCKETIO_ROOM_KEY, metadata);
    RoomMetadataRegistry.set(target.constructor as Constructor, methodName, metadata);

    return descriptor;
  };
}

/**
 * Get room metadata from a method
 */
export function getRoomMetadata(method: object): RoomMetadata | undefined {
  return getMetadata<RoomMetadata>(method, SOCKETIO_ROOM_KEY);
}

/**
 * Get all room metadata from a controller class
 */
export function getAllRoomMetadata(classConstructor: Constructor): Map<string, RoomMetadata> | undefined {
  return RoomMetadataRegistry.getAll(classConstructor);
}

/**
 * @Broadcast - Method decorator for automatic message broadcasting
 *
 * Automatically broadcasts the method's return value to specified rooms or namespace.
 * The broadcast occurs after the method execution completes.
 *
 * @param options - Broadcast configuration options
 *
 * @example Broadcast to specific room
 * ```typescript
 * @SocketIOController()
 * export default class ChatController {
 *   @SocketIOEvent({ event: 'sendMessage' })
 *   @Broadcast({ to: 'lobby' })
 *   async sendMessage() {
 *     const message = this.ctx.args[0];
 *     return { text: message, from: this.ctx.socket.id };
 *   }
 * }
 * ```
 *
 * @example Broadcast to multiple rooms
 * ```typescript
 * @SocketIOEvent({ event: 'announce' })
 * @Broadcast({ to: ['room1', 'room2'] })
 * async announce() {
 *   return { type: 'announcement', text: 'Hello everyone!' };
 * }
 * ```
 *
 * @example Custom broadcast event name
 * ```typescript
 * @SocketIOEvent({ event: 'createPost' })
 * @Broadcast({ to: 'feed', event: 'newPost' })
 * async createPost() {
 *   const post = this.ctx.args[0];
 *   return { id: Date.now(), ...post };
 * }
 * ```
 *
 * @example Include sender in broadcast
 * ```typescript
 * @SocketIOEvent({ event: 'groupMessage' })
 * @Broadcast({ to: 'group', includeSelf: true })
 * async groupMessage() {
 *   return { text: this.ctx.args[0], from: 'me' };
 * }
 * ```
 */
export function Broadcast(options: BroadcastOptions): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const methodName = String(propertyKey);

    const metadata: BroadcastMetadata = {
      ...options,
      methodName,
    };

    // Store metadata
    setMetadata(descriptor.value, SOCKETIO_BROADCAST_KEY, metadata);
    BroadcastMetadataRegistry.set(target.constructor as Constructor, methodName, metadata);

    return descriptor;
  };
}

/**
 * Get broadcast metadata from a method
 */
export function getBroadcastMetadata(method: object): BroadcastMetadata | undefined {
  return getMetadata<BroadcastMetadata>(method, SOCKETIO_BROADCAST_KEY);
}

/**
 * Get all broadcast metadata from a controller class
 */
export function getAllBroadcastMetadata(classConstructor: Constructor): Map<string, BroadcastMetadata> | undefined {
  return BroadcastMetadataRegistry.getAll(classConstructor);
}

/**
 * @Subscribe - Method decorator for subscribing to Socket.IO system events
 *
 * Marks a method to be invoked when a Socket.IO system event occurs.
 * System events include: connect, disconnect, disconnecting, error
 *
 * @param eventOrOptions - Event name (string) or SubscribeOptions object
 *
 * @example Subscribe to disconnect event
 * ```typescript
 * @SocketIOController()
 * export default class ChatController {
 *   @Subscribe({ event: 'disconnect' })
 *   async onDisconnect() {
 *     this.app.logger.info('User disconnected:', this.ctx.socket.id);
 *     // Clean up user data
 *     await this.service.user.markOffline(this.ctx.state.user.id);
 *   }
 * }
 * ```
 *
 * @example Subscribe to error event
 * ```typescript
 * @Subscribe({ event: 'error' })
 * async onError() {
 *   const error = this.ctx.args[0];
 *   this.app.logger.error('Socket error:', error);
 * }
 * ```
 *
 * @example Multiple subscriptions
 * ```typescript
 * @Subscribe({ event: 'disconnect' })
 * async handleDisconnect() {
 *   // Handle disconnect
 * }
 *
 * @Subscribe({ event: 'disconnecting' })
 * async handleDisconnecting() {
 *   // Handle disconnecting (before disconnect)
 * }
 * ```
 */
export function Subscribe(eventOrOptions: SocketIOSystemEvent | SubscribeOptions): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const methodName = String(propertyKey);

    // Normalize options
    const options: SubscribeOptions = typeof eventOrOptions === 'string'
      ? { event: eventOrOptions }
      : eventOrOptions;

    if (!options.event) {
      throw new Error(`@Subscribe requires an 'event'. Used on method: ${methodName}`);
    }

    const metadata: SubscribeMetadata = {
      ...options,
      methodName,
    };

    // Store metadata
    setMetadata(descriptor.value, SOCKETIO_SUBSCRIBE_KEY, metadata);
    SubscribeMetadataRegistry.set(target.constructor as Constructor, methodName, metadata);

    return descriptor;
  };
}

/**
 * Get subscribe metadata from a method
 */
export function getSubscribeMetadata(method: object): SubscribeMetadata | undefined {
  return getMetadata<SubscribeMetadata>(method, SOCKETIO_SUBSCRIBE_KEY);
}

/**
 * Get all subscribe metadata from a controller class
 */
export function getAllSubscribeMetadata(classConstructor: Constructor): Map<string, SubscribeMetadata> | undefined {
  return SubscribeMetadataRegistry.getAll(classConstructor);
}

