/**
 * Redis Storage Adapter
 * 使用 Redis 存储消息（适合缓存和临时存储）
 * 
 * Note: Redis adapter requires @gulibs/tegg-sequelize plugin to be installed
 * (for dependency checking), but uses app.redis (from egg-redis) for actual operations
 */

import type { Application } from 'egg';
import type { StorageAdapter, StoredMessage, MessageQuery } from './base.js';

/**
 * Check if message storage is enabled
 */
function isMessageStorageEnabled(app: Application): boolean {
  const config = app.config.teggSocketIO as any;
  return config?.messageStorage?.enabled === true;
}

/**
 * Check if @gulibs/tegg-sequelize is installed
 */
function checkSequelizePlugin(app: Application): boolean {
  try {
    return !!(app.teggSequelize || app.teggSequelizes);
  } catch {
    return false;
  }
}

/**
 * Redis adapter options
 */
export interface RedisAdapterOptions {
  /**
   * Application instance (for accessing Redis)
   */
  app: Application;
  /**
   * Sequelize client name (for multi-client support)
   * If not provided, uses the default client (app.teggSequelize)
   * @example 'redis' | 'redis-cache' | 'default'
   */
  clientName?: string;
  /**
   * Key prefix
   * @default 'socket:message:'
   */
  keyPrefix?: string;
  /**
   * TTL in milliseconds (0 = no expiration)
   * @default 86400000 (24 hours)
   */
  ttl?: number;
}

/**
 * Redis Storage Adapter
 */
export class RedisAdapter implements StorageAdapter {
  private keyPrefix: string;
  private ttl: number;
  private app: Application;
  private clientName?: string;

  constructor(options: RedisAdapterOptions) {
    this.app = options.app;
    this.clientName = options.clientName;
    this.keyPrefix = options.keyPrefix || 'socket:message:';
    this.ttl = options.ttl ?? 86400000; // 24 hours default

    // Only check dependencies if message storage is enabled
    if (isMessageStorageEnabled(this.app)) {
      if (!checkSequelizePlugin(this.app)) {
        throw new Error(
          '@gulibs/tegg-sequelize plugin is not installed or enabled. ' +
          'Please install it: npm install @gulibs/tegg-sequelize ' +
          'and enable it in config/plugin.js'
        );
      }
    }
  }

  private getRedis() {
    // Get Redis client through tegg-sequelize
    // User should configure Redis client via tegg-sequelize customFactory
    // Example: config.teggSequelize.clients.redis with customFactory returning Redis client
    if (!isMessageStorageEnabled(this.app)) {
      throw new Error('Message storage is not enabled. Set config.teggSocketIO.messageStorage.enabled = true');
    }

    if (!checkSequelizePlugin(this.app)) {
      throw new Error('@gulibs/tegg-sequelize plugin is not installed or enabled.');
    }

    // If clientName is specified, try to get from multi-client mode first
    if (this.clientName && this.clientName !== 'default') {
      if (this.app.teggSequelizes) {
        const redisClient = this.app.teggSequelize || this.app.teggSequelizes.getSingletonInstance(this.clientName);
        if (redisClient) {
          // The client returned from customFactory should be the actual Redis client
          return redisClient as any;
        }
      }
      throw new Error(
        `Redis client "${this.clientName}" not found in tegg-sequelize. ` +
        `Please configure Redis client in config.teggSequelize.clients.${this.clientName} with customFactory.`
      );
    }

    // If no clientName or clientName is 'default', use default client
    if (this.app.teggSequelize) {
      return this.app.teggSequelize as any;
    }

    throw new Error(
      'Redis client not found in tegg-sequelize. ' +
      'Please configure Redis client in config.teggSequelize.client with customFactory, ' +
      'or specify clientName option to use a specific client from config.teggSequelize.clients.'
    );
  }

