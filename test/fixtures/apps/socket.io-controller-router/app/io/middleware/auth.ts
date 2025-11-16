import type { Context } from 'egg';

export default () => {
  return async function auth(ctx: Context, next: () => Promise<void>) {
    ctx.socket.emit('auth-check', true);
    await next();
  };
};
