import type { Application } from 'egg';
import type { Socket } from 'socket.io';
import type { ComposedSocketIOMiddleware, ExtendedNamespace, SocketIOPacket } from './types.js';
import { CtxEventSymbol } from './types.js';
/**
 * Initialize packet middleware execution
 * This runs for each socket packet/message
 */
export declare function packetMiddlewareInit(app: Application, socket: Socket, packet: SocketIOPacket, next: (err?: Error) => void, packetMiddlewares: ComposedSocketIOMiddleware, nsp: ExtendedNamespace): void;
export { CtxEventSymbol };
