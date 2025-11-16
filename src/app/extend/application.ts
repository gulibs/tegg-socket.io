import { Server } from '../../lib/socket.io/index.js';
import type { RuntimeSocketIOServer } from '../../types.js';
import type { Application } from 'egg';

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
      app.logger.info('[tegg-socket.io] create SocketIO instance!');
      app[SocketIOSymbol] = new Server() as RuntimeSocketIOServer;
      app[SocketIOSymbol]!.serveClient(false);
      // Do NOT initialize controller and middleware here - let loader do it
      // This matches egg-socket.io reference implementation
    }

    return app[SocketIOSymbol]!;
  },
};
