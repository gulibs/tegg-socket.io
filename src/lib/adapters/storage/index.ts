/**
 * Storage Adapters
 * Export all storage adapters
 */

export {
  MySQLAdapter,
  type MySQLAdapterOptions,
} from './mysql.js';

export {
  MongoDBAdapter,
  type MongoDBAdapterOptions,
} from './mongodb.js';

export {
  RedisAdapter,
  type RedisAdapterOptions,
} from './redis.js';

export type {
  StorageAdapter,
  StoredMessage,
  MessageQuery,
} from './base.js';

