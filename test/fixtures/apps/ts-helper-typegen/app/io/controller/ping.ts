import { Controller } from 'egg';

export default class PingController extends Controller {
  public async ping() {
    this.ctx.socket.emit('res', 'pong');
  }
}

