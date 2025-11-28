/**
 * MySQL/PostgreSQL Storage Adapter
 * 使用 Sequelize ORM 存储消息
 * 需要用户提供 Sequelize Model 实例
 */

import type { Application } from 'egg';
import type { StorageAdapter, StoredMessage, MessageQuery } from './base.js';
import type { ModelCtor, Model, Sequelize } from '@gulibs/tegg-sequelize';
import { Op, WhereOptions } from 'sequelize';

/**
 * MySQL adapter options
 */
export interface MySQLAdapterOptions {
  /**
   * Application instance (for accessing database)
   */
  app: Application;
  /**
   * Sequelize client name (for multi-client support)
   * If not provided, uses the default client (app.teggSequelize)
   * @example 'mysql' | 'postgres' | 'default'
   */
  clientName?: string;
  /**
   * Model name or Model class for storing messages
   * If string, will look up from sequelize.models[modelName]
   * If Model class, will use it directly
   * @example 'SocketMessage' or SocketMessageModel
   */
  model: string | ModelCtor<Model>;
}

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
    // Check if teggSequelize or teggSequelizes exists
    return !!(app.teggSequelize || app.teggSequelizes);
  } catch {
    return false;
  }
}

/**
 * Get Sequelize instance from app
 * Supports both single-client and multi-client modes
 */
function getSequelizeInstance(app: Application, clientName?: string): Sequelize {
  if (!checkSequelizePlugin(app)) {
    throw new Error(
      '@gulibs/tegg-sequelize plugin is not installed or enabled. ' +
      'Please install it: npm install @gulibs/tegg-sequelize ' +
      'and enable it in config/plugin.js'
    );
  }

  // If no clientName specified, use default client
  if (!clientName || clientName === 'default') {
    if (!app.teggSequelize) {
      throw new Error(
        'Default Sequelize client not found. ' +
        'Make sure config.teggSequelize.client is configured.'
      );
    }
    return app.teggSequelize;
  }

  // If clientName is specified, try to get from multi-client mode first
  if (app.teggSequelizes) {
    const client = app.teggSequelize || app.teggSequelizes.getSingletonInstance(clientName);
    if (client) {
      return client;
    }
    // If not found in multi-client mode, fall back to default
    if (app.teggSequelize) {
      return app.teggSequelize;
    }
    throw new Error(
      `Sequelize client "${clientName}" not found in multi-client mode, ` +
      `and default client is also not available. ` +
      `Make sure config.teggSequelize.clients.${clientName} is configured or use default client.`
    );
  }

  // If no multi-client mode, use default client
  if (app.teggSequelize) {
    return app.teggSequelize;
  }

  throw new Error(
    `Sequelize client "${clientName}" not found. ` +
    `Multi-client mode is not configured (no app.teggSequelizes), ` +
    `and default client is also not available. ` +
    `Make sure config.teggSequelize.client or config.teggSequelize.clients is configured.`
  );
}

/**
 * Get Model from Sequelize instance
 */
function getModel(sequelize: Sequelize, model: string | ModelCtor<Model>): ModelCtor<Model> {
  if (typeof model === 'string') {
    // Look up by name
    const ModelClass = sequelize.models[model];
    if (!ModelClass) {
      throw new Error(
        `Model "${model}" not found in Sequelize instance. ` +
        `Available models: ${Object.keys(sequelize.models).join(', ')}. ` +
        `Make sure the model is defined and loaded in config.teggSequelize.models.`
      );
    }
    return ModelClass as ModelCtor<Model>;
  } else {
    // Use provided Model class
    return model;
  }
}

/**
 * MySQL Storage Adapter using Sequelize
 */
export class MySQLAdapter implements StorageAdapter {
  private app: Application;
  private clientName?: string;
  private model: string | ModelCtor<Model>;
  private sequelize: Sequelize | null = null;
  private modelClass: ModelCtor<Model> | null = null;

