import './types.js';

// Export all decorators
export {
  // Controller decorators
  SocketIOController,
  SocketIOEvent,

  // Middleware decorators
  ConnectionMiddleware,
  PacketMiddleware,

  // Helper decorators
  Room,
  Broadcast,
  Subscribe,

  // Performance monitor
  PerformanceMonitor,
  getAllPerformanceMetrics,
  getPerformanceMetrics,
  clearPerformanceMetrics,

  // Rate limit
  RateLimit,
  getRateLimitRemaining,
  clearRateLimits,

  // Message storage
  MessageStorage,
} from './lib/decorators/index.js';

// Export decorator types
export type {
  // Controller types
  SocketIOControllerOptions,
  SocketIOControllerMetadata,
  SocketIOEventOptions,
  SocketIOEventMetadata,

  // Middleware types
  ConnectionMiddlewareOptions,
  ConnectionMiddlewareMetadata,
  PacketMiddlewareOptions,
  PacketMiddlewareMetadata,

  // Helper types
  RoomOptions,
  RoomMetadata,
  RoomNameResolver,
  BroadcastOptions,
  BroadcastMetadata,
  SubscribeOptions,
  SubscribeMetadata,
  SocketIOSystemEvent,

  // Performance monitor types
  PerformanceMonitorOptions,
  PerformanceMonitorMetadata,
  PerformanceMetrics,
  PerformanceMetric,

  // Rate limit types
  RateLimitOptions,
  RateLimitMetadata,
  RateLimitKey,

  // Message storage types
  MessageStorageOptions,
  MessageStorageMetadata,
  StorageAdapterType,
} from './lib/decorators/index.js';

// Export utility functions for advanced usage
export {
  isSocketIOController,
  getSocketIOControllerMetadata,
  getAllSocketIOEvents,
  isConnectionMiddleware,
  isPacketMiddleware,
  getConnectionMiddlewareMetadata,
  getPacketMiddlewareMetadata,
} from './lib/decorators/index.js';
