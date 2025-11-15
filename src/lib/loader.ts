import type { Application } from 'egg';
import debug from 'debug';
import type { LoadedMiddleware, LoadedController } from './types.js';
import { getIoLoadDirs } from './ioLoadDirs.js';

// CustomMiddleware and CustomController are declared in typings/index.d.ts
// They are interfaces that users extend in their applications
// Here we use LoadedMiddleware and LoadedController which have index signatures
type LoadedMiddlewareDictionary = LoadedMiddleware;
type LoadedControllerDictionary = LoadedController;

const debugLog = debug('tegg-socket.io:lib:loader');

/**
 * Load controllers and middleware using Tegg-compatible FileLoader pattern
 * This matches the approach used in tegg-wss
 */
export function loadControllersAndMiddleware(app: Application): void {
  const { loader } = app;
  const { FileLoader } = loader;
  const { controllerDirs, middlewareDirs } = getIoLoadDirs(app);
  const ioServer = app.io as unknown as {
    middleware: LoadedMiddlewareDictionary;
    controller: LoadedControllerDictionary;
  };

  // Runtime uses LoadedMiddleware, but types use CustomMiddleware
  // Initialize middleware object if it doesn't exist
  if (!ioServer.middleware) {
    ioServer.middleware = {} as LoadedMiddlewareDictionary;
  }
  // Use type assertion to access LoadedMiddleware for FileLoader
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const middlewareTarget = ioServer.middleware as unknown as LoadedMiddlewareDictionary;
  new FileLoader({
    directory: middlewareDirs,
    target: middlewareTarget,
    inject: app,
  }).load();
  // Reassign to ensure type compatibility
  // TypeScript may complain here because CustomMiddleware can be extended by users
  // but at runtime, LoadedMiddleware has index signature and is compatible
  ioServer.middleware = middlewareTarget;

  debugLog('[tegg-socket.io] app.io.middleware: %o', app.io.middleware);

  // Load controllers from app/io/controller/ across all load units
  // Note: Reference implementation uses app.loader.loadController() for controllers
  // but that method is designed for app/controller, not app/io/controller
  // So we use FileLoader here, matching the middleware loading pattern
  // Runtime uses LoadedController, but types use CustomController
  // Initialize controller object if it doesn't exist
  if (!ioServer.controller) {
    ioServer.controller = {} as LoadedControllerDictionary;
  }
  // Use type assertion to access LoadedController for FileLoader
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controllerTarget = ioServer.controller as unknown as LoadedControllerDictionary;
  loader.loadController({
    directory: controllerDirs,
    target: controllerTarget,
  });
  // Reassign to ensure type compatibility
  // TypeScript may complain here because CustomController can be extended by users
  // but at runtime, LoadedController has index signature and is compatible
  ioServer.controller = controllerTarget;

  debugLog('[tegg-socket.io] app.io.controller: %o', app.io.controller);
}

