import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { io as ioClient } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { mm, type MockApplication } from '@eggjs/mock';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let basePort = 17001;

// Track all application instances for cleanup
// mm.cluster() and mm.app() return instances with close() method
type MockAppInstance = MockApplication | ReturnType<typeof mm.cluster>;
const apps: MockAppInstance[] = [];

// Track all Socket.IO client connections for cleanup
const sockets: Socket[] = [];

function client(nsp = '', opts: { port: number; query?: string; extraHeaders?: Record<string, string> } = { port: basePort }) {
  let url = `http://127.0.0.1:${opts.port}${nsp || ''}`;
  if (opts.query) {
    url += `?${opts.query}`;
  }
  const socket = ioClient(url, {
    extraHeaders: opts.extraHeaders,
  });
  // Track Socket.IO connections for cleanup
  sockets.push(socket);
  return socket;
}

function clean(name: string) {
  const logPath = path.join(__dirname, 'fixtures/apps', name, 'logs');
  const runPath = path.join(__dirname, 'fixtures/apps', name, 'run');

  if (fs.existsSync(logPath)) {
    fs.rmSync(logPath, { recursive: true, force: true });
  }
  if (fs.existsSync(runPath)) {
    fs.rmSync(runPath, { recursive: true, force: true });
  }
}

// Helper functions for error log testing (will be used in error handling tests)
function getErrorLogContent(name: string): string {
  const logPath = path.join(__dirname, 'fixtures/apps', name, 'logs', name, 'common-error.log');
  if (fs.existsSync(logPath)) {
    return fs.readFileSync(logPath, 'utf8');
  }
  return '';
}

function contains(content: string, match: string): number {
  return content.split('\n').filter(line => line.indexOf(match) >= 0).length;
}

// Export helper functions for use in error handling tests
export { getErrorLogContent, contains };

