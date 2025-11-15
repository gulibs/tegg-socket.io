import type { Context } from 'egg';
import type { Socket, Namespace } from 'socket.io';
import type { Middleware as KoaMiddleware } from 'koa-compose';
import type { ComposedMiddleware } from 'koa-compose';

/**
 * Router configuration symbol
 */
export const RouterConfigSymbol: unique symbol = Symbol.for('TEGG-SOCKET.IO#ROUTERCONFIG');

/**
 * Context event symbol
 */
export const CtxEventSymbol: unique symbol = Symbol.for('TEGG-SOCKET.IO#CTX-EVENT');

/**
 * Socket.IO packet type
 * A packet is an array where:
 * - packet[0] is the event name (string)
 * - packet[1..n] are the event arguments
 * - packet[last] is the context (added by packet middleware)
 */
export type SocketIOPacket = [string, ...unknown[]];

/**
 * Route handler function type
 * Handlers receive event arguments and context
 */
export type RouteHandler = (this: Context, ...args: unknown[]) => unknown | Promise<unknown>;

/**
 * Middleware function type for Socket.IO
 * Can be a function, class, or object
 */
export type SocketIOMiddleware = KoaMiddleware<Context> | (new () => KoaMiddleware<Context>) | Record<string, unknown>;

/**
 * Composed middleware type for Socket.IO
 */
export type ComposedSocketIOMiddleware = ComposedMiddleware<Context>;

/**
 * Extended Socket.IO Namespace with router configuration
 */
export interface ExtendedNamespace extends Namespace {
    [RouterConfigSymbol]?: Map<string, RouteHandler>;
}

/**
 * Extended Socket.IO Socket with request property
 * Note: We don't actually extend Socket to avoid type conflicts
 * This is just a type helper
 */
export type ExtendedSocket = Socket & {
    request: ExtendedIncomingMessage;
};

/**
 * Extended HTTP IncomingMessage with socket property
 * Socket.IO's socket.request is compatible with Node.js IncomingMessage
 * We extend it to add socket and args properties
 */
export interface ExtendedIncomingMessage {
    socket?: Socket;
    args?: unknown[];
    [key: string]: unknown;
}

/**
 * Extended Context with Socket.IO specific properties
 */
export interface SocketIOContext extends Context {
    socket: Socket;
    args?: unknown[];
    packet?: SocketIOPacket;
    [CtxEventSymbol]?: NodeJS.EventEmitter;
    req: ExtendedIncomingMessage & Context['req'];
}

/**
 * Loaded middleware map
 */
export interface LoadedMiddleware {
    [key: string]: SocketIOMiddleware;
}

/**
 * Loaded controller map
 */
export interface LoadedController {
    [key: string]: RouteHandler | { [method: string]: RouteHandler };
}

/**
 * Session middleware type
 * Can be any middleware function compatible with Egg Context
 */
export type SessionMiddleware = SocketIOMiddleware & { _name?: string };