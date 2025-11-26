import type { Context } from 'egg';
import { ConnectionMiddleware } from '../../../../../../src/index.js';

@ConnectionMiddleware({ priority: 10 })
export class AuthMiddleware {
  async use(ctx: Context, next: () => Promise<void>) {
    const token = ctx.socket.handshake.query.token;

    if (!token) {
      ctx.socket.emit('error', 'Authentication required');
      ctx.socket.disconnect();
      return;
    }

    // Mock token verification
    ctx.state.user = { id: 'user123', name: 'Test User', token };

    await next();

    // Cleanup on disconnect
    ctx.logger.info('User disconnected and cleaned up:', ctx.state.user.id);
  }
}

