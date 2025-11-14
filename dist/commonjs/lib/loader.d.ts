import type { Application } from 'egg';
/**
 * Load controllers and middleware using Tegg-compatible FileLoader pattern
 * This matches the approach used in tegg-wss
 */
export declare function loadControllersAndMiddleware(app: Application): void;
