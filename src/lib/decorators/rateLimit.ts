/**
 * Rate Limit Decorator
 * @RateLimit - Method decorator for rate limiting
 */

import type { Context } from 'egg';
import {
    SOCKETIO_RATE_LIMIT_KEY,
    setMetadata,
    getMetadata,
    MethodMetadataRegistry,
    type Constructor,
} from './metadata.js';

/**
 * Rate limit key type
 */
export type RateLimitKey = 'socket' | 'user' | 'ip' | ((ctx: Context) => string | Promise<string>);

/**
 * Options for @RateLimit decorator
 */
export interface RateLimitOptions {
    /**
     * Maximum number of requests allowed
     * @default 10
     */
    max?: number;
    /**
     * Time window in milliseconds or string format (e.g., '1m', '1h')
     * @default 60000 (1 minute)
     */
    window?: number | string;
    /**
     * Key to identify the rate limit scope
     * - 'socket': Based on socket ID
     * - 'user': Based on user ID (from ctx.state.user or ctx.socket.userId)
     * - 'ip': Based on IP address
     * - Function: Custom key generator
     * @default 'socket'
     */
    key?: RateLimitKey;
    /**
     * Message to send when rate limit is exceeded
     * @default 'Rate limit exceeded'
     */
    message?: string;
    /**
     * Whether to skip rate limiting (useful for testing)
     * @default false
     */
    skip?: boolean;
}

/**
 * Metadata stored by @RateLimit decorator
 */
export interface RateLimitMetadata extends RateLimitOptions {
    methodName: string;
}

/**
 * Registry for rate limit metadata
 */
export const RateLimitMetadataRegistry = new MethodMetadataRegistry<RateLimitMetadata>();

/**
 * Rate limit entry
 */
interface RateLimitEntry {
    count: number;
    resetTime: number;
}

/**
 * Rate limit store (in-memory, can be extended to use Redis for distributed systems)
 */
class RateLimitStore {
    private store = new Map<string, RateLimitEntry>();

    /**
     * Parse window string to milliseconds
     */
    private parseWindow(window: number | string): number {
        if (typeof window === 'number') {
            return window;
        }

        const match = window.match(/^(\d+)([smhd])$/);
        if (!match) {
            return 60000; // Default to 1 minute
        }

        const value = parseInt(match[1], 10);
        const unit = match[2];

        switch (unit) {
            case 's':
                return value * 1000;
            case 'm':
                return value * 60 * 1000;
            case 'h':
                return value * 60 * 60 * 1000;
            case 'd':
                return value * 24 * 60 * 60 * 1000;
            default:
                return 60000;
        }
    }

    /**
     * Check if request is allowed
     */
    async check(key: string, max: number, window: number | string): Promise<boolean> {
        const windowMs = this.parseWindow(window);
        const now = Date.now();
        const entry = this.store.get(key);

        if (!entry || now >= entry.resetTime) {
            // Create new entry or reset expired entry
            this.store.set(key, {
                count: 1,
                resetTime: now + windowMs,
            });
            return true;
        }

        if (entry.count >= max) {
            return false; // Rate limit exceeded
        }

        // Increment count
        entry.count++;
        return true;
    }

    /**
     * Get remaining requests
     */
    getRemaining(key: string, max: number): number {
        const entry = this.store.get(key);
        if (!entry) {
            return max;
        }
        return Math.max(0, max - entry.count);
    }

    /**
     * Get reset time
     */
    getResetTime(key: string): number | null {
        const entry = this.store.get(key);
        return entry ? entry.resetTime : null;
    }

    /**
     * Clear all entries
     */
    clear(): void {
        this.store.clear();
    }

    /**
     * Clean up expired entries
     */
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now >= entry.resetTime) {
                this.store.delete(key);
            }
        }
    }
}

const rateLimitStore = new RateLimitStore();

// Periodic cleanup of expired entries
setInterval(() => {
    rateLimitStore.cleanup();
}, 60000); // Clean up every minute

/**
 * Get rate limit metadata from a method
 */
export function getRateLimitMetadata(method: object): RateLimitMetadata | undefined {
    return getMetadata<RateLimitMetadata>(method, SOCKETIO_RATE_LIMIT_KEY);
}

