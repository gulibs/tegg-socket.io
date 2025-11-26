import type { ILifecycleBoot } from '@eggjs/core';
import debug from 'debug';
import type { Application } from 'egg';
import is from 'is-type-of';
import type { Server as HTTPServer } from 'node:http';
import { initializeDecoratorSystem } from './lib/decoratorScanner.js';
import type { RuntimeSocketIOServer } from './types.js';
import { createAdapter } from 'socket.io-redis';
const debugLog = debug('tegg-socket.io:lib:boot');

export class SocketIOBootHook implements ILifecycleBoot {
  private readonly app: Application;

  constructor(app: Application) {
    debugLog('[tegg-socket.io] SocketIOBootHook constructor called');
    this.app = app;
  }

  /**
   * Config did load hook
   * Scan and register decorated controllers and middleware
   */
  async configDidLoad() {
    debugLog('[tegg-socket.io] configDidLoad hook called');
    const ioServer = this.app.io as RuntimeSocketIOServer;

    // Scan and register decorated controllers and middleware
    await initializeDecoratorSystem(this.app, ioServer);

    debugLog('[tegg-socket.io] configDidLoad finished');
  }

  /**
   * Will ready hook
   * Initialize namespaces and middleware before application is ready
   */
  async willReady() {
    this.app.logger.info('[tegg-socket.io] init started.');

    const config = this.app.config.teggSocketIO;

    // Setup Redis adapter if configured
    if (config.redis) {
      try {
        // Construct Redis URI from config
        const { host, port, auth_pass, db, ...restOptions } = config.redis;
        let uri = `redis://${host}:${port}`;
        if (db !== undefined) {
          uri += `/${db}`;
        }

        // Create adapter options - use any to handle auth_pass
        const adapterOpts: any = { ...restOptions };
        if (auth_pass) {
          adapterOpts.auth_pass = auth_pass;
        }

        const adapter = createAdapter(uri, adapterOpts);
        // https://github.com/socketio/socket.io-redis/issues/21
        // Attach error handler to the adapter instance
        if (adapter && typeof adapter.on === 'function') {
          adapter.on('error', (err: Error) => {
            this.app.coreLogger.error(err);
          });
        }
        this.app.io.adapter(adapter);
        this.app.logger.info('[tegg-socket.io] init socket.io-redis ready.');
      } catch (error) {
        this.app.coreLogger.error('[tegg-socket.io] Failed to load socket.io-redis adapter:', error);
        throw error;
      }
    }

    // Register server event listener for Socket.IO attachment
    // This must be registered before server is created
    // Type assertion needed because EggCore doesn't have 'on' method in types
    // but Application does, and actual instance is Application
    this.app.on('server', (server: HTTPServer) => {
      this.app.io.attach(server, config.init);

      // Check whether it's a common function, it shouldn't be
      // an async or generator function, or it will be ignored.
      if (
        typeof config.generateId === 'function' &&
        !is.asyncFunction(config.generateId) &&
        !is.generatorFunction(config.generateId)
      ) {
        (this.app.io.engine as { generateId?: (req: unknown) => string }).generateId = config.generateId;
      }

      debugLog('[tegg-socket.io] init ready!');
    });
  }

}
