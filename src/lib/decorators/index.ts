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

