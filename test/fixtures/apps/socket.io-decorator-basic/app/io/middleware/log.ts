import type { Context } from 'egg';
import { PacketMiddleware } from '../../../../../../src/index.js';

@PacketMiddleware({ priority: 50 })
export class LogMiddleware {
  async use(ctx: Context, next: () => Promise<void>) {
    const start = Date.now();
    ctx.logger.info('Packet received:', ctx.packet);

    await next();

    const duration = Date.now() - start;
    ctx.logger.info('Packet processed in', duration, 'ms');
  }
}

