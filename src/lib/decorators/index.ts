/**
 * Socket.IO Decorators
 * Export all decorators and their utilities
 */

// Controller decorators
export {
  SocketIOController,
  SocketIOEvent,
  getSocketIOControllerMetadata,
  getAllSocketIOEvents,
  isSocketIOController,
  isSocketIOEvent,
  getSocketIOEventMetadata,
  EventMetadataRegistry,
} from './controller.js';

export type {
  SocketIOControllerOptions,
  SocketIOControllerMetadata,
  SocketIOEventOptions,
  SocketIOEventMetadata,
} from './controller.js';

// Middleware decorators
export {
  ConnectionMiddleware,
  PacketMiddleware,
  getConnectionMiddlewareMetadata,
  getPacketMiddlewareMetadata,
  isConnectionMiddleware,
  isPacketMiddleware,
  validateMiddlewareClass,
} from './middleware.js';

export type {
  ConnectionMiddlewareOptions,
  ConnectionMiddlewareMetadata,
  PacketMiddlewareOptions,
  PacketMiddlewareMetadata,
} from './middleware.js';

// Helper decorators
export {
  Room,
  Broadcast,
  Subscribe,
  getRoomMetadata,
  getBroadcastMetadata,
  getSubscribeMetadata,
  getAllRoomMetadata,
  getAllBroadcastMetadata,
  getAllSubscribeMetadata,
  RoomMetadataRegistry,
  BroadcastMetadataRegistry,
  SubscribeMetadataRegistry,
} from './helpers.js';

export type {
  RoomOptions,
  RoomMetadata,
  RoomNameResolver,
  BroadcastOptions,
  BroadcastMetadata,
  SubscribeOptions,
  SubscribeMetadata,
  SocketIOSystemEvent,
} from './helpers.js';

// Metadata utilities
export {
  isMetadataHost,
  getMetadata,
  setMetadata,
  MethodMetadataRegistry,
  SOCKETIO_CONTROLLER_KEY,
  SOCKETIO_EVENT_KEY,
  SOCKETIO_CONNECTION_MIDDLEWARE_KEY,
  SOCKETIO_PACKET_MIDDLEWARE_KEY,
  SOCKETIO_ROOM_KEY,
  SOCKETIO_BROADCAST_KEY,
  SOCKETIO_SUBSCRIBE_KEY,
} from './metadata.js';

export type { Constructor } from './metadata.js';

// Performance monitor decorator
export {
  PerformanceMonitor,
  getPerformanceMonitorMetadata,
  getAllPerformanceMetrics,
  getPerformanceMetrics,
  clearPerformanceMetrics,
  PerformanceMonitorMetadataRegistry,
} from './performance.js';

export type {
  PerformanceMonitorOptions,
  PerformanceMonitorMetadata,
  PerformanceMetrics,
  PerformanceMetric,
} from './performance.js';

// Rate limit decorator
export {
  RateLimit,
  getRateLimitMetadata,
  getRateLimitRemaining,
  clearRateLimits,
  RateLimitMetadataRegistry,
} from './rateLimit.js';

export type {
  RateLimitOptions,
  RateLimitMetadata,
  RateLimitKey,
} from './rateLimit.js';

// Message storage decorator
export {
  MessageStorage,
  getMessageStorageMetadata,
  MessageStorageMetadataRegistry,
} from './messageStorage.js';

export type {
  MessageStorageOptions,
  MessageStorageMetadata,
  StorageAdapterType,
} from './messageStorage.js';