  private getKey(id: string | number): string {
    return `${this.keyPrefix}${id}`;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async save(message: StoredMessage): Promise<void> {
    try {
      const redis = this.getRedis();
      const id = message.id?.toString() || this.generateId();
      const key = this.getKey(id);

      const data = {
        id,
        event: message.event,
        namespace: message.namespace,
        room: message.room || '',
        socketId: message.socketId,
        userId: message.userId || '',
        data: message.data,
        createdAt: (message.createdAt instanceof Date ? message.createdAt.getTime() : message.createdAt) || Date.now(),
      };

      const serialized = JSON.stringify(data);

      if (this.ttl > 0) {
        await redis.setex(key, Math.floor(this.ttl / 1000), serialized);
      } else {
        await redis.set(key, serialized);
      }

      // Also add to index sets for querying
      if (message.namespace) {
        await redis.sadd(`${this.keyPrefix}index:namespace:${message.namespace}`, id);
      }
      if (message.room) {
        await redis.sadd(`${this.keyPrefix}index:room:${message.room}`, id);
      }
      if (message.socketId) {
        await redis.sadd(`${this.keyPrefix}index:socket:${message.socketId}`, id);
      }
      if (message.userId) {
        await redis.sadd(`${this.keyPrefix}index:user:${message.userId}`, id);
      }
      if (message.event) {
        await redis.sadd(`${this.keyPrefix}index:event:${message.event}`, id);
      }
    } catch (error) {
      this.app.logger.error('[RedisAdapter] Failed to save message:', error);
      throw error;
    }
  }

  async find(query: MessageQuery): Promise<StoredMessage[]> {
    try {
      const redis = this.getRedis();
      const ids = new Set<string>();

      // Get IDs from index sets
      if (query.namespace) {
        const namespaceIds = await redis.smembers(`${this.keyPrefix}index:namespace:${query.namespace}`);
        namespaceIds.forEach((id: string) => ids.add(id));
      }
      if (query.room) {
        const roomIds = await redis.smembers(`${this.keyPrefix}index:room:${query.room}`);
        if (ids.size > 0) {
          // Intersect with existing IDs
          const roomIdSet = new Set(roomIds);
          ids.forEach((id) => {
            if (!roomIdSet.has(id)) {
              ids.delete(id);
            }
          });
        } else {
          roomIds.forEach((id: string) => ids.add(id));
        }
      }
      if (query.socketId) {
        const socketIds = await redis.smembers(`${this.keyPrefix}index:socket:${query.socketId}`);
        if (ids.size > 0) {
          const socketIdSet = new Set(socketIds);
          ids.forEach((id) => {
            if (!socketIdSet.has(id)) {
              ids.delete(id);
            }
          });
        } else {
          socketIds.forEach((id: string) => ids.add(id));
        }
      }
      if (query.userId) {
        const userIds = await redis.smembers(`${this.keyPrefix}index:user:${query.userId}`);
        if (ids.size > 0) {
          const userIdSet = new Set(userIds);
          ids.forEach((id) => {
            if (!userIdSet.has(id)) {
              ids.delete(id);
            }
          });
        } else {
          userIds.forEach((id: string) => ids.add(id));
        }
      }
      if (query.event) {
        const eventIds = await redis.smembers(`${this.keyPrefix}index:event:${query.event}`);
        if (ids.size > 0) {
          const eventIdSet = new Set(eventIds);
          ids.forEach((id) => {
            if (!eventIdSet.has(id)) {
              ids.delete(id);
            }
          });
        } else {
          eventIds.forEach((id: string) => ids.add(id));
        }
      }

      // If no filters, we can't efficiently query all messages in Redis
      // This is a limitation of this simple implementation
      if (ids.size === 0 && (query.namespace || query.room || query.socketId || query.userId || query.event)) {
        return [];
      }

      // Fetch messages
      const results: StoredMessage[] = [];
      const idArray = Array.from(ids);
      const limit = query.limit || idArray.length;
      const offset = query.offset || 0;
      const slicedIds = idArray.slice(offset, offset + limit);

      for (const id of slicedIds) {
        const key = this.getKey(id);
        const data = await redis.get(key);
        if (data) {
          const parsed = JSON.parse(data);
          // Apply time filters
          if (query.startTime || query.endTime) {
            const createdAt = parsed.createdAt;
            if (query.startTime && createdAt < (query.startTime instanceof Date ? query.startTime.getTime() : query.startTime)) {
              continue;
            }
            if (query.endTime && createdAt > (query.endTime instanceof Date ? query.endTime.getTime() : query.endTime)) {
              continue;
            }
          }
          results.push({
            id: parsed.id,
            event: parsed.event,
            namespace: parsed.namespace,
            room: parsed.room || undefined,
            socketId: parsed.socketId,
            userId: parsed.userId || undefined,
            data: parsed.data,
            createdAt: parsed.createdAt,
          });
        }
      }

      // Sort by createdAt descending
      results.sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt;
        return bTime - aTime;
      });

      return results;
    } catch (error) {
      this.app.logger.error('[RedisAdapter] Failed to find messages:', error);
      throw error;
    }
  }

  async delete(query: MessageQuery): Promise<number> {
    try {
      const messages = await this.find(query);
      const redis = this.getRedis();
      let deleted = 0;

      for (const message of messages) {
        const id = message.id?.toString();
        if (id) {
          const key = this.getKey(id);
          await redis.del(key);
          // Remove from index sets
          await redis.srem(`${this.keyPrefix}index:namespace:${message.namespace}`, id);
          if (message.room) {
            await redis.srem(`${this.keyPrefix}index:room:${message.room}`, id);
          }
          await redis.srem(`${this.keyPrefix}index:socket:${message.socketId}`, id);
          if (message.userId) {
            await redis.srem(`${this.keyPrefix}index:user:${message.userId}`, id);
          }
          await redis.srem(`${this.keyPrefix}index:event:${message.event}`, id);
          deleted++;
        }
      }

      return deleted;
    } catch (error) {
      this.app.logger.error('[RedisAdapter] Failed to delete messages:', error);
      throw error;
    }
  }

  async count(query: MessageQuery): Promise<number> {
    try {
      const messages = await this.find(query);
      return messages.length;
    } catch (error) {
      this.app.logger.error('[RedisAdapter] Failed to count messages:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    // Redis connection is managed by redis plugin
    // No need to close explicitly
  }
}

