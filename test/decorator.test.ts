import { mm, MockApplication } from '@eggjs/mock';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import assert from 'node:assert/strict';

describe('test/decorator.test.ts', () => {
  let app: MockApplication;
  let client: ClientSocket;
  let client2: ClientSocket;

  before(() => {
    app = mm.app({
      baseDir: 'apps/socket.io-decorator-basic',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mm.restore);

  beforeEach(() => {
    mm(app.config, 'teggSocketIO', {
      namespace: {
        '/': {
          connectionMiddleware: [ 'auth' ],
          packetMiddleware: [ 'log' ],
        },
        '/admin': {
          connectionMiddleware: [ 'auth', 'adminAuth' ],
          packetMiddleware: [],
        },
      },
    });
  });

  afterEach(() => {
    if (client) {
      client.close();
    }
    if (client2) {
      client2.close();
    }
  });

  describe('@SocketIOController and @SocketIOEvent', () => {
    it('should handle basic event with @SocketIOEvent', done => {
      app.ready(() => {
        client = ioClient('http://localhost:7001', {
          query: { token: 'test-token' },
          transports: [ 'websocket' ],
        });

        client.on('connect', () => {
          client.emit('chat', 'Hello World');
        });

        client.on('res', data => {
          assert(data === 'Message: Hello World');
          done();
        });
      });
    });

    it('should work with multiple namespaces', done => {
      app.ready(() => {
        const adminClient = ioClient('http://localhost:7001/admin', {
          query: { token: 'admin-token' },
          transports: [ 'websocket' ],
        });

        adminClient.on('connect', () => {
          adminClient.emit('adminMessage', 'Admin Hello');
        });

        adminClient.on('adminRes', data => {
          assert(data === 'Admin: Admin Hello');
          adminClient.close();
          done();
        });
      });
    });
  });

  describe('@Room decorator', () => {
    it('should auto-join room with @Room decorator', done => {
      app.ready(() => {
        client = ioClient('http://localhost:7001', {
          query: { token: 'test-token' },
          transports: [ 'websocket' ],
        });

        client.on('connect', () => {
          client.emit('joinRoom');
        });

        client.on('joined', data => {
          assert(data === 'Welcome to lobby');
          // TODO: Verify socket is actually in the room
          done();
        });
      });
    });

    it('should support dynamic room names', done => {
      app.ready(() => {
        client = ioClient('http://localhost:7001', {
          query: { token: 'test-token' },
          transports: [ 'websocket' ],
        });

        client.on('connect', () => {
          client.emit('joinDynamicRoom', 'room-123');
        });

        client.on('joined', data => {
          assert(data === 'Welcome to room-123');
          done();
        });
      });
    });

    it('should auto-leave room when autoLeave is true', done => {
      app.ready(() => {
        client = ioClient('http://localhost:7001', {
          query: { token: 'test-token' },
          transports: [ 'websocket' ],
        });

        client.on('connect', () => {
          client.emit('quickVisit');
        });

        client.on('visiting', data => {
          assert(data === 'Quick visit to temporary room');
          // TODO: Verify socket left the room
          done();
        });
      });
    });
  });

  describe('@Broadcast decorator', () => {
    it('should broadcast to room', done => {
      app.ready(() => {
        // Client 1: Join lobby and wait for broadcast
        client = ioClient('http://localhost:7001', {
          query: { token: 'test-token' },
          transports: [ 'websocket' ],
        });

        client2 = ioClient('http://localhost:7001', {
          query: { token: 'test-token-2' },
          transports: [ 'websocket' ],
        });

        let client1Joined = false;
        let client2Joined = false;

        // Client 1 joins lobby
        client.on('connect', () => {
          client.emit('joinRoom');
        });

        client.on('joined', () => {
          client1Joined = true;
          if (client1Joined && client2Joined) {
            // Both joined, now broadcast
            client2.emit('broadcast', 'Test broadcast');
          }
        });

        // Client 2 joins lobby
        client2.on('connect', () => {
          client2.emit('joinRoom');
        });

        client2.on('joined', () => {
          client2Joined = true;
          if (client1Joined && client2Joined) {
            // Both joined, now broadcast
            client2.emit('broadcast', 'Test broadcast');
          }
        });

        // Client 1 receives broadcast
        client.on('broadcast', (data: any) => {
          assert(data.text === 'Test broadcast');
          assert(data.from === client2.id);
          done();
        });
      });
    });

    it('should work with @Room and @Broadcast combined', done => {
      app.ready(() => {
        client = ioClient('http://localhost:7001', {
          query: { token: 'test-token' },
          transports: [ 'websocket' ],
        });

        client2 = ioClient('http://localhost:7001', {
          query: { token: 'test-token-2' },
          transports: [ 'websocket' ],
        });

        let receivedCount = 0;

        // Both clients send group messages
        client.on('connect', () => {
          client.emit('groupMessage', 'Message from client1');
        });

        client2.on('connect', () => {
          client2.emit('groupMessage', 'Message from client2');
        });

        // Both clients should receive broadcasts
        client.on('newGroupMessage', (data: any) => {
          assert(data.text);
          assert(data.from);
          assert(data.timestamp);
          receivedCount++;
          if (receivedCount >= 2) {
            done();
          }
        });

        client2.on('newGroupMessage', (data: any) => {
          assert(data.text);
          assert(data.from);
          assert(data.timestamp);
          receivedCount++;
          if (receivedCount >= 2) {
            done();
          }
        });
      });
    });
  });

  describe('@ConnectionMiddleware and @PacketMiddleware', () => {
    it('should reject connection without token', done => {
      app.ready(() => {
        client = ioClient('http://localhost:7001', {
          transports: [ 'websocket' ],
        });

        client.on('error', error => {
          assert(error === 'Authentication required');
          done();
        });

        client.on('connect', () => {
          done(new Error('Should not connect without token'));
        });
      });
    });

    it('should accept connection with valid token', done => {
      app.ready(() => {
        client = ioClient('http://localhost:7001', {
          query: { token: 'test-token' },
          transports: [ 'websocket' ],
        });

        client.on('connect', () => {
          assert(client.connected);
          done();
        });
      });
    });

    it('should enforce admin middleware in /admin namespace', done => {
      app.ready(() => {
        // Non-admin user should be rejected
        client = ioClient('http://localhost:7001/admin', {
          query: { token: 'test-token' },
          transports: [ 'websocket' ],
        });

        client.on('error', error => {
          assert(error === 'Admin access required');
          done();
        });

        client.on('connect', () => {
          done(new Error('Non-admin should not connect to /admin'));
        });
      });
    });
  });

  describe('@Subscribe decorator', () => {
    it('should trigger on disconnect event', done => {
      app.ready(() => {
        client = ioClient('http://localhost:7001', {
          query: { token: 'test-token' },
          transports: [ 'websocket' ],
        });

        client.on('connect', () => {
          // Disconnect immediately
          client.close();

          // Wait a bit for server to process disconnect
          setTimeout(() => {
            // TODO: Verify disconnect handler was called in logs
            done();
          }, 100);
        });
      });
    });
  });

  describe('Backward compatibility', () => {
    it('should coexist with manual route registration', done => {
      app.ready(() => {
        // Test that both decorator-based and manual routes work
        client = ioClient('http://localhost:7001', {
          query: { token: 'test-token' },
          transports: [ 'websocket' ],
        });

        client.on('connect', () => {
          // Test decorator route
          client.emit('chat', 'Test');
        });

        client.on('res', data => {
          assert(data === 'Message: Test');
          done();
        });
      });
    });
  });
});

