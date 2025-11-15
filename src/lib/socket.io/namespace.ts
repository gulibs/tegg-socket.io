import assert from 'node:assert';
import { Namespace } from 'socket.io';
import is from 'is-type-of';
import debug from 'debug';
import type { RouteHandler } from '../types.js';
import { RouterConfigSymbol } from '../types.js';

const debugLog = debug('tegg-socket.io:lib:socket.io:namespace');

type RouteAwareNamespace = Namespace & { [RouterConfigSymbol]?: Map<string, RouteHandler> };

const namespaceRoute = function (
  this: RouteAwareNamespace,
  event: string,
  handler: RouteHandler,
): void {
  assert(is.string(event), 'event must be string!');

  if (!this[RouterConfigSymbol]) {
    this[RouterConfigSymbol] = new Map();
  }

  if (!this[RouterConfigSymbol].has(event)) {
    debugLog('[tegg-socket.io] set router config: %s', event);
    this[RouterConfigSymbol].set(event, handler);
  }
};

// Same dual-typing issue as Server.prototype.route: when NodeNext pulls both
// esm and cjs declaration files the `this` types diverge because of private
// fields. Cast through `unknown` to keep structural compatibility.
Namespace.prototype.route = namespaceRoute as unknown as Namespace['route'];