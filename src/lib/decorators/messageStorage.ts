/**
 * Message Storage Decorator
 * @MessageStorage - Method decorator for automatic message storage
 */

import type { Application, Context } from 'egg';
import type { ModelCtor, Model } from 'sequelize-typescript';
import {
  SOCKETIO_MESSAGE_STORAGE_KEY,
  setMetadata,
  getMetadata,
  MethodMetadataRegistry,
  type Constructor,
} from './metadata.js';
import type { StorageAdapter, StoredMessage } from '../adapters/storage/base.js';
import type { SocketIOConfig } from '../../config/config.default.js';
import {
  MySQLAdapter,
  MongoDBAdapter,
  RedisAdapter,
} from '../adapters/storage/index.js';

/**
 * Storage adapter type
 */
export type StorageAdapterType = 'mysql' | 'mongodb' | 'redis';

/**
 * Options for @MessageStorage decorator
 */
export interface MessageStorageOptions {
  /**
   * Storage adapter type
   * @default 'mysql'
   */
  adapter?: StorageAdapterType;
  /**
   * Table/collection name (for backward compatibility)
   * @default 'socket_messages'
   */
  table?: string;
  /**
   * Whether message storage is enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Events to store (whitelist)
   * If provided, only these events will be stored
   */
  events?: string[];
  /**
   * Events to exclude (blacklist)
   * These events will not be stored even if they match the whitelist
   */
  excludeEvents?: string[];
  /**
   * TTL for Redis adapter (milliseconds)
   * Only applies to Redis adapter
   * @default 86400000 (24 hours)
   */
  ttl?: number;
  /**
   * Sequelize Model name or Model class (for MySQL/PostgreSQL adapter)
   * If string, will look up from sequelize.models[modelName]
   * If Model class, will use it directly
   * @example 'SocketMessage' or SocketMessageModel
   * @required when adapter is 'mysql'
   */
  model?: string | ModelCtor<Model>;
  /**
   * Sequelize client name (for multi-client support)
   * If not provided, uses the default client (app.teggSequelize)
   * @example 'mysql' | 'postgres' | 'default'
   */
  clientName?: string;
}

/**
 * Metadata stored by @MessageStorage decorator
 */
export interface MessageStorageMetadata extends MessageStorageOptions {
  methodName: string;
}

/**
 * Registry for message storage metadata
 */
export const MessageStorageMetadataRegistry = new MethodMetadataRegistry<MessageStorageMetadata>();

/**
 * Storage adapter cache
 */
const adapterCache = new Map<string, StorageAdapter>();

/**
 * Check if message storage is enabled
 */
function isMessageStorageEnabled(app: Application): boolean {
  const config = app.config.teggSocketIO as SocketIOConfig | undefined;
  return config?.messageStorage?.enabled === true;
}

/**
 * Get or create storage adapter
 */
function getStorageAdapter(
  app: Application,
  adapterType: StorageAdapterType = 'mysql',
  options: {
    table?: string;
    model?: string | ModelCtor<Model>;
    clientName?: string;
    ttl?: number;
  } = {}
): StorageAdapter {
  // Check if message storage is enabled first
  if (!isMessageStorageEnabled(app)) {
    throw new Error(
      'Message storage is not enabled. ' +
      'Please set config.teggSocketIO.messageStorage.enabled = true to use message persistence.'
    );
  }

  const { table, model, clientName, ttl } = options;
  const cacheKey = `${adapterType}:${clientName || 'default'}:${model || table || 'default'}`;

  if (adapterCache.has(cacheKey)) {
    return adapterCache.get(cacheKey)!;
  }

  let adapter: StorageAdapter;

  switch (adapterType) {
    case 'mysql':
      if (!model && !table) {
        throw new Error(
          'MySQL adapter requires either "model" (Sequelize Model name or class) or "table" option. ' +
          'Please provide a Model name/class in @MessageStorage({ adapter: "mysql", model: "SocketMessage" })'
        );
      }
      adapter = new MySQLAdapter({
        app,
        model: model || table || 'SocketMessage', // Use table as model name fallback
        clientName,
      });
      break;
    case 'mongodb':
      adapter = new MongoDBAdapter({
        app,
        clientName,
        collection: table || 'socket_messages',
      });
      break;
    case 'redis':
      adapter = new RedisAdapter({
        app,
        clientName,
        keyPrefix: `${table || 'socket_messages'}:`,
        ttl: ttl || 86400000, // 24 hours default
      });
      break;
    default:
      throw new Error(`Unsupported storage adapter type: ${adapterType}`);
  }

  adapterCache.set(cacheKey, adapter);
  return adapter;
}

