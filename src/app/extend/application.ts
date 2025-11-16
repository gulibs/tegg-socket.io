import { Server } from '../../lib/socket.io/index.js';
import type { RuntimeSocketIOServer, LoadedMiddleware, LoadedController } from '../../types.js';
import debug from 'debug';
import type { Application } from 'egg';
import { ensureIoCollectionsLoaded } from '../../lib/loader.js';

const debugLog = debug('tegg-socket.io:app:extend:application');
const SocketIOSymbol = Symbol.for('TEGG-SOCKET.IO#IO');

/**
 * Application extension for Socket.IO
 * Extends Application with app.io property using traditional Egg.js extension pattern
 * This matches the reference implementation (egg-socket.io-master)
 *
 * In Egg.js extensions, 'this' refers to the Application instance.
 * The framework merges this object into the Application prototype.
 */
export default {
  get io(): RuntimeSocketIOServer {
    const app = this as unknown as Application & { [SocketIOSymbol]?: RuntimeSocketIOServer };
    if (!app[SocketIOSymbol]) {
      debugLog('[tegg-socket.io] create SocketIO instance!');
      app[SocketIOSymbol] = new Server() as RuntimeSocketIOServer;
      app[SocketIOSymbol]!.serveClient(false);
      // Initialize controller and middleware objects
      app[SocketIOSymbol]!.controller = {} as LoadedController;
      app[SocketIOSymbol]!.middleware = {} as LoadedMiddleware;
    }

    const ioServer = app[SocketIOSymbol]!;
    ensureIoCollectionsLoaded(app, ioServer);
    return ioServer;
  },
};

