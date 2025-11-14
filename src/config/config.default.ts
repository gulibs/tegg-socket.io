import type { ServerOptions } from 'socket.io';

/**
 * Namespace configuration
 * Defines connection and packet middleware for each namespace
 */
export interface NamespaceConfig {
  /**
   * Connection middleware array
   * Executed when a socket connects/disconnects
   */
  connectionMiddleware?: string[];
  /**
   * Packet middleware array
   * Executed on every Socket.IO event packet
   */
  packetMiddleware?: string[];
}

/**
 * Namespace configuration map
 * Key is the namespace path (e.g., '/', '/example')
 */
export interface NamespacesConfig {
  [namespace: string]: NamespaceConfig;
}

/**
 * Redis adapter configuration
 * Used for cluster mode support
 */
export interface RedisConfig {
  host: string;
  port: number;
  auth_pass?: string;
  db?: number;
  [key: string]: unknown;
}

/**
 * Socket.IO plugin configuration
 */
export interface teggSocketIOConfig {
  /**
   * Namespace configuration
   * @default {}
   */
  namespace?: NamespacesConfig;
  /**
   * Redis adapter configuration (optional)
   * Enables cluster mode support
   */
  redis?: RedisConfig;
  /**
   * Options passed to engine.io
   * @default {}
   */
  init?: ServerOptions;
  /**
   * Custom socket ID generator function
   * Must be a synchronous function
   */
  generateId?: (req: unknown) => string;
}

/**
 * egg-tegg-socket.io default config
 * @member Config#teggSocketIO
 */
export default {
  teggSocketIO: {
    namespace: {},
  } as teggSocketIOConfig,
};

declare module '@eggjs/core' {
  // add EggAppConfig overrides types
  interface EggAppConfig {
    teggSocketIO: teggSocketIOConfig;
  }
}
