import { EggAppConfig, PowerPartial } from 'egg';
import type { ServerOptions } from 'socket.io';
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
 * Message storage configuration
 */
export interface MessageStorageConfig {
  /**
   * Whether message storage is enabled
   * @default false
   */
  enabled?: boolean;
}

/**
 * Connection limit configuration
 */
export interface ConnectionLimitConfig {
  /**
   * Maximum number of connections allowed per namespace
   * 0 or undefined means no limit
   * @default undefined (no limit)
   */
  maxConnections?: number;
  /**
   * Message to send when connection limit is exceeded
   * @default 'Connection limit exceeded'
   */
  message?: string;
}

/**
 * Socket.IO plugin configuration
 */
export interface SocketIOConfig {
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
  /**
   * Legacy namespace configuration support
   * Keeps backward compatibility with @egg/socket.io style configs
   */
  namespace?: Record<string, {
    connectionMiddleware?: string[];
    packetMiddleware?: string[];
  }>;
  /**
   * Message storage configuration
   * Controls whether message persistence is enabled
   */
  messageStorage?: MessageStorageConfig;
  /**
   * Connection limit configuration
   * Controls maximum number of connections per namespace
   */
  connectionLimit?: ConnectionLimitConfig;
}

/**
 * tegg-socket.io default config
 * @member Config#teggSocketIO
 */
export default () => {
  const config = {} as PowerPartial<EggAppConfig>;

  config.teggSocketIO = {
    init: {},
    messageStorage: {
      enabled: false,
    },
  } as SocketIOConfig;

  return config;
};
