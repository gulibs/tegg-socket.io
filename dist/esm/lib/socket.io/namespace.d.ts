import type { RouteHandler } from '../types.js';
export declare const RouterConfigSymbol: unique symbol;
declare module 'socket.io' {
    interface Namespace {
        [RouterConfigSymbol]?: Map<string, RouteHandler>;
        route(event: string, handler: RouteHandler): void;
    }
}
