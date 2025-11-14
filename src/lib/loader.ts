import path from 'node:path';
import type { Application } from 'egg';
import debug from 'debug';
import type { LoadedMiddleware, LoadedController } from './types.js';

// CustomMiddleware and CustomController are declared in typings/index.d.ts
// They are interfaces that users extend in their applications
// Here we use LoadedMiddleware and LoadedController which have index signatures
type CustomMiddleware = LoadedMiddleware;
type CustomController = LoadedController;

const debugLog = debug('egg-socket.io:lib:loader');

/**
 * Load controllers and middleware using Tegg-compatible FileLoader pattern
 * This matches the approach used in tegg-wss
 */
export function loadControllersAndMiddleware(app: Application): void {
  const { loader } = app;
  const { FileLoader } = loader;

  // Load middleware from app/io/middleware/ across all load units
  const middlewareDirs = loader.getLoadUnits().map(unit =>
    path.join(unit.path, 'app', 'io', 'middleware'),
  );

  // Runtime uses LoadedMiddleware, but types use CustomMiddleware
  // Initialize middleware object if it doesn't exist
  if (!app.io.middleware) {
    app.io.middleware = {} as unknown as CustomMiddleware;
  }
  // Use type assertion to access LoadedMiddleware for FileLoader
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const middlewareTarget = app.io.middleware as any as LoadedMiddleware;
  new FileLoader({
    directory: middlewareDirs,
    target: middlewareTarget,
    inject: app,
  }).load();
  // Reassign to ensure type compatibility
  // TypeScript may complain here because CustomMiddleware can be extended by users
  // but at runtime, LoadedMiddleware has index signature and is compatible
  app.io.middleware = middlewareTarget as unknown as CustomMiddleware;

  debugLog('[egg-socket.io] app.io.middleware: %o', app.io.middleware);

  // Load controllers from app/io/controller/ across all load units
  // Note: Reference implementation uses app.loader.loadController() for controllers
  // but that method is designed for app/controller, not app/io/controller
  // So we use FileLoader here, matching the middleware loading pattern
  const controllerDirs = loader.getLoadUnits().map(unit =>
    path.join(unit.path, 'app', 'io', 'controller'),
  );

  // Runtime uses LoadedController, but types use CustomController
  // Initialize controller object if it doesn't exist
  if (!app.io.controller) {
    app.io.controller = {} as unknown as CustomController;
  }
  // Use type assertion to access LoadedController for FileLoader
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controllerTarget = app.io.controller as any as LoadedController;
  new FileLoader({
    directory: controllerDirs,
    target: controllerTarget,
    inject: app,
  }).load();
  // Reassign to ensure type compatibility
  // TypeScript may complain here because CustomController can be extended by users
  // but at runtime, LoadedController has index signature and is compatible
  app.io.controller = controllerTarget;

  debugLog('[egg-socket.io] app.io.controller: %o', app.io.controller);
}

