import type { Application } from 'egg';
import debug from 'debug';
import fs from 'node:fs';
import type { LoadedMiddleware, LoadedController, RuntimeSocketIOServer } from '../types.js';
import { getIoLoadDirs } from './ioLoadDirs.js';
import { CaseStyle } from '@eggjs/core';

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
const IoCollectionsLoadedSymbol = Symbol.for('TEGG-SOCKET.IO#IO_COLLECTIONS_LOADED');
const IoCollectionsLoadingPromiseSymbol = Symbol.for('TEGG-SOCKET.IO#IO_COLLECTIONS_LOADING_PROMISE');

export async function loadControllersAndMiddleware(app: Application, runtimeServer?: RuntimeSocketIOServer): Promise<void> {
  const { loader } = app;
  const { FileLoader } = loader;
  const { controllerDirs, middlewareDirs } = getIoLoadDirs(app);
  debugLog('[tegg-socket.io] middleware dirs: %o', middlewareDirs);
  debugLog('[tegg-socket.io] controller dirs: %o', controllerDirs);

  // Check if directories exist and have files
  const lastControllerDir = controllerDirs[controllerDirs.length - 1];
  const lastMiddlewareDir = middlewareDirs[middlewareDirs.length - 1];
  try {
    if (fs.existsSync(lastControllerDir)) {
      const files = fs.readdirSync(lastControllerDir);
      app.logger.info('[tegg-socket.io] files in app controller dir: %j', files);
    } else {
      app.logger.info('[tegg-socket.io] app controller dir does not exist: %s', lastControllerDir);
    }
  } catch (err) {
    app.logger.error('[tegg-socket.io] error reading controller dir:', err);
  }

  try {
    if (fs.existsSync(lastMiddlewareDir)) {
      const files = fs.readdirSync(lastMiddlewareDir);
      app.logger.info('[tegg-socket.io] files in app middleware dir: %j', files);
    } else {
      app.logger.info('[tegg-socket.io] app middleware dir does not exist: %s', lastMiddlewareDir);
    }
  } catch (err) {
    app.logger.error('[tegg-socket.io] error reading middleware dir:', err);
  }

  const ioServer = (runtimeServer ?? (app.io as RuntimeSocketIOServer)) as unknown as {
    middleware: LoadedMiddlewareDictionary;
    controller: LoadedControllerDictionary;
  };

  // Runtime uses LoadedMiddleware, but types use CustomMiddleware
  // Initialize middleware object if it doesn't exist
  if (!ioServer.middleware) {
    ioServer.middleware = {} as LoadedMiddlewareDictionary;
  }

  await new FileLoader({
    directory: middlewareDirs,
    target: ioServer.middleware,
    inject: app,
  }).load();

  debugLog('[tegg-socket.io] app.io.middleware: %o', app.io.middleware);

  // Load controllers from app/io/controller/ across all load units
  // Runtime uses LoadedController, but types use CustomController
  // Initialize controller object if it doesn't exist
  if (!ioServer.controller) {
    ioServer.controller = {} as LoadedControllerDictionary;
  }

  // Directly operate on ioServer.controller without intermediate variable
  debugLog('[tegg-socket.io] controller before load: %o', ioServer.controller);

  // Use loader.loadController() to load controllers (matches egg-socket.io reference implementation)
  // Note: Do NOT pass match parameter - loader.loadController handles file matching internally
  const tempControllerSymbol = Symbol.for('TEGG-SOCKET.IO#TEMP_CONTROLLER');
  await loader.loadToApp(controllerDirs, tempControllerSymbol, {
    directory: controllerDirs,
    caseStyle: CaseStyle.lower,
  });
  // Merge loaded controllers into runtime ioServer controller
  Object.assign(ioServer.controller, (app as Application & Record<symbol, unknown>)[tempControllerSymbol] as LoadedControllerDictionary);
  // Cleanup temporary property
  delete (app as Application & Record<symbol, unknown>)[tempControllerSymbol];

  debugLog('[tegg-socket.io] controller after load: %o', ioServer.controller);
}

export async function ensureIoCollectionsLoaded(app: Application, runtimeServer?: RuntimeSocketIOServer): Promise<void> {
  const flagApp = app as Application & {
    [IoCollectionsLoadedSymbol]?: boolean;
    [IoCollectionsLoadingPromiseSymbol]?: Promise<void>;
  };
  if (flagApp[IoCollectionsLoadedSymbol]) {
    return;
  }
  if (flagApp[IoCollectionsLoadingPromiseSymbol]) {
    return flagApp[IoCollectionsLoadingPromiseSymbol];
  }
  debugLog('[tegg-socket.io] ensureIoCollectionsLoaded starting...');
  const loadingPromise = (async () => {
    try {
      await loadControllersAndMiddleware(app, runtimeServer);
      app.logger.info('[tegg-socket.io] controllers/middleware are ready.');

      // Log loaded controllers and middleware for user
      if (runtimeServer) {
        const controllerNames = Object.keys(runtimeServer.controller);
        const middlewareNames = Object.keys(runtimeServer.middleware);
        app.logger.info('[tegg-socket.io] loaded %d controller(s): %j', controllerNames.length, controllerNames);
        app.logger.info('[tegg-socket.io] loaded %d middleware(s): %j', middlewareNames.length, middlewareNames);
      }
      flagApp[IoCollectionsLoadedSymbol] = true;
      flagApp[IoCollectionsLoadingPromiseSymbol] = undefined;
    } catch (err) {
      debugLog('[tegg-socket.io] error loading controllers/middleware: %o', err);
      app.logger.error('[tegg-socket.io] failed to load controllers/middleware:', err);
      flagApp[IoCollectionsLoadedSymbol] = false;
      flagApp[IoCollectionsLoadingPromiseSymbol] = undefined;
      throw err;
    }
  })();
  flagApp[IoCollectionsLoadingPromiseSymbol] = loadingPromise;
  return loadingPromise;
}