/**
 * Get message storage metadata from a method
 */
export function getMessageStorageMetadata(method: object): MessageStorageMetadata | undefined {
  return getMetadata<MessageStorageMetadata>(method, SOCKETIO_MESSAGE_STORAGE_KEY);
}

/**
 * @MessageStorage - Method decorator for automatic message storage
 *
 * Automatically saves messages to the configured database.
 *
 * @param options - Message storage configuration
 *
 * @example
 * ```typescript
 * // Example 1: Using Model name (recommended)
 * @SocketIOEvent({ event: 'chat' })
 * @MessageStorage({
 *   adapter: 'mysql',
 *   model: 'SocketMessage', // Model name from sequelize.models
 *   clientName: 'mysql', // Optional: for multi-client support
 *   enabled: true
 * })
 * async handleChat(@Context() ctx: any) {
 *   // Message will be automatically saved using Sequelize Model
 * }
 *
 * // Example 2: Using Model class
 * import { SocketMessage } from './models/SocketMessage';
 * @SocketIOEvent({ event: 'chat' })
 * @MessageStorage({
 *   adapter: 'mysql',
 *   model: SocketMessage, // Model class directly
 *   enabled: true
 * })
 * async handleChat(@Context() ctx: any) {
 *   // Message will be automatically saved
 * }
 * ```
 */
export function MessageStorage(options?: MessageStorageOptions): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const methodName = String(propertyKey);

    const metadata: MessageStorageMetadata = {
      adapter: options?.adapter || 'mysql',
      table: options?.table || 'socket_messages',
      enabled: options?.enabled !== false,
      events: options?.events,
      excludeEvents: options?.excludeEvents,
      ttl: options?.ttl,
      model: options?.model,
      clientName: options?.clientName,
      methodName,
    };

    // Store metadata
    setMetadata(descriptor.value, SOCKETIO_MESSAGE_STORAGE_KEY, metadata);
    MessageStorageMetadataRegistry.set(target.constructor as Constructor, methodName, metadata);

    // Wrap the original method
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: Context, ...args: unknown[]) {
      const metadata = getMessageStorageMetadata(originalMethod);
      if (!metadata || !metadata.enabled) {
        return originalMethod.apply(this, args);
      }

      const ctx = this;
      const app = ctx.app;
      const eventName = ctx.packet?.[0] || 'unknown';

      // Check if message storage is enabled in config
      // This check is done early to avoid unnecessary work
      if (!isMessageStorageEnabled(app)) {
        // Message storage is disabled, skip
        return originalMethod.apply(this, args);
      }

      // Check if event should be stored
      if (metadata.events && !metadata.events.includes(eventName)) {
        return originalMethod.apply(this, args);
      }
      if (metadata.excludeEvents && metadata.excludeEvents.includes(eventName)) {
        return originalMethod.apply(this, args);
      }

      // Call original method first
      const result = await originalMethod.apply(this, args);
      // Save message to storage (async, don't wait)
      setImmediate(async () => {
        try {
          // Skip if socket is not available (should not happen in Socket.IO context)
          if (!ctx.socket) {
            app.logger.warn('[MessageStorage] Socket not available, skipping message storage');
            return;
          }

          const adapter = getStorageAdapter(app, metadata.adapter, {
            table: metadata.table,
            model: metadata.model,
            clientName: metadata.clientName,
            ttl: metadata.ttl,
          });

          // Extract namespace from socket if available
          const namespace = ctx.socket.nsp?.name || '/';
          // Extract room from socket rooms if available
          const rooms = Array.from(ctx.socket.rooms);
          const room = rooms.length > 1 ? rooms.find(r => r !== ctx.socket!.id) : undefined;

          const message: StoredMessage = {
            event: eventName,
            namespace,
            room,
            socketId: ctx.socket.id,
            userId: (ctx.state as { user?: { id?: string } })?.user?.id || (ctx.socket as { userId?: string }).userId,
            data: ctx.args?.[0] || result,
            createdAt: new Date(),
          };

          await adapter.save(message);
        } catch (error) {
          app.logger.error('[MessageStorage] Failed to save message:', error);
        }
      });

      return result;
    };

    return descriptor;
  };
}

