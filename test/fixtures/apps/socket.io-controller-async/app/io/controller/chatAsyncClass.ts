import type { Application } from 'egg';

export default (app: Application): new (ctx: any) => any => {
  class Controller extends app.Controller {
    async ping() {
      this.ctx.socket.emit('res', 'hello');
    }
  }
  return Controller;
};

