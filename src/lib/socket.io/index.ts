import { Server } from 'socket.io';
import './namespace.js';
import './socket.js';
import type { RouteHandler } from '../../types.js';

const serverRoute = function(this: Server, event: string, handler: RouteHandler): void {
  this.sockets.route(event, handler);
};

// NodeNext resolves `egg` typings twice (esm + cjs) so the implicit `this`
// types are not structurally compatible. Cast through `unknown` to avoid the
// false-positive until upstream typings converge.
Server.prototype.route = serverRoute as unknown as Server['route'];

export { Server };