/**
 * Get rate limit key from context
 */
async function getRateLimitKey(ctx: Context, keyType: RateLimitKey): Promise<string> {
    if (typeof keyType === 'function') {
        return await keyType(ctx);
    }

    // Type assertion: ctx is actually SocketIOContext at runtime
    const socketCtx = ctx as any;
    const socket = socketCtx.socket as { id: string; handshake?: { address?: string }; userId?: string };

    switch (keyType) {
        case 'socket':
            return socket.id;
        case 'user':
            const userId = (ctx.state as any)?.user?.id || socket.userId;
            return userId || socket.id;
        case 'ip':
            const req = ctx.request as any;
            return req.ip || req.connection?.remoteAddress || socket.handshake?.address || 'unknown';
        default:
            return socket.id;
    }
}

/**
 * @RateLimit - Method decorator for rate limiting
 *
 * Limits the number of requests per time window for a method.
 *
 * @param options - Rate limit configuration
 *
 * @example
 * ```typescript
 * @SocketIOEvent({ event: 'chat' })
 * @RateLimit({ max: 10, window: '1m', key: 'socket' })
 * async handleChat(@Context() ctx: any) {
 *   // Maximum 10 requests per minute per socket
 * }
 * ```
 *
 * @example
 * ```typescript
 * @SocketIOEvent({ event: 'sendMessage' })
 * @RateLimit({ max: 100, window: 3600000, key: 'user' })
 * async sendMessage(@Context() ctx: any) {
 *   // Maximum 100 requests per hour per user
 * }
 * ```
 */
export function RateLimit(options?: RateLimitOptions): MethodDecorator {
    return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        const methodName = String(propertyKey);

        const metadata: RateLimitMetadata = {
            max: options?.max ?? 10,
            window: options?.window ?? 60000,
            key: options?.key ?? 'socket',
            message: options?.message ?? 'Rate limit exceeded',
            skip: options?.skip ?? false,
            methodName,
        };

        // Store metadata
        setMetadata(descriptor.value, SOCKETIO_RATE_LIMIT_KEY, metadata);
        RateLimitMetadataRegistry.set(target.constructor as Constructor, methodName, metadata);

        // Wrap the original method
        const originalMethod = descriptor.value;

        descriptor.value = async function (this: any, ...args: any[]) {
            const metadata = getRateLimitMetadata(originalMethod);
            if (!metadata || metadata.skip) {
                return originalMethod.apply(this, args);
            }

            const ctx = this as Context;

            try {
                // Get rate limit key
                const key = await getRateLimitKey(ctx, metadata.key ?? 'socket');
                const rateLimitKey = `${(target.constructor as Constructor).name}.${methodName}.${key}`;

                // Check rate limit
                const max = metadata.max ?? 10;
                const allowed = await rateLimitStore.check(rateLimitKey, max, metadata.window ?? 60000);

                if (!allowed) {
                    const remaining = rateLimitStore.getRemaining(rateLimitKey, max);
                    const resetTime = rateLimitStore.getResetTime(rateLimitKey);

                    const error = new Error(metadata.message);
                    (error as any).code = 'RATE_LIMIT_EXCEEDED';
                    (error as any).remaining = remaining;
                    (error as any).resetTime = resetTime;

                    ctx.socket?.emit('error', {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: metadata.message,
                        remaining,
                        resetTime,
                    });

                    throw error;
                }

                // Call original method
                return originalMethod.apply(this, args);
            } catch (err) {
                // Re-throw if it's a rate limit error
                if ((err as any).code === 'RATE_LIMIT_EXCEEDED') {
                    throw err;
                }
                // Otherwise, let the original error propagate
                throw err;
            }
        };

        return descriptor;
    };
}

/**
 * Get remaining requests for a key
 */
export function getRateLimitRemaining(className: string, methodName: string, key: string, max: number): number {
    return rateLimitStore.getRemaining(`${className}.${methodName}.${key}`, max);
}

/**
 * Clear all rate limit entries
 */
export function clearRateLimits(): void {
    rateLimitStore.clear();
}

