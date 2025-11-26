import type { Context } from 'egg';
import { ConnectionMiddleware } from '../../../../../../src/index.js';

@ConnectionMiddleware({ priority: 20 })
export class AdminAuthMiddleware {
  async use(ctx: Context, next: () => Promise<void>) {
    // Check if user is admin
    if (ctx.state.user && ctx.state.user.token === 'admin-token') {
      ctx.state.isAdmin = true;
      await next();
    } else {
      ctx.socket.emit('error', 'Admin access required');
      ctx.socket.disconnect();
    }
  }
}