  constructor(options: MySQLAdapterOptions) {
    this.app = options.app;
    this.clientName = options.clientName;
    this.model = options.model;

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

  /**
   * Get Sequelize instance and Model class
   */
  private getModelClass(): ModelCtor<Model> {
    if (this.modelClass) {
      return this.modelClass;
    }

    if (!this.sequelize) {
      this.sequelize = getSequelizeInstance(this.app, this.clientName);
    }

    this.modelClass = getModel(this.sequelize, this.model);
    return this.modelClass;
  }

  async save(message: StoredMessage): Promise<void> {
    try {
      const ModelClass = this.getModelClass();
      await ModelClass.create({
        event: message.event,
        namespace: message.namespace || '/',
        room: message.room,
        socketId: message.socketId,
        userId: message.userId,
        data: message.data,
        createdAt: message.createdAt || new Date(),
      } as any);
    } catch (error) {
      this.app.logger.error('[MySQLAdapter] Failed to save message:', error);
      throw error;
    }
  }

  async find(query: MessageQuery): Promise<StoredMessage[]> {
    try {
      const ModelClass = this.getModelClass();
      const where: WhereOptions = {};

      if (query.namespace) {
        where.namespace = query.namespace;
      }
      if (query.room) {
        where.room = query.room;
      }
      if (query.socketId) {
        where.socketId = query.socketId;
      }
      if (query.userId) {
        where.userId = query.userId;
      }
      if (query.event) {
        where.event = query.event;
      }
      if (query.startTime || query.endTime) {
        where.createdAt = {};
        if (query.startTime) {
          where.createdAt[Op.gte] = query.startTime;
        }
        if (query.endTime) {
          where.createdAt[Op.lte] = query.endTime;
        }
      }

      const results = await ModelClass.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: query.limit,
        offset: query.offset,
      });

      return results.map((row: Model) => {
        const data = (row as any).toJSON ? (row as any).toJSON() : row;
        return {
          id: data.id,
          event: data.event,
          namespace: data.namespace,
          room: data.room,
          socketId: data.socketId || data.socket_id,
          userId: data.userId || data.user_id,
          data: data.data,
          createdAt: data.createdAt || data.created_at,
        };
      });
    } catch (error) {
      this.app.logger.error('[MySQLAdapter] Failed to find messages:', error);
      throw error;
    }
  }

  async delete(query: MessageQuery): Promise<number> {
    try {
      const ModelClass = this.getModelClass();
      const where: WhereOptions = {};

      if (query.namespace) {
        where.namespace = query.namespace;
      }
      if (query.room) {
        where.room = query.room;
      }
      if (query.socketId) {
        where.socketId = query.socketId;
      }
      if (query.userId) {
        where.userId = query.userId;
      }
      if (query.event) {
        where.event = query.event;
      }
      if (query.startTime || query.endTime) {
        where.createdAt = {};
        if (query.startTime) {
          where.createdAt[Op.gte] = query.startTime;
        }
        if (query.endTime) {
          where.createdAt[Op.lte] = query.endTime;
        }
      }

      const deletedCount = await ModelClass.destroy({ where });
      return deletedCount;
    } catch (error) {
      this.app.logger.error('[MySQLAdapter] Failed to delete messages:', error);
      throw error;
    }
  }

  async count(query: MessageQuery): Promise<number> {
    try {
      const ModelClass = this.getModelClass();
      const where: WhereOptions = {};

      if (query.namespace) {
        where.namespace = query.namespace;
      }
      if (query.room) {
        where.room = query.room;
      }
      if (query.socketId) {
        where.socketId = query.socketId;
      }
      if (query.userId) {
        where.userId = query.userId;
      }
      if (query.event) {
        where.event = query.event;
      }
      if (query.startTime || query.endTime) {
        where.createdAt = {};
        if (query.startTime) {
          where.createdAt[Op.gte] = query.startTime;
        }
        if (query.endTime) {
          where.createdAt[Op.lte] = query.endTime;
        }
      }

      const count = await ModelClass.count({ where });
      return count;
    } catch (error) {
      this.app.logger.error('[MySQLAdapter] Failed to count messages:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    // Sequelize connection is managed by @gulibs/tegg-sequelize plugin
    // No need to close explicitly
  }
}

