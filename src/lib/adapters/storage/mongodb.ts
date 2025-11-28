/**
 * MongoDB Storage Adapter
 * 使用 MongoDB 存储消息
 * 
 * Note: MongoDB adapter requires @gulibs/tegg-sequelize plugin to be installed
 * (for dependency checking), but uses app.mongoose (from egg-mongoose) for actual operations
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
 * MongoDB adapter options
 */
export interface MongoDBAdapterOptions {
  /**
   * Application instance (for accessing database)
   */
  app: Application;
  /**
   * Sequelize client name (for multi-client support)
   * If not provided, uses the default client (app.teggSequelize)
   * @example 'mongodb' | 'mongo-primary' | 'default'
   */
  clientName?: string;
  /**
   * Collection name
   * @default 'socket_messages'
   */
  collection?: string;
}

/**
 * MongoDB Storage Adapter
 */
export class MongoDBAdapter implements StorageAdapter {
  private collection: string;
  private app: Application;
  private clientName?: string;

  constructor(options: MongoDBAdapterOptions) {
    this.app = options.app;
    this.clientName = options.clientName;
    this.collection = options.collection || 'socket_messages';

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

  private getCollection() {
    // Get MongoDB client through tegg-sequelize
    // User should configure MongoDB client via tegg-sequelize customFactory
    // Example: config.teggSequelize.clients.mongodb with customFactory returning Mongoose instance
    if (!isMessageStorageEnabled(this.app)) {
      throw new Error('Message storage is not enabled. Set config.teggSocketIO.messageStorage.enabled = true');
    }

    if (!checkSequelizePlugin(this.app)) {
      throw new Error('@gulibs/tegg-sequelize plugin is not installed or enabled.');
    }

    // If clientName is specified, try to get from multi-client mode first
    if (this.clientName && this.clientName !== 'default') {
      if (this.app.teggSequelizes) {
        const mongooseClient = this.app.teggSequelize || this.app.teggSequelizes.getSingletonInstance(this.clientName);
        if (mongooseClient) {
          // The client returned from customFactory should be the actual Mongoose instance
          const mongoose = mongooseClient as any;
          if (mongoose && mongoose.connection && mongoose.connection.db) {
            return mongoose.connection.db.collection(this.collection);
          }
        }
      }
      throw new Error(
        `MongoDB client "${this.clientName}" not found in tegg-sequelize. ` +
        `Please configure MongoDB client in config.teggSequelize.clients.${this.clientName} with customFactory. ` +
        `The customFactory should return a Mongoose instance with connection.db.`
      );
    }

    // If no clientName or clientName is 'default', use default client
    if (this.app.teggSequelize) {
      const mongoose = this.app.teggSequelize as any;
      if (mongoose && mongoose.connection && mongoose.connection.db) {
        return mongoose.connection.db.collection(this.collection);
      }
    }

    throw new Error(
      'MongoDB client not found in tegg-sequelize. ' +
      'Please configure MongoDB client in config.teggSequelize.client with customFactory, ' +
      'or specify clientName option to use a specific client from config.teggSequelize.clients. ' +
      'The customFactory should return a Mongoose instance with connection.db.'
    );
  }

  async save(message: StoredMessage): Promise<void> {
    try {
      const collection = this.getCollection();
      await collection.insertOne({
        event: message.event,
        namespace: message.namespace,
        room: message.room,
        socketId: message.socketId,
        userId: message.userId,
        data: message.data,
        createdAt: message.createdAt || new Date(),
      });
    } catch (error) {
      this.app.logger.error('[MongoDBAdapter] Failed to save message:', error);
      throw error;
    }
  }

  async find(query: MessageQuery): Promise<StoredMessage[]> {
    try {
      const collection = this.getCollection();
      const filter: any = {};

      if (query.namespace) {
        filter.namespace = query.namespace;
      }
      if (query.room) {
        filter.room = query.room;
      }
      if (query.socketId) {
        filter.socketId = query.socketId;
      }
      if (query.userId) {
        filter.userId = query.userId;
      }
      if (query.event) {
        filter.event = query.event;
      }
      if (query.startTime || query.endTime) {
        filter.createdAt = {};
        if (query.startTime) {
          filter.createdAt.$gte = query.startTime;
        }
        if (query.endTime) {
          filter.createdAt.$lte = query.endTime;
        }
      }

      const options: any = {
        sort: { createdAt: -1 },
      };

      if (query.limit) {
        options.limit = query.limit;
      }
      if (query.offset) {
        options.skip = query.offset;
      }

      const results = await collection.find(filter, options).toArray();
      return results.map((doc: any) => ({
        id: doc._id.toString(),
        event: doc.event,
        namespace: doc.namespace,
        room: doc.room,
        socketId: doc.socketId,
        userId: doc.userId,
        data: doc.data,
        createdAt: doc.createdAt,
      }));
    } catch (error) {
      this.app.logger.error('[MongoDBAdapter] Failed to find messages:', error);
      throw error;
    }
  }

  async delete(query: MessageQuery): Promise<number> {
    try {
      const collection = this.getCollection();
      const filter: any = {};

      if (query.namespace) {
        filter.namespace = query.namespace;
      }
      if (query.room) {
        filter.room = query.room;
      }
      if (query.socketId) {
        filter.socketId = query.socketId;
      }
      if (query.userId) {
        filter.userId = query.userId;
      }
      if (query.event) {
        filter.event = query.event;
      }
      if (query.startTime || query.endTime) {
        filter.createdAt = {};
        if (query.startTime) {
          filter.createdAt.$gte = query.startTime;
        }
        if (query.endTime) {
          filter.createdAt.$lte = query.endTime;
        }
      }

      const result = await collection.deleteMany(filter);
      return result.deletedCount || 0;
    } catch (error) {
      this.app.logger.error('[MongoDBAdapter] Failed to delete messages:', error);
      throw error;
    }
  }

  async count(query: MessageQuery): Promise<number> {
    try {
      const collection = this.getCollection();
      const filter: any = {};

      if (query.namespace) {
        filter.namespace = query.namespace;
      }
      if (query.room) {
        filter.room = query.room;
      }
      if (query.socketId) {
        filter.socketId = query.socketId;
      }
      if (query.userId) {
        filter.userId = query.userId;
      }
      if (query.event) {
        filter.event = query.event;
      }
      if (query.startTime || query.endTime) {
        filter.createdAt = {};
        if (query.startTime) {
          filter.createdAt.$gte = query.startTime;
        }
        if (query.endTime) {
          filter.createdAt.$lte = query.endTime;
        }
      }

      return await collection.countDocuments(filter);
    } catch (error) {
      this.app.logger.error('[MongoDBAdapter] Failed to count messages:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    // MongoDB connection is managed by mongoose plugin
    // No need to close explicitly
  }
}

