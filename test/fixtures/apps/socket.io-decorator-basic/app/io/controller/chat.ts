import type { Context } from 'egg';
import { SocketIOController, SocketIOEvent, Room, Broadcast, Subscribe } from '../../../../../../src/index.js';

@SocketIOController({
  namespace: '/',
  connectionMiddleware: ['auth'],
  packetMiddleware: ['log'],
})
export default class ChatController {
  ctx: Context;
  app: any;
  
  constructor(ctx: Context) {
    this.ctx = ctx;
    this.app = ctx.app;
  }

  /**
   * Basic event handler
   */
  @SocketIOEvent({ event: 'chat' })
  async handleChat() {
    const message = this.ctx.args![0];
    this.ctx.socket.emit('res', `Message: ${message}`);
  }

  /**
   * Event with @Room decorator - auto-join room
   */
  @SocketIOEvent({ event: 'joinRoom' })
  @Room({ name: 'lobby' })
  async joinRoom() {
    this.ctx.socket.emit('joined', 'Welcome to lobby');
  }

  /**
   * Event with @Room decorator - dynamic room name
   */
  @SocketIOEvent({ event: 'joinDynamicRoom' })
  @Room({ name: (ctx) => ctx.args![0] as string })
  async joinDynamicRoom() {
    const roomName = this.ctx.args![0];
    this.ctx.socket.emit('joined', `Welcome to ${roomName}`);
  }

  /**
   * Event with @Room decorator - auto-leave
   */
  @SocketIOEvent({ event: 'quickVisit' })
  @Room({ name: 'temporary', autoLeave: true })
  async quickVisit() {
    this.ctx.socket.emit('visiting', 'Quick visit to temporary room');
  }

  /**
   * Event with @Broadcast decorator
   */
  @SocketIOEvent({ event: 'broadcast' })
  @Broadcast({ to: 'lobby' })
  async broadcast() {
    const message = this.ctx.args![0];
    return { text: message, from: this.ctx.socket.id };
  }

  /**
   * Event with @Room and @Broadcast combined
   */
  @SocketIOEvent({ event: 'groupMessage' })
  @Room({ name: 'group' })
  @Broadcast({ to: 'group', event: 'newGroupMessage' })
  async groupMessage() {
    const message = this.ctx.args![0];
    return { text: message, from: this.ctx.socket.id, timestamp: Date.now() };
  }

  /**
   * Subscribe to disconnect event
   */
  @Subscribe({ event: 'disconnect' })
  async onDisconnect() {
    this.app.logger.info('User disconnected:', this.ctx.socket.id);
  }

  /**
   * Subscribe to error event
   */
  @Subscribe({ event: 'error' })
  async onError() {
    const error = this.ctx.args![0];
    this.app.logger.error('Socket error:', error);
  }
}