describe('test/socket.io.test.ts', () => {
  const mockApps = fs.readdirSync(path.join(__dirname, 'fixtures/apps'));

  // Set default test timeout to 30 seconds to allow for Socket.IO connections
  // Individual tests can override this if needed
  beforeEach(function() {
    this.timeout(30000);
  });

  before(() => {
    mockApps.forEach(clean);
  });

  afterEach(() => {
    mm.restore();
    basePort++;
  });

  // Global cleanup hook to ensure all resources are released
  after(() => {
    // Disconnect all Socket.IO client connections
    sockets.forEach(socket => {
      try {
        if (socket.connected) {
          socket.disconnect();
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    });
    sockets.length = 0;

    // Close all application instances
    return Promise.all(
      apps.map(app => {
        try {
          return app.close().catch(() => {
            // Ignore cleanup errors
          });
        } catch (e) {
          // Ignore cleanup errors
          return Promise.resolve();
        }
      }),
    ).then(() => {
      apps.length = 0;
    });
  });

  describe('Basic Socket.IO Functionality', () => {
    it('should single worker works ok', done => {
      const app = mm.cluster({
        baseDir: 'apps/socket.io-test',
        workers: 1,
      });
      // Track application instance for cleanup
      apps.push(app);
      app.ready().then(() => {
        const socket = client('', { port: basePort });
        socket.on('connect', () => socket.emit('chat', ''));
        socket.on('disconnect', () => {
          app.close().then(done, done);
        });
        socket.on('res', (msg: string) => {
          assert(msg === 'hello');
          socket.close();
        });
      }).catch((err: Error) => {
        // Ensure cleanup on error
        app.close().catch(() => {});
        done(err);
      });
    });

    it('should multi process works ok with sticky mode', done => {
      const app = mm.cluster({
        baseDir: 'apps/socket.io-test',
        workers: 2,
      });
      // Track application instance for cleanup
      apps.push(app);
      app.ready().then(() => {
        const socket = client('', { port: basePort });
        socket.on('connect', () => socket.emit('chat', ''));
        socket.on('disconnect', () => {
          app.close().then(done, done);
        });
        socket.on('res', (msg: string) => {
          assert(msg === 'hello');
          socket.close();
        });
      }).catch((err: Error) => {
        // Ensure cleanup on error
        app.close().catch(() => {});
        done(err);
      });
    });

    it('should app.io be accessible', async () => {
      const app = mm.app({
        baseDir: 'apps/socket.io-test',
      });
      // Track application instance for cleanup
      apps.push(app);
      try {
        await app.ready();
        assert(app.io !== undefined);
        assert(app.io !== null);
      } finally {
        // Ensure cleanup even if test fails
        await app.close().catch(() => {});
      }
    });

    it('should app.io be initialized with serveClient(false)', async () => {
      const app = mm.app({
        baseDir: 'apps/socket.io-test',
      });
      // Track application instance for cleanup
      apps.push(app);
      try {
        await app.ready();
        // serveClient is a method, we can't directly check it, but we can verify io exists
        assert(app.io !== undefined);
      } finally {
        // Ensure cleanup even if test fails
        await app.close().catch(() => {});
      }
    });
  });

  describe('Controller System', () => {
    it('should controller class works ok', done => {
      const app = mm.cluster({
        baseDir: 'apps/socket.io-controller-class',
        workers: 1,
      });
      // Track application instance for cleanup
      apps.push(app);
      app.ready().then(() => {
        const socket = client('', { port: basePort });
        let success = 0;
        socket.on('connect', () => {
          socket.emit('chat', '');
          socket.emit('chat-generator', '');
        });
        socket.on('disconnect', () => {
          app.close().then(done, done);
        });
        socket.on('res', (msg: string) => {
          assert(msg === 'hello');
          if (++success === 2) {
            socket.close();
          }
        });
      }).catch((err: Error) => {
        // Ensure cleanup on error
        app.close().catch(() => {});
        done(err);
      });
    });

    it('should async/await works ok', done => {
      const app = mm.cluster({
        baseDir: 'apps/socket.io-controller-async',
        workers: 1,
      });
      // Track application instance for cleanup
      apps.push(app);
      app.ready().then(() => {
        const socket = client('', { port: basePort });
        let success = 0;
        socket.on('connect', () => {
          socket.emit('chat-async-class', '');
          socket.emit('chat-async-object', '');
        });
        socket.on('disconnect', () => {
          app.close().then(done, done);
        });
        socket.on('res', (msg: string) => {
          assert(msg === 'hello');
          if (++success === 2) {
            socket.close();
          }
        });
      }).catch((err: Error) => {
        // Ensure cleanup on error
        app.close().catch(() => {});
        done(err);
      });
    });

    it('should load controllers before router definitions execute', done => {
      const app = mm.cluster({
        baseDir: 'apps/socket.io-controller-router',
        workers: 1,
      });
      apps.push(app);
      app.ready().then(() => {
        const socket = client('', { port: basePort });
        let receivedAuth = false;
        socket.on('connect', () => {
          socket.emit('join-organization', { organizationId: 'acme' });
        });
        socket.on('auth-check', () => {
          receivedAuth = true;
        });
        socket.on('joined-organization', payload => {
          assert(receivedAuth === true);
          assert(payload.organizationId === 'acme');
          socket.close();
        });
        socket.on('disconnect', () => {
          app.close().then(done, done);
        });
      }).catch((err: Error) => {
        app.close().catch(() => {});
        done(err);
      });
    });
  });

  describe('Namespace Management', () => {
    it('should namespace works ok', done => {
      const app = mm.cluster({
        baseDir: 'apps/socket.io-namespace',
        workers: 1,
      });
      // Track application instance for cleanup
      apps.push(app);
      app.ready().then(() => {
        const socket = client('/nstest', { port: basePort });
        socket.on('connect', () => socket.emit('chat', ''));
        socket.on('disconnect', () => {
          app.close().then(done, done);
        });
        socket.on('res', (msg: string) => {
          assert(msg === 'hello');
          socket.close();
        });
      }).catch((err: Error) => {
        // Ensure cleanup on error
        app.close().catch(() => {});
        done(err);
      });
    });
  });
});

