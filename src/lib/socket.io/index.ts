import { Server } from 'socket.io';
import './namespace.js';
import './socket.js';
import type { RouteHandler } from '../types.js';

/**
 * Extend Socket.IO Server with route() method
 * This delegates to the default namespace (sockets)
 */
declare module 'socket.io' {
  interface Server {
    route(event: string, handler: RouteHandler): void;
  }
}

Server.prototype.route = function(event: string, handler: RouteHandler): void {
  return this.sockets.route(event, handler);
};

export { Server };

