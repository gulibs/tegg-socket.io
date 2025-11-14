import type { Application } from 'egg';
import type { Socket } from 'socket.io';
import type { ComposedSocketIOMiddleware } from './types.js';
/**
 * Initialize connection middleware execution
 * This runs when a socket connects to a namespace
 */
export declare function connectionMiddlewareInit(app: Application, socket: Socket, next: (err?: Error) => void, connectionMiddlewares: ComposedSocketIOMiddleware): void;
