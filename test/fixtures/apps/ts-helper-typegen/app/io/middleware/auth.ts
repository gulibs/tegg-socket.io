import type { Application, Context } from 'egg';

export default (app: Application) => {
  return async (ctx: Context, next: () => Promise<void>) => {
    ctx.logger.info('[ts-helper-typegen] middleware invoked for %s', ctx.socket.id);
    await next();
    app.coreLogger.info('[ts-helper-typegen] middleware cleanup for %s', ctx.socket.id);
  };
};


