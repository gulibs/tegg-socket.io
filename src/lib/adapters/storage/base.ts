/**
 * Base Storage Adapter Interface
 * 定义存储适配器的统一接口
 */

/**
 * Stored message structure
 */
export interface StoredMessage {
  id?: string | number;
  event: string;
  namespace: string;
  room?: string;
  socketId: string;
  userId?: string;
  data: any;
  createdAt: Date | number;
}

/**
 * Message query options
 */
export interface MessageQuery {
  namespace?: string;
  room?: string;
  socketId?: string;
  userId?: string;
  event?: string;
  startTime?: Date | number;
  endTime?: Date | number;
  limit?: number;
  offset?: number;
}

/**
 * Storage adapter interface
 */
export interface StorageAdapter {
  /**
   * Save a message to storage
   */
  save(message: StoredMessage): Promise<void>;

  /**
   * Find messages matching the query
   */
  find(query: MessageQuery): Promise<StoredMessage[]>;

  /**
   * Delete messages matching the query
   */
  delete(query: MessageQuery): Promise<number>;

  /**
   * Get message count matching the query
   */
  count(query: MessageQuery): Promise<number>;

  /**
   * Close the storage connection
   */
  close(): Promise<void>;
}

