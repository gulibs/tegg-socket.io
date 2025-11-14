import type { Context } from 'egg';
/**
 * Delegate socket methods and properties to Koa context
 * This allows accessing socket methods via ctx.socket.*
 */
export declare function delegateSocket(ctx: Context): void;
