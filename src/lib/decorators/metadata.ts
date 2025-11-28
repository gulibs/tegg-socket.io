/**
 * Metadata storage for Socket.IO decorators
 * Provides Symbol-based metadata keys and utilities for storing/retrieving decorator metadata
 */

/**
 * Metadata keys for decorators
 */
export const SOCKETIO_CONTROLLER_KEY = Symbol.for('TEGG-SOCKET.IO#CONTROLLER');
export const SOCKETIO_EVENT_KEY = Symbol.for('TEGG-SOCKET.IO#EVENT');
export const SOCKETIO_CONNECTION_MIDDLEWARE_KEY = Symbol.for('TEGG-SOCKET.IO#CONNECTION_MIDDLEWARE');
export const SOCKETIO_PACKET_MIDDLEWARE_KEY = Symbol.for('TEGG-SOCKET.IO#PACKET_MIDDLEWARE');
export const SOCKETIO_ROOM_KEY = Symbol.for('TEGG-SOCKET.IO#ROOM');
export const SOCKETIO_BROADCAST_KEY = Symbol.for('TEGG-SOCKET.IO#BROADCAST');
export const SOCKETIO_SUBSCRIBE_KEY = Symbol.for('TEGG-SOCKET.IO#SUBSCRIBE');
export const SOCKETIO_PERFORMANCE_KEY = Symbol.for('TEGG-SOCKET.IO#PERFORMANCE');
export const SOCKETIO_RATE_LIMIT_KEY = Symbol.for('TEGG-SOCKET.IO#RATE_LIMIT');
export const SOCKETIO_MESSAGE_STORAGE_KEY = Symbol.for('TEGG-SOCKET.IO#MESSAGE_STORAGE');

/**
 * Type guard for checking if target can hold metadata
 */
export function isMetadataHost(target: unknown): target is Record<symbol, unknown> {
  return (typeof target === 'object' || typeof target === 'function') && target !== null;
}

/**
 * Get metadata from target
 */
export function getMetadata<T>(target: unknown, key: symbol): T | undefined {
  if (!isMetadataHost(target)) {
    return undefined;
  }
  return target[key] as T | undefined;
}

/**
 * Set metadata on target
 */
export function setMetadata<T>(target: unknown, key: symbol, value: T): void {
  if (!isMetadataHost(target)) {
    return;
  }
  (target as Record<symbol, T>)[key] = value;
}

/**
 * Type for class constructors
 */
export type Constructor<T = object> = new (...args: unknown[]) => T;

/**
 * WeakMap registry for storing method-level metadata by class constructor
 */
export class MethodMetadataRegistry<T> {
  private registry = new WeakMap<Constructor, Map<string, T>>();

  set(classConstructor: Constructor, methodName: string, metadata: T): void {
    let methodMap = this.registry.get(classConstructor);
    if (!methodMap) {
      methodMap = new Map();
      this.registry.set(classConstructor, methodMap);
    }
    methodMap.set(methodName, metadata);
  }

  get(classConstructor: Constructor, methodName: string): T | undefined {
    const methodMap = this.registry.get(classConstructor);
    return methodMap?.get(methodName);
  }

  getAll(classConstructor: Constructor): Map<string, T> | undefined {
    return this.registry.get(classConstructor);
  }

  has(classConstructor: Constructor, methodName: string): boolean {
    const methodMap = this.registry.get(classConstructor);
    return methodMap?.has(methodName) ?? false;
  }
}

