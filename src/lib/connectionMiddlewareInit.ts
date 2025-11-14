import http from 'node:http';
import type { Application } from 'egg';
import type { Socket } from 'socket.io';
import type { IncomingMessage as HttpIncomingMessage } from 'node:http';
import type { ComposedSocketIOMiddleware, ExtendedIncomingMessage } from './types.js';
import { delegateSocket } from './util.js';
import debug from 'debug';

const debugLog = debug('egg-socket.io:lib:connectionMiddlewareInit');

/**
 * Initialize connection middleware execution
 * This runs when a socket connects to a namespace
 */
export function connectionMiddlewareInit(
  app: Application,
  socket: Socket,
  next: (err?: Error) => void,
  connectionMiddlewares: ComposedSocketIOMiddleware,
): void {
  const request = socket.request as unknown as ExtendedIncomingMessage & HttpIncomingMessage;
  (request as ExtendedIncomingMessage).socket = socket;
  const ctx = app.createContext(request as HttpIncomingMessage, new http.ServerResponse(request as HttpIncomingMessage));
  delegateSocket(ctx);
  let nexted = false;

  connectionMiddlewares(ctx, async () => {
    next();
    nexted = true;
    // After socket emit disconnect, resume middlewares
    await new Promise<void>(resolve => {
      socket.once('disconnect', (reason: string) => {
        debugLog('socket disconnect by: %s', reason);
        resolve();
      });
    });
  })
    .then(() => {
      if (!nexted) {
        next();
      }
    })
    .catch((e: Error) => {
      next(e); // throw to the native socket.io
      app.coreLogger.error(e);
    });
}

