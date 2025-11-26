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
}

/**
 * tegg-socket.io default config
 * @member Config#teggSocketIO
 */
export default () => {
  const config = {} as PowerPartial<EggAppConfig>;

  config.teggSocketIO = {
    init: {},
  } as SocketIOConfig;

  return config;
};
