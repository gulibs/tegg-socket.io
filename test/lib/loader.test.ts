import assert from 'node:assert/strict';
import path from 'node:path';
import debug from 'debug';
import type { Application } from 'egg';
import { collectIoLoadDirs } from '../../src/lib/ioLoadDirs.js';
import { loadControllersAndMiddleware } from '../../src/lib/loader.js';

describe('lib/loader', () => {
  it('collectIoLoadDirs keeps load unit order', () => {
    const loadUnits = [
      { path: path.join('/', 'tmp', 'plugin-a') },
      { path: path.join('/', 'tmp', 'app') },
    ];
    const dirs = collectIoLoadDirs(loadUnits);
    assert.deepEqual(
      dirs.controllerDirs,
      loadUnits.map(unit => path.join(unit.path, 'app', 'io', 'controller')),
    );
    assert.deepEqual(
      dirs.middlewareDirs,
      loadUnits.map(unit => path.join(unit.path, 'app', 'io', 'middleware')),
    );
  });

  it('loadControllersAndMiddleware uses Egg loader APIs and logs directories', () => {
    const logLines: string[] = [];
    const originalWrite = process.stderr.write;
    // Capture debug output without polluting test logs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.stderr as any).write = (chunk: Buffer | string): boolean => {
      logLines.push(typeof chunk === 'string' ? chunk : chunk.toString('utf8'));
      return true;
    };

    const previousDebugNamespaces = process.env.DEBUG;
    debug.enable('tegg-socket.io:lib:loader');

    const loadUnits = [
      { path: path.join('/', 'tmp', 'plugin-a') },
      { path: path.join('/', 'tmp', 'app') },
    ];
    const controllerCalls: Array<Record<string, unknown>> = [];
    const middlewareCalls: Array<Record<string, unknown>> = [];

    class MockFileLoader {
      options: Record<string, unknown>;
      constructor(options: Record<string, unknown>) {
        this.options = options;
      }
      load() {
        middlewareCalls.push(this.options);
      }
    }

    const app = {
      io: {},
      loader: {
        getLoadUnits() {
          return loadUnits;
        },
        FileLoader: MockFileLoader,
        loadController(options: Record<string, unknown>) {
          controllerCalls.push(options);
        },
      },
    } as unknown as Application;

    try {
      loadControllersAndMiddleware(app);
    } finally {
      (process.stderr as typeof process.stderr).write = originalWrite;
      if (previousDebugNamespaces && previousDebugNamespaces.length > 0) {
        debug.enable(previousDebugNamespaces);
      } else {
        debug.disable();
      }
      process.env.DEBUG = previousDebugNamespaces;
    }

    assert.equal(controllerCalls.length, 1);
    assert.deepEqual(
      controllerCalls[0]?.directory,
      loadUnits.map(unit => path.join(unit.path, 'app', 'io', 'controller')),
    );
    assert.equal(middlewareCalls.length, 1);
    assert.deepEqual(
      middlewareCalls[0]?.directory,
      loadUnits.map(unit => path.join(unit.path, 'app', 'io', 'middleware')),
    );
    assert.ok(
      logLines.some(line => line.includes('[tegg-socket.io] app.io.middleware')),
      'middleware debug output missing',
    );
    assert.ok(
      logLines.some(line => line.includes('[tegg-socket.io] app.io.controller')),
      'controller debug output missing',
    );
  });
});

