/**
 * Socket.IO Middleware Decorators
 * @ConnectionMiddleware - Class decorator for connection-level middleware
 * @PacketMiddleware - Class decorator for packet-level middleware
 */

import {
  SOCKETIO_CONNECTION_MIDDLEWARE_KEY,
  SOCKETIO_PACKET_MIDDLEWARE_KEY,
  setMetadata,
  getMetadata,
  type Constructor,
} from './metadata.js';

/**
 * Options for @ConnectionMiddleware decorator
 */
export interface ConnectionMiddlewareOptions {
  /**
   * Middleware execution priority (lower numbers execute first)
   * @default 100
   */
  priority?: number;
}

/**
 * Metadata stored by @ConnectionMiddleware
 */
export interface ConnectionMiddlewareMetadata extends ConnectionMiddlewareOptions {
  priority: number; // Always has a value
  className: string; // Class name for identification
}

/**
 * Options for @PacketMiddleware decorator
 */
export interface PacketMiddlewareOptions {
  /**
   * Middleware execution priority (lower numbers execute first)
   * @default 100
   */
  priority?: number;
}

/**
 * Metadata stored by @PacketMiddleware
 */
export interface PacketMiddlewareMetadata extends PacketMiddlewareOptions {
  priority: number; // Always has a value
  className: string; // Class name for identification
}

/**
 * @ConnectionMiddleware - Class decorator for connection-level middleware
 *
 * Marks a class as Socket.IO connection middleware. Connection middleware is executed
 * when a socket establishes a connection to the server.
 *
 * The middleware class must implement a `use` method with signature:
 * `async use(ctx: Context, next: () => Promise<void>): Promise<void>`
 *
 * Code before `await next()` executes on connection.
 * Code after `await next()` executes on disconnection.
 *
 * @param options - Middleware configuration options
 *
 * @example
 * ```typescript
 * @ConnectionMiddleware({ priority: 10 })
 * export class AuthMiddleware {
 *   async use(ctx: Context, next: () => Promise<void>) {
 *     const token = ctx.socket.handshake.query.token;
 *     if (!token) {
 *       ctx.socket.emit('error', 'Authentication required');
 *       ctx.socket.disconnect();
 *       return;
 *     }
 *     // Verify token and set user
 *     ctx.state.user = await verifyToken(token);
 *     await next();
 *     // Cleanup on disconnect
 *     ctx.logger.info('User disconnected:', ctx.state.user.id);
 *   }
 * }
 * ```
 */
export function ConnectionMiddleware(options?: ConnectionMiddlewareOptions): ClassDecorator {
  return (<T extends Constructor>(target: T): T => {
    const metadata: ConnectionMiddlewareMetadata = {
      priority: options?.priority ?? 100,
      className: target.name,
    };

    setMetadata(target, SOCKETIO_CONNECTION_MIDDLEWARE_KEY, metadata);
    return target;
  }) as ClassDecorator;
}

/**
 * Get connection middleware metadata from a class
 */
export function getConnectionMiddlewareMetadata(target: Constructor): ConnectionMiddlewareMetadata | undefined {
  return getMetadata<ConnectionMiddlewareMetadata>(target, SOCKETIO_CONNECTION_MIDDLEWARE_KEY);
}

/**
 * Check if a class is decorated with @ConnectionMiddleware
 */
export function isConnectionMiddleware(target: Constructor): boolean {
  return getConnectionMiddlewareMetadata(target) !== undefined;
}

/**
 * @PacketMiddleware - Class decorator for packet-level middleware
 *
 * Marks a class as Socket.IO packet middleware. Packet middleware is executed
 * for each packet (event) sent by the client.
 *
 * The middleware class must implement a `use` method with signature:
 * `async use(ctx: Context, next: () => Promise<void>): Promise<void>`
 *
 * The middleware has access to `ctx.packet` which contains the packet data.
 *
 * @param options - Middleware configuration options
 *
 * @example
 * ```typescript
 * @PacketMiddleware({ priority: 50 })
 * export class LogMiddleware {
 *   async use(ctx: Context, next: () => Promise<void>) {
 *     const start = Date.now();
 *     ctx.logger.info('Packet received:', ctx.packet);
 *     await next();
 *     const duration = Date.now() - start;
 *     ctx.logger.info('Packet processed in', duration, 'ms');
 *   }
 * }
 * ```
 *
 * @example Packet filtering
 * ```typescript
 * @PacketMiddleware()
 * export class FilterMiddleware {
 *   async use(ctx: Context, next: () => Promise<void>) {
 *     const [event, data] = ctx.packet || [];
 *     if (event === 'spam') {
 *       ctx.logger.warn('Filtered spam packet');
 *       return; // Don't call next() to block the packet
 *     }
 *     await next();
 *   }
 * }
 * ```
 */
export function PacketMiddleware(options?: PacketMiddlewareOptions): ClassDecorator {
  return (<T extends Constructor>(target: T): T => {
    const metadata: PacketMiddlewareMetadata = {
      priority: options?.priority ?? 100,
      className: target.name,
    };

    setMetadata(target, SOCKETIO_PACKET_MIDDLEWARE_KEY, metadata);
    return target;
  }) as ClassDecorator;
}

/**
 * Get packet middleware metadata from a class
 */
export function getPacketMiddlewareMetadata(target: Constructor): PacketMiddlewareMetadata | undefined {
  return getMetadata<PacketMiddlewareMetadata>(target, SOCKETIO_PACKET_MIDDLEWARE_KEY);
}

/**
 * Check if a class is decorated with @PacketMiddleware
 */
export function isPacketMiddleware(target: Constructor): boolean {
  return getPacketMiddlewareMetadata(target) !== undefined;
}

/**
 * Validate middleware class has required `use` method
 */
export function validateMiddlewareClass(middlewareClass: any, type: 'connection' | 'packet'): void {
  if (!middlewareClass || typeof middlewareClass !== 'function') {
    throw new Error(`${type} middleware must be a class`);
  }

  // Check if prototype has use method
  if (typeof middlewareClass.prototype?.use !== 'function') {
    throw new Error(
      `${type} middleware class "${middlewareClass.name}" must have a "use" method. ` +
      'Expected signature: async use(ctx: Context, next: () => Promise<void>): Promise<void>',
    );
  }
}

