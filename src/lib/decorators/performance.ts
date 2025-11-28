/**
 * Performance Monitor Decorator
 * @PerformanceMonitor - Method decorator for performance monitoring
 */

import type { Context } from 'egg';
import {
  SOCKETIO_PERFORMANCE_KEY,
  setMetadata,
  getMetadata,
  MethodMetadataRegistry,
  type Constructor,
} from './metadata.js';

/**
 * Performance metrics to collect
 */
export type PerformanceMetric = 'duration' | 'count' | 'errorRate' | 'throughput';

/**
 * Options for @PerformanceMonitor decorator
 */
export interface PerformanceMonitorOptions {
  /**
   * Whether performance monitoring is enabled
   * @default true
   */
  enabled?: boolean;
  /**
   * Sampling rate (0.0 to 1.0)
   * 1.0 means monitor all requests, 0.5 means monitor 50% of requests
   * @default 1.0
   */
  sampleRate?: number;
  /**
   * Metrics to collect
   * @default ['duration', 'count', 'errorRate']
   */
  metrics?: PerformanceMetric[];
  /**
   * Log performance metrics to logger
   * @default false
   */
  logMetrics?: boolean;
  /**
   * Custom callback for handling metrics
   */
  onMetrics?: (metrics: PerformanceMetrics) => void | Promise<void>;
}

/**
 * Performance metrics data
 */
export interface PerformanceMetrics {
  methodName: string;
  event: string;
  duration: number;
  count: number;
  errorCount: number;
  errorRate: number;
  throughput: number; // requests per second
  timestamp: number;
}

/**
 * Metadata stored by @PerformanceMonitor decorator
 */
export interface PerformanceMonitorMetadata extends PerformanceMonitorOptions {
  methodName: string;
}

/**
 * Registry for performance monitor metadata
 */
export const PerformanceMonitorMetadataRegistry = new MethodMetadataRegistry<PerformanceMonitorMetadata>();

/**
 * Performance metrics storage (in-memory, can be extended to use external storage)
 */
class PerformanceMetricsStore {
  private metrics = new Map<string, PerformanceMetrics>();

  update(key: string, metrics: Partial<PerformanceMetrics>): void {
    const existing = this.metrics.get(key) || {
      methodName: metrics.methodName || '',
      event: metrics.event || '',
      duration: 0,
      count: 0,
      errorCount: 0,
      errorRate: 0,
      throughput: 0,
      timestamp: Date.now(),
    };

    this.metrics.set(key, {
      ...existing,
      ...metrics,
      timestamp: Date.now(),
    });
  }

  get(key: string): PerformanceMetrics | undefined {
    return this.metrics.get(key);
  }

  getAll(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  clear(): void {
    this.metrics.clear();
  }
}

const metricsStore = new PerformanceMetricsStore();

/**
 * Get performance monitor metadata from a method
 */
export function getPerformanceMonitorMetadata(method: object): PerformanceMonitorMetadata | undefined {
  return getMetadata<PerformanceMonitorMetadata>(method, SOCKETIO_PERFORMANCE_KEY);
}

/**
 * @PerformanceMonitor - Method decorator for performance monitoring
 *
 * Monitors method execution time, call count, error rate, and throughput.
 *
 * @param options - Performance monitor configuration
 *
 * @example
 * ```typescript
 * @SocketIOEvent({ event: 'chat' })
 * @PerformanceMonitor({
 *   enabled: true,
 *   sampleRate: 1.0,
 *   metrics: ['duration', 'count', 'errorRate'],
 *   logMetrics: true
 * })
 * async handleChat(@Context() ctx: any) {
 *   // Method execution will be monitored
 * }
 * ```
 */
export function PerformanceMonitor(options?: PerformanceMonitorOptions): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const methodName = String(propertyKey);

    const metadata: PerformanceMonitorMetadata = {
      enabled: options?.enabled !== false,
      sampleRate: options?.sampleRate ?? 1.0,
      metrics: options?.metrics || ['duration', 'count', 'errorRate'],
      logMetrics: options?.logMetrics ?? false,
      onMetrics: options?.onMetrics,
      methodName,
    };

    // Store metadata
    setMetadata(descriptor.value, SOCKETIO_PERFORMANCE_KEY, metadata);
    PerformanceMonitorMetadataRegistry.set(target.constructor as Constructor, methodName, metadata);

    // Wrap the original method
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      const metadata = getPerformanceMonitorMetadata(originalMethod);
      if (!metadata || !metadata.enabled) {
        return originalMethod.apply(this, args);
      }

      // Sampling check
      const sampleRate = metadata.sampleRate ?? 1.0;
      if (Math.random() > sampleRate) {
        return originalMethod.apply(this, args);
      }

      const startTime = Date.now();
      const ctx = this as Context;
      const eventName = (ctx as any).packet?.[0] || 'unknown';
      const metricsKey = `${(target.constructor as Constructor).name}.${methodName}`;

      let error: Error | undefined;
      let duration = 0;

      try {
        const result = await originalMethod.apply(this, args);
        duration = Date.now() - startTime;
        return result;
      } catch (err) {
        error = err as Error;
        duration = Date.now() - startTime;
        throw err;
      } finally {
        // Update metrics
        const existing = metricsStore.get(metricsKey);
        const count = (existing?.count || 0) + 1;
        const errorCount = (existing?.errorCount || 0) + (error ? 1 : 0);
        const totalDuration = (existing?.duration || 0) + duration;
        const avgDuration = totalDuration / count;
        const errorRate = errorCount / count;
        const throughput = count / ((Date.now() - (existing?.timestamp || startTime)) / 1000);

        const metrics: PerformanceMetrics = {
          methodName,
          event: eventName,
          duration: avgDuration,
          count,
          errorCount,
          errorRate,
          throughput,
          timestamp: Date.now(),
        };

        metricsStore.update(metricsKey, metrics);

        // Log metrics if enabled
        if (metadata.logMetrics && ctx.logger) {
          ctx.logger.info(`[PerformanceMonitor] ${metricsKey}:`, {
            duration: `${avgDuration.toFixed(2)}ms`,
            count,
            errorRate: `${(errorRate * 100).toFixed(2)}%`,
            throughput: `${throughput.toFixed(2)} req/s`,
          });
        }

        // Call custom callback if provided
        if (metadata.onMetrics) {
          try {
            await metadata.onMetrics(metrics);
          } catch (err) {
            if (ctx.logger) {
              ctx.logger.warn('[PerformanceMonitor] onMetrics callback failed:', err);
            }
          }
        }
      }
    };

    return descriptor;
  };
}

/**
 * Get all performance metrics
 */
export function getAllPerformanceMetrics(): PerformanceMetrics[] {
  return metricsStore.getAll();
}

/**
 * Get performance metrics for a specific method
 */
export function getPerformanceMetrics(className: string, methodName: string): PerformanceMetrics | undefined {
  return metricsStore.get(`${className}.${methodName}`);
}

/**
 * Clear all performance metrics
 */
export function clearPerformanceMetrics(): void {
  metricsStore.clear();
}

