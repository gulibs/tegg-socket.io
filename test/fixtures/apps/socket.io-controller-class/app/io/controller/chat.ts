import type { Application } from 'egg';

export default (app: Application): new (ctx: any) => any => {
  class Controller extends app.Controller {
    ping() {
      this.ctx.socket.emit('res', 'hello');
    }

    async pingGenerator() {
      this.ctx.socket.emit('res', 'hello');
    }
  }
  return Controller;
};

