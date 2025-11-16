import http from 'node:http';
import { EventEmitter } from 'node:events';
import type { Application, Context } from 'egg';
import type { Socket } from 'socket.io';
import type { IncomingMessage as HttpIncomingMessage } from 'node:http';
import type { ComposedSocketIOMiddleware, ExtendedNamespace, SocketIOContext, SocketIOPacket, ExtendedIncomingMessage } from '../types.js';
import { delegateSocket } from './util.js';
import { RouterConfigSymbol, CtxEventSymbol } from '../types.js';
import debug from 'debug';

const debugLog = debug('tegg-socket.io:lib:packetMiddlewareInit');

/**
 * Initialize packet middleware execution
 * This runs for each socket packet/message
 */
export function packetMiddlewareInit(
  app: Application,
  socket: Socket,
  packet: SocketIOPacket,
  next: (err?: Error) => void,
  packetMiddlewares: ComposedSocketIOMiddleware,
  nsp: ExtendedNamespace,
): void {
  const request = socket.request as unknown as ExtendedIncomingMessage & HttpIncomingMessage;
  (request as ExtendedIncomingMessage).socket = socket;
  const ctx = app.createContext(request as HttpIncomingMessage, new http.ServerResponse(request as HttpIncomingMessage)) as unknown as SocketIOContext;
  ctx.packet = packet;
  ctx[CtxEventSymbol] = new EventEmitter();
  delegateSocket(ctx as unknown as Context);

  packetMiddlewares(ctx as unknown as Context, async () => {
    packet.push(ctx);
    next();
    const eventName = packet[0];
    const routerMap = (nsp as ExtendedNamespace)[RouterConfigSymbol];
    if (routerMap && routerMap.has(eventName)) {
      debugLog('[tegg-socket.io] wait controller finished!');
      // After controller execute finished, resume middlewares
      await new Promise<void>((resolve, reject) => {
        ctx[CtxEventSymbol]?.on('finshed', (error?: Error) => {
          debugLog('[tegg-socket.io] controller execute finished, resume middlewares');
          if (!error) {
            resolve();
          } else {
            reject(error);
          }
        });
      });
    }
  }).catch((e: Error) => {
    next(e); // throw to the native socket.io
    app.coreLogger.error(e);
  });
}

export { CtxEventSymbol };

