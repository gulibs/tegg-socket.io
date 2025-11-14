import assert from 'node:assert';
import { Namespace } from 'socket.io';
import is from 'is-type-of';
import debug from 'debug';
import type { RouteHandler, ExtendedNamespace } from '../types.js';

const debugLog = debug('egg-socket.io:lib:socket.io:namespace');

export const RouterConfigSymbol = Symbol.for('EGG-SOCKET.IO#ROUTERCONFIG');

declare module 'socket.io' {
  interface Namespace {
    [RouterConfigSymbol]?: Map<string, RouteHandler>;
    route(event: string, handler: RouteHandler): void;
  }
}

Namespace.prototype.route = function(this: ExtendedNamespace, event: string, handler: RouteHandler): void {
  assert(is.string(event), 'event must be string!');

  if (!this[RouterConfigSymbol]) {
    this[RouterConfigSymbol] = new Map();
  }

  if (!this[RouterConfigSymbol].has(event)) {
    debugLog('[egg-socket.io] set router config: %s', event);
    this[RouterConfigSymbol].set(event, handler);
  }
};

