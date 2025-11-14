## ADDED Requirements

### Requirement: Redis Adapter Configuration
The plugin SHALL support optional Redis adapter for Socket.IO cluster mode.

#### Scenario: Redis adapter setup
- **WHEN** `config.teggSocketIO.redis` is configured
- **THEN** the socket.io-redis adapter SHALL be loaded dynamically
- **AND** the adapter SHALL be configured with the provided Redis options
- **AND** the adapter SHALL be attached to the Socket.IO server via `app.io.adapter()`

#### Scenario: Redis adapter timing
- **WHEN** Redis adapter is configured
- **THEN** it SHALL be set up in `app.beforeStart()` hook
- **AND** it SHALL be configured before namespace initialization
- **AND** the adapter SHALL be ready before socket connections are accepted

#### Scenario: Redis adapter error handling
- **WHEN** the Redis adapter emits an error
- **THEN** the error SHALL be logged via `app.coreLogger.error()`
- **AND** the error SHALL NOT crash the application
- **AND** the error handler SHALL be registered on the adapter prototype

### Requirement: Redis Adapter Options
The plugin SHALL support standard socket.io-redis configuration options.

#### Scenario: Redis connection options
- **WHEN** Redis adapter is configured
- **THEN** it SHALL support `host`, `port`, `auth_pass`, `db` options
- **AND** options SHALL be passed directly to socket.io-redis
- **AND** the adapter SHALL connect to the specified Redis server

#### Scenario: Redis adapter separation
- **WHEN** both `@eggjs/tegg-socket.io` and `@eggjs/redis` are used
- **THEN** their Redis configurations SHALL be separate and independent
- **AND** they SHALL NOT share the same Redis connection
- **AND** socket.io-redis SHALL use its own Redis connection

### Requirement: Cluster Mode Support
The Redis adapter SHALL enable Socket.IO to work in cluster mode.

#### Scenario: Multi-process connection sharing
- **WHEN** Redis adapter is configured and application runs in cluster mode
- **THEN** socket connections SHALL be shared across all worker processes
- **AND** rooms and clients information SHALL be accessible from any process
- **AND** broadcasting SHALL work across all processes

#### Scenario: Sticky session requirement
- **WHEN** Redis adapter is used in cluster mode
- **THEN** sticky sessions SHALL still be required for proper operation
- **AND** the `--sticky` flag SHALL be required in development and production
- **AND** documentation SHALL explain this requirement

### Requirement: Optional Redis Dependency
The plugin SHALL NOT require Redis as a mandatory dependency.

#### Scenario: Redis-free operation
- **WHEN** Redis adapter is NOT configured
- **THEN** the plugin SHALL work without Redis
- **AND** socket.io-redis SHALL NOT be loaded
- **AND** single-process mode SHALL work normally
- **AND** no Redis-related code SHALL execute

#### Scenario: Dynamic Redis loading
- **WHEN** Redis adapter is configured
- **THEN** socket.io-redis SHALL be loaded via `require()` at runtime
- **AND** it SHALL NOT be a direct dependency in package.json
- **AND** applications without Redis SHALL not install unnecessary dependencies

