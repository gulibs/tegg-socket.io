import type { Context } from 'egg';

export default {
  ping: async function (this: Context) {
    this.socket.emit('res', 'hello');
  },
};

