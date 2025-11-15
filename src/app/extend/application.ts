import { Server } from '../../lib/socket.io/index.js';
import type { LoadedMiddleware, LoadedController } from '../../lib/types.js';
import debug from 'debug';

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
  get io(): Server & { middleware: LoadedMiddleware; controller: LoadedController } {
    // 'this' refers to the Application instance in Egg.js extensions
    // Use type assertion to access Symbol property
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const app = this as any;
    if (!app[SocketIOSymbol]) {
      debugLog('[tegg-socket.io] create SocketIO instance!');
      app[SocketIOSymbol] = new Server() as Server & { middleware: LoadedMiddleware; controller: LoadedController };
      app[SocketIOSymbol].serveClient(false);
      // Initialize controller and middleware objects
      app[SocketIOSymbol].controller = {} as LoadedController;
      app[SocketIOSymbol].middleware = {} as LoadedMiddleware;
    }
    return app[SocketIOSymbol];
  },
};

