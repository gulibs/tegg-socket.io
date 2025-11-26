import type { Context } from 'egg';
import { SocketIOController, SocketIOEvent } from '../../../../../../src/index.js';

@SocketIOController({
  namespace: '/admin',
  connectionMiddleware: ['auth', 'adminAuth'],
})
export default class AdminController {
  ctx: Context;
  app: any;

  constructor(ctx: Context) {
    this.ctx = ctx;
    this.app = ctx.app;
  }

  @SocketIOEvent({ event: 'adminMessage' })
  async handleAdminMessage() {
    const message = this.ctx.args![0];
    this.ctx.socket.emit('adminRes', `Admin: ${message}`);
  }

  @SocketIOEvent({ event: 'broadcast' })
  async broadcast() {
    const message = this.ctx.args![0];
    this.app.io.of('/admin').emit('announcement', message);
  }
}

