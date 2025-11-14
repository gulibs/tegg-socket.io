import type { Application } from 'egg';

export default (app: Application) => {
  // Use type assertion since TypeScript can't infer the loaded controller type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.io.of('/nstest').route('chat', app.io.controller.chat as any);
};

