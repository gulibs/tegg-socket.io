import type { Context } from 'egg';

export default () => {
  return async function(this: Context) {
    this.socket.emit('res', 'hello');
  };
};

